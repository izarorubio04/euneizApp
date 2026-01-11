import React from "react";
import { Link, useParams } from "react-router-dom";
import { competiciones } from "./data";
import "./Competiciones.css";
import { ArrowLeft, BarChart2, Users, Medal, Star } from "lucide-react";

export default function Estadisticas() {
  const { id } = useParams();
  const comp = competiciones.find((c) => c.id === id);
  if (!comp) return <div>No encontrado</div>;

  const stats = comp.stats;

  // Función para obtener el valor numérico de un objeto de estadística (busca keys comunes)
  const getStatValue = (item) => {
    return item.goles || item.gf || item.gc || item.mvp || item.kills || item.vision || item.kda || "-";
  };
  
  // Función para obtener la etiqueta (jugador o equipo)
  const getStatLabel = (item) => {
    return item.jugador || item.equipo || "Desconocido";
  };

  return (
    <div className="comp-container">
      <div className="detail-topbar">
        <div className="detail-header-row">
          <div><h1>{comp.titulo}</h1><p className="detail-subtitle">{comp.descripcion}</p></div>
        </div>
        <div className="comp-tabs">
          <Link to={`/comunidad/competiciones/${id}`}><button className="comp-tab-btn"><Users size={16} style={{marginBottom:-2}}/> Clasificación</button></Link>
          <Link to={`/comunidad/competiciones/${id}/fase-final`}><button className="comp-tab-btn"><Medal size={16} style={{marginBottom:-2}}/> Fase Final</button></Link>
          <Link to={`/comunidad/competiciones/${id}/estadisticas`}><button className="comp-tab-btn active"><BarChart2 size={16} style={{marginBottom:-2}}/> Estadísticas</button></Link>
        </div>
      </div>

      {stats ? (
        <div className="stats-grid-container">
          {Object.entries(stats).map(([key, items]) => (
            <div key={key} className="table-card stat-table-card">
              <div className="table-header" style={{background: 'var(--primary)'}}>
                <Star size={16} fill="white" />
                <h3 style={{textTransform:'capitalize'}}>{key.replace(/([A-Z])/g, ' $1').trim()}</h3> 
                {/* Regex para separar camelCase bonito: masGoleadores -> Mas Goleadores */}
              </div>
              <table className="standings-table">
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{width:'30px', color:'#94a3b8', fontWeight:'bold'}}>#{idx + 1}</td>
                      <td style={{fontWeight:600}}>{getStatLabel(item)}</td>
                      <td className="col-pts" style={{width:'60px'}}>{getStatValue(item)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      ) : (
        <div style={{padding:'2rem', textAlign:'center', color:'#94a3b8'}}>No hay estadísticas disponibles todavía.</div>
      )}

      <Link to="/comunidad/competiciones"><button className="btn-back"><ArrowLeft size={18} /> Volver</button></Link>
    </div>
  );
}