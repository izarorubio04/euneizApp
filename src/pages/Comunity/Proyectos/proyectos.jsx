import React, { useEffect, useMemo, useState } from "react";
import "../Proyectos/proyectos.css";
import { useAuth } from "../../../context/AuthContext";

/* ================== CONSTANTES ================== */

const DEGREES = [
  "Grado en multimedia",
  "Grado en Enfermería",
  "Grado en Fisioterapia",
  "Grado en Psicología",
  "Grado en Ciencias de la Actividad Física y del Deporte",
  "Grado en Ingeniería Informática",
  "Grado en Ingeniería Biomédica",
  "Grado en Diseño y Desarrollo de Videojuegos",
  "Grado en Ciencia de Datos e Inteligencia Artificial",
  "Grado en Marketing",
  "Grado en Administración y Dirección de Empresas (ADE)",
];

const STORAGE_KEY = "studentProjects";

/* ================== HELPERS ================== */

function getYouTubeId(url) {
  const match =
    url.match(/youtu\.be\/([^?]+)/) ||
    url.match(/[?&]v=([^&]+)/) ||
    url.match(/youtube\.com\/embed\/([^?]+)/);
  return match ? match[1] : null;
}

function buildEmbedUrl(id) {
  return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}`;
}

function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

/* ================== COMPONENTE ================== */

export default function Proyectos() {
  const { user } = useAuth();

  const [projects, setProjects] = useState([]);
  const [hoverId, setHoverId] = useState(null);
  const [selected, setSelected] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    degree: "",
    date: "",
    description: "",
    mediaUrl: "",
    mediaFile: null,
  });

  /* ================== LOAD ================== */

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    setProjects(saved);
  }, []);

  const saveProjects = (data) => {
    setProjects(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  /* ================== SUBMIT ================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.degree || !form.date) {
      alert("Completa los campos obligatorios");
      return;
    }

    let mediaType = null;
    let mediaUrl = "";
    let youtubeId = null;

    if (form.mediaFile) {
      mediaType = "image";
      mediaUrl = await fileToBase64(form.mediaFile);
    } else {
      youtubeId = getYouTubeId(form.mediaUrl);
      if (!youtubeId) {
        alert("Sube una imagen/gif o un vídeo de YouTube válido");
        return;
      }
      mediaType = "youtube";
      mediaUrl = form.mediaUrl;
    }

    const newProject = {
      id: crypto.randomUUID(),
      title: form.title,
      degree: form.degree,
      date: form.date,
      description: form.description,
      mediaType,
      mediaUrl,
      youtubeId,
      author: user?.email || "anonimo",
      createdAt: Date.now(),
    };

    saveProjects([newProject, ...projects]);
    setModalOpen(false);
    setForm({
      title: "",
      degree: "",
      date: "",
      description: "",
      mediaUrl: "",
      mediaFile: null,
    });
  };

  /* ================== DELETE ================== */

  const deleteProject = (id) => {
    if (!confirm("¿Eliminar proyecto?")) return;
    saveProjects(projects.filter((p) => p.id !== id));
  };

  /* ================== RENDER ================== */

  return (
    <div className="projects-page">
      <h1>Proyectos de alumnos</h1>

      <div className="projects-grid">
        {projects.map((p) => (
          <article
            key={p.id}
            className="project-card"
            onMouseEnter={() => setHoverId(p.id)}
            onMouseLeave={() => setHoverId(null)}
            onClick={() => setSelected(p)}
          >
            <div className="project-media">
              {p.mediaType === "youtube" ? (
                hoverId === p.id ? (
                  <iframe
                    src={buildEmbedUrl(p.youtubeId)}
                    allow="autoplay"
                  />
                ) : (
                  <div className="project-placeholder">▶</div>
                )
              ) : (
                <img src={p.mediaUrl} />
              )}
            </div>

            <div className="project-info">
              <h3>{p.title}</h3>
              <span>{p.degree}</span>
              <span>{p.date}</span>

              {user?.email === p.author && (
                <button
                  className="project-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProject(p.id);
                  }}
                >
                  🗑 Eliminar
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {/* BOTÓN AÑADIR */}
      <button className="floating-add-btn" onClick={() => setModalOpen(true)}>
        ➕
      </button>

      {/* MODAL ADD */}
      {modalOpen && (
        <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Añadir proyecto</h2>
            <form onSubmit={handleSubmit}>
              <input
                placeholder="Nombre"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />

              <select
                value={form.degree}
                onChange={(e) => setForm({ ...form, degree: e.target.value })}
              >
                <option value="">Selecciona grado</option>
                {DEGREES.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>

              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />

              <textarea
                placeholder="Descripción"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              <input
                placeholder="URL YouTube (opcional)"
                value={form.mediaUrl}
                onChange={(e) =>
                  setForm({ ...form, mediaUrl: e.target.value })
                }
              />

              <input
                type="file"
                accept="image/*,gif"
                onChange={(e) =>
                  setForm({ ...form, mediaFile: e.target.files[0] })
                }
              />

              <button type="submit">Publicar</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <h2>{selected.title}</h2>
            <p>{selected.description}</p>

            {selected.mediaType === "youtube" ? (
              <iframe
                src={`https://www.youtube.com/embed/${selected.youtubeId}`}
                allow="autoplay; encrypted-media"
              />
            ) : (
              <img src={selected.mediaUrl} />
            )}

            <button onClick={() => setSelected(null)}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}


