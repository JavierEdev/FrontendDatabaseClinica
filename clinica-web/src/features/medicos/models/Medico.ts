export interface Medico {
  id: number;
  nombreCompleto: string;
  especialidad: string;
}

export type MedicoDetalleResponse = {
  id: number;
  nombres: string;
  apellidos: string;
  numeroColegiado?: string;
  especialidad?: string;
  telefono?: string;
  correo?: string;
  horario?: string;
};