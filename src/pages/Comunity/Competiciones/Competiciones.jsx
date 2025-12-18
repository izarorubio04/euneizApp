import "../comunidad.css";
import { Link } from "react-router-dom";
import { competiciones } from "./data";

export default function Competiciones() {
  return (
    <div className="comunidad-container">
      <h1>Competiciones</h1>
      <p style={{ marginBottom: "1.5rem" }}>
        Fase de grupos, fase final y estadísticas (pichichis).
      </p>

      {competiciones.map((c) => (
        <div key={c.id} className="tarjeta-comunidad">
          <h3>{c.titulo}</h3>
          <p>{c.descripcion}</p>
          <p><strong>Fechas:</strong> {c.fecha}</p>

          <Link to={`/competiciones/${c.id}`}>
            <button className="main-menu-btn" style={{ marginTop: "0.75rem" }}>
              Ver fase de grupos
            </button>
          </Link>
        </div>
      ))}
    </div>
  );
}