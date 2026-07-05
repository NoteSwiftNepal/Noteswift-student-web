"use server";

import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

function getBaseUrl() {
  if (!BASE_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not set in environment variables.");
  }
  return BASE_URL;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const cookieStore = await cookies();
  const token = cookieStore.get("teacherToken")?.value;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiGet<T = unknown>(path: string): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getBaseUrl()}${path}`, { method: "GET", headers, cache: "no-store" });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error?.message ?? `GET ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPost<T = unknown>(path: string, body: unknown): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getBaseUrl()}${path}`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error?.message ?? `POST ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPatch<T = unknown>(path: string, body: unknown): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getBaseUrl()}${path}`, { method: "PATCH", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error?.message ?? `PATCH ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiDelete<T = unknown>(path: string): Promise<T> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${getBaseUrl()}${path}`, { method: "DELETE", headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error?.message ?? `DELETE ${path} failed: ${res.status}`);
  }
  return res.json();
}

export async function apiPostForm<T = unknown>(path: string, form: FormData): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get("teacherToken")?.value;
  const res = await fetch(`${getBaseUrl()}${path}`, {
    method: "POST",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: form,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error?.message ?? `POST (form) ${path} failed: ${res.status}`);
  }
  return res.json();
}
