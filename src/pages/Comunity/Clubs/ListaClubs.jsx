import "../comunidad.css";
import TarjetaClub from "./TarjetaClub.jsx";

export default function ListaClubs() {
  const clubs = [
    {
      id: "cine",
      nombre: "Club de Cine",
      descripcion: "Proyecciones, tertulias y análisis de pelis y series.",
    },
    {
      id: "esports",
      nombre: "Club de Esports",
      descripcion: "Torneos de gaming y equipo competitivo de la uni.",
    },
    {
      id: "lectura",
      nombre: "Club de Lectura",
      descripcion: "Lecturas conjuntas y debates sobre libros.",
    },
  ];

  return (
    <div className="comunidad-container">
      <h1>Clubs oficiales</h1>

      {clubs.map((club) => (
        <TarjetaClub key={club.id} club={club} />
      ))}
    </div>
  );
}
