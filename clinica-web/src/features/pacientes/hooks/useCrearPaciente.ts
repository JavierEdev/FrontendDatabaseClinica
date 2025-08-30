import { useState } from "react";
import { crearPaciente, subirDocumentoPaciente } from "../api/pacientes";
import type { NuevoPaciente } from "../model/pacientes";

export function useCrearPaciente() {
  const [loading, setL] = useState(false);
  const [error, setE] = useState<string>("");

  async function crear(body: NuevoPaciente, archivo: File, categoria: string, notas?: string) {
    setE(""); setL(true);
    try {
      const { id } = await crearPaciente(body);
      await subirDocumentoPaciente(id, archivo, categoria, notas);
      return id;
    } catch (e) {
      setE((e as Error).message);
      throw e;
    } finally {
      setL(false);
    }
  }
  return { crear, loading, error };
}
