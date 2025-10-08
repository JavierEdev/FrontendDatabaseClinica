// src/pages/admin/pacientes/NuevaCitaAdminPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import styles from "./NuevaCitaPage.module.css"; // reutilizamos el mismo CSS
import {
  getMedicos,
  getDisponibilidadMedico,
} from "@/features/medicos/api/MedicosController";
import type { Medico } from "@/features/medicos/models/Medico";
import { crearCita } from "@/features/citas/api/citas";
import { listarPacientes } from "@/features/pacientes/api/pacientes";

// Tipos ya existentes en tu lista
type PacienteItem = {
  idPaciente: number;
  nombres: string;
  apellidos: string;
  dpi?: string;
  fechaNacimiento?: string; // ISO
  sexo?: "M" | "F";
  telefono?: string;
  correo?: string;
  numeroHistoriaClinica?: string;
};

type ListaResponse = {
  page: number;
  pageSize: number;
  total: number;
  items: PacienteItem[];
};

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
const toDateTimeParam = (yyyyMMdd: string) => `${yyyyMMdd}T00:00:00`;

/**
 * Selector de pacientes para admin (paginado + búsqueda local).
 */
function PacientePicker({
  value,
  onChange,
}: {
  value: PacienteItem | null;
  onChange: (p: PacienteItem | null) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [data, setData] = useState<ListaResponse | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listarPacientes(page, pageSize)
      .then((res) => alive && (setData(res), setErr(null)))
      .catch((e) => alive && setErr(e?.message ?? "Error"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [page, pageSize]);

  const items = useMemo(() => {
    const src = data?.items ?? [];
    const term = q.trim().toLowerCase();
    if (!term) return src;
    return src.filter((x) => {
      const full = `${x.nombres} ${x.apellidos}`.toLowerCase();
      return (
        full.includes(term) ||
        (x.dpi ?? "").toLowerCase().includes(term) ||
        String(x.idPaciente).includes(term)
      );
    });
  }, [data, q]);

  const from = data ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return (
    <div className={styles.rightCol}>
      <h2 className={styles.panelTitle}>Paciente</h2>

      <label className={styles.field}>
        <span>Búsqueda (nombre, DPI o ID)</span>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ej. Juan Pérez / 1234567890101 / 42"
        />
      </label>

      <div className={styles.field}>
        <span>Selecciona un paciente</span>
        <select
          value={value?.idPaciente ?? ""}
          onChange={(e) => {
            const id = Number(e.target.value);
            const sel =
              (data?.items ?? []).find((p) => p.idPaciente === id) ??
              items.find((p) => p.idPaciente === id) ??
              (id
                ? ({ idPaciente: id, nombres: "", apellidos: "" } as PacienteItem)
                : null);
            onChange(sel ?? null);
          }}
        >
          <option value="">— Seleccionar —</option>
          {items.map((p) => (
            <option key={p.idPaciente} value={p.idPaciente}>
              #{p.idPaciente} — {p.apellidos} {p.nombres}
              {p.dpi ? ` — DPI ${p.dpi}` : ""}
            </option>
          ))}
        </select>
        {loading && <small className={styles.muted}>Cargando pacientes…</small>}
        {err && <small className={styles.muted}>{err}</small>}
      </div>

      <div className={styles.actions}>
        <label>
          Filas:&nbsp;
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
              setPage(1);
            }}
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div style={{ marginLeft: "auto" }}>
          <button
            className={styles.btnGhost}
            disabled={!data || page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Anterior
          </button>
          <button
            className={styles.btnGhost}
            disabled={!data || to >= (data?.total ?? 0) || loading}
            onClick={() => setPage((p) => p + 1)}
            style={{ marginLeft: 8 }}
          >
            Siguiente →
          </button>
        </div>
      </div>

      <div className={styles.summary} style={{ marginTop: 12 }}>
        <span>
          <strong>Seleccionado:</strong>{" "}
          {value
            ? `#${value.idPaciente} — ${value.apellidos ?? ""} ${
                value.nombres ?? ""
              }`.trim()
            : "—"}
        </span>
        {value?.dpi && (
          <>
            <span className={styles.sep}>›</span>
            <span>DPI: {value.dpi}</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function NuevaCitaAdminPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();

  // -------- Paciente (admin lo selecciona o viene en ?paciente=) --------
  const [pacienteSel, setPacienteSel] = useState<PacienteItem | null>(null);

  useEffect(() => {
    const qp = sp.get("paciente");
    if (qp && !pacienteSel) {
      const id = Number(qp);
      if (id) setPacienteSel({ idPaciente: id, nombres: "", apellidos: "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

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

  // ---- Date picker: bloquear escritura y abrir al click en todo el campo ----
  const dateRef = useRef<HTMLInputElement>(null);
  const dateDisabled = !doctorSel;

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

  // reset al cambiar doctor
  useEffect(() => {
    setFechaSel(null);
    setHoraSel("");
    setHorarios([]);
    setErrorDisp(null);
  }, [doctorSel]);

  // disponibilidad al tener doctor + fecha
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
    Boolean(doctorSel && fechaSel && horaSel && pacienteSel?.idPaciente) &&
    !saving;

  const onAgendar = async () => {
    if (!doctorSel || !fechaSel || !horaSel || !pacienteSel?.idPaciente || saving) return;

    try {
      setSaving(true);

      const payload = {
        idPaciente: pacienteSel.idPaciente,
        idMedico: doctorSel.id,
        fecha: toZulu(fechaSel, horaSel), // "YYYY-MM-DDTHH:mm:00.000Z"
      };

      const res = await crearCita(payload);
      alert(res.message);
      nav("/admin/citas");
    } catch (e: any) {
      alert(e?.message || "No se pudo crear la cita.");
    } finally {
      setSaving(false);
    }
  };

  const onCancelar = () => {
    setPacienteSel(null);
    setDoctorSel(null);
    setFechaSel(null);
    setHoraSel("");
    setHorarios([]);
    nav("/admin/citas");
  };

  return (
    <div className={styles.page}>
      {/* Encabezado */}
      <div className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.brandIcon} aria-hidden>
            +
          </div>
          <div>
            <p className={styles.brandLabel}>Clínica · Admin</p>
            <h1 className={styles.title}>Nueva Cita (Administrador)</h1>
          </div>
        </div>
        <p className={styles.headerHelp}>Selecciona paciente, médico y horario</p>
      </div>

      {/* Layout */}
      <div className={styles.layout}>
        {/* Columna izquierda (médicos) */}
        <div>
          <div className={styles.filters}>
            <label className={styles.filterItem}>
              <span>Médico</span>
              <select
                value={filtroMedico}
                onChange={(e) => setFiltroMedico(e.target.value)}
                disabled={loadingDocs || !!errorDocs || doctores.length === 0}
              >
                {medicos.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.filterItem}>
              <span>Especialidad</span>
              <select
                value={filtroEsp}
                onChange={(e) => setFiltroEsp(e.target.value)}
                disabled={loadingDocs || !!errorDocs || doctores.length === 0}
              >
                {especialidades.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={styles.doctorsGrid}>
            {loadingDocs && <div className={styles.empty}>Cargando médicos…</div>}
            {errorDocs && <div className={styles.empty}>{errorDocs}</div>}

            {!loadingDocs && !errorDocs && doctoresFiltrados.length === 0 && (
              <div className={styles.empty}>No hay médicos para el filtro seleccionado.</div>
            )}

            {!loadingDocs &&
              !errorDocs &&
              doctoresFiltrados.map((d) => (
                <article
                  key={d.id}
                  className={cx(
                    styles.card,
                    doctorSel?.id === d.id && styles.cardSelected
                  )}
                >
                  <div className={styles.cardAvatar} aria-hidden>
                    👩‍⚕️
                  </div>
                  <div>
                    <h3 className={styles.cardTitle}>{d.nombreCompleto}</h3>
                    <p className={styles.cardSpec}>{d.especialidad}</p>
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={styles.btnPrimary}
                        onClick={() => setDoctorSel(d)}
                      >
                        Seleccionar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
          </div>

          <div className={styles.summary}>
            <span>
              <strong>PacienteID:</strong> {pacienteSel?.idPaciente ?? "—"}
            </span>
            <span className={styles.sep}>›</span>
            <span>
              <strong>Doctor:</strong>{" "}
              {doctorSel ? doctorSel.nombreCompleto : "—"}
            </span>
            <span className={styles.sep}>›</span>
            <span>
              <strong>Especialidad:</strong>{" "}
              {doctorSel ? doctorSel.especialidad : "—"}
            </span>
            <span className={styles.sep}>›</span>
            <span>
              <strong>Fecha:</strong> {formatDate(fechaSel)}
            </span>
            <span className={styles.sep}>›</span>
            <span>
              <strong>Hora:</strong> {horaSel || "—"}
            </span>
          </div>
        </div>

        {/* Columna derecha (paciente + calendario + acciones) */}
        <div>
          <PacientePicker value={pacienteSel} onChange={setPacienteSel} />

          <div className={styles.rightCol} style={{ marginTop: 16 }}>
            <h2 className={styles.panelTitle}>Calendario</h2>

            <label className={styles.field}>
              <span>Selecciona una fecha</span>
              <input
                ref={dateRef}
                type="date"
                value={fechaSel ?? ""}
                onChange={(e) => setFechaSel(e.target.value || null)}
                disabled={dateDisabled}
                // Evita escribir/pegar (permitiendo navegación)
                inputMode="none"
                onKeyDown={(e) => {
                  const nav = ["Tab", "Shift", "ArrowLeft", "ArrowRight", "Home", "End", "Escape"];
                  if (!nav.includes(e.key)) e.preventDefault();
                }}
                onBeforeInput={(e) => e.preventDefault()}
                onPaste={(e) => e.preventDefault()}
                // Abre el calendario al click en cualquier parte del input
                onMouseDown={(e) => {
                  const el = e.currentTarget as HTMLInputElement;
                  if (el.disabled) return;
                  const supportsShowPicker = typeof (el as any).showPicker === "function";
                  if (supportsShowPicker) {
                    e.preventDefault();
                    (el as any).showPicker();
                  }
                  // Si el navegador no soporta showPicker (Safari/Firefox),
                  // no prevenimos el evento para que se abra el picker nativo.
                }}
                style={{ cursor: dateDisabled ? "default" : "pointer" }}
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
                  horarios.length === 0
                }
              >
                <option value="">
                  {loadingDisp ? "Cargando..." : "Selecciona hora"}
                </option>
                {horarios.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
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
                className={cx(
                  styles.btnPrimary,
                  (!puedeAgendar || saving) && styles.btnDisabled
                )}
                onClick={onAgendar}
                disabled={!puedeAgendar}
                title={!pacienteSel ? "Selecciona un paciente" : undefined}
              >
                {saving ? "Agendando..." : "Agendar"}
              </button>

              <button type="button" className={styles.btnGhost} onClick={onCancelar}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
