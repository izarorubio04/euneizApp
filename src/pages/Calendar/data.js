// Tipos de eventos para asignar colores
export const EVENT_TYPES = {
  academic: { label: "Académico", color: "#000B3D" }, // Azul Euneiz
  holiday: { label: "Festivo / Vacaciones", color: "#F1595C" }, // Rojo Euneiz
  exam: { label: "Exámenes", color: "#d35400" },
  social: { label: "Vida Social", color: "#27ae60" }, // Verde
};

// Fechas extraídas de la imagen (Curso 25/26)
export const academicEvents = [
  // SEPTIEMBRE 2025
  { date: "2025-09-08", title: "Comienzo 3º y 4º Fisioterapia", type: "academic" },
  { date: "2025-09-11", title: "Bienvenida 1er Curso", type: "academic" },
  { date: "2025-09-12", title: "Bienvenida 1er Curso", type: "academic" },
  { date: "2025-09-15", title: "Inicio resto de grados", type: "academic" },
  
  // FESTIVOS Y PUENTES (Ejemplos basados en imagen)
  { date: "2025-10-13", title: "Día Euneiz / Puente", type: "holiday" },
  { date: "2025-11-01", title: "Todos los Santos", type: "holiday" },
  { date: "2025-12-06", title: "La Constitución", type: "holiday" },
  { date: "2025-12-08", title: "La Inmaculada", type: "holiday" },
  
  // VACACIONES
  { start: "2025-12-22", end: "2026-01-06", title: "Vacaciones de Navidad", type: "holiday" },
  { start: "2026-03-30", end: "2026-04-12", title: "Semana Santa", type: "holiday" }, // Aprox segun calendario 2026

  // EXÁMENES (Enero)
  { start: "2026-01-07", end: "2026-01-23", title: "Evaluación Ordinaria Semestre 1", type: "exam" },
  
  // SEMESTRE 2
  { date: "2026-01-26", title: "Inicio Docencia 2º Semestre", type: "academic" },
  
  // FINALES
  { start: "2026-05-18", end: "2026-05-30", title: "Evaluación Ordinaria Semestre 2", type: "exam" },
  { start: "2026-06-12", end: "2026-07-03", title: "Evaluación Extraordinaria", type: "exam" },
  
  // TFG
  { date: "2026-07-10", title: "Defensa Extraordinaria TFG", type: "academic" }
];