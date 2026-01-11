// src/pages/Comunity/data.js

export const clubs = [
  {
    id: "cine",
    nombre: "Club de Cine",
    descripcion: "Proyecciones, tertulias y análisis de pelis y series todos los jueves.",
    miembros: 42,
    horario: "Jueves 18:00",
    tipo: "club", // Oficial
    imagen: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=500"
  },
  {
    id: "esports",
    nombre: "EUNEIZ Esports",
    descripcion: "Equipo competitivo oficial. Entrenamientos de LoL y Valorant.",
    miembros: 120,
    horario: "Viernes 17:00",
    tipo: "club",
    imagen: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=500"
  },
  {
    id: "lectura",
    nombre: "Club de Lectura",
    descripcion: "Para amantes de los libros. Leemos uno al mes y lo debatimos.",
    miembros: 15,
    horario: "Miércoles 19:00",
    tipo: "club",
    imagen: "https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&q=80&w=500"
  },
];

export const comunidades = [
  {
    id: "multimedia",
    nombre: "Estudiantes Multimedia",
    descripcion: "Grupo informal para compartir apuntes, recursos y dudas de clase.",
    miembros: 56,
    tipo: "comunidad", // Alumnos
    tags: ["Apuntes", "Dudas"]
  },
  {
    id: "biblio",
    nombre: "Study Buddies",
    descripcion: "Quedadas para estudiar juntos en silencio en la biblioteca o salas.",
    miembros: 23,
    tipo: "comunidad",
    tags: ["Estudio", "Silencio"]
  },
  {
    id: "deporte",
    nombre: "Pachangas EUNEIZ",
    descripcion: "Organizamos partidos de fútbol y baloncesto los fines de semana.",
    miembros: 89,
    tipo: "comunidad",
    tags: ["Deporte", "Salud"]
  },
];