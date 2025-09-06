import type { Medico } from "@/features/medicos/models/Medico";
import type { ApiListResponse } from "@/features/medicos/models/Api";
import type { DisponibilidadDia } from "@/features/medicos/models/Disponibilidad";

const API_BASE = (import.meta.env.VITE_CITAS_BASE ?? "").replace(/\/$/, "");

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getMedicos(opts?: { signal?: AbortSignal }): Promise<Medico[]> {
  const url = `${API_BASE}/api/medicos`;

  const headers: HeadersInit = {
    Accept: "application/json",
    ...authHeaders(),
  };

  const res = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
    signal: opts?.signal,
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as ApiListResponse<Medico[]>;
  if (!json.success) throw new Error(json.message || "No se pudo obtener médicos");
  return json.data ?? [];
}

export async function getDisponibilidadMedico(
  id: number,
  fechaDateTime: string,
  opts?: { signal?: AbortSignal }
): Promise<DisponibilidadDia[]> {
  const url = `${API_BASE}/api/medicos/${encodeURIComponent(
    id
  )}/disponibilidad?fecha=${encodeURIComponent(fechaDateTime)}`;

  const headers: HeadersInit = {
    Accept: "application/json",
    ...authHeaders(),
  };

  const res = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
    signal: opts?.signal,
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as ApiListResponse<DisponibilidadDia[]>;
  if (!json.success) throw new Error(json.message || "No se pudo obtener la disponibilidad");
  return json.data ?? [];
}
