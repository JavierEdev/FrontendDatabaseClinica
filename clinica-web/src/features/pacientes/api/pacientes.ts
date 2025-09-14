import { api } from "@/features/auth/api/api";
import type {
  NuevoPaciente,
  PacienteCreado,
  ListaPacientesResponse,
  PacienteDetalleResponse,
  NuevoContactoEmergencia,
  ContactoEmergenciaCreado
} from "../model/pacientes";

export async function crearPaciente(
  body: NuevoPaciente
): Promise<PacienteCreado> {
  return api<PacienteCreado>("/api/Pacientes", {
    method: "POST",
    body: JSON.stringify(body),
    auth: true,
  });
}

export async function subirDocumentoPaciente(
  idPaciente: number,
  file: File,
  categoria: string,
  notas?: string
): Promise<void> {
  const fd = new FormData();
  fd.append("File", file);
  fd.append("Categoria", categoria);
  if (notas) fd.append("Notas", notas);

  const token = localStorage.getItem("accessToken");
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const BASE = import.meta.env.DEV
    ? ""
    : (import.meta.env.VITE_API_BASE_URL as string) ?? "";

  const r = await fetch(`${BASE}/api/Pacientes/${idPaciente}/documentos`, {
    method: "POST",
    headers,
    body: fd,
  });

  if (!r.ok) {
    let msg = r.statusText;
    try {
      const j = await r.json();
      msg = j?.error || j?.message || msg;
    } catch {}
    throw new Error(msg || "No se pudo subir el documento");
  }
}

export async function listarPacientes(
  page = 1,
  pageSize = 10
): Promise<ListaPacientesResponse> {
  const url = `/api/Pacientes?page=${page}&pageSize=${pageSize}`;
  return api<ListaPacientesResponse>(url, { method: "GET", auth: true });
}

export async function fetchPacienteById(
  idPaciente: number,
  signal?: AbortSignal
): Promise<PacienteDetalleResponse> {
  const url = `/api/Pacientes/${idPaciente}`;

  const raw = await api<any>(url, { method: "GET", auth: true, signal });

  const r = raw?.data ?? raw;

  return {
    ...r,
    contactosEmergencia: Array.isArray(r?.contactosEmergencia)
      ? r.contactosEmergencia
      : [],
  } as PacienteDetalleResponse;
}

export async function crearContactoEmergencia(
  idPaciente: number,
  payload: NuevoContactoEmergencia,
  signal?: AbortSignal
): Promise<ContactoEmergenciaCreado> {
  return api<ContactoEmergenciaCreado>(
    `/api/Pacientes/${idPaciente}/contactos`,
    {
      method: "POST",
      body: JSON.stringify({
        idPaciente,
        nombre: payload.nombre,
        parentesco: payload.parentesco,
        telefono: payload.telefono ?? "",
      }),
      auth: true,
      signal,
    }
  );
}