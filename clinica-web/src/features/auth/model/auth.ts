import type { AppRole } from "./roles";

export type Role = "administrador" | "medico" | "recepcionista" | "paciente";

// Lo que devuelve /api/auth/login (backend)
export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  userId: number;
  username: string;
  role: Role | string;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken?: string;
  userId: number;
  username: string;
  role: Role | string;
};

export interface MeResponse {
  sub: string;
  username: string;
  role: Role;
  id_medico?: string | null;
}

export interface ApiError {
  error?: string;
  message?: string;
}

export type CreateUsuariosRequest = {
  username: string;
  password: string;
  rol: Role;
  idMedico?: number | null;
  idPaciente?: number | null;
}

export type CreateUsuariosResponse = {
  id: number;
}

export type Session = Omit<LoginResponse, "role"> & {
  role: AppRole;
  roleRaw: string;
};