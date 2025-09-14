import { useState } from "react";
import type { RecetaCreateDto } from "../model/tipos";
import styles from "@/pages/admin/recetas/CreateReceta.module.css";

export default function RecetaForm({
  initialIdConsulta,
  onSubmit,
}: {
  initialIdConsulta?: number;
  onSubmit: (v: RecetaCreateDto) => void | Promise<void>;
}) {
  const [idConsultaTxt, setIdConsultaTxt] = useState<string>(
    initialIdConsulta != null ? String(initialIdConsulta) : ""
  );

  const [medicamento, setMedicamento] = useState("");
  const [dosis, setDosis] = useState("");
  const [frecuencia, setFrecuencia] = useState("");
  const [duracion, setDuracion] = useState("");

  function onIdKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const allowed = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Home", "End", "Tab"];
    if (allowed.includes(e.key)) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const idConsulta = Number(idConsultaTxt || 0);
    if (!idConsulta) return;

    const payload: RecetaCreateDto = {
      idConsulta,
      items: [{ medicamento, dosis, frecuencia, duracion }], 
    };
    onSubmit(payload);
  }

  return (
    <form id="receta-form" onSubmit={submit} className={styles.form}>

      <div className={styles.field}>
        <label className={styles.label}>ID Consulta</label>
        <input
          className={styles.input}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Ej. 123"
          value={idConsultaTxt}
          onKeyDown={onIdKeyDown}
          onChange={(e) => setIdConsultaTxt(e.target.value)}
          required
        />
      </div>

      <div className={styles.rowGrid}>
        <div className={styles.field}>
          <label className={styles.label}>Medicamento</label>
          <input
            className={styles.input}
            placeholder="Ej. Ibuprofeno 400mg"
            value={medicamento}
            onChange={(e) => setMedicamento(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Dosis</label>
          <input
            className={styles.input}
            placeholder="Ej. 1 tableta"
            value={dosis}
            onChange={(e) => setDosis(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Frecuencia</label>
          <input
            className={styles.input}
            placeholder="Ej. cada 8 horas"
            value={frecuencia}
            onChange={(e) => setFrecuencia(e.target.value)}
            required
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Duración</label>
          <input
            className={styles.input}
            placeholder="EJ. 5 días"
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
            required
          />
        </div>
      </div>
    </form>
  );
}
