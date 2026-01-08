import React, { useState, useEffect } from "react";
import "./NoticeBoard.css";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config"; // Importamos la DB
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp 
} from "firebase/firestore";

// --- CONFIGURACIÓN ---
const CATEGORIES = {
  secretaria: { label: "Avisos Secretaría", icon: "📢", color: "#e74c3c", adminOnly: true },
  eventos:    { label: "Eventos Uni",       icon: "🎉", color: "#3498db", adminOnly: false },
  carpooling: { label: "Carpooling",        icon: "🚗", color: "#2ecc71", adminOnly: false },
  perdidos:   { label: "Objetos Perdidos",  icon: "🔍", color: "#f39c12", adminOnly: false },
  venta:      { label: "Compra-Venta",      icon: "💸", color: "#9b59b6", adminOnly: false },
};

// --- SEGURIDAD: DEFINIR QUIÉN ES ADMIN ---
// En una app real esto iría en la base de datos (roles), pero para este proyecto,
// una lista blanca es segura y funcional.
const ADMIN_EMAILS = ["admin@euneiz.com", "secretaria@euneiz.com"];

export const NoticeBoard = () => {
  const { user } = useAuth();
  
  // Verifica si el usuario actual es admin
  const isUserAdmin = user && ADMIN_EMAILS.includes(user.email);

  // --- ESTADOS ---
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Fijado Local (Preferencia de usuario)
  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const saved = localStorage.getItem("my_pinned_notices");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Formulario
  const [formData, setFormData] = useState({
    type: "eventos", title: "", desc: "", price: "", origin: "", dest: "", contact: ""
  });

  // --- 1. CONEXIÓN A FIREBASE (REAL-TIME) ---
  useEffect(() => {
    // Escuchamos la colección "notices" ordenadas por fecha
    const q = query(collection(db, "notices"), orderBy("date", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- 2. GESTIÓN DE PINS (LOCAL STORAGE) ---
  useEffect(() => {
    localStorage.setItem("my_pinned_notices", JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  const togglePin = (id) => {
    setPinnedIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [id, ...prev]
    );
  };

  // --- 3. ACCIONES FIREBASE ---

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.desc) return alert("Rellena los campos obligatorios");

    try {
      // Los avisos de secretaría se auto-aprueban si eres admin
      const isSecretaria = formData.type === "secretaria";
      const initialStatus = (isUserAdmin || isSecretaria) ? "approved" : "pending";

      await addDoc(collection(db, "notices"), {
        type: formData.type,
        title: formData.title,
        desc: formData.desc,
        author: user?.email || "Anónimo",
        date: Date.now(), // Usamos timestamp numérico para facilitar orden
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
        alert("✅ Anuncio enviado a moderación. Espera a que secretaría lo valide.");
      }

    } catch (error) {
      console.error("Error al publicar:", error);
      alert("Error al conectar con el servidor.");
    }
  };

  const deletePost = async (id) => {
    if(!window.confirm("¿Seguro que quieres eliminar este anuncio de la base de datos?")) return;
    await deleteDoc(doc(db, "notices", id));
  };

  const approvePost = async (id) => {
    await updateDoc(doc(db, "notices", id), { status: "approved" });
  };

  // --- LÓGICA DE VISUALIZACIÓN ---
  
  // Filtramos posts visibles
  const visiblePosts = posts.filter(post => {
    const statusOk = isUserAdmin ? true : post.status === "approved"; // Admin ve todo, alumnos solo aprobados
    const typeOk = filter === "all" ? true : post.type === filter;
    return statusOk && typeOk;
  });

  // Separamos: Mis Fijados vs El Resto
  // Solo mostramos en "Fijados" aquellos que existen en visiblePosts (por si se borraron de la DB)
  const myPinnedPosts = visiblePosts.filter(p => pinnedIds.includes(p.id));
  const feedPosts = visiblePosts.filter(p => !pinnedIds.includes(p.id));

  if (loading) return <div className="nb-loading">Cargando tablón EUNEIZ...</div>;

  return (
    <div className="nb-container">
      
      <header className="nb-header">
        <div className="nb-header-content">
          <h1>📌 Tablón EUNEIZ</h1>
          <p>Comunidad universitaria {isUserAdmin && <span className="badge-admin">MODO ADMIN ACTIVO</span>}</p>
          
          <div className="nb-filters">
            <button className={`filter-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter("all")}>Todo</button>
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
        
        {/* SECCIÓN PERSONAL: MIS FIJADOS */}
        {myPinnedPosts.length > 0 && filter === 'all' && (
          <div className="nb-section-pinned">
            <h3>⭐ Mis Anuncios Fijados</h3>
            <div className="pinned-grid">
              {myPinnedPosts.map(post => (
                <Card 
                  key={post.id} 
                  post={post} 
                  isAdmin={isUserAdmin} 
                  isPinned={true}
                  onPin={() => togglePin(post.id)}
                  onDelete={deletePost}
                  onApprove={approvePost}
                />
              ))}
            </div>
          </div>
        )}

        {/* FEED GENERAL */}
        <div className="feed-grid">
          {feedPosts.length === 0 && myPinnedPosts.length === 0 ? (
            <div className="empty-feed">
              <span>📭</span>
              <p>No hay anuncios disponibles en esta categoría.</p>
            </div>
          ) : (
            feedPosts.map(post => (
              <Card 
                key={post.id} 
                post={post} 
                isAdmin={isUserAdmin} 
                isPinned={false}
                onPin={() => togglePin(post.id)}
                onDelete={deletePost}
                onApprove={approvePost}
              />
            ))
          )}
        </div>
      </main>

      <button className="fab-add" onClick={() => setIsModalOpen(true)}>+</button>

      {/* MODAL (Igual que antes pero ahora guarda en Firebase) */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Publicar Anuncio</h2>
            <form onSubmit={handleSubmit} className="post-form">
              <div className="form-group">
                <label>Categoría</label>
                <div className="cat-selector">
                  {Object.entries(CATEGORIES).map(([key, config]) => {
                    if (config.adminOnly && !isUserAdmin) return null; // Solo admin ve Secretaría
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
                <label>Título</label>
                <input type="text" name="title" required value={formData.title} onChange={handleInputChange} maxLength={60} />
              </div>

              {formData.type === "carpooling" && (
                <div className="form-row">
                  <input type="text" name="origin" placeholder="📍 Origen" value={formData.origin} onChange={handleInputChange} />
                  <span className="arrow">➝</span>
                  <input type="text" name="dest" placeholder="🏁 Destino" value={formData.dest} onChange={handleInputChange} />
                </div>
              )}

              {formData.type === "venta" && (
                <div className="form-group">
                  <label>Precio (€)</label>
                  <input type="number" name="price" placeholder="0.00" value={formData.price} onChange={handleInputChange} />
                </div>
              )}

              <div className="form-group">
                <label>Descripción</label>
                <textarea name="desc" required value={formData.desc} onChange={handleInputChange} rows={3}></textarea>
              </div>

              <div className="form-group">
                <label>Contacto</label>
                <input type="text" name="contact" value={formData.contact} onChange={handleInputChange} placeholder="Email o teléfono" />
              </div>

              <button type="submit" className="btn-publish">Publicar</button>
            </form>
            <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE CARD ---
const Card = ({ post, isAdmin, isPinned, onPin, onDelete, onApprove }) => {
  const config = CATEGORIES[post.type] || CATEGORIES.eventos;
  
  return (
    <div className={`notice-card card-${post.type} ${post.status === 'pending' ? 'pending-card' : ''}`}>
      <div className="card-top">
        <span className="card-badge" style={{ backgroundColor: config.color }}>
          {config.icon} {config.label}
        </span>
        {/* BOTÓN DE PIN INDIVIDUAL */}
        <button 
          className={`btn-pin ${isPinned ? 'active' : ''}`} 
          onClick={(e) => { e.stopPropagation(); onPin(); }}
          title={isPinned ? "Dejar de fijar" : "Fijar arriba"}
        >
          {isPinned ? "★" : "☆"}
        </button>
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
        {post.type === "venta" && post.meta?.price && <div className="price-tag">{post.meta.price} €</div>}
        
        <p className="card-desc">{post.desc}</p>
        
        <div className="card-meta-footer">
          <small>{new Date(post.date).toLocaleDateString()} • {post.author.split('@')[0]}</small>
          {post.meta?.contact && <span className="contact-pill">📞 {post.meta.contact}</span>}
        </div>
      </div>

      {/* BARRA DE MODERACIÓN (SOLO ADMINS) */}
      {isAdmin && (
        <div className="admin-actions">
          {post.status === 'pending' && <button className="btn-approve" onClick={() => onApprove(post.id)}>✅ Aprobar</button>}
          <button className="btn-delete" onClick={() => onDelete(post.id)}>🗑️ Borrar</button>
        </div>
      )}

      {post.status === 'pending' && <div className="pending-overlay">⏳ Revisión</div>}
    </div>
  );
};

export default NoticeBoard;