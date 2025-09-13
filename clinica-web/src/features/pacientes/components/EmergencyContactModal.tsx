import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./List.module.css";
import { api } from "@/features/auth/api/api";

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
    const inputRef = useRef<HTMLInputElement>(null);

    // limpiar y enfocar al abrir
    useEffect(() => {
        if (open) {
            setNombre(""); setParentesco(""); setTelefono(""); setErr(null);
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [open]);

    // ESC para salir + bloquear scroll de fondo
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [open, onClose]);

    if (!open || !paciente) return null;

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr(null);
        if (!nombre.trim()) return setErr("Ingresa el nombre del contacto.");
        if (!parentesco.trim()) return setErr("Ingresa el parentesco.");
        try {
            setSaving(true);
            await api(`/api/Pacientes/${paciente.idPaciente}/contactos`, {
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

    return createPortal(
        <div className={styles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
            <div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
                aria-labelledby="ec-title"
            >
                <div className={styles.modalHeader}>
                    <h3 id="ec-title" className={styles.modalTitle}>Agregar contacto de emergencia</h3>
                    <button className={styles.modalClose} onClick={onClose} aria-label="Cerrar">×</button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.modalHint}>
                        Paciente:&nbsp;
                        <strong>
                            #{paciente.idPaciente} — {paciente.apellidos} {paciente.nombres}
                        </strong>
                        {paciente.dpi && (<>
                            <span className={styles.sep}>·</span>
                            <span>DPI: {paciente.dpi}</span>
                        </>)}
                    </div>

                    {err && <div className={styles.error} style={{ marginBottom: 8 }}>{err}</div>}

                    <form onSubmit={submit} className={styles.modalForm}>
                        <label className={styles.field}>
                            <span>Nombre*</span>
                            <input
                                ref={inputRef}
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
                                placeholder="Madre, Padre, Cónyuge…"
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
        </div>,
        document.body
    );
}

export default EmergencyContactModal;
