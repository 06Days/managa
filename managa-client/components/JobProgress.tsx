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

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [job.logs.length, showLogs]);

  return (
    <div className={`job job-${job.status}`}>
      <div className="job-head">
        <span className="job-state">
          {job.status === "succeeded" ? (
            <Icon name="check" size={20} />
          ) : job.status === "failed" ? (
            <Icon name="alert" size={20} />
          ) : (
            <span className="spinner" aria-hidden="true" />
          )}
        </span>
        <div className="job-copy">
          <strong>{job.title}</strong>
          <p>{job.message}</p>
        </div>
        {terminal && onDismiss ? (
          <button
            type="button"
            className="icon-btn"
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            <Icon name="x" size={16} />
          </button>
        ) : null}
      </div>

      <div className="progress-track" aria-hidden="true">
        <div
          className="progress-fill"
          style={{ width: `${Math.max(2, job.progress)}%` }}
        />
      </div>

      <div className="job-meta">
        <span className="mono muted">
          {job.type} · {job.progress}%
        </span>
        <button
          type="button"
          className="link-btn"
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
