import React, { useState, useEffect } from "react";
import "./NoticeBoard.css";
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

// IMPORTAMOS ICONOS DE LUCIDE (Cohesión con el menú)
import { 
  Megaphone, 
  PartyPopper, 
  Beer, 
  Car, 
  Home, 
  BadgeEuro, 
  Search, 
  Package,
  Plus,
  Pin,
  MessageCircle,
  Trash2,
  CheckCircle,
  Calendar as CalIcon
} from "lucide-react";

// Actualizamos el objeto CATEGORIES con componentes en lugar de emojis
const CATEGORIES = {
  secretaria: { label: "Avisos Secretaría", icon: <Megaphone size={18} />, color: "#F1595C", adminOnly: true }, // Usamos el rojo corporativo aquí para urgencia
  eventos:    { label: "Eventos Uni",       icon: <PartyPopper size={18}/>, color: "#3498db", adminOnly: false },
  social:     { label: "Social",            icon: <Beer size={18} />,        color: "#e84393", adminOnly: false },
  carpooling: { label: "Carpooling",        icon: <Car size={18} />,         color: "#2ecc71", adminOnly: false },
  vivienda:   { label: "Vivienda",          icon: <Home size={18} />,        color: "#00cec9", adminOnly: false },
  venta:      { label: "Compra-Venta",      icon: <BadgeEuro size={18} />,   color: "#9b59b6", adminOnly: false },
  perdidos:   { label: "Objetos Perdidos",  icon: <Search size={18} />,      color: "#f39c12", adminOnly: false },
  otros:      { label: "Otros",             icon: <Package size={18} />,     color: "#636e72", adminOnly: false },
};

const ADMIN_EMAILS = ["admin@euneiz.com", "secretaria@euneiz.com"];

