import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Páginas públicas
import { Login } from "./pages/Login/Login";

// Layout
import { MainLayout } from "./components/Layout/MainLayout";

// Páginas principales
import { Home } from "./pages/Home/Home";
import { Profile } from "./pages/Profile/Profile";
import { NoticeBoard } from "./pages/NoticeBoard/NoticeBoard";
import Inbox from "./pages/Inbox/Inbox";
import Calendar from "./pages/Calendar/Calendar";

// Servicios / Biblioteca / Aulas
import { Library } from "./pages/Library/Library";
import { Favorites } from "./pages/Library/Favorites";
import { Reservations } from "./pages/Library/Reservations";
import { Rooms } from "./pages/Rooms/Rooms";
import Psicologia from "./pages/Psicologia/Psicologia";

// --- SECCIÓN COMUNIDAD ---
import Comunidad from "./pages/Comunity/Comunidad"; // La nueva página con Tabs
import ClubDetalle from "./pages/Comunity/Clubs/ClubDetalle"; // Detalle sigue siendo necesario
import Proyectos from "./pages/Projects/Projects";

// Competiciones
import Competiciones from "./pages/Competiciones/Competiciones";
import CompeticionDetalle from "./pages/Competiciones/CompeticionDetalle";
import FaseFinal from "./pages/Competiciones/FaseFinal";
import Estadisticas from "./pages/Competiciones/Estadisticas";

// PROTECTED ROUTE
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/" replace />;
  return children;
};

// REDIRECCIONES ÚTILES
const RedirectCompeticionSub = ({ subpath }) => {
  const { id } = useParams();
  return <Navigate to={`/comunidad/competiciones/${id}/${subpath}`} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* RUTA PÚBLICA */}
        <Route path="/" element={<Login />} />

        {/* RUTAS PRIVADAS */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          
          {/* PRINCIPAL */}
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notice-board" element={<NoticeBoard />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/calendar" element={<Calendar />} />

          {/* --- BLOQUE COMUNIDAD --- */}
          {/* Esta es la página principal (Hub) con las pestañas */}
          <Route path="/comunidad/comunidades" element={<Comunidad />} />

          {/* Sub-páginas de Comunidad */}
          <Route path="/comunidad/comunidades/clubs/:id" element={<ClubDetalle />} />
          <Route path="/comunidad/proyectos" element={<Proyectos />} />
          
          {/* Competiciones */}
          <Route path="/comunidad/competiciones" element={<Competiciones />} />
          <Route path="/comunidad/competiciones/:id" element={<CompeticionDetalle />} />
          <Route path="/comunidad/competiciones/:id/fase-final" element={<FaseFinal />} />
          <Route path="/comunidad/competiciones/:id/estadisticas" element={<Estadisticas />} />

          {/* --- BLOQUE SERVICIOS --- */}
          <Route path="/library" element={<Library />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/reservas" element={<Reservations />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/comunidad/psicologia" element={<Psicologia />} />

          {/* ALIAS DE COMPATIBILIDAD (Opcionales, por si tenías enlaces viejos) */}
          <Route path="/clubs/:id" element={<Navigate to="/comunidad/clubs/:id" replace />} />
          <Route path="/competiciones/*" element={<Navigate to="/comunidad/competiciones" replace />} />

          {/* 404 - FALLBACK */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;