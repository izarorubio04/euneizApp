import { useNavigate } from "react-router-dom";
import "./Home.css";

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>Panel de Estudiante</h1>
      <p>Selecciona una opción:</p>

      <div className="menu-grid">
        {/* Botón 1: Perfil */}
        <button className="menu-card" onClick={() => navigate("/profile")}>
          <span className="icon">👤</span>
          <h3>Mi Perfil</h3>
        </button>

        {/* Botón 2: Tablón */}
        <button className="menu-card" onClick={() => navigate("/notice-board")}>
          <span className="icon">📢</span>
          <h3>Tablón de Anuncios</h3>
        </button>

        {/* Botón 3: Biblioteca */}
        <button className="menu-card" onClick={() => navigate("/library")}>
          <span className="icon">📚</span>
          <h3>Biblioteca</h3>
        </button>
      </div>
    </div>
  );
};