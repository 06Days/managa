"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { Job } from "@/lib/types";

/**
 * Polls a managa job until it finishes. `onFinish` is called exactly once for
 * each job id, which lets pages refresh their app list after an action.
 */
export function useJob(onFinish?: (job: Job) => void) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const finishedRef = useRef<Set<string>>(new Set());
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    if (!jobId) return;
    let active = true;
    setJob(null);
    setPollError(null);

    const poll = async () => {
      try {
        const next = await api.job(jobId);
        if (!active) return;
        setJob(next);
        if (
          (next.status === "succeeded" || next.status === "failed") &&
          !finishedRef.current.has(next.id)
        ) {
          finishedRef.current.add(next.id);
          onFinishRef.current?.(next);
        }
        if (next.status === "queued" || next.status === "running") {
          setTimeout(() => void poll(), 800);
        }
      } catch (error) {
        if (!active) return;
        setPollError(error instanceof Error ? error.message : String(error));
        setTimeout(() => void poll(), 2000);
      }
    };

    void poll();
    return () => {
      active = false;
    };
  }, [jobId]);

  const track = (next: Job | string) => {
    setJob(typeof next === "string" ? null : next);
    setJobId(typeof next === "string" ? next : next.id);
  };

  const clear = () => {
    setJobId(null);
    setJob(null);
    setPollError(null);
  };

  return { job, jobId, pollError, track, clear };
}
