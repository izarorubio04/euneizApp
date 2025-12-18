import { Link } from "react-router-dom";

export default function TarjetaClub({ club }) {
  return (
    <Link to={`/clubs/${club.id}`}>
      <div className="tarjeta-comunidad">
        <h3>{club.nombre}</h3>
        <p>{club.descripcion}</p>
      </div>
    </Link>
  );
}