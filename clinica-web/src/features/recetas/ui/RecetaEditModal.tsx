import { useEffect, useState } from "react";
import { obtener } from "../api/recetas";
import { useActualizarReceta } from "../hooks/useActualizarReceta";
import type { RecetaUpdateDto, RecetaVm } from "../model/tipos";
import styles from "./RecetaEditModal.module.css";

export default function RecetaEditModal({
  id, open, onClose, onSaved
}: {
  id?: number;
  open: boolean;
  onClose: () => void;
  onSaved?: (r: RecetaVm) => void;
}) {
  const [data, setData] = useState<RecetaVm | undefined>();
  const [v, setV] = useState<RecetaUpdateDto>({
    medicamento: "", dosis: "", frecuencia: "", duracion: ""
  });
  const { submit, loading, error } = useActualizarReceta();

  useEffect(() => {
    if (!open || !id) return;
    let alive = true;
    obtener(id).then(rec => {
      if (!alive) return;
      setData(rec);
      setV({
        medicamento: rec.medicamento,
        dosis: rec.dosis,
        frecuencia: rec.frecuencia,
        duracion: rec.duracion,
      });
    }).catch(() => {});
    return () => { alive = false; };
  }, [open, id]);

  function set<K extends keyof RecetaUpdateDto>(k: K, val: RecetaUpdateDto[K]) {
    setV(s => ({ ...s, [k]: val }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    const updated = await submit(id, v);
    onSaved?.(updated);
    onClose();
  }

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e=>e.stopPropagation()}>
        <header className={styles.header}>
          <h3 className={styles.title}>Editar receta #{id}</h3>
          <button className={styles.close} onClick={onClose}>×</button>
        </header>

        <form className={styles.body} onSubmit={onSubmit}>
          {!data ? (
            <p>Cargando…</p>
          ) : (
            <div className={styles.grid}>
              <Field label="Medicamento">
                <input className={styles.input} value={v.medicamento} onChange={e=>set("medicamento", e.target.value)} required />
              </Field>
              <Field label="Dosis">
                <input className={styles.input} value={v.dosis} onChange={e=>set("dosis", e.target.value)} required />
              </Field>
              <Field label="Frecuencia">
                <input className={styles.input} value={v.frecuencia} onChange={e=>set("frecuencia", e.target.value)} required />
              </Field>
              <Field label="Duración">
                <input className={styles.input} value={v.duracion} onChange={e=>set("duracion", e.target.value)} required />
              </Field>
            </div>
          )}

          {error && <div className={styles.alertError}>{error}</div>}

          <footer className={styles.footer}>
            <button className={styles.btnPrimary} disabled={loading || !data}>
              {loading ? "Guardando…" : "Guardar cambios"}
            </button>
            <button type="button" className={styles.btnGhost} onClick={onClose} disabled={loading}>
              Cancelar
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.control}>{children}</div>
    </label>
  );
}
