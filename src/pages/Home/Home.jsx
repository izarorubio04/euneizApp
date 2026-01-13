import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
// Configuración de Firebase y las funciones que necesitamos para la base de datos
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "./Home.css";

// Importación de iconos (usamos lucide-react porque son más limpios)
import { 
  Pencil, Calendar, BookOpen, Users, 
  LayoutDashboard, Key, ArrowRight, Trophy,
  Mail 
} from "lucide-react";

// Datos estáticos (eventos académicos, etc.)
import { academicEvents } from "../Calendar/data"; 

// Importación de las imágenes de los avatares
import AvatarBandage from "../../assets/avatars/Avatar-Bandage.svg";
import AvatarRaqueta from "../../assets/avatars/Avatar-Raqueta.svg";
import AvatarRobot from "../../assets/avatars/Avatar-Robot.svg";
import AvatarVideogame from "../../assets/avatars/Avatar-Videogame.svg";

// Array constante para mapear las opciones en el modal de selección
const AVATAR_OPTIONS = [
  { id: "bandage", src: AvatarBandage, label: "Salud" },
  { id: "raqueta", src: AvatarRaqueta, label: "Deporte" },
  { id: "robot", src: AvatarRobot, label: "Tech" },
  { id: "videogame", src: AvatarVideogame, label: "Gamer" },
];

