/* eslint-disable react-hooks/preserve-manual-memoization */
import React, { useState, useEffect, useMemo } from "react";
import { db } from "../../firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import "./Calendar.css";
// Importamos los datos estáticos (festivos, exámenes...) y la config de colores
import { academicEvents, EVENT_TYPES } from "./data";
import { 
  ChevronLeft, ChevronRight, Calendar as CalIcon, MapPin, Clock 
} from "lucide-react";

// Arrays constantes para no tener que escribirlos cada vez
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export const Calendar = () => {
  // --- ESTADOS ---
  // Controlamos qué mes estamos viendo. Inicializamos con la fecha de hoy.
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Aquí guardaremos los eventos que vienen de la base de datos (fiestas, quedadas...)
  const [communityEvents, setCommunityEvents] = useState([]);
  
  // Controlamos qué día ha clicado el usuario para mostrar el detalle a la derecha
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 1. EFECTO: Conexión a Firebase
  // Usamos onSnapshot para que sea en tiempo real: si alguien crea un evento, me aparece al momento.
  useEffect(() => {
    // Filtramos solo los avisos que sean de tipo evento o social
    const q = query(collection(db, "notices"), where("type", "in", ["eventos", "social"]));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // uso la fecha de creación 'date' como fallback para que no explote.
        const rawDate = data.eventDate ? data.eventDate : new Date(data.date).toISOString().split('T')[0];

        return {
          id: doc.id,
          title: data.title,
          date: rawDate, 
          type: "social", // Forzamos el tipo para que salga rosa/fucsia en el calendario
          desc: data.desc,
          time: "Todo el día" 
        };
      });
      setCommunityEvents(events);
    });
    
    // Importante: Limpiamos la suscripción al desmontar el componente para no dejar procesos zombies
    return () => unsubscribe();
  }, []);

  // 2. MEMO: Fusión de eventos
  // Uso useMemo porque mezclar los arrays cada vez que hago un render es gastar recursos a lo tonto.
  // Solo recalculamos si cambian los eventos de la comunidad.
  const allEvents = useMemo(() => {
    // Primero procesamos los académicos (que vienen del archivo data.js)
    const processedAcademic = academicEvents.map(ev => {
        // Aquí podríamos expandir lógica si fueran rangos de fechas complejos,
        // de momento los pasamos tal cual.
        return ev;
    });

    // Y los juntamos con los que nos hemos bajado de Firebase
    return [...processedAcademic, ...communityEvents];
  }, [communityEvents]);

  // 3. LÓGICA MATEMÁTICA DEL CALENDARIO
  // Truquito de JS: el día 0 del mes siguiente es el último día del mes actual.
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  
  // Calculamos en qué día de la semana cae el día 1 (Lunes=0, Domingo=6)
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Ajuste porque en JS el Domingo es 0 y queremos que sea 6 (final)
  };

  // Variables auxiliares para pintar el grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  // Handlers para moverse entre meses
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Función clave: Dado un día (número), busca qué eventos coinciden
  const getEventsForDay = (day) => {
    // Formateamos la fecha a YYYY-MM-DD para comparar strings, que es más fácil que comparar objetos Date
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const checkDate = new Date(dateStr);

    return allEvents.filter(ev => {
      // Caso A: Coincidencia exacta de fecha string
      if (ev.date === dateStr) return true;
      
      // Caso B: Es un rango de fechas (ej: Vacaciones de Navidad)
      if (ev.start && ev.end) {
        const s = new Date(ev.start);
        const e = new Date(ev.end);
        // Comprobamos si la fecha actual está dentro del sandwich
        return checkDate >= s && checkDate <= e;
      }
      return false;
    });
  };

  // Cuando clico un día en el grid
  const handleDayClick = (day) => {
    setSelectedDate(new Date(year, month, day));
  };

  // Filtramos los eventos del día seleccionado para el panel lateral.
  // Lo meto en un useMemo para que el panel de la derecha no parpadee si no cambio de día.
  const selectedDayEvents = useMemo(() => {
    const d = selectedDate.getDate();
    const m = selectedDate.getMonth();
    
    // Si he cambiado de mes visualmente en el calendario, pero tengo seleccionado
    // un día del mes pasado, prefiero no mostrar nada para no liar al usuario.
    if (m !== month) return [];
    
    return getEventsForDay(d);
  }, [selectedDate, month, allEvents]); // Dependencias: si cambia el día, el mes o cargan eventos nuevos

  return (
    <div className="calendar-container">
      {/* HEADER DE LA PÁGINA */}
      <header className="cal-main-header">
        <div>
          <h1>Calendario Unificado</h1>
          <p>Toda la actividad académica y social de EUNEIZ en un solo lugar.</p>
        </div>
        
        {/* Leyenda de colores (Iteramos sobre la config para no hardcodear) */}
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
        
        {/* --- COLUMNA IZQUIERDA: EL GRID --- */}
        {/* Añado 'card-base' para heredar la sombra y bordes globales del Index.css */}
        <div className="cal-card main-cal card-base">
          <div className="cal-nav">
            <button onClick={prevMonth} className="nav-btn"><ChevronLeft/></button>
            <h2>{MONTHS[month]} {year}</h2>
            <button onClick={nextMonth} className="nav-btn"><ChevronRight/></button>
          </div>

          <div className="cal-grid">
            {/* Cabeceras Lun-Dom */}
            {WEEKDAYS.map(day => <div key={day} className="cal-weekday">{day}</div>)}
            
            {/* Celdas vacías (offset) para que el día 1 empiece donde toca */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="cal-day empty"></div>
            ))}

            {/* Días reales del mes */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              
              // Comprobamos si es el día seleccionado o si es HOY
              const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month;
              const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

              return (
                <div 
                  key={day} 
                  className={`cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => handleDayClick(day)}
                >
                  <span className="day-number">{day}</span>
                  {/* Puntitos de colores si hay eventos */}
                  <div className="day-dots">
                    {dayEvents.slice(0, 3).map((ev, idx) => (
                      <span 
                        key={idx} 
                        className="event-dot" 
                        style={{ backgroundColor: EVENT_TYPES[ev.type]?.color || '#999' }}
                      />
                    ))}
                    {/* Si hay más de 3, pongo un más pequeñito */}
                    {dayEvents.length > 3 && <span className="plus-dot">+</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- COLUMNA DERECHA: DETALLE DEL DÍA --- */}
        <div className="cal-card agenda-panel card-base">
          <div className="agenda-header">
            <div className="date-badge">
              <span className="big-day">{selectedDate.getDate()}</span>
              {/* Pillamos el nombre del mes del array usando el índice */}
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
                    {/* Si es festivo o académico genérico, asumimos todo el día */}
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
                  {/* Etiqueta flotante con el tipo */}
                  <span className="event-tag" style={{color: EVENT_TYPES[ev.type]?.color}}>
                    {EVENT_TYPES[ev.type]?.label}
                  </span>
                </div>
              ))
            ) : (
              // Estado vacío bonito
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