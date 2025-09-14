import type { HistorialItem, HistorialTipo } from "../model/types";

const API_BASE   = import.meta.env.PROD ? ((import.meta.env.VITE_API_BASE_URL  as string | undefined)?.replace(/\/+$/, "") ?? "") : "";
const CITAS_BASE = import.meta.env.PROD ? ((import.meta.env.VITE_CITAS_BASE    as string | undefined)?.replace(/\/+$/, "") ?? "") : "";

/* ------------------------ helpers ------------------------ */
function authHeaders(): HeadersInit {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function toISO(v: any): string {
  try { return new Date(v ?? Date.now()).toISOString(); }
  catch { return new Date().toISOString(); }
}

function joinUrl(base: string, path: string): string {
  const b = (base || "").replace(/\/+$/, "");
  const p = `/${(path || "").replace(/^\/+/, "")}`;
  return `${b}${p}`;
}

async function getJSON(url: string): Promise<any> {
  const res = await fetch(url, { headers: { Accept: "application/json", ...authHeaders() }});
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data?.items ?? data?.data ?? data;
}

const getApiJSON   = (path: string) => getJSON(joinUrl(API_BASE,   path));
const getCitasJSON = (path: string) => getJSON(joinUrl(CITAS_BASE, path));


function asConsulta(r: any): HistorialItem {
  return {
    id: Number(r.id_consulta ?? r.idConsulta ?? r.id ?? Math.random() * 1e9),
    fecha: toISO(r.fecha),
    tipo: "CONSULTA",
    titulo: r.motivo_consulta || r.diagnostico || "Consulta",
    detalle: r.observaciones || "",
    meta: { ...r, idConsulta: r.id_consulta ?? r.idConsulta ?? r.id },
  };
}

function asReceta(r: any, fallbackFecha?: string): HistorialItem {
  const resumen = [r.medicamento, r.dosis, r.frecuencia, r.duracion].filter(Boolean).join(" · ");
  return {
    id: Number(r.id_receta ?? r.idReceta ?? r.id ?? Math.random() * 1e9),
    fecha: toISO(r.fecha ?? r.createdAt ?? fallbackFecha ?? Date.now()),
    tipo: "RECETA",
    titulo: resumen || "Receta",
    detalle: "",
    meta: r,
  };
}

function asProcedimiento(r: any, fallbackFecha?: string): HistorialItem {
  return {
    id: Number(r.id_procedimiento ?? r.idProcedimiento ?? r.id ?? Math.random() * 1e9),
    fecha: toISO(r.fecha ?? r.createdAt ?? fallbackFecha ?? Date.now()),
    tipo: "PROCEDIMIENTO",
    titulo: r.procedimiento || "Procedimiento",
    detalle: r.descripcion || "",
    meta: r,
  };
}

/* ------------------- llamadas a la API ------------------- */
async function fetchConsultas(idPaciente: number): Promise<HistorialItem[]> {
  const rows = await getApiJSON(`/api/Pacientes/${idPaciente}/consultas`);
  return rows.map(asConsulta);
}

async function fetchRecetasPorConsulta(idConsulta: number): Promise<any[]> {
  const resp = await getCitasJSON(`/api/recetas/consulta/${idConsulta}`);
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.data)) return resp.data;
  return [];
}

async function fetchProcedimientosPorConsulta(idPaciente: number, idConsulta: number): Promise<any[]> {
  const resp = await getApiJSON(`/api/Pacientes/${idPaciente}/consultas/${idConsulta}/procedimientos?page=1&pageSize=50`);
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp?.items)) return resp.items;
  return [];
}

/* ----------------- orquestador principal ----------------- */
export async function fetchHistorialPaciente(
  idPaciente: number,
  filter: "todos" | HistorialTipo
): Promise<HistorialItem[]> {

  const consultasRaw = await fetchConsultas(idPaciente);

  const seenCons = new Set<number | string>();
  const consultas = consultasRaw.filter(c => {
    const idc = c.meta?.idConsulta ?? c.id;
    const key = String(idc);
    if (seenCons.has(key)) return false;
    seenCons.add(key);
    return true;
  });

  if (filter === "CONSULTA") {
    return consultas.sort((a, b) => (a.fecha > b.fecha ? -1 : 1));
  }

  const buildRecetas = async () => {
    const out: HistorialItem[] = [];
    for (const c of consultas) {
      const idc = c.meta?.idConsulta ?? c.id;
      const rs = await fetchRecetasPorConsulta(idc);
      rs.forEach(r => {
        const it = asReceta(r, c.fecha);
        it.meta = { ...it.meta, idConsulta: idc };
        out.push(it);
      });
    }
    const seen = new Set<number | string>();
    return out.filter(x => {
      const idr = x.meta?.id_receta ?? x.meta?.idReceta ?? x.id;
      const key = String(idr);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const buildProcs = async () => {
    const out: HistorialItem[] = [];
    for (const c of consultas) {
      const idc = c.meta?.idConsulta ?? c.id;
      const ps = await fetchProcedimientosPorConsulta(idPaciente, idc);
      ps.forEach(p => {
        const it = asProcedimiento(p, c.fecha);
        it.meta = { ...it.meta, idConsulta: idc };
        out.push(it);
      });
    }

    const seen = new Set<number | string>();
    return out.filter(x => {
      const idp = x.meta?.id_procedimiento ?? x.meta?.idProcedimiento ?? x.id;
      const key = String(idp);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  if (filter === "RECETA") {
    const recetas = await buildRecetas();
    return recetas.sort((a, b) => (a.fecha > b.fecha ? -1 : 1));
  }

  if (filter === "PROCEDIMIENTO") {
    const procs = await buildProcs();
    return procs.sort((a, b) => (a.fecha > b.fecha ? -1 : 1));
  }

  const [recetas, procs] = await Promise.all([buildRecetas(), buildProcs()]);
  return [...consultas, ...recetas, ...procs].sort((a, b) => (a.fecha > b.fecha ? -1 : 1));
}
