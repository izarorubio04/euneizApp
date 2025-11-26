import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ComunidadDetalle() {
  const { id } = useParams();
  const [comunidad, setComunidad] = useState(null);

  useEffect(() => {
    async function load() {
      const ref = doc(db, "comunidades", id);
      const snap = await getDoc(ref);
      if (snap.exists()) setComunidad(snap.data());
    }
    load();
  }, [id]);

  if (!comunidad) return <p>Cargando...</p>;

  return (
    <div className="comunidad-container">
      <h1>{comunidad.nombre}</h1>
      <p>{comunidad.descripcion}</p>
    </div>
  );
}
