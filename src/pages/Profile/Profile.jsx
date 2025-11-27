import { useAuth } from "../../context/AuthContext";
import { auth } from "../../firebase/config";
import { signOut } from "firebase/auth";
import "./Profile.css";

export const Profile = () => {
  const { user } = useAuth();

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1>Perfil de Estudiante</h1>
        <p>Bienvenido/a: <strong>{user.email}</strong></p>
        <span className="badge">Miembro EUNEIZ verificado</span>
        
        <button onClick={handleLogout} className="logout-btn">
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};