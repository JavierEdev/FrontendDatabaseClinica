import type { AppRole } from "./roles";

export type Role = "administrador" | "medico" | "recepcionista";

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

export type Session = Omit<LoginResponse, "role"> & {
  role: AppRole;
  roleRaw: string;
};
