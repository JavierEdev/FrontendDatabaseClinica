import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Crear.module.css";
import { useCrearUsuario } from "@/features/usuarios/hooks/useCrearUsuario";
import type { RolUsuario } from "@/features/usuarios/model/usuarios";

type RolOrEmpty = RolUsuario | "";

export default function CrearUsuarioPage() {
  const nav = useNavigate();
  const { crear, loading, error } = useCrearUsuario();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<RolOrEmpty>("");
  const [okMsg, setOkMsg] = useState("");
  const [rolError, setRolError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRolError("");

    if (!username.trim() || !password.trim()) return;
    if (rol === "") {
      setRolError("Seleccione un rol");
      return;
    }

    try {
      await crear({ username, password, rol });
      setOkMsg("Usuario creado.");
      setTimeout(() => nav("/admin/usuarios", { replace: true }), 800);
    } catch {
      
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.icon}>👤</div>
        <div>
          <h1 className={styles.title}>Crear Usuario</h1>
          <div className={styles.subtitle}>Complete los datos del usuario</div>
        </div>
      </header>

      <form className={styles.card} onSubmit={onSubmit} noValidate>
        <h2 className={styles.sectionTitle}>Datos del usuario</h2>

        <div className={styles.grid2}>
          <Field label="Usuario">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Ej. user123"
            />
          </Field>

          <Field label="Contraseña">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </Field>

          <Field label="Rol">
            <div>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value as RolOrEmpty)}
                required
              >
                <option value="" disabled>Seleccione rol…</option>
                <option value="administrador">Administrador</option>
                <option value="recepcionista">Recepcionista</option>
                <option value="medico">Médico</option>
              </select>
              {rolError && (
                <div className={styles.alertError} style={{ marginTop: 6 }}>
                  {rolError}
                </div>
              )}
            </div>
          </Field>
        </div>

        {error && <div className={styles.alertError}>{error}</div>}
        {okMsg && <div className={styles.alertOk}>{okMsg}</div>}

        <div className={styles.actions}>
          <button className={styles.btnPrimary} disabled={loading || rol === ""}>
            {loading ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            className={styles.btnGhost}
            onClick={() => nav("/admin/usuarios")}
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
