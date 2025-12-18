import "../comunidad.css";
import { useState } from "react";

export default function Psicologia() {
  const [openForm, setOpenForm] = useState(false);
  const [openBlock, setOpenBlock] = useState(0);

  const blocks = [
    {
      title: "Dificultades de aprendizaje",
      content:
        "Apoyo y orientación para estudiantes con dislexia u otras dificultades de aprendizaje, así como ayuda para solicitar adaptaciones académicas.",
    },
    {
      title: "Neurodesarrollo (TDAH, TEA)",
      content:
        "Acompañamiento y orientación para estudiantes con trastornos del neurodesarrollo, facilitando recursos y adaptación al entorno universitario.",
    },
    {
      title: "Salud mental y bienestar emocional",
      content:
        "Apoyo emocional puntual para afrontar situaciones de estrés, ansiedad u otras dificultades personales. No se trata de terapia continuada.",
    },
    {
      title: "Discapacidad física",
      content:
        "Orientación y apoyo para estudiantes con discapacidad física, facilitando el acceso a recursos y adaptaciones necesarias.",
    },
  ];

  return (
    <div className="comunidad-container">
      <h1>Psicología y orientación al alumnado</h1>

      <p>
        El Servicio de Psicología y Orientación de EUNEIZ ofrece apoyo psicológico
        y orientación educativa a estudiantes que lo necesiten, especialmente a
        aquellos con necesidades específicas de apoyo educativo.
      </p>

      <h2>¿Qué ofrece este servicio?</h2>
      <div className="main-menu">
        <button className="main-menu-btn">
          Apoyo psicológico y acompañamiento emocional
        </button>
        <button className="main-menu-btn">
          Orientación educativa y personal
        </button>
        <button className="main-menu-btn">
          Informes para adaptaciones académicas
        </button>
        <button className="main-menu-btn">
          Derivación a recursos externos si es necesario
        </button>
      </div>

      <h2>¿A quién va dirigido?</h2>
      {blocks.map((b, index) => (
        <div key={index} className="tarjeta-comunidad">
          <button
            onClick={() =>
              setOpenBlock(openBlock === index ? null : index)
            }
            style={{
              background: "none",
              border: "none",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <h3>{b.title}</h3>
          </button>

          {openBlock === index && <p>{b.content}</p>}
        </div>
      ))}

      <h2>Funcionamiento del servicio</h2>
      <ul>
        <li>Atención mediante cita previa.</li>
        <li>No existe un horario fijo de consulta.</li>
        <li>Intervenciones breves y puntuales.</li>
        <li>En caso necesario, derivación a recursos externos.</li>
      </ul>

      <h2>Contacto</h2>
      <p>
        Para solicitar información o una cita, puedes escribir a:
      </p>
      <p style={{ fontWeight: "600" }}>
        orientacionalumnado@euneiz.com
      </p>

      <button
        className="main-menu-btn"
        style={{ marginTop: "1rem" }}
        onClick={() => setOpenForm(!openForm)}
      >
        {openForm ? "Cerrar formulario" : "Solicitar orientación"}
      </button>

      {openForm && (
        <div className="tarjeta-comunidad" style={{ marginTop: "1rem" }}>
          <input placeholder="Tu nombre" />
          <input placeholder="Carrera / Grado" />
          <select>
            <option>Motivo de consulta</option>
            <option>Dificultades de aprendizaje</option>
            <option>TDAH / TEA</option>
            <option>Bienestar emocional</option>
            <option>Otro</option>
          </select>
          <textarea placeholder="Cuéntanos brevemente tu situación (opcional)" />

          <a
            href="mailto:orientacionalumnado@euneiz.com"
            className="main-menu-btn"
            style={{ textDecoration: "none" }}
          >
            Enviar correo
          </a>
        </div>
      )}
    </div>
  );
}
