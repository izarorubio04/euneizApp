export default function TarjetaCompeticion({ competicion }) {
    return (
      <div className="tarjeta-comunidad">
        <h3>{competicion.titulo}</h3>
        <p>{competicion.descripcion}</p>
        <p><strong>Fechas:</strong> {competicion.fecha}</p>
      </div>
    );
} 