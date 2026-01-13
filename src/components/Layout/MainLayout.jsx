// src/components/Layout/MainLayout.jsx
import { useState } from "react"; // Importamos useState
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { auth } from "../../firebase/config";
import { 
  Home, 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Trophy, 
  Lightbulb, 
  Library, 
  Key, 
  LogOut,
  BrainCircuit,
  Menu, 
  X     
} from "lucide-react"; 
import "./MainLayout.css";

export const MainLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Estado para controlar la apertura del menú en móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    auth.signOut();
    navigate("/");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Función para cerrar el menú al hacer clic en un enlace (UX móvil)
  const closeMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="layout-container">
      
      {/* BOTÓN HAMBURGUESA (Solo visible en móvil por CSS) */}
      <button 
        className="mobile-menu-btn" 
        onClick={toggleMobileMenu}
        aria-label="Abrir menú"
      >
        <Menu size={24} />
      </button>

      {/* OVERLAY (Fondo oscuro al abrir menú en móvil) */}
      {isMobileMenuOpen && (
        <div className="sidebar-overlay" onClick={closeMenu}></div>
      )}

      {/* SIDEBAR: Añadimos la clase 'open' si el estado es true */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <h2>EUNEIZ</h2>
            <span className="badge-beta">HUB</span>
          </div>
          {/* Botón X para cerrar dentro del menú en móvil */}
          <button className="close-sidebar-btn" onClick={closeMenu}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-section">PRINCIPAL</p>
          <NavLink to="/home" className="nav-item" onClick={closeMenu}>
            <Home size={20} /> <span>Inicio</span>
          </NavLink>
          <NavLink to="/notice-board" className="nav-item" onClick={closeMenu}>
            <LayoutDashboard size={20} /> <span>Tablón</span>
          </NavLink>
          <NavLink to="/calendar" className="nav-item" onClick={closeMenu}>
            <Calendar size={20} /> <span>Calendario</span>
          </NavLink>

          <p className="nav-section">COMUNIDAD</p>
          <NavLink to="/comunidad/comunidades" className="nav-item" onClick={closeMenu}>
            <Users size={20} /> <span>Comunidades</span>
          </NavLink>
          <NavLink to="/comunidad/competiciones" className="nav-item" onClick={closeMenu}>
            <Trophy size={20} /> <span>Competiciones</span>
          </NavLink>
          <NavLink to="/comunidad/proyectos" className="nav-item" onClick={closeMenu}>
            <Lightbulb size={20} /> <span>Proyectos</span>
          </NavLink>

          <p className="nav-section">SERVICIOS</p>
          <NavLink to="/library" className="nav-item" onClick={closeMenu}>
            <Library size={20} /> <span>Biblioteca</span>
          </NavLink>
          <NavLink to="/rooms" className="nav-item" onClick={closeMenu}>
            <Key size={20} /> <span>Aulas</span>
          </NavLink>
          <NavLink to="/comunidad/psicologia" className="nav-item" onClick={closeMenu}>
            <BrainCircuit size={20} /> <span>Psicología</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/profile" className="user-info-card" onClick={closeMenu}>
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