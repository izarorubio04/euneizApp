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

const CATEGORIES = {
  secretaria: { label: "Avisos Secretaría", icon: "📢", color: "#e74c3c", adminOnly: true },
  eventos:    { label: "Eventos Uni",       icon: "🎉", color: "#3498db", adminOnly: false },
  social:     { label: "Social / Quedadas", icon: "🍻", color: "#e84393", adminOnly: false },
  carpooling: { label: "Carpooling",        icon: "🚗", color: "#2ecc71", adminOnly: false },
  vivienda:   { label: "Vivienda",          icon: "🏠", color: "#00cec9", adminOnly: false },
  venta:      { label: "Compra-Venta",      icon: "💸", color: "#9b59b6", adminOnly: false },
  perdidos:   { label: "Objetos Perdidos",  icon: "🔍", color: "#f39c12", adminOnly: false },
  otros:      { label: "Otros",             icon: "📦", color: "#636e72", adminOnly: false },
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
  const [isSending, setIsSending] = useState(false); // <--- NUEVO ESTADO PARA FEEDBACK

  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const saved = localStorage.getItem("my_pinned_notices");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [formData, setFormData] = useState({
    type: "eventos", title: "", desc: "", price: "", origin: "", dest: "", contact: ""
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
        status: initialStatus,
        meta: {
          price: formData.price,
          origen: formData.origin,
          destino: formData.dest,
          contact: formData.contact
        }
      });

      setIsModalOpen(false);
      setFormData({ type: "eventos", title: "", desc: "", price: "", origin: "", dest: "", contact: "" });
      
      if (initialStatus === "pending") {
        alert("✅ Anuncio enviado a moderación.");
      }
    } catch (error) {
      console.error("Error al publicar:", error);
    }
  };

  // --- LÓGICA DE MENSAJERÍA MEJORADA ---
  const handleOpenContact = (post) => {
    setContactTarget({
      email: post.author,
      title: post.title,
      postId: post.id
    });
    setMessageText("");
    setIsSending(false); // Resetear estado
    setIsContactModalOpen(true);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setIsSending(true); // <--- ACTIVAR ESTADO DE CARGA

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
      
      // Simular pequeño delay para que se vea el efecto "Enviando..."
      setTimeout(() => {
        setIsSending(false);
        setIsContactModalOpen(false);
        alert("✅ Mensaje enviado con éxito. Puedes verlo en tu buzón de 'Enviados'.");
      }, 800);

    } catch (error) {
      console.error("Error enviando mensaje", error);
      alert("Error al enviar mensaje");
      setIsSending(false);
    }
  };

  // --- ACTIONS ---
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
          <h1>📌 Tablón EUNEIZ</h1>
          <p>Comunidad universitaria {isUserAdmin && <span className="badge-admin">Admin</span>}</p>
          
          <div className="nb-filters">
            <button className={`filter-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter("all")}>Todo</button>
            <button className={`filter-pill ${filter === 'mine' ? 'active' : ''}`} onClick={() => setFilter("mine")} style={{ '--cat-color': '#34495e' }}>👤 Mis Anuncios</button>
            {Object.entries(CATEGORIES).map(([key, config]) => (
              <button key={key} className={`filter-pill ${filter === key ? 'active' : ''}`} style={{ '--cat-color': config.color }} onClick={() => setFilter(key)}>
                {config.icon} {config.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="nb-grid">
        {myPinnedPosts.length > 0 && filter !== 'mine' && (
          <div className="nb-section-pinned">
            <h3>⭐ Favoritos Fijados</h3>
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
        </div>
      </main>

      <button className="fab-add" onClick={() => setIsModalOpen(true)}>+</button>

      {/* MODAL CREAR (Simplificado para brevedad, usa tu lógica existente) */}
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
                      <label key={key} className={`cat-radio ${formData.type === key ? 'selected' : ''}`}>
                        <input type="radio" name="type" value={key} checked={formData.type === key} onChange={handleInputChange} />
                        {config.icon} {config.label}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="form-group"><label>Título</label><input name="title" value={formData.title} onChange={handleInputChange} required /></div>
              {(formData.type === "venta" || formData.type === "vivienda") && <div className="form-group"><label>Precio</label><input name="price" type="number" value={formData.price} onChange={handleInputChange} /></div>}
              {formData.type === "carpooling" && <div className="form-row"><input name="origin" placeholder="Origen" value={formData.origin} onChange={handleInputChange} /><input name="dest" placeholder="Destino" value={formData.dest} onChange={handleInputChange} /></div>}
              <div className="form-group"><label>Descripción</label><textarea name="desc" value={formData.desc} onChange={handleInputChange} rows={3} required></textarea></div>
              <button type="submit" className="btn-publish">Publicar</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE CONTACTO CON FEEDBACK VISUAL --- */}
      {isContactModalOpen && (
        <div className="modal-overlay" onClick={() => setIsContactModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setIsContactModalOpen(false)}>✕</button>
            <h2>Contactar</h2>
            <p style={{marginBottom: '1rem', color: '#64748b'}}>
              Para: <strong>{contactTarget?.email.split('@')[0]}</strong><br/>
              Tema: <em>{contactTarget?.title}</em>
            </p>
            <form onSubmit={handleSendMessage} className="post-form">
              <div className="form-group">
                <textarea 
                  value={messageText} 
                  onChange={(e) => setMessageText(e.target.value)} 
                  rows={5} 
                  placeholder="Escribe tu mensaje aquí..."
                  required
                  autoFocus
                  disabled={isSending} // Bloquear mientras envía
                ></textarea>
              </div>
              
              {/* BOTÓN CON CAMBIO DE ESTADO */}
              <button 
                type="submit" 
                className="btn-publish" 
                style={{
                  background: isSending ? '#94a3b8' : '#003049', 
                  cursor: isSending ? 'wait' : 'pointer'
                }}
                disabled={isSending}
              >
                {isSending ? "⏳ Enviando..." : "✉️ Enviar Mensaje"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Card = ({ post, isAdmin, currentUserEmail, isPinned, onPin, onDelete, onApprove, onContact }) => {
  const config = CATEGORIES[post.type] || CATEGORIES.otros;
  const isOwner = currentUserEmail && post.author === currentUserEmail;
  const canDelete = isAdmin || isOwner;

  return (
    <div className={`notice-card card-${post.type} ${post.status === 'pending' ? 'pending-card' : ''}`}>
      <div className="card-top">
        <span className="card-badge">{config.icon} {config.label}</span>
        <button className={`btn-pin ${isPinned ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onPin(); }}>{isPinned ? "★" : "☆"}</button>
      </div>

      <div className="card-content">
        <h3>{post.title}</h3>
        {post.type === "carpooling" && post.meta && (
            <div className="carpool-route">
                <div className="route-point"><span className="dot origin"></span> {post.meta.origen}</div>
                <div className="route-line"></div>
                <div className="route-point"><span className="dot dest"></span> {post.meta.destino}</div>
            </div>
        )}
        {(post.type === "venta" || post.type === "vivienda") && post.meta?.price && (
            <div className="price-tag">{post.meta.price}€</div>
        )}
        <p className="card-desc">{post.desc}</p>
        <div className="card-meta-footer">
          <span>{new Date(post.date).toLocaleDateString()} • {isOwner ? <strong>Tú</strong> : post.author.split('@')[0]}</span>
        </div>
      </div>

      <div className="admin-actions">
        {isAdmin && post.status === 'pending' && <button className="btn-approve" onClick={() => onApprove(post.id)}>✅ Aprobar</button>}
        {canDelete && <button className="btn-delete" onClick={() => onDelete(post.id)}>🗑️ Borrar</button>}
        
        {!isOwner && post.status === 'approved' && (
            <button onClick={onContact} style={{background: '#003049', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', fontWeight: '600', marginLeft: 'auto', cursor: 'pointer'}}>
                💬 Contactar
            </button>
        )}
      </div>
      {post.status === 'pending' && <div className="pending-overlay">En Revisión</div>}
    </div>
  );
};

export default NoticeBoard;