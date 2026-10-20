import type { ReactNode } from "react";
import { Icon } from "./Icons";

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name="layers" size={28} />
      </div>
      <h2>{title}</h2>
      <p>{message}</p>
      {action}
    </div>
  );
}
