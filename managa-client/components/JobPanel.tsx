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
    <aside className="job-panel" aria-live="polite">
      <JobProgress job={job} compact onDismiss={onDismiss} />
    </aside>
  );
}
