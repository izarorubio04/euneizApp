import "./comunidad.css";
import { Link } from "react-router-dom";

export default function Comunidad() {
  return (
    <div className="comunidad-container">
      <h1>Comunidad</h1>

      <div className="main-menu">
        <Link to="/comunidad/lista">
          <button className="main-menu-btn">Comunidades de estudiantes</button>
        </Link>

        <Link to="/clubs">
          <button className="main-menu-btn">Clubs oficiales</button>
        </Link>

        <Link to="/competiciones">
          <button className="main-menu-btn">Competiciones</button>
        </Link>

        <Link to="/comunidad/proyectos">
          <button className="main-menu-btn">
            Proyectos de alumnos
          </button>
        </Link> 

      <Link to="/psicologia">
        <button className="main-menu-btn">
        Psicología y orientación al alumnado
        </button>
      </Link>
      </div>
    </div>
  );
}
