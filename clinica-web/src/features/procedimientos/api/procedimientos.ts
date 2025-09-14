import type { CatalogoProcedimiento } from "@/features/procedimientos/models/Procedimiento";
import { api } from "@/features/auth/api/api";

// GET /api/CatalogoProcedimiento
export async function getCatalogoProcedimientos(
  signal?: AbortSignal
): Promise<CatalogoProcedimiento[]> {
  const res = await api<any>("/api/CatalogoProcedimiento", {
    method: "GET",
    auth: true,
    signal,
  });
  // el endpoint devuelve array crudo
  return Array.isArray(res) ? (res as CatalogoProcedimiento[]) : [];
}

// POST /api/Pacientes/consultas/{idConsulta}/procedimientos
export async function agregarProcedimientoAConsulta(
  idConsulta: number,
  idProcedimientoCatalogo: number,
  signal?: AbortSignal
): Promise<void> {
  await api(`/api/Pacientes/consultas/${idConsulta}/procedimientos`, {
    method: "POST",
    auth: true,
    signal,
    body: JSON.stringify({ idConsulta, idProcedimientoCatalogo }),
  });
}
