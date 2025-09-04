// src/pages/RegistroPage.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  crearPaciente,
  subirDocumentoPaciente,
} from "@/features/pacientes/api/pacientes";
import type { NuevoPaciente } from "@/features/pacientes/model/pacientes";
import styles from "./RegistroPage.module.css";

export default function RegistroPage() {
  const nav = useNavigate();

  const [form, setForm] = useState<NuevoPaciente>({
    nombres: "",
    apellidos: "",
    dpi: "",
    fechaNacimiento: "",
    sexo: "",
    direccion: "",
    telefono: "",
    correo: "",
    estadoCivil: "",
  });

  const [docFile, setDocFile] = useState<File | null>(null);
  const [categoria, setCategoria] = useState("DPI");
  const [notas, setNotas] = useState("");
  const [password, setPassword] = useState(""); // Nuevo estado para la contraseña

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [okMsg, setOkMsg] = useState<string>("");

  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOkMsg("");

    if (!docFile) {
      setError("Debes adjuntar un documento del paciente.");
      return;
    }
    if (
      !form.nombres ||
      !form.apellidos ||
      !form.dpi ||
      !form.fechaNacimiento ||
      !password
    ) {
      setError("Completa todos los campos, incluidos los de la contraseña.");
      return;
    }

    setLoading(true);
    try {
      const creado = await crearPaciente(form);
      await subirDocumentoPaciente(creado.id, docFile, categoria, notas);

      setOkMsg(`Paciente creado.`);
      setTimeout(() => nav("/login", { replace: true }), 800); // Redirige al login
    } catch (err) {
      setError((err as Error).message || "No se pudo crear el paciente");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Registro de Paciente</h1>
          <div className={styles.subtitle}>Complete sus datos</div>
        </div>
      </header>

      <form className={styles.card} onSubmit={onSubmit} noValidate>
        <h2 className={styles.sectionTitle}>Datos personales</h2>

        <div className={styles.grid3}>
          <Field label="DPI">
            <input name="dpi" value={form.dpi} onChange={onChange} required />
          </Field>
          <Field label="Nombre">
            <input
              name="nombres"
              value={form.nombres}
              onChange={onChange}
              required
            />
          </Field>
          <Field label="Apellido">
            <input
              name="apellidos"
              value={form.apellidos}
              onChange={onChange}
              required
            />
          </Field>

          <Field label="Fecha de Nacimiento">
            <input
              type="date"
              name="fechaNacimiento"
              value={form.fechaNacimiento}
              onChange={onChange}
              required
            />
          </Field>

          <Field label="Sexo">
            <select name="sexo" value={form.sexo} onChange={onChange}>
              <option value="">Seleccione…</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </Field>

          <Field label="Estado civil">
            <input
              name="estadoCivil"
              value={form.estadoCivil}
              onChange={onChange}
            />
          </Field>

          <Field label="Dirección" colSpan={2}>
            <input
              name="direccion"
              value={form.direccion}
              onChange={onChange}
            />
          </Field>

          <Field label="Teléfono">
            <input name="telefono" value={form.telefono} onChange={onChange} />
          </Field>
        </div>

        {/* Separación de la sección de cuenta de usuario */}
        <h2 className={styles.sectionTitle}>Cuenta de Usuario</h2>

        <div className={styles.grid3}>
          <Field label="Correo electrónico">
            <input
              type="email"
              name="correo"
              value={form.correo}
              onChange={onChange}
            />
          </Field>

          <Field label="Contraseña">
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>
        </div>

        <h2 className={styles.sectionTitle}>Documento (requerido)</h2>
        <div className={styles.gridDoc}>
          <Field label="Archivo">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
              required
            />
          </Field>
          <Field label="Categoría">
            <input
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              required
            />
          </Field>
          <Field label="Notas">
            <input value={notas} onChange={(e) => setNotas(e.target.value)} />
          </Field>
        </div>

        {error && <div className={styles.alertError}>{error}</div>}
        {okMsg && <div className={styles.alertOk}>{okMsg}</div>}

        <div className={styles.actions}>
          <button className={styles.btnPrimary} disabled={loading}>
            {loading ? "Guardando..." : "Registrar Paciente"}
          </button>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => nav("/")}
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
    <label
      className={styles.field}
      style={colSpan ? { gridColumn: `span ${colSpan}` } : undefined}
    >
      <span className={styles.label}>{label}</span>
      <div className={styles.control}>{children}</div>
    </label>
  );
}
