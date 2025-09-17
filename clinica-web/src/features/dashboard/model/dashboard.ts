export type Kpis = {
  rango: { desde: string; hasta: string; especialidad?: string | null };
  citas: { confirmadas: number; reprogramadas: number; canceladas: number; programadas: number };
  consultas: { total: number; conProcedimientos: number };
  pacientesAtendidos: number;
  ingresos: { cobradosQ: number; pendientesQ: number };
};

export type SerieCitas = { fecha: string; confirmada: number; reprogramada: number; cancelada: number };
export type SerieIngresos = { mes: string; cobrados: number; pendientes: number };
export type TopProc = { procedimiento: string; cantidad: number; total: number };
export type CitasEspecialidad = { especialidad: string; cantidad: number };

export type RecetaRow = {
  id_receta: number; id_consulta: number; medicamento: string; dosis: string; frecuencia: string; duracion: string; fecha: string;
};
export type CitaReciente = {
  id: number; fecha: string; estado: string; id_paciente: number; id_medico: number; medico?: string; especialidad?: string;
};
