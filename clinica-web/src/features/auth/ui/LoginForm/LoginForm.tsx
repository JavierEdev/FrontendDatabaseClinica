import { useState } from "react";
import { login } from "../../api/api";
import styles from "./LoginForm.module.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { AppRole } from "@/features/auth/model/roles";

function safeNextForRole(next: string | null, role: AppRole) {
  if (!next) return null;
  if (next.startsWith("/admin") && role !== "admin") return null;
  return next.startsWith("/") ? next : null;
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
      const data = await login(username, password); // Session con role normalizado: "admin" | "user" | "medico"
      // console.log("[LOGIN] session:", data);

      const isAdmin = data.role === "admin";
      const defaultNext = isAdmin ? "/admin" : "/dashboard";

      // admin: solo aceptamos next si apunta a /admin*
      // no-admin: aceptamos cualquier next interno válido
      const target = isAdmin
        ? (next && next.startsWith("/admin") ? next : defaultNext)
        : (safeNextForRole(next, data.role) || defaultNext);

      // console.log("[LOGIN] navigating to:", target);
      nav(target, { replace: true });
    } catch (err) {
      // console.error("[LOGIN] error:", err);
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
          to={next && next !== "/" ? `/registro?next=${encodeURIComponent(next)}` : "/registro"}
        >
          Regístrate
        </Link>
      </div>
    </form>
  );
}
