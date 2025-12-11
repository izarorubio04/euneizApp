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
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;