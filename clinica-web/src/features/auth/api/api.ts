import type {
  ApiError,
  LoginResponse,
  Session,
  RefreshResponse,
} from "../model/auth";
import { normalizeRole } from "../model/roles";
import { setAuth } from "../lib/storage";

const BASE = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

type ApiInit = Omit<RequestInit, "headers"> & {
  auth?: boolean;
  headers?: Record<string, string>;
};

let refreshing: Promise<boolean> | null = null;

export async function api<T = unknown>(
  path: string,
  init: ApiInit = {},
  retry = true
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers ?? {}),
  };

  if (init.auth) {
    const t = localStorage.getItem("accessToken");
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 401 && init.auth && retry) {
    const ok = await refreshToken();
    if (!ok) {
      logout();
      throw new Error("Sesión expirada");
    }
    return api<T>(path, init, false);
  }

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const e = (await res.json()) as ApiError;
      msg = e.error || e.message || msg;
    } catch {}
    throw new Error(msg);
  }

  const ct = res.headers.get("content-type") ?? "";
  return (
    ct.includes("application/json") ? res.json() : res.text()
  ) as Promise<T>;
}

export async function login(
  username: string,
  password: string
): Promise<Session> {
  const data = await api<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  const roleNorm = normalizeRole(data.role);

  setAuth(data.accessToken, roleNorm);
  if (data.refreshToken)
    localStorage.setItem("refreshToken", data.refreshToken);

  const session: Session = {
    ...data,
    role: roleNorm,
    roleRaw: String(data.role ?? ""),
  };

  localStorage.setItem(
    "user",
    JSON.stringify({
      id: session.userId,
      username: session.username,
      role: session.role,
      roleRaw: session.roleRaw,
    })
  );

  return session;
}

async function refreshToken(): Promise<boolean> {
  if (refreshing) return refreshing;

  const rt = localStorage.getItem("refreshToken");
  const user = JSON.parse(localStorage.getItem("user") || "{}") as {
    id?: number;
  };
  if (!rt || !user?.id) return false;

  const p: Promise<boolean> = fetch(`${BASE}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user.id, refreshToken: rt }),
  })
    .then(async (r) => {
      if (!r.ok) return false;
      const data = (await r.json()) as RefreshResponse;
      localStorage.setItem("accessToken", data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken); // ← solo si viene
      }
      return true;
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });

  refreshing = p;
  return p;
}

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  window.location.href = "/";
}
