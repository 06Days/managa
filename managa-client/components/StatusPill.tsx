import { OverallStatus, RuntimeStatus } from "@/lib/types";
import { statusLabel } from "@/lib/format";

export function StatusPill({
  status,
  small = false,
}: {
  status: OverallStatus | RuntimeStatus;
  small?: boolean;
}) {
  return (
    <span
      className={`status-pill status-${status} ${small ? "status-pill-sm" : ""}`}
      title={statusLabel(status)}
    >
      <span className="status-dot" />
      {statusLabel(status)}
    </span>
  );
}
