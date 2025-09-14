import { Routes, Route, Navigate } from "react-router-dom";

// Públicas
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegistroPage from "@/pages/RegistroPage";

// Zona Admin (layout + páginas hijas)
import { AdminRoute } from "@/features/auth/guards/AdminRoute";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminHomePage from "@/pages/admin/AdminHomePage";
import PacientesListPage from "@/pages/admin/pacientes/List";
import NuevaCitaAdminPage from "@/pages/admin/pacientes/NuevaCitaAdminPage";
import AgregarPacientePage from "@/pages/admin/pacientes/AgregarPacientePage";
import MedicosListPage from "@/pages/admin/medicos/MedicosListPage";
import AdminCitasList from "@/pages/admin/citas/AdminCitasList";;
import CitaDetallePage from "@/pages/admin/citas/CitaDetallePage";
import HistorialPage from "@/pages/admin/historial/HistorialPage";
import UsuariosListPage from "@/pages/admin/usuarios/List";
import CrearUsuarioPage from "@/pages/admin/usuarios/Crear";
import AgregarMedicoPage from "@/pages/admin/medicos/AgregarMedicoPage";
import BusquedaPorDpiPage from "@/pages/admin/historial/BusquedaPorDpiPage";
import RecetaListPage from "@/pages/admin/recetas/ListRecetas";
import RecetaCrearPage from "@/pages/admin/recetas/CrearRecetas";
import NuevaConsultaPage from "@/pages/admin/historial/NuevaConsultaPage";
import ListImagenes from "@/pages/admin/imagenologia/List";

// Protegidas generales
import { ProtectedRoute } from "@/features/auth/guards/ProtectedRoute";

// Paciente
import MisCitasPage from "@/pages/usuarios/MisCitasPage";
import NuevaCitaPage from "@/pages/usuarios/NuevaCitaPage";

// Guard simple para paciente
function PacienteRoute({ children }: { children: React.ReactNode }) {
  try {
    const raw = localStorage.getItem("user");
    const role = raw ? JSON.parse(raw).role : null;
    return role === "paciente" ? <>{children}</> : <Navigate to="/" replace />;
  } catch {
    return <Navigate to="/" replace />;
  }
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroPage />} />

      {/* Paciente */}
      <Route
        path="/citas"
        element={
          <ProtectedRoute>
            <PacienteRoute>
              <MisCitasPage />
            </PacienteRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/citas/nueva"
        element={
          <ProtectedRoute>
            <PacienteRoute>
              <NuevaCitaPage />
            </PacienteRoute>
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
        <Route path="citas" element={<AdminCitasList />} />
        <Route path="citas/:idPaciente/:idCita" element={<CitaDetallePage />} />
        <Route path="pacientes" element={<PacientesListPage />} />
        <Route path="pacientes/nuevo" element={<AgregarPacientePage />} />
        <Route path="medicos" element={<MedicosListPage />} />
        <Route path="historial" element={<HistorialPage />} />
        <Route path="usuarios" element={<UsuariosListPage />} />
        <Route path="usuarios/crear" element={<CrearUsuarioPage />} />
        <Route path="/admin/citas/nueva" element={<NuevaCitaAdminPage />} />
        <Route path="medicos/nuevo" element={<AgregarMedicoPage />} />
        <Route path="historial/nuevo" element={<BusquedaPorDpiPage />} />
        <Route path="recetas" element={<RecetaListPage/>} />
        <Route path="recetas/crear" element={<RecetaCrearPage/>} />
        <Route path="pacientes/:idPaciente/consultas/nueva" element={<NuevaConsultaPage />} />
        <Route path="imagenologia" element={<ListImagenes />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
