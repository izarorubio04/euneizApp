import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { 
  collection, query, where, onSnapshot, 
  deleteDoc, doc, updateDoc 
} from "firebase/firestore";
import "./Inbox.css";

// ICONOS
import { 
  Mail, Send, Inbox as InboxIcon, 
  Trash2, Reply, FileText, X 
} from "lucide-react";

export const Inbox = () => {
  const { user } = useAuth();
  
  // Estados
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("received");

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const q = query(
      collection(db, "messages"),
      where(activeTab === "received" ? "to" : "from", "==", user.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.date - a.date);
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, activeTab]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("¿Borrar este mensaje?")) {
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
      
      {/* HEADER PERSONALIZADO (Mantenemos este estilo por el botón "Volver") */}
      <div className="inbox-welcome-card">
        <Link to="/home" className="btn-close-inbox" title="Volver al Inicio">
          <X size={22} />
        </Link>

        <div className="inbox-header-content">
          <span className="inbox-label">COMUNICACIÓN PRIVADA</span>
          <h1 className="inbox-title">Buzón de Mensajes</h1>
        </div>
        
        <div className="inbox-tabs">
          <button 
            className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => setActiveTab('received')}
          >
            <InboxIcon size={18}/> Recibidos
          </button>
          <button 
            className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => setActiveTab('sent')}
          >
            <Send size={18}/> Enviados
          </button>
        </div>
      </div>

      <div className="inbox-content">
        {loading && <div className="inbox-loading">Sincronizando mensajes...</div>}

        {!loading && messages.length === 0 && (
          <div className="empty-inbox card-base">
            <Mail size={48} style={{opacity:0.2, marginBottom:'1rem'}}/>
            <p>No tienes mensajes en esta bandeja.</p>
          </div>
        )}

        {!loading && messages.length > 0 && (
          <div className="inbox-grid">
            {messages.map(msg => (
              <div 
                key={msg.id} 
                // AÑADIDO: 'card-base' para estilos globales
                className={`msg-card card-base ${activeTab === 'received' && !msg.read ? 'unread' : 'read'}`}
                onClick={() => markAsRead(msg)}
              >
                <div className="msg-header">
                  <span className="msg-participant">
                    {activeTab === 'received' ? 'De:' : 'Para:'} 
                    <strong>{activeTab === 'received' ? msg.from?.split('@')[0] : msg.to?.split('@')[0]}</strong>
                  </span>
                  <span className="msg-date">
                    {new Date(msg.date).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="msg-context-badge">
                   <FileText size={12}/> Ref: {msg.postTitle || "General"}
                </div>

                <div className="msg-body-preview">
                  {msg.content}
                </div>

                <div className="msg-actions">
                  {activeTab === 'received' && (
                    <a 
                      href={`mailto:${msg.from}?subject=Re: ${msg.postTitle}`}
                      className="btn-icon-action"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Reply size={14}/> Responder
                    </a>
                  )}
                  <button 
                    className="btn-icon-action delete" 
                    onClick={(e) => handleDelete(e, msg.id)}
                  >
                    <Trash2 size={14}/> Borrar
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