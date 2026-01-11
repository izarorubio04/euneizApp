import React from "react";
import { Link, useParams } from "react-router-dom";
import { competiciones } from "./data";
import "./Competiciones.css";
import { Trophy, ArrowLeft, BarChart2, Users, Medal } from "lucide-react";

export default function CompeticionDetalle() {
  const { id } = useParams();
  const comp = competiciones.find((c) => c.id === id);

  if (!comp) return <div className="comp-container">Competición no encontrada</div>;
  
  // Detectar si es esports para ocultar columnas de fútbol
  const esLoL = comp.tipo === "lol" || comp.id === "esports";

  return (
    <div className="comp-container">
      {/* TOPBAR */}
      <div className="detail-topbar">
        <div className="detail-header-row">
          <div>
            <h1>{comp.titulo}</h1>
            <p className="detail-subtitle">{comp.descripcion}</p>
          </div>
        </div>

        <div className="comp-tabs">
          <Link to={`/comunidad/competiciones/${id}`}><button className="comp-tab-btn active"><Users size={16} style={{marginBottom:-2}}/> Clasificación</button></Link>
          <Link to={`/comunidad/competiciones/${id}/fase-final`}><button className="comp-tab-btn"><Medal size={16} style={{marginBottom:-2}}/> Fase Final</button></Link>
          <Link to={`/comunidad/competiciones/${id}/estadisticas`}><button className="comp-tab-btn"><BarChart2 size={16} style={{marginBottom:-2}}/> Estadísticas</button></Link>
        </div>
      </div>

      {/* TABLAS */}
      {comp.grupos.map((g, idx) => (
        <div key={idx} className="table-card">
          <div className="table-header"><Trophy size={18} /><h3>{g.nombre}</h3></div>
          <div className="table-responsive">
            <table className="standings-table">
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th>PJ</th>
                  <th>V</th>
                  <th>D</th>
                  {!esLoL && <><th>E</th><th>GF</th><th>GC</th></>}
                  <th className="col-pts">PTS</th>
                </tr>
              </thead>
              <tbody>
                {g.tabla.map((r, i) => (
                  <tr key={i}>
                    <td style={{fontWeight:600}}>{r.equipo}</td>
                    <td>{r.pj}</td>
                    <td>{r.v}</td>
                    <td>{r.d}</td>
                    {!esLoL && <><td>{r.e}</td><td>{r.gf}</td><td>{r.gc}</td></>}
                    <td className="col-pts">{r.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      
      <Link to="/comunidad/competiciones"><button className="btn-back"><ArrowLeft size={18} /> Volver</button></Link>
    </div>
  );
}