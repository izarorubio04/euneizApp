export default function TarjetaClub({ club }) {
    return (
      <div className="tarjeta-club">
        <h3>{club.nombre}</h3>
        <p>{club.descripcion}</p>
      </div>
    );
  }
  