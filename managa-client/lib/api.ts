import {
  ApiError,
  AppView,
  CatalogEntry,
  ComponentKind,
  InstallInput,
  Job,
  LogsResult,
} from "./types";

const DEFAULT_PORT = 5100;

export function apiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_MANAGA_API_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${DEFAULT_PORT}`;
  }

  return `http://localhost:${DEFAULT_PORT}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    throw new ApiError(
      `Cannot reach the managa server at ${apiBaseUrl()}. Is managa-server running?`,
    );
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      message =
        body?.message ??
        body?.error ??
        (Array.isArray(body?.message) ? body.message.join(", ") : message);
      if (Array.isArray(message)) message = message.join(", ");
    } catch {
      // Keep the status-based message.
    }
    throw new ApiError(String(message), response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  listApps: () => request<AppView[]>("/appmanager/apps"),

  getApp: (id: string) =>
    request<AppView>(`/appmanager/apps/${encodeURIComponent(id)}`),

  install: (input: InstallInput) =>
    request<Job>("/appmanager/apps/install", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  start: (id: string) =>
    request<Job>(`/appmanager/apps/${encodeURIComponent(id)}/start`, {
      method: "POST",
    }),

  stop: (id: string) =>
    request<Job>(`/appmanager/apps/${encodeURIComponent(id)}/stop`, {
      method: "POST",
    }),

  toggle: (id: string, enabled: boolean) =>
    request<Job>(`/appmanager/apps/${encodeURIComponent(id)}/toggle`, {
      method: "POST",
      body: JSON.stringify({ enabled }),
    }),

  rebuild: (id: string) =>
    request<Job>(`/appmanager/apps/${encodeURIComponent(id)}/rebuild`, {
      method: "POST",
    }),

  uninstall: (id: string, purgeData = false) =>
    request<Job>(
      `/appmanager/apps/${encodeURIComponent(id)}?purgeData=${purgeData}`,
      { method: "DELETE" },
    ),

  restoreBuiltin: (id: string) =>
    request<Job>(
      `/appmanager/builtins/${encodeURIComponent(id)}/install`,
      { method: "POST" },
    ),

  catalog: () => request<{ apps: CatalogEntry[] }>("/appmanager/catalog"),

  job: (id: string) =>
    request<Job>(`/appmanager/jobs/${encodeURIComponent(id)}`),

  jobs: () => request<Job[]>("/appmanager/jobs"),

  logs: (id: string, component: ComponentKind, lines = 300) =>
    request<LogsResult>(
      `/appmanager/apps/${encodeURIComponent(id)}/logs?component=${component}&lines=${lines}`,
    ),
};
