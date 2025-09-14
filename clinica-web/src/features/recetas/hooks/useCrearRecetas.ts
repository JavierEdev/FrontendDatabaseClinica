import { useState } from "react";
import { crear } from "../api/recetas";
import type { RecetaCreateDto } from "../model/tipos";

export function useCrearRecetas() {
  const [loading, setL] = useState(false);
  const [error, setE] = useState("");

  async function submit(body: RecetaCreateDto) {
    setE(""); setL(true);
    try {
      const res = await crear(body);
      return res as any;
    } catch (e) {
      setE((e as Error).message || "No se pudo crear la receta");
      throw e;
    } finally {
      setL(false);
    }
  }

  return { submit, loading, error };
}
