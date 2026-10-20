export type ComponentKind = 'client' | 'server';

export type RuntimeStatus =
  | 'stopped'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'error';

export type JobType =
  | 'install'
  | 'start'
  | 'stop'
  | 'uninstall'
  | 'rebuild'
  | 'auto-start';

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface ComponentManifest {
  /** Directory of the component, relative to the app root. */
  dir: string;
  /** Command used to start the component. */
  start: string;
  /** Optional dependency installation command. */
  install?: string;
  /** Optional production build command. */
  build?: string;
  /** Suggested port. managa re-allocates if the port is taken. */
  port?: number;
  /** Health endpoint used while booting. Defaults to `/`. */
  healthPath?: string;
  /** How long to wait for the health endpoint before giving up. */
  readyTimeoutMs?: number;
  /** Build artefact that should exist after `build` (e.g. `.next` or `dist`). */
  buildOutput?: string;
  /** Environment variables. Supports {{tokens}} documented in the README. */
  env?: Record<string, string>;
}

export interface AppManifest {
  id?: string;
  name: string;
  description?: string;
  version?: string;
  author?: string;
  icon?: string;
  homepage?: string;
  repository?: string;
  tags?: string[];
  client?: ComponentManifest;
  server?: ComponentManifest;
}

export type AppSource =
  | { type: 'builtin'; manifestPath: string }
  | { type: 'github'; url: string; ref?: string; commit?: string };

export interface ComponentState {
  port: number;
  status: RuntimeStatus;
  pid?: number;
  url?: string;
  startedAt?: string;
  lastError?: string;
  /** Hash of the resolved environment used for the last build. */
  buildEnvHash?: string;
  preparedAt?: string;
}

export interface AppRecord {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  icon: string;
  tags: string[];
  manifest: AppManifest;
  manifestPath: string;
  rootDir: string;
  source: AppSource;
  installedAt: string;
  updatedAt: string;
  /** Desired state: apps that are on are re-started when managa-server starts. */
  enabled: boolean;
  client?: ComponentState;
  server?: ComponentState;
}

export interface RegistryFile {
  version: 1;
  apps: AppRecord[];
  removedBuiltins: string[];
}

export interface Job {
  id: string;
  type: JobType;
  title: string;
  appId?: string;
  status: JobStatus;
  message: string;
  progress: number;
  logs: string[];
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
}

export interface AppComponentView {
  kind: ComponentKind;
  dir: string;
  startCommand: string;
  status: RuntimeStatus;
  port: number;
  url: string;
  pid?: number;
  startedAt?: string;
  lastError?: string;
}

export interface AppView {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  icon: string;
  tags: string[];
  source: AppSource;
  installedAt: string;
  updatedAt: string;
  enabled: boolean;
  overallStatus: 'running' | 'partial' | 'stopped' | 'transitioning' | 'error';
  openUrl?: string;
  client?: AppComponentView;
  server?: AppComponentView;
  manifest: AppManifest;
}

export interface LogsResult {
  appId: string;
  component: ComponentKind;
  path: string;
  lines: string[];
}

export interface CatalogEntry {
  id: string;
  name: string;
  description?: string;
  version?: string;
  icon?: string;
  tags?: string[];
  repo?: string;
  ref?: string;
  builtin?: boolean;
  installed?: boolean;
}

export interface CatalogFile {
  apps: CatalogEntry[];
}
