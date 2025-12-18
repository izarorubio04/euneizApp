import "../comunidad.css";
import { Link, useParams } from "react-router-dom";
import { competiciones } from "./data";

export default function FaseFinal() {
  const { id } = useParams();
  const comp = competiciones.find((c) => c.id === id);

  if (!comp) {
    return (
      <div className="comunidad-container">
        <h1>Competición no encontrada</h1>
        <Link to="/competiciones">
          <button className="main-menu-btn">Volver</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="comunidad-container">
      {/* TOPBAR + TABS */}
      <div className="comp-topbar">
        <div>
          <h1 style={{ margin: 0 }}>{comp.titulo}</h1>
          <p style={{ marginTop: "0.5rem" }}>{comp.descripcion}</p>
          <p>
            <strong>Fechas:</strong> {comp.fecha}
          </p>
        </div>

        <div className="comp-tabs">
          <Link to={`/competiciones/${comp.id}`}>
            <button className="comp-tab-btn">Fase de grupos</button>
          </Link>

          <Link to={`/competiciones/${comp.id}/fase-final`}>
            <button className="comp-tab-btn active">Fase final</button>
          </Link>

          <Link to={`/competiciones/${comp.id}/estadisticas`}>
            <button className="comp-tab-btn">Estadísticas</button>
          </Link>
        </div>
      </div>

      {/* FASE FINAL */}
      <h2>Fase final</h2>

      <div className="tarjeta-comunidad" style={{ marginTop: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>Semifinales</h3>

        {comp.faseFinal?.semifinales?.length ? (
          comp.faseFinal.semifinales.map((p) => (
            <p key={p.id}>
              <strong>{p.equipoA}</strong> vs <strong>{p.equipoB}</strong> — {p.resultado}
            </p>
          ))
        ) : (
          <p style={{ color: "#4b5563" }}>Todavía no hay partidos cargados.</p>
        )}
      </div>

      <div className="tarjeta-comunidad" style={{ marginTop: "1rem" }}>
        <h3 style={{ marginTop: 0 }}>Final</h3>

        {comp.faseFinal?.final?.length ? (
          comp.faseFinal.final.map((p) => (
            <p key={p.id}>
              <strong>{p.equipoA}</strong> vs <strong>{p.equipoB}</strong> — {p.resultado}
            </p>
          ))
        ) : (
          <p style={{ color: "#4b5563" }}>Todavía no hay final cargada.</p>
        )}
      </div>

      {/* ACCIONES */}
      <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
    

        <Link to="/competiciones">
          <button className="main-menu-btn">Volver a Competiciones</button>
        </Link>
      </div>
    </div>
  );
}