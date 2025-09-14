// src/pages/admin/medicos/MedicosListPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../medicos/List.module.css";
import { getMedicos, fetchMedicoById } from "@/features/medicos/api/MedicosController";
import type { Medico, MedicoDetalleResponse } from "@/features/medicos/models/Medico";

type MedicoRow = Medico & {
  telefono?: string;
  horario?: string;
};

export default function MedicosListPage() {
  const nav = useNavigate();

  const [list, setList] = useState<MedicoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // detalles (teléfono/horario) se cargan aparte
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [q, setQ] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [filtroEsp, setFiltroEsp] = useState("Todas");

  // 1) Cargar listado base
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const base = await getMedicos({ signal: ac.signal });
        setList(base);
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e?.message || "No se pudo cargar el listado de médicos");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  // 2) Enriquecer con teléfono/horario (fetch por id)
  useEffect(() => {
    if (list.length === 0) return;

    let alive = true;
    const ac = new AbortController();

    (async () => {
      try {
        setDetailsLoading(true);

        const results = await Promise.all(
          list.map(async (m) => {
            const det = await fetchMedicoById(m.id, ac.signal);
            return { id: m.id, det };
          })
        );

        if (!alive) return;

        setList((prev) =>
          prev.map((m) => {
            const hit = results.find((r) => r.id === m.id)?.det as MedicoDetalleResponse | null;
            if (!hit) return m;
            return {
              ...m,
              telefono: hit.telefono || m.telefono,
              horario: hit.horario || m.horario,
            };
          })
        );
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        // no rompemos la UI si hay error en detalles
        if (import.meta.env.DEV) console.warn("[medicos] detalles error:", e);
      } finally {
        if (alive) setDetailsLoading(false);
      }
    })();

    return () => {
      alive = false;
      ac.abort();
    };
  }, [list.length]);

  const especialidades = useMemo(() => {
    const set = new Set<string>();
    list.forEach((m) => m.especialidad && set.add(m.especialidad));
    return ["Todas", ...Array.from(set).sort((a, b) => a.localeCompare(b, "es"))];
  }, [list]);

  const data = useMemo(() => {
    const term = q.trim().toLowerCase();

    const filtered = list.filter((m) => {
      const byEsp = filtroEsp === "Todas" || m.especialidad === filtroEsp;
      if (!term) return byEsp;
      const hay =
        m.nombreCompleto.toLowerCase().includes(term) ||
        (m.especialidad || "").toLowerCase().includes(term) ||
        (m.telefono || "").toLowerCase().includes(term);
      return byEsp && hay;
    });

    const ordered = [...filtered].sort((a, b) => {
      const an = (a.nombreCompleto || "").toLowerCase();
      const bn = (b.nombreCompleto || "").toLowerCase();
      return sortAsc ? an.localeCompare(bn, "es") : bn.localeCompare(an, "es");
    });

    return ordered;
  }, [list, q, sortAsc, filtroEsp]);

  return (
    <div className={styles.wrap}>
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Lista de Médicos</h1>
            <p className={styles.subtitle}>
              Busca, filtra y gestiona médicos {detailsLoading ? "· cargando detalles…" : ""}
            </p>
          </div>

          <div className={styles.headerActions}>
            {/* Filtro especialidad */}
            <select
              value={filtroEsp}
              onChange={(e) => setFiltroEsp(e.target.value)}
              title="Filtrar por especialidad"
              style={{ marginRight: 8 }}
            >
              {especialidades.map((esp) => (
                <option key={esp} value={esp}>{esp}</option>
              ))}
            </select>

            {/* Search */}
            <div className={styles.searchBox}>
              <input
                placeholder="Buscar por nombre, especialidad o teléfono…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && (
                <button className={styles.clearBtn} onClick={() => setQ("")}>
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th
                  className={styles.sortable}
                  onClick={() => setSortAsc(!sortAsc)}
                  title="Ordenar por nombre"
                >
                  Médico {sortAsc ? "▲" : "▼"}
                </th>
                <th>Especialidad</th>
                <th>Teléfono</th>
                <th>Horario</th>
                <th className={styles.right}>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`} className={styles.skeletonRow}>
                    <td colSpan={5}>&nbsp;</td>
                  </tr>
                ))}

              {!loading && err && (
                <tr>
                  <td colSpan={5} className={styles.error}>{err}</td>
                </tr>
              )}

              {!loading && !err && data.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.empty}>No hay médicos para mostrar.</td>
                </tr>
              )}

              {!loading && !err && data.map((m) => (
                <tr key={m.id}>
                  <td><div className={styles.name}>{m.nombreCompleto}</div></td>
                  <td>{m.especialidad || "—"}</td>
                  <td className={styles.mono}>{m.telefono || "—"}</td>
                  <td className={styles.truncate} title={m.horario || ""}>
                    {m.horario || "—"}
                  </td>
                  <td className={`${styles.right} ${styles.actions}`}>
                    <button onClick={() => nav(`/admin/medicos/${m.id}`)}>Ver</button>
                    {/* Aquí podrías poner “Agenda” o “Disponibilidad” si tienes esas rutas */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.range}>
            {loading ? "—" : `${data.length} ${data.length === 1 ? "médico" : "médicos"}`}
          </div>
        </div>
      </div>
    </div>
  );
}
