"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AddictionFormModal } from "@/app/components/AddictionFormModal";
import { CitySkyline } from "@/app/components/CitySkyline";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { RelapseFormModal } from "@/app/components/RelapseFormModal";
import { api } from "@/lib/api";
import {
  DAY_MS,
  formatDate,
  formatDateTime,
  formatDays,
  formatDuration,
  milestoneFor,
} from "@/lib/format";
import type { Addiction, Relapse } from "@/lib/types";

export default function AddictionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const [addiction, setAddiction] = useState<Addiction | null>(null);
  const [relapses, setRelapses] = useState<Relapse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const [editOpen, setEditOpen] = useState(false);
  const [relapseOpen, setRelapseOpen] = useState(false);
  const [editingRelapse, setEditingRelapse] = useState<Relapse | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRelapseTarget, setDeleteRelapseTarget] =
    useState<Relapse | null>(null);

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) {
      setError("This addiction id is not valid.");
      setLoading(false);
      return;
    }

    try {
      const [nextAddiction, nextRelapses] = await Promise.all([
        api.getAddiction(id),
        api.listRelapses(id),
      ]);
      setAddiction(nextAddiction);
      setRelapses(nextRelapses);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const currentMs = addiction
    ? Math.max(
        0,
        now - new Date(addiction.stats.currentStreakStartedAt).getTime(),
      )
    : 0;
  const bestMs = addiction
    ? Math.max(addiction.stats.bestStreakMs, currentMs)
    : 0;
  const cityDays = currentMs / DAY_MS;
  const stage = milestoneFor(cityDays);

  const cleanBefore = useMemo(() => {
    if (!addiction) return new Map<number, number>();
    const result = new Map<number, number>();
    let previous = new Date(addiction.startedAt).getTime();
    for (const relapse of [...relapses].sort(
      (a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt),
    )) {
      const at = Date.parse(relapse.occurredAt);
      result.set(relapse.id, Math.max(0, at - previous));
      previous = at;
    }
    return result;
  }, [addiction, relapses]);

  const sortedRelapses = useMemo(
    () =>
      [...relapses].sort(
        (a, b) =>
          Date.parse(b.occurredAt) - Date.parse(a.occurredAt) || b.id - a.id,
      ),
    [relapses],
  );

  if (loading) {
    return (
      <div className="container py-5">
        <div className="placeholder-glow">
          <p className="placeholder col-3" />
          <div className="card border-0 shadow-sm">
            <div className="card-body p-5">
              <p className="placeholder col-5 fs-1" />
              <p className="placeholder col-8" />
              <div className="city-frame mt-4">
                <div style={{ height: "14rem" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !addiction) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger d-flex flex-wrap align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill" />
          <span className="flex-grow-1">
            Could not load this addiction: {error ?? "not found"}
          </span>
          <Link className="btn btn-sm btn-outline-danger" href="/">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4 py-lg-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <Link className="btn btn-sm btn-outline-secondary" href="/">
          <i className="bi bi-arrow-left me-1" />
          Dashboard
        </Link>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => setEditOpen(true)}
          >
            <i className="bi bi-pencil me-1" />
            Edit addiction
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => setDeleteOpen(true)}
          >
            <i className="bi bi-trash3 me-1" />
            Delete
          </button>
        </div>
      </div>

      <section className="card border-0 shadow-sm overflow-hidden mb-4">
        <div className="card-body p-4 p-lg-5">
          <div className="row g-4 align-items-center">
            <div className="col-lg-5">
              <div className="d-flex align-items-start gap-3 mb-3">
                <div
                  className="addiction-icon addiction-icon-lg"
                  style={{
                    backgroundColor: `${addiction.color}1f`,
                    color: addiction.color,
                  }}
                  aria-hidden="true"
                >
                  {addiction.icon || "🌱"}
                </div>
                <div className="min-w-0">
                  <h1 className="h2 mb-1">{addiction.name}</h1>
                  <p className="text-secondary mb-2">
                    {addiction.description || "No description yet."}
                  </p>
                  <div className="d-flex flex-wrap gap-2">
                    <span className="badge text-bg-success rounded-pill">
                      Day {Math.floor(cityDays)}
                    </span>
                    <span className="badge text-bg-light border rounded-pill">
                      <i className="bi bi-buildings me-1" />
                      {stage.stage}
                    </span>
                    <span className="badge text-bg-light border rounded-pill">
                      Started {formatDate(addiction.startedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    setEditingRelapse(null);
                    setRelapseOpen(true);
                  }}
                >
                  <i className="bi bi-arrow-counterclockwise me-2" />
                  Log a relapse
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => setEditOpen(true)}
                >
                  <i className="bi bi-sliders me-2" />
                  Edit city & questions
                </button>
              </div>
            </div>

            <div className="col-lg-7">
              <CitySkyline
                days={cityDays}
                seed={`${addiction.id}-${addiction.name}`}
                accent={addiction.color}
                large
              />
            </div>
          </div>

          <div className="row row-cols-2 row-cols-lg-4 g-3 mt-1">
            <div className="col">
              <div className="stat-tile">
                <div className="stat-value text-success">
                  {formatDuration(currentMs)}
                </div>
                <div className="stat-label">Current streak</div>
              </div>
            </div>
            <div className="col">
              <div className="stat-tile">
                <div className="stat-value">{formatDays(bestMs)}</div>
                <div className="stat-label">Best streak</div>
              </div>
            </div>
            <div className="col">
              <div className="stat-tile">
                <div className="stat-value text-danger">
                  {addiction.stats.totalRelapses}
                </div>
                <div className="stat-label">Relapses logged</div>
              </div>
            </div>
            <div className="col">
              <div className="stat-tile">
                <div className="stat-value">
                  {Math.floor(addiction.stats.totalCleanMs / DAY_MS)}
                </div>
                <div className="stat-label">Total clean days</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="row g-4">
        <div className="col-lg-4">
          <section className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <div>
                <h2 className="h5 mb-0">Your questions</h2>
                <div className="small text-secondary">
                  Asked with every relapse
                </div>
              </div>
              <span className="badge text-bg-light border">
                {addiction.questions.length}
              </span>
            </div>
            <div className="card-body p-0">
              {addiction.questions.length === 0 ? (
                <div className="p-4 text-secondary">
                  <p className="mb-2">
                    No custom questions yet. Relapses still keep your notes.
                  </p>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setEditOpen(true)}
                  >
                    <i className="bi bi-plus-lg me-1" />
                    Add questions
                  </button>
                </div>
              ) : (
                <ol className="list-group list-group-flush">
                  {addiction.questions.map((question, index) => (
                    <li
                      className="list-group-item d-flex align-items-start gap-2"
                      key={question.id}
                    >
                      <span className="badge text-bg-light border mt-1">
                        {index + 1}
                      </span>
                      <div className="flex-grow-1 min-w-0">
                        <div className="small">{question.prompt}</div>
                        <div className="d-flex flex-wrap gap-1 mt-1">
                          <span className="badge text-bg-light border text-capitalize">
                            {question.type}
                          </span>
                          {question.required ? (
                            <span className="badge text-bg-warning">
                              Required
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>
        </div>

        <div className="col-lg-8">
          <section>
            <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
              <div>
                <h2 className="h4 mb-1">Relapse history</h2>
                <p className="text-secondary mb-0">
                  Each entry shows how long the city stood before it reset.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => {
                  setEditingRelapse(null);
                  setRelapseOpen(true);
                }}
              >
                <i className="bi bi-plus-lg me-1" />
                Log relapse
              </button>
            </div>

            {sortedRelapses.length === 0 ? (
              <div className="empty-state">
                <div className="addiction-icon mx-auto mb-3 bg-success-subtle text-success">
                  <i className="bi bi-shield-check" />
                </div>
                <h3 className="h5">No relapses logged</h3>
                <p className="text-secondary mb-3">
                  Your city is still unbroken. If one happens, log it honestly
                  and keep the lesson.
                </p>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => {
                    setEditingRelapse(null);
                    setRelapseOpen(true);
                  }}
                >
                  Log a relapse
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {sortedRelapses.map((relapse) => {
                  const before = cleanBefore.get(relapse.id) ?? 0;
                  return (
                    <article className="card relapse-card shadow-sm" key={relapse.id}>
                      <div className="card-body">
                        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                          <div>
                            <div className="fw-semibold">
                              {formatDateTime(relapse.occurredAt)}
                            </div>
                            <div className="small text-secondary">
                              <i className="bi bi-hourglass-split me-1" />
                              City stood for {formatDuration(before)} before
                              this relapse
                            </div>
                          </div>
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() => {
                                setEditingRelapse(relapse);
                                setRelapseOpen(true);
                              }}
                              aria-label="Edit relapse"
                            >
                              <i className="bi bi-pencil" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => setDeleteRelapseTarget(relapse)}
                              aria-label="Delete relapse"
                            >
                              <i className="bi bi-trash3" />
                            </button>
                          </div>
                        </div>

                        {relapse.notes ? (
                          <p className="mb-2 mt-3">{relapse.notes}</p>
                        ) : null}

                        {relapse.answers.length > 0 ? (
                          <dl className="row answer-list mb-0 mt-3">
                            {relapse.answers.map((answer, index) => (
                              <div className="col-12" key={`${relapse.id}-${index}`}>
                                <dt>{answer.prompt}</dt>
                                <dd>{answer.answer}</dd>
                              </div>
                            ))}
                          </dl>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      <AddictionFormModal
        open={editOpen}
        addiction={addiction}
        onClose={() => setEditOpen(false)}
        onSaved={(saved) => {
          setAddiction(saved);
          void load();
        }}
      />

      <RelapseFormModal
        open={relapseOpen}
        addiction={addiction}
        relapse={editingRelapse}
        onClose={() => {
          setRelapseOpen(false);
          setEditingRelapse(null);
        }}
        onSaved={() => {
          void load();
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this addiction?"
        message={`This removes ${addiction.name}, its custom questions and all ${addiction.stats.totalRelapses} relapse entries. This cannot be undone.`}
        confirmLabel="Delete addiction"
        danger
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await api.deleteAddiction(addiction.id);
          router.push("/");
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteRelapseTarget)}
        title="Delete this relapse?"
        message="The city streak will be recalculated without this entry. This cannot be undone."
        confirmLabel="Delete relapse"
        danger
        onClose={() => setDeleteRelapseTarget(null)}
        onConfirm={async () => {
          if (deleteRelapseTarget) {
            await api.deleteRelapse(addiction.id, deleteRelapseTarget.id);
            await load();
          }
        }}
      />
    </div>
  );
}
