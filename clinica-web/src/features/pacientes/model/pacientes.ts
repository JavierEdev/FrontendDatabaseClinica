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