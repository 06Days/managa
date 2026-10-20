"use client";

import Link from "next/link";
import {
  DAY_MS,
  formatDays,
  formatDuration,
  milestoneFor,
  relativeTime,
} from "@/lib/format";
import type { Addiction } from "@/lib/types";
import { CitySkyline } from "./CitySkyline";

export function AddictionCard({
  addiction,
  now,
  onLogRelapse,
}: {
  addiction: Addiction;
  now: number;
  onLogRelapse: (addiction: Addiction) => void;
}) {
  const currentMs = Math.max(
    0,
    now - new Date(addiction.stats.currentStreakStartedAt).getTime(),
  );
  const bestMs = Math.max(addiction.stats.bestStreakMs, currentMs);
  const days = currentMs / DAY_MS;
  const dayNumber = Math.floor(days);
  const stage = milestoneFor(days);

  return (
    <article className="card addiction-card h-100 shadow-sm">
      <div className="card-body d-flex flex-column gap-3">
        <div className="d-flex align-items-start gap-3">
          <div
            className="addiction-icon"
            style={{
              backgroundColor: `${addiction.color}1f`,
              color: addiction.color,
            }}
            aria-hidden="true"
          >
            {addiction.icon || "🌱"}
          </div>
          <div className="flex-grow-1 min-w-0">
            <h3 className="h5 mb-1 text-truncate">
              <Link
                className="text-body text-decoration-none"
                href={`/addictions/${addiction.id}`}
              >
                {addiction.name}
              </Link>
            </h3>
            <p className="small text-secondary mb-0 line-clamp-2">
              {addiction.description || "No description yet."}
            </p>
          </div>
          <span
            className={`badge rounded-pill flex-shrink-0 ${
              dayNumber > 0 ? "text-bg-success" : "text-bg-warning"
            }`}
          >
            Day {dayNumber}
          </span>
        </div>

        <CitySkyline
          days={days}
          seed={`${addiction.id}-${addiction.name}`}
          accent={addiction.color}
        />

        <div className="d-flex flex-wrap justify-content-between gap-2 small">
          <span>
            <i className="bi bi-clock-history me-1 text-secondary" />
            <strong>{formatDuration(currentMs)}</strong> since last relapse
          </span>
          <span className="text-secondary">
            Best {formatDays(bestMs)} · {stage.stage}
          </span>
        </div>

        <div className="d-flex flex-wrap gap-2 mt-auto">
          <Link
            className="btn btn-primary btn-sm flex-grow-1"
            href={`/addictions/${addiction.id}`}
          >
            <i className="bi bi-buildings me-1" />
            Open city
          </Link>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => onLogRelapse(addiction)}
          >
            <i className="bi bi-arrow-counterclockwise me-1" />
            Relapse
          </button>
        </div>

        <div className="small text-secondary">
          {addiction.stats.totalRelapses === 0 ? (
            <>
              <i className="bi bi-flag me-1" />
              No relapses logged yet. The first block is yours.
            </>
          ) : (
            <>
              <i className="bi bi-journal-text me-1" />
              {addiction.stats.totalRelapses} relapse
              {addiction.stats.totalRelapses === 1 ? "" : "s"} · last{" "}
              {addiction.stats.lastRelapseAt
                ? relativeTime(addiction.stats.lastRelapseAt, now)
                : "—"}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
