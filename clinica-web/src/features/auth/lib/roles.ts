export function normalizeRole(role: string | null | undefined) {
  const r = (role || "").toString().trim().toLowerCase();
  if (["admin", "administrator", "administrador"].includes(r)) return "admin";
  if (["user", "usuario", "reception", "recepcionista"].includes(r)) return "user";
  return r || "user"; // fallback
}

export function isAdminRole(role: string | null | undefined) {
  return normalizeRole(role) === "admin";
}
