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
    { label: "Installed", value: apps.length, tone: "body" },
    {
      label: "Running",
      value: apps.filter((app) => app.overallStatus === "running").length,
      tone: "success",
    },
    {
      label: "Enabled",
      value: apps.filter((app) => app.enabled).length,
      tone: "info",
    },
    {
      label: "Errors",
      value: apps.filter((app) => app.overallStatus === "error").length,
      tone: "danger",
    },
  ];

  return (
    <>
      <section className="hero-card border rounded-4 p-4 p-md-5 mb-4">
        <div className="row g-4 align-items-end">
          <div className="col-lg-8">
            <div className="text-uppercase small fw-semibold text-info mb-2 d-inline-flex align-items-center gap-1">
              <Icon name="sparkles" size={14} />
              Self-productivity apps
            </div>
            <h1 className="display-5 fw-bold mb-3">
              Your self-productivity apps,{" "}
              <span className="text-gradient text-nowrap">one home.</span>
            </h1>
            <p className="text-secondary mb-0">
              Install a compatible client/server bundle from GitHub, flip it on,
              and managa runs both sides on managed ports with live logs and
              lifecycle controls.
            </p>
          </div>
          <div className="col-lg-4 d-flex flex-wrap gap-2 justify-content-lg-end">
            <button
              className="btn btn-primary d-inline-flex align-items-center gap-2"
              onClick={() => setInstallOpen(true)}
            >
              <Icon name="github" size={17} />
              Install from GitHub
            </button>
            <Link
              className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
              href="/catalog"
            >
              <Icon name="layers" size={17} />
              Browse catalog
            </Link>
          </div>
        </div>
      </section>

      <section className="row g-3 mb-4" aria-label="Overview">
        {stats.map((stat) => (
          <div className="col-6 col-lg-3" key={stat.label}>
            <div className="card h-100">
              <div className="card-body py-3">
                <div className={`fs-3 fw-bold text-${stat.tone}`}>
                  {loading && apps.length === 0 ? "—" : stat.value}
                </div>
                <div className="small text-secondary text-uppercase">
                  {stat.label}
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {notice ? (
        <div
          className={`alert alert-${
            notice.type === "error" ? "danger" : notice.type
          } alert-dismissible d-flex align-items-center gap-2`}
          role="alert"
        >
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
            className="btn-close"
            onClick={() => setNotice(null)}
            aria-label="Dismiss"
          />
        </div>
      ) : null}

      {error && apps.length === 0 ? (
        <div className="card border-danger mb-4">
          <div className="card-body d-flex flex-wrap align-items-center gap-3">
            <span className="job-state text-bg-danger">
              <Icon name="alert" size={22} />
            </span>
            <div className="flex-grow-1">
              <h2 className="h5 mb-1">managa server offline</h2>
              <p className="mb-1">{error}</p>
              <p className="small text-secondary mb-0">
                Start it with <code>npm run dev:server</code> from the
                repository root, then retry.
              </p>
            </div>
            <button
              className="btn btn-outline-secondary d-inline-flex align-items-center gap-2"
              onClick={() => void refresh()}
            >
              <Icon name="refresh" size={16} />
              Retry
            </button>
          </div>
        </div>
      ) : null}

      <section>
        <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-3">
          <div>
            <h2 className="h3 mb-1">Installed apps</h2>
            <p className="text-secondary mb-0">
              Cards are generated from the managa registry. Toggle an app to
              start or stop its client and server together.
            </p>
          </div>
          <button
            className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
            onClick={() => void refresh()}
            title="Refresh apps"
          >
            <Icon name="refresh" size={15} />
            Refresh
          </button>
        </div>

        {loading && apps.length === 0 ? (
          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
            {[0, 1, 2].map((index) => (
              <div className="col" key={index}>
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="placeholder-glow">
                      <span className="placeholder col-6" />
                    </h5>
                    <p className="placeholder-glow mb-2">
                      <span className="placeholder col-12" />
                      <span className="placeholder col-8" />
                    </p>
                    <p className="placeholder-glow mb-0">
                      <span className="placeholder col-12" />
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : apps.length === 0 ? (
          <EmptyState
            title="No apps installed yet"
            message="Install your first compatible app from GitHub, or restore a bundled app from the catalog."
            action={
              <>
                <button
                  className="btn btn-primary d-inline-flex align-items-center gap-2"
                  onClick={() => setInstallOpen(true)}
                >
                  <Icon name="github" size={17} />
                  Install from GitHub
                </button>
                <Link className="btn btn-outline-secondary" href="/catalog">
                  Open catalog
                </Link>
              </>
            }
          />
        ) : (
          <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
            {apps.map((app) => (
              <div className="col" key={app.id}>
                <AppCard
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
              </div>
            ))}
            <div className="col">
              <button
                type="button"
                className="card h-100 w-100 add-card text-center"
                onClick={() => setInstallOpen(true)}
              >
                <span className="card-body d-flex flex-column align-items-center justify-content-center gap-2">
                  <span className="add-icon">
                    <Icon name="plus" size={24} />
                  </span>
                  <strong>Add an app</strong>
                  <span className="small">
                    Install a compatible bundle from GitHub
                  </span>
                </span>
              </button>
            </div>
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
