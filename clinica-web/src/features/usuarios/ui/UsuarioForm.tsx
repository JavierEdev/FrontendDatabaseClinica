import { useState } from "react";
import type { CrearUsuarioDTO, RolUsuario } from "../model/usuarios";

export default function UsuarioForm({
  onSubmit,
  initial,
}: {
  initial?: Partial<CrearUsuarioDTO>;
  onSubmit: (v: CrearUsuarioDTO) => void | Promise<void>;
}) {
  const [v, setV] = useState<CrearUsuarioDTO>({
    username: "",
    password: "",
    rol: "recepcionista",
    idMedico: null,
    idPaciente: null,
    ...initial,
  });

  function set<K extends keyof CrearUsuarioDTO>(k: K, val: CrearUsuarioDTO[K]) {
    setV(s => ({ ...s, [k]: val }));
  }

  function onChangeNumber(e: React.ChangeEvent<HTMLInputElement>, key: "idMedico"|"idPaciente") {
    const raw = e.target.value.trim();
    set(key, raw === "" ? null : Number(raw));
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(v); }} style={{ display: "grid", gap: 16, maxWidth: 720 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
        <Field label="Usuario">
          <input value={v.username} onChange={e=>set("username", e.target.value)} required />
        </Field>
        <Field label="Contraseña">
          <input type="password" value={v.password} onChange={e=>set("password", e.target.value)} required />
        </Field>

        <Field label="Rol">
          <select
            value={v.rol}
            onChange={e=>set("rol", e.target.value as RolUsuario)}
            required
          >
            <option value="administrador">Administrador</option>
            <option value="recepcionista">Recepcionista</option>
            <option value="medico">Médico</option>
          </select>
        </Field>

        <Field label="ID Médico (opcional)">
          <input
            inputMode="numeric"
            placeholder="Ej. 10"
            value={v.idMedico ?? ""}
            onChange={(e) => onChangeNumber(e, "idMedico")}
          />
        </Field>

        <Field label="ID Paciente (opcional)">
          <input
            inputMode="numeric"
            placeholder="Ej. 24"
            value={v.idPaciente ?? ""}
            onChange={(e) => onChangeNumber(e, "idPaciente")}
          />
        </Field>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button type="submit">Guardar</button>
      </div>
    </form>
  );
}

function Field({ label, children, colSpan }: { label: string; children: React.ReactNode; colSpan?: number }) {
  return (
    <div style={{ gridColumn: colSpan ? `span ${colSpan}` : "auto" }}>
      <label style={{ display: "block", marginBottom: 6, color: "#1e3a8a", fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}
