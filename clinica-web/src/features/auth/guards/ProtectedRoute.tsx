import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { getToken } from "../lib/storage";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = getToken();
  const loc = useLocation();
  if (token) return <>{children}</>;
  const next = encodeURIComponent(loc.pathname + loc.search);
  return <Navigate to={`/login?next=${next}`} replace />;
}
