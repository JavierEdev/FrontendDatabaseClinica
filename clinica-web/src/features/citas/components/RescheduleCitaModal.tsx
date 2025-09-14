import { useEffect, useMemo, useState } from "react";
import styles from "@/pages/admin/pacientes/List.module.css"; // reutiliza tu CSS de modales
// Botones usan bootstrap: "btn", "btn-info", etc.

function toYmd(d: Date) {
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}
function getLocalHm(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
function toIsoUTC(ymd: string, hm: string) {
  // interpreta ymd + hm como hora LOCAL y lo convierte a ISO (UTC Z)
  const d = new Date(`${ymd}T${hm}:00`);
  return d.toISOString();
}

const HOURS = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"];

export default function RescheduleCitaModal({
  open,
  citaId,
  currentFechaIso,
  onClose,
  onConfirm,
  loading = false,
  error = null,
}: {
  open: boolean;
  citaId: number | null;
  currentFechaIso?: string | null; // para precargar
  onClose: () => void;
  onConfirm: (nuevaFechaIso: string, motivo: string) => void;
  loading?: boolean;
  error?: string | null;
}) {
  // precarga fecha/hora con la cita actual o con "hoy 08:00"
  const initial = useMemo(() => {
    const now = new Date();
    if (!currentFechaIso) {
      return { ymd: toYmd(now), hm: "08:00" };
    }
    const d = new Date(currentFechaIso);
    if (isNaN(d.getTime())) return { ymd: toYmd(now), hm: "08:00" };
    // toma la hora local redondeada a :00
    const hmLocal = getLocalHm(d).slice(0, 2) + ":00";
    return { ymd: toYmd(d), hm: HOURS.includes(hmLocal) ? hmLocal : "08:00" };
  }, [currentFechaIso]);

  const [ymd, setYmd] = useState(initial.ymd);
  const [hm, setHm] = useState(initial.hm);
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    if (open) {
      setYmd(initial.ymd);
      setHm(initial.hm);
      setMotivo("");
    }
  }, [open, initial.ymd, initial.hm]);

  // ESC para cerrar
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !citaId) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const iso = toIsoUTC(ymd, hm);
    if (!motivo.trim()) return;
    onConfirm(iso, motivo.trim());
  };

  // hoy como mínimo en el date input
  const minYmd = toYmd(new Date());

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="res-title"
      >
        <div className={styles.modalHeader}>
          <h3 id="res-title" className={styles.modalTitle}>
            Reprogramar cita #{citaId}
          </h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.modalHint}>
            Selecciona nueva fecha y hora (intervalos de 1 hora entre 8:00 y 16:00), e indica un motivo.
          </p>

          {error && <div className={styles.error} style={{ marginBottom: 8 }}>{error}</div>}

          <form onSubmit={submit} className={styles.modalForm}>
            <label className={styles.field}>
              <span>Nueva fecha</span>
              <input
                type="date"
                value={ymd}
                onChange={(e) => setYmd(e.target.value)}
                min={minYmd}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Nueva hora</span>
              <select value={hm} onChange={(e) => setHm(e.target.value)} required>
                {HOURS.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>Motivo</span>
              <textarea
                rows={2}
                placeholder="Ej. el paciente solicitó mover la cita."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                required
              />
            </label>

            <div className={styles.modalActions}>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cerrar
              </button>
              <button
                type="submit"
                className={`btn btn-info ${loading ? "disabled" : ""}`}
                disabled={loading || !motivo.trim()}
              >
                {loading ? "Reprogramando..." : "Reprogramar cita"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
