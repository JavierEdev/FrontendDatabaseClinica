import { useCallback, useState } from "react";
import { fetchPacienteByDpi } from "@/features/pacientes/api/pacientes";
import type { PacienteDetalleResponse } from "@/features/pacientes/model/pacientes";

export function useBuscarPacientePorDpi() {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const buscar = useCallback(async (dpi: string): Promise<PacienteDetalleResponse | null> => {
    setLoading(true); setError(null);
    try {
      const r = await fetchPacienteByDpi(dpi.trim());
      return r ?? null;
    } catch (e: any) {
      // Si tu API devuelve 404 para DPI no encontrado
      if (String(e?.message || "").includes("404")) return null;
      setError(e?.message || "Error al buscar paciente");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { buscar, loading, error };
}
