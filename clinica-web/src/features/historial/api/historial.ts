// src/features/historial/api/historial.ts
import type { HistorialItem, HistorialTipo } from "../model/types";

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

async function getJSON(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { Accept: "application/json", ...authHeaders() },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : data?.items ?? data?.data ?? data;
}

/* ------------------- lecturas por servicio ------------------- */

// 1) Pacientes-service (5151)
async function fetchConsultasPacientesService(idPaciente: number): Promise<HistorialItem[]> {
  const rows = await getJSON(`/api/Pacientes/${idPaciente}/consultas`);
  return rows.map((r: any) => {
    // forzamos “idConsulta” en meta para facilitar el match con recetas
    const it = fmtItemBase(r, "CONSULTA");
    it.meta = { ...it.meta, idConsulta: r.idConsulta ?? r.id ?? r.id_consulta };
    return it;
  });
}

// 2) Gestión Clínica (5092) – citas del paciente
async function fetchConsultasGestionClinica(idPaciente: number): Promise<HistorialItem[]> {
  const rows = await getJSON(`/api/citas/paciente/${idPaciente}`);
  return rows
    // si tu dominio marca canceladas, puedes filtrarlas aquí:
    // .filter((r: any) => (r.estado ?? "").toLowerCase() !== "cancelada")
    .map((r: any) => {
      const it = fmtItemBase(
        {
          ...r,
          // algunos payloads ponen la fecha en otra propiedad
          fecha: r.fecha ?? r.fechaCita ?? r.fecha_programada ?? r.createdAt,
          titulo: r.motivo ?? r.procedimiento ?? r.estado ?? "Consulta",
        },
        "CONSULTA"
      );
      // normalizamos id de consulta para poder buscar recetas
      const idConsulta = r.idConsulta ?? r.id ?? r.idCita ?? r.id_cita;
      it.meta = { ...it.meta, idConsulta };
      return it;
    });
}

/** Recetas por cada consulta en Gestión Clínica */
async function fetchRecetasDeConsultas(consultas: HistorialItem[]): Promise<HistorialItem[]> {
  const out: HistorialItem[] = [];
  await Promise.all(
    consultas.map(async (c) => {
      const idConsulta = c.meta?.idConsulta ?? c.meta?.id ?? c.id;
      if (!idConsulta) return;
      try {
        const recetas = await getJSON(`/api/recetas/consulta/${idConsulta}`);
        recetas.forEach((r: any) => out.push(fmtItemBase(r, "RECETA")));
      } catch {
        /* sin recetas para esa consulta */
      }
    })
  );
  return out;
}

/** Documentos (los mostramos como “IMAGEN”) */
async function fetchDocumentos(idPaciente: number): Promise<HistorialItem[]> {
  const rows = await getJSON(`/api/Pacientes/${idPaciente}/documentos`);
  return rows.map((r: any) => {
    const it = fmtItemBase(r, "IMAGEN");
    if (!it.titulo) it.titulo = r.nombreArchivo ?? r.tipoDocumento ?? "Documento";
    return it;
  });
}

/** Antecedentes médicos */
async function fetchAntecedentes(idPaciente: number): Promise<HistorialItem[]> {
  let rows: any[] = [];
  try {
    const r1 = await getJSON(`/api/Pacientes/${idPaciente}/antecedentes-medicos`);
    rows = Array.isArray(r1) ? r1 : r1 ? [r1] : [];
  } catch {
    try {
      const r2 = await getJSON(`/api/Pacientes/antecedentes-medicos?idPaciente=${idPaciente}`);
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
      fetchConsultasPacientesService(idPaciente),
      fetchConsultasGestionClinica(idPaciente),
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
    tasks.push(fetchDocumentos(idPaciente));
  }
  if (filter === "ANTECEDENTE" || filter === "todos") {
    tasks.push(fetchAntecedentes(idPaciente));
  }

  const chunks = await Promise.all(tasks);
  return chunks.flat().sort((a, b) => (a.fecha > b.fecha ? -1 : 1));
}
