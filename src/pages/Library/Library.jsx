import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Library.css";

// ---------- Funciones auxiliares para CSV ----------

function parseCSVLine(text) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCsvToBooks(text, area) {
  const lines = text.split("\n");
  const headers = parseCSVLine(lines[1] || "");
  const dataLines = lines.slice(2);

  return dataLines
    .filter((line) => line.trim() !== "")
    .map((line, index) => {
      const values = parseCSVLine(line);
      const row = {};

      headers.forEach((header, i) => {
        const key = header.replace(/^"|"$/g, "").trim();
        row[key] = values[i] ? values[i].replace(/^"|"$/g, "") : "";
      });

      const title = row["Título"] || row["Titulo"] || "Sin título";
      const author = row["Autor/a"] || "Autor desconocido";
      const summary = row["Resumen"] || "";

      const rawSubjects =
        row["Materias/Temáticas"] ||
        row["Materias/Tem\u00e1ticas"] ||
        "";

      const subjects = rawSubjects
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      return {
        id: `${area}-${index}`,
        title,
        author,
        area,
        subjects,
        summary,
        status: "disponible",
      };
    });
}

// ---------- Envío de email (placeholder) ----------

function sendReservationEmail({ userEmail, bookTitle }) {
  console.log(
    `Enviar email a eric.ruiz@euneiz.com: ${userEmail} ha reservado "${bookTitle}"`
  );
}

// ---------- Componente principal ----------

