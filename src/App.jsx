// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MainLayout } from "./components/Layout/MainLayout"; // <--- IMPORTAR

// Páginas
import { Login } from "./pages/Login/Login";
import { Home } from "./pages/Home/Home";
import { Library } from "./pages/Library/Library";
import { NoticeBoard } from "./pages/NoticeBoard/NoticeBoard";
import { Profile } from "./pages/Profile/Profile";

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
          <Route path="/notice-board" element={<NoticeBoard />} />
          {/* Aquí añadiremos las rutas faltantes (rooms, communities) más adelante */}
          <Route path="*" element={<Navigate to="/home" />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;