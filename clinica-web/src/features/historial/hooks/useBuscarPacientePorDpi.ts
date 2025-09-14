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

      let page = 1;
      const pageSize = 50;
      let total = Infinity;

      let found: PacienteMin | null = null;

      while ((page - 1) * pageSize < total) {
        const res = await listarPacientes(page, pageSize);
        total = res?.total ?? res?.items?.length ?? 0;

        const items = res?.items ?? [];
        const norm = (s?: string) => (s ?? "").replace(/\D+/g, "");

        found =
          items.find(p => norm(p.dpi) === clean) ??
          items.find(p => norm(p.dpi).startsWith(clean)) ??
          null;

        if (found) break;
        page += 1;

        if (page > 1000) break;
      }
      return found;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { buscar, loading, error };
}
