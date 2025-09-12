import type { Usuario } from "../model/usuarios";
import styles from "@/pages/admin/usuarios/List.module.css";

export function UsuariosTable({
  rows,
  loading,
  error,
  onView,
}: {
  rows: Usuario[];
  loading?: boolean;
  error?: string;
  onView?: (id: number) => void;
}) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Usuario</th>
            <th>Rol</th>
            <th>ID Médico</th>
            <th>ID Paciente</th>
            <th className={styles.right}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={`sk-u-${i}`} className={styles.skeletonRow}>
                <td colSpan={6}>&nbsp;</td>
              </tr>
            ))}

          {!loading && error && (
            <tr><td colSpan={6} className={styles.error}>{error}</td></tr>
          )}

          {!loading && !error && rows.length === 0 && (
            <tr><td colSpan={6} className={styles.empty}>No hay usuarios para mostrar.</td></tr>
          )}

          {!loading && !error && rows.map(u => (
            <tr key={u.id}>
              <td className={styles.mono}>{u.id}</td>
              <td className={styles.name}>{u.username}</td>
              <td><span className={styles.badge}>{u.rol}</span></td>
              <td className={styles.mono}>{u.idMedico ?? "—"}</td>
              <td className={styles.mono}>{u.idPaciente ?? "—"}</td>
              <td className={`${styles.right} ${styles.actions}`}>
                <button onClick={() => onView?.(u.id)}>Ver</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
