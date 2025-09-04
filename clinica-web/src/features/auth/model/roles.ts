export type AppRole = "admin" | "recepcionista" | "medico" | "paciente";

export function normalizeRole(role: string | null | undefined): AppRole {
  const r = (role ?? "").toLowerCase().trim();
  if (["admin", "administrator", "administrador"].includes(r)) return "admin";
  if (["medico", "doctor"].includes(r)) return "medico";
  // recepcionista/usuario/otros → user
  return "recepcionista";
}

export function isAdminRole(role: string | null | undefined) {
  return normalizeRole(role) === "admin";
}
