import React from "react";
import { Link } from "react-router-dom";
import { competiciones } from "./data";
import "./Competiciones.css"; // Importamos el nuevo CSS

// Iconos
import { 
  Trophy, 
  Calendar, 
  ArrowRight, 
  AlertTriangle, 
  Gamepad2, 
  Activity 
} from "lucide-react";

export default function Competiciones() {
  return (
    <div className="comp-container">
      
      {/* AVISO DE DEMOSTRACIÓN */}
      <div className="demo-banner">
        <AlertTriangle size={24} className="flex-shrink-0" />
        <div className="demo-content">
          <strong>Prototipo de Funcionalidad</strong>
          <p>
            Esta sección es una <em>demostración técnica</em> de cómo funcionaría el sistema de ligas universitarias en el futuro. 
            Actualmente no hay competiciones oficiales activas gestionadas por esta plataforma.
          </p>
        </div>
      </div>

      <header className="comp-header">
        <h1>Competiciones EUNEIZ</h1>
        <p>Sigue las ligas, resultados y clasificaciones del campus.</p>
      </header>

      <div className="comp-grid">
        {competiciones.map((c) => {
          // Icono dinámico según tipo
          const Icon = c.tipo === "lol" ? Gamepad2 : Activity;

          return (
            <article key={c.id} className="comp-card">
              <div className="comp-card-header">
                <div className="sport-icon-circle">
                  <Icon size={28} />
                </div>
              </div>
              
              <div className="comp-card-body">
                <div className="comp-dates">
                  <Calendar size={14} />
                  <span>{c.fecha}</span>
                </div>

                <h3 className="comp-title">{c.titulo}</h3>
                <p className="comp-desc">{c.descripcion}</p>

                <Link to={`/comunidad/competiciones/${c.id}`} style={{textDecoration:'none'}}>
                  <button className="btn-view-comp">
                    Ver Clasificación <ArrowRight size={18} />
                  </button>
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}