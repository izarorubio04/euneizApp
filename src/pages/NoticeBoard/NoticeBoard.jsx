import React, { useState, useEffect } from "react";
import "./NoticeBoard.css";

// Estado inicial por si localStorage está vacío
const INITIAL_STATE = [];

export const NoticeBoard = () => {
  // --- ESTADOS ---
  // Cargar anuncios desde localStorage al iniciar
  const [anuncios, setAnuncios] = useState(() => {
    // Verificamos si window está disponible (para evitar errores en SSR, aunque aquí es CSR)
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("anuncios");
      return saved ? JSON.parse(saved) : INITIAL_STATE;
    }
    return INITIAL_STATE;
  });

  const [view, setView] = useState("board"); // 'board' | 'form'
  const [editingId, setEditingId] = useState(null);
  
  // Filtros
  const [searchText, setSearchText] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Modales
  const [detailModal, setDetailModal] = useState(null); // Objeto anuncio o null
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Formulario
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    categoria: "varios",
    imagenURL: "https://via.placeholder.com/400x300?text=Sin+Imagen", // Default
  });

  // --- EFECTOS ---
  // Guardar en localStorage cada vez que 'anuncios' cambia
  useEffect(() => {
    localStorage.setItem("anuncios", JSON.stringify(anuncios));
  }, [anuncios]);

  // --- MANEJADORES ---

  // Manejo de inputs del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejo de imagen (FileReader)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, imagenURL: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Enviar formulario (Crear o Editar)
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validación de 140 palabras
    const wordCount = formData.descripcion.trim().split(/\s+/).length;
    if (wordCount > 140) {
      alert(`La descripción no puede exceder las 140 palabras. Actualmente tiene ${wordCount}.`);
      return;
    }

    if (editingId) {
      // MODO EDICIÓN
      const updatedAnuncios = anuncios.map((a) =>
        a.id === editingId ? { ...formData, id: editingId } : a
      );
      setAnuncios(updatedAnuncios);
    } else {
      // MODO CREACIÓN
      const newAnuncio = {
        ...formData,
        id: Date.now(),
      };
      setAnuncios([...anuncios, newAnuncio]);
    }

    // Resetear y volver
    resetForm();
    setView("board");
  };

  const handleEdit = (anuncio) => {
    setFormData(anuncio);
    setEditingId(anuncio.id);
    setView("form");
  };

  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este anuncio?")) {
      const filtered = anuncios.filter((a) => a.id !== id);
      setAnuncios(filtered);
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: "",
      descripcion: "",
      categoria: "varios",
      imagenURL: "https://via.placeholder.com/400x300?text=Sin+Imagen",
    });
    setEditingId(null);
  };

  // Filtrado
  const filteredAnuncios = anuncios.filter((anuncio) => {
    const textMatch =
      anuncio.titulo.toLowerCase().includes(searchText.toLowerCase()) ||
      anuncio.descripcion.toLowerCase().includes(searchText.toLowerCase());
    const catMatch = filterCategory === "" || anuncio.categoria === filterCategory;
    return textMatch && catMatch;
  });

  // --- RENDER ---

  return (
    <div className="notice-board-page">
      {/* Estilos inyectados temporalmente */}
      {/* VISTA 1: TABLERO */}
      {view === "board" && (
        <>
          <header className="notice-header">
            <h1>Tablón de Anuncios Universitario</h1>
            <input
              type="text"
              placeholder="Buscar anuncios..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">Todas las categorías</option>
              <option value="evento">Evento</option>
              <option value="venta">Venta</option>
              <option value="curso">Curso</option>
              <option value="varios">Varios</option>
            </select>
          </header>

          <main className="board-grid">
            {filteredAnuncios.length === 0 ? (
              <p className="empty-state">No hay anuncios que coincidan con tu búsqueda.</p>
            ) : (
              filteredAnuncios.map((anuncio) => (
                <div key={anuncio.id} className="notice-card">
                  <img
                    src={anuncio.imagenURL}
                    alt={anuncio.titulo}
                    className="card-img"
                    onClick={() => setDetailModal(anuncio)}
                    style={{ cursor: "pointer" }}
                  />
                  <div className="card-body">
                    <span className={`tag tag-${anuncio.categoria}`}>
                      {anuncio.categoria}
                    </span>
                    <h3>{anuncio.titulo}</h3>
                    <p className="card-desc">
                      {anuncio.descripcion.split(/\s+/).slice(0, 15).join(" ")}
                      {anuncio.descripcion.split(/\s+/).length > 15 && "..."}
                    </p>

                    <div className="card-actions">
                      {anuncio.categoria === "curso" && (
                        <button
                          className="btn btn-contactar"
                          onClick={() => setContactModalOpen(true)}
                        >
                          Contactar
                        </button>
                      )}
                      <button
                        className="btn btn-editar"
                        onClick={() => handleEdit(anuncio)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-eliminar"
                        onClick={() => handleDelete(anuncio.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </main>

          <button
            className="btn-flotante"
            onClick={() => {
              resetForm();
              setView("form");
            }}
          >
            +
          </button>
        </>
      )}

      {/* VISTA 2: FORMULARIO CREAR/EDITAR */}
      {view === "form" && (
        <section className="form-container">
          <h2>{editingId ? "Editar Anuncio" : "Crear Nuevo Anuncio"}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Título:</label>
              <input
                type="text"
                name="titulo"
                required
                value={formData.titulo}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>Descripción (máx 140 palabras):</label>
              <textarea
                name="descripcion"
                required
                value={formData.descripcion}
                onChange={handleInputChange}
              ></textarea>
            </div>

            <div className="form-group">
              <label>Categoría:</label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleInputChange}
              >
                <option value="evento">Evento</option>
                <option value="venta">Venta</option>
                <option value="curso">Curso</option>
                <option value="varios">Varios</option>
              </select>
            </div>

            <div className="form-group">
              <label>Imagen:</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} />
              {formData.imagenURL && (
                <img
                  src={formData.imagenURL}
                  alt="Vista previa"
                  style={{ width: "100px", marginTop: "10px", borderRadius: "8px" }}
                />
              )}
            </div>

            <button type="submit" className="btn btn-publicar">
              {editingId ? "Guardar Cambios" : "Publicar"}
            </button>
            <button
              type="button"
              className="btn btn-volver"
              onClick={() => {
                resetForm();
                setView("board");
              }}
            >
              Cancelar
            </button>
          </form>
        </section>
      )}

      {/* MODAL DETALLE ANUNCIO */}
      {detailModal && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setDetailModal(null)}>
              &times;
            </button>
            <img
              src={detailModal.imagenURL}
              alt={detailModal.titulo}
              className="modal-img"
            />
            <h3>{detailModal.titulo}</h3>
            <span className={`tag tag-${detailModal.categoria}`}>
              {detailModal.categoria}
            </span>
            <p style={{ marginTop: "15px", textAlign: "justify" }}>
              {detailModal.descripcion}
            </p>
          </div>
        </div>
      )}

      {/* MODAL CONTACTAR */}
      {contactModalOpen && (
        <div
          className="modal-overlay"
          onClick={() => setContactModalOpen(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-btn"
              onClick={() => setContactModalOpen(false)}
            >
              &times;
            </button>
            <h2>Interesado en el curso</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Mensaje enviado (simulado)");
                setContactModalOpen(false);
              }}
            >
              <div className="form-group">
                <input type="text" placeholder="Tu Nombre" required />
              </div>
              <div className="form-group">
                <input type="email" placeholder="Tu Email" required />
              </div>
              <div className="form-group">
                <textarea placeholder="Mensaje..." required></textarea>
              </div>
              <button type="submit" className="btn btn-publicar">
                Enviar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Exportamos por defecto para evitar errores de importación
export default NoticeBoard;