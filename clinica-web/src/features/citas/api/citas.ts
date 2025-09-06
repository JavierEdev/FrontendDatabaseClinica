// src/features/citas/api/citas.ts
export type CitaEstado = "CONFIRMADA" | "CANCELADA" | "PENDIENTE";

export interface Cita {
  id: number;
  idMedico: number;
  fecha: string;
  estado: CitaEstado;
}

interface RawCita {
  idCita: number;
  idPaciente: number;
  idMedico: number;
  fecha: string;
  estado: string; // "confirmada" | "cancelada" | "pendiente"
}

const RAW =
  (import.meta.env.VITE_CITAS_BASE as string | undefined) ??
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  ""; // usando lo del .env

const BASE = RAW.replace(/\/+$/, "");

function buildPacienteUrl(idPaciente: number): string {
  if (/\/api\/citas(\/|$)/i.test(BASE)) return `${BASE}/paciente/${idPaciente}`;
  if (/\/api(\/|$)/i.test(BASE)) return `${BASE}/citas/paciente/${idPaciente}`;
  return `${BASE}/api/citas/paciente/${idPaciente}`;
}

function normalizarEstado(s?: string): CitaEstado {
  const v = String(s ?? "").toLowerCase();
  if (v === "confirmada") return "CONFIRMADA";
  if (v === "cancelada") return "CANCELADA";
  return "PENDIENTE";
}

export async function fetchCitasPorPaciente(
  idPaciente: number,
  signal?: AbortSignal
): Promise<Cita[]> {
  const url = buildPacienteUrl(idPaciente);
  if (import.meta.env.DEV) console.log("[citas] GET", url);

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} en ${url}. ${body.slice(0, 200)}`);
  }

  if (res.status === 204) return [];

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const text = await res.text();

  if (!text.trim()) return [];

  if (!ct.includes("application/json")) {
    throw new Error(`Respuesta no-JSON (${ct || "sin content-type"}) en ${url}: ${text.slice(0, 200)}`);
  }

  const arr = JSON.parse(text) as RawCita[];
  return arr.map((r) => ({
    id: r.idCita,
    idMedico: r.idMedico,
    fecha: r.fecha,
    estado: normalizarEstado(r.estado),
  }));
}
