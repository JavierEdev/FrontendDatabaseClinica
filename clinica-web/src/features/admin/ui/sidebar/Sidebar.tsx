// src/features/admin/ui/Sidebar/Sidebar.tsx
import { NavLink, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";
import { useState } from "react";
import { logout } from "@/features/auth/api/api";

type SubItem = { label: string; to?: string; disabled?: boolean };
type Group = { label: string; icon?: string; items: SubItem[] };

const MAIN = [
  { label: "Dashboard", to: "/admin", icon: "🏠" },
  { label: "Citas", to: "/admin/citas", icon: "📋" },
];

const GROUPS: Group[] = [
  {
    label: "Pacientes",
    icon: "👤",
    items: [
      { label: "Lista de Pacientes", to: "/admin/pacientes" },
      { label: "Agregar Pacientes", to: "/admin/pacientes/nuevo" },
    ],
  },
  {
    label: "Historial",
    icon: "🗂️",
    items: [
      { label: "Historial Médico", to: "/admin/historial" },
      { label: "Agregar Consulta Médica", to: "/admin/historial/nuevo" },
    ],
  },
  {
    label: "Imagenologia",
    icon: "🖼️",
    items: [
      { label: "Historial Imagenes", to: "/admin/imagenologia" }
    ],
  },
  {
    label: "Recetas y Medicamentos",
    icon: "💊📋",
    items: [
      { label: "Listado de recetas", to: "/admin/recetas" }, 
      { label: "Crear receta", to: "/admin/recetas/crear" }, 
    ],
  },
  {
    label: "Médicos",
    icon: "🩺",
    items: [
      { label: "Lista de médicos", to: "/admin/medicos/" },
      { label: "Agregar Medicos", to: "/admin/medicos/nuevo" },
      { label: "Reporteria", to: "/admin/medicos/reportes" },
    ],
  },
  {
    label: "Pagos",
    icon: "💳",
    items: [
      { label: "Procesar Pago", to: "/admin/pagos/" }
    ],
  },
  {
    label: "Administrador",
    icon: "👨‍💼",
    items: [
      { label: "Lista de usuarios", to: "/admin/usuarios" },
      { label: "Crear usuarios", to: "/admin/usuarios/crear"},
    ],
  },
];

export default function Sidebar() {
  const { pathname } = useLocation();

  // abre el grupo que contiene la ruta actual
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    GROUPS.forEach((g) => {
      map[g.label] = g.items.some((i) => i.to && pathname.startsWith(i.to));
    });
    return map;
  });

  function toggle(label: string) {
    setOpen((s) => ({ ...s, [label]: !s[label] }));
  }

  return (
    <aside className={styles.sidebar} aria-label="Admin sidebar">
      <div className={styles.header}>
        <div className={styles.logoCircle}>◑</div>
        <div className={styles.brand}>Clínica</div>
      </div>

      <div className={styles.sectionTitle}>MAIN</div>

      <nav className={styles.nav} aria-label="Main">
        {MAIN.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
            end
          >
            <span className={styles.icon}>{it.icon}</span>
            {it.label}
          </NavLink>
        ))}
      </nav>

      <nav className={styles.navGroups} aria-label="Sections">
        {GROUPS.map((g) => (
          <div key={g.label} className={styles.group}>
            <button
              className={styles.groupBtn}
              onClick={() => toggle(g.label)}
              aria-expanded={open[g.label] ? "true" : "false"}
              aria-controls={`group-${g.label}`}
            >
              <span className={styles.icon}>{g.icon ?? "•"}</span>
              <span className={styles.groupLabel}>{g.label}</span>
              <span
                className={`${styles.chev} ${open[g.label] ? styles.chevOpen : ""}`}
                aria-hidden="true"
              >
                ▾
              </span>
            </button>

            {open[g.label] && (
              <ul id={`group-${g.label}`} className={styles.subnav} role="list">
                {g.items.map((it) => {
                  const isDisabled = !!it.disabled || !it.to;
                  const isActive = it.to ? pathname.startsWith(it.to) : false;

                  return (
                    <li key={it.label} className={styles.subItemRow}>
                      {/* línea vertical del árbol */}
                      <span className={styles.treeLine} aria-hidden="true" />
                      {isDisabled ? (
                        <span
                          className={`${styles.sublink} ${styles.sublinkDisabled}`}
                          aria-disabled="true"
                          title="Próximamente"
                        >
                          {it.label}
                        </span>
                      ) : (
                        <NavLink
                          to={it.to!}
                          className={() =>
                            isActive
                              ? `${styles.sublink} ${styles.activeSub}`
                              : styles.sublink
                          }
                          end
                        >
                          {it.label}
                        </NavLink>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <button className={styles.helpBtn} type="button">❓ Help</button>
        <button className={styles.logoutBtn} type="button" onClick={logout}>
          ⎋ Logout Account
        </button>
      </div>
    </aside>
  );
}
