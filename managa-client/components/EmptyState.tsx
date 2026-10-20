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
    <div className="card empty-card">
      <div className="card-body text-center py-5 d-flex flex-column align-items-center gap-3">
        <div className="app-icon" aria-hidden="true">
          <Icon name="layers" size={26} />
        </div>
        <div>
          <h2 className="h4">{title}</h2>
          <p className="text-secondary mb-0">{message}</p>
        </div>
        {action ? (
          <div className="d-flex flex-wrap justify-content-center gap-2">
            {action}
          </div>
        ) : null}
      </div>
    </div>
  );
}
