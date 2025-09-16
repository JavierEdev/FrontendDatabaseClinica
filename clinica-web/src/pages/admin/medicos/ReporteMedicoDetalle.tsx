import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styles from "./ReporteDetallePage.module.css";
import { useProductividadMedicos } from "@/features/medicos/reportes/hooks/useProductividadMedicos";
import { useIngresosPorServicio } from "@/features/medicos/reportes/hooks/useIngresosPorServicio";

function useQuery() { return new URLSearchParams(useLocation().search); }

function toYmdLocal(d: Date = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const dd = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function ReporteMedicoDetalle() {
  const nav = useNavigate();
  const { idMedico: idStr } = useParams();
  const idMedico = Number(idStr);
  const q = useQuery();

  const today = toYmdLocal();
  const [desde, setDesde] = useState(q.get("desde") || today);
  const [hasta, setHasta] = useState(q.get("hasta") || today);

  const { items, loading, error } = useProductividadMedicos(desde, hasta, idMedico);
  const rep = items[0]; 

  const { items: servicios, loading: loadingSrv } =
    useIngresosPorServicio(desde, hasta, idMedico);

  // Quick chips
  const chips = useMemo(() => ([
    { k: "Hoy", fn: () => {
        const d = new Date();
        const ymd = toYmdLocal(d);
        setDesde(ymd); setHasta(ymd);
      }
    },
    { k: "Semana", fn: () => {
        const s = new Date();
        const diff = (s.getDay()+6)%7; 
        s.setDate(s.getDate()-diff);
        const e = new Date(s);
        e.setDate(s.getDate()+6);
        setDesde(toYmdLocal(s)); setHasta(toYmdLocal(e));
      }
    },
    { k: "Mes", fn: () => {
        const now = new Date();
        const s = new Date(now.getFullYear(), now.getMonth(), 1);
        const e = new Date(now.getFullYear(), now.getMonth()+1, 0);
        setDesde(toYmdLocal(s)); setHasta(toYmdLocal(e));
      }
    },
  ]), []);

  const nombre = rep?.NombreMedico || `Médico #${idMedico}`;
  const especialidad = rep?.Especialidad ?? "—";

  const kpis = {
    programadas: rep?.CitasProgramadas ?? 0,
    atendidas:   rep?.CitasAtendidas   ?? 0,
    canceladas:  rep?.CitasCanceladas  ?? 0,

    pacientes:    rep?.PacientesAtendidos      ?? 0,
    procedimientos: rep?.ProcedimientosRealizados ?? 0,
    ingresos:     rep?.IngresosGenerados       ?? 0,

    prodDia:      rep?.ProductividadCitasDia   ?? 0,
  };

  return (
    <div className={styles.page}>
      {/* Header fijo */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => nav(-1)}>← Volver</button>
        <h1 className={styles.title}>Reporte de {nombre}</h1>
      </header>

      {/* Meta + rango (fijo) */}
      <section className={styles.card}>
        <div className={styles.metaGrid}>
          <div className={styles.field}>
            <div className={styles.label}>Especialidad</div>
            <div className={styles.value}>{especialidad}</div>
          </div>

          <div className={styles.field}>
            <div className={styles.label}>Rango</div>
            <div className={styles.value}>{desde} — {hasta}</div>
          </div>

          <div className={styles.field}>
            <div className={styles.label}>Desde</div>
            <input
              type="date"
              className={styles.inputDate}
              value={desde}
              onChange={(e)=>setDesde(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <div className={styles.label}>Hasta</div>
            <input
              type="date"
              className={styles.inputDate}
              value={hasta}
              onChange={(e)=>setHasta(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.toolbar}>
          {chips.map(c => (
            <button key={c.k} className={styles.chip} onClick={c.fn}>{c.k}</button>
          ))}
        </div>
      </section>

      {/* Mensajes de carga/error debajo de la meta, sin romper layout */}
      {error && <div className={styles.card}>Error: {error}</div>}

      {/* KPIs: siempre renderizamos con valores 0 si no hay datos */}
      <section className={styles.row}>
        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Citas</h3>
          <div className={styles.kpiGrid}>
            <Field label="Programadas" value={kpis.programadas} />
            <Field label="Atendidas (consultas)" value={kpis.atendidas} />
            <Field label="Canceladas" value={kpis.canceladas} />
            <Field label="Prod. por día" value={kpis.prodDia.toFixed(2)} />
          </div>
        </article>

        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Resultados</h3>
          <div className={styles.kpiGrid}>
            <Field label="Pacientes atendidos" value={kpis.pacientes} />
            <Field label="Procedimientos" value={kpis.procedimientos} />
            <Field label="Ingresos generados" value={`Q${kpis.ingresos.toFixed(2)}`} mono />
          </div>
        </article>
      </section>

      {/* Hint “sin datos” si el API no devolvió fila */}
      {!loading && !error && !rep && (
        <div className={styles.card}>
          <div className={styles.empty}>Sin datos para este rango.</div>
        </div>
      )}

      {/* Top servicios */}
      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Top servicios por ingresos</h3>
        {loadingSrv ? (
          <div className={styles.empty}>Cargando…</div>
        ) : servicios.length === 0 ? (
          <div className={styles.empty}>Sin ventas en este rango.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Procedimiento</th>
                  <th>Cantidad</th>
                  <th className={styles.right}>Total (Q)</th>
                </tr>
              </thead>
              <tbody>
                {servicios.map((s, i) => (
                  <tr key={`${s.procedimiento}-${i}`}>
                    <td>{s.procedimiento}</td>
                    <td>{s.cantidad}</td>
                    <td className={styles.right}>{s.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className={styles.fieldKpi}>
      <div className={styles.label}>{label}</div>
      <div className={`${styles.value} ${mono ? styles.mono : ""}`}>{value}</div>
    </div>
  );
}
