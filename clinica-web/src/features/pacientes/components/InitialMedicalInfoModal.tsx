import { useEffect, useRef, useState } from "react";
import styles from "@/pages/admin/pacientes/List.module.css";
import { api } from "@/features/auth/api/api";
import type {
  InfoMedicaInicialUpdate,
  InfoMedicaInicialResponse,
} from "@/features/pacientes/model/pacientes";

type PacienteLite = {
  idPaciente: number;
  nombres: string;
  apellidos: string;
  dpi?: string;
};

type FormState = Pick<
  InfoMedicaInicialUpdate,
  "antecedentes" | "alergias" | "enfermedadesCronicas"
>;

export default function InitialMedicalInfoModal({
  open,
  paciente,
  onClose,
  onSaved,
  initial,
}: {
  open: boolean;
  paciente: PacienteLite | null;
  onClose: () => void;
  onSaved?: () => void;
  initial?: Partial<FormState>;
}) {
  const [form, setForm] = useState<FormState>({
    antecedentes: "",
    alergias: "",
    enfermedadesCronicas: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLTextAreaElement>(null);

  // reset/precarga al abrir
  useEffect(() => {
    if (!open) return;
    setForm({
      antecedentes: initial?.antecedentes ?? "",
      alergias: initial?.alergias ?? "",
      enfermedadesCronicas: initial?.enfermedadesCronicas ?? "",
    });
    setErr(null);
    setTimeout(() => firstFieldRef.current?.focus(), 0);
  }, [open, initial]);

  // ESC para cerrar (sin bloquear scroll ni usar portal)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !paciente) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      setSaving(true);

      const payload: InfoMedicaInicialUpdate = {
        idPaciente: paciente.idPaciente,
        antecedentes: form.antecedentes.trim(),
        alergias: form.alergias.trim(),
        enfermedadesCronicas: form.enfermedadesCronicas.trim(),
      };

      await api<InfoMedicaInicialResponse>(
        `/api/Pacientes/${paciente.idPaciente}/informacion-medica-inicial`,
        { method: "PUT", auth: true, body: JSON.stringify(payload) }
      );

      onSaved?.();
      onClose();
      alert("Información médica inicial guardada.");
    } catch (e: any) {
      setErr(e?.message || "No se pudo guardar la información.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="imi-title"
      >
        <div className={styles.modalHeader}>
          <h3 id="imi-title" className={styles.modalTitle}>Información médica inicial</h3>
          <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalHint}>
            Paciente:&nbsp;
            <strong>
              #{paciente.idPaciente} — {paciente.apellidos} {paciente.nombres}
            </strong>
            {paciente.dpi && (<><span className={styles.sep}>·</span><span>DPI: {paciente.dpi}</span></>)}
          </div>

          {err && <div className={styles.error} style={{ marginBottom: 8 }}>{err}</div>}

          <form onSubmit={submit} className={styles.modalForm}>
            <label className={styles.field}>
              <span>Antecedentes</span>
              <textarea
                ref={firstFieldRef}
                rows={3}
                placeholder="Cirugías, hospitalizaciones, hábitos, etc."
                value={form.antecedentes}
                onChange={(e) => setForm((f) => ({ ...f, antecedentes: e.target.value }))}
              />
            </label>

            <label className={styles.field}>
              <span>Alergias</span>
              <textarea
                rows={2}
                placeholder="Medicamentos, alimentos, látex…"
                value={form.alergias}
                onChange={(e) => setForm((f) => ({ ...f, alergias: e.target.value }))}
              />
            </label>

            <label className={styles.field}>
              <span>Enfermedades crónicas</span>
              <textarea
                rows={2}
                placeholder="Hipertensión, diabetes, asma…"
                value={form.enfermedadesCronicas}
                onChange={(e) =>
                  setForm((f) => ({ ...f, enfermedadesCronicas: e.target.value }))
                }
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
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
