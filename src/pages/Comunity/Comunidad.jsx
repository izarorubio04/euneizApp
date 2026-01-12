import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  increment, 
  onSnapshot, 
  query, 
  orderBy,
  arrayUnion,  // IMPORTANTE: Para añadirte a la lista
  arrayRemove  // IMPORTANTE: Para quitarte de la lista
} from "firebase/firestore";
import "./comunidad.css";

// Iconos Lucide (Coherencia visual)
import { 
  Users, 
  Plus, 
  ArrowRight, 
  Search,
  School,
  Check, 
  X, // Para el botón de salir
  Clapperboard, 
  Gamepad2,     
  BookOpen,     
  Music         
} from "lucide-react";

// --- CLUBS OFICIALES ---
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
  
  // Estados UI
  const [activeTab, setActiveTab] = useState("comunidades");
  const [searchTerm, setSearchTerm] = useState(""); // Estado para el buscador
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Datos Firebase
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formulario Crear
  const [newComunidad, setNewComunidad] = useState({
    nombre: "",
    descripcion: "",
    contacto: ""
  });

  // 1. CARGAR COMUNIDADES (Escucha en tiempo real)
  useEffect(() => {
    const q = query(collection(db, "communities"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCommunities(docs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. CREAR COMUNIDAD
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newComunidad.nombre || !newComunidad.descripcion) return alert("Rellena los campos.");

    try {
      await addDoc(collection(db, "communities"), {
        ...newComunidad,
        createdAt: Date.now(),
        creatorEmail: user.email,
        membersCount: 1,
        members: [user.email] // Creamos el array con el creador ya dentro
      });
      setIsModalOpen(false);
      setNewComunidad({ nombre: "", descripcion: "", contacto: "" });
    } catch (error) {
      console.error("Error creando comunidad:", error);
      alert("Error al crear comunidad");
    }
  };

  // 3. UNIRSE / SALIR (Lógica Persistente)
  const toggleMembership = async (community) => {
    if (!user) return;

    const comRef = doc(db, "communities", community.id);
    // Comprobamos si el usuario ya está en la lista de miembros de ESTA comunidad
    const isMember = community.members?.includes(user.email);

    try {
      if (isMember) {
        // SALIR: Quitamos del array y restamos 1
        await updateDoc(comRef, {
          members: arrayRemove(user.email),
          membersCount: increment(-1)
        });
      } else {
        // UNIRSE: Añadimos al array y sumamos 1
        await updateDoc(comRef, {
          members: arrayUnion(user.email),
          membersCount: increment(1)
        });
      }
    } catch (error) {
      console.error("Error al actualizar membresía:", error);
    }
  };

  // 4. FILTRADO PARA EL BUSCADOR
  const filteredCommunities = communities.filter(com => 
    com.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    com.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="com-container">
      {/* HEADER */}
      <header className="com-header">
        <h1>Comunidades</h1>
        <p>Únete a grupos de estudiantes o participa en los clubs oficiales de EUNEIZ.</p>
        
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

      {/* PESTAÑA: GRUPOS DE ALUMNOS */}
      {activeTab === 'comunidades' && (
        <div className="tab-content fade-in">
          
          <div className="com-actions-bar">
             {/* BUSCADOR FUNCIONAL */}
             <div className="search-dummy">
                <Search size={16} className="text-gray"/>
                <input 
                  type="text" 
                  placeholder="Buscar grupos..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{border:'none', outline:'none', width:'100%', color:'#64748b'}} 
                />
             </div>
             <button className="btn-create-com" onClick={() => setIsModalOpen(true)}>
                <Plus size={18}/> Crear Comunidad
             </button>
          </div>

          {loading ? <p className="loading-text">Cargando grupos...</p> : (
            <div className="com-grid">
              {filteredCommunities.length === 0 ? (
                <div className="empty-state-com">
                   <p>No se encontraron comunidades.</p>
                </div>
              ) : (
                filteredCommunities.map(com => {
                  // Verificamos en los datos reales de Firebase si el usuario está
                  const isJoined = com.members?.includes(user?.email);
                  const isCreator = com.creatorEmail === user?.email;

                  return (
                    <div key={com.id} className="com-card">
                      <div className="com-card-top">
                        <div className="com-avatar-placeholder">
                          {com.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div className="com-badges">
                          {/* Usamos el dato real membersCount o la longitud del array */}
                          <span className="badge-member">👥 {com.members?.length || com.membersCount || 0}</span>
                        </div>
                      </div>
                      
                      <h3>{com.nombre}</h3>
                      <p>{com.descripcion}</p>
                      
                      <div className="com-footer">
                         <span className="creator-tag">
                            {isCreator ? "👑 Admin" : `Por: ${com.creatorEmail?.split('@')[0]}`}
                         </span>
                         
                         {/* BOTÓN UNIRSE / SALIR */}
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

      {/* PESTAÑA: CLUBS OFICIALES */}
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
          </div>
        </div>
      )}
    </div>
  );
}