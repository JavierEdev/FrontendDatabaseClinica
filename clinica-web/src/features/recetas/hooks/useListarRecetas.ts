import { useEffect, useMemo, useState } from "react";
import type { RecetaVm } from "../model/tipos";
import { listarTodas } from "../api/recetas";

export function useListarRecetas() {
  const [data, setData] = useState<RecetaVm[]>([]);
  const [loading, setL] = useState(false);
  const [error, setE] = useState("");

  async function fetchNow(signal?: AbortSignal) {
    setE(""); setL(true);
    try {
      const r = await listarTodas();
      setData(r);
    } catch (e) {
      setE((e as Error).message || "Error al cargar recetas");
    } finally {
      setL(false);
    }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    fetchNow(ctrl.signal);
    return () => ctrl.abort();
  }, []);

  return { data, loading, error, refetch: () => fetchNow() };
}

export function useFiltroYPagina(
  rows: RecetaVm[] | undefined,
  pageSizeInit = 10
) {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeInit);

  const filtradas = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!rows) return [];
    if (!term) return rows;
    return rows.filter(r =>
      `${r.idReceta} ${r.idConsulta} ${r.medicamento} ${r.dosis} ${r.frecuencia} ${r.duracion}`
        .toLowerCase().includes(term)
    );
  }, [rows, q]);

  const total = filtradas.length;
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to   = total ? Math.min(page * pageSize, total) : 0;

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtradas.slice(start, start + pageSize);
  }, [filtradas, page, pageSize]);

  return {
    q, setQ,
    page, setPage,
    pageSize, setPageSize,
    total, from, to,
    items: pageItems,
  };
}
