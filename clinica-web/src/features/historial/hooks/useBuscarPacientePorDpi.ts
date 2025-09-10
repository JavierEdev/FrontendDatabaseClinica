import { useState } from "react";
import { listarPacientes } from "@/features/pacientes/api/pacientes";

export type PacienteMin = {
  idPaciente: number;
  nombres: string;
  apellidos: string;
  dpi?: string;
};

export function useBuscarPacientePorDpi() {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string>("");

  async function buscar(dpi: string): Promise<PacienteMin | null> {
    setError(""); setLoading(true);
    try {
      const clean = (dpi ?? "").replace(/\D+/g, "");
      if (!clean) return null;

      // Traemos un “lote” y buscamos por DPI exacto, si no, por prefijo.
      const res = await listarPacientes(1, 500);
      const items = res?.items ?? [];

      const exact =
        items.find(p => (p.dpi ?? "").replace(/\D+/g, "") === clean) || null;

      if (exact) return exact;

      const prefix =
        items.find(p => (p.dpi ?? "").replace(/\D+/g, "").startsWith(clean)) || null;

      return prefix;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { buscar, loading, error };
}
