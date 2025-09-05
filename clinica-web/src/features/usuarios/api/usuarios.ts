// src/features/usuarios/api/usuarios.ts
const BASE = import.meta.env.VITE_API_BASE ?? "";

function authHeaders() {
  const token = localStorage.getItem("accessToken") ?? "";
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function obtenerIdPacientePorUsuario(
  idUsuario: number,
  signal?: AbortSignal
): Promise<number> {
  const res = await fetch(`${BASE}/api/Usuarios/${idUsuario}`, {
    method: "GET",
    headers: authHeaders(),
    signal,
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "No se pudo obtener el usuario");
  }

  const txt = await res.text();
  if (!txt) throw new Error("Respuesta vacía del usuario");
  const data = JSON.parse(txt);

  const idPaciente =
    data.idPaciente ?? data.pacienteId ?? data?.paciente?.id ?? null;

  if (typeof idPaciente !== "number")
    throw new Error("El usuario no tiene idPaciente asociado");
  return idPaciente;
}