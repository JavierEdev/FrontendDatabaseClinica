import type { AppRole } from "@/features/auth/model/roles";
const KEY_TOKEN = "accessToken";
const KEY_ROLE  = "role";

export function setAuth(accessToken: string, role: AppRole) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("role", role);
}

export function getToken() {
  return localStorage.getItem(KEY_TOKEN);
}

export function getRole(): "administrador" | "medico" | "recepcionista" | null {
  return (localStorage.getItem(KEY_ROLE) as "administrador" | "medico" | "recepcionista" | null) ?? null;
}

export const clearAuth = () => {
  localStorage.removeItem(KEY_TOKEN);
  localStorage.removeItem(KEY_ROLE);
};
