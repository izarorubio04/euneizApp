import React, { useState } from "react";
import "./Psicologia.css";

// Importamos los componentes que ya tenemos hechos para no repetir código
import PageHeader from "../../components/UI/PageHeader";
import Modal from "../../components/UI/Modal";

// Iconos visuales para hacer la interfaz más amigable
import { 
  BrainCircuit, HeartHandshake, GraduationCap, Accessibility, 
  ChevronDown, ChevronUp, Mail, Calendar, Info, Send
} from "lucide-react";

export default function Psicologia() {
  // --- ESTADOS ---
  // Controla si el formulario emergente (modal) está visible o no
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Controla qué sección del acordeón está desplegada. 
  // Uso el índice (0, 1, 2...) o null si están todas cerradas.
  const [openBlock, setOpenBlock] = useState(0);

  // --- DATOS ESTÁTICOS ---
  // Defino estos datos en un array de objetos (JSON).
  // Esto es mejor que escribir todo el HTML a mano porque si mañana quiero
  // añadir un servicio más, solo lo agrego aquí y se pinta solo.
  const blocks = [
    {
      title: "Dificultades de aprendizaje",
      icon: <GraduationCap size={20} />,
      content: "Apoyo y orientación para estudiantes con dislexia u otras dificultades de aprendizaje, así como ayuda para tramitar las adaptaciones académicas necesarias.",
    },
    {
      title: "Neurodesarrollo (TDAH, TEA)",
      icon: <BrainCircuit size={20} />,
      content: "Acompañamiento y orientación para estudiantes con trastornos del neurodesarrollo, facilitando recursos y estrategias para la adaptación al entorno universitario.",
    },
    {
      title: "Salud mental y bienestar",
      icon: <HeartHandshake size={20} />,
      content: "Espacio seguro para apoyo emocional puntual ante situaciones de estrés, ansiedad u otras dificultades personales. (Nota: No es terapia clínica continuada).",
    },
    {
      title: "Discapacidad física",
      icon: <Accessibility size={20} />,
      content: "Orientación y apoyo para estudiantes con discapacidad física, garantizando la accesibilidad a recursos y la eliminación de barreras.",
    },
  ];

  const servicios = [
    "Apoyo psicológico puntual",
    "Orientación educativa",
    "Informes de adaptación",
    "Derivación externa"
  ];

  // --- MANEJADORES DE EVENTOS ---
  // Función para procesar el envío del formulario sin recargar la página
  const handleSubmit = (e) => {
    e.preventDefault(); // Evitamos que el navegador recargue
    setIsModalOpen(false); // Cerramos el modal
    alert("✅ Solicitud enviada. Contactaremos contigo pronto.");
  };

  return (
    <div className="psico-container">
      
      {/* 1. HEADER */}
      {/* Reutilizo el componente PageHeader para mantener el diseño consistente en toda la web */}
      <PageHeader 
        title="Psicología y Orientación" 
        subtitle="Servicio de apoyo al alumnado de EUNEIZ. Un espacio seguro para tu bienestar académico y personal."
      />

      <div className="psico-grid">
        
        {/* --- COLUMNA IZQUIERDA: INFORMACIÓN PRINCIPAL --- */}
        <div className="psico-content">
          
          {/* Tarjeta de Servicios Rápidos */}
          <section className="psico-card services-card">
            <h2><Info size={20} className="icon-title"/> ¿Qué ofrece el servicio?</h2>
            <div className="services-list">
              {/* Mapeo el array 'servicios' para generar las etiquetas automáticamente */}
              {servicios.map((s, i) => (
                <div key={i} className="service-pill">
                  <span className="check-icon">✓</span> {s}
                </div>
              ))}
            </div>
          </section>

          {/* Acordeón Interactivo */}
          <section className="accordion-section">
            <h3 className="section-label">Áreas de actuación</h3>
            <div className="accordion-wrapper">
              {blocks.map((b, index) => {
                // Comprobamos si este bloque es el que está abierto
                const isOpen = openBlock === index;
                
                return (
                  <div 
                    key={index} 
                    className={`accordion-item ${isOpen ? "active" : ""}`}
                    // Si clico en el que ya está abierto, lo cierro (null), si no, abro el nuevo
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
                    
                    {/* Renderizado condicional: El contenido solo existe en el DOM si está abierto */}
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

        {/* --- COLUMNA DERECHA: SIDEBAR DE CONTACTO --- */}
        <aside className="psico-sidebar">
          
          {/* Tarjeta informativa fija */}
          <div className="psico-card info-card">
            <h3>Funcionamiento</h3>
            <ul className="info-list">
              <li><Calendar size={16} /> Atención con cita previa</li>
              <li><HeartHandshake size={16} /> Intervenciones breves</li>
              <li><Info size={16} /> Confidencialidad total</li>
            </ul>
          </div>

          {/* Tarjeta de acción (CTA) */}
          <div className="psico-card contact-card">
            <h3>¿Necesitas hablar?</h3>
            <p className="contact-desc">
              Puedes escribirnos directamente para solicitar una cita o resolver dudas.
            </p>
            
            <div className="contact-actions">
              <a href="mailto:orientacionalumnado@euneiz.com" className="btn-email-direct">
                <Mail size={18} /> orientacionalumnado@euneiz.com
              </a>
              
              <div className="divider"><span>o</span></div>
              
              <button className="btn-primary-action" onClick={() => setIsModalOpen(true)}>
                Rellenar Formulario
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* 2. MODAL FLOTANTE */}
      {/* Usamos el componente Modal genérico pasándole el contenido del formulario como hijos (children) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Solicitar Cita / Apoyo"
      >
        <form className="psico-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tu nombre completo</label>
            <input placeholder="Nombre y Apellidos" required className="psico-input" />
          </div>
          
          <div className="form-group">
             <label>Grado y Curso</label>
             <input placeholder="Ej: Multimedia 2º" required className="psico-input" />
          </div>

          <div className="form-group">
            <label>Motivo de consulta</label>
            <select className="psico-input">
              <option>Selecciona...</option>
              <option>Dificultades de aprendizaje</option>
              <option>Apoyo emocional / Ansiedad</option>
              <option>Discapacidad / Adaptaciones</option>
              <option>Otro</option>
            </select>
          </div>

          <div className="form-group">
             <label>Mensaje (Opcional)</label>
             <textarea placeholder="Cuéntanos brevemente cómo podemos ayudarte..." rows={4} className="psico-input"></textarea>
          </div>
          
          <button className="btn-submit">
            <Send size={16} /> Enviar Solicitud
          </button>
        </form>
      </Modal>
    </div>
  );
}