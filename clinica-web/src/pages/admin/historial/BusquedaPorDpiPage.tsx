import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./BusquedaPorDpiPage.module.css";

import { fetchPacienteByDpi } from "@/features/pacientes/api/pacientes"; // ← el GET /api/Pacientes/dpi/:dpi
import type { PacienteDetalleResponse } from "@/features/pacientes/model/pacientes";

import { fetchCitasPorPaciente } from "@/features/citas/api/citas";
import type { CitaPaciente } from "@/features/citas/model/citas";

function fmtDT(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(d);
}

export default function BusquedaPorDpiPage() {
  const nav = useNavigate();

  const [dpi, setDpi] = useState("");
  const [pac, setPac] = useState<PacienteDetalleResponse | null>(null);
  const [citas, setCitas] = useState<CitaPaciente[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function buscar() {
    const q = dpi.trim();
    if (!q) return;
    setLoading(true);
    setErr(null);
    try {
      const p = await fetchPacienteByDpi(q);
      setPac(p);
      if (p?.idPaciente) {
        const list = await fetchCitasPorPaciente(p.idPaciente);
        setCitas(list);
      } else {
        setCitas([]);
      }
    } catch (e: any) {
      setErr(e?.message || "No se pudo buscar.");
      setPac(null);
      setCitas([]);
    } finally {
      setLoading(false);
    }
  }

  const edad = useMemo(() => {
    if (!pac?.fechaNacimiento) return null;
    const f = new Date(pac.fechaNacimiento);
    if (isNaN(f.getTime())) return null;
    const hoy = new Date();
    let e = hoy.getFullYear() - f.getFullYear();
    const m = hoy.getMonth() - f.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) e--;
    return e;
  }, [pac?.fechaNacimiento]);

  const onNuevaConsulta = (idCita: number) => {
    if (!pac) return;
    nav(`/admin/pacientes/${pac.idPaciente}/consultas/nueva?idCita=${idCita}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Búsqueda por DPI</h1>
        <input
          placeholder="2456789012345"
          value={dpi}
          onChange={(e) => setDpi(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && buscar()}
        />
        <button className={styles.btnSec} onClick={buscar} disabled={loading}>
          Buscar
        </button>
      </div>

      {/* Paciente */}
      <section className={styles.card}>
        <div className={styles.cardTitle}>Paciente</div>

        {!pac && !loading && (
          <div className={styles.empty}>Ingresa un DPI y presiona Buscar.</div>
        )}
        {err && <div className={styles.empty}>Error: {err}</div>}
        {loading && <div className={styles.empty}>Cargando…</div>}

        {pac && (
          <>
            <div className={styles.rows}>
              <div className={styles.row}>
                <div className={styles.label}>Nombre</div>
                <div className={styles.value}>
                  <strong>
                    {pac.nombres} {pac.apellidos}
                  </strong>{" "}
                  <span className={styles.muted}>#{pac.idPaciente}</span>
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.label}>DPI</div>
                <div className={`${styles.value} ${styles.mono}`}>{pac.dpi}</div>
              </div>
              <div className={styles.row}>
                <div className={styles.label}>Edad / Sexo</div>
                <div className={styles.value}>
                  {edad ?? "—"} {edad !== null ? "años" : ""} {pac.sexo ? `· ${pac.sexo}` : ""}
                </div>
              </div>
              <div className={styles.row}>
                <div className={styles.label}>Teléfono</div>
                <div className={styles.value}>{pac.telefono ?? "—"}</div>
              </div>
              <div className={styles.row}>
                <div className={styles.label}>Correo</div>
                <div className={styles.value}>{pac.correo ?? "—"}</div>
              </div>
              <div className={styles.row}>
                <div className={styles.label}>Dirección</div>
                <div className={styles.value}>{pac.direccion ?? "—"}</div>
              </div>
              <div className={styles.row}>
                <div className={styles.label}>Estado civil</div>
                <div className={styles.value}>{pac.estadoCivil ?? "—"}</div>
              </div>
            </div>

            <div className={styles.sectionSubTitle}>Contactos de emergencia</div>
            {(pac.contactosEmergencia?.length ?? 0) > 0 ? (
              <div className={styles.tableWrap}>
                <table className={styles.miniTable}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Parentesco</th>
                      <th>Teléfono</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pac.contactosEmergencia.map((c) => (
                      <tr key={c.idContacto}>
                        <td>{c.nombre}</td>
                        <td>{c.parentesco}</td>
                        <td className={styles.mono}>{c.telefono ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.empty}>Sin contactos registrados.</div>
            )}
          </>
        )}
      </section>

      {/* Citas */}
      <section className={styles.card}>
        <div className={styles.cardTitleRow}>
          <div className={styles.cardTitle}>Citas del paciente</div>
          <button
            className={`${styles.btnSec} ${styles.btnSm}`}
            onClick={async () => {
              if (!pac) return;
              setLoading(true);
              try {
                const list = await fetchCitasPorPaciente(pac.idPaciente);
                setCitas(list);
              } finally {
                setLoading(false);
              }
            }}
            disabled={!pac || loading}
          >
            Recargar
          </button>
        </div>

        {!pac && <div className={styles.empty}>Selecciona un paciente.</div>}

        {pac && citas.length === 0 && !loading && (
          <div className={styles.empty}>No hay citas para este paciente.</div>
        )}

        {pac && citas.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.miniTable}>
              <thead>
                <tr>
                  <th>Fecha / hora</th>
                  <th className={styles.right}>Estado</th>
                  <th className={styles.right}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {citas.map((c) => (
                  <tr key={c.id}>
                    <td>{fmtDT(c.fecha)}</td>
                    <td className={styles.right}>
                      <span className={`${styles.badge} ${styles[`st_${c.estado}`] || ""}`}>
                        {c.estado.toLowerCase()}
                      </span>
                    </td>
                    <td className={styles.right}>
                      <div className={styles.rowBtns}>
                        <button
                          className={`${styles.btnSec} ${styles.btnSm}`}
                          onClick={() => onNuevaConsulta(c.id)}
                        >
                          Nueva consulta
                        </button>
                        <Link
                          className={`${styles.btnSec} ${styles.btnSm}`}
                          to={`/admin/citas/${pac.idPaciente}/${c.id}`}
                        >
                          Ver detalle
                        </Link>
                      </div>
                    </td>
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
