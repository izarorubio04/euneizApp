import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Library.css";

// Reutilizamos las mismas funciones de parseo:
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
  return new Promise((resolve) => {
    const lines = text.split("\n");
    const headers = parseCSVLine(lines[1] || "");
    const dataLines = lines.slice(2);

    const books = dataLines
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

    resolve(books);
  });
}

const Favorites = () => {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("favoriteIds")) || [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Cargar todos los libros (igual que en Library)
  useEffect(() => {
    async function loadBooks() {
      try {
        const [tecRes, salRes] = await Promise.all([
          fetch("/data/tecnologias.csv"),
          fetch("/data/salud.csv"),
        ]);

        if (!tecRes.ok || !salRes.ok) {
          console.warn(
            "Archivos CSV no encontrados al cargar favoritos, usando mock."
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

        const [tecBooks, salBooks] = await Promise.all([
          parseCsvToBooks(tecText, "Tecnología"),
          parseCsvToBooks(salText, "Salud"),
        ]);

        setBooks([...tecBooks, ...salBooks]);
        setError("");
      } catch (err) {
        console.error(err);
        setError("Error cargando los datos.");
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, []);

  // Libros que están en favoritos
  const favoriteBooks = useMemo(() => {
    return books.filter((b) => favoriteIds.includes(b.id));
  }, [books, favoriteIds]);

  // Quitar un libro de favoritos
  const handleRemoveFavorite = (id) => {
    setFavoriteIds((prev) => {
      const updated = prev.filter((x) => x !== id);
      try {
        localStorage.setItem("favoriteIds", JSON.stringify(updated));
      } catch (e) {
        console.warn("No se pudo guardar favoriteIds en localStorage", e);
      }
      return updated;
    });
  };

  return (
    <div className="library-page">
      {/* Sidebar igual que en Library, pero con Favoritos activo */}
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
              onClick={() => navigate("/")}
            >
              📚 Todos los libros
            </button>

            <button
              className="sidebar-item sidebar-item-active"
              onClick={() => navigate("/favoritos")}
            >
              ❤️ Favoritos
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

      <main className="library-main">
        <header className="library-header">
          <div>
            <h2>Libros favoritos</h2>
            <p className="header-subtitle">
              Aquí se muestran solo los libros que has marcado con ❤️.
            </p>
          </div>
        </header>

        {loading && (
          <div className="loading-spinner">Cargando favoritos...</div>
        )}

        {error && !loading && (
          <div className="error-message">{error}</div>
        )}

        {!loading && (
          <section className="books-grid">
            {favoriteBooks.map((book) => (
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
                        (book.status === "disponible"
                          ? "book-status-available"
                          : "book-status-borrowed")
                      }
                    >
                      {book.status === "disponible"
                        ? "Disponible"
                        : "Prestado"}
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
                      <span key={subject} className="book-tag">
                        {subject}
                      </span>
                    ))}
                  </div>

                  {/* Botón para quitar de favoritos */}
                  <button
                    className="book-fav-btn book-fav-btn-saved"
                    onClick={() => handleRemoveFavorite(book.id)}
                  >
                    Quitar de favoritos
                  </button>
                </div>
              </article>
            ))}

            {!error && !loading && favoriteBooks.length === 0 && (
              <div className="empty-state">
                No tienes libros favoritos todavía.
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default Favorites;

