import { useEffect, useState } from "react";
import { fetchProductividadMedicos } from "../api/reportes";
import type { ReporteProductividadMedico } from "../model/types";

export function useProductividadMedicos(desde: string, hasta: string, idMedico?: number) {
  const [items, setItems] = useState<ReporteProductividadMedico[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(signal?: AbortSignal) {
    setLoading(true); setError(null);
    try {
      const data = await fetchProductividadMedicos({ desde, hasta, idMedico, signal });
      setItems(data);
    } catch (e: any) {
      if (e?.name !== "AbortError") setError(e?.message || "No se pudo cargar la reportería.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, [desde, hasta, idMedico]);

  return { items, loading, error, refetch: () => load() };
}
