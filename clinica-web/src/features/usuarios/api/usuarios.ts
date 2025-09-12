// src/features/usuarios/api/usuarios.ts

import { api } from "@/features/auth/api/api";
import type { Usuario, CrearUsuarioDTO } from "../model/usuarios";

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


//GET /api/Usuarios
export async function listarUsuarios(pacienteId?: number): Promise<Usuario[]> {
  const url = pacienteId != null
    ? `/api/Usuarios?pacienteId=${pacienteId}`
    : `/api/Usuarios`;

  const res = await api<Usuario[]>(url, { method: "GET", auth: true });
  return Array.isArray(res) ? res : (res as any)?.data ?? [];
}

// POST /api/Usuarios 
export async function crearUsuario(body: CrearUsuarioDTO): Promise<void> {
  await api<void>("/api/Usuarios", {
    method: "POST",
    body: JSON.stringify(body),
    auth: true,
    headers: { "Content-Type": "application/json-patch+json" },
  });
}

// GET /api/Usuarios/{id}
export async function obtenerUsuarioPorId(id: number): Promise<Usuario> {
  const res = await api<Usuario>(`/api/Usuarios/${id}`, { method: "GET", auth: true });
  return (res as any)?.data ?? (res as Usuario);
}