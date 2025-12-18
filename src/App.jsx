// src/App.jsx
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Páginas públicas
import { Login } from "./pages/Login/Login";

// Layout
import { MainLayout } from "./components/Layout/MainLayout";

// Páginas principales
import { Home } from "./pages/Home/Home";
import { Profile } from "./pages/Profile/Profile";
import { Library } from "./pages/Library/Library";
import { Favorites } from "./pages/Library/Favorites";
import { Reservations } from "./pages/Library/Reservations";
import { NoticeBoard } from "./pages/NoticeBoard/NoticeBoard";

// Comunidad
import Comunidad from "./pages/Comunity/Comunidad";
import ListaComunidades from "./pages/Comunity/Comunidades/ListaComunidades";
import CrearComunidad from "./pages/Comunity/Comunidades/CrearComunidad";

// Clubs
import ListaClubs from "./pages/Comunity/Clubs/ListaClubs";
import ClubDetalle from "./pages/Comunity/Clubs/ClubDetalle";

// Competiciones
import Competiciones from "./pages/Comunity/Competiciones/Competiciones";
import CompeticionDetalle from "./pages/Comunity/Competiciones/CompeticionDetalle";
import FaseFinal from "./pages/Comunity/Competiciones/FaseFinal";
import Estadisticas from "./pages/Comunity/Competiciones/Estadisticas";

// Psicología
import Psicologia from "./pages/Comunity/Psicologia/Psicologia";

// ─────────────────────────────────────────────
// PROTECTED ROUTE
// ─────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/" replace />;
  return children;
};

// ─────────────────────────────────────────────
// REDIRECCIONES (ALIAS PARA RUTAS ANTIGUAS)
// ─────────────────────────────────────────────
const RedirectClubDetalle = () => {
  const { id } = useParams();
  return <Navigate to={`/comunidad/clubs/${id}`} replace />;
};

const RedirectCompeticionDetalle = () => {
  const { id } = useParams();
  return <Navigate to={`/comunidad/competiciones/${id}`} replace />;
};

const RedirectCompeticionSub = ({ subpath }) => {
  const { id } = useParams();
  return <Navigate to={`/comunidad/competiciones/${id}/${subpath}`} replace />;
};

// ─────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* RUTA PÚBLICA */}
        <Route path="/" element={<Login />} />

        {/* RUTAS PRIVADAS CON LAYOUT */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* PRINCIPAL */}
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/library" element={<Library />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/reservas" element={<Reservations />} />
          <Route path="/notice-board" element={<NoticeBoard />} />

          {/* COMUNIDAD (HUB) */}
          <Route path="/comunidad" element={<Comunidad />} />

          {/* COMUNIDADES DE ESTUDIANTES */}
          <Route path="/comunidad/comunidades" element={<ListaComunidades />} />
          <Route path="/comunidad/comunidades/crear" element={<CrearComunidad />} />

          {/* CLUBS */}
          <Route path="/comunidad/clubs" element={<ListaClubs />} />
          <Route path="/comunidad/clubs/:id" element={<ClubDetalle />} />

          {/* COMPETICIONES */}
          <Route path="/comunidad/competiciones" element={<Competiciones />} />
          <Route path="/comunidad/competiciones/:id" element={<CompeticionDetalle />} />
          <Route path="/comunidad/competiciones/:id/fase-final" element={<FaseFinal />} />
          <Route path="/comunidad/competiciones/:id/estadisticas" element={<Estadisticas />} />

          {/* PSICOLOGÍA */}
          <Route path="/comunidad/psicologia" element={<Psicologia />} />

          {/* ───── ALIAS / RUTAS ANTIGUAS (NO TOCAR) ───── */}
          <Route path="/clubs" element={<Navigate to="/comunidad/clubs" replace />} />
          <Route path="/clubs/:id" element={<RedirectClubDetalle />} />

          <Route path="/competiciones" element={<Navigate to="/comunidad/competiciones" replace />} />
          <Route path="/competiciones/:id" element={<RedirectCompeticionDetalle />} />
          <Route
            path="/competiciones/:id/fase-final"
            element={<RedirectCompeticionSub subpath="fase-final" />}
          />
          <Route
            path="/competiciones/:id/estadisticas"
            element={<RedirectCompeticionSub subpath="estadisticas" />}
          />

          <Route path="/psicologia" element={<Navigate to="/comunidad/psicologia" replace />} />
          <Route path="/comunidad/lista" element={<Navigate to="/comunidad/comunidades" replace />} />
          <Route path="/comunidad/crear" element={<Navigate to="/comunidad/comunidades/crear" replace />} />

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;