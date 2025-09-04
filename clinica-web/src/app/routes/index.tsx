import { Routes, Route, Navigate } from "react-router-dom";

// Públicas
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegistroPage from "@/pages/RegistroPage";  // Importar el componente de registro

// Zona protegida “normal”
import Dashboard from "@/pages/Dashboard";
import { ProtectedRoute } from "@/features/auth/guards/ProtectedRoute";

// Zona Admin (layout + páginas hijas)
import { AdminRoute } from "@/features/auth/guards/AdminRoute";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminHomePage from "@/pages/admin/AdminHomePage";
import CitasPage from "@/pages/admin/citas/CitasPage";
import PacientesListPage from "@/pages/admin/pacientes/List";
import AgregarPacientePage from "@/pages/admin/pacientes/AgregarPacientePage";
import MedicosListPage from "@/pages/admin/medicos/MedicosListPage";

export function AppRoutes() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroPage />} /> {/* Ruta para registro paciente */}

      {/* Protegidas (usuario logueado) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin con rutas anidadas y sidebar fijo */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminHomePage />} />
        <Route path="citas" element={<CitasPage />} />
        <Route path="pacientes" element={<PacientesListPage />} />
        <Route path="pacientes/nuevo" element={<AgregarPacientePage />} />
        <Route path="medicos" element={<MedicosListPage />} />
        {/* agrega más rutas hijas aquí */}
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
