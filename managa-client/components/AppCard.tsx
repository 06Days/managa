"use client";

import Link from "next/link";
import { AppComponentView, AppView } from "@/lib/types";
import { Icon } from "./Icons";
import { StatusPill } from "./StatusPill";
import { Toggle } from "./Toggle";

function ComponentRow({ component }: { component: AppComponentView }) {
  return (
    <div className="component-row" title={component.lastError || undefined}>
      <span className={`component-dot status-${component.status}`} />
      <span className="component-name">
        <Icon name={component.kind === "server" ? "server" : "monitor"} size={14} />
        {component.kind}
      </span>
      <span className="mono component-port">:{component.port}</span>
      {component.status === "error" ? (
        <span className="component-error">failed</span>
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
  const canOpen = Boolean(app.openUrl) && !busy;
  const sourceLabel =
    app.source.type === "github" ? "GitHub" : "Bundled";

  return (
    <article className={`app-card app-status-${app.overallStatus}`}>
      <header className="app-card-head">
        <div className="app-icon" aria-hidden="true">
          {app.icon || "📦"}
        </div>
        <div className="app-title">
          <h3 title={app.name}>{app.name}</h3>
          <span className="mono muted">
            v{app.version} · {sourceLabel}
          </span>
        </div>
        <StatusPill status={app.overallStatus} />
      </header>

      <p className="app-desc">
        {app.description || "No description provided by the app manifest."}
      </p>

      {app.tags.length > 0 ? (
        <div className="tag-row">
          {app.tags.slice(0, 4).map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="component-list">
        {app.server ? <ComponentRow component={app.server} /> : null}
        {app.client ? <ComponentRow component={app.client} /> : null}
      </div>

      <footer className="app-card-foot">
        {canOpen ? (
          <a
            className="btn btn-primary btn-sm"
            href={app.openUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="external" size={15} />
            Open
          </a>
        ) : (
          <button className="btn btn-primary btn-sm" disabled>
            <Icon name="external" size={15} />
            Open
          </button>
        )}

        <Link className="btn btn-ghost btn-sm" href={`/apps/${app.id}`}>
          Manage
        </Link>

        <button
          type="button"
          className="icon-btn"
          onClick={() => onLogs(app)}
          title={`View ${app.name} logs`}
          aria-label={`View ${app.name} logs`}
        >
          <Icon name="terminal" size={17} />
        </button>

        <button
          type="button"
          className="icon-btn danger-hover"
          onClick={() => onUninstall(app)}
          title={`Uninstall ${app.name}`}
          aria-label={`Uninstall ${app.name}`}
        >
          <Icon name="trash" size={17} />
        </button>

        <span className="spacer" />

        <Toggle
          checked={app.enabled}
          disabled={busy}
          onChange={(next) => onToggle(app, next)}
          label={`Turn ${app.name} ${app.enabled ? "off" : "on"}`}
        />
      </footer>
    </article>
  );
}
