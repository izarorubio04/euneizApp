import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from "firebase/firestore";
import "./comunidad.css";

// Iconos
import { 
  Users, 
  Tent, 
  Plus, 
  ArrowRight, 
  MessageCircle, 
  Search,
  School
} from "lucide-react";

// --- DATOS ESTÁTICOS PARA CLUBS OFICIALES ---
const OFFICIAL_CLUBS = [
  {
    id: "cine",
    nombre: "Club de Cine",
    desc: "Proyecciones semanales, debates y cultura cinematográfica.",
    icon: "🎬",
    horario: "Jueves 18:00",
    color: "#e11d48"
  },
  {
    id: "esports",
    nombre: "EUNEIZ Esports",
    desc: "Equipo competitivo oficial. LoL, Valorant y FIFA.",
    icon: "🎮",
    horario: "Martes 17:00",
    color: "#7c3aed"
  },
  {
    id: "lectura",
    nombre: "Club de Lectura",
    desc: "Un espacio tranquilo para compartir tus libros favoritos.",
    icon: "📚",
    horario: "Miércoles 19:00",
    color: "#059669"
  },
  {
    id: "musica",
    nombre: "Music Band",
    desc: "Grupo de música de la universidad. ¡Buscamos bajista!",
    icon: "🎸",
    horario: "Viernes 16:00",
    color: "#d97706"
  }
];

export default function Comunidad() {
  const { user } = useAuth();
  
  // Estado Tabs
  const [activeTab, setActiveTab] = useState("comunidades"); // 'comunidades' | 'clubs'
  
  // Estado Comunidades (Firebase)
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado Modal Crear
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newComunidad, setNewComunidad] = useState({
    nombre: "",
    descripcion: "",
    contacto: ""
  });

  // 1. Cargar Comunidades desde Firebase
  useEffect(() => {
    const q = query(collection(db, "communities"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCommunities(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Crear Nueva Comunidad
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newComunidad.nombre || !newComunidad.descripcion) return alert("Rellena los campos.");

    try {
      await addDoc(collection(db, "communities"), {
        ...newComunidad,
        createdAt: Date.now(),
        creatorEmail: user.email,
        membersCount: 1 // Empieza con el creador
      });
      setIsModalOpen(false);
      setNewComunidad({ nombre: "", descripcion: "", contacto: "" });
      alert("✅ Comunidad creada con éxito");
    } catch (error) {
      console.error(error);
      alert("Error al crear comunidad");
    }
  };

  return (
    <div className="com-container">
      {/* HEADER */}
      <header className="com-header">
        <h1>Comunidades</h1>
        <p>Únete a grupos de estudiantes o participa en los clubs oficiales de EUNEIZ.</p>
        
        {/* TABS DE NAVEGACIÓN */}
        <div className="com-tabs">
          <button 
            className={`com-tab-btn ${activeTab === 'comunidades' ? 'active' : ''}`}
            onClick={() => setActiveTab('comunidades')}
          >
            <Users size={18}/> Grupos de Alumnos
          </button>
          <button 
            className={`com-tab-btn ${activeTab === 'clubs' ? 'active' : ''}`}
            onClick={() => setActiveTab('clubs')}
          >
            <School size={18}/> Clubs Oficiales
          </button>
        </div>
      </header>

      {/* CONTENIDO: PESTAÑA COMUNIDADES */}
      {activeTab === 'comunidades' && (
        <div className="tab-content fade-in">
          
          <div className="com-actions-bar">
             <div className="search-dummy">
                <Search size={16} className="text-gray"/>
                <span>Buscar grupos...</span>
             </div>
             <button className="btn-create-com" onClick={() => setIsModalOpen(true)}>
                <Plus size={18}/> Crear Comunidad
             </button>
          </div>

          {loading ? <p>Cargando grupos...</p> : (
            <div className="com-grid">
              {communities.length === 0 ? (
                <div className="empty-state-com">
                   <p>No hay comunidades creadas aún. ¡Sé el primero!</p>
                </div>
              ) : (
                communities.map(com => (
                  <div key={com.id} className="com-card">
                    <div className="com-card-top">
                      <div className="com-avatar-placeholder">
                        {com.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="com-badges">
                        <span className="badge-member">👥 {com.membersCount || 1}</span>
                      </div>
                    </div>
                    
                    <h3>{com.nombre}</h3>
                    <p>{com.descripcion}</p>
                    
                    <div className="com-footer">
                       <span className="creator-tag">Por: {com.creatorEmail?.split('@')[0]}</span>
                       <button className="btn-join">Unirme</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO: PESTAÑA CLUBS */}
      {activeTab === 'clubs' && (
        <div className="tab-content fade-in">
          <div className="clubs-hero">
             <h2>Clubs Oficiales EUNEIZ</h2>
             <p>Actividades organizadas y financiadas por la universidad.</p>
          </div>
          
          <div className="com-grid">
            {OFFICIAL_CLUBS.map(club => (
              <Link to={`/comunidad/comunidades/clubs/${club.id}`} key={club.id} className="club-card-link">
                <div className="club-card" style={{'--club-color': club.color}}>
                  <div className="club-icon">{club.icon}</div>
                  <div className="club-info">
                    <h3>{club.nombre}</h3>
                    <p>{club.desc}</p>
                    <div className="club-meta">
                      <span>🕒 {club.horario}</span>
                    </div>
                  </div>
                  <div className="club-arrow">
                    <ArrowRight size={20}/>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* MODAL CREAR COMUNIDAD */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>✕</button>
            <h2>Crear nueva comunidad</h2>
            <p className="modal-subtitle">Crea un grupo de estudio, hobby o interés común.</p>
            
            <form onSubmit={handleCreate} className="com-form">
              <div className="form-group">
                <label>Nombre del Grupo</label>
                <input 
                  autoFocus
                  placeholder="Ej: Senderismo, Java Lovers, Otakus..." 
                  value={newComunidad.nombre}
                  onChange={e => setNewComunidad({...newComunidad, nombre: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Descripción</label>
                <textarea 
                  rows={3}
                  placeholder="¿Qué vais a hacer en este grupo?" 
                  value={newComunidad.descripcion}
                  onChange={e => setNewComunidad({...newComunidad, descripcion: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Método de contacto (Email, Discord, WhatsApp...)</label>
                <input 
                  placeholder="Enlace o correo para unirse" 
                  value={newComunidad.contacto}
                  onChange={e => setNewComunidad({...newComunidad, contacto: e.target.value})}
                />
              </div>

              <button type="submit" className="btn-submit-com">
                🚀 Lanzar Comunidad
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}