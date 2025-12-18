import "../comunidad.css";
import { Link, useParams } from "react-router-dom";
import { competiciones } from "./data";

export default function CompeticionDetalle() {
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
            <button className="comp-tab-btn active">Fase de grupos</button>
          </Link>

          <Link to={`/competiciones/${comp.id}/fase-final`}>
            <button className="comp-tab-btn">Fase final</button>
          </Link>

          <Link to={`/competiciones/${comp.id}/estadisticas`}>
            <button className="comp-tab-btn">Estadísticas</button>
          </Link>

        </div>
      </div>

      {/* FASE DE GRUPOS */}
      <h2>Fase de grupos</h2>

      {comp.grupos.map((g) => (
        <div
          key={g.nombre}
          className="tarjeta-comunidad"
          style={{ marginTop: "1rem" }}
        >
          <h3 style={{ marginTop: 0 }}>{g.nombre}</h3>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left" }}>
                  <th>Equipo</th>
                  <th>PJ</th>
                  <th>V</th>
                  <th>D</th>

                  {/* Solo fútbol */}
                  {!esLoL && (
                    <>
                      <th>E</th>
                      <th>GF</th>
                      <th>GC</th>
                    </>
                  )}

                  <th>PTS</th>
                </tr>
              </thead>

              <tbody>
                {g.tabla.map((r) => (
                  <tr key={r.equipo}>
                    <td style={{ padding: "0.35rem 0" }}>{r.equipo}</td>
                    <td>{r.pj}</td>
                    <td>{r.v}</td>
                    <td>{r.d}</td>

                    {!esLoL && (
                      <>
                        <td>{r.e}</td>
                        <td>{r.gf}</td>
                        <td>{r.gc}</td>
                      </>
                    )}

                    <td style={{ fontWeight: 800 }}>{r.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        
        </div>
      ))}

      {/* ACCIONES */}
      <div
        style={{
          marginTop: "1.5rem",
          display: "flex",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >


        <Link to="/competiciones">
          <button className="main-menu-btn">Volver a Competiciones</button>
        </Link>
      </div>
    </div>
  );
}