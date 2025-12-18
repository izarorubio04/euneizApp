import React, { useState, useEffect } from "react";
import "./NoticeBoard.css";

// Estado inicial por si localStorage está vacío
const INITIAL_STATE = [];

export const NoticeBoard = () => {
  // --- ESTADOS ---
  const [anuncios, setAnuncios] = useState(() => {
    try {
      const saved = localStorage.getItem("anuncios");
      return saved ? JSON.parse(saved) : INITIAL_STATE;
    } catch (e) {
      return INITIAL_STATE;
    }
  });

  const [view, setView] = useState("board"); // 'board' | 'form'
  const [editingId, setEditingId] = useState(null);

  // Filtros
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    dateFrom: "",
    dateTo: ""
  });

  // Formulario
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    categoria: "varios",
    mediaURL: "",
    mediaType: "image", // 'image', 'video', 'youtube', 'link'
    thumbnailUrl: ""
  });

  // Modales
  const [detailModal, setDetailModal] = useState(null); // Objeto anuncio o null
  const [contactModal, setContactModal] = useState(false);

  // --- EFECTOS ---
  useEffect(() => {
    localStorage.setItem("anuncios", JSON.stringify(anuncios));
  }, [anuncios]);

  // --- HELPERS MEDIA ---
  const getYoutubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    return match ? match[1] : null;
  };

  const determineMediaType = (url) => {
    if (!url) return "image";
    if (getYoutubeId(url)) return "youtube";
    if (/\.(jpeg|jpg|gif|png|webp|bmp|svg)(\?.*)?$/i.test(url)) return "image";
    if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)) return "video";
    return "link";
  };

  // --- HANDLERS FORMULARIO ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-detectar mediaType si cambia la URL principal
    if (name === "mediaURL") {
        const type = determineMediaType(value);
        setFormData(prev => ({ ...prev, mediaType: type }));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith("video/")) {
      alert("Los videos locales son muy pesados para este sistema. Por favor usa una URL externa (YouTube/Drive).");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData(prev => ({
        ...prev,
        mediaURL: ev.target.result,
        mediaType: file.type.startsWith("image/") ? "image" : "link"
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validación 140 palabras
    const words = formData.descripcion.trim().split(/\s+/).filter(Boolean);
    if (words.length > 140) {
      alert(`La descripción excede el límite. Tienes ${words.length} palabras (máx 140).`);
      return;
    }

    const newAnuncio = {
      ...formData,
      id: editingId || Date.now(),
      fecha: editingId ? (anuncios.find(a => a.id === editingId)?.fecha || Date.now()) : Date.now(),
      fijado: editingId ? (anuncios.find(a => a.id === editingId)?.fijado || false) : false,
      mediaURL: formData.mediaURL || "img/default.jpg"
    };

    if (editingId) {
      setAnuncios(anuncios.map(a => a.id === editingId ? newAnuncio : a));
    } else {
      setAnuncios([...anuncios, newAnuncio]);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      titulo: "",
      descripcion: "",
      categoria: "varios",
      mediaURL: "",
      mediaType: "image",
      thumbnailUrl: ""
    });
    setEditingId(null);
    setView("board");
  };

  // --- HANDLERS ACCIONES ---
  const handleDelete = (id) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este anuncio?")) {
      setAnuncios(anuncios.filter(a => a.id !== id));
    }
  };

  const handleEdit = (anuncio) => {
    setFormData(anuncio);
    setEditingId(anuncio.id);
    setView("form");
  };

  const handleTogglePin = (id) => {
    setAnuncios(anuncios.map(a => 
      a.id === id ? { ...a, fijado: !a.fijado } : a
    ));
  };

  // --- FILTRADO Y ORDENACIÓN ---
  const getFilteredAnuncios = () => {
    let result = anuncios;

    // Filtros
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(a => 
        a.titulo.toLowerCase().includes(term) || 
        a.descripcion.toLowerCase().includes(term)
      );
    }
    if (filters.category) {
      result = result.filter(a => a.categoria === filters.category);
    }
    if (filters.dateFrom) {
      result = result.filter(a => a.fecha >= new Date(filters.dateFrom).getTime());
    }
    if (filters.dateTo) {
      // Sumar 1 día para incluir el día final completo
      result = result.filter(a => a.fecha <= new Date(filters.dateTo).getTime() + 86400000);
    }

    // Ordenación: Fijados primero, luego por fecha descendente
    return result.sort((a, b) => {
      if (a.fijado && !b.fijado) return -1;
      if (!a.fijado && b.fijado) return 1;
      return b.fecha - a.fecha;
    });
  };

  return (
    <div className="notice-board-page">      
      {/* VISTA 1: TABLERO */}
      {view === "board" && (
        <>
          <header className="notice-header">
            <h1>Tablón de Anuncios Universitario</h1>
            
            <div className="filtros-container">
              <input 
                type="text" 
                placeholder="Buscar anuncios..." 
                className="filter-input filter-search"
                value={filters.search}
                onChange={e => setFilters({...filters, search: e.target.value})}
              />
              
              <select 
                className="filter-input filter-select"
                value={filters.category}
                onChange={e => setFilters({...filters, category: e.target.value})}
              >
                <option value="">Todas las categorías</option>
                <option value="evento">Evento</option>
                <option value="venta">Venta</option>
                <option value="curso">Curso</option>
                <option value="varios">Varios</option>
              </select>

              <div className="filtros-fecha">
                <label>Desde: 
                  <input 
                    type="date" 
                    className="filter-input"
                    value={filters.dateFrom} 
                    onChange={e => setFilters({...filters, dateFrom: e.target.value})} 
                  />
                </label>
                <label>Hasta: 
                  <input 
                    type="date" 
                    className="filter-input"
                    value={filters.dateTo} 
                    onChange={e => setFilters({...filters, dateTo: e.target.value})} 
                  />
                </label>
              </div>
            </div>
          </header>

          <main className="board-grid">
            {getFilteredAnuncios().length === 0 ? (
              <p className="empty-state">No hay anuncios que coincidan con tu búsqueda.</p>
            ) : (
              getFilteredAnuncios().map(anuncio => (
                <NoticeCard 
                  key={anuncio.id} 
                  anuncio={anuncio}
                  onEdit={() => handleEdit(anuncio)}
                  onDelete={() => handleDelete(anuncio.id)}
                  onPin={() => handleTogglePin(anuncio.id)}
                  onClick={() => setDetailModal(anuncio)}
                  onContact={() => setContactModal(true)}
                />
              ))
            )}
          </main>

          <button className="btn-flotante" onClick={() => setView("form")}>
            +
          </button>
        </>
      )}

      {/* VISTA 2: FORMULARIO */}
      {view === "form" && (
        <div className="form-wrapper">
          <header className="notice-header">
            <h1>{editingId ? "Editar Anuncio" : "Crear Nuevo Anuncio"}</h1>
          </header>
          
          <section className="form-container">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Título</label>
                <input 
                  type="text" 
                  name="titulo" 
                  className="form-input" 
                  required 
                  value={formData.titulo}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea 
                  name="descripcion" 
                  className="form-input" 
                  required 
                  value={formData.descripcion}
                  onChange={handleInputChange}
                />
                <p className="form-hint">Máximo 140 palabras.</p>
              </div>

              <div className="form-group">
                <label>Categoría</label>
                <select 
                  name="categoria" 
                  className="form-input" 
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
                <label>Multimedia</label>
                <input 
                  type="text" 
                  name="mediaURL" 
                  placeholder="Pegar URL de imagen, YouTube o video" 
                  className="form-input"
                  value={formData.mediaURL}
                  onChange={handleInputChange}
                />
                <p className="form-hint">O sube una imagen local:</p>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="form-input" />
              </div>

              {/* Miniatura manual solo para videos directos */}
              {formData.mediaType === "video" && (
                <div className="form-group" style={{border: '2px solid #4CAF50', padding: '10px', borderRadius: '8px', background: '#e8f5e9'}}>
                  <label>Miniatura para Video (URL opcional)</label>
                  <input 
                    type="text" 
                    name="thumbnailUrl"
                    className="form-input"
                    value={formData.thumbnailUrl}
                    onChange={handleInputChange}
                    placeholder="https://... (URL de imagen)"
                  />
                  <p className="form-hint">Imagen que se mostrará en el tablón antes de reproducir.</p>
                </div>
              )}

              {/* Previsualización en Formulario */}
              {formData.mediaURL && (
                <div className="preview-box">
                  <p style={{fontWeight: 'bold', color: '#ff6b6b'}}>Previsualización:</p>
                  <MediaDisplay 
                    url={formData.mediaURL} 
                    type={formData.mediaType} 
                    thumbnail={formData.thumbnailUrl} 
                    inModal={false}
                  />
                </div>
              )}

              <div className="form-buttons">
                <button type="submit" className="btn-submit">
                  {editingId ? "Guardar Cambios" : "Publicar"}
                </button>
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* MODAL DETALLE */}
      {detailModal && (
        <div className="modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-icon" onClick={() => setDetailModal(null)}>&times;</button>
            
            <MediaDisplay 
              url={detailModal.mediaURL} 
              type={detailModal.mediaType} 
              thumbnail={detailModal.thumbnailUrl} 
              inModal={true}
            />
            
            <h3>{detailModal.titulo}</h3>
            <span className={`tag tag-${detailModal.categoria}`}>{detailModal.categoria}</span>
            <p style={{marginTop: '15px', textAlign: 'left', lineHeight: '1.6'}}>{detailModal.descripcion}</p>
          </div>
        </div>
      )}

      {/* MODAL CONTACTAR */}
      {contactModal && (
        <div className="modal-overlay" onClick={() => setContactModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close-icon" onClick={() => setContactModal(false)}>&times;</button>
            <h2 style={{color: '#ff6b6b'}}>Interesado en el anuncio</h2>
            <form onSubmit={(e) => { e.preventDefault(); alert("¡Formulario enviado con éxito!"); setContactModal(false); }}>
              <div className="form-group">
                <input type="text" className="form-input" placeholder="Tu Nombre" required />
              </div>
              <div className="form-group">
                <input type="email" className="form-input" placeholder="Tu Email" required />
              </div>
              <div className="form-group">
                <textarea className="form-input" placeholder="Mensaje..." required></textarea>
              </div>
              <button type="submit" className="btn-submit">Enviar</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// --- SUBCOMPONENTES ---

const NoticeCard = ({ anuncio, onEdit, onDelete, onPin, onClick, onContact }) => {
  const shortDesc = anuncio.descripcion.split(/\s+/).slice(0, 15).join(" ") + "...";
  
  // Decidir qué mostrar en la tarjeta (siempre miniatura o imagen)
  let displayImage = anuncio.mediaURL;
  
  if (anuncio.mediaType === "youtube") {
    const ytId = anuncio.mediaURL.match(/embed\/([A-Za-z0-9_-]{6,})/)?.[1] || 
                 anuncio.mediaURL.match(/v=([A-Za-z0-9_-]{6,})/)?.[1];
    displayImage = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  } else if (anuncio.mediaType === "video") {
    // Si es video, priorizamos la miniatura manual, si no, placeholder
    displayImage = anuncio.thumbnailUrl || "https://placehold.co/600x400?text=Video";
  }

  return (
    <div className="notice-card" onClick={onClick}>
      <button 
        className={`btn-fijar ${anuncio.fijado ? 'fijado' : ''}`} 
        onClick={(e) => { e.stopPropagation(); onPin(); }}
        title="Fijar anuncio"
      >
        📌
      </button>
      
      <div className="card-media">
        <img 
          src={displayImage} 
          alt="Media" 
          className="card-img" 
          onError={(e) => e.target.src = 'https://placehold.co/600x400?text=Sin+Imagen'} 
        />
        {(anuncio.mediaType === "video" || anuncio.mediaType === "youtube") && (
          <div className="play-overlay">▶</div>
        )}
      </div>

      <div className="card-body">
        <span className={`tag tag-${anuncio.categoria}`}>{anuncio.categoria}</span>
        <h3>{anuncio.titulo}</h3>
        <p className="card-desc">{shortDesc}</p>
        
        <div className="card-actions">
          {anuncio.categoria === "curso" && (
            <button className="action-btn btn-contactar" onClick={(e) => { e.stopPropagation(); onContact(); }}>Contactar</button>
          )}
          <button className="action-btn btn-editar" onClick={(e) => { e.stopPropagation(); onEdit(); }}>Editar</button>
          <button className="action-btn btn-eliminar" onClick={(e) => { e.stopPropagation(); onDelete(); }}>Eliminar</button>
        </div>
      </div>
    </div>
  );
};

// Componente para visualizar Media (Video, YouTube, Img) de forma segura
const MediaDisplay = ({ url, type, thumbnail, inModal }) => {
  if (type === "youtube") {
    let embedSrc = url;
    // Asegurar formato embed
    if (!url.includes("embed")) {
       const ytId = url.match(/v=([A-Za-z0-9_-]{6,})/)?.[1] || url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/)?.[1];
       if (ytId) embedSrc = `https://www.youtube.com/embed/${ytId}`;
    }
    return (
      <iframe 
        width="100%" height={inModal ? "300" : "200"} 
        src={embedSrc} 
        frameBorder="0" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowFullScreen
        style={{borderRadius: '12px'}}
        title="YouTube video"
      ></iframe>
    );
  }

  if (type === "video") {
    return (
      <video controls width="100%" className="preview-media" style={{maxHeight: inModal ? '400px' : '200px', borderRadius: '12px'}}>
        <source src={url} type="video/mp4" />
        Tu navegador no soporta el elemento de video.
      </video>
    );
  }

  // Por defecto imagen o link
  return (
    <img 
        src={url} 
        alt="Media" 
        className="preview-media" 
        style={{width: '100%', maxHeight: inModal ? '400px' : '200px', objectFit: 'contain', borderRadius: '12px'}}
        onError={(e) => e.target.src = 'https://placehold.co/600x400?text=Sin+Imagen'}
    />
  );
};

export default NoticeBoard;