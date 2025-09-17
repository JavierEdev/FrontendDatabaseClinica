import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import Papa from "papaparse";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { DashboardApi } from "../api/dashboard";
import { Kpis, SerieCitas, SerieIngresos, TopProc, CitasEspecialidad, RecetaRow, CitaReciente } from "../model/dashboard";

const toYmd = (d = new Date()) => format(d, "yyyy-MM-dd");
const rangoHoy = () => { const y = toYmd(); return {desde:y, hasta:y}; };
const rangoSemana = () => {
  const d = new Date(); const diff = (d.getDay()+6)%7; const ini = new Date(d); ini.setDate(d.getDate()-diff);
  const fin = new Date(ini); fin.setDate(ini.getDate()+6);
  return { desde: toYmd(ini), hasta: toYmd(fin) };
};
const rangoMes = () => {
  const now = new Date();
  const ini = new Date(now.getFullYear(), now.getMonth(), 1);
  const fin = new Date(now.getFullYear(), now.getMonth()+1, 0);
  return { desde: toYmd(ini), hasta: toYmd(fin) };
};
// Quincena actual: días 1–15 o 16–fin según hoy
const rangoQuincena = () => {
  const now = new Date();
  if (now.getDate() <= 15) {
    const ini = new Date(now.getFullYear(), now.getMonth(), 1);
    const fin = new Date(now.getFullYear(), now.getMonth(), 15);
    return { desde: toYmd(ini), hasta: toYmd(fin) };
  } else {
    const ini = new Date(now.getFullYear(), now.getMonth(), 16);
    const fin = new Date(now.getFullYear(), now.getMonth()+1, 0);
    return { desde: toYmd(ini), hasta: toYmd(fin) };
  }
};

export function useDashboard() {
  const [desde, setDesde] = useState(rangoMes().desde);
  const [hasta, setHasta] = useState(rangoMes().hasta);
  const [especialidad, setEspecialidad] = useState<string|undefined>(undefined);

  const [espOptions, setEspOptions] = useState<string[]>([]);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [serieCitas, setSerieCitas] = useState<SerieCitas[]>([]);
  const [ingresosMes, setIngresosMes] = useState<SerieIngresos[]>([]);
  const [topProc, setTopProc] = useState<TopProc[]>([]);
  const [citasEsp, setCitasEsp] = useState<CitasEspecialidad[]>([]);
  const [recetas, setRecetas] = useState<RecetaRow[]>([]);
  const [citasRec, setCitasRec] = useState<CitaReciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    DashboardApi.especialidades().then(setEspOptions).catch(()=>{});
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true); setErr(null);
        const [k, s1, s2, t1, e1, r1, cr] = await Promise.all([
          DashboardApi.kpis(desde, hasta, especialidad),
          DashboardApi.serieCitas(desde, hasta, especialidad),
          DashboardApi.ingresosMensual(desde, hasta, especialidad),
          DashboardApi.topProcedimientos(desde, hasta, especialidad, 5), // TOP 5
          DashboardApi.citasPorEspecialidad(desde, hasta, especialidad),
          DashboardApi.recetas(desde, hasta, especialidad, 5),         // TOP 5
          DashboardApi.citasRecientes(desde, hasta, especialidad, 5),  // TOP 5
        ]);
        if (!alive) return;
        setKpis(k); setSerieCitas(s1); setIngresosMes(s2); setTopProc(t1);
        setCitasEsp(e1); setRecetas(r1); setCitasRec(cr);
      } catch (e: any) {
        if (!alive) return; setErr(e?.message ?? "No se pudo cargar el dashboard");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [desde, hasta, especialidad]);

  const presets = {
    hoy: () => { const r = rangoHoy(); setDesde(r.desde); setHasta(r.hasta); },
    semana: () => { const r = rangoSemana(); setDesde(r.desde); setHasta(r.hasta); },
    quincena: () => { const r = rangoQuincena(); setDesde(r.desde); setHasta(r.hasta); },
    mes: () => { const r = rangoMes(); setDesde(r.desde); setHasta(r.hasta); },
  };

  const exportCSV = (name: string, rows: any[]) => {
    const csv = Papa.unparse(rows || []);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, `${name}.csv`);
  };

  const exportPDF = async (fileName = "dashboard.pdf") => {
    if (!pdfRef.current) return;
    const canvas = await html2canvas(pdfRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageW / canvas.width, pageH / canvas.height);
    const imgW = canvas.width * ratio;
    const imgH = canvas.height * ratio;
    pdf.addImage(imgData, "PNG", (pageW - imgW)/2, 20, imgW, imgH);
    pdf.save(fileName);
  };

  return {
    // state
    desde, hasta, especialidad, kpis, serieCitas, ingresosMes, topProc, citasEsp, recetas, citasRec,
    espOptions, loading, err, pdfRef,
    // setters
    setDesde, setHasta, setEspecialidad,
    // helpers
    presets, exportCSV, exportPDF,
  };
}
