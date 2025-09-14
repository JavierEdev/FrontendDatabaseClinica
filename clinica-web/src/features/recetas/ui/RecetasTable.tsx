import type { RecetaVm } from "../model/tipos";
import styles from "@/pages/admin/recetas/ListReceta.module.css";

export default function RecetasTable({
  rows, loading, error, onView, onPdf, onEdit
}: {
  rows: RecetaVm[];
  loading?: boolean;
  error?: string;
  onView?: (id: number) => void;
  onPdf?: (id: number) => void;
  onEdit?: (id: number) => void;
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Consulta</th>
            <th>Medicamento</th>
            <th>Dosis</th>
            <th>Frecuencia</th>
            <th>Duración</th>
            <th className={styles.right}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading && Array.from({length:6}).map((_,i)=>(
            <tr key={`sk-r-${i}`} className={styles.skeletonRow}><td colSpan={7}>&nbsp;</td></tr>
          ))}
          {!loading && error && (
            <tr><td colSpan={7} className={styles.error}>{error}</td></tr>
          )}
          {!loading && !error && rows.length===0 && (
            <tr><td colSpan={7} className={styles.empty}>No hay recetas.</td></tr>
          )}
          {!loading && !error && rows.map(r=>(
            <tr key={r.idReceta}>
              <td className={styles.mono}>{r.idReceta}</td>
              <td className={styles.mono}>{r.idConsulta}</td>
              <td className={styles.name}>{r.medicamento}</td>
              <td>{r.dosis}</td>
              <td>{r.frecuencia}</td>
              <td>{r.duracion}</td>
              <td className={`${styles.right} ${styles.actions}`}>
                <button onClick={()=>onView?.(r.idReceta)}>Ver</button>
                <button onClick={()=>onEdit?.(r.idReceta)}>Editar</button>
                <button onClick={()=>onPdf?.(r.idReceta)}>PDF</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
