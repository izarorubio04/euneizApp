import "../comunidad.css";
import { useParams } from "react-router-dom";

const clubsData = [
  {
    id: "radio",
    nombre: "Radio EUNEIZ",
    descripcion:
          "Espacio creativo dedicado a la comunicación y la radio universitaria.",
    reuniones: "Jueves a las 18:00",
    contacto: "radio@euneiz.com",
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
    id: "english",
    nombre: "English Corner",
    descripcion:
      "Punto de encuentro para practicar inglés de forma dinámica.",
    reuniones: "Miércoles 19:00",
    contacto: "enlish@euneiz.com",
  },

  {
    id: "music",
    nombre: "Coro EUNEIZ",
    descripcion:
      "Ensayos grupales, aprendizaje vocal y actuaciones en eventos académicos y culturales.",
    reuniones: "Miércoles 19:00",
    contacto: "music@euneiz.com",
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

