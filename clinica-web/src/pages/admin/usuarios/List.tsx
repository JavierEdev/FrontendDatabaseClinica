import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./List.module.css";
import { useListarUsuarios } from "@/features/usuarios/hooks/useListarUsuarios";
import { UsuariosTable } from "@/features/usuarios/ui/UsuariosTable";

export default function UsuariosListPage() {
  const { data, loading, error, refetch } = useListarUsuarios();
  const nav = useNavigate();

  // búsqueda y paginación
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // filtrar
  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter(u => {
      const uName = (u.username ?? "").toLowerCase();
      const uRol  = (u.rol ?? "").toLowerCase();
      return uName.includes(term) || uRol.includes(term);
    });
  }, [data, q]);

  // paginar
  const total = filtrados.length;
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to   = total ? Math.min(page * pageSize, total) : 0;

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtrados.slice(start, start + pageSize);
  }, [filtrados, page, pageSize]);

  useEffect(() => { setPage(1); }, [q, pageSize]);

  return (
    <div className={styles.wrap}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Usuarios</h1>
            <p className={styles.subtitle}>Gestiona los usuarios del sistema</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.searchBox}>
              <input
                placeholder="Buscar por usuario o rol…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && (
                <button className={styles.clearBtn} onClick={() => setQ("")}>×</button>
              )}
            </div>

            <Link to="/admin/usuarios/crear" className={styles.primaryBtn}>
              + Crear usuario
            </Link>
          </div>
        </div>

        <UsuariosTable
          rows={pageItems}
          loading={loading}
          error={error}
          onView={(id) => nav(`/admin/usuarios/${id}`)}
        />

        {/* Footer*/}
        <div className={styles.footer}>
          <div className={styles.rows}>
            <label>
              Filas:&nbsp;
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); }}
              >
                {[10, 20, 50].map((n) => (<option key={n} value={n}>{n}</option>))}
              </select>
            </label>
          </div>

          <div className={styles.range}>
            {total ? (<>{from}-{to} de {total}</>) : "—"}
          </div>

          <div className={styles.pager}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              ← Anterior
            </button>
            <span>Página {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={to >= total || loading}
            >
              Siguiente →
            </button>
          </div>
        </div>

        {!loading && error && (
          <div className={styles.error} style={{ marginTop: 12 }}>
            {error} &nbsp;<button onClick={refetch}>Reintentar</button>
          </div>
        )}
      </div>
    </div>
  );
}
