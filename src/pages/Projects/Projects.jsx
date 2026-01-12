import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from "firebase/firestore";
import "./Projects.css";

// ICONOS LUCIDE (Estilo unificado)
import { 
  Search, 
  Filter, 
  Plus, 
  ExternalLink, 
  Users, 
  CheckCircle, 
  Trash2,
  Clock,
  ChevronDown,
  Image as ImageIcon
} from "lucide-react";

const DEGREES = [
  "Multimedia",
  "Desarrollo de Videojuegos",
  "Arte en Videojuegos",
  "Ciberseguridad",
  "Fisioterapia",
  "CFYD"
];

export default function Proyectos() {
  const { user,isAdmin } = useAuth();

  // Estados
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchText, setSearchText] = useState("");
  const [filterDegree, setFilterDegree] = useState("");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    desc: "",
    degree: "",
    creators: "",
    link: "",
    image: ""
  });

  // Carga de datos
  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Lógica de filtrado y visibilidad (Admin ve pendientes, usuarios no)
  const filteredProjects = projects.filter(p => {
    // 1. Visibilidad
    const isOwner = user && p.authorEmail === user.email;
    if (p.status === "pending" && !isAdmin && !isOwner) return false;

    // 2. Filtro Texto (Búsqueda amplia)
    const textMatch = 
      p.title.toLowerCase().includes(searchText.toLowerCase()) ||
      p.desc.toLowerCase().includes(searchText.toLowerCase()) ||
      p.creators.toLowerCase().includes(searchText.toLowerCase());

    // 3. Filtro Grado
    const degreeMatch = filterDegree ? p.degree === filterDegree : true;

    return textMatch && degreeMatch;
  });

  // Acciones
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.desc || !form.degree || !form.link) return alert("Rellena los campos obligatorios");

    try {
      const initialStatus = isAdmin ? "approved" : "pending"; // Admin publica directo, alumno solicita

      await addDoc(collection(db, "projects"), {
        ...form,
        authorEmail: user.email,
        date: Date.now(),
        status: initialStatus
      });

      setIsModalOpen(false);
      setForm({ title: "", desc: "", degree: "", creators: "", link: "", image: "" });
      if (initialStatus === "pending") alert("✅ Solicitud enviada. Un administrador revisará tu proyecto.");

    } catch (err) {
      console.error(err);
      alert("Error al publicar");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Eliminar proyecto?")) await deleteDoc(doc(db, "projects", id));
  };

  const handleApprove = async (id) => {
    await updateDoc(doc(db, "projects", id), { status: "approved" });
  };

  if (loading) return <div className="proj-container" style={{padding: '2rem'}}>Cargando proyectos...</div>;

  return (
    <div className="proj-container">
      {/* HEADER */}
      <header className="proj-header">
        <h1>Proyectos de Alumnos</h1>
        <p>Galería de trabajos, TFG y portfolio de la comunidad EUNEIZ.</p>
      </header>

      {/* BARRA DE FILTROS (Igual a Biblioteca) */}
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

      {/* GRID DE TARJETAS (Ahora 1 columna) */}
      <div className="proj-grid">
        {filteredProjects.map(project => (
          <div key={project.id} className={`proj-card ${project.status === 'pending' ? 'is-pending' : ''}`}>
            
            {/* IZQUIERDA: IMAGEN */}
            <div className="card-media">
              {project.image ? (
                <img src={project.image} alt={project.title} />
              ) : (
                <div className="placeholder-img"><ImageIcon size={40} opacity={0.3} /></div>
              )}
              {project.status === 'pending' && <span className="badge-pending">En Revisión</span>}
            </div>

            {/* DERECHA: INFO */}
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

                {/* ACCIONES ADMIN / OWNER */}
                {(isAdmin || (user && project.authorEmail === user.email)) && (
                  <div className="admin-actions-mini">
                    {isAdmin && project.status === 'pending' && (
                      <button className="btn-icon approve" onClick={() => handleApprove(project.id)} title="Aprobar">
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
        
        {filteredProjects.length === 0 && (
          <div className="empty-state">No se encontraron proyectos con estos filtros.</div>
        )}
      </div>

      {/* BOTÓN FLOTANTE (FAB) */}
      <button className="fab-add" onClick={() => setIsModalOpen(true)} title="Subir Proyecto">
        <Plus size={32} />
      </button>

      {/* MODAL DE SUBIDA */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>✕</button>
            <h2>Subir Proyecto</h2>
            <p className="modal-subtitle">Comparte tu trabajo con la comunidad</p>
            
            <form onSubmit={handleSubmit} className="proj-form">
              <div className="form-group">
                <label>Título del proyecto</label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ej: Rediseño App EUNEIZ" required />
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
                {/* Aumentado a 5 filas para mejor escritura */}
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
          </div>
        </div>
      )}
    </div>
  );
}