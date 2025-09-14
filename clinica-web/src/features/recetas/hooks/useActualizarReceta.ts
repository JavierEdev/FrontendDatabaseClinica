import { useState } from "react";
import { actualizar } from "../api/recetas";
import type { RecetaUpdateDto, RecetaVm } from "../model/tipos";

export function useActualizarReceta() {
  const [loading, setL] = useState(false);
  const [error, setE] = useState("");

  async function submit(id: number, dto: RecetaUpdateDto): Promise<RecetaVm> {
    setE(""); setL(true);
    try {
      return await actualizar(id, dto);
    } catch (e) {
      const msg = (e as Error).message || "No se pudo actualizar la receta";
      setE(msg);
      throw e;
    } finally {
      setL(false);
    }
  }
  return { submit, loading, error };
}
