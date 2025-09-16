export type ReporteProductividadMedico = {
  IdMedico: number;
  NombreMedico: string;
  Especialidad: string | null;

  CitasProgramadas: number;
  CitasAtendidas: number;        
  CitasCanceladas: number;
  CitasNoAsistidas: number;

  PacientesAtendidos: number;
  ProcedimientosRealizados: number;
  IngresosGenerados: number;      
  ProductividadCitasDia: number;  

  TasaCancelacionPct?: number;    
  TasaNoShowPct?: number;
  TasaAtencionPct?: number;
};

export type IngresoServicioItem = {
  procedimiento: string;
  cantidad: number;
  total: number; // Q
};
