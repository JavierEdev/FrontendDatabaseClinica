import { useEffect } from "react";
import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import KpiCard from "@/features/dashboard/components/KpiCard";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, PieChart, Pie, Cell
} from "recharts";
import { Link } from "react-router-dom";
import "./dashboard.css";

const COLORS = {
  area: { confirmada:"#60a5fa", reprogramada:"#f59e0b", cancelada:"#ef4444" },
  bar:  { cobrados:"#10b981", pendientes:"#6b7280" },
  pie:  ["#6366f1","#34d399","#f59e0b","#ef4444","#a78bfa","#f472b6","#22d3ee","#93c5fd"]
};

export default function DashboardPage() {
  const {
    desde, hasta, especialidad, kpis, serieCitas, ingresosMes, topProc, citasEsp, recetas, citasRec,
    espOptions, loading, err, pdfRef,
    setDesde, setHasta, setEspecialidad, presets, exportCSV, exportPDF
  } = useDashboard();

  useEffect(() => {
    const h = (e: any) => exportCSV(e.detail.name, e.detail.rows);
    window.addEventListener("export-csv", h as any);
    return () => window.removeEventListener("export-csv", h as any);
  }, [exportCSV]);

  return (
    <div className="dash-wrap">

      {/* ===== Header (frosted, sticky) con orden: título -> rango -> filtros -> acciones ===== */}
      <header className="dash-toolbar">
        <div className="dash-toolbar-top">
          <h1>Dashboard</h1>
          <p className="dash-sub">
            Rango <b>{desde}</b> a <b>{hasta}</b>{especialidad ? ` · ${especialidad}` : ""}
          </p>
        </div>

        <div className="dash-controls">
          <div className="dash-filters">
            <label className="dash-field">
              Desde
              <input type="date" value={desde} onChange={(e)=>setDesde(e.target.value)} className="dash-input"/>
            </label>
            <label className="dash-field">
              Hasta
              <input type="date" value={hasta} onChange={(e)=>setHasta(e.target.value)} className="dash-input"/>
            </label>
            <label className="dash-field">
              Especialidad (opcional)
              <select
                value={especialidad||""}
                onChange={(e)=>setEspecialidad(e.target.value||undefined)}
                className="dash-select"
              >
                <option value="">Todas</option>
                {espOptions.map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </label>

            <div className="btn-group-chip">
              <button className="btn btn-chip" onClick={presets.hoy}>Hoy</button>
              <button className="btn btn-chip" onClick={presets.semana}>Semana</button>
              <button className="btn btn-chip" onClick={presets.quincena}>Quincena</button>
              <button className="btn btn-chip" onClick={presets.mes}>Mes</button>
            </div>
          </div>

          <div className="dash-actions">
            <button onClick={()=>exportPDF("dashboard.pdf")} className="btn btn-primary">Exportar PDF</button>
            <Link to="/admin/medicos" className="btn btn-action">Ver médicos</Link>
            <Link to="/admin/citas" className="btn btn-action">Ver citas</Link>
            <Link to="/admin/pacientes" className="btn btn-action">Ver pacientes</Link>
          </div>
        </div>
      </header>

      {loading && <div className="dash-card p-16 mt-4">Cargando…</div>}
      {err && !loading && <div className="dash-card p-16 mt-4">Error: {err}</div>}

      <div ref={pdfRef}>
        {/* KPIs */}
        {kpis && !loading && !err && (
          <section className="dash-row cols-4 mt-4">
            <KpiCard label="Pacientes atendidos" value={kpis.pacientesAtendidos}/>
            <KpiCard label="Citas programadas" value={kpis.citas.programadas}/>
            <KpiCard label="Consultas atendidas" value={kpis.consultas.total}/>
            <KpiCard label="Consultas con procedimientos" value={kpis.consultas.conProcedimientos}/>
            <KpiCard label="Ingresos generados (Q)" value={kpis.ingresos.cobradosQ.toFixed(2)}/>
            <KpiCard label="Ingresos próximos (Q)" value={kpis.ingresos.pendientesQ.toFixed(2)}/>
            <KpiCard label="Citas confirmadas" value={kpis.citas.confirmadas}/>
            <KpiCard label="Reprogramadas / canceladas" value={`${kpis.citas.reprogramadas} / ${kpis.citas.canceladas}`}/>
          </section>
        )}

        <section className="dash-card p-16 mt-4">
          <div className="section-head">
            <h3>Citas por día</h3>
            <button className="btn btn-ghost" onClick={() => exportCSV("citas_por_dia", serieCitas)}>
              Exportar CSV
            </button>
          </div>
          {serieCitas.length === 0 ? <div className="text-gray-500">Sin datos.</div> : (
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serieCitas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis allowDecimals={false}/>
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="confirmada" name="confirmada"
                        stroke={COLORS.area.confirmada} fill={COLORS.area.confirmada} fillOpacity={0.35} stackId="1" />
                  <Area type="monotone" dataKey="reprogramada" name="reprogramada"
                        stroke={COLORS.area.reprogramada} fill={COLORS.area.reprogramada} fillOpacity={0.35} stackId="1" />
                  <Area type="monotone" dataKey="cancelada" name="cancelada"
                        stroke={COLORS.area.cancelada} fill={COLORS.area.cancelada} fillOpacity={0.35} stackId="1" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="dash-row cols-2 mt-4">
          <div className="dash-card p-16">
            <div className="section-head">
              <h3>Ingresos (cobrados vs pendientes) por mes</h3>
              <button className="btn btn-ghost" onClick={() => exportCSV("ingresos_mensual", ingresosMes)}>
                Exportar CSV
              </button>
            </div>
            {ingresosMes.length === 0 ? <div className="text-gray-500">Sin datos.</div> : (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ingresosMes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="cobrados" name="cobrados" fill={COLORS.bar.cobrados} />
                    <Bar dataKey="pendientes" name="pendientes" fill={COLORS.bar.pendientes} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="dash-card p-16">
            <div className="section-head">
              <h3>Citas por especialidad</h3>
              <button className="btn btn-ghost" onClick={() => exportCSV("citas_por_especialidad", citasEsp)}>
                Exportar CSV
              </button>
            </div>
            {citasEsp.length === 0 ? <div className="text-gray-500">Sin datos.</div> : (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={citasEsp} dataKey="cantidad" nameKey="especialidad" label outerRadius={100}>
                      {citasEsp.map((_, i) => <Cell key={i} fill={COLORS.pie[i % COLORS.pie.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        <section className="dash-card p-16 mt-4">
          <div className="section-head">
            <h3>Top 5 procedimientos por ingresos</h3>
            <button className="btn btn-ghost" onClick={() => exportCSV("top_procedimientos", topProc)}>
              Exportar CSV
            </button>
          </div>
          {topProc.length === 0 ? <div className="text-gray-500">Sin datos.</div> : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Procedimiento</th>
                    <th className="nowrap">Cantidad</th>
                    <th className="num-right nowrap">Total (Q)</th>
                  </tr>
                </thead>
                <tbody>
                  {topProc.map((r, i) => (
                    <tr key={i}>
                      <td>{r.procedimiento}</td>
                      <td className="nowrap">{r.cantidad}</td>
                      <td className="num-right nowrap">{Number(r.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="dash-row cols-2 mt-4">
          <div className="dash-card p-16">
            <div className="section-head">
              <h3>Recetas recientes (Top 5)</h3>
              <button className="btn btn-ghost" onClick={() => exportCSV("recetas_recientes", recetas)}>
                Exportar CSV
              </button>
            </div>
            {recetas.length === 0 ? <div className="text-gray-500">Sin datos.</div> : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="nowrap">#</th>
                      <th>Medicamento</th>
                      <th className="nowrap">Dosis</th>
                      <th className="nowrap">Frecuencia</th>
                      <th className="nowrap">Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recetas.map(r => (
                      <tr key={r.id_receta}>
                        <td className="nowrap">#{r.id_receta}</td>
                        <td>{r.medicamento}</td>
                        <td className="nowrap">{r.dosis}</td>
                        <td className="nowrap">{r.frecuencia}</td>
                        <td className="nowrap">{r.duracion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="dash-card p-16">
            <div className="section-head">
              <h3>Citas recientes (Top 5)</h3>
              <button className="btn btn-ghost" onClick={() => exportCSV("citas_recientes", citasRec)}>
                Exportar CSV
              </button>
            </div>
            {citasRec.length === 0 ? (
              <div className="text-gray-500">Sin datos.</div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th className="nowrap">Fecha / hora</th>
                      <th>Médico</th>
                      <th className="nowrap">Especialidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {citasRec.map((c) => (
                      <tr key={c.id}>
                        <td className="nowrap">{new Date(c.fecha).toLocaleString()}</td>
                        <td>{c.medico ?? "—"}</td>
                        <td className="nowrap">{c.especialidad ?? "—"}</td>
                        <td className="num-right">
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
