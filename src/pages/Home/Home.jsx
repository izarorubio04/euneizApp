import React from "react";
// CORRECCIÓN: Quitamos la extensión .jsx para compatibilidad con el resto del proyecto
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Extraer nombre del email (ej: "juan.perez" de "juan.perez@euneiz.com")
  const userName = user?.email ? user.email.split('@')[0] : "Estudiante";

  // DATOS MOCK (Simulados para prototipar la UI "Pro")
  const nextClass = {
    subject: "Diseño de Interfaces",
    time: "10:00 - 12:00",
    room: "Aula 2.4",
    professor: "Dr. García"
  };

  const pendingTasks = [
    { id: 1, title: "Entrega Proyecto Final", due: "Mañana", urgent: true },
    { id: 2, title: "Leer capítulo 4 de UX", due: "Viernes", urgent: false },
  ];

  const newsFeed = [
    { id: 1, tag: "Evento", title: "Hackathon EUNEIZ 2024", date: "20 Oct", color: "purple" },
    { id: 2, tag: "Aviso", title: "Cierre de biblioteca por mantenimiento", date: "22 Oct", color: "red" },
    { id: 3, tag: "Deportes", title: "Torneo de Pádel: Inscripciones", date: "25 Oct", color: "green" },
  ];

  return (
    <div className="home-dashboard">
      
      {/* --- HEADER --- */}
      <header className="dashboard-header">
        <div className="header-text">
          <h1>Hola, <span className="user-highlight">{userName}</span> 👋</h1>
          <p>¿Listo para aprender algo nuevo hoy?</p>
        </div>
        <div className="header-date">
          <span>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </header>

      {/* --- GRID PRINCIPAL --- */}
      <div className="dashboard-grid">

        {/* COLUMNA IZQUIERDA (Principal) */}
        <div className="main-column">
          
          {/* Widget: Próxima Clase */}
          <section className="widget next-class-widget">
            <div className="widget-header">
              <h3>📍 Próxima Clase</h3>
              <span className="badge-live">En curso</span>
            </div>
            <div className="class-card">
              <div className="class-time">
                <span className="start-time">10:00</span>
                <span className="end-time">12:00</span>
              </div>
              <div className="class-info">
                <h4>{nextClass.subject}</h4>
                <p>👨‍🏫 {nextClass.professor} • 🏢 {nextClass.room}</p>
              </div>
              <button className="btn-checkin">Check-in</button>
            </div>
          </section>

          {/* Widget: Accesos Rápidos */}
          <section className="widget quick-actions-widget">
            <h3>Accesos Rápidos</h3>
            <div className="actions-grid">
              <button className="action-card" onClick={() => navigate('/notice-board')}>
                <span className="action-icon">📢</span>
                <span>Tablón</span>
              </button>
              <button className="action-card" onClick={() => navigate('/library')}>
                <span className="action-icon">📚</span>
                <span>Biblioteca</span>
              </button>
              <button className="action-card" onClick={() => navigate('/community')}>
                <span className="action-icon">👥</span>
                <span>Comunidad</span>
              </button>
              <button className="action-card" onClick={() => navigate('/profile')}>
                <span className="action-icon">⚙️</span>
                <span>Ajustes</span>
              </button>
            </div>
          </section>

        </div>

        {/* COLUMNA DERECHA (Secundaria) */}
        <div className="side-column">

          {/* Widget: Tareas Pendientes */}
          <section className="widget tasks-widget">
            <div className="widget-header">
              <h3>📝 Tareas Pendientes</h3>
              <button className="btn-link">Ver todo</button>
            </div>
            <ul className="tasks-list">
              {pendingTasks.map(task => (
                <li key={task.id} className={`task-item ${task.urgent ? 'urgent' : ''}`}>
                  <div className="task-check"></div>
                  <div className="task-content">
                    <p className="task-title">{task.title}</p>
                    <span className="task-due">📅 {task.due}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Widget: Noticias Recientes */}
          <section className="widget news-widget">
            <h3>🔥 Novedades</h3>
            <div className="news-list">
              {newsFeed.map(news => (
                <div key={news.id} className="news-item">
                  <div className={`news-tag-dot ${news.color}`}></div>
                  <div className="news-content">
                    <span className="news-meta">{news.tag} • {news.date}</span>
                    <p>{news.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

      </div>
    </div>
  );
};

export default Home;