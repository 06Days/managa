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
      <div className="d-flex justify-content-center align-items-center gap-2 text-secondary py-5">
        <span className="spinner-border spinner-border-sm" />
        Loading app…
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="card border-danger">
        <div className="card-body d-flex flex-wrap align-items-center gap-3">
          <span className="job-state text-bg-danger">
            <Icon name="alert" size={22} />
          </span>
          <div className="flex-grow-1">
            <h2 className="h5 mb-1">App unavailable</h2>
            <p className="text-secondary mb-0">
              {error ?? "This app is not installed."}
            </p>
          </div>
          <Link
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-1"
            href="/"
          >
            <Icon name="arrow-left" size={16} />
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const components = [app.server, app.client].filter(
    (component): component is AppComponentView => Boolean(component),
  );

  return (
    <>
      <Link
        className="link-secondary text-decoration-none small d-inline-flex align-items-center gap-1 mb-3"
        href="/"
      >
        <Icon name="arrow-left" size={15} />
        All apps
      </Link>

      <header className="card mb-3">
        <div className="card-body d-flex flex-wrap align-items-center gap-3">
          <div className="app-icon app-icon-lg" aria-hidden="true">
            {app.icon || "📦"}
          </div>
          <div className="flex-grow-1 min-w-0">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <h1 className="h3 mb-0">{app.name}</h1>
              <StatusPill status={app.overallStatus} />
            </div>
            <p className="text-secondary mb-1">
              {app.description || "No description provided."}
            </p>
            <div className="small text-secondary font-monospace d-flex flex-wrap gap-2">
              <span>v{app.version}</span>
              <span aria-hidden="true">·</span>
              <span>
                {app.source.type === "github"
                  ? `github.com/${app.source.url
                      .replace(/^https?:\/\/github\.com\//, "")
                      .replace(/\.git$/, "")}`
                  : "bundled"}
              </span>
              <span aria-hidden="true">·</span>
              <span>installed {timeAgo(app.installedAt)}</span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="small text-secondary">
              {app.enabled ? "On" : "Off"}
            </span>
            <Toggle
              checked={app.enabled}
              disabled={busy}
              onChange={(enabled) =>
                void run(() => api.toggle(app.id, enabled))
              }
              label={`Turn ${app.name} ${app.enabled ? "off" : "on"}`}
            />
          </div>
        </div>
      </header>

      {notice ? (
        <div
          className={`alert ${
            job?.status === "failed" ? "alert-danger" : "alert-info"
          } d-flex align-items-center gap-2`}
          role="status"
        >
          <Icon
            name={job?.status === "failed" ? "alert" : "sparkles"}
            size={17}
          />
          <span>{notice}</span>
        </div>
      ) : null}

      <div className="d-flex flex-wrap align-items-center gap-2 mb-4">
        {app.openUrl && app.overallStatus !== "stopped" ? (
          <a
            className="btn btn-primary d-inline-flex align-items-center gap-1"
            href={app.openUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="external" size={16} />
            Open app
          </a>
        ) : (
          <button className="btn btn-primary d-inline-flex align-items-center gap-1" disabled>
            <Icon name="external" size={16} />
            Open app
          </button>
        )}

        <button
          className="btn btn-outline-secondary d-inline-flex align-items-center gap-1"
          onClick={() => {
            setLogs({ component: app.server ? "server" : "client" });
          }}
        >
          <Icon name="terminal" size={16} />
          Logs
        </button>

        <button
          className="btn btn-outline-secondary d-inline-flex align-items-center gap-1"
          onClick={() => void run(() => api.rebuild(app.id))}
          disabled={busy || app.enabled}
          title={
            app.enabled ? "Stop the app before rebuilding it" : "Rebuild app"
          }
        >
          <Icon name="refresh" size={16} />
          Rebuild
        </button>

        <div className="ms-auto" />

        <button
          className="btn btn-outline-danger d-inline-flex align-items-center gap-1"
          onClick={() => setConfirmUninstall(true)}
          disabled={busy}
        >
          <Icon name="trash" size={16} />
          Uninstall
        </button>
      </div>

      <section className="row row-cols-1 row-cols-lg-2 g-3 mb-4">
        {components.map((component) => (
          <div className="col" key={component.kind}>
            <article className="card h-100">
              <div className="card-body d-flex flex-column gap-3">
                <div className="d-flex align-items-center gap-3">
                  <span className="app-icon">
                    <Icon
                      name={component.kind === "server" ? "server" : "monitor"}
                      size={20}
                    />
                  </span>
                  <div className="flex-grow-1 min-w-0">
                    <h2 className="h6 text-capitalize mb-0">
                      {component.kind}
                    </h2>
                    <span className="small font-monospace text-secondary text-break">
                      {component.dir}
                    </span>
                  </div>
                  <StatusPill status={component.status} small />
                </div>

                <dl className="row row-cols-2 g-3 small mb-0">
                  <div className="col">
                    <dt className="text-secondary fw-normal">Port</dt>
                    <dd className="font-monospace mb-0">{component.port}</dd>
                  </div>
                  <div className="col">
                    <dt className="text-secondary fw-normal">PID</dt>
                    <dd className="font-monospace mb-0">
                      {component.pid ?? "—"}
                    </dd>
                  </div>
                  <div className="col">
                    <dt className="text-secondary fw-normal">URL</dt>
                    <dd className="mb-0">
                      <a
                        className="font-monospace link-info text-decoration-none text-break"
                        href={component.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {component.url.replace(/^https?:\/\//, "")}
                      </a>
                    </dd>
                  </div>
                  <div className="col">
                    <dt className="text-secondary fw-normal">Started</dt>
                    <dd className="mb-0">{timeAgo(component.startedAt)}</dd>
                  </div>
                </dl>

                <div className="bg-body-tertiary border rounded-2 p-2 d-flex gap-2 small overflow-auto">
                  <span className="text-secondary">start</span>
                  <code className="text-body text-break">
                    {component.startCommand}
                  </code>
                </div>

                {component.lastError ? (
                  <div className="alert alert-danger small mb-0" role="alert">
                    {component.lastError}
                  </div>
                ) : null}

                <div className="d-flex flex-wrap gap-2 mt-auto">
                  <button
                    className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                    onClick={() => setLogs({ component: component.kind })}
                  >
                    <Icon name="terminal" size={15} />
                    View logs
                  </button>
                  <a
                    className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                    href={component.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icon name="external" size={15} />
                    Open
                  </a>
                </div>
              </div>
            </article>
          </div>
        ))}
      </section>

      <div className="row">
        <div className="col-lg-8">
          <article className="card">
            <div className="card-body">
              <h2 className="h5 mb-3">About this app</h2>
              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between gap-3 bg-transparent px-0">
                  <span className="text-secondary">App id</span>
                  <span className="font-monospace text-break text-end">
                    {app.id}
                  </span>
                </li>
                <li className="list-group-item d-flex justify-content-between gap-3 bg-transparent px-0">
                  <span className="text-secondary">Version</span>
                  <span>{app.version}</span>
                </li>
                {app.author ? (
                  <li className="list-group-item d-flex justify-content-between gap-3 bg-transparent px-0">
                    <span className="text-secondary">Author</span>
                    <span>{app.author}</span>
                  </li>
                ) : null}
                <li className="list-group-item d-flex justify-content-between gap-3 bg-transparent px-0">
                  <span className="text-secondary">Source</span>
                  <span className="text-break text-end">
                    {app.source.type === "github" ? (
                      <a
                        className="link-info text-decoration-none"
                        href={app.source.url.replace(/\.git$/, "")}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {app.source.url.replace(/\.git$/, "")}
                      </a>
                    ) : (
                      <span className="font-monospace">
                        {app.source.manifestPath}
                      </span>
                    )}
                  </span>
                </li>
                {app.source.type === "github" && app.source.commit ? (
                  <li className="list-group-item d-flex justify-content-between gap-3 bg-transparent px-0">
                    <span className="text-secondary">Commit</span>
                    <span className="font-monospace">
                      {app.source.commit.slice(0, 12)}
                    </span>
                  </li>
                ) : null}
                <li className="list-group-item d-flex justify-content-between gap-3 bg-transparent px-0">
                  <span className="text-secondary">Updated</span>
                  <span>{timeAgo(app.updatedAt)}</span>
                </li>
              </ul>
              {app.tags.length > 0 ? (
                <div className="d-flex flex-wrap gap-1 mt-3">
                  {app.tags.map((tag) => (
                    <span className="badge text-bg-secondary" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        </div>
      </div>

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
