// src/features/citas/model/citas.ts
export type CitaEstado = "CONFIRMADA" | "CANCELADA" | "PENDIENTE";

export interface Cita {
  id: number;
  medicoNombre: string;
  especialidad: string;
  fecha: string; // ISO 8601 (ej: "2025-11-05T10:00:00Z")
  estado: CitaEstado;
}
