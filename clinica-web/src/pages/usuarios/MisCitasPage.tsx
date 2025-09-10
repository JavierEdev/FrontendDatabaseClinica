// src/pages/MisCitasPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerIdPacientePorUsuario } from "@/features/usuarios/api/usuarios";
import { fetchCitasPorPaciente } from "@/features/citas/api/citas";
import type { CitaPaciente as Cita } from "@/features/citas/model/citas";
import { logout } from "@/features/auth/api/api";
import styles from "./MisCitasPage.module.css";

type Filtro = "TODAS" | "CONFIRMADAS" | "CANCELADAS" | "PENDIENTES";

export default function MisCitasPage() {
  const nav = useNavigate();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [filtro, setFiltro] = useState<Filtro>("TODAS");

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      setError("");
      try {
        const raw = localStorage.getItem("user");
        if (!raw) throw new Error("No hay sesión de usuario");
        const user = JSON.parse(raw);
        const idUsuario = Number(user?.id);
        if (!idUsuario) throw new Error("Usuario inválido");

        const idPaciente = await obtenerIdPacientePorUsuario(idUsuario, ac.signal);
        const items = await fetchCitasPorPaciente(idPaciente, ac.signal);
        setCitas(items);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message || "Error al cargar Mis Citas");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, []);

  const citasFiltradas = useMemo(() => {
    switch (filtro) {
      case "CONFIRMADAS":
        return citas.filter((c) => c.estado === "CONFIRMADA");
      case "CANCELADAS":
        return citas.filter((c) => c.estado === "CANCELADA");
      case "PENDIENTES":
        return citas.filter((c) => c.estado === "PENDIENTE");
      default:
        return citas;
    }
  }, [citas, filtro]);

  function formatFecha(fechaISO: string) {
    try {
      const d = new Date(fechaISO);
      return d.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return fechaISO;
    }
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden>➕</span>
          <span className={styles.brandText}>Clínica</span>
        </div>
        <div className={styles.headRight}>
          <h1 className={styles.title}>Mis Citas</h1>
          <p className={styles.subtitle}>Consulta y gestiona tus citas médicas</p>
        </div>
        <button className={styles.primary} onClick={() => nav("/citas/nueva")}>
          Nueva cita
        </button>
      </header>

      <div className={styles.toolbar}>
        <label className={styles.filterLabel}>
          <span>Filtrar: </span>
          <select
            className={styles.select}
            value={filtro}
            onChange={(e) => setFiltro(e.target.value as Filtro)}
          >
            <option value="TODAS">Todas</option>
            <option value="CONFIRMADAS">Confirmadas</option>
            <option value="PENDIENTES">Pendientes</option>
            <option value="CANCELADAS">Canceladas</option>
          </select>
        </label>

        {/* Botón de logout a la derecha */}
        <button
          type="button"
          className={styles.btnOutline}
          onClick={logout}
          style={{ marginLeft: "auto" }}
          title="Cerrar sesión"
        >
          Cerrar sesión
        </button>
      </div>

      {loading && <div className={styles.skeleton}>Cargando citas…</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && (
        <div className={styles.grid}>
          {citasFiltradas.map((cita) => (
            <article key={cita.id} className={styles.card}>
              <div className={styles.cardBody}>
                <div className={styles.avatar} aria-hidden>👩‍⚕️</div>
                <div className={styles.info}>
                  <div className={styles.nombre}>Médico #{cita.idMedico}</div>
                  <div className={styles.fecha}>{formatFecha(cita.fecha)}</div>
                  <div
                    className={
                      cita.estado === "CONFIRMADA"
                        ? styles.estadoOk
                        : cita.estado === "CANCELADA"
                        ? styles.estadoCancel
                        : styles.estadoPend
                    }
                  >
                    {cita.estado === "CONFIRMADA"
                      ? "Confirmada"
                      : cita.estado === "CANCELADA"
                      ? "Cancelada"
                      : "Pendiente"}
                  </div>
                </div>
                <div className={styles.actions}>
                  <button
                    className={styles.btnDanger}
                    onClick={() => nav(`/citas/${cita.id}/cancelar`)}
                    disabled={cita.estado === "CANCELADA"}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </article>
          ))}

          {!citasFiltradas.length && (
            <div className={styles.empty}>
              No hay citas para el filtro seleccionado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
