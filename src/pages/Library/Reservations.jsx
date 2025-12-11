import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Library.css";

const RESERVATION_TIME = 20 * 24 * 60 * 60 * 1000; // 20 días en ms

function formatTime(ms) {
  if (ms <= 0) return "❌ Expirado";

  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);

  return `${days} días, ${hours} h`;
}

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

export const Reservations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [books, setBooks] = useState([]);
  const [reservations, setReservations] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("reservations")) || [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  // Actualizar "ahora" cada minuto para refrescar el contador
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Cargar libros
  useEffect(() => {
    async function loadBooks() {
      try {
        const [tecRes, salRes] = await Promise.all([
          fetch("/data/tecnologias.csv"),
          fetch("/data/salud.csv"),
        ]);

        if (!tecRes.ok || !salRes.ok) {
          console.warn("No se pudieron cargar los CSV, usando mocks.");
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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, []);

  // Libros reservados por el usuario actual
  const reservedBooks = useMemo(() => {
    const userEmail = user?.email || "usuario-desconocido";

    return reservations
      .filter((r) => r.userEmail === userEmail)
      .map((r) => {
        const book = books.find((b) => b.id === r.bookId);
        if (!book) return null;

        const expirationTime = r.timestamp + RESERVATION_TIME;
        const remaining = expirationTime - now;

        return {
          ...book,
          remaining,
          userEmail: r.userEmail,
          reservationKey: `${r.userEmail}-${r.bookId}`,
        };
      })
      .filter(Boolean);
  }, [books, reservations, now, user]);

  return (
    <div className="library-page">
      {/* Sidebar */}
      <aside className="library-sidebar">
        <div>
          <div className="sidebar-header">
            <h1>Biblioteca</h1>
            <p>EUNEIZ</p>
          </div>

          <nav className="sidebar-menu">
            <div className="sidebar-section-title">Menú</div>

            <button
              className="sidebar-item"
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
              className="sidebar-item sidebar-item-active"
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
            <h2>Mis reservas</h2>
            <p className="header-subtitle">
              Libros reservados por tu cuenta. Cada reserva dura 20 días.
            </p>
          </div>
        </header>

        {loading && (
          <div className="loading-spinner">Cargando reservas...</div>
        )}

        {!loading && reservedBooks.length === 0 && (
          <div className="empty-state">
            No tienes libros reservados.
          </div>
        )}

        <section className="books-grid">
          {reservedBooks.map((book) => (
            <article key={book.reservationKey} className="book-card">
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
                </div>

                <p className="book-author">{book.author}</p>

                {book.summary && (
                  <p className="book-summary">
                    {book.summary.length > 80
                      ? book.summary.slice(0, 80) + "..."
                      : book.summary}
                  </p>
                )}

                <p className="book-reservation-time">
                  ⏳ Tiempo restante:{" "}
                  <strong>{formatTime(book.remaining)}</strong>
                </p>

                <p className="book-author">
                  Reservado por: <strong>{book.userEmail}</strong>
                </p>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
};

export default Reservations;
