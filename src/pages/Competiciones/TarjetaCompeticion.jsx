import React from "react";
import { Link } from "react-router-dom";
import { Calendar, ArrowRight, Gamepad2, Activity } from "lucide-react";
import "./Competiciones.css";

export default function TarjetaCompeticion({ comp }) {
  // Icono dinámico según el tipo de competición
  const Icon = comp.tipo === "lol" ? Gamepad2 : Activity;

  return (
    <article className="comp-card">
      <div className="comp-card-header">
        <div className="sport-icon-circle">
          <Icon size={28} />
        </div>
      </div>
      
      <div className="comp-card-body">
        <div className="comp-meta">
          <Calendar size={14} />
          <span>{comp.fecha}</span>
        </div>

        <h3 className="comp-title">{comp.titulo}</h3>
        <p className="comp-desc">{comp.descripcion}</p>

        <Link to={`/comunidad/competiciones/${comp.id}`} style={{textDecoration:'none'}}>
          <button className="btn-view-comp">
            Ver Detalles <ArrowRight size={18} />
          </button>
        </Link>
      </div>
    </article>
  );
}