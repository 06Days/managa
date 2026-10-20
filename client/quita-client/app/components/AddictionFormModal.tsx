"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  dateInputToIso,
  toDateInput,
} from "@/lib/format";
import type { Addiction, QuestionInput, QuestionType } from "@/lib/types";
import { Modal } from "./Modal";

interface QuestionDraft {
  key: string;
  id?: number;
  prompt: string;
  type: QuestionType;
  required: boolean;
}

const ICONS = ["🌱", "🚭", "🍷", "🎲", "🍬", "💊", "📱", "🛑", "🧠", "❤️", "☕", "🏃"];

const PRESETS: { prompt: string; type: QuestionType }[] = [
  { prompt: "What triggered this relapse?", type: "text" },
  { prompt: "How were you feeling beforehand?", type: "text" },
  { prompt: "How strong was the urge? (1–10)", type: "scale" },
  { prompt: "Did you reach out for support?", type: "boolean" },
];

function draftKey(): string {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyQuestion(): QuestionDraft {
  return {
    key: draftKey(),
    prompt: "",
    type: "text",
    required: false,
  };
}

export function AddictionFormModal({
  open,
  addiction,
  onClose,
  onSaved,
}: {
  open: boolean;
  addiction: Addiction | null;
  onClose: () => void;
  onSaved: (addiction: Addiction) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("🌱");
  const [color, setColor] = useState("#0d6efd");
  const [startedAt, setStartedAt] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(addiction?.name ?? "");
    setDescription(addiction?.description ?? "");
    setIcon(addiction?.icon ?? "🌱");
    setColor(addiction?.color ?? "#0d6efd");
    setStartedAt(
      toDateInput(addiction?.startedAt ?? new Date().toISOString()),
    );
    setQuestions(
      addiction?.questions.map((question) => ({
        key: `q-${question.id}`,
        id: question.id,
        prompt: question.prompt,
        type: question.type,
        required: question.required,
      })) ?? [],
    );
    setSaving(false);
    setError(null);
  }, [open, addiction]);

  const updateQuestion = (key: string, patch: Partial<QuestionDraft>) => {
    setQuestions((current) =>
      current.map((question) =>
        question.key === key ? { ...question, ...patch } : question,
      ),
    );
  };

  const addPreset = (preset: (typeof PRESETS)[number]) => {
    setQuestions((current) => {
      if (
        current.some(
          (question) =>
            question.prompt.trim().toLowerCase() === preset.prompt.toLowerCase(),
        )
      ) {
        return current;
      }
      return [
        ...current,
        {
          key: draftKey(),
          prompt: preset.prompt,
          type: preset.type,
          required: false,
        },
      ];
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);

    const questionPayload: QuestionInput[] = questions
      .filter((question) => question.prompt.trim())
      .map((question) => ({
        ...(question.id ? { id: question.id } : {}),
        prompt: question.prompt.trim(),
        type: question.type,
        required: question.required,
      }));

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        icon: icon.trim() || "🌱",
        color,
        startedAt: dateInputToIso(startedAt),
        questions: questionPayload,
      };
      const saved = addiction
        ? await api.updateAddiction(addiction.id, payload)
        : await api.createAddiction(payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const today = toDateInput(new Date().toISOString());

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={addiction ? `Edit ${addiction.name}` : "Add an addiction"}
      subtitle="Give it a name, a colour and the questions you want to answer when you log a relapse."
      size="xl"
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
            form="addiction-form"
            className="btn btn-primary"
            disabled={saving || !name.trim()}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Saving…
              </>
            ) : addiction ? (
              "Save changes"
            ) : (
              "Create addiction"
            )}
          </button>
        </>
      }
    >
      <form
        id="addiction-form"
        className="d-flex flex-column gap-3"
        onSubmit={(event) => void submit(event)}
      >
        {error ? (
          <div className="alert alert-danger mb-0" role="alert">
            {error}
          </div>
        ) : null}

        <div className="row g-3">
          <div className="col-md-8">
            <label className="form-label" htmlFor="addiction-name">
              Name
            </label>
            <input
              id="addiction-name"
              className="form-control"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Alcohol, nicotine, doomscrolling…"
              maxLength={120}
              required
              autoFocus
            />
          </div>
          <div className="col-md-4">
            <label className="form-label" htmlFor="addiction-started">
              Quitting since
            </label>
            <input
              id="addiction-started"
              type="date"
              className="form-control"
              value={startedAt}
              max={today}
              onChange={(event) => setStartedAt(event.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="form-label" htmlFor="addiction-description">
            Description <span className="text-secondary fw-normal">(optional)</span>
          </label>
          <textarea
            id="addiction-description"
            className="form-control"
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Why this matters to you, or what you want to remember."
            maxLength={1000}
          />
        </div>

        <div className="row g-3 align-items-end">
          <div className="col-sm-6 col-md-4">
            <label className="form-label" htmlFor="addiction-icon">
              Icon
            </label>
            <input
              id="addiction-icon"
              className="form-control"
              value={icon}
              onChange={(event) => setIcon(event.target.value)}
              maxLength={8}
            />
            <div className="d-flex flex-wrap gap-1 mt-2">
              {ICONS.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={`btn btn-sm ${
                    icon === choice ? "btn-primary" : "btn-outline-secondary"
                  }`}
                  onClick={() => setIcon(choice)}
                  aria-label={`Use ${choice} as the icon`}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
          <div className="col-sm-6 col-md-3">
            <label className="form-label" htmlFor="addiction-color">
              City colour
            </label>
            <input
              id="addiction-color"
              type="color"
              className="form-control form-control-color w-100"
              value={color}
              onChange={(event) => setColor(event.target.value)}
            />
          </div>
          <div className="col-md-5">
            <div className="small text-secondary">
              This colour is used for the buildings in your city. Each clean day
              adds streets, floors and lights.
            </div>
          </div>
        </div>

        <hr className="my-1" />

        <div>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
            <div>
              <h3 className="h6 mb-0">Custom questions</h3>
              <p className="small text-secondary mb-0">
                These are shown when you log a relapse. Answers are saved with
                that relapse.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() =>
                setQuestions((current) => [...current, emptyQuestion()])
              }
            >
              <i className="bi bi-plus-lg me-1" />
              Add question
            </button>
          </div>

          <div className="d-flex flex-wrap gap-2 mb-3">
            {PRESETS.map((preset) => (
              <button
                key={preset.prompt}
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => addPreset(preset)}
              >
                + {preset.prompt}
              </button>
            ))}
          </div>

          {questions.length === 0 ? (
            <div className="empty-state py-4">
              <p className="text-secondary mb-0">
                No custom questions yet. You can still log relapses with notes.
              </p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              {questions.map((question, index) => (
                <div className="question-row" key={question.key}>
                  <div className="row g-2 align-items-center">
                    <div className="col-12 col-md">
                      <input
                        className="form-control form-control-sm"
                        value={question.prompt}
                        onChange={(event) =>
                          updateQuestion(question.key, {
                            prompt: event.target.value,
                          })
                        }
                        placeholder={`Question ${index + 1}`}
                        aria-label={`Question ${index + 1}`}
                        maxLength={500}
                      />
                    </div>
                    <div className="col-5 col-md-3">
                      <select
                        className="form-select form-select-sm"
                        value={question.type}
                        onChange={(event) =>
                          updateQuestion(question.key, {
                            type: event.target.value as QuestionType,
                          })
                        }
                        aria-label={`Answer type for question ${index + 1}`}
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="boolean">Yes / no</option>
                        <option value="scale">Scale 1–10</option>
                      </select>
                    </div>
                    <div className="col-5 col-md-2">
                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id={`question-required-${question.key}`}
                          checked={question.required}
                          onChange={(event) =>
                            updateQuestion(question.key, {
                              required: event.target.checked,
                            })
                          }
                        />
                        <label
                          className="form-check-label small"
                          htmlFor={`question-required-${question.key}`}
                        >
                          Required
                        </label>
                      </div>
                    </div>
                    <div className="col-2 col-md-auto text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() =>
                          setQuestions((current) =>
                            current.filter(
                              (item) => item.key !== question.key,
                            ),
                          )
                        }
                        aria-label={`Remove question ${index + 1}`}
                      >
                        <i className="bi bi-trash3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}
