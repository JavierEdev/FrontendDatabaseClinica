// src/pages/admin/pacientes/List.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./List.module.css";
import {
  listarPacientes,
  subirDocumentoPaciente,
} from "@/features/pacientes/api/pacientes";
import PacienteImagesModal from "@/features/pacientes/components/PacienteImagesModal";

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

/** ===== Modal: subir imagen/documento ===== */
function ImageUploadModal({
  open,
  paciente,
  onClose,
  onUploaded,
}: {
  open: boolean;
  paciente: PacienteItem | null;
  onClose: () => void;
  onUploaded?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [categoria, setCategoria] = useState<
    "dpi" | "resultado" | "seguro" | "imagen" | "otro"
  >("imagen");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setFile(null);
      setCategoria("imagen");
      setNotas("");
      setErr(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !paciente) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!file) return setErr("Debes seleccionar un archivo (imagen o PDF).");
    try {
      setSaving(true);
      await subirDocumentoPaciente(
        paciente.idPaciente,
        file,
        categoria,
        notas.trim() || undefined
      );
      onUploaded?.();
      onClose();
      alert("Archivo subido correctamente.");
    } catch (e: any) {
      setErr(e?.message || "No se pudo subir el documento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Agregar imagen / documento</h3>
          <button
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
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

          {err && (
            <div className={styles.error} style={{ marginBottom: 8 }}>
              {err}
            </div>
          )}

          <form onSubmit={submit} className={styles.modalForm}>
            <label className={styles.field}>
              <span>Archivo*</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
            </label>

            <label className={styles.field}>
              <span>Categoría*</span>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as any)}
                required
              >
                <option value="dpi">DPI</option>
                <option value="resultado">Resultado</option>
                <option value="seguro">Seguro</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>Notas</span>
              <input
                type="text"
                placeholder="Opcional"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </label>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={onClose}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`${styles.btnPrimary} ${
                  saving ? styles.btnDisabled : ""
                }`}
                disabled={saving}
              >
                {saving ? "Subiendo..." : "Subir"}
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

  // Modales
  const [imgOpen, setImgOpen] = useState(false);
  const [pacienteForImg, setPacienteForImg] = useState<PacienteItem | null>(
    null
  );

  const [imagesOpen, setImagesOpen] = useState(false);
  const [pacienteForImages, setPacienteForImages] =
    useState<PacienteItem | null>(null);

  const reload = () => {
    setLoading(true);
    listarPacientes(page, pageSize)
      .then((res) => {
        setData(res);
        setErr(null);
      })
      .catch((e) => setErr(e?.message ?? "Error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const openImgFor = (p: PacienteItem) => {
    setPacienteForImg(p);
    setImgOpen(true);
  };
  const closeImg = () => {
    setImgOpen(false);
    setPacienteForImg(null);
  };

  const openImagesFor = (p: PacienteItem) => {
    setPacienteForImages(p);
    setImagesOpen(true);
  };
  const closeImages = () => {
    setImagesOpen(false);
    setPacienteForImages(null);
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Lista de Pacientes</h1>
            <p className={styles.subtitle}>
              Busca, ordena y gestiona pacientes
            </p>
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
                <th
                  className={styles.sortable}
                  onClick={() => setSortAsc(!sortAsc)}
                >
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
                <tr>
                  <td colSpan={7} className={styles.error}>
                    {err}
                  </td>
                </tr>
              )}

              {!loading && !err && items.length === 0 && (
                <tr>
                  <td colSpan={7} className={styles.empty}>
                    No hay pacientes para mostrar.
                  </td>
                </tr>
              )}

              {!loading &&
                !err &&
                items.map((p) => (
                  <tr key={p.idPaciente}>
                    <td>
                      <div className={styles.name}>
                        {p.apellidos} {p.nombres}
                      </div>
                    </td>
                    <td className={styles.mono}>{p.dpi ?? "—"}</td>
                    <td>
                      <span className={styles.badge}>
                        {edad(p.fechaNacimiento) ?? "—"} años
                      </span>
                      {p.sexo && (
                        <span
                          className={`${styles.badge} ${
                            p.sexo === "M" ? styles.badgeBlue : styles.badgePink
                          }`}
                        >
                          {p.sexo}
                        </span>
                      )}
                    </td>
                    <td>{p.telefono ?? "—"}</td>
                    <td className={styles.truncate} title={p.correo ?? ""}>
                      {p.correo ?? "—"}
                    </td>
                    <td className={`${styles.right} ${styles.actions}`}>
                      <button onClick={() => openImgFor(p)}>
                        Agregar imagen
                      </button>
                      <button onClick={() => openImagesFor(p)}>
                        Ver imágenes
                      </button>
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
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value, 10));
                  setPage(1);
                }}
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles.range}>
            {data ? (
              <>
                {from}-{to} de {data.total}
              </>
            ) : (
              "—"
            )}
          </div>
          <div className={styles.pager}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!data || page <= 1 || loading}
            >
              ← Anterior
            </button>
            <span>Página {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data || to >= (data?.total ?? 0) || loading}
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>

      {/* Modal: subir archivo */}
      <ImageUploadModal
        open={imgOpen}
        paciente={pacienteForImg}
        onClose={closeImg}
        onUploaded={reload}
      />

      {/* Modal: visor de archivos */}
      <PacienteImagesModal
        open={imagesOpen}
        idPaciente={pacienteForImages?.idPaciente ?? null}
        onClose={closeImages}
      />
    </div>
  );
}
