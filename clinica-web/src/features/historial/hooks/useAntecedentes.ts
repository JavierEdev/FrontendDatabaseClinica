// src/features/historial/hooks/useAntecedentes.ts
import { useEffect, useState } from "react";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

function authHeaders(): HeadersInit {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") || "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getJSON(url: string): Promise<any> {
  const res = await fetch(url, { headers: { Accept: "application/json", ...authHeaders() } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  return j?.data ?? j;
}

export type Antecedentes = {
  idAntecedente?: number;
  idPaciente?: number;
  antecedentes?: string;
  alergias?: string;
  enfermedadesCronicas?: string;
  enfermedadCronicas?: string;
  descripcion?: string;
  fechaRegistro?: string;
  ultimaActualizacion?: string;
  enfermedades_cronicas?: string;
  fecha_registro?: string;
  ultima_actualizacion?: string;
};

function normalize(a: Antecedentes | null): Antecedentes | null {
  if (!a) return null;
  return {
    ...a,
    enfermedadesCronicas:
      a.enfermedadesCronicas ?? a.enfermedades_cronicas ?? a.enfermedadCronicas ?? "",
    fechaRegistro: a.fechaRegistro ?? (a as any).fecha_registro,
    ultimaActualizacion: a.ultimaActualizacion ?? (a as any).ultima_actualizacion,
  };
}

export function useAntecedentes(idPaciente: number | null) {
  const [data, setData] = useState<Antecedentes | null>(null);
  const [loading, setL] = useState(false);
  const [error, setE] = useState<string | null>(null);

  useEffect(() => {
    if (!idPaciente) { setData(null); return; }
    let alive = true;
    setL(true); setE(null);

    (async () => {
      try {
        const url = `${API_BASE}/api/Pacientes/pacientes/${idPaciente}/antecedentes-medicos`;
        const raw = await getJSON(url);
        if (alive) setData(normalize(raw ?? null));
      } catch (e: any) {
        if (alive) setE(e?.message ?? "No se pudieron cargar los antecedentes.");
      } finally {
        if (alive) setL(false);
      }
    })();

    return () => { alive = false; };
  }, [idPaciente]);

  return { data, loading, error };
}
