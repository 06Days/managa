"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { dateTimeInputToIso, toDateTimeInput } from "@/lib/format";
import type { Addiction, Relapse } from "@/lib/types";
import { Modal } from "./Modal";

export function RelapseFormModal({
  open,
  addiction,
  relapse,
  onClose,
  onSaved,
}: {
  open: boolean;
  addiction: Addiction | null;
  relapse?: Relapse | null;
  onClose: () => void;
  onSaved: (relapse: Relapse) => void;
}) {
  const [occurredAt, setOccurredAt] = useState("");
  const [notes, setNotes] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = useMemo(
    () => [...(addiction?.questions ?? [])].sort((a, b) => a.position - b.position),
    [addiction],
  );

  useEffect(() => {
    if (!open) return;
    setOccurredAt(
      toDateTimeInput(relapse?.occurredAt ?? new Date()),
    );
    setNotes(relapse?.notes ?? "");
    const nextAnswers: Record<number, string> = {};
    for (const answer of relapse?.answers ?? []) {
      if (answer.questionId !== null) {
        nextAnswers[answer.questionId] = answer.answer;
      }
    }
    setAnswers(nextAnswers);
    setSaving(false);
    setError(null);
  }, [open, relapse]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!addiction || saving) return;
    setSaving(true);
    setError(null);

    try {
      const payload = {
        occurredAt: dateTimeInputToIso(occurredAt),
        notes: notes.trim(),
        answers: questions.map((question) => ({
          questionId: question.id,
          answer: (answers[question.id] ?? "").trim(),
        })),
      };
      const saved = relapse
        ? await api.updateRelapse(addiction.id, relapse.id, payload)
        : await api.createRelapse(addiction.id, payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const maxDateTime = toDateTimeInput(new Date());
  const minDateTime = addiction
    ? toDateTimeInput(addiction.startedAt)
    : undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        relapse ? "Edit relapse" : `Log a relapse${addiction ? ` · ${addiction.name}` : ""}`
      }
      subtitle="A relapse resets the city. The old streak stays in your history."
      size="lg"
      dismissible={!saving}
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="relapse-form"
            className={`btn ${relapse ? "btn-primary" : "btn-danger"}`}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Saving…
              </>
            ) : relapse ? (
              "Save changes"
            ) : (
              "Log relapse"
            )}
          </button>
        </>
      }
    >
      <form
        id="relapse-form"
        className="d-flex flex-column gap-3"
        onSubmit={(event) => void submit(event)}
      >
        {error ? (
          <div className="alert alert-danger mb-0" role="alert">
            {error}
          </div>
        ) : null}

        <div className="alert alert-warning d-flex gap-2 mb-0" role="note">
          <i className="bi bi-exclamation-triangle-fill flex-shrink-0 mt-1" />
          <span>
            {relapse
              ? "Changing the date changes how the streaks are calculated."
              : "This starts a new city at Day 0. Be honest — the point is to learn from it, not to punish yourself."}
          </span>
        </div>

        <div>
          <label className="form-label" htmlFor="relapse-occurred">
            When did it happen?
          </label>
          <input
            id="relapse-occurred"
            type="datetime-local"
            className="form-control"
            value={occurredAt}
            max={maxDateTime}
            min={minDateTime}
            onChange={(event) => setOccurredAt(event.target.value)}
            required
          />
        </div>

        {questions.length > 0 ? (
          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-items-center gap-2">
              <h3 className="h6 mb-0">Your questions</h3>
              <span className="badge text-bg-light border">
                {questions.length}
              </span>
            </div>
            {questions.map((question) => (
              <div key={question.id}>
                <label
                  className="form-label"
                  htmlFor={`answer-${question.id}`}
                >
                  {question.prompt}
                  {question.required ? (
                    <span className="text-danger ms-1">*</span>
                  ) : null}
                </label>

                {question.type === "text" ? (
                  <textarea
                    id={`answer-${question.id}`}
                    className="form-control"
                    rows={2}
                    value={answers[question.id] ?? ""}
                    onChange={(event) =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: event.target.value,
                      }))
                    }
                    required={question.required}
                    maxLength={2000}
                  />
                ) : null}

                {question.type === "number" ? (
                  <input
                    id={`answer-${question.id}`}
                    type="number"
                    className="form-control"
                    value={answers[question.id] ?? ""}
                    onChange={(event) =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: event.target.value,
                      }))
                    }
                    required={question.required}
                  />
                ) : null}

                {question.type === "boolean" ? (
                  <select
                    id={`answer-${question.id}`}
                    className="form-select"
                    value={answers[question.id] ?? ""}
                    onChange={(event) =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: event.target.value,
                      }))
                    }
                    required={question.required}
                  >
                    <option value="">Choose…</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                ) : null}

                {question.type === "scale" ? (
                  <select
                    id={`answer-${question.id}`}
                    className="form-select"
                    value={answers[question.id] ?? ""}
                    onChange={(event) =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: event.target.value,
                      }))
                    }
                    required={question.required}
                  >
                    <option value="">Choose 1–10…</option>
                    {Array.from({ length: 10 }, (_, index) => index + 1).map(
                      (value) => (
                        <option key={value} value={String(value)}>
                          {value}
                        </option>
                      ),
                    )}
                  </select>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-info mb-0">
            <i className="bi bi-info-circle me-2" />
            This addiction has no custom questions yet. You can add some when
            you edit it.
          </div>
        )}

        <div>
          <label className="form-label" htmlFor="relapse-notes">
            Notes <span className="text-secondary fw-normal">(optional)</span>
          </label>
          <textarea
            id="relapse-notes"
            className="form-control"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="What happened, what you were feeling, what you will try next time…"
            maxLength={4000}
          />
        </div>
      </form>
    </Modal>
  );
}
