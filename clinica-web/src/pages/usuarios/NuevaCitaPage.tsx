// src/pages/NuevaCitaPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./NuevaCitaPage.module.css";
import {
  getMedicos,
  getDisponibilidadMedico,
} from "@/features/medicos/api/MedicosController";
import type { Medico } from "@/features/medicos/models/Medico";
import { crearCita } from "@/features/citas/api/citas";
import { obtenerIdPacientePorUsuario } from "@/features/usuarios/api/usuarios";

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function formatDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
function toZulu(dateYmd: string, timeHm: string) {
  return `${dateYmd}T${timeHm}:00.000Z`;
}
// tu endpoint acepta "YYYY-MM-DDT00:00:00"
const toDateTimeParam = (yyyyMMdd: string) => `${yyyyMMdd}T00:00:00`;

export default function NuevaCitaPage() {
  const nav = useNavigate();

  // -------- Paciente (desde usuario logueado) --------
  const [idPaciente, setIdPaciente] = useState<number | null>(null);
  const [loadingPaciente, setLoadingPaciente] = useState(true);
  const [errorPaciente, setErrorPaciente] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoadingPaciente(true);
        setErrorPaciente(null);

        // 1) Lee usuario del localStorage (mismo patrón que MisCitasPage)
        const raw = localStorage.getItem("user");
        if (!raw) throw new Error("No hay sesión de usuario");
        const user = JSON.parse(raw);
        const idUsuario = Number(user?.id);
        if (!idUsuario) throw new Error("Usuario inválido");

        // 2) Mapea usuario → paciente
        const pid = await obtenerIdPacientePorUsuario(idUsuario, ac.signal);
        if (!pid) throw new Error("No se encontró el paciente vinculado");
        setIdPaciente(pid);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setErrorPaciente(e?.message || "Error al obtener el paciente");
      } finally {
        setLoadingPaciente(false);
      }
    })();
    return () => ac.abort();
  }, []);

  // -------- Médicos / disponibilidad --------
  const [doctores, setDoctores] = useState<Medico[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [errorDocs, setErrorDocs] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Filtros
  const [filtroMedico, setFiltroMedico] = useState("Todos");
  const [filtroEsp, setFiltroEsp] = useState("Todas");

  // Selecciones
  const [doctorSel, setDoctorSel] = useState<Medico | null>(null);
  const [fechaSel, setFechaSel] = useState<string | null>(null); // yyyy-mm-dd
  const [horaSel, setHoraSel] = useState("");

  // Disponibilidad
  const [horarios, setHorarios] = useState<string[]>([]);
  const [loadingDisp, setLoadingDisp] = useState(false);
  const [errorDisp, setErrorDisp] = useState<string | null>(null);

  // Cargar médicos
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoadingDocs(true);
        setErrorDocs(null);
        const list = await getMedicos({ signal: ac.signal });
        setDoctores(list);
      } catch (e: any) {
        if (e?.name !== "AbortError")
          setErrorDocs(e?.message || "Error cargando médicos");
      } finally {
        setLoadingDocs(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const especialidades = useMemo(
    () => ["Todas", ...Array.from(new Set(doctores.map((d) => d.especialidad)))],
    [doctores]
  );
  const medicos = useMemo(
    () => ["Todos", ...Array.from(new Set(doctores.map((d) => d.nombreCompleto)))],
    [doctores]
  );

  const doctoresFiltrados = useMemo(
    () =>
      doctores.filter(
        (d) =>
          (filtroEsp === "Todas" || d.especialidad === filtroEsp) &&
          (filtroMedico === "Todos" || d.nombreCompleto === filtroMedico)
      ),
    [doctores, filtroEsp, filtroMedico]
  );

  // cada vez que cambie el doctor, limpiamos selección de fecha/hora y horarios
  useEffect(() => {
    setFechaSel(null);
    setHoraSel("");
    setHorarios([]);
    setErrorDisp(null);
  }, [doctorSel]);

  // cuando hay doctor + fecha, consultamos disponibilidad
  useEffect(() => {
    setHoraSel("");
    setHorarios([]);
    setErrorDisp(null);

    if (!doctorSel || !fechaSel) return;

    const ac = new AbortController();
    (async () => {
      try {
        setLoadingDisp(true);
        const fechaParam = toDateTimeParam(fechaSel);
        const dias = await getDisponibilidadMedico(doctorSel.id, fechaParam, {
          signal: ac.signal,
        });
        const horas = dias[0]?.horasDisponibles ?? [];
        setHorarios(horas);
      } catch (e: any) {
        if (e?.name !== "AbortError")
          setErrorDisp(e?.message || "Error cargando disponibilidad");
      } finally {
        setLoadingDisp(false);
      }
    })();

    return () => ac.abort();
  }, [doctorSel, fechaSel]);

  const puedeAgendar =
    Boolean(doctorSel && fechaSel && horaSel) &&
    !saving &&
    !!idPaciente &&
    !loadingPaciente &&
    !errorPaciente;

  const onAgendar = async () => {
    if (!doctorSel || !fechaSel || !horaSel || saving || !idPaciente) return;

    try {
      setSaving(true);

      const payload = {
        idPaciente,             // ← ya no está quemado
        idMedico: doctorSel.id,
        fecha: toZulu(fechaSel, horaSel), // "YYYY-MM-DDTHH:mm:00.000Z"
      };

      const res = await crearCita(payload);
      alert(res.message);
      nav("/citas");
    } catch (e: any) {
      alert(e?.message || "No se pudo crear la cita.");
    } finally {
      setSaving(false);
    }
  };

  const onCancelar = () => {
    setDoctorSel(null);
    setFechaSel(null);
    setHoraSel("");
    setHorarios([]);
    nav("/citas");
  };

  return (
    <div className={styles.page}>
      {/* Encabezado */}
      <div className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.brandIcon} aria-hidden>+</div>
          <div>
            <p className={styles.brandLabel}>Clínica</p>
            <h1 className={styles.title}>Gestión de Citas</h1>
          </div>
        </div>
        <p className={styles.headerHelp}>Programa y administra tus citas</p>
      </div>

      {/* Estado del paciente */}
      {loadingPaciente && <div className={styles.empty}>Cargando paciente…</div>}
      {errorPaciente && (
        <div className={styles.error}>
          {errorPaciente}
        </div>
      )}

      <div className={styles.layout} aria-disabled={loadingPaciente || !!errorPaciente}>
        {/* Columna izquierda */}
        <div className={styles.leftCol}>
          {/* Filtros */}
          <div className={styles.filters}>
            <label className={styles.filterItem}>
              <span>Médico</span>
              <select
                value={filtroMedico}
                onChange={(e) => setFiltroMedico(e.target.value)}
                disabled={loadingDocs || !!errorDocs || doctores.length === 0 || loadingPaciente || !!errorPaciente}
              >
                {medicos.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>

            <label className={styles.filterItem}>
              <span>Especialidad</span>
              <select
                value={filtroEsp}
                onChange={(e) => setFiltroEsp(e.target.value)}
                disabled={loadingDocs || !!errorDocs || doctores.length === 0 || loadingPaciente || !!errorPaciente}
              >
                {especialidades.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Lista doctores */}
          <div className={styles.doctorsGrid}>
            {loadingDocs && <div className={styles.empty}>Cargando médicos…</div>}
            {errorDocs && <div className={styles.empty}>{errorDocs}</div>}

            {!loadingDocs && !errorDocs && doctoresFiltrados.length === 0 && (
              <div className={styles.empty}>No hay médicos para el filtro seleccionado.</div>
            )}

            {!loadingDocs && !errorDocs && doctoresFiltrados.map((d) => (
              <article
                key={d.id}
                className={cx(styles.card, doctorSel?.id === d.id && styles.cardSelected)}
              >
                <div className={styles.cardAvatar} aria-hidden>👩‍⚕️</div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{d.nombreCompleto}</h3>
                  <p className={styles.cardSpec}>{d.especialidad}</p>
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.btnPrimary}
                      onClick={() => setDoctorSel(d)}
                      disabled={loadingPaciente || !!errorPaciente}
                    >
                      Seleccionar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Resumen */}
          <div className={styles.summary}>
            <span><strong>PacienteID:</strong> {idPaciente ?? "—"}</span>
            <span className={styles.sep}>›</span>
            <span><strong>Doctor:</strong> {doctorSel ? doctorSel.nombreCompleto : "—"}</span>
            <span className={styles.sep}>›</span>
            <span><strong>Especialidad:</strong> {doctorSel ? doctorSel.especialidad : "—"}</span>
            <span className={styles.sep}>›</span>
            <span><strong>Fecha:</strong> {formatDate(fechaSel)}</span>
            <span className={styles.sep}>›</span>
            <span><strong>Hora:</strong> {horaSel || "—"}</span>
          </div>
        </div>

        {/* Columna derecha */}
        <aside className={styles.rightCol}>
          <h2 className={styles.panelTitle}>Calendario</h2>

          <label className={styles.field}>
            <span>Selecciona una fecha</span>
            <input
              type="date"
              value={fechaSel ?? ""}
              onChange={(e) => setFechaSel(e.target.value || null)}
              disabled={!doctorSel || loadingPaciente || !!errorPaciente}
            />
          </label>

          <label className={styles.field}>
            <span>Horarios disponibles</span>
            <select
              value={horaSel}
              onChange={(e) => setHoraSel(e.target.value)}
              disabled={
                !doctorSel ||
                !fechaSel ||
                loadingDisp ||
                !!errorDisp ||
                horarios.length === 0 ||
                loadingPaciente ||
                !!errorPaciente
              }
            >
              <option value="">
                {loadingDisp ? "Cargando..." : "Selecciona hora"}
              </option>
              {horarios.map((h) => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            {!loadingDisp && !errorDisp && doctorSel && fechaSel && horarios.length === 0 && (
              <small className={styles.muted}>No hay horarios disponibles para ese día.</small>
            )}
            {errorDisp && <small className={styles.muted}>{errorDisp}</small>}
          </label>

          <div className={styles.actions}>
            <button
              type="button"
              className={cx(styles.btnPrimary, (!puedeAgendar || saving) && styles.btnDisabled)}
              onClick={onAgendar}
              disabled={!puedeAgendar}
              title={!idPaciente ? "Cargando paciente…" : undefined}
            >
              {saving ? "Agendando..." : "Agendar"}
            </button>

            <button type="button" className={styles.btnGhost} onClick={onCancelar}>
              Cancelar
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
