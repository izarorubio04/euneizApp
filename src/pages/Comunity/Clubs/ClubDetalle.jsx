import "../comunidad.css";
import { useParams } from "react-router-dom";

const clubsData = [
  {
    id: "cine",
    nombre: "Club de Cine",
    descripcion:
      "Club centrado en cine y series. Organizamos proyecciones, debates y ciclos temáticos.",
    reuniones: "Jueves a las 18:00",
    contacto: "cine@euneiz.com",
  },
  {
    id: "esports",
    nombre: "Club de Esports",
    descripcion:
      "Equipo competitivo universitario. Torneos internos y participación en ligas.",
    reuniones: "Martes y viernes 17:00",
    contacto: "esports@euneiz.com",
  },
  {
    id: "lectura",
    nombre: "Club de Lectura",
    descripcion:
      "Lecturas conjuntas, clubs de libro y debates literarios.",
    reuniones: "Miércoles 19:00",
    contacto: "lectura@euneiz.com",
  },
];

export default function ClubDetalle() {
  const { id } = useParams();
  const club = clubsData.find((c) => c.id === id);

  if (!club) {
    return (
      <div className="comunidad-container">
        <h1>Club no encontrado</h1>
        <p>Este club no existe.</p>
      </div>
    );
  }

  return (
    <div className="comunidad-container">
      <h1>{club.nombre}</h1>
      <p>{club.descripcion}</p>
      <p><strong>Reuniones:</strong> {club.reuniones}</p>
      <p><strong>Contacto:</strong> {club.contacto}</p>
    </div>
  );
}

