"use client";

import Link from "next/link";
import { useState } from "react";
import { AppCard } from "@/components/AppCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { Icon } from "@/components/Icons";
import { InstallDialog } from "@/components/InstallDialog";
import { JobPanel } from "@/components/JobPanel";
import { LogsDialog } from "@/components/LogsDialog";
import { useApps } from "@/hooks/useApps";
import { useJob } from "@/hooks/useJob";
import { api } from "@/lib/api";
import { AppView, ComponentKind, Job } from "@/lib/types";

type Notice = {
  type: "success" | "error" | "info";
  text: string;
};

export default function DashboardPage() {
  const { apps, loading, error, refresh } = useApps(3000);
  const [installOpen, setInstallOpen] = useState(false);
  const [logsApp, setLogsApp] = useState<AppView | null>(null);
  const [logsComponent, setLogsComponent] = useState<ComponentKind>("server");
  const [confirmApp, setConfirmApp] = useState<AppView | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const { job, track, clear } = useJob((finished) => {
    void refresh();
    if (finished.status === "succeeded") {
      setNotice({ type: "success", text: finished.message });
    } else {
      setNotice({
        type: "error",
        text: finished.error ?? finished.message,
      });
    }
  });

  const busyId =
    job && (job.status === "queued" || job.status === "running")
      ? job.appId
      : undefined;

  const run = async (factory: () => Promise<Job>) => {
    setNotice(null);
    try {
      const created = await factory();
      track(created);
    } catch (err) {
      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const stats = [
    { label: "Installed", value: apps.length, tone: "neutral" as const },
    {
      label: "Running",
      value: apps.filter((app) => app.overallStatus === "running").length,
      tone: "green" as const,
    },
    {
      label: "Enabled",
      value: apps.filter((app) => app.enabled).length,
      tone: "violet" as const,
    },
    {
      label: "Errors",
      value: apps.filter((app) => app.overallStatus === "error").length,
      tone: "red" as const,
    },
  ];

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <Icon name="sparkles" size={14} />
            Self-productivity apps
          </span>
          <h1>
            Your self-productivity apps,{" "}
            <span className="grad">one home.</span>
          </h1>
          <p>
            Install a compatible client/server bundle from GitHub, flip it on,
            and managa runs both sides on managed ports with live logs and
            lifecycle controls.
          </p>
        </div>
        <div className="hero-actions">
          <button
            className="btn btn-primary"
            onClick={() => setInstallOpen(true)}
          >
            <Icon name="github" size={17} />
            Install from GitHub
          </button>
          <Link className="btn btn-ghost" href="/catalog">
            <Icon name="layers" size={17} />
            Browse catalog
          </Link>
        </div>
      </section>

      <section className="stats" aria-label="Overview">
        {stats.map((stat) => (
          <div className={`stat stat-${stat.tone}`} key={stat.label}>
            <span className="stat-value">{loading && apps.length === 0 ? "—" : stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </section>

      {notice ? (
        <div className={`notice notice-${notice.type}`}>
          <Icon
            name={
              notice.type === "success"
                ? "check"
                : notice.type === "error"
                  ? "alert"
                  : "sparkles"
            }
            size={17}
          />
          <span>{notice.text}</span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setNotice(null)}
            aria-label="Dismiss"
          >
            <Icon name="x" size={15} />
          </button>
        </div>
      ) : null}

      {error && apps.length === 0 ? (
        <div className="connection-card">
          <div className="connection-icon">
            <Icon name="alert" size={24} />
          </div>
          <div>
            <h2>managa server offline</h2>
            <p>{error}</p>
            <p className="muted">
              Start it with <code>npm run dev:server</code> from the repository
              root, then retry.
            </p>
          </div>
          <button className="btn btn-ghost" onClick={() => void refresh()}>
            <Icon name="refresh" size={16} />
            Retry
          </button>
        </div>
      ) : null}

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Installed apps</h2>
            <p className="muted">
              Cards are generated from the managa registry. Toggle an app to
              start or stop its client and server together.
            </p>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => void refresh()}
            title="Refresh apps"
          >
            <Icon name="refresh" size={15} />
            Refresh
          </button>
        </div>

        {loading && apps.length === 0 ? (
          <div className="app-grid">
            {[0, 1, 2].map((index) => (
              <div className="app-card skeleton-card" key={index}>
                <span className="skeleton skeleton-title" />
                <span className="skeleton skeleton-line" />
                <span className="skeleton skeleton-line short" />
                <span className="skeleton skeleton-block" />
              </div>
            ))}
          </div>
        ) : apps.length === 0 ? (
          <EmptyState
            title="No apps installed yet"
            message="Install your first compatible app from GitHub, or restore the bundled Taska app from the catalog."
            action={
              <div className="empty-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => setInstallOpen(true)}
                >
                  <Icon name="github" size={17} />
                  Install from GitHub
                </button>
                <Link className="btn btn-ghost" href="/catalog">
                  Open catalog
                </Link>
              </div>
            }
          />
        ) : (
          <div className="app-grid">
            {apps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                busy={busyId === app.id}
                onToggle={(target, enabled) =>
                  void run(() => api.toggle(target.id, enabled))
                }
                onLogs={(target) => {
                  setLogsComponent(target.server ? "server" : "client");
                  setLogsApp(target);
                }}
                onUninstall={setConfirmApp}
              />
            ))}
            <button
              type="button"
              className="app-card add-card"
              onClick={() => setInstallOpen(true)}
            >
              <span className="add-icon">
                <Icon name="plus" size={24} />
              </span>
              <strong>Add an app</strong>
              <span className="muted">
                Install a compatible bundle from GitHub
              </span>
            </button>
          </div>
        )}
      </section>

      <InstallDialog
        open={installOpen}
        onClose={() => setInstallOpen(false)}
        onInstalled={() => {
          void refresh();
          setNotice({
            type: "success",
            text: "App installed. Toggle it on when you are ready.",
          });
        }}
      />

      <LogsDialog
        app={logsApp}
        initialComponent={logsComponent}
        open={Boolean(logsApp)}
        onClose={() => setLogsApp(null)}
      />

      <ConfirmDialog
        open={Boolean(confirmApp)}
        title={`Uninstall ${confirmApp?.name ?? "app"}?`}
        message={
          confirmApp?.source.type === "github"
            ? "This stops the app and deletes its cloned files. App data and logs are kept unless you purge them."
            : "This stops the app and hides it from the dashboard. The bundled files stay in the repository and can be restored from the catalog."
        }
        confirmLabel="Uninstall"
        danger
        onClose={() => setConfirmApp(null)}
        onConfirm={async () => {
          if (confirmApp) {
            await run(() => api.uninstall(confirmApp.id));
          }
        }}
      />

      <JobPanel job={job} onDismiss={clear} />
    </>
  );
}
