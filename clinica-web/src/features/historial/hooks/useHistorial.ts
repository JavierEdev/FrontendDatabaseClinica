import { useCallback, useEffect, useRef, useState } from "react";
import { fetchHistorialPaciente } from "../api/historial";
import type { HistorialItem, HistorialTipo } from "../model/types";

export type HistFilter = "todos" | HistorialTipo;

export function useHistorial() {
  const [items, setItems] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<HistFilter>("todos");
  const [patientId, setPatientId] = useState<number | null>(null);

  // clave para ignorar respuestas que llegan tarde
  const lastReqKey = useRef<string>("");

  const fetchFor = useCallback((id: number | null) => {
    setPatientId(id);            // ← sólo fijamos a quién cargar
  }, []);

  useEffect(() => {
    if (!patientId) { setItems([]); return; }

    setLoading(true);
    setError(null);

    const key = `${patientId}|${filter}|${Date.now()}`;
    lastReqKey.current = key;

    fetchHistorialPaciente(patientId, filter)
      .then((res) => {
        // si llegó otra petición más nueva mientras tanto, ignoramos esta
        if (lastReqKey.current !== key) return;

        // REEMPLAZA el estado (no concatenes) y de paso deduplica
        const seen = new Set<string>();
        const clean = res.filter((it) => {
          const k = `${it.tipo}|${it.fecha}|${it.titulo ?? ""}|${it.detalle ?? ""}`;
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
