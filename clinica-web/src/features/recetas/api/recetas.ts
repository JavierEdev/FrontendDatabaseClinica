import type { RecetaVm, RecetaCreateDto, ApiResponse } from "../model/tipos";
import { api } from "@/features/auth/api/api";

const BASE = "/api/recetas";

// GET /api/recetas
export async function listarTodas(): Promise<RecetaVm[]> {
  const res = await api<RecetaVm[] | ApiResponse<RecetaVm[]>>(BASE, { method: "GET", auth: true });
  return Array.isArray(res) ? res : (res?.data ?? []);
}

// GET /api/recetas/{id}
export async function obtener(id: number): Promise<RecetaVm> {
  const res = await api<RecetaVm | ApiResponse<RecetaVm>>(`${BASE}/${id}`, { method: "GET", auth: true });
  return (res as any)?.data ?? (res as RecetaVm);
}

// GET /api/recetas/consulta/{idConsulta}
export async function porConsulta(idConsulta: number): Promise<RecetaVm[]> {
  const res = await api<RecetaVm[] | ApiResponse<RecetaVm[]>>(`${BASE}/consulta/${idConsulta}`, { method: "GET", auth: true });
  return Array.isArray(res) ? res : (res?.data ?? []);
}

// POST /api/recetas
export async function crear(body: RecetaCreateDto) {
  // ApiResponse<{ idConsulta:number; total:number; ids:number[] }>
  return api(`${BASE}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    auth: true,
  });
}

export const pdfUrl = (id: number) => `${BASE}/${id}/pdf`;
