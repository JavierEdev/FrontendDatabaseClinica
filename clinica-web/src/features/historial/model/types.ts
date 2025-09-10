// Tipos base del historial

export type HistorialTipo = "CONSULTA" | "ANTECEDENTE" | "RECETA" | "IMAGEN";

// filtro del UI
export type HistFilter = "todos" | HistorialTipo;

// item normalizado que usa tu Layout (nota: 'fecha' y 'meta?')
export type HistorialItem = {
  id: number;
  fecha: string;            // ISO string
  tipo: HistorialTipo;
  titulo?: string;
  detalle?: string;
  meta?: any;               // <- para poder llevar el raw (idConsulta, etc.)
};
