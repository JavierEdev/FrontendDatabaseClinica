// src/features/historial/api/historial.ts
import type { HistorialItem, HistorialTipo } from "../model/types";

/* ------------------------ bases desde .env ------------------------ */
const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ?? "";
const CITAS_BASE = (import.meta.env.VITE_CITAS_BASE as string | undefined)?.replace(/\/+$/, "") ?? "";

/* ------------------------ helpers ------------------------ */
function authHeaders(): HeadersInit {
  const token =
    localStorage.getItem("access_token") ||
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
  if (!base) {
    // Si falta la base, quedará relativo (útil para dev), pero avisamos.
    console.warn(`[historial.ts] Base URL vacía para ${path}. Verifica tus variables .env`);
  }
  return `${b}${p}`;
}

async function getJSON(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", ...authHeaders() },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data?.items ?? data?.data ?? data;
}

// Wrappers por servicio (evita repetir concatenaciones)
const getApiJSON   = (path: string) => getJSON(joinUrl(API_BASE, path));   // 5151 Pacientes-service
const getCitasJSON = (path: string) => getJSON(joinUrl(CITAS_BASE, path)); // 5092 Gestión Clínica

function fmtItemBase(r: any, tipo: HistorialTipo): HistorialItem {
  const fecha =
    r.fecha ??
    r.fechaConsulta ??
    r.fechaCita ??
    r.fechaReceta ??
    r.fechaDocumento ??
    r.createdAt ??
    r.date ??
    r.fechaAt ??
    Date.now();

  return {
    id: Number(
      r.id ??
      r.idConsulta ??
      r.idCita ??
      r.idReceta ??
      r.idDocumento ??
      r.historialId ??
      Math.floor(Math.random() * 1e9)
    ),
    fecha: toISO(fecha),
    tipo,
    titulo:
      r.titulo ??
      r.motivo ??
      r.descripcion ??
      r.detalle ??
      r.nombre ??
      r.estado ??
      "",
    detalle: r.detalle ?? r.notas ?? r.indicaciones ?? "",
    meta: r, // útil luego para “ver detalles”
  };
}

/* ------------------- lecturas por servicio ------------------- */

// 1) Pacientes-service (5151)
async function fetchConsultasPacientesService(idPaciente: number): Promise<HistorialItem[]> {
  const rows = await getApiJSON(`/api/Pacientes/${idPaciente}/consultas`);
  return rows.map((r: any) => {
    // forzamos “idConsulta” en meta para facilitar el match con recetas
    const it = fmtItemBase(r, "CONSULTA");
    it.meta = { ...it.meta, idConsulta: r.idConsulta ?? r.id ?? r.id_consulta };
    return it;
  });
}

// 2) Gestión Clínica (5092) – citas del paciente
async function fetchConsultasGestionClinica(idPaciente: number): Promise<HistorialItem[]> {
  const rows = await getCitasJSON(`/api/citas/paciente/${idPaciente}`);
  return rows
    // .filter((r: any) => (r.estado ?? "").toLowerCase() !== "cancelada")
    .map((r: any) => {
      const it = fmtItemBase(
        {
          ...r,
          fecha: r.fecha ?? r.fechaCita ?? r.fecha_programada ?? r.createdAt,
          titulo: r.motivo ?? r.procedimiento ?? r.estado ?? "Consulta",
        },
        "CONSULTA"
      );
      const idConsulta = r.idConsulta ?? r.id ?? r.idCita ?? r.id_cita;
      it.meta = { ...it.meta, idConsulta };
      return it;
    });
}

/** Recetas por cada consulta en Gestión Clínica (5092) */
async function fetchRecetasDeConsultas(consultas: HistorialItem[]): Promise<HistorialItem[]> {
  const out: HistorialItem[] = [];
  await Promise.all(
    consultas.map(async (c) => {
      const idConsulta = c.meta?.idConsulta ?? c.meta?.id ?? c.id;
      if (!idConsulta) return;
      try {
        const recetas = await getCitasJSON(`/api/recetas/consulta/${idConsulta}`);
        recetas.forEach((r: any) => out.push(fmtItemBase(r, "RECETA")));
      } catch {
        /* sin recetas para esa consulta */
      }
    })
  );
  return out;
}

