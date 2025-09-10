import styles from "../ui/historial.module.css";
import type { HistorialItem } from "@/features/historial/model/types";
import type { HistFilter } from "@/features/historial/hooks/useHistorial";

type PacienteMin = {
  idPaciente: number;
  nombres: string;
  apellidos: string;
  dpi?: string;
};

type Props = {
  /* buscador */
  dpiInput: string;
  onDpiInput: (v: string) => void;
  onBuscar: () => void;

  /* sugerencias */
  matches: PacienteMin[];
  sugOpen: boolean;
  setSugOpen: (v: boolean) => void;
  onPick: (p: PacienteMin) => void;
  sugLoading?: boolean;

  /* info seleccionada / timeline */
  paciente: PacienteMin | null;
  wasSearched: boolean;

  items: HistorialItem[];
  loading: boolean;
  error: string | null;

  filter: HistFilter;
  setFilter: (f: HistFilter) => void;
};

function fmtDate(s: string) {
  const d = new Date(s);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}
function bodyText(it: HistorialItem) {
  return it.titulo ?? it.detalle ?? "—";
}

export default function HistorialLayout({
  dpiInput, onDpiInput, onBuscar,
  matches, sugOpen, setSugOpen, onPick, sugLoading,
  paciente, wasSearched,
  items, loading, error,
  filter, setFilter,
}: Props) {
  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Historial Médico</h1>
          <p className={styles.subtitle}>
            Busca un paciente por DPI (o nombre) y entra a su historial.
          </p>
        </div>
      </div>

      {/* Buscador + sugerencias */}
      <div className={styles.searchRow} role="search">
        <div className={styles.searchLine}>
          <div className={styles.searchWrap}>
            <input
              className={styles.searchInput}
              placeholder="Ej. 2456789012345"
              value={dpiInput}
              onChange={(e) => { onDpiInput(e.target.value); setSugOpen(true); }}
              onFocus={() => setSugOpen(true)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onBuscar(); } }}
              inputMode="numeric"
              aria-label="DPI del paciente"
              aria-expanded={sugOpen ? "true" : "false"}
            />

            {/* Dropdown (evitamos que el mousedown cierre el input antes del click) */}
            {sugOpen && dpiInput && (
              <div className={styles.suggestions} onMouseDown={(e) => e.preventDefault()}>
                {sugLoading ? (
                  <div className={styles.suggestionItem}>
                    <span className={styles.sugName}>Cargando…</span>
                  </div>
                ) : matches.length === 0 ? (
                  <div className={styles.suggestionItem}>
                    <span className={styles.sugName}>Sin coincidencias.</span>
                  </div>
                ) : matches.map((p) => (
                  <button
                    key={p.idPaciente}
                    type="button"
                    className={styles.suggestionItem}
                    onClick={() => { onPick(p); setSugOpen(false); }}
                    title="Seleccionar paciente"
                  >
                    <span className={styles.sugName}>{p.apellidos} {p.nombres}</span>
                    <span className={styles.sugDpi}>{p.dpi ?? "—"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onBuscar}
            disabled={!dpiInput || loading}
          >
            {loading ? "Cargando…" : "Buscar"}
          </button>
        </div>
      </div>

      {/* Renglón con el paciente */}
      {paciente && (
        <div className={styles.selectedInfo}>
          {paciente.apellidos} {paciente.nombres} · {paciente.dpi ?? "—"}
        </div>
      )}

      {/* Contenido */}
      <div className={styles.contentGrid}>
        {/* Panel paciente */}
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Paciente</h2>
          {!wasSearched ? (
            <p className={styles.muted}>Ingresa el DPI y presiona <b>Buscar</b>.</p>
          ) : !paciente ? (
            <p className={styles.muted}>No se encontró el paciente.</p>
          ) : (
            <>
              <div className={styles.patientSkeleton}>
                <div className={styles.skAvatar} />
                <div className={styles.skLines}>
                  <div className={styles.skLine} />
                  <div className={styles.skLineShort} />
                </div>
              </div>

              <div className={styles.metaGrid}>
                <div>
                  <div className={styles.metaLabel}>Nombre</div>
                  <div className={styles.metaValue}>
                    {paciente.apellidos} {paciente.nombres}
                  </div>
                </div>
                <div>
                  <div className={styles.metaLabel}>DPI</div>
                  <div className={styles.metaValue}>{paciente.dpi ?? "—"}</div>
                </div>
              </div>

              <div className={styles.actionsRow}>
                <button className={styles.outlineBtn} type="button" disabled>Nueva cita</button>
                <button className={styles.outlineBtn} type="button" disabled>Agregar antecedente</button>
              </div>
            </>
          )}
        </section>

        {/* Timeline */}
        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Línea de tiempo</h2>
            <div className={styles.filters}>
              {(["todos","CONSULTA","ANTECEDENTE","RECETA","IMAGEN"] as HistFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`${styles.chip} ${filter === f ? styles.chipActive : ""}`}
                  onClick={() => setFilter(f)}
                  disabled={!paciente || loading}
                >
                  {f === "todos" ? "Todos" :
                   f === "CONSULTA" ? "Consultas" :
                   f === "ANTECEDENTE" ? "Antecedentes" :
                   f === "RECETA" ? "Recetas" : "Imágenes"}
                </button>
              ))}
            </div>
          </div>

          {!paciente ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🗂️</div>
              <div className={styles.emptyTitle}>Sin resultados</div>
              <div className={styles.emptyText}>Selecciona o busca un paciente.</div>
            </div>
          ) : error ? (
            <div className={styles.errorBox}>{error}</div>
          ) : loading ? (
            <ul className={styles.timeline} role="list">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className={styles.tItem}>
                  <div className={styles.tBullet} />
                  <div className={styles.tCard}>
                    <div className={styles.tHeader}>
                      <div className={styles.skLine} />
                      <div className={styles.badgeMuted}>—</div>
                    </div>
                    <div className={styles.tBody}>
                      <div className={styles.skLine} />
                      <div className={styles.skLineShort} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ul className={styles.timeline} role="list">
              {items.map((it) => (
                <li key={it.id} className={styles.tItem}>
                  <div className={styles.tBullet} />
                  <div className={styles.tCard}>
                    <div className={styles.tHeader}>
                      <div>{fmtDate(it.fecha)}</div>
                      <div className={styles.badgeMuted}>{it.tipo}</div>
                    </div>
                    <div className={styles.tBody}>{bodyText(it)}</div>
                    <div className={styles.tFooter}>
                      <button className={styles.linkBtn} disabled>Ver detalles</button>
                      <button className={styles.linkBtn} disabled>Adjuntar archivo</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
