// src/pages/Home/Home.jsx
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Extraer nombre del email (ej: "juan.perez" de "juan.perez@euneiz.com")
  const userName = user?.email ? user.email.split('@')[0] : "Estudiante";

  // DATOS MOCK (Simulados para prototipar la UI según tu documento)
  const activeReservation = { 
    exists: true, 
    place: "Aula de Estudio 3", 
    time: "10:00 - 12:00", 
    status: "Confirmada" 
  };

  const highlights = [
    { id: 1, tag: "Oficial", title: "📅 Calendario de Exámenes publicado", color: "blue" },
    { id: 2, tag: "E-Sports", title: "🏆 Torneo LoL: Inscripciones abiertas", color: "purple" },
    { id: 3, tag: "Monte", title: "🌲 Salida al Gorbea este sábado", color: "green" },
  ];

  return (
    <div className="dashboard-container">
      {/* 1. HEADER / SALUDO */}
      <header className="dashboard-header">
        <div>
          <h1>Hola, <span className="highlight-text">{userName}</span> 👋</h1>
          <p className="subtitle">¿Qué quieres hacer hoy en Euneiz?</p>
        </div>
      </header>

      {/* 2. WIDGET: RESUMEN DE HOY (Requisito clave del doc) */}
      <section className="status-section">
        <h3>📍 Tu actividad para hoy</h3>
        {activeReservation.exists ? (
          <div className="status-card active-res">
            <div className="status-icon">🕒</div>
            <div className="status-info">
              <h4>{activeReservation.place}</h4>
              <p>{activeReservation.time} • <span className="status-badge">{activeReservation.status}</span></p>
            </div>
            <button className="btn-small">Ver QR</button>
          </div>
        ) : (
          <div className="status-card empty">
            <p>No tienes reservas activas para hoy.</p>
          </div>
        )}
      </section>

      {/* 3. ACCESOS RÁPIDOS (Grid de acciones) */}
      <section className="quick-actions">
        <h3>Accesos Rápidos</h3>
        <div className="actions-grid">
          <button className="action-card" onClick={() => navigate('/rooms')}>
            <span className="icon">🏢</span>
            <span>Reservar Aula</span>
          </button>
          <button className="action-card" onClick={() => navigate('/library')}>
            <span className="icon">📖</span>
            <span>Buscar Libro</span>
          </button>
          <button className="action-card" onClick={() => navigate('/communities')}>
            <span className="icon">👥</span>
            <span>Mis Clubes</span>
          </button>
        </div>
      </section>

      {/* 4. FEED DE NOVEDADES (Highlights) */}
      <section className="highlights-section">
        <h3>🔥 Novedades destacadas</h3>
        <div className="news-scroll">
          {highlights.map(item => (
            <div key={item.id} className="news-card">
              <span className={`tag tag-${item.color}`}>{item.tag}</span>
              <h4>{item.title}</h4>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};