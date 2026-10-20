"use client";

import { useState } from "react";
import { Modal } from "./Modal";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      dismissible={!busy}
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={() => void confirm()}
            disabled={busy}
          >
            {busy ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Working…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </>
      }
    >
      <p className="text-secondary mb-0">{message}</p>
    </Modal>
  );
}
