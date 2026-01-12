import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { 
  collection, addDoc, query, where, onSnapshot, 
  deleteDoc, doc, updateDoc 
} from "firebase/firestore";
import "./Rooms.css";

// ICONOS
import { 
  Calendar, Clock, MapPin, Key, 
  CheckCircle, AlertCircle, X, QrCode,
  Search, User, ArrowRight
} from "lucide-react";

// GENERADOR DE AULAS
const FLOORS = [1, 2];
const ROOMS_PER_FLOOR = 5; 
const generateRooms = () => {
  let rooms = [];
  FLOORS.forEach(floor => {
    for (let i = 0; i < ROOMS_PER_FLOOR; i++) {
      rooms.push({ id: `${floor}.${i}`, label: `Aula ${floor}.${i}` });
    }
  });
  return rooms;
};
const ALL_ROOMS = generateRooms();

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", 
  "18:00", "19:00", "20:00"
];

export const Rooms = () => {
  const { user, isAdmin } = useAuth();
  
  // --- ESTADOS ---
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState("");
  
  const [reservationsToday, setReservationsToday] = useState([]); // Todas las del día (para admins y ocupación)
  const [myActiveReservations, setMyActiveReservations] = useState([]); // Solo las del alumno
  
  const [adminSearch, setAdminSearch] = useState(""); // Buscador para admin (código o email)
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);

  // --- 1. CARGA DE DATOS GENERALES (Para ocupación y Admin View) ---
  useEffect(() => {
    setLoading(true);
    // Escuchamos TODAS las reservas de la fecha seleccionada
    const q = query(collection(db, "reservations"), where("date", "==", date));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReservationsToday(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [date]);

  // --- 2. CARGA DE DATOS ALUMNO (Mis tickets) ---
  useEffect(() => {
    if(!user?.email || isAdmin) return; // Si es admin, no necesita cargar "mis tickets" personales
    
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, "reservations"), where("userEmail", "==", user.email));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allDocs = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
      // Filtramos en cliente para evitar índices complejos
      const active = allDocs.filter(r => r.date >= today && r.status !== 'finished');
      
      active.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
      setMyActiveReservations(active);
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  // --- HELPERS ---
  const isWeekend = (dateString) => {
    const d = new Date(dateString);
    const day = d.getDay();
    return day === 0 || day === 6; 
  };

  const generateCode = () => {
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `KEY-${random}`;
  };

  // --- ACCIONES ALUMNO ---
  const handleReserve = async (room) => {
    if (!selectedTime) return alert("Selecciona una hora.");
    if (isWeekend(date)) return alert("Cerrado en fin de semana.");

    // Comprobar ocupación (Ignorando las finalizadas)
    const isOccupied = reservationsToday.find(r => 
      r.roomId === room.id && 
      r.time === selectedTime && 
      r.status !== 'finished' // IMPORTANTE: Si ya devolvieron la llave, está libre
    );

    if (isOccupied) return alert("Aula ocupada.");

    if (window.confirm(`¿Reservar ${room.label} a las ${selectedTime}?`)) {
      try {
        const code = generateCode();
        await addDoc(collection(db, "reservations"), {
          roomId: room.id,
          roomLabel: room.label,
          date: date,
          time: selectedTime,
          userEmail: user.email,
          code: code,
          status: 'confirmed', // Estados: confirmed (reservado) -> active (tiene llave) -> finished (devuelta)
          createdAt: Date.now()
        });
        alert(`Código: ${code}`);
      } catch (e) {
        console.error(e);
        alert("Error al reservar.");
      }
    }
  };

  const handleCancel = async (id) => {
    if(window.confirm("¿Cancelar reserva?")) {
      await deleteDoc(doc(db, "reservations", id));
    }
  };

  // --- ACCIONES ADMIN (Secretaría) ---
  const handleDeliverKey = async (id) => {
    // Entregar llave: Pasa de 'confirmed' a 'active'
    if(window.confirm("¿Confirmar entrega de llaves?")) {
      await updateDoc(doc(db, "reservations", id), { status: 'active' });
    }
  };

  const handleReturnKey = async (id) => {
    // Devolver llave: Pasa de 'active' a 'finished' (Libera el aula)
    if(window.confirm("¿Confirmar devolución de llave? El aula quedará libre.")) {
      await updateDoc(doc(db, "reservations", id), { status: 'finished' });
    }
  };

  // Filtro para el buscador de admin
  const filteredAdminList = reservationsToday.filter(r => 
    r.userEmail.toLowerCase().includes(adminSearch.toLowerCase()) ||
    r.code.toLowerCase().includes(adminSearch.toLowerCase()) ||
    r.roomLabel.toLowerCase().includes(adminSearch.toLowerCase())
  );

  return (
    <div className="rooms-container">
      
      {/* HEADER */}
      <div className="rooms-header-card">
        <div className="rooms-header-text">
          <h1>{isAdmin ? "Gestión de Aulas (Secretaría)" : "Reserva de Aulas"}</h1>
          <p>{isAdmin ? "Panel de control de llaves y ocupación." : "Gestiona espacios para estudiar o trabajos en grupo."}</p>
        </div>
        <div className="rooms-header-icon">
          <Key size={40} strokeWidth={1.5} />
        </div>
      </div>

      <div className="rooms-layout">
        
        {/* === VISTA ALUMNO === */}
        {!isAdmin && (
          <>
            <div className="booking-panel">
              <div className="control-group">
                <label className="control-label"><Calendar size={16}/> Fecha</label>
                <input 
                  type="date" 
                  className="date-input"
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDate(e.target.value)}
                />
                {isWeekend(date) && <div className="warning-badge"><AlertCircle size={14}/> Cerrado finde</div>}
              </div>

              <div className="control-group">
                <label className="control-label"><Clock size={16}/> Hora</label>
                <div className="time-grid">
                  {TIME_SLOTS.map(time => (
                    <button
                      key={time}
                      className={`time-chip ${selectedTime === time ? 'selected' : ''}`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="control-group">
                <label className="control-label"><MapPin size={16}/> Aula</label>
                {isWeekend(date) ? (
                  <div className="closed-state">Selecciona un día laborable.</div>
                ) : (
                  <div className="rooms-grid">
                    {ALL_ROOMS.map(room => {
                      // Verificar si está ocupada (estado confirmed o active)
                      const isOccupied = reservationsToday.some(r => 
                        r.roomId === room.id && r.time === selectedTime && r.status !== 'finished'
                      );
                      const isMine = reservationsToday.some(r => 
                        r.roomId === room.id && r.time === selectedTime && r.userEmail === user.email && r.status !== 'finished'
                      );

                      return (
                        <button
                          key={room.id}
                          className={`room-card ${isOccupied ? 'taken' : 'available'} ${isMine ? 'mine' : ''}`}
                          disabled={isOccupied}
                          onClick={() => handleReserve(room)}
                        >
                          <span className="room-number">{room.id}</span>
                          <span className="room-status">{isMine ? "TUYA" : (isOccupied ? "OCUPADA" : "LIBRE")}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="my-tickets-panel">
              <h3><QrCode size={20}/> Mis Reservas Activas</h3>
              <div className="tickets-list">
                {myActiveReservations.length === 0 ? (
                  <div className="empty-tickets"><p>No tienes reservas.</p></div>
                ) : (
                  myActiveReservations.map(res => (
                    <div key={res.id} className={`ticket-card status-${res.status}`}>
                      <div className="ticket-header">
                        <span className="ticket-room">{res.roomLabel}</span>
                        {res.status === 'confirmed' && (
                          <button className="btn-cancel-ticket" onClick={() => handleCancel(res.id)}><X size={14}/></button>
                        )}
                      </div>
                      <div className="ticket-body">
                        <div className="ticket-info">
                          <span>📅 {new Date(res.date).toLocaleDateString()}</span>
                          <span>🕒 {res.time}</span>
                        </div>
                        <div className="ticket-code-box">
                          <span className="code-label">CÓDIGO</span>
                          <span className="code-value">{res.code}</span>
                        </div>
                      </div>
                      <div className="ticket-footer">
                        {res.status === 'confirmed' && <span>🟡 Pendiente recogida</span>}
                        {res.status === 'active' && <span style={{color:'var(--primary)'}}>🟢 Llave entregada</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="info-box-return">
                <strong>Devolución:</strong> Entrega la llave en secretaría para finalizar.
              </div>
            </div>
          </>
        )}

        {/* === VISTA ADMIN (SECRETARÍA) === */}
        {isAdmin && (
          <div className="admin-rooms-panel">
            
            {/* BARRA SUPERIOR ADMIN */}
            <div className="admin-controls">
              <div className="control-group" style={{marginBottom:0}}>
                <label>📅 Fecha a gestionar</label>
                <input type="date" className="date-input" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="search-box-admin">
                <Search size={18}/>
                <input 
                  placeholder="Buscar código, email o aula..." 
                  value={adminSearch}
                  onChange={e => setAdminSearch(e.target.value)}
                />
              </div>
            </div>

            {/* TABLA DE GESTIÓN */}
            <div className="admin-table-container">
              <h3>Reservas del {new Date(date).toLocaleDateString()}</h3>
              
              {filteredAdminList.length === 0 ? (
                <p className="empty-state-admin">No hay reservas para este día o búsqueda.</p>
              ) : (
                <table className="rooms-admin-table">
                  <thead>
                    <tr>
                      <th>Hora</th>
                      <th>Aula</th>
                      <th>Usuario</th>
                      <th>Código</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdminList.sort((a,b) => a.time.localeCompare(b.time)).map(r => (
                      <tr key={r.id} className={`row-${r.status}`}>
                        <td className="font-bold">{r.time}</td>
                        <td><span className="badge-room">{r.roomLabel}</span></td>
                        <td className="text-small">
                          <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
                            <User size={14}/> {r.userEmail.split('@')[0]}
                          </div>
                        </td>
                        <td className="font-mono">{r.code}</td>
                        <td>
                          {r.status === 'confirmed' && <span className="status-pill pending">🟡 Pendiente</span>}
                          {r.status === 'active' && <span className="status-pill active">🟢 En Uso</span>}
                          {r.status === 'finished' && <span className="status-pill finished">⚫ Finalizada</span>}
                        </td>
                        <td>
                          <div className="action-buttons">
                            {r.status === 'confirmed' && (
                              <button className="btn-admin-action give" onClick={() => handleDeliverKey(r.id)}>
                                <Key size={14}/> Entregar
                              </button>
                            )}
                            {r.status === 'active' && (
                              <button className="btn-admin-action return" onClick={() => handleReturnKey(r.id)}>
                                <CheckCircle size={14}/> Devolución
                              </button>
                            )}
                            {r.status === 'finished' && <span className="text-muted">Histórico</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="admin-stats">
              <div className="stat-card">
                <h4>Ocupadas Ahora</h4>
                <span>{reservationsToday.filter(r => r.status === 'active').length}</span>
              </div>
              <div className="stat-card">
                <h4>Pendientes Recogida</h4>
                <span>{reservationsToday.filter(r => r.status === 'confirmed').length}</span>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};