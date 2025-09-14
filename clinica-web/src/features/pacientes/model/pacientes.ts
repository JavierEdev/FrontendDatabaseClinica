export type NuevoPaciente = {
  nombres: string;
  apellidos: string;
  dpi: string;
  fechaNacimiento: string;
  sexo: string;
  direccion: string;
  telefono: string;
  correo: string;
  estadoCivil: string;
};

export type PacienteCreado = {
  id: number;
};

export type Paciente = NuevoPaciente & {
  idPaciente: number;
  creadoEn: string;
};

export type DocumentoPaciente = {
  idDocumento: number;
  categoria: string;
  url: string;
  notas?: string;
};


type PacienteItem = {
  idPaciente: number;
  nombres: string;
  apellidos: string;
  dpi?: string;
  fechaNacimiento?: string;
  sexo?: "M" | "F";
  telefono?: string;
  correo?: string;
  numeroHistoriaClinica?: string;
};

export type ListaPacientesResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: PacienteItem[];
};

// Tipos
export type ContactoEmergenciaResponseDetallePaciente = {
  idContacto: number;
  nombre: string;
  parentesco: string;
  telefono?: string;
};

export type PacienteDetalleResponse = {
  idPaciente: number;
  nombres: string;
  apellidos: string;
  dpi: string;
  fechaNacimiento: string; // "YYYY-MM-DDTHH:mm:ss"
  sexo: "M" | "F" | (string & {});
  direccion?: string;
  telefono?: string;
  correo?: string;
  estadoCivil?: string;
  contactosEmergencia: ContactoEmergenciaResponseDetallePaciente[];
};

export type NuevoContactoEmergencia = {
  nombre: string;
  parentesco: string;
  telefono?: string;
};

export type ContactoEmergenciaCreado = {
  idContacto: number;
  idPaciente: number;
  nombre: string;
  parentesco: string;
  telefono?: string;
};

export type InfoMedicaInicialUpdate = {
  idPaciente: number;
  antecedentes: string;
  alergias: string;
  enfermedadesCronicas: string;
};

export type InfoMedicaInicialResponse = {
  idAntecedente: number;
  idPaciente: number;
};

// ---------- POST /api/Pacientes/{idPaciente}/consultas ----------
export interface CrearConsultaPayload {
  idPaciente: number;
  idMedico: number;
  fecha: string;            // ISO (ej. new Date().toISOString())
  motivoConsulta: string;
  diagnostico: string;
  observaciones?: string;
  idCita: number;
}
export interface CrearConsultaResponse {
  idConsulta: number;
  idPaciente: number;
  idMedico: number;
  idCita: number;
  fecha: string;
  motivoConsulta: string;
  diagnostico: string;
  observaciones?: string;
}