"use client";

import { useEffect, useRef, useState } from "react";
import { Job } from "@/lib/types";
import { Icon } from "./Icons";

const terminalStatuses = new Set(["succeeded", "failed"]);

export function JobProgress({
  job,
  compact = false,
  onDismiss,
}: {
  job: Job;
  compact?: boolean;
  onDismiss?: () => void;
}) {
  const [showLogs, setShowLogs] = useState(!compact);
  const logRef = useRef<HTMLPreElement>(null);
  const terminal = terminalStatuses.has(job.status);
  const succeeded = job.status === "succeeded";
  const failed = job.status === "failed";

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [job.logs.length, showLogs]);

  return (
    <div className="border rounded-3 p-3 d-flex flex-column gap-3">
      <div className="d-flex align-items-start gap-2">
        <span
          className={`job-state text-bg-${
            succeeded ? "success" : failed ? "danger" : "primary"
          }`}
        >
          {succeeded ? (
            <Icon name="check" size={18} />
          ) : failed ? (
            <Icon name="alert" size={18} />
          ) : (
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          )}
        </span>
        <div className="flex-grow-1 min-w-0">
          <strong className="d-block text-truncate">{job.title}</strong>
          <p className="small text-secondary mb-0 text-break">{job.message}</p>
        </div>
        {terminal && onDismiss ? (
          <button
            type="button"
            className="btn-close"
            onClick={onDismiss}
            aria-label="Dismiss"
          />
        ) : null}
      </div>

      <div className="progress" style={{ height: "0.4rem" }} aria-hidden="true">
        <div
          className={`progress-bar${
            succeeded
              ? " bg-success"
              : failed
                ? " bg-danger"
                : " progress-bar-striped progress-bar-animated"
          }`}
          style={{ width: `${Math.max(2, job.progress)}%` }}
        />
      </div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 small">
        <span className="font-monospace text-secondary">
          {job.type} · {job.progress}%
        </span>
        <button
          type="button"
          className="btn btn-link btn-sm p-0 d-inline-flex align-items-center gap-1"
          onClick={() => setShowLogs((value) => !value)}
          aria-expanded={showLogs}
        >
          <Icon name="terminal" size={14} />
          {showLogs ? "Hide output" : "Show output"}
        </button>
      </div>

      {showLogs ? (
        <pre className="job-logs" ref={logRef}>
          {job.logs.length > 0 ? job.logs.join("\n") : "Waiting for output…"}
        </pre>
      ) : null}
    </div>
  );
}
