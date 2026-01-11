import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc 
} from "firebase/firestore"; // ⚠️ Quitamos 'orderBy' para evitar bloqueo
import "./Inbox.css";

export const Inbox = () => {
  const { user } = useAuth();
  
  // Estados
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("received"); // 'received' | 'sent'

  useEffect(() => {
    if (!user) return;

    setLoading(true);

    // 1. SOLUCIÓN AL "CARGANDO INFINITO":
    // Quitamos 'orderBy' de la query para no necesitar índices complejos en Firebase.
    const q = query(
      collection(db, "messages"),
      where(activeTab === "received" ? "to" : "from", "==", user.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // 2. ORDENAMOS AQUÍ (En el cliente)
      const msgs = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => b.date - a.date); // Orden descendente por fecha

      setMessages(msgs);
      setLoading(false); // ¡Ahora esto se ejecutará siempre!
    }, (error) => {
      console.error("Error cargando mensajes:", error);
      setLoading(false); // Quitamos loading incluso si hay error
    });

    return () => unsubscribe();
  }, [user, activeTab]);

  const handleDelete = async (id) => {
    if (window.confirm("¿Borrar mensaje?")) {
      await deleteDoc(doc(db, "messages", id));
    }
  };

  const markAsRead = async (msg) => {
    if (activeTab === "received" && !msg.read) {
      await updateDoc(doc(db, "messages", msg.id), { read: true });
    }
  };

  return (
    <div className="inbox-container">
      <header className="inbox-header">
        <h1>📬 Buzón de Mensajes</h1>
        <p>Tus conversaciones privadas en EUNEIZ</p>
        
        <div className="inbox-tabs">
          <button 
            className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => setActiveTab('received')}
          >
            📥 Recibidos
          </button>
          <button 
            className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => setActiveTab('sent')}
          >
            📤 Enviados
          </button>
        </div>
      </header>

      <div className="inbox-content">
        
        {/* CARGANDO */}
        {loading && (
          <div className="inbox-loading">
            <div className="spinner"></div>
            <p>Sincronizando...</p>
          </div>
        )}

        {/* ESTADO VACÍO (Texto explicativo) */}
        {!loading && messages.length === 0 && (
          <div className="empty-inbox">
            <span>{activeTab === 'received' ? '📭' : '📝'}</span>
            <h3>
              {activeTab === 'received' 
                ? "No tienes mensajes nuevos" 
                : "No has enviado mensajes"}
            </h3>
            <p>
              {activeTab === 'received'
                ? "Cuando alguien contacte contigo por un anuncio, aparecerá aquí."
                : "Cuando contactes con alguien desde el Tablón, aparecerá aquí."}
            </p>
          </div>
        )}

        {/* LISTA DE MENSAJES */}
        {!loading && messages.length > 0 && (
          <div className="inbox-grid">
            {messages.map(msg => (
              <div 
                key={msg.id} 
                className={`msg-card ${activeTab === 'received' ? (msg.read ? 'read' : 'unread') : 'sent-card'}`}
                onClick={() => markAsRead(msg)}
              >
                <div className="msg-header">
                  <span className="msg-participant">
                    {activeTab === 'received' ? 'De:' : 'Para:'} 
                    <strong> {activeTab === 'received' ? msg.from?.split('@')[0] : msg.to?.split('@')[0]}</strong>
                  </span>
                  <span className="msg-date">
                    {new Date(msg.date).toLocaleDateString()} · {new Date(msg.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                
                <div className="msg-context">
                  Sobre: <span className="msg-post-title">{msg.postTitle}</span>
                </div>

                <p className="msg-body">{msg.content}</p>

                <div className="msg-actions">
                  {activeTab === 'received' && (
                    <a 
                      href={`mailto:${msg.from}?subject=Re: ${msg.postTitle}&body=Hola, gracias por tu mensaje...`}
                      className="btn-reply"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ↩ Responder
                    </a>
                  )}
                  
                  <button 
                    className="btn-delete-msg" 
                    onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }}
                  >
                    🗑 Borrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;