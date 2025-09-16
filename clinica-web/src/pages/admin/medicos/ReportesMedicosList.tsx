import { useMemo, useState } from "react";
import styles from "./ReportesListPage.module.css";
import { Link } from "react-router-dom";
import { useProductividadMedicos } from "@/features/medicos/reportes/hooks/useProductividadMedicos";

function toYmdLocal(d: Date = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function rangoMesActual() {
  const now = new Date();
  const desde = new Date(now.getFullYear(), now.getMonth(), 1);
  const hasta = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { desde: toYmdLocal(desde), hasta: toYmdLocal(hasta) };
}

export default function ReportesMedicosList() {
  const today = toYmdLocal();
  const [desde, setDesde] = useState(today);
  const [hasta, setHasta] = useState(today);
  const [q, setQ] = useState("");

  const { items, loading, error, refetch } = useProductividadMedicos(desde, hasta);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter(x =>
      x.NombreMedico.toLowerCase().includes(term) ||
      (x.Especialidad || "").toLowerCase().includes(term) ||
      String(x.IdMedico).includes(term)
    );
  }, [items, q]);

  const kpis = useMemo(() => {
    const sum = (f: (x: any)=>number) => filtered.reduce((a, b) => a + f(b), 0);
    return {
      programadas: sum(x => x.CitasProgramadas),
      atendidas: sum(x => x.CitasAtendidas),
      canceladas: sum(x => x.CitasCanceladas),
      ingresos: sum(x => x.IngresosGenerados),
    };
  }, [filtered]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Reportes de médicos</h1>
          <p className={styles.subtitle}>
            Rango: <strong>{desde}</strong> a <strong>{hasta}</strong>
          </p>
        </div>
      </header>

      {/* KPIs */}
      <section className={styles.kpis}>
        <Kpi label="Citas programadas" value={kpis.programadas} />
        <Kpi label="Atendidas (consultas)" value={kpis.atendidas} />
        <Kpi label="Canceladas" value={kpis.canceladas} />
        <Kpi label="Ingresos (Q)" value={kpis.ingresos.toFixed(2)} />
      </section>

      {/* Filtros */}
      <section className={styles.toolbar}>
        <input className={styles.input} placeholder="Buscar médico, especialidad o #…"
               value={q} onChange={(e)=>setQ(e.target.value)} />

        <div className={styles.range}>
          <label>Desde <input className={styles.inputDate} type="date" value={desde} onChange={(e)=>setDesde(e.target.value)} /></label>
          <label>Hasta <input className={styles.inputDate} type="date" value={hasta} onChange={(e)=>setHasta(e.target.value)} /></label>
        </div>

        <div className={styles.chips}>
          <button className={styles.chip} onClick={() => {
            const d = new Date();
            setDesde(toYmdLocal(d)); setHasta(toYmdLocal(d));
          }}>Hoy</button>
          <button className={styles.chip} onClick={() => {
            const s = new Date();
            const diff = (s.getDay()+6)%7;
            s.setDate(s.getDate()-diff);
            const e = new Date(s);
            e.setDate(s.getDate()+6);
            setDesde(toYmdLocal(s)); setHasta(toYmdLocal(e));
          }}>Semana</button>
          <button className={styles.chip} onClick={() => {
            const {desde: d, hasta: h} = rangoMesActual();
            setDesde(d); setHasta(h);
          }}>Mes</button>
          <button className={styles.chip} onClick={() => refetch()}>Refrescar</button>
        </div>
      </section>

      {/* Tabla */}
      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Médico</th>
              <th>Especialidad</th>
              <th>Prog.</th>
              <th>Atendidas</th>
              <th>Canceladas</th>
              <th>No show</th>
              <th>Pacientes</th>
              <th>Proced.</th>
              <th>Ingresos</th>
              <th>Prod./día</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={12} className={styles.empty}>Cargando…</td></tr>}
            {error && !loading && <tr><td colSpan={12} className={styles.empty}>Error: {error}</td></tr>}
            {!loading && !error && filtered.length === 0 && (
              <tr><td colSpan={12} className={styles.empty}>Sin datos en este rango.</td></tr>
            )}
            {!loading && !error && filtered.map((r) => (
              <tr key={r.IdMedico}>
                <td>#{r.IdMedico}</td>
                <td>{r.NombreMedico}</td>
                <td>{r.Especialidad ?? "—"}</td>
                <td>{r.CitasProgramadas}</td>
                <td>{r.CitasAtendidas}</td>
                <td>{r.CitasCanceladas}</td>
                <td>{r.CitasNoAsistidas}</td>
                <td>{r.PacientesAtendidos}</td>
                <td>{r.ProcedimientosRealizados}</td>
                <td>Q{r.IngresosGenerados.toFixed(2)}</td>
                <td>{r.ProductividadCitasDia.toFixed(2)}</td>
                <td className={styles.actions}>
                  <Link className={styles.btn} to={`/admin/medicos/reportes/${r.IdMedico}?desde=${desde}&hasta=${hasta}`}>Ver</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiLabel}>{label}</div>
      <div className={styles.kpiValue}>{value}</div>
    </div>
  );
}
