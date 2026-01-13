import React, { useState, useEffect } from "react";
import "./NoticeBoard.css";
import { useAuth } from "../../context/AuthContext";

// --- FIREBASE & CONFIG ---
// Importamos lo vital para que la base de datos no explote
import { db } from "../../firebase/config";
import { 
  collection, addDoc, deleteDoc, updateDoc, 
  doc, onSnapshot, query, orderBy 
} from "firebase/firestore";

// --- COMPONENTES & CONSTANTES ---
// Me traigo la lista de admins (profes y delegados) y mis componentes bonitos
import { ADMIN_EMAILS } from "../../config/constants"; 
import PageHeader from "../../components/UI/PageHeader";
import Modal from "../../components/UI/Modal";

// --- ICONOS (LUCIDE) ---
// Usamos Lucide porque son mucho más aesthetic que los de FontAwesome
import { 
  Megaphone, PartyPopper, Beer, Car, Home, 
  BadgeEuro, Search, Package, Plus, Pin, 
  MessageCircle, Trash2, CheckCircle, Calendar as CalIcon, Inbox as InboxIcon,
  X // La X por si acaso, aunque el modal ya trae una
} from "lucide-react";

// --- CONFIG DE CATEGORÍAS ---
// Aquí defino los colorinchis y los iconos de cada tema.
// Si quiero añadir "Apuntes", solo tengo que meter una línea más aquí y listo.
const CATEGORIES = {
  secretaria: { label: "Avisos Secretaría", icon: <Megaphone size={18} />, color: "#F1595C", adminOnly: true },
  eventos:    { label: "Eventos Uni",       icon: <PartyPopper size={18}/>, color: "#3498db", adminOnly: false },
  social:     { label: "Social",            icon: <Beer size={18} />,       color: "#e84393", adminOnly: false }, // La categoría más importante, obvio
  carpooling: { label: "Carpooling",        icon: <Car size={18} />,        color: "#2ecc71", adminOnly: false },
  vivienda:   { label: "Vivienda",          icon: <Home size={18} />,       color: "#00cec9", adminOnly: false },
  venta:      { label: "Compra-Venta",      icon: <BadgeEuro size={18} />,  color: "#9b59b6", adminOnly: false },
  perdidos:   { label: "Objetos Perdidos",  icon: <Search size={18} />,     color: "#f39c12", adminOnly: false },
  otros:      { label: "Otros",             icon: <Package size={18} />,    color: "#636e72", adminOnly: false },
};

