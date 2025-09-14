export type RecetaVm = {
  idReceta: number;
  idConsulta: number;
  medicamento: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
};

export type RecetaItemDto = {
  medicamento: string;
  dosis: string;
  frecuencia: string;
  duracion: string;
};

export type RecetaCreateDto = {
  idConsulta: number;
  items: RecetaItemDto[];
};

export type ApiResponse<T> = { success: boolean; message: string; data: T };
