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

// --- CONFIGURACIÓN DE CATEGORÍAS (Define colores y metadatos) ---
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

  // --- ESTADOS ---
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'mine', o clave de categoría
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado local para anuncios fijados
  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const saved = localStorage.getItem("my_pinned_notices");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [formData, setFormData] = useState({
    type: "eventos", title: "", desc: "", price: "", origin: "", dest: "", contact: ""
  });

  // --- EFECTOS ---
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

  // --- ACCIONES ---
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
        alert("✅ Anuncio enviado a moderación. Puedes verlo en la sección 'Mis Anuncios'.");
      }
    } catch (error) {
      console.error("Error al publicar:", error);
      alert("Error al conectar con el servidor.");
    }
  };

  const deletePost = async (id) => {
    if(!window.confirm("¿Borrar este anuncio permanentemente?")) return;
    await deleteDoc(doc(db, "notices", id));
  };

  const approvePost = async (id) => {
    await updateDoc(doc(db, "notices", id), { status: "approved" });
  };

  // --- LÓGICA DE VISUALIZACIÓN ---
  const visiblePosts = posts.filter(post => {
    const isOwner = user && post.author === user.email;
    
    // Modo "Mis Anuncios": Solo muestra lo mío (aprobado o pendiente)
    if (filter === 'mine') return isOwner;

    // Modo Normal: Muestra si es admin, dueño, o está aprobado
    const statusOk = isUserAdmin || isOwner || post.status === "approved";
    const typeOk = filter === "all" ? true : post.type === filter;

    return statusOk && typeOk;
  });

  const myPinnedPosts = filter === 'mine' ? [] : visiblePosts.filter(p => pinnedIds.includes(p.id));
  const feedPosts = filter === 'mine' ? visiblePosts : visiblePosts.filter(p => !pinnedIds.includes(p.id));

  if (loading) return <div className="nb-loading">Cargando tablón EUNEIZ...</div>;

  return (
    <div className="nb-container">
      <header className="nb-header">
        <div className="nb-header-content">
          <h1>📌 Tablón EUNEIZ</h1>
          <p>
            Comunidad universitaria 
            {isUserAdmin && <span className="badge-admin">Modo Admin</span>}
          </p>
          
          <div className="nb-filters">
            <button 
              className={`filter-pill ${filter === 'all' ? 'active' : ''}`} 
              onClick={() => setFilter("all")}
            >
              Todo
            </button>
            
            <button 
              className={`filter-pill ${filter === 'mine' ? 'active' : ''}`} 
              onClick={() => setFilter("mine")}
              style={{ '--cat-color': '#34495e' }}
            >
              👤 Mis Anuncios
            </button>

            {Object.entries(CATEGORIES).map(([key, config]) => (
              <button 
                key={key}
                className={`filter-pill ${filter === key ? 'active' : ''}`}
                style={{ '--cat-color': config.color }}
                onClick={() => setFilter(key)}
              >
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
                <Card 
                  key={post.id} 
                  post={post} 
                  isAdmin={isUserAdmin} 
                  currentUserEmail={user?.email}
                  isPinned={true}
                  onPin={() => togglePin(post.id)}
                  onDelete={deletePost}
                  onApprove={approvePost}
                />
              ))}
            </div>
          </div>
        )}

        <div className="feed-grid">
          {feedPosts.length === 0 && myPinnedPosts.length === 0 ? (
            <div className="empty-feed">
              <span>📭</span>
              <p>
                {filter === 'mine' 
                  ? "Aún no has publicado nada." 
                  : "No hay anuncios en esta categoría."}
              </p>
            </div>
          ) : (
            feedPosts.map(post => (
              <Card 
                key={post.id} 
                post={post} 
                isAdmin={isUserAdmin} 
                currentUserEmail={user?.email}
                isPinned={false}
                onPin={() => togglePin(post.id)}
                onDelete={deletePost}
                onApprove={approvePost}
              />
            ))
          )}
        </div>
      </main>

      <button className="fab-add" onClick={() => setIsModalOpen(true)} title="Nuevo Anuncio">+</button>

      {/* MODAL CREACIÓN */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>✕</button>
            <h2>Publicar Anuncio</h2>
            
            <form onSubmit={handleSubmit} className="post-form">
              <div className="form-group">
                <label>Elige una categoría</label>
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

              <div className="form-group">
                <label>Título breve</label>
                <input type="text" name="title" required value={formData.title} onChange={handleInputChange} maxLength={60} placeholder="Ej: Vendo apuntes de Anatomía..." />
              </div>

              {formData.type === "carpooling" && (
                <div className="form-row">
                  <div className="form-group" style={{flex:1}}>
                    <input type="text" name="origin" placeholder="📍 Origen" value={formData.origin} onChange={handleInputChange} />
                  </div>
                  <div className="form-group" style={{flex:1}}>
                    <input type="text" name="dest" placeholder="🏁 Destino" value={formData.dest} onChange={handleInputChange} />
                  </div>
                </div>
              )}

              {(formData.type === "venta" || formData.type === "vivienda") && (
                <div className="form-group">
                  <label>{formData.type === "vivienda" ? "Alquiler mensual (€)" : "Precio (€)"}</label>
                  <input type="number" name="price" placeholder="0.00" value={formData.price} onChange={handleInputChange} />
                </div>
              )}

              <div className="form-group">
                <label>Descripción detallada</label>
                <textarea name="desc" required value={formData.desc} onChange={handleInputChange} rows={4} placeholder="Cuenta los detalles importantes..."></textarea>
              </div>

              <div className="form-group">
                <label>Contacto (Visible para todos)</label>
                <input type="text" name="contact" value={formData.contact} onChange={handleInputChange} placeholder="Tu email, teléfono o Instagram" />
              </div>

              <button type="submit" className="btn-publish">Publicar Anuncio</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE CARD ---
const Card = ({ post, isAdmin, currentUserEmail, isPinned, onPin, onDelete, onApprove }) => {
  // Aseguramos que siempre haya una config, por si se borra una categoría
  const config = CATEGORIES[post.type] || CATEGORIES.otros;
  
  const isOwner = currentUserEmail && post.author === currentUserEmail;
  const canDelete = isAdmin || isOwner;

  return (
    <div className={`notice-card card-${post.type} ${post.status === 'pending' ? 'pending-card' : ''}`}>
      
      {/* HEADER CARD */}
      <div className="card-top">
        <span className="card-badge">
          {config.icon} {config.label}
        </span>
        <button 
          className={`btn-pin ${isPinned ? 'active' : ''}`} 
          onClick={(e) => { e.stopPropagation(); onPin(); }}
          title={isPinned ? "Dejar de fijar" : "Fijar arriba"}
        >
          {isPinned ? "★" : "☆"}
        </button>
      </div>

      {/* CONTENIDO */}
      <div className="card-content">
        <h3>{post.title}</h3>

        {/* Bloque Carpooling */}
        {post.type === "carpooling" && post.meta && (
          <div className="carpool-route">
            <div className="route-point"><span className="dot origin"></span> {post.meta.origen || "?"}</div>
            <div className="route-line"></div>
            <div className="route-point"><span className="dot dest"></span> {post.meta.destino || "?"}</div>
          </div>
        )}

        {/* Bloque Precio */}
        {(post.type === "venta" || post.type === "vivienda") && post.meta?.price && (
          <div className="price-tag">
            {post.meta.price}€ <small style={{fontSize:'0.6em', color:'gray'}}>{post.type === "vivienda" ? "/ mes" : ""}</small>
          </div>
        )}

        <p className="card-desc">{post.desc}</p>
        
        <div className="card-meta-footer">
          <span>{new Date(post.date).toLocaleDateString()} • {isOwner ? <strong>Tú</strong> : post.author.split('@')[0]}</span>
          {post.meta?.contact && <span className="contact-pill">📞 {post.meta.contact}</span>}
        </div>
      </div>

      {/* ACCIONES (Admin/Owner) */}
      {(isAdmin || canDelete) && (
        <div className="admin-actions">
          {isAdmin && post.status === 'pending' && (
            <button className="btn-approve" onClick={() => onApprove(post.id)}>✅ Aprobar</button>
          )}
          {canDelete && (
            <button className="btn-delete" onClick={() => onDelete(post.id)}>🗑️ Borrar</button>
          )}
        </div>
      )}

      {/* ESTADO PENDIENTE */}
      {post.status === 'pending' && <div className="pending-overlay">En Revisión</div>}
    </div>
  );
};

export default NoticeBoard;