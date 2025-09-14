import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./List.module.css";
import { listarPacientes } from "@/features/pacientes/api/pacientes";
import { api } from "@/features/auth/api/api";
import InitialMedicalInfoModal from "@/features/pacientes/components/InitialMedicalInfoModal";

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

function edad(fechaIso?: string) {
  if (!fechaIso) return null;
  const f = new Date(fechaIso);
  if (isNaN(f.getTime())) return null;
  const hoy = new Date();
  let e = hoy.getFullYear() - f.getFullYear();
  const m = hoy.getMonth() - f.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < f.getDate())) e--;
  return e;
}

/** ===== Modal interno para crear contacto de emergencia ===== */
function EmergencyContactModal({
  open,
  paciente,
  onClose,
  onCreated,
}: {
  open: boolean;
  paciente: PacienteItem | null;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [parentesco, setParentesco] = useState("");
  const [telefono, setTelefono] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNombre(""); setParentesco(""); setTelefono(""); setErr(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !paciente) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!nombre.trim()) return setErr("Ingresa el nombre del contacto.");
    if (!parentesco.trim()) return setErr("Ingresa el parentesco.");

    try {
      setSaving(true);
      await api<any>(`/api/Pacientes/${paciente.idPaciente}/contactos`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          idPaciente: paciente.idPaciente,
          nombre: nombre.trim(),
          parentesco: parentesco.trim(),
          telefono: telefono.trim(),
        }),
      });
      onCreated?.();
      onClose();
      alert("Contacto de emergencia creado correctamente.");
    } catch (e: any) {
      setErr(e?.message || "No se pudo crear el contacto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Agregar contacto de emergencia</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalHint}>
            Paciente:&nbsp;
            <strong>
              #{paciente.idPaciente} — {paciente.apellidos} {paciente.nombres}
            </strong>
            {paciente.dpi ? <span className={styles.sep}>›</span> : null}
            {paciente.dpi ? <span>DPI: {paciente.dpi}</span> : null}
          </div>

          {err && <div className={styles.error} style={{ marginBottom: 8 }}>{err}</div>}

          <form onSubmit={submit} className={styles.modalForm}>
            <label className={styles.field}>
              <span>Nombre*</span>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Parentesco*</span>
              <input
                type="text"
                placeholder="Madre, Padre, Cónyuge, Hijo(a)…"
                value={parentesco}
                onChange={(e) => setParentesco(e.target.value)}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Teléfono</span>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Opcional"
              />
            </label>

            <div className={styles.modalActions}>
              <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>
                Cancelar
              </button>
              <button
                type="submit"
                className={`${styles.btnPrimary} ${saving ? styles.btnDisabled : ""}`}
                disabled={saving}
              >
                {saving ? "Guardando..." : "Guardar contacto"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
/** ===== Fin modal ===== */

export default function PacientesListPage() {
  const [data, setData] = useState<ListaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  // estado modales
  const [modalOpen, setModalOpen] = useState(false);
  const [pacienteForModal, setPacienteForModal] = useState<PacienteItem | null>(null);

  const [imiOpen, setImiOpen] = useState(false);
  const [pacienteForImi, setPacienteForImi] = useState<PacienteItem | null>(null);

  const nav = useNavigate();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    listarPacientes(page, pageSize)
      .then((res) => alive && (setData(res), setErr(null)))
      .catch((e) => alive && setErr(e?.message ?? "Error"))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [page, pageSize]);

  const items = useMemo(() => {
    const src = data?.items ?? [];
    const filtered = q.trim()
      ? src.filter((x) => {
          const full = `${x.nombres} ${x.apellidos}`.toLowerCase();
          return (
            full.includes(q.toLowerCase()) ||
            (x.dpi ?? "").toLowerCase().includes(q.toLowerCase())
          );
        })
      : src;

    const ordered = [...filtered].sort((a, b) => {
      const an = `${a.apellidos ?? ""} ${a.nombres ?? ""}`.toLowerCase();
      const bn = `${b.apellidos ?? ""} ${b.nombres ?? ""}`.toLowerCase();
      return sortAsc ? an.localeCompare(bn) : bn.localeCompare(an);
    });

    return ordered;
  }, [data, q, sortAsc]);

  const from = data ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  const openEmergencyFor = (p: PacienteItem) => { setPacienteForModal(p); setModalOpen(true); };
  const closeEmergency = () => { setModalOpen(false); setPacienteForModal(null); };

  const openImiFor = (p: PacienteItem) => { setPacienteForImi(p); setImiOpen(true); };
  const closeImi = () => { setImiOpen(false); setPacienteForImi(null); };

  return (
    <div className={styles.wrap}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Lista de Pacientes</h1>
            <p className={styles.subtitle}>Busca, ordena y gestiona pacientes</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.searchBox}>
              <input
                placeholder="Buscar por nombre o DPI…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && (
                <button className={styles.clearBtn} onClick={() => setQ("")}>
                  ×
                </button>
              )}
            </div>
            <Link to="/admin/pacientes/nuevo" className={styles.primaryBtn}>
              + Agregar Paciente
            </Link>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.sortable} onClick={() => setSortAsc(!sortAsc)}>
                  Paciente {sortAsc ? "▲" : "▼"}
                </th>
                <th>DPI</th>
                <th>Edad / Sexo</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th className={styles.right}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`} className={styles.skeletonRow}>
                    <td colSpan={7}>&nbsp;</td>
                  </tr>
                ))}

              {!loading && err && (
                <tr><td colSpan={7} className={styles.error}>{err}</td></tr>
              )}

              {!loading && !err && items.length === 0 && (
                <tr><td colSpan={7} className={styles.empty}>No hay pacientes para mostrar.</td></tr>
              )}

              {!loading && !err && items.map((p) => (
                <tr key={p.idPaciente}>
                  <td><div className={styles.name}>{p.apellidos} {p.nombres}</div></td>
                  <td className={styles.mono}>{p.dpi ?? "—"}</td>
                  <td>
                    <span className={styles.badge}>{edad(p.fechaNacimiento) ?? "—"} años</span>
                    {p.sexo && (
                      <span className={`${styles.badge} ${p.sexo === "M" ? styles.badgeBlue : styles.badgePink}`}>
                        {p.sexo}
                      </span>
                    )}
                  </td>
                  <td>{p.telefono ?? "—"}</td>
                  <td className={styles.truncate} title={p.correo ?? ""}>{p.correo ?? "—"}</td>
                  <td className={`${styles.right} ${styles.actions}`}>
                    <button onClick={() => nav(`/admin/pacientes/${p.idPaciente}`)}>Ver</button>
                    <button onClick={() => nav(`/admin/citas/nueva?paciente=${p.idPaciente}`)}>Nueva cita</button>
                    <button onClick={() => openEmergencyFor(p)}>Agregar contacto de emergencia</button>
                    <button onClick={() => openImiFor(p)}>Info médica inicial</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.footer}>
          <div className={styles.rows}>
            <label>
              Filas:&nbsp;
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(parseInt(e.target.value, 10)); setPage(1); }}
              >
                {[10, 20, 50, 100].map((n) => (<option key={n} value={n}>{n}</option>))}
              </select>
            </label>
          </div>
          <div className={styles.range}>{data ? (<>{from}-{to} de {data.total}</>) : "—"}</div>
          <div className={styles.pager}>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!data || page <= 1 || loading}>← Anterior</button>
            <span>Página {page}</span>
            <button onClick={() => setPage((p) => p + 1)} disabled={!data || to >= (data?.total ?? 0) || loading}>Siguiente →</button>
          </div>
        </div>
      </div>

      {/* Modal: contacto emergencia */}
      <EmergencyContactModal
        open={modalOpen}
        paciente={pacienteForModal}
        onClose={closeEmergency}
        onCreated={() => {}}
      />

      {/* Modal: info médica inicial */}
      <InitialMedicalInfoModal
        open={imiOpen}
        paciente={
          pacienteForImi && {
            idPaciente: pacienteForImi.idPaciente,
            nombres: pacienteForImi.nombres,
            apellidos: pacienteForImi.apellidos,
            dpi: pacienteForImi.dpi,
          }
        }
        onClose={closeImi}
        onSaved={() => {}}
      />
    </div>
  );
}
