"use client";

import { Job } from "@/lib/types";
import { InstallForm } from "./InstallForm";
import { Modal } from "./Modal";

export function InstallDialog({
  open,
  onClose,
  initialUrl,
  onInstalled,
}: {
  open: boolean;
  onClose: () => void;
  initialUrl?: string;
  onInstalled?: (job: Job) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Install from GitHub"
      subtitle="Pull any compatible client/server bundle into managa."
      wide
    >
      <InstallForm initialUrl={initialUrl} onInstalled={onInstalled} />
    </Modal>
  );
}
