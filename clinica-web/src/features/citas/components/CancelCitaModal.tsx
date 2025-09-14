import { useEffect, useState } from "react";
import styles from "@/pages/admin/pacientes/List.module.css";

export default function CancelCitaModal({
  open,
  citaId,
  onClose,
  onConfirm,
  loading = false,
  error = null,
}: {
  open: boolean;
  citaId: number | null;
  onClose: () => void;
  onConfirm: (razon: string) => void; // el parent hace la llamada a la API
  loading?: boolean;
  error?: string | null;
}) {
  const [razon, setRazon] = useState("");

  // reset al abrir
  useEffect(() => {
    if (open) setRazon("");
  }, [open]);

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
    const r = razon.trim();
    if (!r) return;
    onConfirm(r);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="cancel-title"
      >
        <div className={styles.modalHeader}>
          <h3 id="cancel-title" className={styles.modalTitle}>
            Cancelar cita #{citaId}
          </h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.modalHint}>
            Indica la razón de cancelación. La cita quedará marcada como <strong>cancelada</strong>.
          </p>

          {error && <div className={styles.error} style={{ marginBottom: 8 }}>{error}</div>}

          <form onSubmit={submit} className={styles.modalForm}>
            <label className={styles.field}>
              <span>Razón</span>
              <textarea
                rows={3}
                placeholder="Ej. el paciente no podrá asistir, se reprogramará, etc."
                value={razon}
                onChange={(e) => setRazon(e.target.value)}
                required
              />
            </label>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={onClose}
                disabled={loading}
              >
                Cerrar
              </button>
              <button
                type="submit"
                className={`${styles.btnPrimary} ${loading ? styles.btnDisabled : ""}`}
                disabled={loading || !razon.trim()}
              >
                {loading ? "Cancelando..." : "Confirmar cancelación"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
