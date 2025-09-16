import type { ReporteProductividadMedico, IngresoServicioItem } from "../model/types";

const RAW_BASE =
  (import.meta.env.VITE_FACTURAS_BASE as string | undefined) ??
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";
const BASE = RAW_BASE.replace(/\/+$/, "");

function reportesUrl(path = "") {
  const b = BASE.replace(/\/+$/, "");
  return /\/api\/Reportes(\/|$)?/i.test(b) ? `${b}${path}` : `${b}/api/Reportes${path}`;
}

async function ensureJson(res: Response, url: string) {
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const txt = await res.text();
  if (!res.ok) throw new Error(txt || `HTTP ${res.status} ${res.statusText} @ ${url}`);
  if (!txt.trim()) return null;
  if (!ct.includes("application/json")) throw new Error(`Respuesta no-JSON en ${url}: ${txt.slice(0,200)}`);
  return JSON.parse(txt);
}

// GET /api/Reportes/productividad-medicos
export async function fetchProductividadMedicos(params: {
  desde: string;
  hasta: string;
  idMedico?: number;
  signal?: AbortSignal;
}): Promise<ReporteProductividadMedico[]> {
  const url = new URL(reportesUrl("/productividad-medicos"));
  url.searchParams.set("desde", params.desde);
  url.searchParams.set("hasta", params.hasta);
  if (params.idMedico) url.searchParams.set("idMedico", String(params.idMedico));

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" }, signal: params.signal });
  const json = await ensureJson(res, url.toString());
  const arr: any[] = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];

  return arr.map((r) => ({
    IdMedico: r.IdMedico ?? r.idMedico ?? r.id_medico,
    NombreMedico: r.NombreMedico ?? r.nombreMedico ?? r.medico ?? "—",
    Especialidad: r.Especialidad ?? r.especialidad ?? null,

    CitasProgramadas: Number(r.CitasProgramadas ?? r.citasProgramadas ?? r.TotalCitas ?? 0),
    CitasAtendidas: Number(r.CitasAtendidas ?? r.citasAtendidas ?? 0),
    CitasCanceladas: Number(r.CitasCanceladas ?? r.citasCanceladas ?? 0),
    CitasNoAsistidas: Number(r.CitasNoAsistidas ?? r.citasNoAsistidas ?? 0),

    PacientesAtendidos: Number(r.PacientesAtendidos ?? r.pacientesAtendidos ?? 0),
    ProcedimientosRealizados: Number(r.ProcedimientosRealizados ?? r.procedimientosRealizados ?? 0),
    IngresosGenerados: Number(r.IngresosGenerados ?? r.ingresosGenerados ?? 0),
    ProductividadCitasDia: Number(r.ProductividadCitasDia ?? r.productividadCitasDia ?? 0),

    TasaCancelacionPct: r.TasaCancelacionPct ?? r.tasaCancelacionPct,
    TasaNoShowPct: r.TasaNoShowPct ?? r.tasaNoShowPct,
    TasaAtencionPct: r.TasaAtencionPct ?? r.tasaAtencionPct,
  }));
}

//GET /api/Reportes/ingresos-por-servicio
export async function fetchIngresosPorServicio({
  desde,
  hasta,
  idMedico,
  signal,
}: {
  desde: string;
  hasta: string;
  idMedico?: number;
  signal?: AbortSignal;
}): Promise<IngresoServicioItem[]> {
  const url = new URL(reportesUrl("/ingresos-por-servicio"));
  url.searchParams.set("desde", desde);
  url.searchParams.set("hasta", hasta);

  if (idMedico != null) {
    url.searchParams.set("id_medico", String(idMedico));
    url.searchParams.set("idMedico", String(idMedico)); 
  }

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" }, signal });
  const json = await ensureJson(res, url.toString());
  const arr: any[] = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];

  const rows = arr.map((x) => ({
    procedimiento: x.procedimiento ?? x.nombre ?? "—",
    cantidad: Number(x.cantidad ?? x.qty ?? 0),
    total: Number(x.total ?? x.totalQ ?? 0),
  }));

  return rows.sort((a, b) => b.total - a.total).slice(0, 5);
}
