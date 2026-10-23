"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppComponentView, AppView, OverallStatus } from "@/lib/types";
import { resolveAppUrl } from "@/lib/urls";
import { Icon } from "./Icons";
import { StatusPill } from "./StatusPill";
import { Toggle } from "./Toggle";

const statusBorder: Record<OverallStatus, string> = {
  running: "success",
  partial: "warning",
  stopped: "secondary",
  transitioning: "info",
  error: "danger",
};

function ComponentRow({ component }: { component: AppComponentView }) {
  return (
    <div
      className="d-flex align-items-center gap-2"
      title={component.lastError || undefined}
    >
      <span className={`component-dot status-${component.status}`} />
      <span className="text-capitalize d-inline-flex align-items-center gap-1">
        <Icon
          name={component.kind === "server" ? "server" : "monitor"}
          size={14}
        />
        {component.kind}
      </span>
      <span className="ms-auto font-monospace text-secondary">
        :{component.port}
      </span>
      {component.status === "error" ? (
        <span className="text-danger">failed</span>
      ) : null}
    </div>
  );
}

export function AppCard({
  app,
  busy = false,
  onToggle,
  onLogs,
  onUninstall,
}: {
  app: AppView;
  busy?: boolean;
  onToggle: (app: AppView, enabled: boolean) => void;
  onLogs: (app: AppView) => void;
  onUninstall: (app: AppView) => void;
}) {
  const [browserHostname, setBrowserHostname] = useState<string | null>(null);
  useEffect(() => {
    setBrowserHostname(window.location.hostname);
  }, []);

  const openUrl = resolveAppUrl(app.openUrl, browserHostname);
  const canOpen = Boolean(openUrl) && !busy;
  const sourceLabel = app.source.type === "github" ? "GitHub" : "Bundled";

  return (
    <article
      className={`card h-100 app-card border-start border-3 border-${statusBorder[app.overallStatus]}`}
    >
      <div className="card-body d-flex flex-column gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="app-icon" aria-hidden="true">
            {app.icon || "📦"}
          </div>
          <div className="flex-grow-1 min-w-0">
            <h3 className="h6 mb-0 text-truncate" title={app.name}>
              {app.name}
            </h3>
            <div className="small text-secondary font-monospace">
              v{app.version} · {sourceLabel}
            </div>
          </div>
          <StatusPill status={app.overallStatus} />
        </div>

        <p className="small text-secondary mb-0 line-clamp-3">
          {app.description || "No description provided."}
        </p>

        {app.tags.length > 0 ? (
          <div className="d-flex flex-wrap gap-1">
            {app.tags.slice(0, 4).map((tag) => (
              <span className="badge text-bg-secondary" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="border rounded-2 bg-body-tertiary p-2 d-flex flex-column gap-1 small">
          {app.server ? <ComponentRow component={app.server} /> : null}
          {app.client ? <ComponentRow component={app.client} /> : null}
        </div>

        <div className="d-flex align-items-center gap-2 mt-auto pt-1">
          {canOpen ? (
            <a
              className="btn btn-primary btn-sm"
              href={openUrl}
              target="_blank"
              rel="noreferrer"
            >
              <Icon name="external" size={15} />
              <span className="ms-1">Open</span>
            </a>
          ) : (
            <button className="btn btn-primary btn-sm" disabled>
              <Icon name="external" size={15} />
              <span className="ms-1">Open</span>
            </button>
          )}

          <Link
            className="btn btn-outline-secondary btn-sm"
            href={`/apps/${app.id}`}
          >
            Manage
          </Link>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => onLogs(app)}
            title={`View ${app.name} logs`}
            aria-label={`View ${app.name} logs`}
          >
            <Icon name="terminal" size={16} />
          </button>

          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => onUninstall(app)}
            title={`Uninstall ${app.name}`}
            aria-label={`Uninstall ${app.name}`}
          >
            <Icon name="trash" size={16} />
          </button>

          <div className="ms-auto">
            <Toggle
              checked={app.enabled}
              disabled={busy}
              onChange={(next) => onToggle(app, next)}
              label={`Turn ${app.name} ${app.enabled ? "off" : "on"}`}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
