import "../comunidad.css";
import { Link, useParams } from "react-router-dom";
import { competiciones } from "./data";

export default function Estadisticas() {
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

  const esLoL = comp.tipo === "lol";

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
            <button className="comp-tab-btn">Fase final</button>
          </Link>

          <Link to={`/competiciones/${comp.id}/estadisticas`}>
            <button className="comp-tab-btn active">Estadísticas</button>
          </Link>
        </div>
      </div>

      {/* CONTENIDO */}
      {esLoL ? (
        <>
          <h2>Estadísticas — League of Legends</h2>
          <p style={{ color: "#4b5563", marginTop: "0.5rem" }}>
            Resumen del torneo: MVPs, daño, kills, visión y KDA.
          </p>

          <div className="tarjeta-comunidad" style={{ marginTop: "1rem" }}>
            <h3>🏆 MVPs (más veces MVP)</h3>
            <ul>
              {comp.stats.mvps.map((x) => (
                <li key={x.jugador}>
                  {x.jugador} — <strong>{x.mvp}</strong>
                </li>
              ))}
            </ul>
          </div>


          <div className="tarjeta-comunidad" style={{ marginTop: "1rem" }}>
            <h3>🔪 Más kills (jugador)</h3>
            <ul>
              {comp.stats.masKills.map((x) => (
                <li key={x.jugador}>
                  {x.jugador} — <strong>{x.kills}</strong>
                </li>
              ))}
            </ul>
          </div>

          <div className="tarjeta-comunidad" style={{ marginTop: "1rem" }}>
            <h3>👁️ Más visión (vision score)</h3>
            <ul>
              {comp.stats.masVision.map((x) => (
                <li key={x.jugador}>
                  {x.jugador} — <strong>{x.vision}</strong>
                </li>
              ))}
            </ul>
          </div>

          <div className="tarjeta-comunidad" style={{ marginTop: "1rem" }}>
            <h3>📈 KDA top</h3>
            <ul>
              {comp.stats.kdaTop.map((x) => (
                <li key={x.jugador}>
                  {x.jugador} — <strong>{x.kda}</strong>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <>
          <h2>Estadísticas — Fútbol</h2>
          <p style={{ color: "#4b5563", marginTop: "0.5rem" }}>
            Pichichis y equipos más goleadores / menos goleados.
          </p>

          <div className="tarjeta-comunidad" style={{ marginTop: "1rem" }}>
            <h3>🏅 Pichichis</h3>
            <ul>
              {comp.stats.pichichis.map((p) => (
                <li key={p.jugador}>
                  {p.jugador} — <strong>{p.goles}</strong>
                </li>
              ))}
            </ul>
          </div>

          <div className="tarjeta-comunidad" style={{ marginTop: "1rem" }}>
            <h3>⚽ Equipos más goleadores</h3>
            <ul>
              {comp.stats.masGoleadores.map((e) => (
                <li key={e.equipo}>
                  {e.equipo} — <strong>{e.gf}</strong> GF
                </li>
              ))}
            </ul>
          </div>

          <div className="tarjeta-comunidad" style={{ marginTop: "1rem" }}>
            <h3>🧤 Equipos menos goleados</h3>
            <ul>
              {comp.stats.menosGoleados.map((e) => (
                <li key={e.equipo}>
                  {e.equipo} — <strong>{e.gc}</strong> GC
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <Link to="/competiciones">
        <button className="main-menu-btn" style={{ marginTop: "1.5rem" }}>
          Volver a Competiciones
        </button>
      </Link>
    </div>
  );
}