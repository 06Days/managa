"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "lg",
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
  dismissible?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissible) onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose, dismissible]);

  if (!open) return null;

  return (
    <>
      <div className="modal-backdrop show" />
      <div
        className="modal d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={() => {
          if (dismissible) onClose();
        }}
      >
        <div
          className={`modal-dialog modal-dialog-centered modal-dialog-scrollable${
            size === "xl" ? " modal-xl" : size === "md" ? "" : " modal-lg"
          }`}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header align-items-start">
              <div>
                <h2 className="modal-title fs-5">{title}</h2>
                {subtitle ? (
                  <div className="small text-secondary mt-1">{subtitle}</div>
                ) : null}
              </div>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
                disabled={!dismissible}
              />
            </div>
            <div className="modal-body d-flex flex-column gap-3">
              {children}
            </div>
            {footer ? (
              <div className="modal-footer flex-wrap gap-2">{footer}</div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
