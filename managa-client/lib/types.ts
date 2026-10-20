export type ComponentKind = "client" | "server";

export type RuntimeStatus =
  | "stopped"
  | "starting"
  | "running"
  | "stopping"
  | "error";

export type OverallStatus =
  | "running"
  | "partial"
  | "stopped"
  | "transitioning"
  | "error";

export type JobStatus = "queued" | "running" | "succeeded" | "failed";

export type JobType =
  | "install"
  | "start"
  | "stop"
  | "uninstall"
  | "rebuild"
  | "auto-start";

export interface ComponentManifest {
  dir: string;
  start: string;
  install?: string;
  build?: string;
  port?: number;
  healthPath?: string;
  buildOutput?: string;
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
  | { type: "builtin"; manifestPath: string }
  | { type: "github"; url: string; ref?: string; commit?: string };

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
  overallStatus: OverallStatus;
  openUrl?: string;
  client?: AppComponentView;
  server?: AppComponentView;
  manifest: AppManifest;
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

export interface LogsResult {
  appId: string;
  component: ComponentKind;
  path: string;
  lines: string[];
}

export interface InstallInput {
  url: string;
  ref?: string;
  start?: boolean;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
