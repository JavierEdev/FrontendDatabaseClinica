import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./List.module.css";
import { useListarUsuarios } from "@/features/usuarios/hooks/useListarUsuarios";
import { UsuariosTable } from "@/features/usuarios/ui/UsuariosTable";
import { api } from "@/features/auth/api/api";
import { fetchMedicoById } from "@/features/medicos/api/MedicosController";

/* ────────────────────────────────────────────────────────────────────────────
   Tipos mínimos
   ──────────────────────────────────────────────────────────────────────────── */
type AnyUser = Record<string, any>;

type UsuarioRow = {
  id?: number | string;
  idUsuario?: number | string;
  username?: string;
  rol?: string; role?: string; rolNombre?: string; perfil?: string;
  idPaciente?: number | string | null; IdPaciente?: number | string | null;
  idMedico?: number | string | null;  IdMedico?: number | string | null;
  correo?: string; email?: string;
  [k: string]: any;
};

type PacienteItem = {
  idPaciente: number;
  nombres?: string;
  apellidos?: string;
  dpi?: string;
  fechaNacimiento?: string; // ISO
  sexo?: "M" | "F";
  telefono?: string;
  correo?: string;
  numeroHistoriaClinica?: string;
  direccion?: string;
};

type MedicoRow = {
  id: number;
  nombres?: string;
  apellidos?: string;
  especialidad?: string;
  telefono?: string;
  correo?: string;
  horario?: string;
  consultorio?: string;
  direccion?: string;
  numeroColegiado?: string | number;
  colegiado?: string | number;
};

/* ────────────────────────────────────────────────────────────────────────────
   Helpers API
   ──────────────────────────────────────────────────────────────────────────── */
async function fetchUsuarioById(id: number | string, signal?: AbortSignal) {
  return api<any>(`/api/Usuarios/${id}`, { method: "GET", auth: true, signal });
}
async function fetchPacienteById(idPaciente: number | string, signal?: AbortSignal) {
  return api<PacienteItem>(`/api/Pacientes/${idPaciente}`, { method: "GET", auth: true, signal });
}

/* ────────────────────────────────────────────────────────────────────────────
   Utils
   ──────────────────────────────────────────────────────────────────────────── */
