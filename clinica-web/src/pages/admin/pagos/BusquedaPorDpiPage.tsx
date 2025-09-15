// src/pages/admin/historial/BusquedaPorDpiPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./BusquedaPorDpiPage.module.css";

import { fetchPacienteByDpi } from "@/features/pacientes/api/pacientes";
import type { PacienteDetalleResponse } from "@/features/pacientes/model/pacientes";

import { fetchCitasPorPaciente } from "@/features/citas/api/citas";
import type { CitaPaciente } from "@/features/citas/model/citas";

import {
  listarConsultasDePaciente,
  getTotalConsulta,
  generarFactura,
  pagarFactura,
  type Factura,
  type ConsultaItem,
} from "@/features/facturacion/api/facturacion";

function fmtDT(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(d);
}

/** ===== Modal para facturar y cobrar ===== */
function PagoModal({
  open,
  idPaciente,
  idCita,
  onClose,
  onDone,
}: {
  open: boolean;
  idPaciente: number | null;
  idCita: number | null;
  onClose: () => void;
  onDone: () => void; // recarga de citas si queda pagada
}) {
  const [consultas, setConsultas] = useState<ConsultaItem[]>([]);
  const [idConsultaSel, setIdConsultaSel] = useState<number | "">("");
  const [total, setTotal] = useState<number | null>(null);

  const [tipoPago, setTipoPago] = useState<"efectivo" | "tarjeta" | "transferencia">("efectivo");
  const [factura, setFactura] = useState<Factura | null>(null);

  const [monto, setMonto] = useState<string>("0.00");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  // cargar consultas y preseleccionar por idCita si corresponde
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        setFactura(null);
        setTotal(null);
        setMonto("0.00");
        setIdConsultaSel("");

        if (!open || !idPaciente) return;

        const list = await listarConsultasDePaciente(idPaciente, 1, 50, ac.signal);
        setConsultas(list);

        let pre: number | "" = "";
        if (idCita) {
          const match = list.find((x) => x.idCita === idCita);
          if (match) pre = match.idConsulta;
        }
        if (!pre && list.length > 0) {
          // más reciente
          pre = [...list].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0]
            .idConsulta;
        }
        setIdConsultaSel(pre);

        if (pre) {
          const t = await getTotalConsulta(Number(pre), ac.signal);
          setTotal(t);
          setMonto(String(t ?? 0));
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e?.message || "No se pudo cargar información.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [open, idPaciente, idCita]);

  // cuando cambie la consulta, recalcular total
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      if (!open) return;
      if (!idConsultaSel) {
        setTotal(null);
        return;
      }
      try {
        setWorking(true);
        const t = await getTotalConsulta(Number(idConsultaSel), ac.signal);
        setTotal(t);
        setMonto(String(t ?? 0));
        setErr(null);
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e?.message || "No se pudo obtener el total.");
      } finally {
        setWorking(false);
      }
    })();
    return () => ac.abort();
  }, [idConsultaSel, open]);

  const puedeGenerar = open && idPaciente && idConsultaSel && !factura && !working;
  const puedePagar = open && factura && Number(monto) > 0 && !working;

  async function onGenerar() {
    if (!puedeGenerar) return;
    try {
      setWorking(true);
      setErr(null);
      const f = await generarFactura(
        {
          id_paciente: idPaciente!,
          id_consulta: Number(idConsultaSel),
          tipo_pago: tipoPago,
        },
        undefined
      );
      setFactura(f);
      // si viene total en factura, prefijar monto
      if (typeof f.monto_total === "number") setMonto(String(f.monto_total));
    } catch (e: any) {
      setErr(e?.message || "No se pudo generar la factura.");
    } finally {
      setWorking(false);
    }
  }

  async function onPagar() {
    if (!puedePagar) return;
    const val = Number(monto);
    if (!isFinite(val) || val <= 0) {
      setErr("Ingresa un monto válido mayor a 0.");
      return;
    }

    try {
      setWorking(true);
      setErr(null);
      const resp = await pagarFactura(
        {
          id_factura: factura!.id_factura,
          monto: val,
          metodo_pago: tipoPago,
          fecha_pago: new Date().toISOString(),
        },
        undefined
      );

      // Si quedó saldada, cerrar y notificar
      if (resp.saldo_pendiente <= 0 || resp.estado_factura === "pagada") {
        alert("Pago registrado. Factura saldada.");
        onDone();
        onClose();
        return;
      }

      // Si aún tiene saldo, mantener modal y mostrar saldo
      alert(`Pago registrado. Saldo pendiente: Q${resp.saldo_pendiente}`);
      // refrescar valores de referencia
      setFactura((f) =>
        f ? { ...f, estado_pago: resp.estado_factura as any, monto_total: f.monto_total } : f
      );
      setMonto(String(resp.saldo_pendiente));
    } catch (e: any) {
      setErr(e?.message || "No se pudo procesar el pago.");
    } finally {
      setWorking(false);
    }
  }

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Facturar y cobrar</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>

        {loading ? (
          <div className={styles.empty}>Cargando…</div>
        ) : (
          <>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>Consulta</span>
                <select
                  value={idConsultaSel}
                  onChange={(e) => setIdConsultaSel(e.target.value ? Number(e.target.value) : "")}
                  disabled={!!factura || working}
                >
                  {consultas.length === 0 && <option value="">— Sin consultas —</option>}
                  {consultas.map((c) => (
                    <option key={c.idConsulta} value={c.idConsulta}>
                      #{c.idConsulta} — {new Date(c.fecha).toLocaleString()}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span>Tipo de pago</span>
                <select
                  value={tipoPago}
                  onChange={(e) => setTipoPago(e.target.value as any)}
                  disabled={!!factura || working}
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                </select>
              </label>

              <label className={styles.field}>
                <span>Total</span>
                <input value={total != null ? `Q${total}` : "—"} disabled />
              </label>
            </div>

            {!factura ? (
              <div className={styles.actions}>
                <button
                  className={`${styles.btnPrimary} ${!puedeGenerar ? styles.btnDisabled : ""}`}
                  onClick={onGenerar}
                  disabled={!puedeGenerar}
                >
                  {working ? "Generando…" : "Generar factura"}
                </button>
                <button className={styles.btnGhost} onClick={onClose} disabled={working}>
                  Cancelar
                </button>
              </div>
            ) : (
              <>
                <div className={styles.sectionSubTitle}>Factura #{factura.id_factura}</div>
                <div className={styles.tableWrap}>
                  <table className={styles.miniTable}>
                    <thead>
                      <tr>
                        <th>Procedimiento</th>
                        <th className={styles.right}>Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {factura.lineas?.map((l, i) => (
                        <tr key={i}>
                          <td>{l.procedimiento}</td>
                          <td className={styles.right}>Q{l.precio}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className={styles.right}><strong>Total</strong></td>
                        <td className={styles.right}><strong>Q{factura.monto_total}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className={styles.grid}>
                  <label className={styles.field}>
                    <span>Monto a cobrar (Q)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      disabled={working}
                    />
                  </label>
                </div>

                <div className={styles.actions}>
                  <button
                    className={`${styles.btnPrimary} ${!puedePagar ? styles.btnDisabled : ""}`}
                    onClick={onPagar}
                    disabled={!puedePagar}
                  >
                    {working ? "Procesando…" : "Registrar pago"}
                  </button>
                  <button className={styles.btnGhost} onClick={onClose} disabled={working}>
                    Cerrar
                  </button>
                </div>
              </>
            )}

            {err && <div className={styles.error} style={{ marginTop: 8 }}>{err}</div>}
          </>
        )}
      </div>
    </div>
  );
}
/** ===== Fin modal ===== */

export default function BusquedaPorDpiPage() {
  const nav = useNavigate();

  const [dpi, setDpi] = useState("");
  const [pac, setPac] = useState<PacienteDetalleResponse | null>(null);
  const [citas, setCitas] = useState<CitaPaciente[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // pago modal
  const [pagoOpen, setPagoOpen] = useState(false);
  const [citaParaPago, setCitaParaPago] = useState<number | null>(null);

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
        // si tu backend marca las pagadas, puedes filtrarlas aquí si quieres:
        setCitas(list || []);
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

  const recargarCitas = async () => {
    if (!pac) return;
    setLoading(true);
    try {
      const list = await fetchCitasPorPaciente(pac.idPaciente);
      setCitas(list || []);
    } finally {
      setLoading(false);
    }
  };

  const abrirPago = (idCita: number) => {
    setCitaParaPago(idCita);
    setPagoOpen(true);
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
            onClick={recargarCitas}
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
                      <span className={`${styles.badge} ${styles[`st_${String(c.estado).toUpperCase()}`] || ""}`}>
                        {String(c.estado).toLowerCase()}
                      </span>
                    </td>
                    <td className={styles.right}>
                      <div className={styles.rowBtns}>
                        <button
                          className={`${styles.btnSec} ${styles.btnSm}`}
                          onClick={() => abrirPago(c.id)}
                        >
                          Procesar pago
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

      {/* Modal de facturación y pago */}
      <PagoModal
        open={pagoOpen}
        idPaciente={pac?.idPaciente ?? null}
        idCita={citaParaPago}
        onClose={() => { setPagoOpen(false); setCitaParaPago(null); }}
        onDone={recargarCitas}
      />
    </div>
  );
}
