import React, { useState, useEffect } from "react";
import "./NoticeBoard.css";
import { useAuth } from "../../context/AuthContext";

// Firebase Imports: Traemos solo lo necesario para interactuar con la BD
import { db } from "../../firebase/config";
import { 
  collection, addDoc, deleteDoc, updateDoc, 
  doc, onSnapshot, query, orderBy 
} from "firebase/firestore";

// Constantes y componentes reutilizables
import { ADMIN_EMAILS } from "../../config/constants"; // Lista de profes/admins
import PageHeader from "../../components/UI/PageHeader";
import Modal from "../../components/UI/Modal";

// Iconos (Usamos Lucide porque son más limpios que FontAwesome)
import { 
  Megaphone, PartyPopper, Beer, Car, Home, 
  BadgeEuro, Search, Package, Plus, Pin, 
  MessageCircle, Trash2, CheckCircle, Calendar as CalIcon, Inbox as InboxIcon,
} from "lucide-react";

// Configuración de categorías: Esto facilita añadir nuevas en el futuro
// Definimos color, icono y si es exclusivo para admins (como Secretaría)
const CATEGORIES = {
  secretaria: { label: "Avisos Secretaría", icon: <Megaphone size={18} />, color: "#F1595C", adminOnly: true },
  eventos:    { label: "Eventos Uni",       icon: <PartyPopper size={18}/>, color: "#3498db", adminOnly: false },
  social:     { label: "Social",            icon: <Beer size={18} />,       color: "#e84393", adminOnly: false },
  carpooling: { label: "Carpooling",        icon: <Car size={18} />,        color: "#2ecc71", adminOnly: false },
  vivienda:   { label: "Vivienda",          icon: <Home size={18} />,       color: "#00cec9", adminOnly: false },
  venta:      { label: "Compra-Venta",      icon: <BadgeEuro size={18} />,  color: "#9b59b6", adminOnly: false },
  perdidos:   { label: "Objetos Perdidos",  icon: <Search size={18} />,     color: "#f39c12", adminOnly: false },
  otros:      { label: "Otros",             icon: <Package size={18} />,    color: "#636e72", adminOnly: false },
};

