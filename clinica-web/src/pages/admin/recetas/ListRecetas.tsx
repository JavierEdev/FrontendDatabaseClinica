import { Link } from "react-router-dom";
import styles from "./ListReceta.module.css";
import RecetasTable from "@/features/recetas/ui/RecetasTable";
import RecetaModal from "@/features/recetas/ui/RecetaModal";
import { useListarRecetas, useFiltroYPagina } from "@/features/recetas/hooks/useListarRecetas";
import { useState } from "react";
import { pdfUrl } from "@/features/recetas/api/recetas";

export default function RecetasListPage() {
  const { data, loading, error, refetch } = useListarRecetas();
  const [openId, setOpenId] = useState<number|undefined>();
  const f = useFiltroYPagina(data, 10);

  return (
    <div className={styles.wrap}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Recetas y Medicamentos</h1>
            <p className={styles.subtitle}>Listado general de recetas</p>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.searchBox}>
              <input
                placeholder="Buscar (medicamento, dosis, consulta)…"
                value={f.q}
                onChange={(e)=>f.setQ(e.target.value)}
              />
              {f.q && <button className={styles.clearBtn} onClick={()=>f.setQ("")}>×</button>}
            </div>
            <Link to="/admin/recetas/crear" className={styles.primaryBtn}>+ Crear recetas</Link>
          </div>
        </div>

        <RecetasTable
          rows={f.items}
          loading={loading}
          error={error}
          onView={setOpenId}
          onPdf={(id)=>window.open(pdfUrl(id), "_blank")}
        />

        <div className={styles.footer}>
          <div className={styles.rows}>
            <label>Filas:&nbsp;
              <select value={f.pageSize} onChange={(e)=>f.setPageSize(parseInt(e.target.value,10))}>
                {[10,20,50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
          <div className={styles.range}>
            {f.total ? (<>{f.from}-{f.to} de {f.total}</>) : "—"}
          </div>
          <div className={styles.pager}>
            <button onClick={()=>f.setPage(p=>Math.max(1,p-1))} disabled={loading || f.from<=1}>← Anterior</button>
            <span>Página {Math.ceil(f.from / f.pageSize) || 1}</span>
            <button onClick={()=>f.setPage(p=>p+1)} disabled={loading || f.to>=f.total}>Siguiente →</button>
          </div>
        </div>

        {!loading && error && (
          <div className={styles.error} style={{ marginTop: 12 }}>
            {error} &nbsp;<button onClick={refetch}>Reintentar</button>
          </div>
        )}
      </div>

      <RecetaModal id={openId} open={!!openId} onClose={()=>setOpenId(undefined)} />
    </div>
  );
}
