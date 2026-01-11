// src/components/Layout/MainLayout.jsx
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../firebase/config";
import { 
  Home, 
  LayoutDashboard, 
  Calendar, 
  Mail, 
  Users, 
  Trophy, 
  Lightbulb, 
  Library, 
  Key, 
  LogOut,
  BrainCircuit
} from "lucide-react"; 
import "./MainLayout.css";

export const MainLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    auth.signOut();
    navigate("/");
  };

  return (
    <div className="layout-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <h2>EUNEIZ</h2>
            <span className="badge-beta">HUB</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-section">PRINCIPAL</p>
          <NavLink to="/home" className="nav-item">
            <Home size={20} /> <span>Inicio</span>
          </NavLink>
          <NavLink to="/notice-board" className="nav-item">
            <LayoutDashboard size={20} /> <span>Tablón</span>
          </NavLink>
          <NavLink to="/calendar" className="nav-item">
            <Calendar size={20} /> <span>Calendario</span>
          </NavLink>
          <NavLink to="/inbox" className="nav-item">
            <Mail size={20} /> <span>Mensajes</span>
          </NavLink>

          <p className="nav-section">COMUNIDAD</p>
          {/* CAMBIO: Un solo enlace para Comunidades y Clubs */}
          <NavLink to="/comunidad/comunidades" className="nav-item">
            <Users size={20} /> <span>Comunidades</span>
          </NavLink>
          
          <NavLink to="/comunidad/competiciones" className="nav-item">
            <Trophy size={20} /> <span>Competiciones</span>
          </NavLink>
          <NavLink to="/comunidad/proyectos" className="nav-item">
            <Lightbulb size={20} /> <span>Proyectos</span>
          </NavLink>

          <p className="nav-section">SERVICIOS</p>
          <NavLink to="/library" className="nav-item">
            <Library size={20} /> <span>Biblioteca</span>
          </NavLink>
          <NavLink to="/rooms" className="nav-item">
            <Key size={20} /> <span>Aulas</span>
          </NavLink>
          <NavLink to="/comunidad/psicologia" className="nav-item">
            <BrainCircuit size={20} /> <span>Psicología</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/profile" className="user-info-card">
            <div className="avatar-circle">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">Mi Perfil</span>
              <span className="user-email">{user?.email?.split('@')[0]}</span>
            </div>
          </NavLink>
          
          <button onClick={handleLogout} className="logout-icon-btn" title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="content-area">
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
};