export const Library = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Todos");

  // Favoritos -> guardamos IDs de libros
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("favoriteIds")) || [];
    } catch {
      return [];
    }
  });

  // Reservas -> guardamos objetos con info
  const [reservations, setReservations] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("reservations")) || [];
    } catch {
      return [];
    }
  });

  const isFavorite = (id) => favoriteIds.includes(id);

  const toggleFavorite = (id) => {
    setFavoriteIds((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];

      try {
        localStorage.setItem("favoriteIds", JSON.stringify(updated));
      } catch (e) {
        console.warn("No se pudo guardar favoriteIds en localStorage", e);
      }

      return updated;
    });
  };

  // ---------- Reservar libro (máximo 3 por usuario) ----------

  const handleReserve = (book) => {
    const userEmail = user?.email || "usuario-desconocido";

    // Reservas de ESTE usuario
    const userReservations = reservations.filter(
      (r) => r.userEmail === userEmail
    );

    if (userReservations.length >= 3) {
      alert("Solo puedes reservar un máximo de 3 libros a la vez.");
      return;
    }

    // Evitar reservar dos veces el mismo libro
    if (userReservations.some((r) => r.bookId === book.id)) {
      alert("Este libro ya lo tienes reservado.");
      return;
    }

    const newReservation = {
      bookId: book.id,
      bookTitle: book.title,
      userEmail,
      timestamp: Date.now(), // Momento de la reserva
    };

    const updated = [...reservations, newReservation];
    setReservations(updated);

    try {
      localStorage.setItem("reservations", JSON.stringify(updated));
    } catch (e) {
      console.warn("No se pudo guardar reservations en localStorage", e);
    }

    // "Enviar" email (a nivel de código)
    sendReservationEmail({ userEmail, bookTitle: book.title });

    alert("Libro reservado correctamente.");
  };

  // ---------- Carga de libros desde los CSV ----------

  useEffect(() => {
    async function loadBooks() {
      try {
        const [tecRes, salRes] = await Promise.all([
          fetch("/data/tecnologias.csv"),
          fetch("/data/salud.csv"),
        ]);

        if (!tecRes.ok || !salRes.ok) {
          console.warn(
            "Archivos CSV no encontrados, usando datos de ejemplo."
          );
          const mockBooks = [
            {
              id: "mock-1",
              title: "Anatomía Básica",
              author: "Dr. Smith",
              area: "Salud",
              subjects: ["Medicina"],
              summary: "Introducción sencilla a la anatomía humana.",
              status: "disponible",
            },
            {
              id: "mock-2",
              title: "React Moderno",
              author: "Dev Guru",
              area: "Tecnología",
              subjects: ["Programación", "Web"],
              summary: "Guía práctica sobre React y hooks.",
              status: "prestado",
            },
          ];
          setBooks(mockBooks);
          setLoading(false);
          return;
        }

        const [tecText, salText] = await Promise.all([
          tecRes.text(),
          salRes.text(),
        ]);

        const tecBooks = parseCsvToBooks(tecText, "Tecnología");
        const salBooks = parseCsvToBooks(salText, "Salud");

        setBooks([...tecBooks, ...salBooks]);
        setError("");
      } catch (err) {
        console.error(err);
        setError("Error cargando los datos. Revisa los CSV.");
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, []);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const text = query.trim().toLowerCase();

      if (text) {
        const inText =
          book.title.toLowerCase().includes(text) ||
          book.author.toLowerCase().includes(text) ||
          (book.summary || "").toLowerCase().includes(text) ||
          book.area.toLowerCase().includes(text) ||
          book.subjects.some((s) => s.toLowerCase().includes(text));

        if (!inText) return false;
      }

      if (areaFilter !== "Todas" && book.area !== areaFilter) return false;
      if (statusFilter !== "Todos" && book.status !== statusFilter) return false;

      return true;
    });
  }, [books, query, areaFilter, statusFilter]);

  const handleTagClick = (tag) => {
    const t = tag.toLowerCase();
    setQuery((current) =>
      current.toLowerCase() === t ? "" : tag
    );
  };

  // ---------- Render ----------

  return (
    <div className="library-page">
      {/* Sidebar izquierda */}
      <aside className="library-sidebar">
        <div>
          <div className="sidebar-header">
            <h1>Biblioteca</h1>
            <p>EUNEIZ</p>
          </div>

          <nav className="sidebar-menu">
            <div className="sidebar-section-title">Menú</div>

            <button
              className="sidebar-item sidebar-item-active"
              onClick={() => navigate("/library")}
            >
              📚 Todos los libros
            </button>

            <button
              className="sidebar-item"
              onClick={() => navigate("/favorites")}
            >
              ❤️ Favoritos
            </button>

            <button
              className="sidebar-item"
              onClick={() => navigate("/reservas")}
            >
              📘 Reservas
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-section-title">Áreas disponibles</div>
          <ul>
            <li>💊 Salud</li>
            <li>💻 Tecnología</li>
          </ul>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="library-main">
        <header className="library-header">
          <div>
            <h2>Catálogo de Libros</h2>
            <p className="header-subtitle">
              Busca por título, autor, materias…
            </p>
          </div>

          <div className="header-filters">
            <input
              type="text"
              placeholder="🔍 Buscar libro..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="search-input"
            />

            <select
              className="filter-select"
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
            >
              <option value="Todas">Todas las áreas</option>
              <option value="Tecnología">Tecnología</option>
              <option value="Salud">Salud</option>
            </select>

            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Todos">Estado: Todos</option>
              <option value="disponible">Disponibles</option>
              <option value="prestado">Prestados</option>
            </select>
          </div>
        </header>

        {loading && (
          <div className="loading-spinner">Cargando biblioteca...</div>
        )}
        {error && !loading && (
          <div className="error-message">{error}</div>
        )}

        {!loading && (
          <section className="books-grid">
            {filteredBooks.map((book) => {
              // 👉 Comprobar si este libro está reservado por CUALQUIER usuario
              const isBookReserved = reservations.some(
                (r) => r.bookId === book.id
              );

              const isAvailable =
                !isBookReserved && book.status === "disponible";

              return (
                <article key={book.id} className="book-card">
                  <div
                    className={
                      "book-image " +
                      (book.area === "Tecnología"
                        ? "book-image-tech"
                        : "book-image-health")
                    }
                  >
                    <span>{book.area}</span>
                  </div>

                  <div className="book-content">
                    <div className="book-header">
                      <h3 className="book-title">{book.title}</h3>
                      <span
                        className={
                          "book-status " +
                          (isAvailable
                            ? "book-status-available"
                            : "book-status-borrowed")
                        }
                      >
                        {isAvailable ? "Disponible" : "No disponible"}
                      </span>
                    </div>

                    <p className="book-author">{book.author}</p>

                    {book.summary && (
                      <p className="book-summary" title={book.summary}>
                        {book.summary.length > 80
                          ? book.summary.substring(0, 80) + "..."
                          : book.summary}
                      </p>
                    )}

                    <div className="book-tags">
                      {book.subjects.slice(0, 3).map((subject) => (
                        <button
                          key={subject}
                          className="book-tag"
                          onClick={() => handleTagClick(subject)}
                        >
                          {subject}
                        </button>
                      ))}
                    </div>

                    {/* Botón favoritos */}
                    <button
                      className={
                        "book-fav-btn " +
                        (isFavorite(book.id) ? "book-fav-btn-saved" : "")
                      }
                      onClick={() => toggleFavorite(book.id)}
                    >
                      {isFavorite(book.id)
                        ? "✔ Guardado en favoritos"
                        : "❤️ Añadir a favoritos"}
                    </button>

                    {/* Botón reservar: SOLO si no está reservado */}
                    {!isBookReserved && (
                      <button
                        className="book-reserve-btn"
                        onClick={() => handleReserve(book)}
                      >
                        📘 Reservar
                      </button>
                    )}
                  </div>
                </article>
              );
            })}

            {!error && !loading && filteredBooks.length === 0 && (
              <div className="empty-state">
                No hemos encontrado libros con esos filtros.
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default Library;

