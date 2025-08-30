import { useState } from "react";
import type { NuevoPaciente } from "../model/pacientes";

export type PacienteFormValue = NuevoPaciente & {
  archivo?: File | null;
  categoria?: string;
  notas?: string;
};

export default function PacienteForm({
  onSubmit,
  initial,
}: {
  initial?: Partial<PacienteFormValue>;
  onSubmit: (v: PacienteFormValue) => void | Promise<void>;
}) {
  const [v, setV] = useState<PacienteFormValue>({
    nombres: "", apellidos: "", dpi: "", fechaNacimiento: "",
    sexo: "", direccion: "", telefono: "", correo: "", estadoCivil: "",
    archivo: null, categoria: "Identificación", notas: "",
    ...initial,
  });

  function set<K extends keyof PacienteFormValue>(k: K, val: PacienteFormValue[K]) {
    setV(s => ({ ...s, [k]: val }));
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(v); }} style={{ display: "grid", gap: 16, maxWidth: 920 }}>
      {/* …inputs similares a los que ya te pasé… */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        <Field label="DPI"><input value={v.dpi} onChange={e=>set("dpi", e.target.value)} required /></Field>
        <Field label="Nombre"><input value={v.nombres} onChange={e=>set("nombres", e.target.value)} required /></Field>
        <Field label="Apellido"><input value={v.apellidos} onChange={e=>set("apellidos", e.target.value)} required /></Field>
        <Field label="Fecha de Nacimiento"><input type="date" value={v.fechaNacimiento} onChange={e=>set("fechaNacimiento", e.target.value)} required /></Field>
        <Field label="Sexo"><input value={v.sexo} onChange={e=>set("sexo", e.target.value)} /></Field>
        <Field label="Estado civil"><input value={v.estadoCivil} onChange={e=>set("estadoCivil", e.target.value)} /></Field>
        <Field label="Dirección" colSpan={2}><input value={v.direccion} onChange={e=>set("direccion", e.target.value)} /></Field>
        <Field label="Teléfono"><input value={v.telefono} onChange={e=>set("telefono", e.target.value)} /></Field>
        <Field label="Correo"><input type="email" value={v.correo} onChange={e=>set("correo", e.target.value)} /></Field>
      </div>

      <fieldset style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
        <legend style={{ padding: "0 6px", color: "#1e40af", fontWeight: 600 }}>
          Documento (requerido)
        </legend>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
          <Field label="Archivo">
            <input type="file" required onChange={(e)=>set("archivo", e.target.files?.[0] ?? null)} />
          </Field>
          <Field label="Categoria">
            <input value={v.categoria} onChange={(e)=>set("categoria", e.target.value)} required />
          </Field>
          <Field label="Notas">
            <input value={v.notas} onChange={(e)=>set("notas", e.target.value)} />
          </Field>
        </div>
      </fieldset>

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
