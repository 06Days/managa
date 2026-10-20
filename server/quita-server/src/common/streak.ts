import type { AddictionRow, AddictionStats, RelapseRow } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDate(value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid date: ${value}`);
  }
  return parsed;
}

export function buildStats(
  addiction: AddictionRow,
  relapses: RelapseRow[],
  now = Date.now(),
): AddictionStats {
  const startedAt = parseDate(addiction.startedAt);
  const sorted = [...relapses].sort(
    (a, b) => parseDate(a.occurredAt) - parseDate(b.occurredAt) || a.id - b.id,
  );

  let previous = startedAt;
  let best = 0;
  let totalClean = 0;

  for (const relapse of sorted) {
    const at = parseDate(relapse.occurredAt);
    const gap = Math.max(0, at - previous);
    best = Math.max(best, gap);
    totalClean += gap;
    previous = at;
  }

  const currentStart = sorted.length
    ? parseDate(sorted[sorted.length - 1].occurredAt)
    : startedAt;
  const current = Math.max(0, now - currentStart);
  best = Math.max(best, current);
  totalClean += current;

  return {
    currentStreakStartedAt: new Date(currentStart).toISOString(),
    currentStreakMs: current,
    bestStreakMs: best,
    totalCleanMs: totalClean,
    totalRelapses: sorted.length,
    lastRelapseAt: sorted.length
      ? new Date(parseDate(sorted[sorted.length - 1].occurredAt)).toISOString()
      : null,
  };
}

export function daysFromMs(ms: number): number {
  return ms / DAY_MS;
}