export const Home = () => {
  const { user } = useAuth();
  
  // --- ESTADOS LOCALES ---
  // Estado para controlar qué avatar se muestra (por defecto el robot)
  const [currentAvatar, setCurrentAvatar] = useState(AvatarRobot); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Contadores para las notificaciones y widgets
  const [myReservationsCount, setMyReservationsCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0); 

  // 1. Efecto: Persistencia del Avatar
  // Comprobamos si el usuario ya había elegido un avatar anteriormente en este navegador
  useEffect(() => {
    const saved = localStorage.getItem("user_avatar_choice");
    if (saved) {
      const found = AVATAR_OPTIONS.find(av => av.id === saved);
      // Si encontramos el ID guardado, actualizamos el estado visual
      if (found) setCurrentAvatar(found.src);
    }
  }, []);

  // 2. Efecto: Conexión con Firebase (Tiempo Real)
  // Usamos onSnapshot para que si algo cambia en la BD, se actualice la UI al momento
  useEffect(() => {
    // Si no hay usuario logueado, no hacemos consultas para evitar errores
    if (!user?.email) return;

    // A) Escuchar cambios en Reservas de Libros del usuario actual
    const qRes = query(collection(db, "reservas_libros"), where("userEmail", "==", user.email));
    const unsubRes = onSnapshot(qRes, (snapshot) => {
      setMyReservationsCount(snapshot.docs.length);
    });

    // B) Escuchar Mensajes nuevos (donde yo soy el destinatario y no están leídos)
    const qMsgs = query(
      collection(db, "messages"),
      where("to", "==", user.email),
      where("read", "==", false)
    );
    const unsubMsgs = onSnapshot(qMsgs, (snapshot) => {
      setUnreadMessages(snapshot.docs.length);
    });

    // Función de limpieza: "apaga" los escuchadores cuando el componente se desmonta
    return () => { unsubRes(); unsubMsgs(); };
  }, [user]);

  // 3. Lógica para el Widget de "Próximo Evento"
  // Usamos useMemo para no recalcular esto en cada render si los eventos no cambian
  const nextEvent = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // Filtramos solo eventos futuros y los ordenamos por fecha
    const upcoming = academicEvents
      .filter(ev => (ev.start || ev.date) >= today)
      .sort((a,b) => (a.start || a.date).localeCompare(b.start || b.date));
      
    return upcoming[0] || null; // Devolvemos el primero o null si no hay nada
  }, []);

  // Manejador para cambiar el avatar y guardar la preferencia
  const handleSelectAvatar = (option) => {
    setCurrentAvatar(option.src);
    localStorage.setItem("user_avatar_choice", option.id); // Guardamos en local para la próxima vez
    setIsModalOpen(false); // Cerramos el modal
  };

  // Formateo del nombre: Cogemos lo que hay antes del @ y ponemos mayúscula inicial
  // Esto queda más personal que poner el email entero
  const userName = user?.email 
    ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1).split('.')[0]
    : "Estudiante";

  // Fecha actual formateada en español (Ej: Lunes, 12 de enero)
  const todayDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="home-container">
      {/* Fondo decorativo sutil para romper el blanco */}
      <div className="home-bg-decoration"></div>
      
      {/* === SECCIÓN HEADER / PERFIL === */}
      <section className="home-welcome-card">
        
        {/* Botón flotante de Mensajes (Inbox) */}
        <Link to="/home/inbox" className="btn-inbox-home" title="Ir a Mensajes">
          <Mail size={22} />
          {/* Solo mostramos la burbuja roja si hay mensajes sin leer */}
          {unreadMessages > 0 && (
            <span className="unread-badge">{unreadMessages}</span>
          )}
        </Link>

        {/* Info del Usuario */}
        <div className="home-welcome-info">
          <span className="home-welcome-label">Hola de nuevo,</span>
          <h1 className="home-user-name">{userName}</h1>
          <div className="home-date-display">
            {/* Capitalizamos la primera letra del día porque toLocaleDateString lo da en minúscula */}
            <Calendar size={14} /> {todayDate.charAt(0).toUpperCase() + todayDate.slice(1)}
          </div>
        </div>

        {/* Avatar editable */}
        <div className="home-avatar-section">
          <div className="avatar-glow-ring"></div>
          <img src={currentAvatar} alt="Avatar" className="home-avatar-large" />
          <button className="home-btn-edit" onClick={() => setIsModalOpen(true)} title="Cambiar avatar">
            <Pencil size={16} />
          </button>
        </div>
      </section>

      {/* === ACCESOS RÁPIDOS (GRID DE ICONOS) === */}
      <h3 className="home-section-title"><LayoutDashboard size={20}/> Accesos Rápidos</h3>
      
      <div className="home-quick-actions">
        <Link to="/library" className="home-action-card">
          <div className="home-icon-box"><BookOpen size={26}/></div>
          <span className="home-action-label">Biblioteca</span>
        </Link>
        <Link to="/rooms" className="home-action-card">
          <div className="home-icon-box"><Key size={26}/></div>
          <span className="home-action-label">Reservar Aula</span>
        </Link>
        <Link to="/calendar" className="home-action-card">
          <div className="home-icon-box"><Calendar size={26}/></div>
          <span className="home-action-label">Mi Agenda</span>
        </Link>
        <Link to="/comunidad/comunidades" className="home-action-card">
          <div className="home-icon-box"><Users size={26}/></div>
          <span className="home-action-label">Comunidad</span>
        </Link>
      </div>

      {/* === WIDGETS INFORMATIVOS === */}
      <div className="home-dashboard-grid">
        
        {/* 1. WIDGET AGENDA */}
        <div className="home-widget-card widget-agenda">
          <div className="home-widget-header">
            <h3><Calendar size={18}/> Próximo Evento</h3>
            <Link to="/calendar" style={{color:'var(--accent)', fontSize:'0.85rem', fontWeight:600}}>Ver todo</Link>
          </div>
          {nextEvent ? (
            <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
              {/* Caja de fecha estilo calendario: Ahora usamos colores corporativos fuertes */}
              <div style={{
                background:'var(--primary)', color:'white', width:'60px', height:'60px',
                borderRadius:'14px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                boxShadow: '0 4px 10px rgba(0,11,61,0.2)'
              }}>
                <span style={{fontSize:'1.4rem', fontWeight:'800', lineHeight:1}}>{new Date(nextEvent.date || nextEvent.start).getDate()}</span>
                <small style={{fontSize:'0.65rem', fontWeight:'700', textTransform:'uppercase', opacity: 0.8}}>MES</small>
              </div>
              <div>
                <h4 style={{margin:0, fontSize:'1rem', color:'var(--primary)', fontWeight:'700'}}>{nextEvent.title}</h4>
                <p style={{margin:'4px 0 0', fontSize:'0.85rem', color:'var(--text-light)'}}>
                  {nextEvent.type === 'academic' ? 'Académico' : 'Evento'} • Todo el día
                </p>
              </div>
            </div>
          ) : (
            <div style={{padding: '1rem 0', textAlign: 'center'}}>
               <p style={{color:'#94a3b8', margin: 0}}>No tienes eventos próximos.</p>
            </div>
          )}
        </div>

        {/* 2. WIDGET BIBLIOTECA (Estado de préstamos) */}
        <div className="home-widget-card widget-library">
          <div className="home-widget-header">
            <h3><BookOpen size={18}/> Préstamos</h3>
            {/* Pasamos un state en el Link para que la biblioteca se abra directamente en la pestaña de mis reservas */}
            <Link to="/library" state={{ view: 'reservas' }} style={{color:'var(--accent)', fontSize:'0.85rem', fontWeight:600}}>
              Ver
            </Link>
          </div>
          <div style={{textAlign:'center', padding:'0.5rem 0'}}>
             {myReservationsCount > 0 ? (
               <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                 <div style={{
                   fontSize:'2.8rem', fontWeight:'800', color:'var(--primary)', lineHeight:1,
                   textShadow: '2px 2px 0px rgba(0,0,0,0.05)'
                 }}>
                   {myReservationsCount}
                 </div>
                 <div style={{color:'var(--accent)', fontWeight: '600', fontSize:'0.9rem', marginTop: '0.2rem'}}>Libros activos</div>
               </div>
             ) : (
               <div style={{color:'#94a3b8', padding:'0.5rem'}}>
                 <p style={{margin:0}}>Todo devuelto.</p>
               </div>
             )}
          </div>
        </div>
        
        {/* 3. WIDGET CLUBS / COMPETICIÓN (Estilo destacado) */}
        <div className="home-widget-card widget-leagues" style={{background: 'linear-gradient(135deg, #000B3D 0%, #1e3a8a 100%)', color:'white'}}>
           <div style={{position: 'absolute', top: 0, right: 0, opacity: 0.1}}>
             <Trophy size={100} />
           </div>
           <h3 style={{color:'white', marginTop:0, display:'flex', alignItems:'center', gap:'8px', position: 'relative', zIndex: 1}}> Ligas EUNEIZ
           </h3>
           <p style={{opacity:0.9, fontSize:'0.9rem', marginBottom:'1.5rem', position: 'relative', zIndex: 1}}>
             Revisa la clasificación y próximos partidos.
           </p>
           <Link to="/comunidad/competiciones" style={{
             marginTop:'auto', background:'white', color:'var(--primary)', padding:'0.8rem', 
             borderRadius:'12px', textAlign:'center', fontWeight: 'bold', display: 'flex', alignItems:'center', justifyContent:'center', gap:'8px', textDecoration:'none',
             position: 'relative', zIndex: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
           }}>
             Clasificación <ArrowRight size={16}/>
           </Link>
        </div>
      </div>

      {/* === MODAL DE SELECCIÓN DE AVATAR === */ }
      {isModalOpen && (
        <div className="home-modal-overlay" onClick={() => setIsModalOpen(false)}>
          {/* stopPropagation evita que el click dentro del modal lo cierre */}
          <div className="home-modal-content" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setIsModalOpen(false)}
              style={{position:'absolute', top:'1rem', right:'1rem', background:'none', border:'none', cursor:'pointer', fontSize:'1.2rem', color:'#94a3b8'}}
            >✕</button>
            <h2 style={{color:'var(--primary)', margin:'0'}}>Elige personaje</h2>
            <div className="home-avatar-grid">
              {AVATAR_OPTIONS.map(opt => (
                <div 
                  key={opt.id} 
                  className={`home-avatar-option ${currentAvatar === opt.src ? 'selected' : ''}`}
                  onClick={() => handleSelectAvatar(opt)}
                >
                  <img src={opt.src} alt={opt.label} />
                  <span style={{display:'block', fontSize:'0.8rem', fontWeight:700, color:'#475569'}}>{opt.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};