import { useCallback, useEffect, useRef, useState } from "react";
import { fetchHistorialPaciente } from "../api/historial";
import type { HistorialItem, HistFilter } from "../model/types";

type UseHistorialResult = {
  items: HistorialItem[];
  loading: boolean;
  error: string | null;
  filter: HistFilter;
  setFilter: (f: HistFilter) => void;
  fetchFor: (id: number | null) => void;
};

export function useHistorial(): UseHistorialResult {
  const [items, setItems] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<HistFilter>("todos");
  const [patientId, setPatientId] = useState<number | null>(null);

  const lastReqKey = useRef<string>("");

  const fetchFor = useCallback((id: number | null) => {
    setPatientId(id);
  }, []);

  useEffect(() => {
    if (!patientId) { setItems([]); return; }

    setLoading(true);
    setError(null);

    const key = `${patientId}|${filter}|${Date.now()}`;
    lastReqKey.current = key;

    fetchHistorialPaciente(patientId, filter)
      .then((res) => {
        if (lastReqKey.current !== key) return;

        const seen = new Set<string>();
        const clean = res.filter((it) => {
          const idc = it.meta?.idConsulta ?? it.id;
          const idr = it.meta?.id_receta ?? it.meta?.idReceta ?? null;
          const idp = it.meta?.id_procedimiento ?? it.meta?.idProcedimiento ?? null;

          const k =
            it.tipo === "CONSULTA" ? `C|${idc}` :
            it.tipo === "RECETA"   ? `R|${idr ?? `${idc}|${it.titulo}`}` :
                                     `P|${idp ?? `${idc}|${it.titulo}`}`;

          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });

        setItems(clean);
      })
      .catch((e) => setError(e?.message ?? "Error al cargar historial"))
      .finally(() => {
        if (lastReqKey.current === key) setLoading(false);
      });
  }, [patientId, filter]);

  return { items, loading, error, filter, setFilter, fetchFor };
}
