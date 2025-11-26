import "../styles/comunidad.css";
import { Link } from "react-router-dom";

export default function Comunidad() {
  return (
    <div className="comunidad-container">

      <h1>Comunidad</h1>

      {/* MENÚ PRINCIPAL */}
      <div className="main-menu">

        <Link to="/comunidad/lista">
          <button className="main-menu-btn">Comunidades</button>
        </Link>

        <Link to="/clubs">
          <button className="main-menu-btn">Clubs</button>
        </Link>

        <Link to="/eventos">
          <button className="main-menu-btn">Eventos</button>
        </Link>

        <Link to="/competiciones">
          <button className="main-menu-btn">Competiciones</button>
        </Link>

      </div>

    </div>
  );
}
