// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Login } from "./pages/Login/Login";
import { Profile } from "./pages/Profile/Profile";
import { Home } from "./pages/Home/Home";          // 👈 Importar Home
import { Library } from "./pages/Library/Library"; // 👈 Importar Library
import { Favorites} from "./pages/Library/Favorites";
import { Reservations } from "./pages/Library/Reservations";
import { NoticeBoard } from "./pages/NoticeBoard/NoticeBoard"; // 👈 Importar NoticeBoard
import ListaClubs from "./pages/Comunity/Clubs/ListaClubs";
import ClubDetalle from "./pages/Comunity/Clubs/ClubDetalle";
import Comunidad from "./pages/Comunity/Comunidad";
import ListaComunidades from "./pages/Comunity/Comunidades/ListaComunidades";
import CrearComunidad from "./pages/Comunity/Comunidades/CrearComunidad";
import Competiciones from "./pages/Comunity/Competiciones/Competiciones";
import Psicologia from "./pages/Comunity/Psicologia/Psicologia";
import CompeticionDetalle from "./pages/Comunity/Competiciones/CompeticionDetalle";
import FaseFinal from "./pages/Comunity/Competiciones/FaseFinal";
import Estadisticas from "./pages/Comunity/Competiciones/Estadisticas";

import { MainLayout } from "./components/Layout/MainLayout"; // <--- IMPORTAR


// Componente de protección
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Ruta pública */}
        <Route path="/" element={<Login />} />
        {/* Rutas Privadas con Layout (Sidebar) */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/library" element={<Library />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="reservas" element={<Reservations />} />
          <Route path="/notice-board" element={<NoticeBoard />} />
          {/* Aquí añadiremos las rutas faltantes (rooms, communities) más adelante */}
          <Route path="*" element={<Navigate to="/home" />} />
          <Route 
          path="/clubs" 
          element={
            <ProtectedRoute>
              <ListaClubs />
            </ProtectedRoute>
          }
/>

<Route 
          path="/clubs/:id" 
          element={
            <ProtectedRoute>
              <ClubDetalle />
            </ProtectedRoute>
          }
/>
<Route
  path="/comunidad"
  element={
    <ProtectedRoute>
      <Comunidad />
    </ProtectedRoute>
  }
/>

<Route
  path="/comunidad/lista"
  element={
    <ProtectedRoute>
      <ListaComunidades />
    </ProtectedRoute>
  }
/>

<Route
  path="/comunidad/crear"
  element={
    <ProtectedRoute>
      <CrearComunidad />
    </ProtectedRoute>
  }
/>
<Route
  path="/competiciones"
  element={
    <ProtectedRoute>
      <Competiciones />
    </ProtectedRoute>
  }
/>

<Route
  path="/psicologia"
  element={
    <ProtectedRoute>
      <Psicologia />
    </ProtectedRoute>
  }
/>

<Route
  path="/competiciones/:id"
  element={
    <ProtectedRoute>
      <CompeticionDetalle />
    </ProtectedRoute>
  }
/>

<Route
  path="/competiciones/:id/fase-final"
  element={
    <ProtectedRoute>
      <FaseFinal />
    </ProtectedRoute>
  }
/>

<Route
  path="/competiciones/:id/estadisticas"
  element={
    <ProtectedRoute>
      <Estadisticas />
    </ProtectedRoute>
  }
/>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;