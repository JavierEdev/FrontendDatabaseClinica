import { useEffect, useState } from "react";
import { obtener, pdfUrl } from "../api/recetas";
import type { RecetaVm } from "../model/tipos";
import styles from "./RecetaModal.module.css";

export default function RecetaModal({
  id, open, onClose
}: { id?: number; open: boolean; onClose: () => void; }) {
  const [data, setData] = useState<RecetaVm|undefined>();
  const [loading, setL] = useState(false);
  const [error, setE] = useState("");

  useEffect(() => {
    if (!open || !id) return;
    const ctrl = new AbortController();
    setE(""); setL(true);
    obtener(id).then(setData).catch(e=>setE(e.message || "Error"))
      .finally(()=>setL(false));
    return () => ctrl.abort();
  }, [open, id]);

  if (!open) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e=>e.stopPropagation()}>
        <header className={styles.header}>
          <h3 className={styles.title}>Receta #{id}</h3>
          <button onClick={onClose} className={styles.close}>×</button>
        </header>

        <div className={styles.body}>
          {loading && <p>Cargando…</p>}
          {!loading && error && <p className={styles.error}>{error}</p>}
          {!loading && !error && data && (
            <div className={styles.grid}>
              <Field label="Consulta">{data.idConsulta}</Field>
              <Field label="Medicamento">{data.medicamento}</Field>
              <Field label="Dosis">{data.dosis}</Field>
              <Field label="Frecuencia">{data.frecuencia}</Field>
              <Field label="Duración">{data.duracion}</Field>
            </div>
          )}
        </div>

        <footer className={styles.footer}>
          {id && (
            <a className={styles.btnPrimary} href={pdfUrl(id)} target="_blank" rel="noreferrer">
              Descargar PDF
            </a>
          )}
          <button onClick={onClose} className={styles.btnGhost}>Cerrar</button>
        </footer>
      </div>
    </div>
  );
}

function Field({label, children}:{label:string; children:React.ReactNode}) {
  return (
    <div>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{children}</div>
    </div>
  );
}
