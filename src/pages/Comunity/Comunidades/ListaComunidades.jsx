import "../comunidad.css";
import { Link } from "react-router-dom";
import TarjetaComunidad from "./TarjetaComunidad.jsx";

export default function ListaComunidades() {
  const comunidades = [
    {
      id: 1,
      nombre: "Estudiantes de Multimedia",
      descripcion: "Grupo para compartir apuntes, recursos y dudas de clase.",
    },
    {
      id: 2,
      nombre: "Gente para estudiar en la biblioteca",
      descripcion: "Quedadas para estudiar juntos en la biblio de la uni.",
    },
    {
      id: 3,
      nombre: "Deporte y vida sana",
      descripcion: "Quedadas para fútbol, gym y actividades deportivas.",
    },
  ];

  return (
    <div className="comunidad-container">
      <h1>Comunidades de estudiantes</h1>

      <Link to="/comunidad/crear">
        <button className="main-menu-btn" style={{ marginBottom: "1.5rem" }}>
          Crear nueva comunidad
        </button>
      </Link>

      {comunidades.map((c) => (
        <TarjetaComunidad key={c.id} comunidad={c} />
      ))}
    </div>
  );
}
