import { OverallStatus, RuntimeStatus } from "@/lib/types";
import { statusLabel } from "@/lib/format";

function tone(status: OverallStatus | RuntimeStatus): string {
  switch (status) {
    case "running":
      return "success";
    case "partial":
      return "warning";
    case "error":
      return "danger";
    case "starting":
    case "stopping":
    case "transitioning":
      return "info";
    default:
      return "secondary";
  }
}

export function StatusPill({
  status,
  small = false,
}: {
  status: OverallStatus | RuntimeStatus;
  small?: boolean;
}) {
  return (
    <span
      className={`badge rounded-pill text-bg-${tone(status)}${
        small ? " fw-normal" : ""
      } d-inline-flex align-items-center gap-1`}
      title={statusLabel(status)}
    >
      <span className="status-dot" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}
