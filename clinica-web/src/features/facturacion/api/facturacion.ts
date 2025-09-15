// src/features/facturacion/api/facturacion.ts
import { api } from "@/features/auth/api/api";

/* ================== BASES ================== */
const RAW_FACT_BASE =
  (import.meta.env.VITE_FACTURAS_BASE as string | undefined) ?? "";
const FACT_BASE = RAW_FACT_BASE.replace(/\/+$/, ""); // p. ej. http://localhost:5217

// Base “general” (tu backend principal) para /api/Pacientes/...
const RAW_API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

/* Helpers para URL */
function factUrl(path: string) {
  // asegura /api/Facturacion
  const base = FACT_BASE.replace(/\/+$/, "");
  return /\/api\/Facturacion/i.test(base)
    ? `${base}${path}`
    : `${base}/api/Facturacion${path}`;
}
function pacientesUrl(path: string) {
  const base = API_BASE.replace(/\/+$/, "");
  return /\/api(\/|$)/i.test(base) ? `${base}${path}` : `${base}/api${path}`;
}

async function ensureJson(res: Response, url: string) {
  const text = await res.text();
  if (!res.ok) throw new Error(text || `HTTP ${res.status} ${res.statusText} @ ${url}`);
  return text ? JSON.parse(text) : null;
}

/* ================== Tipos ================== */
export type ConsultaItem = {
  idConsulta: number;
  idPaciente: number;
  idMedico: number;
  idCita: number;
  fecha: string;
  motivoConsulta: string;
  diagnostico: string;
  observaciones?: string;
};

export type Factura = {
  id_factura: number;
  id_paciente: number;
  fecha_emision: string;
  monto_total: number;
  estado_pago: "pendiente" | "pagada" | (string & {});
  tipo_pago: "efectivo" | "tarjeta" | "transferencia" | (string & {});
  lineas?: { procedimiento: string; precio: number }[];
};

export type GenerarFacturaRequest = {
  id_paciente: number;
  id_consulta: number;
  tipo_pago: "efectivo" | "tarjeta" | "transferencia";
};

export type PagoRequest = {
  id_factura: number;
  monto: number;
  metodo_pago: "efectivo" | "tarjeta" | "transferencia" | (string & {});
  fecha_pago: string; // ISO
};

export type PagoResponse = {
  id_pago: number;
  id_factura: number;
  monto: number;
  metodo_pago: string;
  fecha_pago: string;
  total_pagado: number;
  saldo_pendiente: number;
  estado_factura: "pendiente" | "pagada" | (string & {});
};

/* ========== API: consultas del paciente (VA AL BACK PRINCIPAL) ========== */
export async function listarConsultasDePaciente(
  idPaciente: number,
  page = 1,
  pageSize = 50,
  signal?: AbortSignal
): Promise<ConsultaItem[]> {
  // usa el helper api() que ya mete Authorization y BASE general
  const url = pacientesUrl(`/Pacientes/${idPaciente}/consultas?page=${page}&pageSize=${pageSize}`);
  const json = await api<any>(url, { method: "GET", auth: true, signal });
  const r = json?.data ?? json;
  return Array.isArray(r?.items) ? (r.items as ConsultaItem[]) : [];
}

/* ========== API: facturación (USA VITE_FACTURAS_BASE) ========== */
export async function getTotalConsulta(
  idConsulta: number,
  signal?: AbortSignal
): Promise<number | null> {
  const url = factUrl(`/consulta/${idConsulta}/total`);
  const res = await fetch(url, { headers: { Accept: "application/json" }, signal });
  const json = await ensureJson(res, url);
  return typeof json?.total === "number" ? json.total : null;
}

export async function generarFactura(
  body: GenerarFacturaRequest,
  signal?: AbortSignal
): Promise<Factura> {
  const url = factUrl(`/generar`);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const json = await ensureJson(res, url);
  return json as Factura;
}

export async function pagarFactura(
  body: PagoRequest,
  signal?: AbortSignal
): Promise<PagoResponse> {
  const url = factUrl(`/pagos`);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const json = await ensureJson(res, url);
  return json as PagoResponse;
}
