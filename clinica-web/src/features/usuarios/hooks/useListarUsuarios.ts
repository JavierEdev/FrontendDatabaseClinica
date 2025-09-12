import { useEffect, useMemo, useState } from "react";
import type { Usuario } from "../model/usuarios";
import { listarUsuarios } from "../api/usuarios";

export function useListarUsuarios(pacienteId?: number) {
  const [data, setData] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const params = useMemo(() => ({ pacienteId }), [pacienteId]);

  async function fetchNow(signal?: AbortSignal) {
    setError(""); setLoading(true);
    try {
      const r = await listarUsuarios(params.pacienteId);
      setData(r);
    } catch (e) {
      setError((e as Error).message || "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    fetchNow(ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.pacienteId]);

  return { data, loading, error, refetch: () => fetchNow() };
}
