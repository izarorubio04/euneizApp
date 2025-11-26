import { Link } from "react-router-dom";

export default function TarjetaComunidad({ comunidad }) {
  return (
    <Link to={`/comunidad/${comunidad.id}`}>
      <div className="tarjeta-comunidad">
        <h3>{comunidad.nombre}</h3>
        <p>{comunidad.descripcion}</p>
      </div>
    </Link>
  );
}
