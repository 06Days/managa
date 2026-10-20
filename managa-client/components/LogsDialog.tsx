"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AppView, ComponentKind } from "@/lib/types";
import { Icon } from "./Icons";
import { Modal } from "./Modal";

export function LogsDialog({
  app,
  initialComponent,
  open,
  onClose,
}: {
  app: AppView | null;
  initialComponent?: ComponentKind;
  open: boolean;
  onClose: () => void;
}) {
  const available: ComponentKind[] = [];
  if (app?.server) available.push("server");
  if (app?.client) available.push("client");

  const preferred: ComponentKind =
    initialComponent && app?.[initialComponent]
      ? initialComponent
      : app?.server
        ? "server"
        : "client";

  const [component, setComponent] = useState<ComponentKind>(preferred);
  const [lines, setLines] = useState<string[]>([]);
  const [logPath, setLogPath] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(true);

  useEffect(() => {
    if (open) setComponent(preferred);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, app?.id, initialComponent]);

  const load = useCallback(async () => {
    if (!app) return;
    setLoading(true);
    try {
      const result = await api.logs(app.id, component, 400);
      setLines(result.lines);
      setLogPath(result.path);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [app, component]);

  useEffect(() => {
    if (!open || !app) return;
    void load();
    if (!live) return;
    const timer = setInterval(() => void load(), 2500);
    return () => clearInterval(timer);
  }, [open, app, load, live]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={app ? `${app.name} logs` : "Logs"}
      subtitle="Live output from the managed process. Logs are written to the managa data directory."
      wide
      footer={
        <>
          <span
            className="small font-monospace text-secondary text-truncate me-auto"
            style={{ maxWidth: "45%" }}
            title={logPath}
          >
            {logPath || "—"}
          </span>
          <div className="form-check form-switch mb-0 d-flex align-items-center gap-2">
            <input
              id="logs-live"
              className="form-check-input mt-0"
              type="checkbox"
              role="switch"
              checked={live}
              onChange={(event) => setLive(event.target.checked)}
            />
            <label className="form-check-label" htmlFor="logs-live">
              Live
            </label>
          </div>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
            onClick={() => void load()}
            disabled={loading}
          >
            <Icon name="refresh" size={15} />
            Refresh
          </button>
        </>
      }
    >
      {available.length > 1 ? (
        <ul className="nav nav-pills gap-2" role="tablist" aria-label="Component">
          {available.map((kind) => (
            <li className="nav-item" key={kind}>
              <button
                type="button"
                role="tab"
                aria-selected={component === kind}
                className={`nav-link d-inline-flex align-items-center gap-1${
                  component === kind ? " active" : ""
                }`}
                onClick={() => setComponent(kind)}
              >
                <Icon
                  name={kind === "server" ? "server" : "monitor"}
                  size={15}
                />
                <span className="text-capitalize">{kind}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <div className="alert alert-danger mb-0" role="alert">
          {error}
        </div>
      ) : null}

      <pre className="log-pre">
        {lines.length > 0
          ? lines.join("\n")
          : loading
            ? "Loading logs…"
            : "No output yet. Start the app to see logs."}
      </pre>
    </Modal>
  );
}
