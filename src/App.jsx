import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Login } from "./pages/Login/Login";
import { Profile } from "./pages/Profile/Profile";
import { Home } from "./pages/Home/Home";          // 👈 Importar Home
import { Library } from "./pages/Library/Library"; // 👈 Importar Library
import { NoticeBoard } from "./pages/NoticeBoard/NoticeBoard"; // 👈 Importar NoticeBoard

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <h1>Cargando...</h1>; // Opcional: evitar parpadeos
  if (!user) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Ruta principal protegida: HOME */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/library" 
          element={
            <ProtectedRoute>
              <Library />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/notice-board" 
          element={
            <ProtectedRoute>
              <NoticeBoard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;