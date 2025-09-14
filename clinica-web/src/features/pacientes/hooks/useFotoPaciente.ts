import { useEffect, useRef, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

function authHeaders(): HeadersInit {
  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("token") ||
    "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getJSON(url: string): Promise<any> {
  const r = await fetch(url, { headers: { Accept: "application/json", ...authHeaders() } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  return Array.isArray(j) ? j : j?.items ?? j?.data ?? j;
}

type Doc = {
  idImagen?: number;
  categoria?: string;
  contentType?: string;
  fechaSubida?: string;
  nombreArchivoOriginal?: string;
};

type CacheEntry = { url: string; exp: number };

const mem = new Map<string, CacheEntry>();

export function useFotoPaciente(idPaciente: number | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setL] = useState(false);
  const [error, setE] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!idPaciente) { setUrl(null); return; }

    let alive = true;
    const cacheKey = `foto:${idPaciente}`;

    (async () => {
      try {
        setL(true); setE(null);

        const cached = mem.get(cacheKey);
        const now = Date.now();
        if (cached && cached.exp > now) {
          if (alive) setUrl(cached.url);
          setL(false);
          return;
        }

        // documentos del paciente
        const docs: Doc[] = await getJSON(`${API_BASE}/api/Pacientes/${idPaciente}/documentos?page=1&pageSize=50`);
        if (!Array.isArray(docs) || docs.length === 0) { if (alive) setUrl(null); setL(false); return; }

        const pickScore = (d: Doc) => {
          const ct = (d.contentType ?? "").toLowerCase();
          const cat = (d.categoria ?? "").toLowerCase();
          let s = 0;
          if (ct.startsWith("image/")) s += 10;
          if (cat.includes("foto") || cat.includes("perfil")) s += 5;
          const t = Date.parse(d.fechaSubida ?? "") || 0;
          s += Math.floor(t / 1e6);
          return s;
        };
        const best = [...docs].sort((a, b) => pickScore(b) - pickScore(a))[0];
        const idImagen = best?.idImagen;
        if (!idImagen) { if (alive) setUrl(null); setL(false); return; }

        const down = await getJSON(`${API_BASE}/api/Pacientes/${idPaciente}/documentos/${idImagen}/download?ttlSeconds=300`);
        const signedUrl: string | undefined = down?.url || down?.Url || down?.URL;

        if (!signedUrl) { if (alive) setUrl(null); setL(false); return; }

        mem.set(cacheKey, { url: signedUrl, exp: now + 290_000 });
        if (alive) setUrl(signedUrl);
      } catch (e: any) {
        if (alive) { setE(e?.message ?? "No se pudo cargar la imagen"); setUrl(null); }
      } finally {
        if (alive) setL(false);
      }
    })();

    return () => {
      alive = false;
      abortRef.current?.abort();
    };
  }, [idPaciente]);

  return { url, loading, error };
}
