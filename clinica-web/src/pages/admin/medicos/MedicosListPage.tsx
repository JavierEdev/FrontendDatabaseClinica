// src/pages/admin/medicos/MedicosListPage.tsx
import { useEffect, useMemo, useState } from "react";
import styles from "../medicos/List.module.css";
import { getMedicos, fetchMedicoById } from "@/features/medicos/api/MedicosController";
import type { Medico, MedicoDetalleResponse } from "@/features/medicos/models/Medico";

type MedicoRow = Medico & {
  telefono?: string;
  horario?: string;
  correo?: string;
  colegiado?: string | number;
  direccion?: string;
  consultorio?: string;
};

/* ──────────────────────────────────────────────────────────────────────────────
   Modal: Ver médico (solo lectura y compacta, 2 columnas + scroll)
   ────────────────────────────────────────────────────────────────────────────── */
function MedicoViewModal({
  open,
  medico,
  onClose,
}: {
  open: boolean;
  medico: MedicoRow | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !medico) return null;

  // Etiquetas legibles para campos conocidos
  const LABELS: Record<string, string> = {
    id: "ID",
    nombres: "Nombre",          // 👈 singular
    apellidos: "Apellidos",
    especialidad: "Especialidad",
    colegiado: "Colegiado",
    numeroColegiado: "Número Colegiado",
    telefono: "Teléfono",
    correo: "Correo",
    horario: "Horario",
    consultorio: "Consultorio",
    direccion: "Dirección",
  };

  // Orden principal SIN nombreCompleto; subimos nombres y apellidos
  const ORDER = [
    "nombres",
    "apellidos",
    "especialidad",
    "telefono",
    "correo",
    "horario",
    "consultorio",
    "direccion",
  ];

  const obj = medico as Record<string, any>;

  const mainPairs = ORDER
    .filter((k) => obj[k] !== undefined && obj[k] !== null && String(obj[k]) !== "")
    .map((k) => [k, obj[k]] as const);

  // El resto de propiedades se muestran en “Otros datos”, excluyendo los ya usados
  const omitForExtras = new Set<string>(["id", ...ORDER, "nombreCompleto"]); // 👈 ocultamos nombreCompleto
  const extraKeys = Object.keys(obj).filter(
    (k) =>
      !omitForExtras.has(k) &&
      obj[k] !== undefined &&
      obj[k] !== null &&
      (typeof obj[k] !== "object" || Array.isArray(obj[k]))
  );

  const fmt = (v: unknown) =>
    Array.isArray(v) ? v.join(", ")
    : typeof v === "boolean" ? (v ? "Sí" : "No")
    : String(v);

  const labelize = (key: string) =>
    LABELS[key] ||
    key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^./, (c) => c.toUpperCase());

  const isWide = (k: string, v: unknown) =>
    k === "direccion" || String(v ?? "").length > 80;

  const displayName = `${obj.nombres ?? ""} ${obj.apellidos ?? ""}`.trim() || "—";

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={`${styles.modal} ${styles.modalCompact}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Médico #{medico.id}</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        {/* cuerpo con alto máximo y scroll interno */}
        <div className={styles.modalBody} style={{ maxHeight: "78vh", overflow: "auto" }}>
          {/* Cabecera con nombre (formado por nombres + apellidos) y especialidad */}
          <div className={styles.modalHint} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <strong style={{ fontWeight: 700 }}>{displayName}</strong>
            {obj.especialidad && (
              <>
                <span className={styles.sep}>›</span>
                <span className={styles.kvPill}>{obj.especialidad}</span>
              </>
            )}
          </div>

          {/* PRINCIPALES en 2 columnas */}
          <dl className={styles.kvGrid2}>
            {mainPairs.map(([k, v]) => (
              <div key={k} className={isWide(k, v) ? styles.kvItemFull : styles.kvItem}>
                <dt className={styles.kvLabel}>{labelize(k)}</dt>
                <dd className={isWide(k, v) ? styles.kvValueMultiline : styles.kvValue}>
                  {fmt(v) || "—"}
                </dd>
              </div>
            ))}
          </dl>

          {/* EXTRAS automáticos */}
          {extraKeys.length > 0 && (
            <>
              <div style={{ height: 10 }} />
              <h4 className={styles.sectionTitle}>Otros datos</h4>
              <dl className={styles.kvGrid2}>
                {extraKeys.map((k) => (
                  <div key={k} className={isWide(k, obj[k]) ? styles.kvItemFull : styles.kvItem}>
                    <dt className={styles.kvLabel}>{labelize(k)}</dt>
                    <dd className={isWide(k, obj[k]) ? styles.kvValueMultiline : styles.kvValue}>
                      {fmt(obj[k]) || "—"}
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

/* ──────────────────────────────────────────────────────────────────────────────
   Página: Lista de Médicos
   ────────────────────────────────────────────────────────────────────────────── */
export default function MedicosListPage() {
  const [list, setList] = useState<MedicoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [detailsLoading, setDetailsLoading] = useState(false);

  const [q, setQ] = useState("");
  const [sortAsc, setSortAsc] = useState(true);
  const [filtroEsp, setFiltroEsp] = useState("Todas");

  // Modal VER
  const [viewOpen, setViewOpen] = useState(false);
  const [medicoView, setMedicoView] = useState<MedicoRow | null>(null);

  // 1) Cargar listado base
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const base = await getMedicos({ signal: ac.signal });
        setList(base);
      } catch (e: any) {
        if (e?.name !== "AbortError") setErr(e?.message || "No se pudo cargar el listado de médicos");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  // 2) Enriquecer con detalle por id
  useEffect(() => {
    if (list.length === 0) return;

    let alive = true;
    const ac = new AbortController();

    (async () => {
      try {
        setDetailsLoading(true);
        const results = await Promise.all(
          list.map(async (m) => {
            const det = await fetchMedicoById(m.id, ac.signal);
            return { id: m.id, det };
          })
        );
        if (!alive) return;

        setList((prev) =>
          prev.map((m) => {
            const hit = results.find((r) => r.id === m.id)?.det as MedicoDetalleResponse | null;
            if (!hit) return m;
            return { ...m, ...hit };
          })
        );
      } catch (e: any) {
        if (e?.name !== "AbortError" && import.meta.env.DEV) console.warn("[medicos] detalles error:", e);
      } finally {
        if (alive) setDetailsLoading(false);
      }
    })();

    return () => {
      alive = false;
      ac.abort();
    };
  }, [list.length]);

  const especialidades = useMemo(() => {
    const set = new Set<string>();
    list.forEach((m) => m.especialidad && set.add(m.especialidad));
    return ["Todas", ...Array.from(set).sort((a, b) => a.localeCompare(b, "es"))];
  }, [list]);

  const data = useMemo(() => {
    const term = q.trim().toLowerCase();

    const filtered = list.filter((m) => {
      const byEsp = filtroEsp === "Todas" || m.especialidad === filtroEsp;
      if (!term) return byEsp;
      const hay =
        m.nombreCompleto.toLowerCase().includes(term) ||
        (m.especialidad || "").toLowerCase().includes(term) ||
        (m.telefono || "").toLowerCase().includes(term);
      return byEsp && hay;
    });

    const ordered = [...filtered].sort((a, b) => {
      const an = (a.nombreCompleto || "").toLowerCase();
      const bn = (b.nombreCompleto || "").toLowerCase();
      return sortAsc ? an.localeCompare(bn, "es") : bn.localeCompare(an, "es");
    });

    return ordered;
  }, [list, q, sortAsc, filtroEsp]);

  const openView = (m: MedicoRow) => {
    setMedicoView(m);
    setViewOpen(true);
    const ac = new AbortController();
    fetchMedicoById(m.id, ac.signal)
      .then((det) => setMedicoView((prev) => (prev ? { ...prev, ...det } : prev)))
      .catch(() => {});
  };

  const closeView = () => { setViewOpen(false); setMedicoView(null); };

  return (
    <div className={styles.wrap}>
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Lista de Médicos</h1>
            <p className={styles.subtitle}>
              Busca, filtra y gestiona médicos {detailsLoading ? "· cargando detalles…" : ""}
            </p>
          </div>

          <div className={styles.headerActions}>
            <select
              value={filtroEsp}
              onChange={(e) => setFiltroEsp(e.target.value)}
              title="Filtrar por especialidad"
              style={{ marginRight: 8 }}
            >
              {especialidades.map((esp) => (
                <option key={esp} value={esp}>{esp}</option>
              ))}
            </select>

            <div className={styles.searchBox}>
              <input
                placeholder="Buscar por nombre, especialidad o teléfono…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && <button className={styles.clearBtn} onClick={() => setQ("")}>×</button>}
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.sortable} onClick={() => setSortAsc(!sortAsc)} title="Ordenar por nombre">
                  Médico {sortAsc ? "▲" : "▼"}
                </th>
                <th>Especialidad</th>
                <th>Teléfono</th>
                <th>Horario</th>
                <th className={styles.right}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`} className={styles.skeletonRow}>
                    <td colSpan={5}>&nbsp;</td>
                  </tr>
                ))}

              {!loading && err && (
                <tr><td colSpan={5} className={styles.error}>{err}</td></tr>
              )}

              {!loading && !err && data.length === 0 && (
                <tr><td colSpan={5} className={styles.empty}>No hay médicos para mostrar.</td></tr>
              )}

              {!loading && !err && data.map((m) => (
                <tr key={m.id}>
                  <td><div className={styles.name}>{m.nombreCompleto}</div></td>
                  <td>{m.especialidad || "—"}</td>
                  <td className={styles.mono}>{m.telefono || "—"}</td>
                  <td className={styles.truncate} title={m.horario || ""}>{m.horario || "—"}</td>
                  <td className={`${styles.right} ${styles.actions}`}>
                    <button onClick={() => openView(m)}>Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.range}>
            {loading ? "—" : `${data.length} ${data.length === 1 ? "médico" : "médicos"}`}
          </div>
        </div>
      </div>

      {/* Modal VER */}
      <MedicoViewModal open={viewOpen} medico={medicoView} onClose={closeView} />
    </div>
  );
}
