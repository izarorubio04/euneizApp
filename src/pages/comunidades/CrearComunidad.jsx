import { useState } from "react";
import { db } from "../../lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function CrearComunidad() {
  // Paso actual
  const [paso, setPaso] = useState(1);

  // Datos del paso 1
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("");

  // Datos del paso 2
  const [creador, setCreador] = useState("");
  const [cargo, setCargo] = useState("");
  const [carrera, setCarrera] = useState("");

  async function crearComunidad() {
    try {
      await addDoc(collection(db, "comunidades"), {
        nombre,
        descripcion,
        categoria,
        creador,
        cargo,
        carrera,
        fecha: serverTimestamp()
      });

      alert("Comunidad creada correctamente");
    } catch (error) {
      alert("Error al crear la comunidad: " + error.message);
    }
  }

  return (
    <div className="comunidad-container">
      <h1>Crear comunidad</h1>

      {/* --------------------- PASO 1 --------------------- */}
      {paso === 1 && (
        <>
          <input
            type="text"
            placeholder="Nombre de la comunidad"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />

          <textarea
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />

          <input
            type="text"
            placeholder="Categoría (opcional)"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          />

          <button className="main-menu-btn" onClick={() => setPaso(2)}>
            Siguiente
          </button>
        </>
      )}

      {/* --------------------- PASO 2 --------------------- */}
      {paso === 2 && (
        <>
          <input
            type="text"
            placeholder="Tu nombre"
            value={creador}
            onChange={(e) => setCreador(e.target.value)}
          />

          <select
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            style={{ width: "100%", padding: "0.8rem", marginBottom: "1.2rem" }}
          >
            <option value="">Seleccionar cargo</option>
            <option value="Estudiante">Estudiante</option>
            <option value="Profesor">Profesor</option>
            <option value="Personal administrativo">Personal administrativo</option>
          </select>

          <input
            type="text"
            placeholder="Carrera (si eres estudiante)"
            value={carrera}
            onChange={(e) => setCarrera(e.target.value)}
          />

          {/* BOTONES */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <button
              className="main-menu-btn"
              style={{ backgroundColor: "#aaa" }}
              onClick={() => setPaso(1)}
            >
              Volver
            </button>

            <button className="main-menu-btn" onClick={crearComunidad}>
              Crear comunidad
            </button>
          </div>
        </>
      )}
    </div>
  );
}
