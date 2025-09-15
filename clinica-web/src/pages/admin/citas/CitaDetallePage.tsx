import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchCitaDetalle, cancelarCita } from "@/features/citas/api/citas";
import type { CitaDetalle } from "@/features/citas/model/citas";

import { fetchPacienteById } from "@/features/pacientes/api/pacientes";
import type { PacienteDetalleResponse } from "@/features/pacientes/model/pacientes";

import { fetchMedicoById } from "@/features/medicos/api/MedicosController";
import type { MedicoDetalleResponse } from "@/features/medicos/models/Medico";

import styles from "./CitaDetallePage.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import RescheduleCitaModal from "@/features/citas/components/RescheduleCitaModal";
import { reprogramarCita } from "@/features/citas/api/citas";

import CancelCitaModal from "@/features/citas/components/CancelCitaModal";

import ReassignMedicoModal from "@/features/citas/components/ReassignMedicoModal";
import { reasignarMedicoDeCita } from "@/features/citas/api/citas";

function fmtDT(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(d);
}
function calcEdad(iso?: string | null) {
  if (!iso) return null;
  const f = new Date(iso);
  if (isNaN(f.getTime())) return null;
  const hoy = new Date();
  let e = hoy.getFullYear() - f.getFullYear();
  const m = hoy.getMonth() - f.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) e--;
  return e;
}

