import React from "react";
// CORRECCIÓN: Quitamos la extensión .jsx para compatibilidad con el resto del proyecto
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Home.css";


export const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // OPTIMIZACIÓN: Calculamos los valores directamente desde localStorage durante el render.
  // Esto es más rápido y evita errores de renderizado en cascada o estados no definidos.

  // 1. Obtener conteo de reservas del usuario actual
  let reservaCount = 0;
  try {
    const savedReservations = JSON.parse(localStorage.getItem("reservations")) || [];
    reservaCount = savedReservations.filter(r => r.userEmail === user?.email).length;
  } catch (e) {
    console.error("Error al cargar reservas:", e);
  }

  // 2. Obtener los últimos 3 anuncios
  let highlights = [];
  try {
    const savedAnuncios = JSON.parse(localStorage.getItem("anuncios")) || [];
    highlights = [...savedAnuncios]
      .sort((a, b) => (b.fecha || b.id) - (a.fecha || a.id))
      .slice(0, 3);
  } catch (e) {
    console.error("Error al cargar anuncios:", e);
  }

  // Formatear el nombre del usuario para el saludo
  const userName = user?.email ? user.email.split('@')[0].split('.')[0] : "Estudiante";

  return (
    <div className="home-wrapper">
      
      {/* SECCIÓN DE BIENVENIDA */}
      <header className="home-welcome">
        <div className="welcome-text">
          <h1>Hola, <span className="name-accent">{userName}</span> 👋</h1>
          <p>Este es tu panel central de EUNEIZ. Aquí tienes un resumen de tu actividad.</p>
        </div>
        <div className="home-date-badge">
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
          })}
        </div>
      </header>

      <div className="home-main-grid">
        
        {/* COLUMNA IZQUIERDA: ACTIVIDAD Y NOVEDADES */}
        <div className="home-content-section">
          
          {/* RESUMEN DE HOY */}
          <section className="dashboard-card status-card">
            <h2 className="section-title">📊 Resumen de hoy</h2>
            <div className="status-container">
              <div className="status-box" onClick={() => navigate('/reservas')}>
                <span className="status-val">{reservaCount}</span>
                <span className="status-desc">Libros en préstamo</span>
              </div>
              <div className="status-box" onClick={() => navigate('/comunidad/comunidades')}>
                <span className="status-val">Explorar</span>
                <span className="status-desc">Nuevas Comunidades</span>
              </div>
            </div>
          </section>

          {/* HIGHLIGHTS DEL TABLÓN */}
          <section className="dashboard-card highlights-card">
            <div className="card-header-flex">
              <h2 className="section-title">📢 Últimos Avisos</h2>
              <button className="text-link-btn" onClick={() => navigate('/notice-board')}>Ver todo el tablón</button>
            </div>
            
            <div className="highlights-list">
              {highlights.length > 0 ? (
                highlights.map(anuncio => (
                  <div 
                    key={anuncio.id} 
                    className="notice-mini-card" 
                    onClick={() => navigate('/notice-board')}
                  >
                    <div className="mini-card-img">
                      <img src={anuncio.mediaURL || anuncio.imagenURL || "https://placehold.co/100x100?text=Aviso"} alt="" />
                    </div>
                    <div className="mini-card-body">
                      <span className={`mini-tag tag-${anuncio.categoria}`}>{anuncio.categoria}</span>
                      <h3>{anuncio.titulo}</h3>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-notices">
                  <p>No hay anuncios recientes en el tablón.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* COLUMNA DERECHA: ACCESOS RÁPIDOS */}
        <aside className="home-actions-section">
          <h2 className="section-title">Accesos Rápidos</h2>
          <nav className="shortcuts-grid">
            <button className="shortcut-btn" onClick={() => navigate('/library')}>
              <span className="shortcut-icon">📚</span>
              <div className="shortcut-text">
                <strong>Biblioteca</strong>
                <span>Reserva de libros</span>
              </div>
            </button>

            <button className="shortcut-btn" onClick={() => navigate('/notice-board')}>
              <span className="shortcut-icon">📢</span>
              <div className="shortcut-text">
                <strong>Tablón</strong>
                <span>Anuncios generales</span>
              </div>
            </button>

            <button className="shortcut-btn" onClick={() => navigate('/comunidad')}>
              <span className="shortcut-icon">👥</span>
              <div className="shortcut-text">
                <strong>Comunidad</strong>
                <span>Clubs y Estudiantes</span>
              </div>
            </button>

            <button className="shortcut-btn disabled-btn" title="Próximamente">
              <span className="shortcut-icon">🔑</span>
              <div className="shortcut-text">
                <strong>Aulas</strong>
                <span>Reserva de espacios</span>
              </div>
            </button>
          </nav>

          {/* CAJA DE AYUDA / SOP */}
          <div className="sop-highlight-box">
            <h3>¿Necesitas orientación?</h3>
            <p>El servicio SOP está disponible para consultas sobre bienestar o aprendizaje.</p>
            <button className="sop-action-btn" onClick={() => navigate('/comunidad/psicologia')}>
              Solicitar Orientación
            </button>
          </div>
        </aside>

      </div>
    </div>
  );
};

export default Home;