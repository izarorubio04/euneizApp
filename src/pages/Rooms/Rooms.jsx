import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
// Firebase:
import { db } from "../../firebase/config";
import { 
  collection, addDoc, query, where, onSnapshot, 
  deleteDoc, doc, updateDoc 
} from "firebase/firestore";

// UI Imports
import PageHeader from "../../components/UI/PageHeader"; 
import "./Rooms.css";
// Iconos de Lucide (más limpios que los emojis)
import { 
  Calendar, Clock, MapPin, Key, 
  CheckCircle, AlertCircle, X, QrCode, Search, User
} from "lucide-react";

// --- CONFIGURACIÓN DE AULAS ---
// En lugar de escribir las aulas a mano, uso un generador.
// Así, si la uni construye una 3ª planta, solo cambio la constante FLOORS.
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

// Horarios fijos de reserva (de 8am a 8pm)
const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", 
  "18:00", "19:00", "20:00"
];

export const Rooms = () => {
  const { user, isAdmin } = useAuth();
  
  // --- ESTADOS LOCALES ---
  // Fecha seleccionada (por defecto hoy)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState("");
  
  // Estados de datos (Arrays que vienen de Firebase)
  const [reservationsToday, setReservationsToday] = useState([]); // Para pintar el mapa de ocupación
  const [myActiveReservations, setMyActiveReservations] = useState([]); // Historial del alumno
  
  const [adminSearch, setAdminSearch] = useState(""); 
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(true);

  // 1. EFECTO: Ocupación en Tiempo Real (La clave del sistema)
  // Usamos onSnapshot para escuchar cambios. Si otro alumno reserva el "Aula 1.1",
  // mi array 'reservationsToday' se actualiza solo y el botón se deshabilita en mi pantalla.
  // Esto evita (casi totalmente) las reservas duplicadas.
  useEffect(() => {
    setLoading(true);
    // Consultamos solo las reservas de la fecha que estoy mirando
    const q = query(collection(db, "reservations"), where("date", "==", date));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReservationsToday(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
      setLoading(false);
    });
    
    // Limpiamos el listener al desmontar o cambiar de fecha
    return () => unsubscribe();
  }, [date]);

  // 2. EFECTO: Mis Reservas (Solo para alumnos)
  // Carga las reservas activas del usuario logueado para mostrarlas en el panel lateral.
  useEffect(() => {
    if(!user?.email || isAdmin) return; 
    
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, "reservations"), where("userEmail", "==", user.email));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allDocs = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
      
      // Filtro en cliente: Solo futuras/hoy y que no estén finalizadas
      const active = allDocs.filter(r => r.date >= today && r.status !== 'finished');
      
      // Las ordeno por fecha y hora para que salgan cronológicamente
      active.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
      
      setMyActiveReservations(active);
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  // --- HELPERS (Utilidades) ---
  
  // Validar fines de semana
  const isWeekend = (dateString) => {
    const d = new Date(dateString);
    const day = d.getDay();
    return day === 0 || day === 6; // 0=Domingo, 6=Sábado
  };

  // Generar código de llave único (Simulación)
  const generateCode = () => {
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `KEY-${random}`;
  };

  // --- HANDLERS ALUMNO (Lógica de Reserva) ---
  const handleReserve = async (room) => {
    // 1. Validaciones previas
    if (!selectedTime) return alert("Por favor, selecciona una hora primero.");
    if (isWeekend(date)) return alert("La universidad está cerrada los fines de semana.");

    // 2. Validación de Concurrencia (Cliente)
    // Compruebo si en mi estado actualizado ya existe esa reserva para evitar solapamientos.
    const isOccupied = reservationsToday.find(r => 
      r.roomId === room.id && 
      r.time === selectedTime && 
      r.status !== 'finished' // Si ya terminaron, el aula está libre
    );

    if (isOccupied) return alert("Esa aula ya está ocupada en ese horario.");

    // 3. Confirmación y Guardado
    if (window.confirm(`¿Confirmar reserva de ${room.label} a las ${selectedTime}?`)) {
      try {
        const code = generateCode();
        await addDoc(collection(db, "reservations"), {
          roomId: room.id,
          roomLabel: room.label,
          date: date,
          time: selectedTime,
          userEmail: user.email,
          code: code,
          status: 'confirmed', // Estado inicial: Confirmada pero llave no entregada
          createdAt: Date.now()
        });
        alert(`¡Reserva exitosa! Tu código de llave es: ${code}`);
      } catch (e) {
        console.error(e);
        alert("Hubo un error al procesar la reserva.");
      }
    }
  };

  // Cancelar reserva (Borrado físico del documento)
  const handleCancel = async (id) => {
    if(window.confirm("¿Seguro que quieres cancelar esta reserva?")) {
      await deleteDoc(doc(db, "reservations", id));
    }
  };

  // --- HANDLERS ADMIN (Gestión de Llaves) ---
  
  // Entregar llave física al alumno -> Estado pasa a 'active'
  const handleDeliverKey = async (id) => {
    if(window.confirm("¿Confirmar entrega de llaves al alumno?")) {
      await updateDoc(doc(db, "reservations", id), { status: 'active' });
    }
  };

  // Recibir llave de vuelta -> Estado pasa a 'finished' (Libera ocupación)
  const handleReturnKey = async (id) => {
    if(window.confirm("¿Confirmar devolución? El aula quedará libre para nuevas reservas.")) {
      await updateDoc(doc(db, "reservations", id), { status: 'finished' });
    }
  };

  // Filtro local para el buscador del administrador
  const filteredAdminList = reservationsToday.filter(r => 
    r.userEmail.toLowerCase().includes(adminSearch.toLowerCase()) ||
    r.code.toLowerCase().includes(adminSearch.toLowerCase()) ||
    r.roomLabel.toLowerCase().includes(adminSearch.toLowerCase())
  );

  return (
    <div className="rooms-container">
      
      {/* HEADER DINÁMICO SEGÚN ROL */}
      <PageHeader 
        title={isAdmin ? "Gestión de Aulas (Secretaría)" : "Reserva de Aulas"}
        subtitle={isAdmin ? "Panel de control de llaves y ocupación." : "Gestiona espacios para estudiar o trabajos en grupo."}
      />

      <div className="rooms-layout">
        
        {/* === VISTA ALUMNO === */}
        {!isAdmin && (
          <>
            {/* Panel Izquierdo: Selección de fecha, hora y aula */}
            <div className="booking-panel">
              
              {/* Selector de Fecha */}
              <div className="control-group">
                <label className="control-label"><Calendar size={16}/> Fecha</label>
                <input 
                  type="date" 
                  className="date-input"
                  value={date}
                  min={new Date().toISOString().split('T')[0]} // No permitir pasado
                  onChange={(e) => setDate(e.target.value)}
                />
                {isWeekend(date) && <div className="warning-badge"><AlertCircle size={14}/> Cerrado fin de semana</div>}
              </div>

              {/* Selector de Hora (Grid de botones) */}
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

              {/* Mapa de Aulas (Visualización de ocupación) */}
              <div className="control-group">
                <label className="control-label"><MapPin size={16}/> Aula</label>
                {isWeekend(date) ? (
                  <div className="closed-state">Selecciona un día laborable para ver disponibilidad.</div>
                ) : (
                  <div className="rooms-grid">
                    {ALL_ROOMS.map(room => {
                      // Calculamos si el aula está ocupada en ese momento
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
                          disabled={isOccupied} // Si está ocupada, no se puede clicar
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

            {/* Panel Derecho: Mis Tickets Activos */}
            <div className="my-tickets-panel">
              <h3><QrCode size={20}/> Mis Reservas Activas</h3>
              <div className="tickets-list">
                {myActiveReservations.length === 0 ? (
                  <div className="empty-tickets"><p>No tienes reservas activas.</p></div>
                ) : (
                  myActiveReservations.map(res => (
                    <div key={res.id} className={`ticket-card status-${res.status}`}>
                      <div className="ticket-header">
                        <span className="ticket-room">{res.roomLabel}</span>
                        {/* Solo permitimos cancelar si no ha recogido la llave aún */}
                        {res.status === 'confirmed' && (
                          <button className="btn-cancel-ticket" onClick={() => handleCancel(res.id)} title="Cancelar reserva"><X size={14}/></button>
                        )}
                      </div>
                      
                      <div className="ticket-body">
                        <div className="ticket-info">
                          <span style={{display:'flex', alignItems:'center', gap:'6px'}}>
                            <Calendar size={14}/> {new Date(res.date).toLocaleDateString()}
                          </span>
                          <span style={{display:'flex', alignItems:'center', gap:'6px'}}>
                            <Clock size={14}/> {res.time}
                          </span>
                        </div>
                        <div className="ticket-code-box">
                          <span className="code-label">CÓDIGO DE LLAVE</span>
                          <span className="code-value">{res.code}</span>
                        </div>
                      </div>
                      
                      <div className="ticket-footer">
                        {res.status === 'confirmed' && (
                          <span className="status-text-pending">
                            <span className="dot-solid pending"></span> Pendiente recogida
                          </span>
                        )}
                        {res.status === 'active' && (
                          <span className="status-text-active">
                            <span className="dot-solid active"></span> Llave entregada
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="info-box-return">
                <strong>Nota:</strong> Debes entregar la llave en secretaría al terminar para finalizar la reserva.
              </div>
            </div>
          </>
        )}

        {/* === VISTA ADMIN (Panel de Secretaría) === */}
        {isAdmin && (
          <div className="admin-rooms-panel">
            
            {/* Controles Admin (Fecha y Buscador) */}
            <div className="admin-controls">
              <div className="control-group" style={{marginBottom:0, flex: 1}}>
                {/* AQUI EL CAMBIO: Icono Lucide y clase correcta */}
                <label className="control-label"><Calendar size={16}/> Fecha a gestionar</label>
                <input type="date" className="date-input" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              
              <div className="search-box-admin">
                <Search size={18} className="search-icon-admin"/>
                <input 
                  placeholder="Buscar código, email o aula..." 
                  value={adminSearch}
                  onChange={e => setAdminSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Tabla de Gestión de Reservas */}
            <div className="admin-table-container">
              <h3>Reservas del {new Date(date).toLocaleDateString()}</h3>
              
              {filteredAdminList.length === 0 ? (
                <p className="empty-state-admin">No hay reservas registradas para este día.</p>
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
                    {/* Ordenamos por hora para facilitar la gestión */}
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
                          {r.status === 'confirmed' && <span className="status-pill pending"><span className="dot-solid pending"></span> Pendiente</span>}
                          {r.status === 'active' && <span className="status-pill active"><span className="dot-solid active"></span> En Uso</span>}
                          {r.status === 'finished' && <span className="status-pill finished"><span className="dot-solid finished"></span> Finalizada</span>}
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

            {/* Stats Rápidos */}
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