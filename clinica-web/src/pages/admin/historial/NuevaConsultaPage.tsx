import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import styles from "./AgregarConsultaPage.module.css";

import { crearConsultaPaciente } from "@/features/pacientes/api/pacientes";
import type { CrearConsultaPayload } from "@/features/pacientes/model/pacientes";

import { fetchCitaDetalle } from "@/features/citas/api/citas";
import type { CitaDetalle } from "@/features/citas/model/citas";

import { fetchMedicoById } from "@/features/medicos/api/MedicosController";
import type { MedicoDetalleResponse } from "@/features/medicos/models/Medico";

import {
  getCatalogoProcedimientos,
  agregarProcedimientoAConsulta,
} from "@/features/procedimientos/api/procedimientos";
import type { CatalogoProcedimiento } from "@/features/procedimientos/models/Procedimiento";

// ---------------- utils ----------------
function toInputLocal(iso: string) {
  // Convierte ISO a "YYYY-MM-DDTHH:mm" local
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${min}`;
}
function nowInputLocal() {
  return toInputLocal(new Date().toISOString());
}
function fmtDT(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(d);
}

export default function NuevaConsultaPacientePage() {
  const nav = useNavigate();
  const { idPaciente } = useParams<{ idPaciente: string }>();
  const [sp] = useSearchParams();

  const pacienteId = Number(idPaciente);
  const idCita = Number(sp.get("idCita") || "0");
  const idMedicoQS = Number(sp.get("idMedico") || "0"); // opcional por query

  // ------ estado cita / médico ------
  const [det, setDet] = useState<CitaDetalle | null>(null);
  const [idMedico, setIdMedico] = useState<number | null>(idMedicoQS || null);
  const [med, setMed] = useState<MedicoDetalleResponse | null>(null);

  // ------ formulario ------
  const [fechaInput, setFechaInput] = useState<string>(nowInputLocal());
  const [idProcSel, setIdProcSel] = useState<number | "">("");
  const [motivoConsulta, setMotivoConsulta] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // ------ catálogo ------
  const [catalogo, setCatalogo] = useState<CatalogoProcedimiento[]>([]);

  // ------ ui ------
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // Cargar detalle de la cita y catálogo
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr(null);

        if (!pacienteId || !idCita) {
          setErr("Faltan parámetros (paciente/cita).");
          return;
        }

        const catPromise = getCatalogoProcedimientos(ac.signal);

        // Si no viene idMedico en la query, lo tomamos de la cita
        const detalle = await fetchCitaDetalle(pacienteId, idCita, ac.signal);
        setDet(detalle);
        if (!idMedicoQS) setIdMedico(detalle.idMedico);

        // Prefill de fecha con la fecha de la cita (si aplica)
        if (detalle?.fecha) setFechaInput(toInputLocal(detalle.fecha));

        const cat = await catPromise;
        setCatalogo(cat.filter((x) => x.activo));
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          setErr(e?.message || "No se pudo cargar la página.");
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [pacienteId, idCita, idMedicoQS]);

  // Cargar médico cuando tengamos idMedico
  useEffect(() => {
    if (!idMedico) { setMed(null); return; }
    const ac = new AbortController();
    (async () => {
      const m = await fetchMedicoById(idMedico, ac.signal);
      setMed(m);
    })();
    return () => ac.abort();
  }, [idMedico]);

  const medicoNombreUi =
    (med ? `${med.nombres} ${med.apellidos}` : det?.medicoNombre) ??
    (idMedico ? `Médico #${idMedico}` : "—");

  const especialidadUi = med?.especialidad ?? det?.especialidad ?? "—";

  const puedeGuardar = useMemo(() => {
    return Boolean(
      pacienteId &&
        idCita &&
        idMedico &&
        idProcSel &&
        motivoConsulta.trim() &&
        diagnostico.trim() &&
        !saving
    );
  }, [pacienteId, idCita, idMedico, idProcSel, motivoConsulta, diagnostico, saving]);

  const onGuardar = async () => {
    if (!puedeGuardar) return;
    try {
      setSaving(true);
      setErr(null);
      setOk(null);

      const payload: Omit<CrearConsultaPayload, "idPaciente"> = {
        idMedico: idMedico!,
        fecha: new Date(fechaInput).toISOString(),
        motivoConsulta: motivoConsulta.trim(),
        diagnostico: diagnostico.trim(),
        observaciones: observaciones.trim(),
        idCita,
      };

      // 1) crear consulta
      const resp = await crearConsultaPaciente(pacienteId, payload);
      const idConsulta = resp.idConsulta;

      // 2) asociar procedimiento
      await agregarProcedimientoAConsulta(idConsulta, Number(idProcSel));

      setOk("Consulta creada y procedimiento agregado.");
      setTimeout(() => nav(`/admin/citas/${pacienteId}/${idCita}`), 700);
    } catch (e: any) {
      setErr(e?.message || "No se pudo guardar la consulta.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.btnGhost} onClick={() => nav(-1)}>← Regresar</button>
        <h1 className={styles.title}>Nueva consulta</h1>
      </header>

      {/* Meta (médico / cita) */}
      {det && (
        <section className={styles.card}>
          <div className={styles.rows}>
            <div className={styles.row}>
              <div className={styles.label}>Médico</div>
              <div className={styles.value}><strong>{medicoNombreUi}</strong></div>
            </div>
            <div className={styles.row}>
              <div className={styles.label}>Especialidad</div>
              <div className={styles.value}>{especialidadUi}</div>
            </div>
            <div className={styles.row}>
              <div className={styles.label}>Cita</div>
              <div className={styles.value}>
                #{det.id} · {fmtDT(det.fecha)} &nbsp;·&nbsp;
                <Link to={`/admin/citas/${pacienteId}/${idCita}`} className={styles.btnSec}>Ver cita</Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Form */}
      <section className={styles.card}>
        {loading && <div className={styles.empty}>Cargando…</div>}
        {err && <div className={styles.error}>{err}</div>}
        {!loading && !err && (
          <>
            <div className={styles.grid}>
              <label className={styles.field}>
                <span>Fecha / hora</span>
                <input
                  type="datetime-local"
                  value={fechaInput}
                  onChange={(e) => setFechaInput(e.target.value)}
                />
              </label>

              <label className={styles.field}>
                <span>Procedimiento</span>
                <select
                  value={idProcSel}
                  onChange={(e) => setIdProcSel(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">— Selecciona —</option>
                  {catalogo.map((p) => (
                    <option key={p.idProcedimientoCatalogo} value={p.idProcedimientoCatalogo}>
                      {p.codigo} · {p.nombre}{p.precioBase != null ? ` — Q${p.precioBase}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className={styles.field}>
              <span>Motivo de consulta</span>
              <textarea
                rows={2}
                value={motivoConsulta}
                onChange={(e) => setMotivoConsulta(e.target.value)}
                placeholder="¿Qué trae al paciente?"
              />
            </label>

            <label className={styles.field}>
              <span>Diagnóstico</span>
              <textarea
                rows={2}
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                placeholder="Observaciones clínicas, CIE-10, etc."
              />
            </label>

            <label className={styles.field}>
              <span>Observaciones</span>
              <textarea
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Notas adicionales"
              />
            </label>

            {ok && <div className={styles.ok}>{ok}</div>}
            {err && <div className={styles.error}>{err}</div>}

            <div className={styles.actions}>
              <button
                className={`${styles.btnPrimary} ${!puedeGuardar ? styles.btnDisabled : ""}`}
                onClick={onGuardar}
                disabled={!puedeGuardar}
                title={!puedeGuardar ? "Completa procedimiento, motivo y diagnóstico" : undefined}
              >
                {saving ? "Guardando..." : "Guardar consulta"}
              </button>
              <button className={styles.btnGhost} onClick={() => nav(-1)} disabled={saving}>
                Cancelar
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
