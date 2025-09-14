import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import styles from "./AgregarConsultaPage.module.css";

import { fetchPacienteById } from "@/features/pacientes/api/pacientes";
import type { PacienteDetalleResponse } from "@/features/pacientes/model/pacientes";

import { fetchCitaDetalle } from "@/features/citas/api/citas";
import type { CitaDetalle } from "@/features/citas/model/citas";

import { fetchMedicoById } from "@/features/medicos/api/MedicosController";
import type { MedicoDetalleResponse } from "@/features/medicos/models/Medico";

import { crearConsultaPaciente } from "@/features/pacientes/api/pacientes";

function toDatetimeLocalValue(date: Date) {
  // "YYYY-MM-DDTHH:mm" para <input type="datetime-local">
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function Field({
  label,
  children,
  colSpan,
}: {
  label: string;
  children: React.ReactNode;
  colSpan?: number;
}) {
  return (
    <label className={styles.field} style={colSpan ? { gridColumn: `span ${colSpan}` } : undefined}>
      <span className={styles.label}>{label}</span>
      <div className={styles.control}>{children}</div>
    </label>
  );
}

export default function NuevaConsultaPage() {
  const nav = useNavigate();
  const { idPaciente } = useParams<{ idPaciente: string }>();
  const [sp] = useSearchParams();
  const idCita = Number(sp.get("idCita") || 0);

  const [pac, setPac] = useState<PacienteDetalleResponse | null>(null);
  const [cita, setCita] = useState<CitaDetalle | null>(null);
  const [med, setMed] = useState<MedicoDetalleResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Form
  const [fechaLocal, setFechaLocal] = useState<string>(toDatetimeLocalValue(new Date()));
  const [motivo, setMotivo] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);

  // Cargar paciente, cita y médico
  useEffect(() => {
    const pid = Number(idPaciente);
    if (!pid || !idCita) {
      setErr("Parámetros inválidos.");
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const [p, c] = await Promise.all([
          fetchPacienteById(pid, ac.signal),
          fetchCitaDetalle(pid, idCita, ac.signal),
        ]);
        setPac(p);
        setCita(c);

        if (c?.idMedico) {
          const m = await fetchMedicoById(c.idMedico, ac.signal);
          setMed(m);
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e?.message || "No se pudo cargar información.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [idPaciente, idCita]);

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

  const onUsarFechaCita = () => {
    if (!cita?.fecha) return;
    setFechaLocal(toDatetimeLocalValue(new Date(cita.fecha)));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pac || !cita?.idMedico || !idCita) return;

    if (!motivo.trim() || !diagnostico.trim()) {
      alert("Motivo y diagnóstico son obligatorios.");
      return;
    }

    try {
      setSaving(true);

      // Convertimos el datetime-local a ISO (Z)
      const fechaIso = new Date(fechaLocal).toISOString();

      const res = await crearConsultaPaciente(pac.idPaciente, {
        idMedico: cita.idMedico,
        idCita: idCita,
        fecha: fechaIso,
        motivoConsulta: motivo.trim(),
        diagnostico: diagnostico.trim(),
        observaciones: observaciones.trim(),
      });

      alert(`Consulta creada (ID ${res.idConsulta}).`);
      // Llévalo al detalle de la cita (ya existe esa ruta)
      nav(`/admin/citas/${pac.idPaciente}/${idCita}`, { replace: true });
    } catch (e: any) {
      alert(e?.message || "No se pudo crear la consulta.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.page}>Cargando…</div>;
  if (err) return <div className={styles.page}>Error: {err}</div>;
  if (!pac || !cita) return <div className={styles.page}>No se encontró información.</div>;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.icon}>📝</div>
        <div>
          <h1 className={styles.title}>Nueva consulta</h1>
          <div className={styles.subtitle}>
            Paciente #{pac.idPaciente} — {pac.apellidos} {pac.nombres}
          </div>
        </div>
      </header>

      {/* Resumen Paciente / Cita / Médico */}
      <div className={styles.card} style={{ marginBottom: 12 }}>
        <div className={styles.sectionTitle}>Contexto</div>
        <div className={styles.grid3}>
          <Field label="DPI">
            <input readOnly value={pac.dpi} />
          </Field>
          <Field label="Edad / Sexo">
            <input readOnly value={`${edad ?? "—"} ${edad !== null ? "años" : ""}${pac.sexo ? ` · ${pac.sexo}` : ""}`} />
          </Field>
          <Field label="Cita seleccionada">
            <input readOnly value={new Date(cita.fecha).toLocaleString()} />
          </Field>

          <Field label="Médico">
            <input readOnly value={med ? `${med.nombres} ${med.apellidos}` : `#${cita.idMedico}`} />
          </Field>
          <Field label="Especialidad">
            <input readOnly value={med?.especialidad ?? "—"} />
          </Field>
          <Field label="Colegiado">
            <input readOnly value={med?.numeroColegiado ?? "—"} />
          </Field>
        </div>
      </div>

      {/* Formulario de consulta */}
      <form className={styles.card} onSubmit={onSubmit} noValidate>
        <h2 className={styles.sectionTitle}>Datos de la consulta</h2>

        <div className={styles.grid3}>
          <Field label="Fecha/hora de la consulta">
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="datetime-local"
                value={fechaLocal}
                onChange={(e) => setFechaLocal(e.target.value)}
                required
              />
              <button type="button" className={styles.btnGhost} onClick={onUsarFechaCita}>
                Usar fecha de la cita
              </button>
            </div>
          </Field>

          <Field label="Motivo de consulta" colSpan={3}>
            <textarea
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Motivo principal por el que consulta…"
              required
              style={{ width: "100%", resize: "vertical", padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb" }}
            />
          </Field>

          <Field label="Diagnóstico" colSpan={3}>
            <textarea
              rows={3}
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              placeholder="Diagnóstico clínico…"
              required
              style={{ width: "100%", resize: "vertical", padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb" }}
            />
          </Field>

          <Field label="Observaciones" colSpan={3}>
            <textarea
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Exámenes, recomendaciones, seguimiento…"
              style={{ width: "100%", resize: "vertical", padding: "8px 10px", borderRadius: 10, border: "1px solid #e5e7eb" }}
            />
          </Field>
        </div>

        <div className={styles.actions}>
          <button className={styles.btnPrimary} disabled={saving}>
            {saving ? "Guardando..." : "Crear consulta"}
          </button>
          <Link to={`/admin/citas/${pac.idPaciente}/${idCita}`} className={styles.btnGhost}>
            Volver a la cita
          </Link>
        </div>
      </form>
    </div>
  );
}
