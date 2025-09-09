import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTodasCitas } from "@/features/citas/api/citas";
import type { APICitaAdmin as CitaAdmin } from "@/features/citas/model/citas";
import type { CitaEstado } from "@/features/citas/model/citas";
import styles from "./AdminCitasList.module.css";

type SortKey = "fecha" | "estado" | "id" | "idPaciente" | "idMedico";
type SortDir = "asc" | "desc";

function fmtDT(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short" }).format(d);
}
const toDate = (s: string, end = false) => new Date(end ? `${s}T23:59:59` : `${s}T00:00:00`);

export default function AdminCitasList() {
  const nav = useNavigate();
  const [citas, setCitas] = useState<CitaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // filtros
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<"TODOS" | CitaEstado>("TODOS");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // orden
  const [sortKey, setSortKey] = useState<SortKey>("fecha");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

useEffect(() => {
  const ctrl = new AbortController();
  let alive = true;               // evita setState luego del unmount
  setLoading(true);

  (async () => {
    try {
      const data = await fetchTodasCitas(ctrl.signal);
      if (!alive) return;
      setCitas(data);
      setErr(null);
    } catch (e: any) {
      if (e?.name === "AbortError" || e?.message?.includes("aborted")) return;
      if (!alive) return;
      setErr(e?.message ?? "Error desconocido");
    } finally {
      if (alive) setLoading(false);
    }
  })();

  return () => {
    alive = false;
    ctrl.abort();
  };
}, []);

  const total = citas.length;

  const kpis = useMemo(() => {
    const acc: Record<CitaEstado, number> = {
      CONFIRMADA: 0,
      CANCELADA: 0,
      REPROGRAMADA: 0,
      PENDIENTE: 0,
    };
    for (const c of citas) acc[c.estado] = (acc[c.estado] ?? 0) + 1;
    return acc;
  }, [citas]);

  // filtrar
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const f = from ? toDate(from, false) : null;
    const t = to ? toDate(to, true) : null;

    return citas.filter((c) => {
      const d = new Date(c.fecha);
      const byEstado = estado === "TODOS" || c.estado === estado;
      const byQ =
        !ql ||
        `${c.id}`.includes(ql) ||
        `${c.idPaciente}`.includes(ql) ||
        `${c.idMedico}`.includes(ql) ||
        (c.medicoNombre?.toLowerCase().includes(ql) ?? false) ||
        (c.especialidad?.toLowerCase().includes(ql) ?? false) ||
        c.estado.toLowerCase().includes(ql) ||
        fmtDT(c.fecha).toLowerCase().includes(ql);
      const byFrom = !f || d >= f;
      const byTo = !t || d <= t;
      return byEstado && byQ && byFrom && byTo;
    });
  }, [citas, q, estado, from, to]);

  // ordenar
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let va: number | string, vb: number | string;
      switch (sortKey) {
        case "fecha": va = new Date(a.fecha).getTime(); vb = new Date(b.fecha).getTime(); break;
        case "estado": va = a.estado; vb = b.estado; break;
        case "id": va = a.id; vb = b.id; break;
        case "idPaciente": va = a.idPaciente; vb = b.idPaciente; break;
        case "idMedico": va = a.idMedico; vb = b.idMedico; break;
        default: va = 0; vb = 0;
      }
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalFiltrado = filtered.length;

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(k); setSortDir("asc"); }
  };

  const quick = (which: "hoy" | "semana" | "mes" | "limpiar") => {
    if (which === "limpiar") { setFrom(""); setTo(""); return; }
    const now = new Date();
    const toISO = (d: Date) => d.toISOString().slice(0, 10);
    if (which === "hoy") {
      const s = new Date(now); s.setHours(0,0,0,0);
      const e = new Date(now); e.setHours(23,59,59,999);
      setFrom(toISO(s)); setTo(toISO(e));
    } else if (which === "semana") {
      const s = new Date(now);
      const diff = (s.getDay() + 6) % 7; // lunes
      s.setDate(s.getDate() - diff); s.setHours(0,0,0,0);
      const e = new Date(s); e.setDate(e.getDate() + 6); e.setHours(23,59,59,999);
      setFrom(toISO(s)); setTo(toISO(e));
    } else {
      const s = new Date(now.getFullYear(), now.getMonth(), 1, 0,0,0,0);
      const e = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23,59,59,999);
      setFrom(toISO(s)); setTo(toISO(e));
    }
  };

  if (loading) return <div className={styles.page}>Cargando citas…</div>;
  if (err) return <div className={styles.page}>Error: {err}</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Listado general de citas</h1>
          <p className={styles.subtitle}>Total: <strong>{total}</strong> — Filtradas: <strong>{totalFiltrado}</strong></p>
        </div>
      </header>

      {/* KPIs */}
      <section className={styles.kpis}>
        <Kpi label="Confirmadas" value={kpis.CONFIRMADA} />
        <Kpi label="Reprogramadas" value={kpis.REPROGRAMADA} />
        <Kpi label="Canceladas" value={kpis.CANCELADA} />
        <Kpi label="Pendientes" value={kpis.PENDIENTE} />
      </section>

      {/* Filtros */}
      <section className={styles.toolbar}>
        <input className={styles.input} placeholder="Buscar (id, médico, especialidad, estado, fecha)…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={styles.input} value={estado} onChange={(e) => setEstado(e.target.value as any)}>
          <option value="TODOS">Todos los estados</option>
          <option value="CONFIRMADA">Confirmadas</option>
          <option value="REPROGRAMADA">Reprogramadas</option>
          <option value="CANCELADA">Canceladas</option>
          <option value="PENDIENTE">Pendientes</option>
        </select>
        <div className={styles.range}>
          <label>Desde <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
          <label>Hasta <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        </div>
        <div className={styles.chips}>
          <button className={styles.chip} onClick={() => quick("hoy")}>Hoy</button>
          <button className={styles.chip} onClick={() => quick("semana")}>Semana</button>
          <button className={styles.chip} onClick={() => quick("mes")}>Mes</button>
          <button className={styles.chip} onClick={() => quick("limpiar")}>Limpiar</button>
        </div>
      </section>

      {/* Tabla */}
      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th onClick={() => toggleSort("id")}># {sortKey === "id" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
              <th onClick={() => toggleSort("fecha")}>Fecha / Hora {sortKey === "fecha" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
              <th>Médico</th>
              <th>Especialidad</th>
              <th onClick={() => toggleSort("estado")}>Estado {sortKey === "estado" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
              <th onClick={() => toggleSort("idPaciente")}>Paciente {sortKey === "idPaciente" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
              <th onClick={() => toggleSort("idMedico")}>Médico ID {sortKey === "idMedico" ? (sortDir === "asc" ? "↑" : "↓") : ""}</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{fmtDT(c.fecha)}</td>
                <td>{c.medicoNombre ?? "—"}</td>
                <td>{c.especialidad ?? "—"}</td>
                <td>
                  <span className={`${styles.badge} ${styles[`st_${c.estado}`] || ""}`}>{c.estado.toLowerCase()}</span>
                </td>
                <td>#{c.idPaciente}</td>
                <td>#{c.idMedico}</td>
                <td className={styles.actions}>
                  <button onClick={() => nav(`/admin/citas/${c.idPaciente}/${c.id}`)}>Ver</button>
                  <button onClick={() => nav(`/pacientes/${c.idPaciente}`)}>Paciente</button>
                  <button onClick={() => nav(`/medicos/${c.idMedico}`)}>Médico</button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={8} className={styles.empty}>No hay citas con esos filtros.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>{value}</div>
    </div>
  );
}