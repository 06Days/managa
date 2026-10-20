import { OverallStatus, RuntimeStatus } from "./types";

export function statusLabel(status: OverallStatus | RuntimeStatus): string {
  switch (status) {
    case "running":
      return "Running";
    case "partial":
      return "Partial";
    case "stopped":
      return "Stopped";
    case "starting":
      return "Starting";
    case "stopping":
      return "Stopping";
    case "transitioning":
      return "Transitioning";
    case "error":
      return "Error";
    default:
      return status;
  }
}

export function timeAgo(iso?: string): string {
  if (!iso) return "never";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "never";

  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function shortRef(commit?: string): string {
  return commit ? commit.slice(0, 8) : "";
}