export const NoticeBoard = () => {
  const { user } = useAuth();
  
  // Comprobamos si el usuario actual es Admin mirando si su email está en la lista de constantes
  const isUserAdmin = user && ADMIN_EMAILS.includes(user.email);

  // --- ESTADOS ---
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'mine', o una categoría específica
  
  // Control de Modales
  const [isModalOpen, setIsModalOpen] = useState(false); // Crear anuncio
  const [isContactModalOpen, setIsContactModalOpen] = useState(false); // Contactar
  
  // Estado para el formulario de contacto (privado)
  const [contactTarget, setContactTarget] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Estado para los Pines (Anuncios guardados)
  // Inicializamos leyendo de localStorage para que no se pierdan al recargar
  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const saved = localStorage.getItem("my_pinned_notices");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Estado del formulario de creación
  const [formData, setFormData] = useState({
    type: "eventos", title: "", desc: "", price: "", origin: "", dest: "", contact: "", eventDate: ""
  });

  // 1. Cargar Posts (Tiempo Real)
  // Usamos onSnapshot para que si alguien publica, aparezca al instante sin recargar
  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe(); // Limpiamos el listener al salir
  }, []);

  // 2. Guardar Pines
  // Cada vez que modificamos pinnedIds, actualizamos el LocalStorage
  useEffect(() => {
    localStorage.setItem("my_pinned_notices", JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  // Handler para poner/quitar pin
  const togglePin = (id) => {
    setPinnedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [id, ...prev]);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Publicar un nuevo anuncio
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.desc) return alert("Rellena los campos obligatorios");

    try {
      const isSecretaria = formData.type === "secretaria";
      // Si es admin o secretaría, se aprueba directo. Si no, va a 'pending' para moderación.
      const initialStatus = (isUserAdmin || isSecretaria) ? "approved" : "pending";

      await addDoc(collection(db, "notices"), {
        type: formData.type,
        title: formData.title,
        desc: formData.desc,
        author: user?.email || "Anónimo",
        date: Date.now(),
        eventDate: formData.eventDate || null,
        status: initialStatus,
        // Guardamos datos extra en un objeto 'meta' para tenerlo ordenado
        meta: {
          price: formData.price,
          origen: formData.origin,
          destino: formData.dest,
          contact: formData.contact
        }
      });

      setIsModalOpen(false);
      // Reseteamos el form para la próxima vez
      setFormData({ type: "eventos", title: "", desc: "", price: "", origin: "", dest: "", contact: "", eventDate: "" });      

      if (initialStatus === "pending") {
        alert("✅ Anuncio enviado a moderación.");
      }
    } catch (error) {
      console.error("Error al publicar:", error);
    }
  };

  // 4. Lógica de Mensajería Interna
  // Preparamos el modal de contacto con los datos del destinatario
  const handleOpenContact = (post) => {
    setContactTarget({
      email: post.author,
      title: post.title,
      postId: post.id
    });
    setMessageText("");
    setIsSending(false); 
    setIsContactModalOpen(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    setIsSending(true); 

    try {
      await addDoc(collection(db, "messages"), {
        to: contactTarget.email,
        from: user.email,
        postId: contactTarget.postId,
        postTitle: contactTarget.title,
        content: messageText,
        date: Date.now(),
        read: false
      });
      
      // Pequeño delay para UX
      setTimeout(() => {
        setIsSending(false);
        setIsContactModalOpen(false);
        alert("✅ Mensaje enviado con éxito.");
      }, 800);

    } catch (error) {
      console.error("Error enviando mensaje", error);
      setIsSending(false);
    }
  };

  // Funciones de gestión (Borrar y Aprobar)
  const deletePost = async (id) => {
    if(!window.confirm("¿Estás seguro de borrar este anuncio?")) return;
    await deleteDoc(doc(db, "notices", id));
  };

  const approvePost = async (id) => {
    await updateDoc(doc(db, "notices", id), { status: "approved" });
  };

  // --- LÓGICA DE FILTRADO ---
  const visiblePosts = posts.filter(post => {
    const isOwner = user && post.author === user.email;
    // Si filtro 'mine', solo veo los míos
    if (filter === 'mine') return isOwner;
    
    // Si no, veo los aprobados (o todos si soy admin, o los míos aunque estén pendientes)
    const statusOk = isUserAdmin || isOwner || post.status === "approved";
    const typeOk = filter === "all" ? true : post.type === filter;
    
    return statusOk && typeOk;
  });

  // Separamos los fijados del resto para mostrarlos arriba
  const myPinnedPosts = filter === 'mine' ? [] : visiblePosts.filter(p => pinnedIds.includes(p.id));
  const feedPosts = filter === 'mine' ? visiblePosts : visiblePosts.filter(p => !pinnedIds.includes(p.id));

  if (loading) return <div className="nb-container" style={{padding: '2rem', textAlign:'center'}}>Cargando tablón...</div>;

  return (
    <div className="nb-container">
      <PageHeader 
        title="Tablón de Anuncios" 
        subtitle="Mantente al día con lo que pasa en el campus" 
      />
      
      {/* SECCIÓN DE FILTROS */}
      <div className="nb-filters">
        <button className={`filter-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter("all")}>Todo</button>
        <button className={`filter-pill ${filter === 'mine' ? 'active' : ''}`} onClick={() => setFilter("mine")}>Mis Anuncios</button>
        {Object.entries(CATEGORIES).map(([key, config]) => (
          <button key={key} className={`filter-pill ${filter === key ? 'active' : ''}`} style={{ '--cat-color': config.color }} onClick={() => setFilter(key)}>
            <span className="icon-wrapper" style={{color: filter === key ? 'white' : config.color}}>{config.icon}</span> {config.label}
          </button>
        ))}
      </div>

      <main className="nb-grid">
        {/* SECCIÓN ANUNCIOS FIJADOS (PINNED) */}
        {myPinnedPosts.length > 0 && filter !== 'mine' && (
          <div className="nb-section-pinned">
            <h3><Pin size={20} /> Anuncios Fijados</h3>
            <div className="pinned-grid">
              {myPinnedPosts.map(post => (
                <Card key={post.id} post={post} isAdmin={isUserAdmin} currentUserEmail={user?.email} isPinned={true} onPin={() => togglePin(post.id)} onDelete={deletePost} onApprove={approvePost} onContact={() => handleOpenContact(post)} />
              ))}
            </div>
          </div>
        )}

        {/* FEED GENERAL */}
        <div className="feed-grid">
          {feedPosts.map(post => (
            <Card key={post.id} post={post} isAdmin={isUserAdmin} currentUserEmail={user?.email} isPinned={false} onPin={() => togglePin(post.id)} onDelete={deletePost} onApprove={approvePost} onContact={() => handleOpenContact(post)} />
          ))}
          
          {/* EMPTY STATE */}
          {feedPosts.length === 0 && myPinnedPosts.length === 0 && (
             <div className="empty-feed">
               <span style={{fontSize: '2rem'}}><InboxIcon size={24}/></span>
               <p style={{color: 'var(--text-light)'}}>No hay anuncios en esta categoría.</p>
             </div>
          )}
        </div>
      </main>

      {/* BOTÓN FLOTANTE */}
      <button className="fab-add" onClick={() => setIsModalOpen(true)} title="Crear anuncio">
        <Plus size={32} />
      </button>

      {/* MODAL CREAR ANUNCIO */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Publicar Anuncio"
      >
        <form onSubmit={handleSubmit} className="post-form">
           <div className="form-group">
            <label>Categoría</label>
            <div className="cat-selector">
              {Object.entries(CATEGORIES).map(([key, config]) => {
                // Ocultamos categorías de admin si el usuario no lo es
                if (config.adminOnly && !isUserAdmin) return null;
                return (
                  <label key={key} className={`cat-radio ${formData.type === key ? 'selected' : ''}`} style={{'--cat-color': config.color}}>
                    <input type="radio" name="type" value={key} checked={formData.type === key} onChange={handleInputChange} />
                    <span className="radio-icon">{config.icon}</span> {config.label}
                  </label>
                );
              })}
            </div>
          </div>
          
          <div className="form-group">
            <label>Título</label>
            <input name="title" value={formData.title} onChange={handleInputChange} required placeholder="Ej: Vendo apuntes de anatomía..." />
          </div>
          
          {/* Campos condicionales según tipo */}
          {(formData.type === "eventos" || formData.type === "social") && (
            <div className="form-group">
              <label>Fecha del Evento <span style={{color:'red'}}>*</span></label>
              <input type="date" name="eventDate" value={formData.eventDate} onChange={handleInputChange} required className="date-input"/>
            </div>
          )}

          {(formData.type === "venta" || formData.type === "vivienda") && (
             <div className="form-group"><label>Precio (€)</label><input name="price" type="number" value={formData.price} onChange={handleInputChange} placeholder="0" /></div>
          )}
          
          {formData.type === "carpooling" && (
             <div className="form-row"><input name="origin" placeholder="Origen" value={formData.origin} onChange={handleInputChange} /><input name="dest" placeholder="Destino" value={formData.dest} onChange={handleInputChange} /></div>
          )}
          
          <div className="form-group">
            <label>Descripción</label>
            <textarea name="desc" value={formData.desc} onChange={handleInputChange} rows={3} required placeholder="Detalla tu anuncio..."></textarea>
          </div>
          
          <button type="submit" className="btn-publish">Publicar Anuncio</button>
        </form>
      </Modal>

      {/* MODAL DE CONTACTO */}
      <Modal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
        title="Contactar con el autor"
      >
        <p className="contact-subtitle" style={{marginBottom: '1rem', color: 'var(--text-light)'}}>
          Mensaje para: <strong>{contactTarget?.email.split('@')[0]}</strong>
        </p>
        <form onSubmit={handleSendMessage} className="post-form">
          <div className="form-group">
            <textarea 
              value={messageText} 
              onChange={(e) => setMessageText(e.target.value)} 
              rows={5} 
              placeholder="Hola, me interesa tu anuncio..."
              required
              disabled={isSending}
            ></textarea>
          </div>
          <button type="submit" className="btn-publish" disabled={isSending}>
            {isSending ? "Enviando..." : "Enviar Mensaje"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

// --- SUBCOMPONENTE CARD ---
// Lo extraje aquí para no ensuciar el componente principal
const Card = ({ post, isAdmin, currentUserEmail, isPinned, onPin, onDelete, onApprove, onContact }) => {
  const config = CATEGORIES[post.type] || CATEGORIES.otros;
  const isOwner = currentUserEmail && post.author === currentUserEmail;
  const canDelete = isAdmin || isOwner;

  return (
    <div className={`notice-card ${post.status === 'pending' ? 'pending-card' : ''}`} style={{'--accent-color': config.color}}>
      <div className="card-accent-strip"></div>
      
      <div className="card-body-wrapper">
        <div className="card-top">
          <span className="card-badge" style={{color: config.color, backgroundColor: `${config.color}15`}}>
            {config.icon} {config.label}
          </span>
          <button className={`btn-pin ${isPinned ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onPin(); }} title="Fijar anuncio">
            <Pin size={18} fill={isPinned ? "#F1595C" : "none"} />
          </button>
        </div>

        <h3 className="card-title">{post.title}</h3>

        {post.eventDate && (
          <div className="event-date-display">
             <CalIcon size={14}/> 
             <strong>Fecha:</strong> {new Date(post.eventDate).toLocaleDateString()}
          </div>
        )}
        
        {post.type === "carpooling" && post.meta && (
            <div className="carpool-route">
                <div className="route-point origin">{post.meta.origen || "?"}</div>
                <div className="route-arrow">➝</div>
                <div className="route-point dest">{post.meta.destino || "?"}</div>
            </div>
        )}
        {(post.type === "venta" || post.type === "vivienda") && post.meta?.price && (
            <div className="price-tag" style={{color: config.color}}>{post.meta.price} €</div>
        )}

        <p className="card-desc">{post.desc}</p>
        
        <div className="card-footer">
          <span className="author-info">
             {isOwner ? " Tú" : `@${post.author.split('@')[0]}`} • {new Date(post.date).toLocaleDateString()}
          </span>

          <div className="card-actions">
             {isAdmin && post.status === 'pending' && <button className="icon-btn approve" onClick={() => onApprove(post.id)} title="Aprobar"><CheckCircle size={18}/></button>}
             {canDelete && <button className="icon-btn delete" onClick={() => onDelete(post.id)} title="Borrar"><Trash2 size={18}/></button>}
             {!isOwner && post.status === 'approved' && (
                <button className="icon-btn contact" onClick={onContact} title="Contactar">
                    <MessageCircle size={18} />
                </button>
             )}
          </div>
        </div>
      </div>
      
      {post.status === 'pending' && <div className="pending-overlay">En Revisión</div>}
    </div>
  );
};

export default NoticeBoard;