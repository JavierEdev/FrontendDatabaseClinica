import { useEffect, useMemo, useState } from "react";
import styles from "./ReassignMedicosModal.module.css";
import {
  fetchMedicosDisponiblesParaCita,
  reasignarMedicoDeCita,
  type MedicoDisponible,
} from "@/features/citas/api/citas";

type Props = {
  open: boolean;
  citaId: number | null;
  fechaISO?: string | null;
  especialidad?: string | null;
  onClose: () => void;
  onSaved?: (nuevoMedicoId: number) => void; 
};

function fmtDT(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(d);
}

export default function ReasignarMedicoModal({
  open,
  citaId,
  fechaISO,
  especialidad,
  onClose,
  onSaved,
}: Props) {
  const [items, setItems] = useState<MedicoDisponible[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !citaId) return;
    setError(null);
    setSelected(null);
    setQuery("");
    const ac = new AbortController();
    setLoading(true);
    (async () => {
      try {
        const list = await fetchMedicosDisponiblesParaCita(citaId, ac.signal);
        setItems(list);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "No se pudieron cargar los médicos disponibles.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [open, citaId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((m) => m.nombreCompleto.toLowerCase().includes(q));
  }, [items, query]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citaId || !selected) {
      setError("Selecciona un médico para continuar.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await reasignarMedicoDeCita(citaId, selected);
      onSaved?.(selected);
      onClose();
    } catch (e: any) {
    const msg =
        e?.message ||
        (typeof e === "string" ? e : null) ||
        "No se pudo reasignar el médico.";
    setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (!open || !citaId) return null;

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="reasignar-title"
      >
        <div className={styles.modalHeader}>
          <h3 id="reasignar-title" className={styles.modalTitle}>
            Reasignar médico para cita #{citaId}
          </h3>
          <button
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.modalHint}>
            Doctores disponibles para{" "}
            <strong>{fmtDT(fechaISO)}</strong> — especialidad:{" "}
            <strong>{especialidad || "—"}</strong>
          </p>

          {error && (
            <div className={styles.error} style={{ marginBottom: 8 }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ padding: 16, color: "#6b7280" }}>Cargando…</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 16, color: "#6b7280" }}>
              No hay médicos disponibles que cumplan los criterios.
            </div>
          ) : (
            <>
              {/* buscador local (cliente) */}
              <label className={styles.field}>
                <span>Buscar médico</span>
                <input
                  type="text"
                  placeholder="Escribe el nombre…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={styles.input}
                />
              </label>

              <div className={styles.tableWrap} style={{ maxHeight: 280 }}>
                <table className={styles.miniTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Nombre</th>
                      <th>Horario</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => (
                      <tr key={m.id}>
                        <td>#{m.id}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>
                            {m.nombreCompleto}
                          </div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>
                            {m.especialidad}
                          </div>
                        </td>
                        <td>{m.horario || "08:00-17:00"}</td>
                        <td style={{ textAlign: "right" }}>
                          <input
                            type="radio"
                            name="medico"
                            checked={selected === m.id}
                            onChange={() => setSelected(m.id)}
                            aria-label={`Seleccionar ${m.nombreCompleto}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            className={`${styles.btnPrimary} ${
              saving ? styles.btnDisabled : ""
            }`}
            onClick={submit}
            disabled={saving || !selected}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
