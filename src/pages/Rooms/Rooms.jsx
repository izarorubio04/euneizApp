import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import "./Rooms.css";

const STORAGE_KEY = 'euneiz_rooms_res';
const HORA_INICIO_OP = 8;
const HORA_FIN_OP = 21;

export const Rooms = () => {
  const { user } = useAuth();
  
  // --- ESTADOS ---
  const [reservations, setReservations] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [form, setForm] = useState({
    dia: new Date().toISOString().substring(0, 10),
    horaInicio: "09:00",
    duracion: "60",
    quien: ""
  });

  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("todas");

  const salas = [
    { id: "Sala A", nombre: "Sala A - Edificio Norte", img: "https://images.unsplash.com/photo-1580582932707-520aed937b7b" },
    { id: "Sala B", nombre: "Sala B - Biblioteca", img: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4" },
    { id: "Sala C", nombre: "Sala C - Laboratorios", img: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f" }
  ];

  // --- PERSISTENCIA ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
  }, [reservations]);

  // --- LÓGICA DE TIEMPO ---
  const calculateEndTime = (start, duration) => {
    const [h, m] = start.split(':').map(Number);
    const totalMinutes = h * 60 + m + parseInt(duration);
    const endH = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const endM = (totalMinutes % 60).toString().padStart(2, '0');
    return `${endH}:${endM}`;
  };

  const isOverlap = (dia, start, end, sala, excludeId) => {
    return reservations.some(res => {
      if (res.id === excludeId) return false;
      if (res.sala === sala && res.dia === dia) {
        return (start < res.horaFin && end > res.horaInicio);
      }
      return false;
    });
  };

  // --- HANDLERS ---
  const handleReserve = (salaId) => {
    const end = calculateEndTime(form.horaInicio, form.duracion);
    
    if (!form.quien.trim()) return alert("Indica quién reserva");
    
    if (isOverlap(form.dia, form.horaInicio, end, salaId, editingId)) {
        return alert("La sala ya está ocupada en ese horario.");
    }

    if (editingId) {
      setReservations(prev => prev.map(r => r.id === editingId ? 
        { ...r, ...form, horaFin: end } : r));
      setEditingId(null);
    } else {
      const newRes = {
        id: Date.now().toString(),
        sala: salaId,
        ...form,
        horaFin: end,
        userEmail: user?.email
      };
      setReservations([...reservations, newRes]);
    }
    setForm({ ...form, quien: "" });
  };

  const deleteRes = (id) => {
    if (window.confirm("¿Cancelar reserva?")) {
      setReservations(reservations.filter(r => r.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  const startEdit = (res) => {
    setEditingId(res.id);
    setForm({
      dia: res.dia,
      horaInicio: res.horaInicio,
      duracion: res.duracion,
      quien: res.quien
    });
  };

  return (
    <div className="rooms-page">
      <header className="rooms-header">
        <h1>🔑 Reservas de Aulas</h1>
        <div className="rooms-filters-grid">
          <div className="rooms-field">
            <label>Día</label>
            <input type="date" className="rooms-input" value={form.dia} onChange={e => setForm({...form, dia: e.target.value})} />
          </div>
          <div className="rooms-field">
            <label>Inicio</label>
            <input type="time" className="rooms-input" value={form.horaInicio} onChange={e => setForm({...form, horaInicio: e.target.value})} />
          </div>
          <div className="rooms-field">
            <label>Duración</label>
            <select className="rooms-input" value={form.duracion} onChange={e => setForm({...form, duracion: e.target.value})}>
              <option value="30">30 min</option>
              <option value="60">1 hora</option>
              <option value="120">2 horas</option>
            </select>
          </div>
          <div className="rooms-field">
            <label>Nombre</label>
            <input type="text" className="rooms-input" placeholder="Tu nombre..." value={form.quien} onChange={e => setForm({...form, quien: e.target.value})} />
          </div>
          <div className="rooms-field">
            <label>Mostrar</label>
            <select className="rooms-input" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="todas">Todas</option>
              <option value="mis-reservas">Mis Reservas</option>
            </select>
          </div>
        </div>
      </header>

      <main className="rooms-grid">
        {salas.map(sala => {
          const resDelDia = reservations.filter(r => r.sala === sala.id && r.dia === form.dia);
          const esMiReserva = resDelDia.some(r => r.userEmail === user?.email);

          return (
            <div key={sala.id} className={`room-card ${resDelDia.length > 0 ? 'is-reserved' : ''}`}>
              <img src={sala.img} alt={sala.id} className="room-img" />
              <div className="room-body">
                <h3>{sala.nombre}</h3>
                
                {resDelDia.map(r => (
                  <div key={r.id} className={`reservation-block ${editingId === r.id ? 'editing' : ''}`}>
                    <p><strong>{r.horaInicio} - {r.horaFin}</strong></p>
                    <p>👤 {r.quien}</p>
                    {(r.userEmail === user?.email) && (
                      <div className="res-actions">
                        <button className="btn-res btn-res-edit" onClick={() => startEdit(r)}>Editar</button>
                        <button className="btn-res btn-res-cancel" onClick={() => deleteRes(r.id)}>Anular</button>
                      </div>
                    )}
                  </div>
                ))}

                <button 
                  className="btn-reserve-main"
                  onClick={() => handleReserve(sala.id)}
                  disabled={editingId && reservations.find(r => r.id === editingId)?.sala !== sala.id}
                >
                  {editingId ? "Guardar Cambios" : "Reservar este hueco"}
                </button>
                {editingId && (
                    <button className="btn-res" style={{marginTop:'5px'}} onClick={() => {setEditingId(null); setForm({...form, quien:""})}}>Cancelar Edición</button>
                )}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default Rooms;