function edad(iso?: string) {
  if (!iso) return null;
  const f = new Date(iso);
  if (isNaN(f.getTime())) return null;
  const hoy = new Date();
  let e = hoy.getFullYear() - f.getFullYear();
  const m = hoy.getMonth() - f.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) e--;
  return e;
}
function formatDateNice(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ────────────────────────────────────────────────────────────────────────────
   Modal: Paciente (solo lectura, estilo Médicos)
   ──────────────────────────────────────────────────────────────────────────── */
function PacienteViewModal({
  open, paciente, onClose,
}: { open: boolean; paciente: PacienteItem | null; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !paciente) return null;

  const years = edad(paciente.fechaNacimiento);
  const fullName = `${paciente.nombres ?? ""} ${paciente.apellidos ?? ""}`.trim();

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={`${styles.modal} ${styles.modalCompact}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Paciente #{paciente.idPaciente}</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className={styles.modalBody} style={{ maxHeight: "78vh", overflow: "auto" }}>
          <div className={styles.modalHint} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <strong style={{ fontWeight: 700 }}>{fullName || "—"}</strong>
            {paciente.dpi && (
              <>
                <span className={styles.sep}>›</span>
                <span className={styles.kvPill}>DPI: {paciente.dpi}</span>
              </>
            )}
          </div>

          <dl className={styles.kvGrid2}>
            <div className={styles.kvItem}>
              <dt className={styles.kvLabel}>Nombre(s)</dt>
              <dd className={styles.kvValue}>{paciente.nombres || "—"}</dd>
            </div>

            <div className={styles.kvItem}>
              <dt className={styles.kvLabel}>Apellidos</dt>
              <dd className={styles.kvValue}>{paciente.apellidos || "—"}</dd>
            </div>

            <div className={styles.kvItem}>
              <dt className={styles.kvLabel}>DPI</dt>
              <dd className={styles.kvValue}>{paciente.dpi || "—"}</dd>
            </div>

            <div className={styles.kvItem}>
              <dt className={styles.kvLabel}>Fecha de nacimiento</dt>
              <dd className={styles.kvValue}>
                {formatDateNice(paciente.fechaNacimiento)}
                <span className={styles.kvPill} style={{ marginLeft: 10 }}>{years ?? "—"} años</span>
              </dd>
            </div>

            <div className={styles.kvItem}>
              <dt className={styles.kvLabel}>Sexo</dt>
              <dd className={styles.kvValue}>{paciente.sexo || "—"}</dd>
            </div>

            <div className={styles.kvItem}>
              <dt className={styles.kvLabel}>Teléfono</dt>
              <dd className={styles.kvValue}>{paciente.telefono || "—"}</dd>
            </div>

            <div className={styles.kvItem}>
              <dt className={styles.kvLabel}>Correo</dt>
              <dd className={styles.kvValue}>{paciente.correo || "—"}</dd>
            </div>

            <div className={styles.kvItem}>
              <dt className={styles.kvLabel}>Nº Historia Clínica</dt>
              <dd className={styles.kvValue}>{paciente.numeroHistoriaClinica || "—"}</dd>
            </div>

            <div className={styles.kvItemFull}>
              <dt className={styles.kvLabel}>Dirección</dt>
              <dd className={styles.kvValue}>{paciente.direccion || "—"}</dd>
            </div>
          </dl>

          <div className={styles.modalActions} style={{ marginTop: 18, justifyContent: "flex-end" }}>
            <button className={styles.btnGhost} onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Modal: Médico (solo lectura, estilo Médicos)
   ──────────────────────────────────────────────────────────────────────────── */
function MedicoViewModal({
  open, medico, onClose,
}: { open: boolean; medico: MedicoRow | null; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !medico) return null;

  const obj = medico as Record<string, any>;
  const nombre = `${obj.nombres ?? ""} ${obj.apellidos ?? ""}`.trim();

  const LABELS: Record<string, string> = {
    nombres: "Nombre",
    apellidos: "Apellidos",
    especialidad: "Especialidad",
    telefono: "Teléfono",
    correo: "Correo",
    horario: "Horario",
    consultorio: "Consultorio",
    direccion: "Dirección",
    numeroColegiado: "Número Colegiado",
    colegiado: "Número Colegiado",
  };

  const ORDER = [
    "nombres",
    "apellidos",
    "especialidad",
    "telefono",
    "correo",
    "horario",
    "consultorio",
    "direccion",
    "numeroColegiado",
    "colegiado",
  ];

  const fmt = (v: unknown) => (Array.isArray(v) ? v.join(", ") : v == null ? "" : String(v));
  const isWide = (k: string, v: unknown) => ["direccion", "horario"].includes(k) || String(v ?? "").length > 80;
  const labelize = (k: string) =>
    LABELS[k] ||
    k.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/\s+/g, " ").trim().replace(/^./, (c) => c.toUpperCase());

  const pairs = ORDER
    .filter((k) => obj[k] !== undefined && obj[k] !== null && fmt(obj[k]) !== "")
    .map((k) => [k, obj[k]] as const);

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={`${styles.modal} ${styles.modalCompact}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Médico #{medico.id}</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className={styles.modalBody} style={{ maxHeight: "78vh", overflow: "auto" }}>
          <div className={styles.modalHint} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <strong style={{ fontWeight: 700 }}>{nombre || "—"}</strong>
            {obj.especialidad && (
              <>
                <span className={styles.sep}>›</span>
                <span className={styles.kvPill}>{obj.especialidad}</span>
              </>
            )}
          </div>

          <dl className={styles.kvGrid2}>
            {pairs.map(([k, v]) => (
              <div key={k} className={isWide(k, v) ? styles.kvItemFull : styles.kvItem}>
                <dt className={styles.kvLabel}>{labelize(k)}</dt>
                <dd className={isWide(k, v) ? styles.kvValueMultiline : styles.kvValue}>
                  {fmt(v) || "—"}
                </dd>
              </div>
            ))}
          </dl>

          <div className={styles.modalActions} style={{ marginTop: 18, justifyContent: "flex-end" }}>
            <button className={styles.btnGhost} onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Modal: Usuario/Admin (genérica, 2 columnas)
   ──────────────────────────────────────────────────────────────────────────── */
function UsuarioViewModal({
  open, usuario, onClose,
}: { open: boolean; usuario: AnyUser | null; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !usuario) return null;

  const id =
    usuario.id ?? usuario.idUsuario ?? usuario.userId ?? usuario.IdUsuario ?? usuario.Id ?? "—";
  const username =
    usuario.username ?? usuario.userName ?? usuario.usuario ?? usuario.correo ?? "—";
  const rol = (usuario.rol ?? usuario.role ?? usuario.rolNombre ?? usuario.perfil ?? "") as string;

  const LABELS: Record<string, string> = {
    id: "ID",
    idUsuario: "ID",
    userId: "ID",
    username: "Usuario",
    userName: "Usuario",
    correo: "Correo",
    email: "Correo",
    rol: "Rol",
    role: "Rol",
    nombres: "Nombres",
    apellidos: "Apellidos",
    telefono: "Teléfono",
    estado: "Estado",
    activo: "Activo",
    createdAt: "Creado",
    updatedAt: "Actualizado",
    lastLogin: "Último acceso",
    ultimoAcceso: "Último acceso",
    direccion: "Dirección",
    idMedico: "ID Médico",
    idPaciente: "ID Paciente",
  };

  const ORDER = [
    "nombres",
    "apellidos",
    "username",
    "rol",
    "correo",
    "email",
    "telefono",
    "estado",
    "activo",
    "lastLogin",
    "ultimoAcceso",
    "createdAt",
    "updatedAt",
    "direccion",
    "idMedico",
    "idPaciente",
  ];

  const obj = usuario as Record<string, any>;
  const fmt = (v: unknown) =>
    Array.isArray(v) ? v.join(", ") : typeof v === "boolean" ? (v ? "Sí" : "No") : v == null ? "" : String(v);
  const labelize = (k: string) =>
    LABELS[k] ||
    k.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/\s+/g, " ").trim().replace(/^./, (c) => c.toUpperCase());
  const isWide = (k: string, v: unknown) => ["direccion"].includes(k) || String(v ?? "").length > 120;
  const looksSensitive = (k: string) => /(password|contrasena|hash|token|secret|apikey|api_key|refresh)/i.test(k);

  const mainPairs = ORDER
    .filter((k) => obj[k] !== undefined && obj[k] !== null && fmt(obj[k]) !== "")
    .map((k) => [k, obj[k]] as const);

  const omit = new Set<string>([
    ...ORDER, "Id", "IdUsuario", "id", "idUsuario", "userId", "displayName", "nombreCompleto",
  ]);
  const extraKeys = Object.keys(obj).filter(
    (k) =>
      !omit.has(k) && obj[k] !== undefined && obj[k] !== null &&
      (typeof obj[k] !== "object" || Array.isArray(obj[k]))
  );

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={`${styles.modal} ${styles.modalCompact}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Usuario #{id}</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className={styles.modalBody} style={{ maxHeight: "78vh", overflow: "auto" }}>
          <div className={styles.modalHint} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <strong style={{ fontWeight: 700 }}>{username}</strong>
            {rol ? (
              <>
                <span className={styles.sep}>›</span>
                <span className={styles.kvPill}>{rol}</span>
              </>
            ) : null}
          </div>

          <dl className={styles.kvGrid2}>
            {mainPairs.map(([k, v]) => (
              <div key={k} className={isWide(k, v) ? styles.kvItemFull : styles.kvItem}>
                <dt className={styles.kvLabel}>{labelize(k)}</dt>
                <dd className={isWide(k, v) ? styles.kvValueMultiline : styles.kvValue}>
                  {looksSensitive(k) ? "••••••" : fmt(v) || "—"}
                </dd>
              </div>
            ))}
          </dl>

          {extraKeys.length > 0 && (
            <>
              <div style={{ height: 10 }} />
              <h4 className={styles.sectionTitle}>Otros datos</h4>
              <dl className={styles.kvGrid2}>
                {extraKeys.map((k) => (
                  <div key={k} className={isWide(k, obj[k]) ? styles.kvItemFull : styles.kvItem}>
                    <dt className={styles.kvLabel}>{labelize(k)}</dt>
                    <dd className={isWide(k, obj[k]) ? styles.kvValueMultiline : styles.kvValue}>
                      {looksSensitive(k) ? "••••••" : fmt(obj[k]) || "—"}
                    </dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          <div className={styles.modalActions} style={{ marginTop: 18, justifyContent: "flex-end" }}>
            <button className={styles.btnGhost} onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Página: Lista de Usuarios (switch por rol → modal correcta)
   ──────────────────────────────────────────────────────────────────────────── */
export default function UsuariosListPage() {
  const { data, loading, error, refetch } = useListarUsuarios();

  // búsqueda y paginación
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // modales
  const [activeModal, setActiveModal] = useState<"paciente" | "medico" | "admin" | null>(null);
  const [pacienteView, setPacienteView] = useState<PacienteItem | null>(null);
  const [medicoView, setMedicoView] = useState<MedicoRow | null>(null);
  const [usuarioView, setUsuarioView] = useState<AnyUser | null>(null);

  // filtrar
  const filtrados = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data ?? [];
    return (data ?? []).filter((u: AnyUser) => {
      const uName = String(u.username ?? "").toLowerCase();
      const uRol  = String(u.rol ?? u.role ?? "").toLowerCase();
      return uName.includes(term) || uRol.includes(term);
    });
  }, [data, q]);

  // paginar
  const total = filtrados.length;
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to   = total ? Math.min(page * pageSize, total) : 0;

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtrados.slice(start, start + pageSize);
  }, [filtrados, page, pageSize]);

  useEffect(() => { setPage(1); }, [q, pageSize]);

  // Abrir modal correcta
  const openViewById = (id: string | number) => {
    const hit = ((data ?? []) as UsuarioRow[]).find(
      (u) => u.id === id || u.idUsuario === id || String(u.id) === String(id) || String(u.idUsuario) === String(id)
    ) || null;
    if (!hit) return;

    // 👇 ‘h’ queda tipado y evita subrayados rojos
    const h = hit as UsuarioRow;

    const rol = String(h.rol ?? h.role ?? "").toLowerCase();
    const idPaciente = h.idPaciente ?? h.IdPaciente;
    const idMedico   = h.idMedico   ?? h.IdMedico;

    if (rol === "paciente" || (!!idPaciente && idPaciente !== 0 && idPaciente !== "0")) {
      setActiveModal("paciente");
      setPacienteView(idPaciente ? { idPaciente: Number(idPaciente) } : null);
      const ac = new AbortController();
      fetchPacienteById(Number(idPaciente), ac.signal)
        .then((det) => setPacienteView(det))
        .catch(() => {});
      return;
    }

    if (rol === "medico" || (!!idMedico && idMedico !== 0 && idMedico !== "0")) {
      setActiveModal("medico");
      setMedicoView(idMedico ? ({ id: Number(idMedico) } as MedicoRow) : null);
      const ac = new AbortController();
      fetchMedicoById(Number(idMedico), ac.signal)
        .then((det: any) => setMedicoView((prev) => (prev ? { ...prev, ...det } : det)))
        .catch(() => {});
      return;
    }

    // administrador / otros
    setActiveModal("admin");
    setUsuarioView(h);
    const ac = new AbortController();
    fetchUsuarioById(id, ac.signal)
      .then((det) => setUsuarioView((prev) => (prev ? { ...prev, ...det } : det)))
      .catch(() => {});
  };

  const closeAll = () => {
    setActiveModal(null);
    setPacienteView(null);
    setMedicoView(null);
    setUsuarioView(null);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Usuarios</h1>
            <p className={styles.subtitle}>Gestiona los usuarios del sistema</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.searchBox}>
              <input
                placeholder="Buscar por usuario o rol…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && <button className={styles.clearBtn} onClick={() => setQ("")}>×</button>}
            </div>

            <Link to="/admin/usuarios/crear" className={styles.primaryBtn}>
              + Crear usuario
            </Link>
          </div>
        </div>

        <UsuariosTable
          rows={pageItems}
          loading={loading}
          error={error}
          onView={openViewById}   // la tabla pasa el ID, aquí resolvemos el rol
        />

        <div className={styles.footer}>
          <div className={styles.rows}>
            <label>
              Filas:&nbsp;
              <select value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value, 10))}>
                {[10, 20, 50].map((n) => (<option key={n} value={n}>{n}</option>))}
              </select>
            </label>
          </div>

          <div className={styles.range}>{total ? (<>{from}-{to} de {total}</>) : "—"}</div>

          <div className={styles.pager}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
              ← Anterior
            </button>
            <span>Página {page}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={to >= total || loading}>
              Siguiente →
            </button>
          </div>
        </div>

        {!loading && error && (
          <div className={styles.error} style={{ marginTop: 12 }}>
            {error} &nbsp;<button onClick={refetch}>Reintentar</button>
          </div>
        )}
      </div>

      {/* Modales por rol */}
      <PacienteViewModal open={activeModal === "paciente"} paciente={pacienteView} onClose={closeAll} />
      <MedicoViewModal   open={activeModal === "medico"}   medico={medicoView}     onClose={closeAll} />
      <UsuarioViewModal  open={activeModal === "admin"}    usuario={usuarioView}    onClose={closeAll} />
    </div>
  );
}
