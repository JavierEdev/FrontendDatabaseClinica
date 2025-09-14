import styles from "./CreateReceta.module.css";
import RecetaForm from "@/features/recetas/ui/RecetaForm";
import { useCrearRecetas } from "@/features/recetas/hooks/useCrearRecetas";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RecetaCrearPage() {
  const nav = useNavigate();
  const { submit, loading, error } = useCrearRecetas();
  const [ok, setOk] = useState("");

  async function onSubmit(v: { idConsulta: number; items: any[] }) {
    try {
      const r: any = await submit(v);
      setOk(`¡Creado! Total: ${r?.data?.total ?? "?"}`);
      setTimeout(()=> nav("/admin/recetas", { replace:true }), 900);
    } catch {}
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.icon}>💊</div>
        <div>
          <h1 className={styles.title}>Crear Receta</h1>
          <div className={styles.subtitle}>Ingrese el ID de la consulta y los medicamentos</div>
        </div>
      </header>

      <div className={styles.card}>
        <RecetaForm onSubmit={onSubmit} />

        {error && <div className={styles.alertError}>{error}</div>}
        {ok && <div className={styles.alertOk}>{ok}</div>}

        <div className={styles.actions} style={{ marginTop: 12 }}>
          <button className={styles.btnPrimary} form="receta-form" type="submit" disabled={loading}>
            {loading ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" className={styles.btnGhost} onClick={()=>nav("/admin/recetas")} disabled={loading}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
