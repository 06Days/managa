"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AddictionCard } from "./components/AddictionCard";
import { AddictionFormModal } from "./components/AddictionFormModal";
import { RelapseFormModal } from "./components/RelapseFormModal";
import { api } from "@/lib/api";
import {
  DAY_MS,
  formatDays,
  formatNumber,
  MILESTONES,
} from "@/lib/format";
import type { Addiction } from "@/lib/types";

export default function HomePage() {
  const [addictions, setAddictions] = useState<Addiction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [addOpen, setAddOpen] = useState(false);
  const [relapseTarget, setRelapseTarget] = useState<Addiction | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.listAddictions();
      setAddictions(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const summary = useMemo(() => {
    let longest = 0;
    let cleanMs = 0;
    let relapses = 0;

    for (const addiction of addictions) {
      const current = Math.max(
        0,
        now - new Date(addiction.stats.currentStreakStartedAt).getTime(),
      );
      longest = Math.max(longest, current);
      cleanMs += current;
      relapses += addiction.stats.totalRelapses;
    }

    return {
      count: addictions.length,
      longest,
      cleanDays: Math.floor(cleanMs / DAY_MS),
      relapses,
    };
  }, [addictions, now]);

  return (
    <div className="container py-4 py-lg-5">
      <section className="quita-hero rounded-4 p-4 p-lg-5 mb-4 shadow-sm">
        <div className="row align-items-center g-4">
          <div className="col-lg-8">
            <span className="badge rounded-pill text-bg-light border mb-2">
              <i className="bi bi-stars text-warning me-1" />
              Your recovery, in bricks and windows
            </span>
            <h1 className="display-6 fw-bold mb-3">
              Build a city, one clean day at a time.
            </h1>
            <p className="lead text-secondary mb-0">
              Track each addiction, answer your own reflection questions when a
              relapse happens, and watch a city grow in the time between them.
              Every clean day adds a street, a floor, a light.
            </p>
          </div>
          <div className="col-lg-4 d-flex flex-column gap-2 align-items-lg-end">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => setAddOpen(true)}
            >
              <i className="bi bi-plus-lg me-2" />
              Add an addiction
            </button>
            <span className="small text-secondary text-lg-end">
              Private to this app · stored in your Quita database
            </span>
          </div>
        </div>
      </section>

      <section className="row row-cols-2 row-cols-lg-4 g-3 mb-4" aria-label="Summary">
        <div className="col">
          <div className="stat-tile">
            <div className="stat-value">{formatNumber(summary.count)}</div>
            <div className="stat-label">Addictions</div>
          </div>
        </div>
        <div className="col">
          <div className="stat-tile">
            <div className="stat-value text-success">
              {formatDays(summary.longest)}
            </div>
            <div className="stat-label">Longest current streak</div>
          </div>
        </div>
        <div className="col">
          <div className="stat-tile">
            <div className="stat-value text-primary">
              {formatNumber(summary.cleanDays)}
            </div>
            <div className="stat-label">Clean days in progress</div>
          </div>
        </div>
        <div className="col">
          <div className="stat-tile">
            <div className="stat-value text-danger">
              {formatNumber(summary.relapses)}
            </div>
            <div className="stat-label">Relapses logged</div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="alert alert-danger d-flex flex-wrap align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-triangle-fill" />
          <span className="flex-grow-1">
            Could not reach the Quita API: {error}
          </span>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={() => {
              setLoading(true);
              void load();
            }}
          >
            <i className="bi bi-arrow-clockwise me-1" />
            Retry
          </button>
        </div>
      ) : null}

      <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
        <div>
          <h2 className="h3 mb-1">Your cities</h2>
          <p className="text-secondary mb-0">
            Each card grows with the time since that addiction&apos;s last
            relapse.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={() => setAddOpen(true)}
        >
          <i className="bi bi-plus-lg me-1" />
          New addiction
        </button>
      </div>

      {loading ? (
        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
          {[0, 1, 2].map((index) => (
            <div className="col" key={index}>
              <div className="card addiction-card h-100">
                <div className="card-body">
                  <h5 className="placeholder-glow">
                    <span className="placeholder col-6" />
                  </h5>
                  <div className="city-frame mb-3">
                    <div style={{ height: "9rem" }} />
                  </div>
                  <p className="placeholder-glow mb-0">
                    <span className="placeholder col-12" />
                    <span className="placeholder col-8" />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : addictions.length === 0 ? (
        <div className="empty-state">
          <div className="addiction-icon mx-auto mb-3 bg-primary-subtle text-primary">
            <i className="bi bi-buildings" />
          </div>
          <h2 className="h4">Your first city is waiting</h2>
          <p className="text-secondary mx-auto" style={{ maxWidth: "32rem" }}>
            Add an addiction to start tracking clean time. Add your own
            questions so each relapse teaches you something.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setAddOpen(true)}
          >
            <i className="bi bi-plus-lg me-2" />
            Add your first addiction
          </button>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-4">
          {addictions.map((addiction) => (
            <div className="col" key={addiction.id}>
              <AddictionCard
                addiction={addiction}
                now={now}
                onLogRelapse={setRelapseTarget}
              />
            </div>
          ))}
        </div>
      )}

      <section className="card border-0 shadow-sm mt-4">
        <div className="card-body p-4">
          <div className="row g-4 align-items-center">
            <div className="col-lg-5">
              <h2 className="h5">How the city grows</h2>
              <p className="text-secondary mb-0">
                Clean time unlocks new blocks. A relapse starts a new city, but
                your best streak and full history stay with you.
              </p>
            </div>
            <div className="col-lg-7">
              <div className="d-flex flex-wrap gap-2">
                {MILESTONES.filter((milestone) =>
                  [1, 7, 30, 90, 365].includes(milestone.day),
                ).map((milestone) => (
                  <span
                    className="badge text-bg-light border px-3 py-2"
                    key={milestone.day}
                  >
                    <i className="bi bi-buildings me-1 text-primary" />
                    {milestone.day}d · {milestone.stage}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <AddictionFormModal
        open={addOpen}
        addiction={null}
        onClose={() => setAddOpen(false)}
        onSaved={() => {
          void load();
        }}
      />

      <RelapseFormModal
        open={Boolean(relapseTarget)}
        addiction={relapseTarget}
        onClose={() => setRelapseTarget(null)}
        onSaved={() => {
          void load();
        }}
      />
    </div>
  );
}
