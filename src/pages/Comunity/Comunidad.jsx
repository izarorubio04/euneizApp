import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./comunidad.css";

// Firebase imports: Traemos solo lo necesario para optimizar
import { db } from "../../firebase/config";
import { 
  collection, addDoc, updateDoc, doc, increment, 
  onSnapshot, query, orderBy, arrayUnion, arrayRemove 
} from "firebase/firestore";

// UI Imports
import PageHeader from "../../components/UI/PageHeader";
import Modal from "../../components/UI/Modal";
import { 
  Users, Plus, ArrowRight, Search, School,
  Check, Clapperboard, Gamepad2, BookOpen, Music, Clock
} from "lucide-react";

// Datos estáticos para los clubs oficiales (ya que estos no los crean los alumnos)
const OFFICIAL_CLUBS = [
  {
    id: "cine",
    nombre: "Club de Cine",
    desc: "Proyecciones semanales y debates.",
    icon: <Clapperboard size={40} strokeWidth={1.5} />,
    horario: "Jueves 18:00",
    color: "#e11d48"
  },
  {
    id: "esports",
    nombre: "EUNEIZ Esports",
    desc: "Equipo competitivo: LoL, Valorant y FIFA.",
    icon: <Gamepad2 size={40} strokeWidth={1.5} />,
    horario: "Martes 17:00",
    color: "#7c3aed"
  },
  {
    id: "lectura",
    nombre: "Club de Lectura",
    desc: "Comparte tus libros favoritos.",
    icon: <BookOpen size={40} strokeWidth={1.5} />,
    horario: "Miércoles 19:00",
    color: "#059669"
  },
  {
    id: "musica",
    nombre: "Music Band",
    desc: "Grupo de música oficial.",
    icon: <Music size={40} strokeWidth={1.5} />,
    horario: "Viernes 16:00",
    color: "#d97706"
  }
];

