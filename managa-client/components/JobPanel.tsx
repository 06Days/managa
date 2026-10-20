"use client";

import { Job } from "@/lib/types";
import { JobProgress } from "./JobProgress";

export function JobPanel({
  job,
  onDismiss,
}: {
  job: Job | null;
  onDismiss: () => void;
}) {
  if (!job) return null;

  return (
    <aside className="job-panel card shadow" aria-live="polite">
      <div className="card-body p-3">
        <JobProgress job={job} compact onDismiss={onDismiss} />
      </div>
    </aside>
  );
}
