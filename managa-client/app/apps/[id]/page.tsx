"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Icon } from "@/components/Icons";
import { JobPanel } from "@/components/JobPanel";
import { LogsDialog } from "@/components/LogsDialog";
import { StatusPill } from "@/components/StatusPill";
import { Toggle } from "@/components/Toggle";
import { useJob } from "@/hooks/useJob";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { AppComponentView, AppView, ComponentKind, Job } from "@/lib/types";

export default function AppDetailPage() {
  const params = useParams<{ id: string }>();
  const id = String(params.id);

  const [app, setApp] = useState<AppView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [logs, setLogs] = useState<{
    component: ComponentKind;
  } | null>(null);
  const [confirmUninstall, setConfirmUninstall] = useState(false);

  const load = useCallback(async () => {
    try {
      const next = await api.getApp(id);
      setApp(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 3000);
    return () => clearInterval(timer);
  }, [load]);

  const { job, track, clear } = useJob((finished) => {
    void load();
    setNotice(
      finished.status === "succeeded"
        ? finished.message
        : finished.error ?? finished.message,
    );
  });

  const busy =
    Boolean(job) && (job?.status === "queued" || job?.status === "running");

  const run = async (factory: () => Promise<Job>) => {
    setNotice(null);
    try {
      const created = await factory();
      track(created);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : String(err));
    }
  };

  if (loading && !app) {
    return (
      <div className="detail-loading">
        <span className="spinner" />
        Loading app…
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="connection-card">
        <div className="connection-icon">
          <Icon name="alert" size={24} />
        </div>
        <div>
          <h2>App unavailable</h2>
          <p>{error ?? "This app is not installed."}</p>
        </div>
        <Link className="btn btn-ghost" href="/">
          <Icon name="arrow-left" size={16} />
          Dashboard
        </Link>
      </div>
    );
  }

  const components = [app.server, app.client].filter(
    (component): component is AppComponentView => Boolean(component),
  );

  return (
    <>
      <Link className="back-link" href="/">
        <Icon name="arrow-left" size={15} />
        All apps
      </Link>

      <header className="detail-hero">
        <div className="app-icon detail-icon" aria-hidden="true">
          {app.icon || "📦"}
        </div>
        <div className="detail-title">
          <div className="detail-title-row">
            <h1>{app.name}</h1>
            <StatusPill status={app.overallStatus} />
          </div>
          <p>{app.description || "No description provided."}</p>
          <div className="detail-meta mono muted">
            <span>v{app.version}</span>
            <span>·</span>
            <span>
              {app.source.type === "github"
                ? `github.com/${app.source.url
                    .replace(/^https?:\/\/github\.com\//, "")
                    .replace(/\.git$/, "")}`
                : "bundled"}
            </span>
            <span>·</span>
            <span>installed {timeAgo(app.installedAt)}</span>
          </div>
        </div>
        <div className="detail-toggle">
          <span className="muted">{app.enabled ? "On" : "Off"}</span>
          <Toggle
            checked={app.enabled}
            disabled={busy}
            onChange={(enabled) =>
              void run(() => api.toggle(app.id, enabled))
            }
            label={`Turn ${app.name} ${app.enabled ? "off" : "on"}`}
          />
        </div>
      </header>

      {notice ? (
        <div
          className={`notice ${
            job?.status === "failed" ? "notice-error" : "notice-info"
          }`}
        >
          <Icon
            name={job?.status === "failed" ? "alert" : "sparkles"}
            size={17}
          />
          <span>{notice}</span>
        </div>
      ) : null}

      <div className="detail-actions">
        {app.openUrl && app.overallStatus !== "stopped" ? (
          <a
            className="btn btn-primary"
            href={app.openUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="external" size={16} />
            Open app
          </a>
        ) : (
          <button className="btn btn-primary" disabled>
            <Icon name="external" size={16} />
            Open app
          </button>
        )}

        <button
          className="btn btn-ghost"
          onClick={() => {
            setLogs({ component: app.server ? "server" : "client" });
          }}
        >
          <Icon name="terminal" size={16} />
          Logs
        </button>

        <button
          className="btn btn-ghost"
          onClick={() => void run(() => api.rebuild(app.id))}
          disabled={busy || app.enabled}
          title={
            app.enabled ? "Stop the app before rebuilding it" : "Rebuild app"
          }
        >
          <Icon name="refresh" size={16} />
          Rebuild
        </button>

        <span className="spacer" />

        <button
          className="btn btn-danger-ghost"
          onClick={() => setConfirmUninstall(true)}
          disabled={busy}
        >
          <Icon name="trash" size={16} />
          Uninstall
        </button>
      </div>

      <section className="component-grid">
        {components.map((component) => (
          <article className="component-card" key={component.kind}>
            <header>
              <span className="component-icon">
                <Icon
                  name={component.kind === "server" ? "server" : "monitor"}
                  size={20}
                />
              </span>
              <div>
                <h3>{component.kind}</h3>
                <span className="mono muted">{component.dir}</span>
              </div>
              <StatusPill status={component.status} small />
            </header>

            <dl className="component-details">
              <div>
                <dt>Port</dt>
                <dd className="mono">{component.port}</dd>
              </div>
              <div>
                <dt>URL</dt>
                <dd>
                  <a
                    className="mono"
                    href={component.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {component.url.replace(/^https?:\/\//, "")}
                  </a>
                </dd>
              </div>
              <div>
                <dt>PID</dt>
                <dd className="mono">{component.pid ?? "—"}</dd>
              </div>
              <div>
                <dt>Started</dt>
                <dd>{timeAgo(component.startedAt)}</dd>
              </div>
            </dl>

            <div className="component-command">
              <span className="muted">start</span>
              <code>{component.startCommand}</code>
            </div>

            {component.lastError ? (
              <div className="notice notice-error component-error-box">
                {component.lastError}
              </div>
            ) : null}

            <footer>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setLogs({ component: component.kind })}
              >
                <Icon name="terminal" size={15} />
                View logs
              </button>
              <a
                className="btn btn-ghost btn-sm"
                href={component.url}
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="external" size={15} />
                Open
              </a>
            </footer>
          </article>
        ))}
      </section>

      <section className="detail-grid">
        <article className="panel">
          <h2>About this app</h2>
          <dl className="info-list">
            <div>
              <dt>App id</dt>
              <dd className="mono">{app.id}</dd>
            </div>
            <div>
              <dt>Version</dt>
              <dd>{app.version}</dd>
            </div>
            {app.author ? (
              <div>
                <dt>Author</dt>
                <dd>{app.author}</dd>
              </div>
            ) : null}
            <div>
              <dt>Source</dt>
              <dd>
                {app.source.type === "github" ? (
                  <a href={app.source.url.replace(/\.git$/, "")} target="_blank" rel="noreferrer">
                    {app.source.url.replace(/\.git$/, "")}
                  </a>
                ) : (
                  <span className="mono">{app.source.manifestPath}</span>
                )}
              </dd>
            </div>
            {app.source.type === "github" && app.source.commit ? (
              <div>
                <dt>Commit</dt>
                <dd className="mono">{app.source.commit.slice(0, 12)}</dd>
              </div>
            ) : null}
            <div>
              <dt>Updated</dt>
              <dd>{timeAgo(app.updatedAt)}</dd>
            </div>
          </dl>
          {app.tags.length > 0 ? (
            <div className="tag-row">
              {app.tags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </article>
      </section>

      <LogsDialog
        app={app}
        initialComponent={logs?.component}
        open={Boolean(logs)}
        onClose={() => setLogs(null)}
      />

      <ConfirmDialog
        open={confirmUninstall}
        title={`Uninstall ${app.name}?`}
        message={
          app.source.type === "github"
            ? "This stops both processes and deletes the cloned app files. App data and logs stay in the managa data directory."
            : "This stops the app and hides it from the dashboard. The bundled files remain and can be restored from the catalog."
        }
        confirmLabel="Uninstall"
        danger
        onClose={() => setConfirmUninstall(false)}
        onConfirm={async () => {
          await run(() => api.uninstall(app.id));
        }}
      />

      <JobPanel job={job} onDismiss={clear} />
    </>
  );
}
