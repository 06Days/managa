export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

export function formatDuration(ms: number): string {
  const safe = Math.max(0, ms);
  const days = Math.floor(safe / DAY_MS);
  const hours = Math.floor((safe % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((safe % HOUR_MS) / MINUTE_MS);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return "< 1m";
}

export function formatDays(ms: number): string {
  const days = Math.floor(ms / DAY_MS);
  if (days === 0) return "0 days";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-NZ").format(value);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function relativeTime(value: string, now = Date.now()): string {
  const delta = now - new Date(value).getTime();
  if (delta < MINUTE_MS) return "just now";
  if (delta < HOUR_MS) {
    const minutes = Math.floor(delta / MINUTE_MS);
    return `${minutes} min ago`;
  }
  if (delta < DAY_MS) {
    const hours = Math.floor(delta / HOUR_MS);
    return `${hours} hr ago`;
  }
  const days = Math.floor(delta / DAY_MS);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

export function toDateInput(value: string): string {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * MINUTE_MS);
  return local.toISOString().slice(0, 10);
}

export function toDateTimeInput(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * MINUTE_MS);
  return local.toISOString().slice(0, 16);
}

export function dateInputToIso(value: string): string {
  return new Date(`${value}T00:00:00`).toISOString();
}

export function dateTimeInputToIso(value: string): string {
  return new Date(value).toISOString();
}

export interface Milestone {
  day: number;
  label: string;
  stage: string;
}

export const MILESTONES: Milestone[] = [
  { day: 0, label: "Fresh ground", stage: "Empty lot" },
  { day: 1, label: "First block", stage: "Camp" },
  { day: 3, label: "Little hamlet", stage: "Hamlet" },
  { day: 7, label: "First week", stage: "Village" },
  { day: 14, label: "Two weeks", stage: "Town" },
  { day: 30, label: "One month", stage: "City" },
  { day: 60, label: "Two months", stage: "Skyline" },
  { day: 90, label: "Ninety days", stage: "Metropolis" },
  { day: 180, label: "Half a year", stage: "Megacity" },
  { day: 365, label: "One year", stage: "Legendary" },
];

export function milestoneFor(days: number): Milestone {
  let current = MILESTONES[0];
  for (const milestone of MILESTONES) {
    if (days >= milestone.day) current = milestone;
  }
  return current;
}

export function nextMilestone(days: number): Milestone | null {
  return MILESTONES.find((milestone) => milestone.day > days) ?? null;
}
