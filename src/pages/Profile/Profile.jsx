import React from "react";
// Importo el contexto para saber quién está logueado
import { useAuth } from "../../context/AuthContext";
// Importo las funciones de Firebase para cerrar sesión
import { auth } from "../../firebase/config";
import { signOut } from "firebase/auth";

// Componentes y estilos
import PageHeader from "../../components/UI/PageHeader";
import "./Profile.css";

// Iconos para darle un toque visual sin complicarnos con fotos
import { LogOut, User, ShieldCheck } from "lucide-react";

export const Profile = () => {
  // Saco el usuario y el booleano de si es admin desde nuestro contexto
  const { user, isAdmin } = useAuth();

  // Función para cerrar sesión (es async por si acaso Firebase tarda)
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // No necesito redirigir manual, el AuthContext detecta el cambio a null y me echa al login
    } catch (error) {
      console.error("Ups, error al salir:", error);
    }
  };

  // Si no ha cargado el usuario, no pinto nada para que no pete
  if (!user) return null;

  return (
    <div className="profile-page">
      
      {/* 1. Cabecera igual que en el resto de páginas */}
      <PageHeader 
        title="Mi Perfil" 
        subtitle="Información de tu cuenta EUNEIZ." 
      />

      <div className="profile-content">
        {/* 2. Tarjeta principal: Simple pero bonita */}
        <div className="profile-card-simple">
          
          {/* Círculo decorativo donde iría la foto (ponemos un icono genérico) */}
          <div className="avatar-placeholder">
             <User size={40} strokeWidth={1.5} />
          </div>

          <div className="profile-info">
             {/* Muestro el email del usuario en grande */}
             <h2 className="user-email">{user.email}</h2>
             
             {/* Etiqueta de Rol: cambia si soy admin o alumno */}
             <span className={`role-pill ${isAdmin ? 'admin' : 'student'}`}>
                {isAdmin ? "Administrador/a" : "Alumno/a"}
             </span>

             {/* Etiqueta decorativa fija que tenías antes */}
             <div className="status-row">
                <ShieldCheck size={16} className="icon-check"/>
                <span>Miembro EUNEIZ verificado</span>
             </div>
          </div>

          {/* Botón de Salir */}
          <button onClick={handleLogout} className="btn-logout-simple">
            <LogOut size={18} />
            Cerrar Sesión
          </button>

        </div>
      </div>
    </div>
  );
};