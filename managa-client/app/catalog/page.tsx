"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/Icons";
import { InstallDialog } from "@/components/InstallDialog";
import { JobPanel } from "@/components/JobPanel";
import { useApps } from "@/hooks/useApps";
import { useJob } from "@/hooks/useJob";
import { api } from "@/lib/api";
import { CatalogEntry, Job } from "@/lib/types";

export default function CatalogPage() {
  const { apps, refresh } = useApps(5000);
  const [entries, setEntries] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [installTarget, setInstallTarget] = useState<CatalogEntry | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    try {
      const result = await api.catalog();
      setEntries(result.apps);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const { job, track, clear } = useJob((finished) => {
    void refresh();
    void loadCatalog();
    setNotice(
      finished.status === "succeeded"
        ? finished.message
        : finished.error ?? finished.message,
    );
  });

  const run = async (factory: () => Promise<Job>) => {
    setNotice(null);
    try {
      const created = await factory();
      track(created);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : String(err));
    }
  };

  const installedIds = new Set(apps.map((app) => app.id));

  return (
    <>
      <section className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
        <div>
          <div className="text-uppercase small fw-semibold text-info mb-2 d-inline-flex align-items-center gap-1">
            <Icon name="layers" size={14} />
            Catalog
          </div>
          <h1 className="h2 mb-1">Compatible apps</h1>
          <p className="text-secondary mb-0">
            Bundled apps ship with managa. Remote entries come from the optional{" "}
            <code>MANAGA_CATALOG_URL</code>; any GitHub repository with a{" "}
            <code>managa.app.json</code> manifest can also be installed
            directly.
          </p>
        </div>
        <button
          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
          onClick={() => void loadCatalog()}
        >
          <Icon name="refresh" size={15} />
          Refresh
        </button>
      </section>

      {notice ? (
        <div className="alert alert-info d-flex align-items-center gap-2" role="status">
          <Icon name="sparkles" size={17} />
          <span>{notice}</span>
        </div>
      ) : null}

      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
          {[0, 1].map((index) => (
            <div className="col" key={index}>
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="placeholder-glow">
                    <span className="placeholder col-6" />
                  </h5>
                  <p className="placeholder-glow mb-0">
                    <span className="placeholder col-12" />
                    <span className="placeholder col-9" />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <h2 className="h5">No catalog entries yet</h2>
            <p className="text-secondary">
              Point <code>MANAGA_CATALOG_URL</code> at a JSON file to share a
              curated list of apps, or install any repository by URL.
            </p>
            <Link
              className="btn btn-primary d-inline-flex align-items-center gap-2"
              href="/install"
            >
              <Icon name="github" size={16} />
              Install by URL
            </Link>
          </div>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 g-3">
          {entries.map((entry) => {
            const installed = installedIds.has(entry.id);
            return (
              <div className="col" key={entry.id}>
                <article className="card h-100 app-card">
                  <div className="card-body d-flex flex-column gap-3">
                    <div className="d-flex align-items-center gap-3">
                      <div className="app-icon" aria-hidden="true">
                        {entry.icon || "📦"}
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <h3 className="h6 mb-0 text-truncate">{entry.name}</h3>
                        <div className="small text-secondary font-monospace">
                          {entry.builtin ? "bundled" : "github"}
                          {entry.version ? ` · v${entry.version}` : ""}
                        </div>
                      </div>
                      {installed ? (
                        <span className="badge rounded-pill text-bg-success d-inline-flex align-items-center gap-1">
                          <span className="status-dot" />
                          Installed
                        </span>
                      ) : null}
                    </div>

                    <p className="small text-secondary mb-0 line-clamp-3">
                      {entry.description || "No description provided."}
                    </p>

                    {entry.tags?.length ? (
                      <div className="d-flex flex-wrap gap-1">
                        {entry.tags.map((tag) => (
                          <span className="badge text-bg-secondary" key={tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {entry.repo ? (
                      <a
                        className="small font-monospace link-secondary text-decoration-none text-truncate"
                        href={entry.repo}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Icon name="github" size={14} className="me-1" />
                        {entry.repo.replace(/^https?:\/\/github\.com\//, "")}
                      </a>
                    ) : null}

                    <div className="d-flex align-items-center gap-2 mt-auto pt-1">
                      {installed ? (
                        <Link
                          className="btn btn-primary btn-sm"
                          href={`/apps/${entry.id}`}
                        >
                          Manage
                        </Link>
                      ) : entry.builtin ? (
                        <button
                          className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
                          onClick={() =>
                            void run(() => api.restoreBuiltin(entry.id))
                          }
                        >
                          <Icon name="power" size={15} />
                          Restore
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
                          onClick={() => setInstallTarget(entry)}
                        >
                          <Icon name="github" size={15} />
                          Install
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      )}

      <InstallDialog
        open={Boolean(installTarget)}
        initialUrl={installTarget?.repo ?? ""}
        onClose={() => setInstallTarget(null)}
        onInstalled={() => {
          void refresh();
          setInstallTarget(null);
        }}
      />

      <JobPanel job={job} onDismiss={clear} />
    </>
  );
}
