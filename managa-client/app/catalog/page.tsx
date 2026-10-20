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
      <section className="section-head page-head">
        <div>
          <span className="eyebrow">
            <Icon name="layers" size={14} />
            Catalog
          </span>
          <h1>Compatible apps</h1>
          <p className="muted">
            Bundled apps ship with managa. Remote entries come from the optional{" "}
            <code>MANAGA_CATALOG_URL</code>; any GitHub repository with a{" "}
            <code>managa.app.json</code> manifest can also be installed
            directly.
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => void loadCatalog()}>
          <Icon name="refresh" size={15} />
          Refresh
        </button>
      </section>

      {notice ? (
        <div className="notice notice-info">
          <Icon name="sparkles" size={17} />
          <span>{notice}</span>
        </div>
      ) : null}

      {error ? <div className="notice notice-error">{error}</div> : null}

      {loading ? (
        <div className="app-grid">
          {[0, 1].map((index) => (
            <div className="app-card skeleton-card" key={index}>
              <span className="skeleton skeleton-title" />
              <span className="skeleton skeleton-line" />
              <span className="skeleton skeleton-block" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="panel">
          <h2>No catalog entries yet</h2>
          <p className="muted">
            Point <code>MANAGA_CATALOG_URL</code> at a JSON file to share a
            curated list of apps, or install any repository by URL.
          </p>
          <Link className="btn btn-primary" href="/install">
            <Icon name="github" size={16} />
            Install by URL
          </Link>
        </div>
      ) : (
        <div className="app-grid">
          {entries.map((entry) => {
            const installed = installedIds.has(entry.id);
            return (
              <article className="app-card catalog-card" key={entry.id}>
                <header className="app-card-head">
                  <div className="app-icon" aria-hidden="true">
                    {entry.icon || "📦"}
                  </div>
                  <div className="app-title">
                    <h3>{entry.name}</h3>
                    <span className="mono muted">
                      {entry.builtin ? "bundled" : "github"}
                      {entry.version ? ` · v${entry.version}` : ""}
                    </span>
                  </div>
                  {installed ? (
                    <span className="status-pill status-running">
                      <span className="status-dot" />
                      Installed
                    </span>
                  ) : null}
                </header>

                <p className="app-desc">
                  {entry.description || "No description provided."}
                </p>

                {entry.tags?.length ? (
                  <div className="tag-row">
                    {entry.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                {entry.repo ? (
                  <a
                    className="repo-link mono"
                    href={entry.repo}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icon name="github" size={14} />
                    {entry.repo.replace(/^https?:\/\/github\.com\//, "")}
                  </a>
                ) : null}

                <footer className="app-card-foot">
                  {installed ? (
                    <Link className="btn btn-primary btn-sm" href={`/apps/${entry.id}`}>
                      Manage
                    </Link>
                  ) : entry.builtin ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => void run(() => api.restoreBuiltin(entry.id))}
                    >
                      <Icon name="power" size={15} />
                      Restore
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setInstallTarget(entry)}
                    >
                      <Icon name="github" size={15} />
                      Install
                    </button>
                  )}
                </footer>
              </article>
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