export const NoticeBoard = () => {
  const { user } = useAuth();
  const isUserAdmin = user && ADMIN_EMAILS.includes(user.email);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  
  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  
  // Estado Contacto
  const [contactTarget, setContactTarget] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const saved = localStorage.getItem("my_pinned_notices");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [formData, setFormData] = useState({
    type: "eventos", title: "", desc: "", price: "", origin: "", dest: "", contact: "", eventDate: ""
  });

  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem("my_pinned_notices", JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  const togglePin = (id) => {
    setPinnedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [id, ...prev]);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.desc) return alert("Rellena los campos obligatorios");

    try {
      const isSecretaria = formData.type === "secretaria";
      const initialStatus = (isUserAdmin || isSecretaria) ? "approved" : "pending";

      await addDoc(collection(db, "notices"), {
        type: formData.type,
        title: formData.title,
        desc: formData.desc,
        author: user?.email || "Anónimo",
        date: Date.now(),
        eventDate: formData.eventDate || null, // Fecha del evento real (para el calendario)
        status: initialStatus,
        meta: {
          price: formData.price,
          origen: formData.origin,
          destino: formData.dest,
          contact: formData.contact
        }
      });

      setIsModalOpen(false);
      setFormData({ type: "eventos", title: "", desc: "", price: "", origin: "", dest: "", contact: "", eventDate: "" });      

      if (initialStatus === "pending") {
        alert("✅ Anuncio enviado a moderación.");
      }
    } catch (error) {
      console.error("Error al publicar:", error);
    }
  };

  // --- LÓGICA DE MENSAJERÍA ---
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

  const deletePost = async (id) => {
    if(!window.confirm("¿Borrar anuncio?")) return;
    await deleteDoc(doc(db, "notices", id));
  };

  const approvePost = async (id) => {
    await updateDoc(doc(db, "notices", id), { status: "approved" });
  };

  const visiblePosts = posts.filter(post => {
    const isOwner = user && post.author === user.email;
    if (filter === 'mine') return isOwner;
    const statusOk = isUserAdmin || isOwner || post.status === "approved";
    const typeOk = filter === "all" ? true : post.type === filter;
    return statusOk && typeOk;
  });

  const myPinnedPosts = filter === 'mine' ? [] : visiblePosts.filter(p => pinnedIds.includes(p.id));
  const feedPosts = filter === 'mine' ? visiblePosts : visiblePosts.filter(p => !pinnedIds.includes(p.id));

  if (loading) return <div className="nb-loading">Cargando tablón...</div>;

  return (
    <div className="nb-container">
      <header className="nb-header">
        <div className="nb-header-content">
          <h1>Tablón de Anuncios</h1>
          <p>Mantente al día con lo que pasa en el campus</p>
          
          <div className="nb-filters">
            <button className={`filter-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter("all")}>Todo</button>
            <button className={`filter-pill ${filter === 'mine' ? 'active' : ''}`} onClick={() => setFilter("mine")}>👤 Mis Anuncios</button>
            {Object.entries(CATEGORIES).map(([key, config]) => (
              <button key={key} className={`filter-pill ${filter === key ? 'active' : ''}`} style={{ '--cat-color': config.color }} onClick={() => setFilter(key)}>
                <span className="icon-wrapper" style={{color: filter === key ? 'white' : config.color}}>{config.icon}</span> {config.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="nb-grid">
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
        <div className="feed-grid">
          {feedPosts.map(post => (
            <Card key={post.id} post={post} isAdmin={isUserAdmin} currentUserEmail={user?.email} isPinned={false} onPin={() => togglePin(post.id)} onDelete={deletePost} onApprove={approvePost} onContact={() => handleOpenContact(post)} />
          ))}
          {feedPosts.length === 0 && myPinnedPosts.length === 0 && (
             <div className="empty-feed">
               <span>📭</span>
               <p>No hay anuncios en esta categoría.</p>
             </div>
          )}
        </div>
      </main>

      <button className="fab-add" onClick={() => setIsModalOpen(true)} title="Crear anuncio">
        <Plus size={32} />
      </button>

      {/* MODAL CREAR */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>✕</button>
            <h2>Publicar Anuncio</h2>
            <form onSubmit={handleSubmit} className="post-form">
               <div className="form-group">
                <label>Categoría</label>
                <div className="cat-selector">
                  {Object.entries(CATEGORIES).map(([key, config]) => {
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
              <div className="form-group"><label>Título</label><input name="title" value={formData.title} onChange={handleInputChange} required placeholder="Ej: Vendo apuntes de anatomía..." /></div>
              
              {(formData.type === "eventos" || formData.type === "social") && (
                <div className="form-group">
                  <label>Fecha del Evento <span style={{color:'red'}}>*</span></label>
                  <input 
                    type="date" 
                    name="eventDate" 
                    value={formData.eventDate} 
                    onChange={handleInputChange} 
                    required 
                    className="date-input"
                  />
                </div>
              )}

              {(formData.type === "venta" || formData.type === "vivienda") && <div className="form-group"><label>Precio (€)</label><input name="price" type="number" value={formData.price} onChange={handleInputChange} placeholder="0" /></div>}
              {formData.type === "carpooling" && <div className="form-row"><input name="origin" placeholder="📍 Origen" value={formData.origin} onChange={handleInputChange} /><input name="dest" placeholder="🏁 Destino" value={formData.dest} onChange={handleInputChange} /></div>}
              <div className="form-group"><label>Descripción</label><textarea name="desc" value={formData.desc} onChange={handleInputChange} rows={3} required placeholder="Detalla tu anuncio..."></textarea></div>
              <button type="submit" className="btn-publish">Publicar Anuncio</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONTACTO */}
      {isContactModalOpen && (
        <div className="modal-overlay" onClick={() => setIsContactModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setIsContactModalOpen(false)}>✕</button>
            <h2>Contactar con el autor</h2>
            <p className="contact-subtitle">
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
          </div>
        </div>
      )}
    </div>
  );
};

// COMPONENTE TARJETA OPTIMIZADO
const Card = ({ post, isAdmin, currentUserEmail, isPinned, onPin, onDelete, onApprove, onContact }) => {
  const config = CATEGORIES[post.type] || CATEGORIES.otros;
  const isOwner = currentUserEmail && post.author === currentUserEmail;
  const canDelete = isAdmin || isOwner;

  return (
    <div className={`notice-card ${post.status === 'pending' ? 'pending-card' : ''}`} style={{'--accent-color': config.color}}>
      
      {/* HEADER DE LA TARJETA CON BORDE DE COLOR */}
      <div className="card-accent-strip"></div>
      
      <div className="card-body-wrapper">
        <div className="card-top">
          <span className="card-badge" style={{color: config.color, backgroundColor: `${config.color}15`}}>
            {config.icon} {config.label}
          </span>
          <button className={`btn-pin ${isPinned ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onPin(); }} title="Fijar anuncio">
            <Pin size={18} fill={isPinned ? "#f1c40f" : "none"} />
          </button>
        </div>

        <h3 className="card-title">{post.title}</h3>

        {/* Mostramos fecha del evento si existe */}
        {post.eventDate && (
          <div className="event-date-display" style={{color: '#666', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '5px'}}>
             <CalIcon size={14}/> 
             <strong>Fecha:</strong> {new Date(post.eventDate).toLocaleDateString()}
          </div>
        )}
        
        {/* METADATA ESPECÍFICA */}
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
             {isOwner ? "👤 Tú" : `@${post.author.split('@')[0]}`} • {new Date(post.date).toLocaleDateString()}
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