import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  crearPaciente,
  subirDocumentoPaciente,
} from "@/features/pacientes/api/pacientes";
import type { NuevoPaciente } from "@/features/pacientes/model/pacientes";
import { createUser } from "@/features/auth/api/api";
import type { CreateUsuariosRequest } from "@/features/auth/model/auth";
import styles from "./RegistroPage.module.css";
import {
  REGEX,
  isOnlyDigits,
  isDpi13,
  isPhone8,
  isLettersNoDouble,
  isDateUS,
  isNotes,
  isAddress,
  blocksImmediateDuplicates,
  blocksDoubleSpace,
  blocksDoubleHyphen,
  // 👇 usa los nombres correctos para email restringido
  isEmailRestricted,
  blocksEmailRestrictedInput,
} from "@/shared/validators";




export default function RegistroPage() {
  const nav = useNavigate();
  const todayISO = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

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

  const [usuario, setUsuario] = useState<CreateUsuariosRequest>({
    username: "",
    password: "",
    rol: "paciente",
    idMedico: null,
    idPaciente: 0,
  });

  const [docFile, setDocFile] = useState<File | null>(null);
  const [categoria, setCategoria] = useState("DPI");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [okMsg, setOkMsg] = useState<string>("");

  // Manejo de cambios en los campos de input
  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    if (name === "correo" || name === "password") {
      setUsuario((prevState) => ({
        ...prevState,
        [name === "correo" ? "username" : "password"]: value,
      }));
      setForm((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  // Función para enviar el formulario
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
      !usuario.password
    ) {
      setError("Completa todos los campos, incluidos los de la contraseña.");
      return;
    }
    
        // Reglas estrictas
      if (!isDpi13(form.dpi)) {
        setError("El DPI debe contener exactamente 13 dígitos.");
        return;
      }
      if (!isPhone8(form.telefono)) {
        setError("El teléfono debe contener exactamente 8 dígitos.");
        return;
      }
      if (!isLettersNoDouble(form.nombres)) {
        setError("El nombre solo permite letras y espacios (sin doble espacio).");
        return;
      }
      if (!isLettersNoDouble(form.apellidos)) {
        setError("El apellido solo permite letras y espacios (sin doble espacio).");
        return;
      }
      if (form.estadoCivil && !isLettersNoDouble(form.estadoCivil)) {
        setError("El estado civil solo permite letras y espacios (sin doble espacio).");
        return;
      }
      if (!isEmailRestricted(form.correo)) {
        setError("Formato de correo inválido.");
        return;
      }
      if (form.fechaNacimiento > todayISO) {
        setError("La fecha de nacimiento no puede ser futura.");
        return;
      }
      if (form.direccion && !isAddress(form.direccion)) {
        setError(
          'Dirección inválida: solo letras/números/espacio y -, _, ., ,, (), ". Sin dobles consecutivos (p. ej., "--", "__", "..", ",,", \"\", "()", "  ").'
        );
        return;
      }
      if (notas && !isNotes(notas)) {
        setError(
          'Notas inválidas: solo letras/números/espacio y -, _, ., ,, (), ". Sin dobles consecutivos (p. ej., "--", "__", "..", ",,", \"\", "()", "  ").'
        );
        return;
      }

      // Validación de fecha manteniendo mm/dd/yyyy
      {
        const raw = form.fechaNacimiento;
        const isUS = REGEX.dateUS.test(raw);
        const isISO = /^\d{4}-\d{2}-\d{2}$/.test(raw);

        if (!isUS && !isISO) {
          setError("La fecha debe tener el formato mm/dd/yyyy.");
          return;
        }
        if (isUS && !isDateUS(raw)) {
          setError("La fecha ingresada no es válida.");
          return;
        }
        const toISO = isUS
          ? (() => {
              const [m, d, y] = raw.split("/");
              return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
            })()
          : raw;

        if (toISO > todayISO) {
          setError("La fecha de nacimiento no puede ser futura.");
          return;
        }
      }


    setLoading(true);
    try {
      const creado = await crearPaciente(form);
      await subirDocumentoPaciente(creado.id, docFile, categoria, notas);
      usuario.idPaciente = creado.id;
      await createUser(usuario);

      setOkMsg(`Paciente creado.`);
      setTimeout(() => nav("/login", { replace: true }), 800);
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
            <input
              name="dpi"
              value={form.dpi}
              onChange={onChange}
              required
              inputMode="numeric"
              pattern={REGEX.dpi13.source}
              maxLength={13}
              onBeforeInput={(e: any) => {
                const v = e.data ?? "";
                if (v && !/^\d+$/.test(v)) e.preventDefault();
              }}
              onPaste={(e) => {
                const t = (e.clipboardData || (window as any).clipboardData).getData("text");
                if (!isDpi13(t)) e.preventDefault();
              }}
            />

          </Field>
          <Field label="Nombre">
            <input
              name="nombres"
              value={form.nombres}
              onChange={onChange}
              required
              inputMode="text"
              pattern={REGEX.onlyLettersSpacesNoDouble.source}
              onBeforeInput={(e: any) => {
                blocksDoubleSpace(e);
                const v = e.data ?? "";
                if (v && !/[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]/.test(v)) e.preventDefault();
              }}
              onPaste={(e) => {
                const t = (e.clipboardData || (window as any).clipboardData).getData("text");
                if (!isLettersNoDouble(t)) e.preventDefault();
              }}
            />

          </Field>
          <Field label="Apellido">
            <input
              name="apellidos"
              value={form.apellidos}
              onChange={onChange}
              required
              inputMode="text"
              pattern={REGEX.onlyLettersSpacesNoDouble.source}
              onBeforeInput={(e: any) => {
                blocksDoubleSpace(e);
                const v = e.data ?? "";
                if (v && !/[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]/.test(v)) e.preventDefault();
              }}
              onPaste={(e) => {
                const t = (e.clipboardData || (window as any).clipboardData).getData("text");
                if (!isLettersNoDouble(t)) e.preventDefault();
              }}
            />

          </Field>

          <Field label="Fecha de Nacimiento">
            <input
              type="date"
              name="fechaNacimiento"
              value={form.fechaNacimiento}
              onChange={onChange}
              required
              max={todayISO}                   // evita fechas futuras con el datepicker
              onInput={(e: any) => {
                // En algunos navegadores el usuario puede teclear "mm/dd/yyyy".
                // Recorta a 10 para no permitir más de 4 dígitos de año.
                e.currentTarget.value = String(e.currentTarget.value).slice(0, 10);
              }}
              onBlur={(e) => {
                const raw = e.currentTarget.value;

                // Aceptamos dos casos:
                // 1) El navegador entrega "mm/dd/yyyy" (según locale visual)
                // 2) El navegador entrega "yyyy-mm-dd" (valor ISO)
                const isUS = REGEX.dateUS.test(raw);
                const isISO = /^\d{4}-\d{2}-\d{2}$/.test(raw);

                if (!isUS && !isISO) {
                  setError("La fecha debe tener el formato mm/dd/yyyy.");
                  return;
                }

                // Si viene en US, verificamos que sea una fecha real (30/31 días, etc.)
                if (isUS && !isDateUS(raw)) {
                  setError("La fecha ingresada no es válida.");
                  return;
                }

                // Comparar contra hoy (en ambos formatos)
                const toISO = isUS
                  ? (() => {
                      const [m, d, y] = raw.split("/"); // mm/dd/yyyy
                      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
                    })()
                  : raw; // ya es yyyy-mm-dd

                if (toISO > todayISO) {
                  setError("La fecha de nacimiento no puede ser futura.");
                }
              }}
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
              inputMode="text"
              pattern={REGEX.onlyLettersSpacesNoDouble.source}
              onBeforeInput={(e: any) => {
                blocksDoubleSpace(e);
                const v = e.data ?? "";
                if (v && !/[A-Za-zÁÉÍÓÚáéíóúÑñÜü ]/.test(v)) e.preventDefault();
              }}
              onPaste={(e) => {
                const t = (e.clipboardData || (window as any).clipboardData).getData("text");
                if (!isLettersNoDouble(t)) e.preventDefault();
              }}
            />

          </Field>

          <Field label="Dirección" colSpan={2}>
          <input
            name="direccion"
            value={form.direccion}
            onChange={onChange}
            inputMode="text"
            pattern={REGEX.notesAllowed.source}
            onBeforeInput={(e: any) => {
              blocksImmediateDuplicates(e);
              const v = e.data ?? "";
              // Solo caracteres permitidos (letra+acento, número, espacio, - _ . , ( ) ")
              if (v && !/[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 _\-,\.\(\)"]/.test(v)) e.preventDefault();
            }}
            onPaste={(e) => {
              const t = (e.clipboardData || (window as any).clipboardData).getData("text");
              if (!isAddress(t)) e.preventDefault();
            }}
          />

          </Field>

          <Field label="Teléfono">
            <input
              name="telefono"
              value={form.telefono}
              onChange={onChange}
              inputMode="numeric"
              autoComplete="tel"
              pattern={REGEX.phone8.source}
              maxLength={8}
              onBeforeInput={(e: any) => {
                const v = e.data ?? "";
                if (v && !/^\d+$/.test(v)) e.preventDefault();
              }}
              onPaste={(e) => {
                const t = (e.clipboardData || (window as any).clipboardData).getData("text");
                if (!isPhone8(t)) e.preventDefault();
              }}
            />

          </Field>
        </div>

        {/* Separación de la sección de cuenta de usuario */}
        <h2 className={styles.sectionTitle}>Cuenta de Usuario</h2>

        <div className={styles.grid3}>
          <Field label="Correo electrónico">
            <input
              type="email"
              name="correo"
              value={usuario.username}
              onChange={onChange}
              inputMode="email"
              autoComplete="email"
              pattern={REGEX.emailRestricted.source}
              onBeforeInput={blocksEmailRestrictedInput}
              onPaste={(e) => {
                const t = (e.clipboardData || (window as any).clipboardData).getData("text");
                if (!isEmailRestricted(t)) e.preventDefault();
              }}
              onBlur={(e) => {
                if (!isEmailRestricted(e.currentTarget.value)) {
                  setError("Correo inválido: solo letras, números, ., _ y -, sin repeticiones consecutivas y con dominio válido.");
                }
              }}
            />

          </Field>

          <Field label="Contraseña">
            <input
              type="password"
              name="password"
              value={usuario.password}  // Usamos 'usuario.password' para la contraseña
              onChange={onChange}
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
            {/* Enviamos el valor real al backend */}
            <input type="hidden" name="categoria" value={categoria} />

            {/* Visible pero NO editable */}
            <input
              value={categoria}
              readOnly
              aria-readonly="true"
              tabIndex={-1}
            />

          </Field>
          <Field label="Notas">
            <input
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              inputMode="text"
              pattern={REGEX.notesAllowed.source}
              onBeforeInput={(e: any) => {
                blocksImmediateDuplicates(e);
                const v = e.data ?? "";
                if (v && !/[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9 _\-,\.\(\)"]/.test(v)) e.preventDefault();
              }}
              onPaste={(e) => {
                const t = (e.clipboardData || (window as any).clipboardData).getData("text");
                if (!isNotes(t)) e.preventDefault();
              }}
            />

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
