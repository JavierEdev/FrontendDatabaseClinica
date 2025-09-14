// src/pages/admin/historial/HistorialPage.tsx
import { useEffect, useMemo, useState } from "react";
import HistorialLayout from "@/features/historial/ui/HistorialLayout";
import { useBuscarPacientePorDpi } from "@/features/historial/hooks/useBuscarPacientePorDpi";
import { useHistorial } from "@/features/historial/hooks/useHistorial";
import { listarPacientes } from "@/features/pacientes/api/pacientes";
import type { HistFilter } from "@/features/historial/model/types";
import { useFotoPaciente } from "@/features/pacientes/hooks/useFotoPaciente";
import { useAntecedentes } from "@/features/historial/hooks/useAntecedentes";

type PacienteMin = {
  idPaciente: number;
  nombres: string;
  apellidos: string;
  dpi?: string;
};

// Debounce simple
function useDebounce<T>(value: T, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function HistorialPage() {
  // UI: input DPI y sugerencias
  const [dpiInput, setDpiInput] = useState("");
  const debounced = useDebounce(dpiInput, 350);
  const [sugOpen, setSugOpen] = useState(false);
  const [sugLoading, setSugLoading] = useState(false);
  const [matches, setMatches] = useState<PacienteMin[]>([]);

  // Paciente seleccionado
  const [paciente, setPaciente] = useState<PacienteMin | null>(null);
  const [wasSearched, setWasSearched] = useState(false);
  const { url: fotoUrl, loading: fotoLoading } = useFotoPaciente(paciente?.idPaciente ?? null);

  // Hooks de negocio
  const { buscar, loading: buscando, error: errBuscar } = useBuscarPacientePorDpi();
  const { items, loading, error, filter, setFilter, fetchFor } = useHistorial();
  const { data: antecedentes, loading: loadingAnt, error: errorAnt } = useAntecedentes(paciente?.idPaciente ?? null);

  useEffect(() => {
    let alive = true;
    async function run() {
      const q = (debounced ?? "").trim();
      if (!q) { setMatches([]); return; }

      setSugLoading(true);
      try {
        const res = await listarPacientes(1, 50);
        const items = res?.items ?? [];

        const qNum = q.replace(/\D+/g, "");
        let out: PacienteMin[] = [];

        if (qNum.length >= 3 && /^\d+$/.test(q)) {
          out = items.filter(p => (p.dpi ?? "").replace(/\D+/g, "").startsWith(qNum));
        } else {
          const low = q.toLowerCase();
          out = items.filter(p =>
            `${p.apellidos ?? ""} ${p.nombres ?? ""}`.toLowerCase().includes(low) ||
            (p.dpi ?? "").toLowerCase().includes(low)
          );
        }
        if (alive) setMatches(out.slice(0, 8));
      } catch {
        if (alive) setMatches([]);
      } finally {
        if (alive) setSugLoading(false);
      }
    }
    run();
    return () => { alive = false; };
  }, [debounced]);

  const onBuscar = async () => {
    setWasSearched(true);
    setSugOpen(false);

    try {
      const found = await buscar(dpiInput);
      if (!found) {
        setPaciente(null);
        return;
      }

      const same = paciente?.idPaciente === found.idPaciente;

      setPaciente(found);
      setFilter("todos" as HistFilter);

      if (!same) {
        fetchFor(found.idPaciente);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const onPick = (p: PacienteMin) => {
    const same = paciente?.idPaciente === p.idPaciente;

    setPaciente(p);
    setWasSearched(true);
    setDpiInput(p.dpi ?? "");
    setSugOpen(false);
    setFilter("todos" as HistFilter);

    if (!same) {
      fetchFor(p.idPaciente); 
    }
  };

  const composedError = useMemo(() => {
    if (error) return error;
    if (errBuscar) return errBuscar;
    return null;
  }, [error, errBuscar]);

  return (
    <HistorialLayout
      /* buscador */
      dpiInput={dpiInput}
      onDpiInput={setDpiInput}
      onBuscar={onBuscar}

      matches={matches}
      sugOpen={sugOpen}
      setSugOpen={setSugOpen}
      onPick={onPick}
      sugLoading={sugLoading}

      paciente={paciente}
      wasSearched={wasSearched}

      items={items}
      loading={loading || buscando}
      error={composedError}

      filter={filter}
      setFilter={(f) => setFilter(f)}

      fotoUrl={fotoUrl}
      fotoLoading={fotoLoading}

      antecedentes={antecedentes}
      antLoading={loadingAnt}
      antError={errorAnt}
    />
  );
}