export default function Comunidad() {
  const { user } = useAuth();
  
  // --- ESTADOS ---
  // Control de pestañas: 'comunidades' (alumnos) vs 'clubs' (oficiales)
  const [activeTab, setActiveTab] = useState("comunidades");
  
  // Estados para datos dinámicos
  const [communities, setCommunities] = useState([]); // Lista cruda de firebase
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estado para el modal de creación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newComunidad, setNewComunidad] = useState({
    nombre: "",
    descripcion: "",
    contacto: ""
  });

  // 1. EFECTO: Cargar Comunidades en Tiempo Real
  // Usamos onSnapshot en lugar de getDocs para que si alguien crea un grupo, aparezca solo
  useEffect(() => {
    const q = query(collection(db, "communities"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCommunities(docs);
      setLoading(false);
    });
    
    // Limpiamos la suscripción al desmontar
    return () => unsubscribe();
  }, []);

  // 2. LOGICA: Crear nueva comunidad
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newComunidad.nombre || !newComunidad.descripcion) return;

    try {
      await addDoc(collection(db, "communities"), {
        ...newComunidad,
        createdAt: Date.now(),
        creatorEmail: user.email,
        // Al crearla, el creador es el primer miembro automáticamente
        membersCount: 1,
        members: [user.email]
      });
      
      setIsModalOpen(false);
      // Reseteamos el formulario
      setNewComunidad({ nombre: "", descripcion: "", contacto: "" });
    } catch (error) {
      console.error("Error creando comunidad:", error);
    }
  };

  // 3. LOGICA: Unirse / Salir (Toggle)
  // Usamos arrayUnion y arrayRemove para manejar la lista de emails de forma atómica en Firebase
  const toggleMembership = async (community) => {
    if (!user) return;
    
    const comRef = doc(db, "communities", community.id);
    const isMember = community.members?.includes(user.email);

    try {
      if (isMember) {
        // Si ya está, lo sacamos
        await updateDoc(comRef, {
          members: arrayRemove(user.email),
          membersCount: increment(-1)
        });
      } else {
        // Si no está, lo metemos
        await updateDoc(comRef, {
          members: arrayUnion(user.email),
          membersCount: increment(1)
        });
      }
    } catch (error) {
      console.error("Error al actualizar membresía:", error);
    }
  };

  // 4. LOGICA: Filtrado local
  // Filtramos la lista cargada según lo que el usuario escriba en el buscador
  const filteredCommunities = communities.filter(com => 
    com.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    com.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="com-container">
      
      {/* HEADER DE LA SECCIÓN */}
      <PageHeader 
        title="Comunidades" 
        subtitle="Únete a grupos de estudiantes o participa en los clubs oficiales de EUNEIZ." 
      />
        
      {/* PESTAÑAS DE NAVEGACIÓN */}
      <nav className="com-tabs">
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
      </nav>

      {/* --- CONTENIDO PESTAÑA 1: GRUPOS DE ALUMNOS --- */}
      {activeTab === 'comunidades' && (
        <div className="tab-content fade-in">
          
          <div className="com-actions-bar">
             {/* Buscador Visual */}
             <div className="search-dummy">
                <Search size={16} className="text-gray"/>
                <input 
                  type="text" 
                  placeholder="Buscar grupos..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             
             {/* Botón Crear */}
             <button className="btn-create-com" onClick={() => setIsModalOpen(true)}>
                <Plus size={18}/> Crear Comunidad
             </button>
          </div>

          {loading ? (
             <p className="loading-text">Cargando grupos...</p> 
          ) : (
            <div className="com-grid">
              {filteredCommunities.length === 0 ? (
                <div className="empty-state-com">
                   <p>No se encontraron comunidades. ¡Crea la primera!</p>
                </div>
              ) : (
                filteredCommunities.map(com => {
                  // Calculamos estado para cada tarjeta
                  const isJoined = com.members?.includes(user?.email);
                  const isCreator = com.creatorEmail === user?.email;

                  return (
                    <div key={com.id} className="com-card">
                      <div className="com-card-top">
                        {/* Avatar generado con la inicial */}
                        <div className="com-avatar-placeholder">
                          {com.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="com-badges">
                          <span className="badge-member"><Users size={14}/> {com.members?.length || 0}</span>
                        </div>
                      </div>
                      
                      <h3>{com.nombre}</h3>
                      <p>{com.descripcion}</p>
                      
                      <div className="com-footer">
                          <span className="creator-tag">
                             {isCreator ? "Admin (Tú)" : `Por: ${com.creatorEmail?.split('@')[0]}`}
                          </span>
                          
                          <button 
                            className={`btn-join ${isJoined ? 'joined' : ''}`}
                            onClick={() => toggleMembership(com)}
                          >
                            {isJoined ? (
                              <><Check size={14}/> Unido</>
                            ) : "Unirme"}
                          </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* --- CONTENIDO PESTAÑA 2: CLUBS OFICIALES --- */}
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
                  <div className="club-icon-wrapper" style={{color: club.color}}>
                    {club.icon}
                  </div>
                  <div className="club-info">
                    <h3>{club.nombre}</h3>
                    <p>{club.desc}</p>
                    <div className="club-meta">
                      <span><Clock size={14}/> {club.horario}</span>
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

      {/* --- MODAL PARA CREAR COMUNIDAD --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Crear nueva comunidad"
      >
        <p className="modal-subtitle">Crea un grupo de estudio, hobby o interés común.</p>
        <form onSubmit={handleCreate} className="com-form">
          <div className="form-group">
            <label>Nombre del Grupo</label>
            <input 
              autoFocus
              required
              placeholder="Ej: Senderismo, Java Lovers..." 
              value={newComunidad.nombre}
              onChange={e => setNewComunidad({...newComunidad, nombre: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label>Descripción</label>
            <textarea 
              rows={3}
              required
              placeholder="¿Qué vais a hacer en este grupo?" 
              value={newComunidad.descripcion}
              onChange={e => setNewComunidad({...newComunidad, descripcion: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label>Contacto (Link grupo WhatsApp/Discord)</label>
            <input 
              placeholder="https://chat.whatsapp.com/..." 
              value={newComunidad.contacto}
              onChange={e => setNewComunidad({...newComunidad, contacto: e.target.value})}
            />
          </div>

          <button type="submit" className="btn-submit-com">
            🚀 Crear Grupo
          </button>
        </form>
      </Modal>

    </div>
  );
}