export const NoticeBoard = () => {
  const { user } = useAuth();
  // Chequeamos si el user es VIP (Admin) para dejarle borrar cosas o aprobar posts
  const isUserAdmin = user && ADMIN_EMAILS.includes(user.email);

  // --- ESTADOS (La locura de React) ---
  const [posts, setPosts] = useState([]); // Aquí guardamos todos los anuncios
  const [loading, setLoading] = useState(true); // Para el spinner de carga
  const [filter, setFilter] = useState("all"); // Filtro: 'all', 'mine' o categorías
  
  // Control de las ventanas modales (abierto/cerrado)
  const [isModalOpen, setIsModalOpen] = useState(false); // El de crear anuncio
  const [isContactModalOpen, setIsContactModalOpen] = useState(false); // El de enviar mensajito
  const [selectedNotice, setSelectedNotice] = useState(null); // <--- NUEVO: Para ver el anuncio en grande (Super útil)
  
  // Cositas para el chat privado
  const [contactTarget, setContactTarget] = useState(null); // A quién le escribo
  const [messageText, setMessageText] = useState(""); // Qué le escribo
  const [isSending, setIsSending] = useState(false); // Para que no le den al botón mil veces

  // Los Pines se guardan en el LocalStorage para que no se pierdan al recargar (magia negra)
  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      const saved = localStorage.getItem("my_pinned_notices");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  // Estado del formulario (un objeto gigante para no tener 20 variables sueltas)
  const [formData, setFormData] = useState({
    type: "eventos", title: "", desc: "", price: "", origin: "", dest: "", contact: "", eventDate: ""
  });

  // 1. EFECTO: Cargar posts en tiempo real
  // Esto es lo mejor de Firebase: si alguien publica, me sale al instante sin refrescar la página.
  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe(); // Limpieza para no dejar procesos zombies
  }, []);

  // 2. EFECTO: Guardar los pines
  // Cada vez que pincho en la chincheta, actualizo el almacenamiento local
  useEffect(() => {
    localStorage.setItem("my_pinned_notices", JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  // Función para pinear/despinear (me encanta esta palabra inventada)
  const togglePin = (id) => {
    setPinnedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [id, ...prev]);
  };

  // Manejador genérico para los inputs del formulario
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. PUBLICAR ANUNCIO (El momento de la verdad)
  const handleSubmit = async (e) => {
    e.preventDefault(); // Que no se recargue la página por favor
    if (!formData.title || !formData.desc) return alert("Rellena los campos obligatorios, ¡no seas vago!");

    try {
      const isSecretaria = formData.type === "secretaria";
      // Si eres admin entras directo, si no... a la cola de moderación
      const initialStatus = (isUserAdmin || isSecretaria) ? "approved" : "pending";

      await addDoc(collection(db, "notices"), {
        type: formData.type,
        title: formData.title,
        desc: formData.desc,
        author: user?.email || "Anónimo",
        date: Date.now(),
        eventDate: formData.eventDate || null,
        status: initialStatus,
        meta: { // Aquí metemos todo lo extra para que quede ordenadito
          price: formData.price,
          origen: formData.origin,
          destino: formData.dest,
          contact: formData.contact
        }
      });

      setIsModalOpen(false);
      setFilter("all"); // Te cambio al filtro 'todos' para que veas tu obra de arte
      setFormData({ type: "eventos", title: "", desc: "", price: "", origin: "", dest: "", contact: "", eventDate: "" });      

      if (initialStatus === "pending") alert("✅ Anuncio enviado a moderación. (Paciencia, que los admins duermen)");
      
    } catch (error) {
      console.error("Error al publicar (pánico):", error);
    }
  };

  // 4. CHAT / MENSAJERÍA
  const handleOpenContact = (post) => {
    setContactTarget({ email: post.author, title: post.title, postId: post.id });
    setMessageText("");
    setIsSending(false); 
    setIsContactModalOpen(true);
    // Si estaba viendo el detalle, lo cierro para que no se superpongan los modales
    setSelectedNotice(null); 
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
      
      // Un pequeño delay para que parezca que procesamos algo (y para UX)
      setTimeout(() => {
        setIsSending(false);
        setIsContactModalOpen(false);
        alert("✅ Mensaje enviado. ¡Suerte!");
      }, 800);

    } catch (error) {
      console.error("Error enviando mensaje", error);
      setIsSending(false);
    }
  };

  // Gestión de borrar y aprobar (Solo para gente con poder)
  const deletePost = async (id) => {
    if(!window.confirm("¿Seguro que quieres borrarlo? No hay vuelta atrás...")) return;
    await deleteDoc(doc(db, "notices", id));
    if(selectedNotice?.id === id) setSelectedNotice(null); // Si lo estaba mirando, cierro el modal
  };

  const approvePost = async (id) => {
    await updateDoc(doc(db, "notices", id), { status: "approved" });
  };

  // Lógica de Filtrado (Matemáticas puras)
  const visiblePosts = posts.filter(post => {
    const isOwner = user && post.author === user.email;
    if (filter === 'mine') return isOwner;
    // Solo mostramos si es admin, es tuyo o ya está aprobado
    const statusOk = isUserAdmin || isOwner || post.status === "approved";
    const typeOk = filter === "all" ? true : post.type === filter;
    return statusOk && typeOk;
  });

  // Separamos los pineados del resto para que salgan arriba (Top Tier)
  const myPinnedPosts = filter === 'mine' ? [] : visiblePosts.filter(p => pinnedIds.includes(p.id));
  const feedPosts = filter === 'mine' ? visiblePosts : visiblePosts.filter(p => !pinnedIds.includes(p.id));

  if (loading) return <div className="nb-container" style={{padding: '2rem', textAlign:'center'}}>Cargando cotilleos...</div>;

  return (
    <div className="nb-container">
      <PageHeader title="Tablón de Anuncios" subtitle="Mantente al día con lo que pasa en el campus" />
      
      {/* --- BOTONES DE FILTRO --- */}
      <div className="nb-filters">
        <button className={`filter-pill ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter("all")}>Todo</button>
        <button className={`filter-pill ${filter === 'mine' ? 'active' : ''}`} onClick={() => setFilter("mine")}>Mis Anuncios</button>
        {Object.entries(CATEGORIES).map(([key, config]) => (
          <button key={key} className={`filter-pill ${filter === key ? 'active' : ''}`} style={{ '--cat-color': config.color }} onClick={() => setFilter(key)}>
            <span className="icon-wrapper" style={{color: filter === key ? 'white' : config.color}}>{config.icon}</span> {config.label}
          </button>
        ))}
      </div>

      {/* --- GRID PRINCIPAL --- */}
      <main className="nb-grid">
        {/* Sección de PINES (Mis favoritos) */}
        {myPinnedPosts.length > 0 && filter !== 'mine' && (
          <div className="nb-section-pinned">
            <h3><Pin size={20} /> Anuncios Fijados</h3>
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
                  onContact={() => handleOpenContact(post)} 
                  onClick={() => setSelectedNotice(post)} // Click para abrir modal
                />
              ))}
            </div>
          </div>
        )}

        {/* FEED NORMAL (El resto de mortales) */}
        <div className="feed-grid">
          {feedPosts.map(post => (
            <Card 
              key={post.id} 
              post={post} 
              isAdmin={isUserAdmin} 
              currentUserEmail={user?.email} 
              isPinned={false} 
              onPin={() => togglePin(post.id)} 
              onDelete={deletePost} 
              onApprove={approvePost} 
              onContact={() => handleOpenContact(post)} 
              onClick={() => setSelectedNotice(post)} 
            />
          ))}
          
          {feedPosts.length === 0 && myPinnedPosts.length === 0 && (
             <div className="empty-feed">
               <span style={{fontSize: '2rem'}}><InboxIcon size={24}/></span>
               <p style={{color: 'var(--text-light)'}}>Nada por aquí... ¡Sé el primero en publicar!</p>
             </div>
          )}
        </div>
      </main>

      {/* Botón Flotante (FAB) */}
      <button className="fab-add" onClick={() => setIsModalOpen(true)} title="Crear anuncio"><Plus size={32} /></button>

      {/* --- MODAL CREAR ANUNCIO --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Publicar Anuncio">
        <form onSubmit={handleSubmit} className="post-form">
           <div className="form-group">
            <label>Categoría</label>
            <div className="cat-selector">
              {Object.entries(CATEGORIES).map(([key, config]) => {
                if (config.adminOnly && !isUserAdmin) return null; // Si no eres admin, no ves lo de secretaría
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
            <input name="title" value={formData.title} onChange={handleInputChange} required placeholder="Título molón..." />
          </div>
          
          {/* Inputs condicionales (solo salen si eliges Eventos, Venta, etc.) */}
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
            <textarea name="desc" value={formData.desc} onChange={handleInputChange} rows={3} required placeholder="Cuéntanos más..."></textarea>
          </div>
          <button type="submit" className="btn-publish">Publicar Anuncio</button>
        </form>
      </Modal>

      {/* --- MODAL CONTACTO --- */}
      <Modal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} title="Contactar">
        <p className="contact-subtitle" style={{marginBottom: '1rem', color: 'var(--text-light)'}}>
          Mensaje para: <strong>{contactTarget?.email.split('@')[0]}</strong>
        </p>
        <form onSubmit={handleSendMessage} className="post-form">
          <div className="form-group">
            <textarea value={messageText} onChange={(e) => setMessageText(e.target.value)} rows={5} placeholder="Hola, me interesa tu anuncio..." required disabled={isSending}></textarea>
          </div>
          <button type="submit" className="btn-publish" disabled={isSending}>{isSending ? "Enviando..." : "Enviar Mensaje"}</button>
        </form>
      </Modal>

      {/* --- MODAL DE DETALLE (EL NUEVO) --- */}
      {/* Aquí mostramos toda la info cuando haces click en una tarjeta */}
      {selectedNotice && (
        <Modal isOpen={!!selectedNotice} onClose={() => setSelectedNotice(null)} title="Detalle del Anuncio">
          <div className="notice-detail-content">
            
            {/* Header del modal con icono y fecha */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
              <span style={{ 
                color: CATEGORIES[selectedNotice.type]?.color || '#666', 
                background: (CATEGORIES[selectedNotice.type]?.color || '#666') + '15',
                padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                {CATEGORIES[selectedNotice.type]?.icon} {CATEGORIES[selectedNotice.type]?.label}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#94a3b8' }}>
                {new Date(selectedNotice.date).toLocaleDateString()}
              </span>
            </div>

            <h2 style={{ fontSize: '1.5rem', margin: '0 0 1rem 0', color: '#1e293b' }}>{selectedNotice.title}</h2>

            {/* Datos extra (precio, fecha evento, ruta...) */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {selectedNotice.eventDate && (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                    <CalIcon size={16}/> <strong>Fecha:</strong> {new Date(selectedNotice.eventDate).toLocaleDateString()}
                 </div>
              )}
              {selectedNotice.meta?.price && (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: CATEGORIES[selectedNotice.type]?.color, fontWeight: 'bold' }}>
                    <BadgeEuro size={16}/> {selectedNotice.meta.price} €
                 </div>
              )}
              {selectedNotice.type === 'carpooling' && selectedNotice.meta && (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b' }}>
                    <Car size={16}/> {selectedNotice.meta.origen} ➝ {selectedNotice.meta.destino}
                 </div>
              )}
            </div>

            {/* El texto largo con scroll por si se enrollan mucho */}
            <div style={{ 
              background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', 
              lineHeight: '1.6', color: '#334155', whiteSpace: 'pre-wrap', marginBottom: '2rem',
              maxHeight: '40vh', overflowY: 'auto'
            }}>
              {selectedNotice.desc}
            </div>

            {/* Pie del modal con autor y botón contactar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
               <div style={{display:'flex', flexDirection:'column'}}>
                  <span style={{fontSize:'0.8rem', color:'#94a3b8'}}>Publicado por</span>
                  <strong style={{color:'#475569'}}>@{selectedNotice.author.split('@')[0]}</strong>
               </div>

               {user?.email !== selectedNotice.author && (
                 <button 
                    onClick={() => handleOpenContact(selectedNotice)}
                    style={{
                      background: 'var(--primary)', color: 'white', border: 'none', 
                      padding: '10px 20px', borderRadius: '10px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600'
                    }}
                 >
                   <MessageCircle size={18}/> Contactar
                 </button>
               )}
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

// --- SUBCOMPONENTE CARD (Tarjeta Individual) ---
const Card = ({ post, isAdmin, currentUserEmail, isPinned, onPin, onDelete, onApprove, onContact, onClick }) => {
  const config = CATEGORIES[post.type] || CATEGORIES.otros;
  const isOwner = currentUserEmail && post.author === currentUserEmail;
  const canDelete = isAdmin || isOwner;

  return (
    // IMPORTANTE: Le he puesto onClick para abrir el modal de detalle
    <div 
      className={`notice-card ${post.status === 'pending' ? 'pending-card' : ''}`} 
      style={{'--accent-color': config.color, cursor: 'pointer'}}
      onClick={onClick} 
    >
      <div className="card-accent-strip"></div>
      
      <div className="card-body-wrapper">
        <div className="card-top">
          <span className="card-badge" style={{color: config.color, backgroundColor: `${config.color}15`}}>
            {config.icon} {config.label}
          </span>
          {/* OJO: stopPropagation aquí es CLAVE para que al dar a la chincheta no se abra el modal gigante */}
          <button className={`btn-pin ${isPinned ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onPin(); }} title="Fijar">
            <Pin size={18} fill={isPinned ? "#F1595C" : "none"} />
          </button>
        </div>

        <h3 className="card-title">{post.title}</h3>

        {post.eventDate && (
          <div className="event-date-display">
             <CalIcon size={14}/> <strong>Fecha:</strong> {new Date(post.eventDate).toLocaleDateString()}
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

        {/* Solo mostramos un trocito, para verlo entero click en la tarjeta */}
        <p className="card-desc">{post.desc}</p>
        
        <div className="card-footer">
          <span className="author-info">
             {isOwner ? " Tú" : `@${post.author.split('@')[0]}`} • {new Date(post.date).toLocaleDateString()}
          </span>

          <div className="card-actions">
             {/* Acordaos del stopPropagation en TODOS los botones de acción */}
             {isAdmin && post.status === 'pending' && (
               <button className="icon-btn approve" onClick={(e) => { e.stopPropagation(); onApprove(post.id); }} title="Aprobar">
                 <CheckCircle size={18}/>
               </button>
             )}
             
             {canDelete && (
               <button className="icon-btn delete" onClick={(e) => { e.stopPropagation(); onDelete(post.id); }} title="Borrar">
                 <Trash2 size={18}/>
               </button>
             )}
             
             {!isOwner && post.status === 'approved' && (
                <button className="icon-btn contact" onClick={(e) => { e.stopPropagation(); onContact(); }} title="Contactar">
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