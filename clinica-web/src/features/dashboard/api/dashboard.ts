import {
  Kpis,
  SerieCitas,
  SerieIngresos,
  TopProc,
  CitasEspecialidad,
  RecetaRow,
  CitaReciente,
} from "../model/dashboard";

const BASE: string = import.meta.env.VITE_FACTURAS_BASE;

const qp = (p: Record<string, string | number | undefined | null>) =>
  "?" +
  Object.entries(p)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

async function getJson<T>(
  path: string,
  params?: Record<string, string | number | undefined | null>
): Promise<T> {
  const url = `${BASE}${path}${params ? qp(params) : ""}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} -> ${url}\n${body}`);
  }
  return res.json() as Promise<T>;
}

export const DashboardApi = {
  especialidades: () =>
    getJson<string[]>("/api/Dashboard/especialidades"),

  kpis: (desde: string, hasta: string, especialidad?: string | null) =>
    getJson<Kpis>("/api/Dashboard/kpis", { desde, hasta, especialidad }),

  serieCitas: (d: string, h: string, esp?: string | null) =>
    getJson<SerieCitas[]>("/api/Dashboard/series/citas", {
      desde: d,
      hasta: h,
      especialidad: esp,
    }),

  ingresosMensual: (d: string, h: string, esp?: string | null) =>
    getJson<SerieIngresos[]>("/api/Dashboard/series/ingresos-mensual", {
      desde: d,
      hasta: h,
      especialidad: esp,
    }),

  topProcedimientos: (d: string, h: string, esp?: string | null, top = 10) =>
    getJson<TopProc[]>("/api/Dashboard/top/procedimientos", {
      desde: d,
      hasta: h,
      especialidad: esp,
      top,
    }),

  citasPorEspecialidad: (d: string, h: string, esp?: string | null) =>
    getJson<CitasEspecialidad[]>("/api/Dashboard/citas-por-especialidad", {
      desde: d,
      hasta: h,
      especialidad: esp,
    }),

  recetas: (d: string, h: string, esp?: string | null, take = 8) =>
    getJson<RecetaRow[]>("/api/Dashboard/ultimas-recetas", {
      desde: d,
      hasta: h,
      especialidad: esp,
      take,
    }),

  citasRecientes: (d: string, h: string, esp?: string | null, take = 8) =>
    getJson<CitaReciente[]>("/api/Dashboard/citas-recientes", {
      desde: d,
      hasta: h,
      especialidad: esp,
      take,
    }),
};
