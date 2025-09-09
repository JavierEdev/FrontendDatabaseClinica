// Estados normalizados para la UI
export type CitaEstado =
  | "CONFIRMADA"
  | "CANCELADA"
  | "REPROGRAMADA"
  | "PENDIENTE";

/** RAW del backend para listados (shape genérico) */
export type APICitaGeneral = {
  idCita: number;
  idPaciente: number;
  idMedico: number;
  fecha: string;
  estado: string;
  medicoNombre?: string;
  especialidad?: string;
};

export type CitaPacienteApi = APICitaGeneral;

export type CitaPaciente = {
  id: number;
  idMedico: number;
  fecha: string;
  estado: CitaEstado;
};

export type APICitaAdmin = {
  id: number;
  idPaciente: number;
  idMedico: number;
  fecha: string;
  estado: CitaEstado;
  medicoNombre?: string;
  especialidad?: string;
};

export type CitaAdmin = APICitaAdmin;

/** Crear cita (request y response del POST /api/citas) */
export interface CrearCitaRequest {
  idPaciente: number;
  idMedico: number;
  fecha: string;
}

export interface CrearCitaApiResponse {
  success: boolean;
  message: string;
  data: {
    idCita: number;
    idPaciente: number;
    idMedico: number;
    fecha: string;
    estado?: string;
    medicoNombre?: string;
    especialidad?: string;
  };
}

export type CitaDetalle = {
  id: number;
  idPaciente: number;
  idMedico: number;
  fecha: string;
  estado: CitaEstado;
  medicoNombre?: string;
  especialidad?: string;
};