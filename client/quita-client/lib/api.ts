import type {
  Addiction,
  AddictionInput,
  Relapse,
  RelapseInput,
} from "./types";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4200"
).replace(/\/+$/, "");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (Array.isArray(body?.message)) message = body.message.join(", ");
      else if (typeof body?.message === "string") message = body.message;
      else if (typeof body?.error === "string") message = body.error;
    } catch {
      // keep the HTTP status fallback
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  listAddictions: () => request<Addiction[]>("/addictions"),
  getAddiction: (id: number) => request<Addiction>(`/addictions/${id}`),
  createAddiction: (input: AddictionInput) =>
    request<Addiction>("/addictions", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateAddiction: (id: number, input: Partial<AddictionInput>) =>
    request<Addiction>(`/addictions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deleteAddiction: (id: number) =>
    request<{ ok: boolean }>(`/addictions/${id}`, { method: "DELETE" }),

  listRelapses: (addictionId: number) =>
    request<Relapse[]>(`/addictions/${addictionId}/relapses`),
  createRelapse: (addictionId: number, input: RelapseInput) =>
    request<Relapse>(`/addictions/${addictionId}/relapses`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateRelapse: (
    addictionId: number,
    relapseId: number,
    input: Partial<RelapseInput>,
  ) =>
    request<Relapse>(`/addictions/${addictionId}/relapses/${relapseId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deleteRelapse: (addictionId: number, relapseId: number) =>
    request<{ ok: boolean }>(
      `/addictions/${addictionId}/relapses/${relapseId}`,
      { method: "DELETE" },
    ),
};
