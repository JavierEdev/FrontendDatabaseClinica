// Estructura que devuelve tu endpoint /api/medicos/{id}/disponibilidad
export interface DisponibilidadDia {
  /** YYYY-MM-DD */
  fecha: string;
  /** Horas en formato HH:mm */
  horasDisponibles: string[];
}
