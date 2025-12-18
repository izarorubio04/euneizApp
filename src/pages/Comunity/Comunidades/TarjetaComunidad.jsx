export default function TarjetaComunidad({ comunidad }) {
    return (
      <div className="tarjeta-comunidad">
        <h3>{comunidad.nombre}</h3>
        <p>{comunidad.descripcion}</p>
      </div>
    );
  }
  