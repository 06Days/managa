"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useJob } from "@/hooks/useJob";
import { api } from "@/lib/api";
import { Job } from "@/lib/types";
import { Icon } from "./Icons";
import { JobProgress } from "./JobProgress";

export function InstallForm({
  initialUrl = "",
  onInstalled,
}: {
  initialUrl?: string;
  onInstalled?: (job: Job) => void;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [ref, setRef] = useState("");
  const [start, setStart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [installed, setInstalled] = useState(false);

  const { job, pollError, track, clear } = useJob((finished) => {
    if (finished.status === "succeeded") {
      setInstalled(true);
      onInstalled?.(finished);
    }
  });

  const running =
    Boolean(job) && (job?.status === "queued" || job?.status === "running");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!url.trim() || running) return;

    setSubmitting(true);
    setFormError(null);
    setInstalled(false);
    try {
      const created = await api.install({
        url: url.trim(),
        ref: ref.trim() || undefined,
        start,
      });
      track(created);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setUrl("");
    setRef("");
    setStart(false);
    setInstalled(false);
    setFormError(null);
    clear();
  };

  return (
    <form className="d-flex flex-column gap-3" onSubmit={(event) => void submit(event)}>
      <div>
        <label className="form-label" htmlFor="install-url">
          GitHub repository
        </label>
        <input
          id="install-url"
          className="form-control font-monospace"
          type="text"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://github.com/owner/repo"
          autoFocus
          disabled={running}
          spellCheck={false}
        />
        <div className="form-text">
          HTTPS, SSH or <code>owner/repo</code> shorthand. Append{" "}
          <code>#branch</code> to install a specific ref.
        </div>
      </div>

      <div>
        <label className="form-label" htmlFor="install-ref">
          Branch or tag <span className="text-secondary fw-normal">(optional)</span>
        </label>
        <input
          id="install-ref"
          className="form-control font-monospace"
          type="text"
          value={ref}
          onChange={(event) => setRef(event.target.value)}
          placeholder="main"
          disabled={running}
          spellCheck={false}
        />
      </div>

      <div className="form-check">
        <input
          id="install-start"
          className="form-check-input"
          type="checkbox"
          checked={start}
          onChange={(event) => setStart(event.target.checked)}
          disabled={running}
        />
        <label className="form-check-label" htmlFor="install-start">
          Start the app as soon as it finishes installing
        </label>
      </div>

      <div className="alert alert-info d-flex gap-2 small mb-0" role="note">
        <Icon name="sparkles" size={16} className="flex-shrink-0 mt-1" />
        <span>
          The repository must contain a <code>managa.app.json</code> manifest at
          its root. Installing runs the repository&apos;s install and build
          commands, so only install apps you trust.
        </span>
      </div>

      {formError ? (
        <div className="alert alert-danger mb-0" role="alert">
          {formError}
        </div>
      ) : null}
      {pollError ? (
        <div className="alert alert-danger mb-0" role="alert">
          {pollError}
        </div>
      ) : null}

      <div className="d-flex flex-wrap gap-2">
        <button
          type="submit"
          className="btn btn-primary d-inline-flex align-items-center gap-2"
          disabled={!url.trim() || running || submitting}
        >
          {running || submitting ? (
            <>
              <span className="spinner-border spinner-border-sm" />
              Installing…
            </>
          ) : (
            <>
              <Icon name="github" size={17} />
              Install from GitHub
            </>
          )}
        </button>
      </div>

      {job ? <JobProgress job={job} /> : null}

      {installed ? (
        <div className="alert alert-success d-flex flex-wrap align-items-center gap-2 mb-0">
          <Icon name="check" size={17} />
          <span>
            App installed. Turn it on from the dashboard, or{" "}
            <Link className="alert-link" href="/">
              open the dashboard
            </Link>
            .
          </span>
          <button
            type="button"
            className="btn btn-link btn-sm p-0 ms-auto"
            onClick={reset}
          >
            Install another
          </button>
        </div>
      ) : null}
    </form>
  );
}
