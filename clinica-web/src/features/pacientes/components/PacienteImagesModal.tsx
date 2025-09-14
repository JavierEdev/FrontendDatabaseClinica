import { useEffect, useMemo, useState } from "react";
import styles from "./PacienteImagesModal.module.css";
import {
  listarDocumentosPaciente,
  getDocumentoDownloadUrl
} from "@/features/pacientes/api/pacientes";
import type { DocumentoItemApi } from "@/features/pacientes/model/pacientes"

const CATS = ["todas", "dpi", "resultado", "seguro"] as const;

function fmtDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  return isNaN(d.getTime())
    ? "—"
    : new Intl.DateTimeFormat("es-GT", { dateStyle: "medium", timeStyle: "short" }).format(d);
}
function fmtSize(b: number) {
  if (!Number.isFinite(b)) return "—";
  if (b >= 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${b} B`;
}

// Detección robusta por content-type y por extensión del archivo:
const isImageLike = (ct?: string, name?: string | null) =>
  (!!ct && /^image\//i.test(ct)) ||
  (!!name && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name));

const isPdfLike = (ct?: string, name?: string | null) =>
  (!!ct && /pdf/i.test(ct)) || (!!name && /\.pdf$/i.test(name ?? ""));

export default function PacienteImagesModal({
  open,
  idPaciente,
  onClose,
}: {
  open: boolean;
  idPaciente: number | null;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [data, setData] = useState<{ total: number; items: DocumentoItemApi[] }>({ total: 0, items: [] });
  const [cat, setCat] = useState<(typeof CATS)[number]>("todas");

  // preview
  const [previewing, setPreviewing] = useState<DocumentoItemApi | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewErr, setPreviewErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !idPaciente) return;

    const ac = new AbortController();
    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const res = await listarDocumentosPaciente(idPaciente, page, pageSize, ac.signal);
        setData({ total: res.total, items: res.items || [] });
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e?.message || "No se pudieron cargar los documentos.");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [open, idPaciente, page, pageSize]);

  useEffect(() => {
    // reset al cerrar
    if (!open) {
      setPage(1);
      setCat("todas");
      setPreviewing(null);
      setPreviewUrl(null);
      setPreviewErr(null);
    }
  }, [open, idPaciente]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const items = useMemo(() => {
    if (cat === "todas") return data.items;
    return data.items.filter((x) => String(x.categoria).toLowerCase() === cat);
  }, [data.items, cat]);

  const totalPages = Math.max(1, Math.ceil(data.total / pageSize));

  async function onPreview(doc: DocumentoItemApi) {
    setPreviewing(doc);
    setPreviewUrl(null);
    setPreviewErr(null);
    try {
      const { url } = await getDocumentoDownloadUrl(idPaciente!, doc.idImagen, 300);
      setPreviewUrl(url);
    } catch (e: any) {
      setPreviewErr(e?.message || "No se pudo obtener el enlace de descarga.");
    }
  }

  if (!open || !idPaciente) return null;

  const renderPreviewBody = () => {
    if (!previewing) return null;
    const img = isImageLike(previewing.contentType, previewing.nombreArchivoOriginal);
    const pdf = isPdfLike(previewing.contentType, previewing.nombreArchivoOriginal);

    if (previewErr) {
      return <div className={styles.error} style={{ marginTop: 8 }}>{previewErr}</div>;
    }
    if (!previewUrl) {
      return <div className={styles.empty}>Cargando vista previa…</div>;
    }
    if (img) {
      return (
        <div className={styles.previewBody}>
          <img
            className={styles.previewImg}
            src={previewUrl}
            alt={previewing.nombreArchivoOriginal || String(previewing.idImagen)}
          />
        </div>
      );
    }
    if (pdf) {
      // PDF embebido
      return (
        <div className={styles.previewBody}>
          <iframe
            className={styles.previewPdf}
            src={`${previewUrl}#view=FitH`}
            title={previewing.nombreArchivoOriginal || `PDF ${previewing.idImagen}`}
          />
        </div>
      );
    }
    // Otros tipos (docx, zip, etc.)
    return (
      <div className={styles.previewBody}>
        <div className={styles.empty}>
          Tipo de archivo no previsualizable (<span className={styles.mono}>{previewing.contentType || "desconocido"}</span>).
          Usa “Abrir” para verlo/descargarlo.
        </div>
      </div>
    );
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Imágenes y documentos · Paciente #{idPaciente}</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className={styles.modalBody}>
          {/* Filtros y paginación */}
          <div className={styles.toolbar}>
            <div className={styles.filters}>
              <label className={styles.filter}>
                <span>Categoría</span>
                <select value={cat} onChange={(e) => setCat(e.target.value as any)}>
                  {CATS.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
                </select>
              </label>
            </div>
            <div className={styles.pager}>
              <button
                className={styles.btnGhost}
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >←</button>
              <span className={styles.pageInfo}>Página {page} / {totalPages}</span>
              <button
                className={styles.btnGhost}
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >→</button>
            </div>
          </div>

          {err && <div className={styles.error}>{err}</div>}
          {loading && <div className={styles.empty}>Cargando…</div>}

          {!loading && !err && items.length === 0 && (
            <div className={styles.empty}>No hay documentos para mostrar.</div>
          )}

          {!loading && !err && items.length > 0 && (
            <div className={styles.grid}>
              {items.map((doc) => (
                <article key={doc.idImagen} className={styles.card}>
                  <div className={styles.cardTop}>
                    <span className={`${styles.badge} ${styles[`cat_${doc.categoria}`] || ""}`}>
                      {doc.categoria}
                    </span>
                    <span className={styles.muted}>{doc.contentType || "—"}</span>
                  </div>

                  <div className={styles.meta}>
                    <div className={styles.row}><span>Archivo</span><b className={styles.truncate}>{doc.nombreArchivoOriginal || `#${doc.idImagen}`}</b></div>
                    <div className={styles.row}><span>Tamaño</span><b>{fmtSize(doc.tamanoBytes)}</b></div>
                    <div className={styles.row}><span>Doc.</span><b>{fmtDate(doc.fechaDocumento)}</b></div>
                    <div className={styles.row}><span>Estudio</span><b>{fmtDate(doc.fechaEstudio)}</b></div>
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      className={styles.btnPrimary}
                      onClick={() => onPreview(doc)}
                      title="Vista previa / Abrir"
                    >
                      Ver
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* Preview */}
          {previewing && (
            <div className={styles.previewWrap}>
              <div className={styles.previewHeader}>
                <div className={styles.previewTitle}>
                  Vista previa · <span className={styles.mono}>#{previewing.idImagen}</span>
                </div>
                <div className={styles.previewActions}>
                  {previewUrl && (
                    <a
                      className={styles.btnGhost}
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Abrir en nueva pestaña"
                    >
                      Abrir
                    </a>
                  )}
                  <button className={styles.btnGhost} onClick={() => { setPreviewing(null); setPreviewUrl(null); }}>
                    Cerrar
                  </button>
                </div>
              </div>

              {renderPreviewBody()}
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button className={styles.btnGhost} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
