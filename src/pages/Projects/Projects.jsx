import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

// Firebase imports:
import { db } from "../../firebase/config";
import { 
  collection, addDoc, deleteDoc, updateDoc, 
  doc, onSnapshot, query, orderBy 
} from "firebase/firestore";

// Componentes propios
import PageHeader from "../../components/UI/PageHeader";
import Modal from "../../components/UI/Modal";
import "./Projects.css";

// Iconos de la interfaz (Lucide es más ligero que FontAwesome)
import { 
  Search, Filter, Plus, ExternalLink, Users, 
  CheckCircle, Trash2, Clock, ChevronDown, Image as ImageIcon
} from "lucide-react";

// Lista estática de grados para el select (así es fácil añadir nuevos en el futuro)
const DEGREES = [
  "Multimedia",
  "Desarrollo de Videojuegos",
  "Arte en Videojuegos",
  "Ciberseguridad",
  "Fisioterapia",
  "CFYD"
];

export default function Proyectos() {
  // Obtenemos el usuario actual y si es admin desde nuestro contexto personalizado
  const { user, isAdmin } = useAuth();

  // --- ESTADOS LOCALES ---
  // Guardamos la lista completa de proyectos traída de Firebase
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para los filtros (Búsqueda por texto y Select de grado)
  const [searchText, setSearchText] = useState("");
  const [filterDegree, setFilterDegree] = useState("");

  // Control del Modal de "Subir Proyecto"
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado del formulario: Inicializamos vacío
  const [form, setForm] = useState({
    title: "", desc: "", degree: "", creators: "", link: "", image: ""
  });

  // 1. CARGA DE DATOS (Real-time)
  // Usamos useEffect con onSnapshot para mantener la lista actualizada al momento.
  // Si un compañero sube algo, me aparece sin recargar la página.
  useEffect(() => {
    // Ordenamos por fecha descendente para que los nuevos salgan arriba
    const q = query(collection(db, "projects"), orderBy("date", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Mapeamos los documentos para incluir el ID de Firestore en nuestro objeto
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(docs);
      setLoading(false);
    });
    
    // Cleanup: Desuscribirse al desmontar para evitar fugas de memoria
    return () => unsubscribe();
  }, []);

  // 2. LÓGICA DE FILTRADO Y PERMISOS
  // Filtramos la lista 'projects' en cada render según los inputs.
  // Es mejor filtrar en cliente que hacer muchas peticiones a Firebase si no hay miles de datos.
  const filteredProjects = projects.filter(p => {
    // Control de visibilidad para proyectos pendientes:
    // Solo se ven si ya están aprobados, O si soy Admin, O si soy el dueño del proyecto.
    const isOwner = user && p.authorEmail === user.email;
    if (p.status === "pending" && !isAdmin && !isOwner) return false;

    // Filtro de texto (Título, descripción o autores) - Case insensitive
    const textMatch = 
      p.title.toLowerCase().includes(searchText.toLowerCase()) ||
      p.desc.toLowerCase().includes(searchText.toLowerCase()) ||
      p.creators.toLowerCase().includes(searchText.toLowerCase());

    // Filtro de grado (Si hay uno seleccionado)
    const degreeMatch = filterDegree ? p.degree === filterDegree : true;

    return textMatch && degreeMatch;
  });

  // 3. HANDLERS (Manejadores de eventos)
  
  // Enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.desc || !form.degree || !form.link) return alert("Rellena los campos obligatorios");

    try {
      // Si soy admin, se aprueba directo. Si soy alumno, va a moderación.
      const initialStatus = isAdmin ? "approved" : "pending"; 

      await addDoc(collection(db, "projects"), {
        ...form,
        authorEmail: user.email,
        date: Date.now(),
        status: initialStatus
      });

      setIsModalOpen(false);
      // Limpiamos form
      setForm({ title: "", desc: "", degree: "", creators: "", link: "", image: "" });
      
      if (initialStatus === "pending") {
        alert("✅ Solicitud enviada. Un administrador revisará tu proyecto.");
      }

    } catch (err) {
      console.error("Error al publicar:", err);
      alert("Hubo un error al guardar el proyecto.");
    }
  };

  // Borrar proyecto (Solo admins o el dueño)
  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este proyecto permanentemente?")) {
      await deleteDoc(doc(db, "projects", id));
    }
  };

  // Aprobar proyecto (Solo admins)
  const handleApprove = async (id) => {
    await updateDoc(doc(db, "projects", id), { status: "approved" });
  };

  if (loading) return <div className="proj-container" style={{padding: '2rem'}}>Cargando proyectos...</div>;

  return (
    <div className="proj-container">
      
      {/* HEADER: Componente reutilizable para mantener consistencia visual */}
      <PageHeader 
        title="Proyectos de Alumnos" 
        subtitle="Galería de trabajos, TFG y portfolio de la comunidad EUNEIZ." 
      />

      {/* BARRA DE HERRAMIENTAS (Buscador + Filtro) */}
      <div className="proj-filters-bar">
        <div className="search-box">
          <Search size={18} className="search-icon"/>
          <input 
            type="text" 
            placeholder="Buscar por título, creador..." 
            value={searchText} 
            onChange={(e) => setSearchText(e.target.value)} 
          />
        </div>
        
        <div className="filter-select-wrapper">
          <Filter size={16} className="filter-icon" />
          <select value={filterDegree} onChange={(e) => setFilterDegree(e.target.value)}>
            <option value="">Todos los grados</option>
            {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <ChevronDown size={14} className="select-arrow" />
        </div>
      </div>

      {/* GRID DE RESULTADOS */}
      <div className="proj-grid">
        {filteredProjects.map(project => (
          <div key={project.id} className={`proj-card ${project.status === 'pending' ? 'is-pending' : ''}`}>
            
            {/* Columna Izquierda: Imagen o Placeholder */}
            <div className="card-media">
              {project.image ? (
                <img src={project.image} alt={project.title} />
              ) : (
                <div className="placeholder-img"><ImageIcon size={40} opacity={0.3} /></div>
              )}
              {/* Badge visual si está pendiente de aprobar */}
              {project.status === 'pending' && <span className="badge-pending">En Revisión</span>}
            </div>

            {/* Columna Derecha: Información */}
            <div className="card-content">
              <div className="card-meta-top">
                <span className="degree-tag">{project.degree}</span>
                <span className="date-text"><Clock size={12}/> {new Date(project.date).toLocaleDateString()}</span>
              </div>

              <h3 className="card-title">{project.title}</h3>
              <p className="card-desc">{project.desc}</p>

              <div className="creators-row">
                <Users size={16} className="icon-sub" />
                <span>Autoría: <strong>{project.creators || "Anónimo"}</strong></span>
              </div>

              <div className="card-footer">
                <a href={project.link} target="_blank" rel="noopener noreferrer" className="btn-visit">
                  Ver Proyecto <ExternalLink size={16} />
                </a>

                {/* Botones de Admin / Dueño */}
                {(isAdmin || (user && project.authorEmail === user.email)) && (
                  <div className="admin-actions-mini">
                    {isAdmin && project.status === 'pending' && (
                      <button className="btn-icon approve" onClick={() => handleApprove(project.id)} title="Aprobar publicación">
                        <CheckCircle size={20} />
                      </button>
                    )}
                    <button className="btn-icon delete" onClick={() => handleDelete(project.id)} title="Eliminar">
                      <Trash2 size={20} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Feedback si no hay resultados */}
        {filteredProjects.length === 0 && (
          <div className="empty-state">No se encontraron proyectos con estos filtros.</div>
        )}
      </div>

      {/* BOTÓN FLOTANTE (FAB) PARA AÑADIR */}
      <button className="fab-add" onClick={() => setIsModalOpen(true)} title="Subir Proyecto">
        <Plus size={32} />
      </button>

      {/* MODAL DE SUBIDA */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Subir Proyecto"
      >
        <p className="modal-subtitle">Comparte tu trabajo con la comunidad</p>
        
        <form onSubmit={handleSubmit} className="proj-form">
          <div className="form-group">
            <label>Título del proyecto</label>
            <input 
              value={form.title} 
              onChange={e => setForm({...form, title: e.target.value})} 
              placeholder="Ej: Rediseño App EUNEIZ" 
              required 
            />
          </div>
          
          <div className="form-row">
             <div className="form-group">
                <label>Grado</label>
                <div className="select-wrapper-form">
                    <select value={form.degree} onChange={e => setForm({...form, degree: e.target.value})} required>
                    <option value="">Selecciona...</option>
                    {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <ChevronDown size={14} className="arrow-form"/>
                </div>
             </div>
             <div className="form-group">
                <label>Creador(es)</label>
                <input value={form.creators} onChange={e => setForm({...form, creators: e.target.value})} placeholder="Nombres y Apellidos" />
             </div>
          </div>

          <div className="form-group">
            <label>Descripción completa</label>
            <textarea rows={5} value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} placeholder="Describe detalladamente de qué trata el proyecto..." required />
          </div>

          <div className="form-group">
            <label>Enlace al proyecto (Web, PDF, GitHub...)</label>
            <div className="input-icon-group">
                <ExternalLink size={16} className="input-icon"/>
                <input value={form.link} onChange={e => setForm({...form, link: e.target.value})} placeholder="https://..." required />
            </div>
          </div>

          <div className="form-group">
            <label>URL Imagen Portada (Opcional)</label>
            <div className="input-icon-group">
                <ImageIcon size={16} className="input-icon"/>
                <input value={form.image} onChange={e => setForm({...form, image: e.target.value})} placeholder="https://..." />
            </div>
          </div>

          <button type="submit" className="btn-submit-proj">
            {isAdmin ? "Publicar Ahora" : "Enviar Solicitud"}
          </button>
        </form>
      </Modal>
    </div>
  );
}