export default function CitaDetallePage() {
  const nav = useNavigate();
  const { idPaciente, idCita } = useParams<{
    idPaciente: string;
    idCita: string;
  }>();

  const [det, setDet] = useState<CitaDetalle | null>(null);
  const [pac, setPac] = useState<PacienteDetalleResponse | null>(null);
  const [med, setMed] = useState<MedicoDetalleResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // cancelar modal
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelSaving, setCancelSaving] = useState(false);
  const [cancelErr, setCancelErr] = useState<string | null>(null);

  const [reOpen, setReOpen] = useState(false);
  const [reSaving, setReSaving] = useState(false);
  const [reErr, setReErr] = useState<string | null>(null);

  const [reassignOpen, setReassignOpen] = useState(false);

  // Carga cita + paciente en paralelo
  useEffect(() => {
    const pid = Number(idPaciente);
    const cid = Number(idCita);
    if (!pid || !cid) {
      setErr("Parámetros inválidos.");
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();
    let alive = true;
    setLoading(true);
    setErr(null);

    (async () => {
      try {
        const [detResp, pacResp] = await Promise.all([
          fetchCitaDetalle(pid, cid, ctrl.signal),
          fetchPacienteById(pid, ctrl.signal),
        ]);
        if (!alive) return;
        setDet(detResp);
        setPac(pacResp);
      } catch (e: any) {
        if (e?.name === "AbortError" || String(e?.message).includes("aborted"))
          return;
        if (!alive) return;
        setErr(e?.message ?? "Error al cargar datos");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [idPaciente, idCita]);

  // Médico
  useEffect(() => {
    if (!det?.idMedico) return;
    const ctrl = new AbortController();
    let alive = true;
    (async () => {
      try {
        const m = await fetchMedicoById(det.idMedico, ctrl.signal);
        if (alive) setMed(m);
      } catch (e) {
        if ((e as any)?.name === "AbortError") return;
      }
    })();
    return () => {
      alive = false;
      ctrl.abort();
    };
  }, [det?.idMedico]);

  const edad = useMemo(
    () => calcEdad(pac?.fechaNacimiento),
    [pac?.fechaNacimiento]
  );

  const onConfirmCancel = async (razon: string) => {
    if (!det) return;
    try {
      setCancelSaving(true);
      setCancelErr(null);
      await cancelarCita(det.id, razon);
      setDet({ ...det, estado: "CANCELADA" });
      setCancelOpen(false);
      alert("Cita cancelada.");
    } catch (e: any) {
      setCancelErr(e?.message || "No se pudo cancelar la cita.");
    } finally {
      setCancelSaving(false);
    }
  };

  const onConfirmReschedule = async (nuevaFechaIso: string, motivo: string) => {
    if (!det) return;
    try {
      setReSaving(true);
      setReErr(null);
      const ok = await reprogramarCita(det.id, nuevaFechaIso, motivo);
      if (!ok) throw new Error("No se pudo reprogramar la cita.");
      // refresca estado local
      setDet({ ...det, fecha: nuevaFechaIso, estado: "REPROGRAMADA" });
      setReOpen(false);
      alert("Cita reprogramada.");
    } catch (e: any) {
      setReErr(e?.message || "Error al reprogramar.");
    } finally {
      setReSaving(false);
    }
  };

  if (loading) return <div className={styles.page}>Cargando…</div>;
  if (err) return <div className={styles.page}>Error: {err}</div>;
  if (!det) return <div className={styles.page}>No se encontró la cita.</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => nav(-1)}>
          ← Regresar
        </button>
        <h1 className={styles.title}>Cita #{det.id}</h1>
      </header>

      {/* Datos de la cita */}
      <section className={styles.card}>
        <div className={styles.rows}>
          <Row label="Fecha / hora" value={fmtDT(det.fecha)} />
          <Row
            label="Estado"
            value={
              <span
                className={`${styles.badge} ${
                  styles[`st_${det.estado}`] || ""
                }`}
              >
                {det.estado.toLowerCase()}
              </span>
            }
          />
        </div>
        <div className={styles.actions}>
          <Link to="/admin/citas" className="btn btn-secondary">
            Volver al listado
          </Link>

          {det.estado !== "CANCELADA" && (
            <>
              <button
                type="button"
                className="btn btn-info ms-2"
                onClick={() => {
                  setReErr(null);
                  setReOpen(true);
                }}
              >
                Reprogramar cita
              </button>

              <button
                type="button"
                className="btn btn-primary ms-2"
                onClick={() => 
                  setReassignOpen(true)}
                >
                  Reasignar médico
              </button>

              <button
                type="button"
                className="btn btn-danger ms-2"
                onClick={() => {
                  setCancelErr(null);
                  setCancelOpen(true);
                }}
              >
                Cancelar cita
              </button>
            </>
          )}
        </div>
      </section>

      {/* Paciente + Médico lado a lado */}
      <section className={styles.gridTwo}>
        {/* Paciente */}
        <article className={styles.card}>
          <div className={styles.cardTitle}>Paciente</div>
          <div className={styles.rows}>
            <Row
              label="Nombre"
              value={pac ? `${pac.nombres} ${pac.apellidos}` : "—"}
            />
            <Row label="DPI" value={pac?.dpi ?? "—"} />
            <Row
              label="Edad / Sexo"
              value={`${edad ?? "—"} ${edad !== null ? "años" : ""}${
                pac?.sexo ? ` · ${pac.sexo}` : ""
              }`}
            />
            <Row label="Teléfono" value={pac?.telefono ?? "—"} />
            <Row label="Correo" value={pac?.correo ?? "—"} />
            <Row label="Dirección" value={pac?.direccion ?? "—"} />
            <Row label="Estado civil" value={pac?.estadoCivil ?? "—"} />
          </div>

          <div className={styles.sectionSubTitle}>Contactos de emergencia</div>
          {(pac?.contactosEmergencia?.length ?? 0) > 0 ? (
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
                  {pac!.contactosEmergencia.map((c) => (
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

          <div className={styles.actions}>
            <Link to="/admin/pacientes" className={styles.btnSec}>
              Ver pacientes
            </Link>
          </div>
        </article>

        {/* Médico */}
        <article className={styles.card}>
          <div className={styles.cardTitle}>Médico</div>
          <div className={styles.rows}>
            <Row
              label="Nombre"
              value={med ? `${med.nombres} ${med.apellidos}` : "—"}
            />
            <Row label="Colegiado" value={med?.numeroColegiado ?? "—"} />
            <Row label="Especialidad" value={med?.especialidad ?? "—"} />
            <Row label="Teléfono" value={med?.telefono ?? "—"} />
            <Row label="Correo" value={med?.correo ?? "—"} />
            <Row label="Horario" value={med?.horario ?? "—"} />
          </div>
          <div className={styles.actions}>
            <Link to="/admin/medicos" className={styles.btnSec}>
              Ver médicos
            </Link>
          </div>
        </article>
      </section>

      <RescheduleCitaModal
        open={reOpen}
        citaId={det?.id ?? null}
        currentFechaIso={det?.fecha}
        onClose={() => {
          setReErr(null);
          setReOpen(false);
        }}
        onConfirm={onConfirmReschedule}
        loading={reSaving}
        error={reErr}
      />

      <ReassignMedicoModal
        open={reassignOpen}
        citaId={det?.id ?? null}
        fechaISO={det?.fecha}
        especialidad={med?.especialidad ?? det?.especialidad ?? null}
        onClose={() => setReassignOpen(false)}
        onSaved={async (nuevoMedicoId) => {
          const nuevo = await fetchMedicoById(nuevoMedicoId).catch(() => null);
          if (!nuevo) {
            setDet(prev => (prev ? { ...prev, idMedico: nuevoMedicoId } : prev));
            return;
          }
          setDet(prev =>
            prev
              ? { ...prev, idMedico: nuevoMedicoId, medicoNombre: `${nuevo.nombres} ${nuevo.apellidos}` }
              : prev
          );
          setMed(nuevo);
          alert("Médico reasignado correctamente.");
        }}
      />

      <CancelCitaModal
        open={cancelOpen}
        citaId={det?.id ?? null}
        onClose={() => {
          setCancelErr(null);
          setCancelOpen(false);
        }}
        onConfirm={onConfirmCancel}
        loading={cancelSaving}
        error={cancelErr}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={styles.row}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
    </div>
  );
}
