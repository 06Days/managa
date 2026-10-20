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
          <span className="mono log-path" title={logPath}>
            {logPath || "—"}
          </span>
          <span className="spacer" />
          <label className="checkline">
            <input
              type="checkbox"
              checked={live}
              onChange={(event) => setLive(event.target.checked)}
            />
            Live
          </label>
          <button
            className="btn btn-ghost btn-sm"
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
        <div className="tabs" role="tablist" aria-label="Component">
          {available.map((kind) => (
            <button
              key={kind}
              type="button"
              role="tab"
              aria-selected={component === kind}
              className={`tab ${component === kind ? "active" : ""}`}
              onClick={() => setComponent(kind)}
            >
              <Icon name={kind === "server" ? "server" : "monitor"} size={15} />
              {kind}
            </button>
          ))}
        </div>
      ) : null}

      {error ? <div className="notice notice-error">{error}</div> : null}

      <pre className="log-view">
        {lines.length > 0
          ? lines.join("\n")
          : loading
            ? "Loading logs…"
            : "No output yet. Start the app to see logs."}
      </pre>
    </Modal>
  );
}
