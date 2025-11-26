import { useParams } from "react-router-dom";

export default function ClubDetalle() {
  const { id } = useParams();

  return (
    <div className="comunidad-container">
      <h1>Club {id}</h1>
      <p>Información detallada del club.</p>
    </div>
  );
}
