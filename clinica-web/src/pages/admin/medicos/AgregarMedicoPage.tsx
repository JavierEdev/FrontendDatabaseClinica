import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./AgregarMedicoPage.module.css";
import { crearMedico } from "@/features/medicos/api/MedicosController";
import type { MedicoCreateRequest } from "@/features/medicos/models/Medico";

export default function AgregarMedicoPage() {
  const nav = useNavigate();

  const [form, setForm] = useState<MedicoCreateRequest>({
    nombres: "",
    apellidos: "",
    numeroColegiado: "",
    especialidad: "",
    telefono: "",
    correo: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [okMsg, setOkMsg] = useState<string>("");

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setOkMsg("");

    if (!form.nombres || !form.apellidos || !form.numeroColegiado || !form.especialidad) {
      setError("Completa Nombres, Apellidos, Número de Colegiado y Especialidad.");
      return;
    }

    setLoading(true);
    try {
      await crearMedico(form);
      setOkMsg("Médico creado.");
      setTimeout(() => nav("/admin/medicos", { replace: true }), 800);
    } catch (err) {
      setError((err as Error).message || "No se pudo crear el médico");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.icon}>🩺</div>
        <div>
          <h1 className={styles.title}>Alta de Médico</h1>
          <div className={styles.subtitle}>Complete los datos del médico</div>
        </div>
      </header>

      <form className={styles.card} onSubmit={onSubmit} noValidate>
        <h2 className={styles.sectionTitle}>Datos del médico</h2>

        <div className={styles.grid3}>
          <Field label="Nombre(s)">
            <input name="nombres" value={form.nombres} onChange={onChange} required />
          </Field>

          <Field label="Apellido(s)">
            <input name="apellidos" value={form.apellidos} onChange={onChange} required />
          </Field>

          <Field label="Núm. Colegiado">
            <input name="numeroColegiado" value={form.numeroColegiado} onChange={onChange} required />
          </Field>

          <Field label="Especialidad">
            <input name="especialidad" value={form.especialidad} onChange={onChange} required />
          </Field>

          <Field label="Teléfono">
            <input name="telefono" value={form.telefono} onChange={onChange} />
          </Field>

          <Field label="Correo">
            <input type="email" name="correo" value={form.correo} onChange={onChange} />
          </Field>
        </div>

        {error && <div className={styles.alertError}>{error}</div>}
        {okMsg && <div className={styles.alertOk}>{okMsg}</div>}

        <div className={styles.actions}>
          <button className={styles.btnPrimary} disabled={loading}>
            {loading ? "Guardando..." : "Crear Médico"}
          </button>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => nav("/admin/medicos")}
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  colSpan,
}: {
  label: string;
  children: React.ReactNode;
  colSpan?: number;
}) {
  return (
    <label className={styles.field} style={colSpan ? { gridColumn: `span ${colSpan}` } : undefined}>
      <span className={styles.label}>{label}</span>
      <div className={styles.control}>{children}</div>
    </label>
  );
}
