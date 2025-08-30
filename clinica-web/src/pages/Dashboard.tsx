import { useEffect, useState } from "react";
import { api, logout } from "../features/auth/api/api";
import type { MeResponse } from "../features/auth/model/auth";

export default function Dashboard() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const m = await api<MeResponse>("/api/auth/me", { auth: true });
      setMe(m);
      try {
        const list = await api<any[]>("/api/usuarios", { auth: true });
        setUsers(list);
      } catch {
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Dashboard</h2>
      <pre>{JSON.stringify(me, null, 2)}</pre>

      <h3>Usuarios (si tu rol lo permite)</h3>
      <ul>{users.map((u) => <li key={u.idUsuario}>{u.nombreUsuario} — {u.rol}</li>)}</ul>

      <button onClick={logout}>Salir</button>
    </div>
  );
}