/** Documentos (los mostramos como “IMAGEN”) – Pacientes-service (5151) */
async function fetchDocumentos(idPaciente: number): Promise<HistorialItem[]> {
  const rows = await getApiJSON(`/api/Pacientes/${idPaciente}/documentos`);
  return rows.map((r: any) => {
    const it = fmtItemBase(r, "IMAGEN");
    if (!it.titulo) it.titulo = r.nombreArchivo ?? r.tipoDocumento ?? "Documento";
    return it;
  });
}

/** Antecedentes médicos – Pacientes-service (5151) */
async function fetchAntecedentes(idPaciente: number): Promise<HistorialItem[]> {
  let rows: any[] = [];
  try {
    const r1 = await getApiJSON(`/api/Pacientes/${idPaciente}/antecedentes-medicos`);
    rows = Array.isArray(r1) ? r1 : r1 ? [r1] : [];
  } catch {
    try {
      const r2 = await getApiJSON(`/api/Pacientes/antecedentes-medicos?idPaciente=${idPaciente}`);
      rows = Array.isArray(r2) ? r2 : r2 ? [r2] : [];
    } catch {
      rows = [];
    }
  }
  return rows.map((r: any) => {
    const it = fmtItemBase(r, "ANTECEDENTE");
    if (!it.titulo) it.titulo = r.enfermedad ?? r.alergia ?? "Antecedente";
    return it;
  });
}

/* ----------------- orquestador principal ----------------- */
/**
 * Carga el historial del paciente aplicando filtro:
 *   - filter: "todos" | "CONSULTA" | "ANTECEDENTE" | "RECETA" | "IMAGEN"
 */
export async function fetchHistorialPaciente(
  idPaciente: number,
  filter: "todos" | HistorialTipo
): Promise<HistorialItem[]> {
  const tasks: Promise<HistorialItem[]>[] = [];

  // Siempre que necesitemos CONSULTAS o RECETAS, unimos ambas fuentes
  if (filter === "CONSULTA" || filter === "todos" || filter === "RECETA") {
    const [fromPacientes, fromGestion] = await Promise.allSettled([
      fetchConsultasPacientesService(idPaciente), // 5151
      fetchConsultasGestionClinica(idPaciente),   // 5092
    ]);

    const consultas: HistorialItem[] = [];
    const seen = new Set<string>();

    const pushUnique = (arr: HistorialItem[]) => {
      arr.forEach((it) => {
        const key = `CONS-${it.meta?.idConsulta ?? it.id}`;
        if (!seen.has(key)) { seen.add(key); consultas.push(it); }
      });
    };

    if (fromPacientes.status === "fulfilled") pushUnique(fromPacientes.value);
    if (fromGestion.status === "fulfilled") pushUnique(fromGestion.value);

    if (filter === "CONSULTA") {
      return consultas.sort((a, b) => (a.fecha > b.fecha ? -1 : 1));
    }
    if (filter === "RECETA") {
      const recetas = await fetchRecetasDeConsultas(consultas);
      return recetas.sort((a, b) => (a.fecha > b.fecha ? -1 : 1));
    }
    // “todos”: añadimos consultas y programamos recetas
    tasks.push(Promise.resolve(consultas));
    tasks.push(fetchRecetasDeConsultas(consultas));
  }

  if (filter === "IMAGEN" || filter === "todos") {
    tasks.push(fetchDocumentos(idPaciente)); // 5151
  }
  if (filter === "ANTECEDENTE" || filter === "todos") {
    tasks.push(fetchAntecedentes(idPaciente)); // 5151
  }

  const chunks = await Promise.all(tasks);
  return chunks.flat().sort((a, b) => (a.fecha > b.fecha ? -1 : 1));
}
