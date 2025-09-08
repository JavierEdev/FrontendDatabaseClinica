// src/features/citas/api/citas.ts

import type {
  CitaEstado,
  CrearCitaRequest,
  CrearCitaApiResponse,
  CitaPacienteApi as RawCita,
} from "@/features/citas/model/citas";

export type Cita = {
  id: number;
  idMedico: number;
  fecha: string;
  estado: CitaEstado;
};

// ---------- ENV / BASE URL ----------
const RAW =
  (import.meta.env.VITE_CITAS_BASE as string | undefined) ??
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  ""; // usando lo del .env

const BASE = RAW.replace(/\/+$/, "");

// Base para /api/citas (soporta distintas formas de BASE)
function buildCitasUrl(): string {
  const base = BASE.replace(/\/+$/, "");
  if (/\/api\/citas(\/|$)?$/i.test(base)) return base;   // .../api/citas
  if (/\/api(\/|$)/i.test(base)) return `${base}/citas`; // .../api → .../api/citas
  return `${base}/api/citas`;                             // ... → .../api/citas
}

function buildPacienteUrl(idPaciente: number): string {
  return `${buildCitasUrl()}/paciente/${idPaciente}`;
}

// ---------- Helpers ----------
function normalizarEstado(s?: string): CitaEstado {
  const v = String(s ?? "").toLowerCase();
  if (v === "confirmada") return "CONFIRMADA";
  if (v === "cancelada") return "CANCELADA";
  return "PENDIENTE";
}

// ---------- GET /api/citas/paciente/:id ----------
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

// ---------- POST /api/citas ----------
export async function crearCita(
  payload: CrearCitaRequest,
  signal?: AbortSignal
): Promise<CrearCitaApiResponse> {
  const url = buildCitasUrl();
  if (import.meta.env.DEV) console.log("[citas] POST", url, payload);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} en ${url}. ${text.slice(0, 300)}`);
  }
  if (!ct.includes("application/json")) {
    throw new Error(`Respuesta no-JSON (${ct || "sin content-type"}) en ${url}: ${text.slice(0, 300)}`);
  }

  return JSON.parse(text) as CrearCitaApiResponse;
}
