import React from "react";
import { Link, useParams } from "react-router-dom";
import { competiciones } from "./data";
import "./Competiciones.css";
import { ArrowLeft, BarChart2, Users, Medal, Swords } from "lucide-react";

export default function FaseFinal() {
  const { id } = useParams();
  const comp = competiciones.find((c) => c.id === id);

  if (!comp) return <div className="comp-container">No encontrado</div>;

  // Función auxiliar para renderizar cada bloque de partidos
  const renderBracket = (titulo, partidos) => (
    <div className="bracket-section" key={titulo}>
      <h4 className="bracket-title">{titulo.toUpperCase()}</h4>
      {partidos.map((match) => (
        <div key={match.id} className="match-card">
          <div className="team-side">{match.equipoA}</div>
          <div style={{textAlign:'center', minWidth:'80px'}}>
            <div className="score-box">{match.resultado}</div>
          </div>
          <div className="team-side right">{match.equipoB}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="comp-container">
      <div className="detail-topbar">
        <div className="detail-header-row">
          <div><h1>{comp.titulo}</h1><p className="detail-subtitle">{comp.descripcion}</p></div>
        </div>
        <div className="comp-tabs">
          <Link to={`/comunidad/competiciones/${id}`}><button className="comp-tab-btn"><Users size={16} style={{marginBottom:-2}}/> Clasificación</button></Link>
          <Link to={`/comunidad/competiciones/${id}/fase-final`}><button className="comp-tab-btn active"><Medal size={16} style={{marginBottom:-2}}/> Fase Final</button></Link>
          <Link to={`/comunidad/competiciones/${id}/estadisticas`}><button className="comp-tab-btn"><BarChart2 size={16} style={{marginBottom:-2}}/> Estadísticas</button></Link>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header"><Swords size={18}/><h3>Eliminatorias</h3></div>
        <div style={{paddingBottom: '1rem'}}>
          {comp.faseFinal && Object.keys(comp.faseFinal).length > 0 ? (
            Object.entries(comp.faseFinal).map(([fase, partidos]) => renderBracket(fase, partidos))
          ) : (
            <div style={{padding:'2rem', textAlign:'center', color:'#94a3b8'}}>Fase final no disponible.</div>
          )}
        </div>
      </div>

      <Link to="/comunidad/competiciones"><button className="btn-back"><ArrowLeft size={18} /> Volver</button></Link>
    </div>
  );
}