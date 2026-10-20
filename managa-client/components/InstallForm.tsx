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
    <form className="install-form" onSubmit={(event) => void submit(event)}>
      <label className="field">
        <span>GitHub repository</span>
        <input
          type="text"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://github.com/owner/repo"
          autoFocus
          disabled={running}
          spellCheck={false}
        />
        <small>
          HTTPS, SSH or <code>owner/repo</code> shorthand. Append{" "}
          <code>#branch</code> to install a specific ref.
        </small>
      </label>

      <label className="field">
        <span>
          Branch or tag <em>optional</em>
        </span>
        <input
          type="text"
          value={ref}
          onChange={(event) => setRef(event.target.value)}
          placeholder="main"
          disabled={running}
          spellCheck={false}
        />
      </label>

      <label className="checkline">
        <input
          type="checkbox"
          checked={start}
          onChange={(event) => setStart(event.target.checked)}
          disabled={running}
        />
        Start the app as soon as it finishes installing
      </label>

      <div className="notice notice-info">
        <Icon name="sparkles" size={16} />
        <span>
          The repository must contain a <code>managa.app.json</code> manifest at
          its root. Installing runs the repository&apos;s install and build
          commands, so only install apps you trust.
        </span>
      </div>

      {formError ? <div className="notice notice-error">{formError}</div> : null}
      {pollError ? <div className="notice notice-error">{pollError}</div> : null}

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!url.trim() || running || submitting}
        >
          {running || submitting ? (
            <>
              <span className="spinner spinner-sm" />
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
        <div className="notice notice-success">
          <Icon name="check" size={17} />
          <span>
            App installed. Turn it on from the dashboard, or{" "}
            <Link href="/">open the dashboard</Link>.
          </span>
          <button type="button" className="link-btn" onClick={reset}>
            Install another
          </button>
        </div>
      ) : null}
    </form>
  );
}
