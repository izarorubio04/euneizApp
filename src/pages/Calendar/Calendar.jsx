import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "./Calendar.css";
import { academicEvents, EVENT_TYPES } from "./data";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalIcon, 
  MapPin, 
  Clock 
} from "lucide-react";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const Calendar = () => {
  // Estado para la navegación del calendario (Mes actual visualizado)
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Estado para eventos de la comunidad (desde Firebase)
  const [communityEvents, setCommunityEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado para el día seleccionado (para ver detalles)
  const [selectedDate, setSelectedDate] = useState(new Date());

  // --- 1. CARGA DE EVENTOS SOCIALES (FIREBASE) ---
  useEffect(() => {
    const q = query(collection(db, "notices"), where("type", "in", ["eventos", "social"]));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // LÓGICA CLAVE: Priorizamos eventDate. Si no existe, usamos date (fallback)
        const rawDate = data.eventDate ? data.eventDate : new Date(data.date).toISOString().split('T')[0];

        return {
          id: doc.id,
          title: data.title,
          date: rawDate, 
          type: "social",
          desc: data.desc,
          time: "Todo el día" 
        };
      });
      setCommunityEvents(events);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- 2. FUSIÓN DE EVENTOS (Estáticos + Dinámicos) ---
  const allEvents = useMemo(() => {
    // Normalizamos eventos académicos para facilitar búsqueda
    const processedAcademic = [];
    
    academicEvents.forEach(ev => {
      if (ev.start && ev.end) {
        // Lógica simple: Si es un rango, añadimos el evento al array general
        // (Para una versión más compleja, expandiríamos el rango día a día)
        processedAcademic.push(ev); 
      } else {
        processedAcademic.push(ev);
      }
    });

    return [...processedAcademic, ...communityEvents];
  }, [communityEvents]);

  // --- 3. LÓGICA DEL GRID DEL CALENDARIO ---
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Ajuste para que Lunes sea 0
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Funciones de navegación
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Helper para chequear eventos en un día específico
  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const checkDate = new Date(dateStr);

    return allEvents.filter(ev => {
      // Caso 1: Fecha exacta
      if (ev.date === dateStr) return true;
      // Caso 2: Rango de fechas (ej: Navidad)
      if (ev.start && ev.end) {
        const s = new Date(ev.start);
        const e = new Date(ev.end);
        return checkDate >= s && checkDate <= e;
      }
      return false;
    });
  };

  const handleDayClick = (day) => {
    const newDate = new Date(year, month, day);
    setSelectedDate(newDate);
  };

  // Eventos del día seleccionado para mostrar en el panel lateral
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const selectedDayEvents = useMemo(() => {
    const d = selectedDate.getDate();
    const m = selectedDate.getMonth();
    const y = selectedDate.getFullYear();
    // Reconstruimos string o usamos la logica de filtrado
    // Truco: reusamos la función getEventsForDay pasando el día correcto
    // Pero ojo: getEventsForDay usa el month/year del calendario visual, 
    // si seleccionamos un día y cambiamos de mes, esto podría desincronizarse. 
    // Para simplificar, asumimos navegación visual.
    if (m !== month) return []; // Si cambiamos de mes visual, limpiar selección (opcional)
    return getEventsForDay(d);
  }, [selectedDate, month, allEvents]);


  return (
    <div className="calendar-container">
      <header className="cal-main-header">
        <div>
          <h1>Calendario Unificado</h1>
          <p>Toda la actividad académica y social de EUNEIZ en un solo lugar.</p>
        </div>
        
        {/* Leyenda rápida */}
        <div className="cal-legend">
          {Object.entries(EVENT_TYPES).map(([key, config]) => (
            <div key={key} className="legend-item">
              <span className="legend-dot" style={{background: config.color}}></span>
              {config.label}
            </div>
          ))}
        </div>
      </header>

      <div className="calendar-layout">
        
        {/* --- IZQUIERDA: EL CALENDARIO --- */}
        <div className="cal-card main-cal">
          <div className="cal-nav">
            <button onClick={prevMonth} className="nav-btn"><ChevronLeft/></button>
            <h2>{MONTHS[month]} {year}</h2>
            <button onClick={nextMonth} className="nav-btn"><ChevronRight/></button>
          </div>

          <div className="cal-grid">
            {WEEKDAYS.map(day => <div key={day} className="cal-weekday">{day}</div>)}
            
            {/* Espacios vacíos antes del día 1 */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="cal-day empty"></div>
            ))}

            {/* Días del mes */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month;
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

              return (
                <div 
                  key={day} 
                  className={`cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  <span className="day-number">{day}</span>
                  <div className="day-dots">
                    {dayEvents.slice(0, 3).map((ev, idx) => (
                      <span 
                        key={idx} 
                        className="event-dot" 
                        style={{ backgroundColor: EVENT_TYPES[ev.type]?.color || '#999' }}
                      />
                    ))}
                    {dayEvents.length > 3 && <span className="plus-dot">+</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- DERECHA: AGENDA DEL DÍA --- */}
        <div className="cal-card agenda-panel">
          <div className="agenda-header">
            <div className="date-badge">
              <span className="big-day">{selectedDate.getDate()}</span>
              <span className="big-month">{MONTHS[selectedDate.getMonth()]}</span>
            </div>
            <div className="agenda-title">
              <h3>Agenda del día</h3>
              <span>{selectedDayEvents.length} eventos programados</span>
            </div>
          </div>

          <div className="agenda-list">
            {selectedDayEvents.length > 0 ? (
              selectedDayEvents.map((ev, i) => (
                <div key={i} className="event-item" style={{borderLeftColor: EVENT_TYPES[ev.type]?.color}}>
                  <div className="event-time">
                    {ev.type === 'academic' || ev.type === 'holiday' || ev.type === 'exam' ? (
                       <span className="all-day-badge">Todo el día</span>
                    ) : (
                       <><Clock size={14}/> {ev.time}</>
                    )}
                  </div>
                  <h4>{ev.title}</h4>
                  {ev.desc && <p className="event-desc">{ev.desc}</p>}
                  {ev.location && (
                    <div className="event-loc">
                      <MapPin size={14}/> {ev.location}
                    </div>
                  )}
                  <span className="event-tag" style={{color: EVENT_TYPES[ev.type]?.color}}>
                    {EVENT_TYPES[ev.type]?.label}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-agenda">
                <CalIcon size={40} opacity={0.2} />
                <p>No hay eventos para este día.</p>
                <small>Selecciona otro día en el calendario o disfruta el tiempo libre.</small>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Calendar;