export type RolUsuario = 'administrador' | 'recepcionista' | 'medico';

export interface Usuario {
  id: number;
  username: string;
  rol: RolUsuario;
  idMedico: number | null;
  idPaciente: number | null;
}

export interface CrearUsuarioDTO {
  username: string;
  password: string;
  rol: RolUsuario;
  idMedico?: number | null;
  idPaciente?: number | null;
}
