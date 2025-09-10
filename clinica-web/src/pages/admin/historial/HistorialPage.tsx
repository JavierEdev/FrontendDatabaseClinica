import { useEffect, useMemo, useState } from "react";
import HistorialLayout from "@/features/historial/ui/HistorialLayout";
import { useHistorial, type HistFilter } from "@/features/historial/hooks/useHistorial";
import { listarPacientes } from "@/features/pacientes/api/pacientes";

type PacienteMin = {
  idPaciente: number;
  nombres: string;
  apellidos: string;
  dpi?: string;
};

export default function HistorialPage() {
  const [dpi, setDpi] = useState("");
  const [wasSearched, setWasSearched] = useState(false);
  const [paciente, setPaciente] = useState<PacienteMin | null>(null);

  const { items, loading, error, filter, setFilter, fetchFor } = useHistorial();

  // -------- Autocompletado --------
  const [all, setAll] = useState<PacienteMin[]>([]);
  const [sugOpen, setSugOpen] = useState(false);
  const [sugLoading, setSugLoading] = useState(false);

  // precarga lista pequeña para filtrar en cliente
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setSugLoading(true);
        const res = await listarPacientes(1, 400); // ajusta el pageSize si quieres
        if (!alive) return;
        const mapped: PacienteMin[] = (res?.items ?? []).map((p: any) => ({
          idPaciente: p.idPaciente,
          nombres: p.nombres,
          apellidos: p.apellidos,
          dpi: p.dpi,
        }));
        setAll(mapped);
      } finally {
        setSugLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // matches en memoria por DPI o nombre
  const matches = useMemo(() => {
    const term = dpi.trim().toLowerCase();
    if (!term) return [];
    return all
      .filter((p) => {
        const full = `${p.nombres ?? ""} ${p.apellidos ?? ""}`.toLowerCase();
        return (p.dpi ?? "").toLowerCase().includes(term) || full.includes(term);
      })
      .slice(0, 8);
  }, [all, dpi]);

  function pickPaciente(p: PacienteMin) {
    setPaciente(p);
    setDpi(p.dpi ?? "");
    setSugOpen(false);
    setWasSearched(true);
    fetchFor(p.idPaciente);
  }

  function onBuscar() {
    setWasSearched(true);
    if (matches.length > 0) {
      // si hay coincidencias, elegimos la primera (comportamiento simple)
      pickPaciente(matches[0]);
    } else {
      // si no hay coincidencias con la lista precargada, limpia o
      // aquí podrías hacer una búsqueda directa al backend por DPI
      setPaciente(null);
      fetchFor(null);
    }
  }

  return (
    <HistorialLayout
      dpiInput={dpi}
      onDpiInput={setDpi}
      onBuscar={onBuscar}

      matches={matches}
      sugOpen={sugOpen}
      setSugOpen={setSugOpen}
      onPick={pickPaciente}
      sugLoading={sugLoading}

      paciente={paciente}
      wasSearched={wasSearched}

      items={items}
      loading={loading}
      error={error}

      filter={filter as HistFilter}
      setFilter={setFilter}
    />
  );
}
