// features/historial/ui/HistorialLayout.tsx
import styles from "../ui/historial.module.css";
import type { HistorialItem } from "@/features/historial/model/types";
import type { HistFilter } from "@/features/historial/model/types";

type PacienteMin = {
  idPaciente: number;
  nombres: string;
  apellidos: string;
  dpi?: string;
};

type Props = {
  dpiInput: string;
  onDpiInput: (v: string) => void;
  onBuscar: () => void;

  matches: PacienteMin[];
  sugOpen: boolean;
  setSugOpen: (v: boolean) => void;
  onPick: (p: PacienteMin) => void;
  sugLoading?: boolean;

  paciente: PacienteMin | null;
  wasSearched: boolean;

  items: HistorialItem[];
  loading: boolean;
  error: string | null;

  filter: HistFilter;
  setFilter: (f: HistFilter) => void;

  fotoUrl?: string | null;
  fotoLoading?: boolean;
};

function fmtDate(s: string) {
  const d = new Date(s);
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

function idConsultaDe(it: HistorialItem) {
  return it.meta?.idConsulta ?? it.meta?.id_consulta ?? it.meta?.idCita ?? null;
}

function renderBody(it: HistorialItem) {
  const idC = idConsultaDe(it);
  const fecha = fmtDate(it.fecha);

  if (it.tipo === "CONSULTA") {
    const m = it.meta ?? {};
    const motivo = m.motivo_consulta ?? m.motivo ?? it.titulo ?? "—";
    const dx = m.diagnostico ?? it.detalle ?? "—";
    const obs = m.observaciones ?? m.notas ?? null;

    return (
      <div className={styles.tBody}>
        <div><strong>Id Consulta:</strong> <span className={styles.sugDpi}>{idC ?? "—"}</span></div>
        <div><strong>Fecha:</strong> {fecha}</div>
        <div><strong>Motivo:</strong> {motivo}</div>
        <div><strong>Diagnóstico:</strong> {dx}</div>
        {obs ? <div><strong>Observaciones:</strong> {obs}</div> : null}
      </div>
    );
  }

  if (it.tipo === "RECETA") {
    const r = it.meta ?? {};
    const line = [r.medicamento, r.dosis, r.frecuencia, r.duracion].filter(Boolean).join(" · ") || it.titulo || "—";
    return (
      <div className={styles.tBody}>
        <div><strong>Id Consulta:</strong> <span className={styles.sugDpi}>{idC ?? "—"}</span></div>
        <div><strong>Fecha:</strong> {fecha}</div>
        <div><strong>Medicamento, dosis, frecuencia, duración:</strong> {line}</div>
      </div>
    );
  }

  const p = it.meta ?? {};
  return (
    <div className={styles.tBody}>
      <div><strong>Id Consulta:</strong> <span className={styles.sugDpi}>{idC ?? "—"}</span></div>
      <div><strong>Fecha:</strong> {fecha}</div>
      <div><strong>Procedimiento:</strong> {p.procedimiento ?? it.titulo ?? "—"}</div>
      <div><strong>Descripción:</strong> {p.descripcion ?? it.detalle ?? "—"}</div>
    </div>
  );
}

export default function HistorialLayout({
  dpiInput, onDpiInput, onBuscar,
  matches, sugOpen, setSugOpen, onPick, sugLoading,
  paciente, wasSearched,
  items, loading, error,
  filter, setFilter,
  fotoUrl, fotoLoading,
}: Props) {

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Historial Médico</h1>
          <p className={styles.subtitle}>
            Busca un paciente por DPI (o nombre) y entra a su historial.
          </p>
        </div>
      </div>

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
            {sugOpen && dpiInput && (
              <div className={styles.suggestions} onMouseDown={(e) => e.preventDefault()}>
                {sugLoading ? (
                  <div className={styles.suggestionItem}><span className={styles.sugName}>Cargando…</span></div>
                ) : matches.length === 0 ? (
                  <div className={styles.suggestionItem}><span className={styles.sugName}>Sin coincidencias.</span></div>
                ) : matches.map((p) => (
                  <button
                    key={p.idPaciente}
                    type="button"
                    className={styles.suggestionItem}
                    onClick={() => { onPick(p); setSugOpen(false); }}
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

      {paciente && (
        <div className={styles.selectedInfo}>
          {paciente.apellidos} {paciente.nombres} · {paciente.dpi ?? "—"}
        </div>
      )}

      <div className={styles.contentGrid}>
        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Paciente</h2>
          {!wasSearched ? (
            <p className={styles.muted}>Ingresa el DPI y presiona <b>Buscar</b>.</p>
          ) : !paciente ? (
            <p className={styles.muted}>No se encontró el paciente.</p>
          ) : (
            <>
              <div className={styles.patientSkeleton}>
                {fotoLoading ? (
                  <div className={styles.skAvatar} />
                ) : fotoUrl ? (
                  <img
                    src={fotoUrl}
                    alt="Foto del paciente"
                    className={styles.avatarImg}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                ) : (
                  <div className={styles.skAvatar} />
                )}

                <div className={styles.skLines}>
                  <div className={styles.skLine} />
                  <div className={styles.skLineShort} />
                </div>
              </div>

              <div className={styles.metaGrid}>
                <div>
                  <div className={styles.metaLabel}>Nombre</div>
                  <div className={styles.metaValue}>{paciente.apellidos} {paciente.nombres}</div>
                </div>
                <div>
                  <div className={styles.metaLabel}>DPI</div>
                  <div className={styles.metaValue}>{paciente.dpi ?? "—"}</div>
                </div>
              </div>
            </>
          )}
        </section>

        <section className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Línea de tiempo</h2>
            <div className={styles.filters}>
              {(["todos","CONSULTA","RECETA","PROCEDIMIENTO"] as HistFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  className={`${styles.chip} ${filter === f ? styles.chipActive : ""}`}
                  onClick={() => setFilter(f)}
                  disabled={!paciente || loading}
                >
                  {f === "todos" ? "Todos" :
                   f === "CONSULTA" ? "Consultas" :
                   f === "RECETA" ? "Recetas" : "Procedimientos"}
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
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={`sk-${i}`} className={styles.tItem}>
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
              {items.map((it) => {
                const rid =
                  it.meta?.id_receta ??
                  it.meta?.idReceta ??
                  it.meta?.id_procedimiento ??
                  it.meta?.idProcedimiento ??
                  it.meta?.idConsulta ??
                  it.id;

                const idC = idConsultaDe(it);

                return (
                  <li key={`${it.tipo}-${rid}`} className={styles.tItem}>
                    <div className={styles.tBullet} />
                    <div className={styles.tCard}>
                      <div className={styles.tHeader}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {idC != null && (
                            <div className={styles.badgeMuted}>ID C: {idC}</div>
                          )}
                          <div className={styles.badgeMuted}>{it.tipo}</div>
                        </div>
                      </div>

                      {renderBody(it)}

                      <div className={styles.tFooter}>
                        <button className={styles.linkBtn} disabled>Ver detalles</button>
                        <button className={styles.linkBtn} disabled>Adjuntar archivo</button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
