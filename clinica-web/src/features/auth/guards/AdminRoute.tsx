import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

function isAdmin() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.role === "admin"; // rol normalizado por tu login()
  } catch {
    return false;
  }
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("accessToken");
  const loc = useLocation();

  if (!token) {
    const next = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (!isAdmin()) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}
