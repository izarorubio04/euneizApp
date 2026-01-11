import React, { useState } from "react";
import "./Psicologia.css";
// Iconos para dar vida a las secciones
import { 
  BrainCircuit, 
  HeartHandshake, 
  GraduationCap, 
  Accessibility, 
  ChevronDown, 
  ChevronUp,
  Mail,
  Calendar,
  Info,
  Send
} from "lucide-react";

export default function Psicologia() {
  const [openForm, setOpenForm] = useState(false);
  const [openBlock, setOpenBlock] = useState(0);

  // Datos con iconos asignados
  const blocks = [
    {
      title: "Dificultades de aprendizaje",
      icon: <GraduationCap size={20} />,
      content:
        "Apoyo y orientación para estudiantes con dislexia u otras dificultades de aprendizaje, así como ayuda para tramitar las adaptaciones académicas necesarias.",
    },
    {
      title: "Neurodesarrollo (TDAH, TEA)",
      icon: <BrainCircuit size={20} />,
      content:
        "Acompañamiento y orientación para estudiantes con trastornos del neurodesarrollo, facilitando recursos y estrategias para la adaptación al entorno universitario.",
    },
    {
      title: "Salud mental y bienestar",
      icon: <HeartHandshake size={20} />,
      content:
        "Espacio seguro para apoyo emocional puntual ante situaciones de estrés, ansiedad u otras dificultades personales. (Nota: No es terapia clínica continuada).",
    },
    {
      title: "Discapacidad física",
      icon: <Accessibility size={20} />,
      content:
        "Orientación y apoyo para estudiantes con discapacidad física, garantizando la accesibilidad a recursos y la eliminación de barreras.",
    },
  ];

  const servicios = [
    "Apoyo psicológico puntual",
    "Orientación educativa",
    "Informes de adaptación",
    "Derivación externa"
  ];

  return (
    <div className="psico-container">
      {/* HEADER */}
      <header className="psico-header">
        <h1>Psicología y Orientación</h1>
        <p>
          Servicio de apoyo al alumnado de EUNEIZ. Un espacio seguro para tu bienestar académico y personal.
        </p>
      </header>

      <div className="psico-grid">
        
        {/* COLUMNA IZQUIERDA: INFORMACIÓN */}
        <div className="psico-content">
          
          {/* TARJETA DE SERVICIOS */}
          <section className="psico-card services-card">
            <h2><Info size={20} className="icon-title"/> ¿Qué ofrece el servicio?</h2>
            <div className="services-list">
              {servicios.map((s, i) => (
                <div key={i} className="service-pill">
                  <span className="check-icon">✓</span> {s}
                </div>
              ))}
            </div>
          </section>

          {/* ACORDEÓN DE ÁREAS */}
          <section className="accordion-section">
            <h3 className="section-label">Áreas de actuación</h3>
            <div className="accordion-wrapper">
              {blocks.map((b, index) => {
                const isOpen = openBlock === index;
                return (
                  <div 
                    key={index} 
                    className={`accordion-item ${isOpen ? "active" : ""}`}
                    onClick={() => setOpenBlock(isOpen ? null : index)}
                  >
                    <div className="accordion-header">
                      <div className="acc-title-group">
                        <div className={`acc-icon-box ${isOpen ? "active" : ""}`}>
                          {b.icon}
                        </div>
                        <h4>{b.title}</h4>
                      </div>
                      <span className="acc-arrow">
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </span>
                    </div>
                    
                    {isOpen && (
                      <div className="accordion-body">
                        <p>{b.content}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: CONTACTO Y FUNCIONAMIENTO */}
        <aside className="psico-sidebar">
          
          {/* TARJETA DE FUNCIONAMIENTO */}
          <div className="psico-card info-card">
            <h3>Funcionamiento</h3>
            <ul className="info-list">
              <li><Calendar size={16} /> Atención con cita previa</li>
              <li><HeartHandshake size={16} /> Intervenciones breves</li>
              <li><Info size={16} /> Confidencialidad total</li>
            </ul>
          </div>

          {/* TARJETA DE CONTACTO / FORMULARIO */}
          <div className="psico-card contact-card">
            <h3>¿Necesitas hablar?</h3>
            <p className="contact-desc">
              Puedes escribirnos directamente para solicitar una cita o resolver dudas.
            </p>
            
            {!openForm ? (
              <div className="contact-actions">
                <a href="mailto:orientacionalumnado@euneiz.com" className="btn-email-direct">
                  <Mail size={18} /> orientacionalumnado@euneiz.com
                </a>
                <div className="divider"><span>o</span></div>
                <button className="btn-primary-action" onClick={() => setOpenForm(true)}>
                  Rellenar Formulario
                </button>
              </div>
            ) : (
              <form className="psico-form" onSubmit={(e) => e.preventDefault()}>
                <input placeholder="Tu nombre" className="psico-input" />
                <input placeholder="Grado / Curso" className="psico-input" />
                <select className="psico-input">
                  <option>Motivo de consulta...</option>
                  <option>Dificultades de aprendizaje</option>
                  <option>Apoyo emocional</option>
                  <option>Otro</option>
                </select>
                <textarea placeholder="Cuéntanos brevemente..." rows={3} className="psico-input"></textarea>
                
                <div className="form-buttons">
                  <button className="btn-submit">
                    <Send size={16} /> Enviar Solicitud
                  </button>
                  <button className="btn-cancel" onClick={() => setOpenForm(false)}>
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}