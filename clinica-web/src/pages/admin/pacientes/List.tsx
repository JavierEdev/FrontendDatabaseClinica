import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./List.module.css";
import { listarPacientes } from "@/features/pacientes/api/pacientes";

type PacienteItem = {
  idPaciente: number;
  nombres: string;
  apellidos: string;
  dpi?: string;
  fechaNacimiento?: string; // ISO
  sexo?: "M" | "F";
  telefono?: string;
  correo?: string;
  numeroHistoriaClinica?: string;
};

type ListaResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: PacienteItem[];
};

function edad(fechaIso?: string) {
  if (!fechaIso) return null;
  const f = new Date(fechaIso);
  if (isNaN(f.getTime())) return null;
  const hoy = new Date();
  let e = hoy.getFullYear() - f.getFullYear();
  const m = hoy.getMonth() - f.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) e--;
  return e;
}

export default function PacientesListPage() {
  const [data, setData] = useState<ListaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const nav = useNavigate();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listarPacientes(page, pageSize)
      .then((res) => alive && (setData(res), setErr(null)))
      .catch((e) => alive && setErr(e?.message ?? "Error"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [page, pageSize]);

  const items = useMemo(() => {
    const src = data?.items ?? [];
    const filtered = q.trim()
      ? src.filter((x) => {
          const full = `${x.nombres} ${x.apellidos}`.toLowerCase();
          return (
            full.includes(q.toLowerCase()) ||
            (x.dpi ?? "").toLowerCase().includes(q.toLowerCase())
          );
        })
      : src;

    const ordered = [...filtered].sort((a, b) => {
      const an = `${a.apellidos ?? ""} ${a.nombres ?? ""}`.toLowerCase();
      const bn = `${b.apellidos ?? ""} ${b.nombres ?? ""}`.toLowerCase();
      return sortAsc ? an.localeCompare(bn) : bn.localeCompare(an);
    });

    return ordered;
  }, [data, q, sortAsc]);

  const from = data ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return (
    <div className={styles.wrap}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Lista de Pacientes</h1>
            <p className={styles.subtitle}>Busca, ordena y gestiona pacientes</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.searchBox}>
              <input
                placeholder="Buscar por nombre o DPI…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && (
                <button className={styles.clearBtn} onClick={() => setQ("")}>
                  ×
                </button>
              )}
            </div>
            <Link to="/admin/pacientes/nuevo" className={styles.primaryBtn}>
              + Agregar Paciente
            </Link>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>N° HC</th>
                <th className={styles.sortable} onClick={() => setSortAsc(!sortAsc)}>
                  Paciente {sortAsc ? "▲" : "▼"}
                </th>
                <th>DPI</th>
                <th>Edad / Sexo</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th className={styles.right}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`} className={styles.skeletonRow}>
                    <td colSpan={7}>&nbsp;</td>
                  </tr>
                ))}

              {!loading && err && (
                <tr><td colSpan={7} className={styles.error}>{err}</td></tr>
              )}

              {!loading && !err && items.length === 0 && (
                <tr><td colSpan={7} className={styles.empty}>No hay pacientes para mostrar.</td></tr>
              )}

              {!loading && !err && items.map((p) => (
                <tr key={p.idPaciente}>
                  <td className={styles.mono}>{p.numeroHistoriaClinica ?? "—"}</td>
                  <td><div className={styles.name}>{p.apellidos} {p.nombres}</div></td>
                  <td className={styles.mono}>{p.dpi ?? "—"}</td>
                  <td>
                    <span className={styles.badge}>{edad(p.fechaNacimiento) ?? "—"} años</span>
                    {p.sexo && (
                      <span className={`${styles.badge} ${p.sexo === "M" ? styles.badgeBlue : styles.badgePink}`}>
                        {p.sexo}
                      </span>
                    )}
                  </td>
                  <td>{p.telefono ?? "—"}</td>
                  <td className={styles.truncate} title={p.correo ?? ""}>{p.correo ?? "—"}</td>
                  <td className={`${styles.right} ${styles.actions}`}>
                    <button onClick={() => nav(`/admin/pacientes/${p.idPaciente}`)}>Ver</button>
                    <button onClick={() => nav(`/admin/citas/nueva?paciente=${p.idPaciente}`)}>Nueva cita</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.footer}>
          <div className={styles.rows}>
            <label>
              Filas:&nbsp;
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
              >
                {[10, 20, 50, 100].map((n) => (<option key={n} value={n}>{n}</option>))}
              </select>
            </label>
          </div>
          <div className={styles.range}>{data ? (<>{from}-{to} de {data.total}</>) : "—"}</div>
          <div className={styles.pager}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!data || page <= 1 || loading}>← Anterior</button>
            <span>Página {page}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={!data || to >= (data?.total ?? 0) || loading}>Siguiente →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
