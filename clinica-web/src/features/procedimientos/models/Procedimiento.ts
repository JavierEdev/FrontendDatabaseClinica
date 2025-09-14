export type CatalogoProcedimiento = {
  idProcedimientoCatalogo: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precioBase: number | null;
  duracionMin: number | null;
  activo: boolean;
};
