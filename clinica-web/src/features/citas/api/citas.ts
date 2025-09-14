import type {
  CitaEstado,
  CrearCitaRequest,
  CrearCitaApiResponse,
  CitaPacienteApi as RawCita,
  APICitaGeneral as RawCitaGeneral,
  CitaPaciente,
  APICitaAdmin as CitaAdmin,
  CitaDetalle
} from "@/features/citas/model/citas";

// ---------- ENV / BASE URL ----------
const RAW_BASE =
  (import.meta.env.VITE_CITAS_BASE as string | undefined) ??
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  ""; // usando lo del .env o relativo

const BASE = RAW_BASE.replace(/\/+$/, "");

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
  if (v === "reprogramada") return "REPROGRAMADA";
  if (v === "pagada") return "PAGADA"; 
  return "PENDIENTE";
}

async function ensureJson(res: Response, url: string): Promise<string> {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} en ${url}. ${text.slice(0, 300)}`);
  }
  if (!text.trim()) return "[]"; // permite manejar 204 sin body como array vacío
  if (!ct.includes("application/json")) {
    throw new Error(`Respuesta no-JSON (${ct || "sin content-type"}) en ${url}: ${text.slice(0, 300)}`);
  }
  return text;
}

// ---------- GET /api/citas/paciente/:id ----------
export async function fetchCitasPorPaciente(
  idPaciente: number,
  signal?: AbortSignal
): Promise<CitaPaciente[]> {
  const url = buildPacienteUrl(idPaciente);
  if (import.meta.env.DEV) console.log("[citas] GET", url);

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  if (res.status === 204) return [];

  const text = await ensureJson(res, url);
  const arr = JSON.parse(text) as RawCita[]; // esperamos un array raw
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

  const text = await ensureJson(res, url);
  return JSON.parse(text) as CrearCitaApiResponse;
}

// ---------- GET /api/citas (todas) ----------
export async function fetchTodasCitas(signal?: AbortSignal): Promise<CitaAdmin[]> {
  const url = buildCitasUrl();
  if (import.meta.env.DEV) console.log("[citas] GET", url);

  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  const text = await ensureJson(res, url);
  // Tu backend: { success, message, data: RawCitaGeneral[] }
  const json = JSON.parse(text) as {
    success: boolean;
    message?: string;
    data?: RawCitaGeneral[];
  };

  if (!json.success) throw new Error(json.message || "Error al obtener citas");
  const data = Array.isArray(json.data) ? json.data : [];

  return data.map((r) => ({
    id: r.idCita,
    idPaciente: r.idPaciente,
    idMedico: r.idMedico,
    fecha: r.fecha,
    estado: normalizarEstado(r.estado),
    medicoNombre: r.medicoNombre,
    especialidad: r.especialidad,
  }));
}

function buildCitaDetalleUrl(idPaciente: number, idCita: number): string {
  return `${buildCitasUrl()}/paciente/${idPaciente}/${idCita}`;
}

export async function fetchCitaDetalle(
  idPaciente: number,
  idCita: number,
  signal?: AbortSignal
): Promise<CitaDetalle> {
  const url = buildCitaDetalleUrl(idPaciente, idCita);
  if (import.meta.env.DEV) console.log("[citas] GET", url);

  const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" }, signal });
  const text = await ensureJson(res, url);

  const raw = JSON.parse(text);
  const r = raw?.data ?? raw;

  return {
    id: r.idCita,
    idPaciente: r.idPaciente,
    idMedico: r.idMedico,
    fecha: r.fecha,
    estado: normalizarEstado(r.estado),
    medicoNombre: r.medicoNombre,
    especialidad: r.especialidad,
  };
}


export async function cancelarCita(
  idCita: number,
  razon: string,
  signal?: AbortSignal
): Promise<{ success: boolean; message?: string; data?: { idCita: number; razon: string } }> {
  const url = `${buildCitasUrl()}/${idCita}/cancelar`;
  if (import.meta.env.DEV) console.log("[citas] POST", url, { razon });

  const res = await fetch(url, {
    method: "POST", // si tu backend usa PUT, cambia aquí a "PUT"
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ razon }),
    signal,
  });

  const text = await ensureJson(res, url);
  const json = JSON.parse(text);
  if (json?.success === false) throw new Error(json?.message || "No se pudo cancelar la cita");
  return json;
}

export async function reprogramarCita(
  idCita: number,
  nuevaFechaIso: string,
  motivo: string,
  signal?: AbortSignal
): Promise<boolean> {
  const url = `${buildCitasUrl()}/${idCita}/reprogramar`;
  if (import.meta.env.DEV) console.log("[citas] POST", url, { nuevaFecha: nuevaFechaIso, motivo });

  const res = await fetch(url, {
    method: "POST", // si tu backend usa PUT, cámbialo a "PUT"
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ nuevaFecha: nuevaFechaIso, motivo }),
    signal,
  });

  const text = await ensureJson(res, url);
  const json = JSON.parse(text);
  return Boolean(json?.success);
}
