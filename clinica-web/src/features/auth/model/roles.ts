export type AppRole = "admin" | "user" | "medico";

export function normalizeRole(role: string | null | undefined): AppRole {
  const r = (role ?? "").toLowerCase().trim();
  if (["admin", "administrator", "administrador"].includes(r)) return "admin";
  if (["medico", "doctor"].includes(r)) return "medico";
  // recepcionista/usuario/otros → user
  return "user";
}

export function isAdminRole(role: string | null | undefined) {
  return normalizeRole(role) === "admin";
}
