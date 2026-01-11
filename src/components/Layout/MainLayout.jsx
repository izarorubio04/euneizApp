// src/components/Layout/MainLayout.jsx
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../firebase/config"; // Importa auth directamente para el signOut
import "./MainLayout.css"; // Crearemos este CSS básico después

export const MainLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.signOut();
    navigate("/");
  };

  return (
    <div className="layout-container">
      {/* --- SIDEBAR (Menú Lateral) --- */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>EUNEIZ</h2>
          <span className="badge-beta">Community</span>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-section">PRINCIPAL</p>
          <NavLink to="/home" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            🏠 Home
          </NavLink>
          <NavLink to="/notice-board" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            📢 Tablón
          </NavLink>
          <NavLink to="/calendar" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            📅 Calendario
          </NavLink>

          <NavLink to="/inbox" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            📬 Mensajes
          </NavLink>

          <p className="nav-section">COMUNIDAD</p>

          <NavLink
          to="/comunidad/comunidades"
          className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
            👥 Comunidades
          </NavLink>

        <NavLink
          to="/comunidad/clubs"
          className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
          🏫 Clubs
        </NavLink>

        <NavLink
          to="/comunidad/competiciones"
          className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
          🏆 Competiciones
          </NavLink>

        <NavLink
          to="/comunidad/psicologia"
          className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
            🧠 Psicología
        </NavLink>

        <NavLink
          to="/comunidad/proyectos"
          className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}>
            🧩 Proyectos de Alumnos
        </NavLink>

          <p className="nav-section">SERVICIOS</p>
          <NavLink to="/library" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            📚 Biblioteca
          </NavLink>
          <NavLink to="/rooms" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            🔑 Reservas Aulas
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/profile" className="user-info">
            <div className="avatar-placeholder">{user?.email?.charAt(0).toUpperCase()}</div>
            <div className="user-text">
              <span className="user-name">Mi Perfil</span>
              <span className="user-role">Alumno</span>
            </div>
          </NavLink>
          <button onClick={handleLogout} className="logout-mini-btn">Salir</button>
        </div>
      </aside>

      {/* --- CONTENIDO DINÁMICO (Aquí se cargan las páginas) --- */}
      <main className="content-area">
        <Outlet /> 
      </main>
    </div>
  );
};