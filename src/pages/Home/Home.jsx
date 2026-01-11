import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
// IMPORTANTE: db y herramientas para el contador de mensajes
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "./Home.css";

// ICONOS
import { 
  Pencil, Calendar, BookOpen, Users, 
  LayoutDashboard, Key, ArrowRight, Trophy,
  Mail // Nuevo icono para buzón
} from "lucide-react";

// DATA IMPORT
import { academicEvents } from "../Calendar/data"; 

// ASSETS
import AvatarBandage from "../../assets/avatars/Avatar-Bandage.svg";
import AvatarRaqueta from "../../assets/avatars/Avatar-Raqueta.svg";
import AvatarRobot from "../../assets/avatars/Avatar-Robot.svg";
import AvatarVideogame from "../../assets/avatars/Avatar-Videogame.svg";

const AVATAR_OPTIONS = [
  { id: "bandage", src: AvatarBandage, label: "Salud" },
  { id: "raqueta", src: AvatarRaqueta, label: "Deporte" },
  { id: "robot", src: AvatarRobot, label: "Tech" },
  { id: "videogame", src: AvatarVideogame, label: "Gamer" },
];

export const Home = () => {
  const { user } = useAuth();
  
  // --- ESTADOS ---
  const [currentAvatar, setCurrentAvatar] = useState(AvatarRobot); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [myReservationsCount, setMyReservationsCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0); // Nuevo estado para mensajes

  // 1. Cargar Avatar
  useEffect(() => {
    const saved = localStorage.getItem("user_avatar_choice");
    if (saved) {
      const found = AVATAR_OPTIONS.find(av => av.id === saved);
      if (found) setCurrentAvatar(found.src);
    }
  }, []);

  // 2. Cargar Reservas y Mensajes (En tiempo real)
  useEffect(() => {
    if (!user?.email) return;

    // A) Reservas Biblioteca
    const qRes = query(collection(db, "reservas_libros"), where("userEmail", "==", user.email));
    const unsubRes = onSnapshot(qRes, (snapshot) => {
      setMyReservationsCount(snapshot.docs.length);
    });

    // B) Mensajes Sin Leer (Para el indicador)
    const qMsgs = query(
      collection(db, "messages"),
      where("to", "==", user.email),
      where("read", "==", false)
    );
    const unsubMsgs = onSnapshot(qMsgs, (snapshot) => {
      setUnreadMessages(snapshot.docs.length);
    });

    return () => { unsubRes(); unsubMsgs(); };
  }, [user]);

  // 3. Próximo Evento
  const nextEvent = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const upcoming = academicEvents
      .filter(ev => (ev.start || ev.date) >= today)
      .sort((a,b) => (a.start || a.date).localeCompare(b.start || b.date));
    return upcoming[0] || null;
  }, []);

  const handleSelectAvatar = (option) => {
    setCurrentAvatar(option.src);
    localStorage.setItem("user_avatar_choice", option.id);
    setIsModalOpen(false);
  };

  const userName = user?.email 
    ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1).split('.')[0]
    : "Estudiante";

  const todayDate = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="home-container">
      
      {/* === HEADER === */}
      <section className="home-welcome-card">
        
        {/* NUEVO: Botón de Mensajes en la esquina superior derecha */}
        <Link to="/home/inbox" className="btn-inbox-home" title="Ir a Mensajes">
          <Mail size={22} />
          {unreadMessages > 0 && (
            <span className="unread-badge">{unreadMessages}</span>
          )}
        </Link>

        <div className="home-welcome-info">
          <span className="home-welcome-label">Hola de nuevo,</span>
          <h1 className="home-user-name">{userName}</h1>
          <div className="home-date-display">
            <Calendar size={14} /> {todayDate.charAt(0).toUpperCase() + todayDate.slice(1)}
          </div>
        </div>

        <div className="home-avatar-section">
          <img src={currentAvatar} alt="Avatar" className="home-avatar-large" />
          <button className="home-btn-edit" onClick={() => setIsModalOpen(true)} title="Cambiar avatar">
            <Pencil size={16} />
          </button>
        </div>
      </section>

      {/* === ACCESOS RÁPIDOS === */}
      <h3 className="home-section-title"><LayoutDashboard size={20}/> Accesos Rápidos</h3>
      
      <div className="home-quick-actions">
        <Link to="/library" className="home-action-card">
          <div className="home-icon-box"><BookOpen size={28}/></div>
          <span className="home-action-label">Biblioteca</span>
        </Link>
        <Link to="/rooms" className="home-action-card">
          <div className="home-icon-box"><Key size={28}/></div>
          <span className="home-action-label">Reservar Aula</span>
        </Link>
        <Link to="/calendar" className="home-action-card">
          <div className="home-icon-box"><Calendar size={28}/></div>
          <span className="home-action-label">Mi Agenda</span>
        </Link>
        <Link to="/comunidad/comunidades" className="home-action-card">
          <div className="home-icon-box"><Users size={28}/></div>
          <span className="home-action-label">Comunidad</span>
        </Link>
      </div>

      {/* === WIDGETS === */}
      <div className="home-dashboard-grid">
        
        {/* WIDGET AGENDA */}
        <div className="home-widget-card">
          <div className="home-widget-header">
            <h3><Calendar size={18}/> Próximo Evento</h3>
            <Link to="/calendar" style={{color:'var(--accent)', fontSize:'0.85rem', fontWeight:600}}>Ver todo</Link>
          </div>
          {nextEvent ? (
            <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
              <div style={{
                background:'#eff6ff', color:'var(--primary)', width:'60px', height:'60px',
                borderRadius:'14px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'
              }}>
                <span style={{fontSize:'1.4rem', fontWeight:'800', lineHeight:1}}>{new Date(nextEvent.date || nextEvent.start).getDate()}</span>
                <small style={{fontSize:'0.7rem', fontWeight:'700', textTransform:'uppercase'}}>MES</small>
              </div>
              <div>
                <h4 style={{margin:0, fontSize:'1rem', color:'var(--text-main)'}}>{nextEvent.title}</h4>
                <p style={{margin:'4px 0 0', fontSize:'0.85rem', color:'var(--text-light)'}}>
                  {nextEvent.type === 'academic' ? 'Académico' : 'Evento'} • Todo el día
                </p>
              </div>
            </div>
          ) : (
            <p style={{color:'#94a3b8'}}>No tienes eventos próximos.</p>
          )}
        </div>

        {/* WIDGET BIBLIOTECA */}
        <div className="home-widget-card">
          <div className="home-widget-header">
            <h3><BookOpen size={18}/> Préstamos</h3>
            <Link to="/library" state={{ view: 'reservas' }} style={{color:'var(--accent)', fontSize:'0.85rem', fontWeight:600}}>
              Ver
            </Link>
          </div>
          <div style={{textAlign:'center', padding:'1rem 0'}}>
             {myReservationsCount > 0 ? (
               <>
                 <div style={{fontSize:'2.5rem', fontWeight:'800', color:'var(--accent)', lineHeight:1}}>{myReservationsCount}</div>
                 <div style={{color:'var(--text-light)', fontSize:'0.9rem'}}>Libros activos</div>
               </>
             ) : (
               <div style={{color:'#94a3b8', padding:'0.5rem'}}>
                 <p style={{margin:0}}>Todo devuelto.</p>
               </div>
             )}
          </div>
        </div>
        
        {/* WIDGET CLUBS */}
        <div className="home-widget-card" style={{background: 'linear-gradient(135deg, #000B3D 0%, #1e3a8a 100%)', color:'white'}}>
           <h3 style={{color:'white', marginTop:0, display:'flex', alignItems:'center', gap:'8px'}}>
             <Trophy size={18} color="#FFD700"/> Ligas EUNEIZ
           </h3>
           <p style={{opacity:0.9, fontSize:'0.9rem', marginBottom:'1.5rem'}}>
             Revisa la clasificación y próximos partidos.
           </p>
           <Link to="/comunidad/competiciones" style={{
             marginTop:'auto', background:'white', color:'var(--primary)', padding:'0.8rem', 
             borderRadius:'12px', textAlign:'center', fontWeight: 'bold', display: 'flex', alignItems:'center', justifyContent:'center', gap:'8px', textDecoration:'none'
           }}>
             Clasificación <ArrowRight size={16}/>
           </Link>
        </div>
      </div>

      {/* === MODAL === */ }
      {isModalOpen && (
        <div className="home-modal-overlay" onClick={() => setIsModalOpen(false)}>
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