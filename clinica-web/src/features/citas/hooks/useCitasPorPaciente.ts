import { useEffect, useState } from "react";
import { fetchCitasPorPaciente } from "@/features/citas/api/citas";
import type { CitaPaciente } from "@/features/citas/model/citas";

export function useCitasPorPaciente(idPaciente: number | null) {
  const [items, setItems] = useState<CitaPaciente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(signal?: AbortSignal) {
    if (!idPaciente) { setItems([]); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetchCitasPorPaciente(idPaciente, signal);
      setItems(res);
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(e?.message || "No se pudieron cargar las citas");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, [idPaciente]);

  return { items, loading, error, refetch: () => load() };
}
