// src/features/citas/model/citas.ts
export type CitaEstado = "CONFIRMADA" | "CANCELADA" | "PENDIENTE";

export interface Cita {
  id: number;
  medicoNombre: string;
  especialidad: string;
  fecha: string; // ISO 8601 (ej: "2025-11-05T10:00:00Z")
  estado: CitaEstado;
}

export interface CrearCitaRequest {
  idPaciente: number;
  idMedico: number;
  /** ISO con 'Z' — ej: "2025-09-08T11:00:00.000Z" */
  fecha: string;
}

// Respuesta del POST /api/citas
export interface CrearCitaApiResponse {
  success: boolean;
  message: string;
  data: {
    idCita: number;
    idPaciente: number;
    idMedico: number;
    fecha: string;     // "YYYY-MM-DDTHH:mm:ss"
    estado?: string;   // "confirmada" | "cancelada" | "pendiente"
    // (opcionales si tu backend los agrega)
    medicoNombre?: string;
    especialidad?: string;
  };
}

// Respuesta del GET de citas por paciente (ajústalo a tu backend real)
export interface CitaPacienteApi {
  idCita: number;
  idPaciente: number;
  idMedico: number;
  fecha: string;
  estado: string;
  // opcionales (si el backend ya los manda)
  medicoNombre?: string;
  especialidad?: string;
}

export interface Cita {
  id: number;
  idMedico: number;
  fecha: string;
  estado: CitaEstado;
}

interface RawCita {
  idCita: number;
  idPaciente: number;
  idMedico: number;
  fecha: string;
  estado: string; // "confirmada" | "cancelada" | "pendiente"
}