import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import TarjetaComunidad from "../../components/TarjetaComunidad";

export default function ListaComunidades() {
  const [comunidades, setComunidades] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let timeout = false;

    // Si Firebase tarda más de 1 segundo → datos falsos
    const timer = setTimeout(() => {
      timeout = true;
      setComunidades([
        {
          id: "1",
          nombre: "Estudiantes de Multimedia",
          descripcion: "Grupo para compartir apuntes y dudas.",
        },
        {
          id: "2",
          nombre: "Gente para estudiar en la biblioteca",
          descripcion: "Quedadas y grupos de estudio.",
        },
        {
          id: "3",
          nombre: "Deporte y vida sana",
          descripcion: "Organización de actividades deportivas.",
        },
      ]);
      setCargando(false);
    }, 1000);

    async function load() {
      try {
        const ref = collection(db, "comunidades");
        const snap = await getDocs(ref);

        // Si aún no saltó el timeout
        if (!timeout) {
          clearTimeout(timer);

          if (snap.empty) {
            setComunidades([
              {
                id: "1",
                nombre: "Estudiantes de Multimedia",
                descripcion: "Grupo para compartir apuntes y dudas.",
              },
              {
                id: "2",
                nombre: "Gente para estudiar en la biblioteca",
                descripcion: "Quedadas y grupos de estudio.",
              },
              {
                id: "3",
                nombre: "Deporte y vida sana",
                descripcion: "Organización de actividades deportivas.",
              },
            ]);
          } else {
            setComunidades(
              snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
            );
          }

          setCargando(false);
        }
      } catch (error) {
        console.error("Error Firebase:", error);

        // Si Firebase falla, mostramos los datos falsos rápidamente
        if (!timeout) {
          clearTimeout(timer);
          setComunidades([
            {
              id: "1",
              nombre: "Estudiantes de Multimedia",
              descripcion: "Grupo para compartir apuntes y dudas.",
            },
            {
              id: "2",
              nombre: "Gente para estudiar en la biblioteca",
              descripcion: "Quedadas y grupos de estudio.",
            },
            {
              id: "3",
              nombre: "Deporte y vida sana",
              descripcion: "Organización de actividades deportivas.",
            },
          ]);
          setCargando(false);
        }
      }
    }

    load();
  }, []);

  if (cargando) return <p className="comunidad-container">Cargando comunidades...</p>;

  return (
    <div className="comunidad-container">
      <h1>Comunidades</h1>

      <Link to="/comunidad/crear">
        <button className="main-menu-btn" style={{ marginBottom: "2rem" }}>
          Crear nueva comunidad
        </button>
      </Link>

      {comunidades.map((c) => (
        <TarjetaComunidad key={c.id} comunidad={c} />
      ))}
    </div>
  );
}
