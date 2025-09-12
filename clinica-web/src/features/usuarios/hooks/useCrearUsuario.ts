import { useState } from "react";
import { crearUsuario } from "../api/usuarios";
import type { CrearUsuarioDTO } from "../model/usuarios";

export function useCrearUsuario() {
  const [loading, setL] = useState(false);
  const [error, setE] = useState<string>("");

  async function crear(body: CrearUsuarioDTO) {
    setE(""); setL(true);
    try {
      await crearUsuario(body); // 201 sin body
    } catch (e) {
      setE((e as Error).message || "No se pudo crear el usuario");
      throw e;
    } finally {
      setL(false);
    }
  }

  return { crear, loading, error };
}
