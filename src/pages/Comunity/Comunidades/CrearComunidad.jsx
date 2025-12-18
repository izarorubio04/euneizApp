import "../comunidad.css";
import { useState } from "react";

export default function CrearComunidad() {
  const [paso, setPaso] = useState(1);

  // Paso 1
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");

  // Paso 2
  const [creador, setCreador] = useState("");
  const [cargo, setCargo] = useState("");
  const [carrera, setCarrera] = useState("");

  const puedePasar = nombre.trim() !== "" && descripcion.trim() !== "";

  function handleCrear() {
    alert(
      "Comunidad creada (simulado):\n\n" +
        `Nombre: ${nombre}\n` +
        `Descripción: ${descripcion}\n` +
        `Creador: ${creador}\n` +
        `Cargo: ${cargo}\n` +
        `Carrera: ${carrera}`
    );
  }

  return (
    <div className="comunidad-container">
      <h1>Crear comunidad</h1>

      {paso === 1 && (
        <>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre de la comunidad"
          />

          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción de la comunidad"
          />

          <button
            className="main-menu-btn"
            onClick={() => setPaso(2)}
            disabled={!puedePasar}
          >
            Siguiente
          </button>
        </>
      )}

      {paso === 2 && (
        <>
          <input
            value={creador}
            onChange={(e) => setCreador(e.target.value)}
            placeholder="Nombre del creador"
          />

          <select
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
          >
            <option value="">Selecciona cargo en la uni</option>
            <option value="Estudiante">Estudiante</option>
            <option value="Profesor">Profesor</option>
            <option value="Personal">Personal de la uni</option>
          </select>

          <input
            value={carrera}
            onChange={(e) => setCarrera(e.target.value)}
            placeholder="Carrera (por ejemplo: Multimedia, Fisioterapia...)"
          />

          <button className="main-menu-btn" onClick={handleCrear}>
            Crear comunidad
          </button>
        </>
      )}
    </div>
  );
}
