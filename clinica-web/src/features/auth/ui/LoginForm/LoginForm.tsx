import { useState } from "react";
import { login } from "../../api/api";
import styles from "./LoginForm.module.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { AppRole } from "@/features/auth/model/roles";

/** Prefijos de rutas permitidos por rol */
const allowedByRole: Record<AppRole, string[]> = {
  admin: ["/admin"],
  recepcionista: ["/admin"], // añade "/recepcion" si tienes esa sección
  medico: ["/admin"],
  paciente: ["/citas", "/usuarios"], // paciente puede ir a /citas o /usuarios
};

const defaultNextByRole: Record<AppRole, string> = {
  admin: "/admin",
  recepcionista: "/admin",
  medico: "/admin",
  paciente: "/citas",
};

function safeNextForRole(next: string | null, role: AppRole) {
  if (!next || !next.startsWith("/")) return null;
  const allowed = allowedByRole[role];
  return allowed.some((p) => next.startsWith(p)) ? next : null;
}

export default function LoginForm() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [loading, setL] = useState(false);
  const [error, setE] = useState("");

  const nav = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const next = params.get("next");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setE("");
    setL(true);
    try {
      const data = await login(username, password);

      const defaultNext = defaultNextByRole[data.role];
      const target = safeNextForRole(next, data.role) || defaultNext;

      nav(target, { replace: true });
    } catch (err) {
      setE((err as Error).message || "Credenciales inválidas");
    } finally {
      setL(false);
    }
  }

  return (
    <form className={styles.card} onSubmit={onSubmit} noValidate>
      <h2 style={{ marginTop: 0 }}>Bienvenido</h2>

      <label className={styles.field} htmlFor="user">
        Usuario
        <input
          id="user"
          className={styles.input}
          value={username}
          onChange={(e) => setU(e.target.value)}
          autoComplete="username"
          required
        />
      </label>

      <label className={styles.field} htmlFor="pass">
        Contraseña
        <input
          id="pass"
          className={styles.input}
          type="password"
          value={password}
          onChange={(e) => setP(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      {error && <div className={styles.error}>{error}</div>}

      <button className={styles.btn} disabled={loading || !username || !password}>
        {loading ? "Entrando..." : "Inicio de sesión"}
      </button>

      <div className={styles.helperRow}>
        <span>¿No tienes cuenta?</span>
        <Link
          className={styles.link}
          to={
            next && next !== "/"
              ? `/registro?next=${encodeURIComponent(next)}`
              : "/registro"
          }
        >
          Regístrate
        </Link>
      </div>
    </form>
  );
}
