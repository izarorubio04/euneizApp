import TarjetaClub from "../../components/TarjetaClub";

export default function ListaClubs() {
  const clubs = [
    { id: 1, nombre: "Club de Cine", descripcion: "Proyecciones y tertulias" },
    { id: 2, nombre: "Club de Esports", descripcion: "Torneos y gaming" }
  ];

  return (
    <div>
      {clubs.map(c => (
        <TarjetaClub key={c.id} club={c} />
      ))}
    </div>
  );
}
