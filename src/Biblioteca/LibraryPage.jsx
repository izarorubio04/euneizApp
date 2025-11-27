import React, { useState, useMemo, useEffect } from "react";
import Papa from "papaparse";
import "../Biblioteca/LibraryStyle.css";

function parseCsvToBooks(text, area) {
  return new Promise((resolve, reject) => {
    const lines = text.split("\n");
    const withoutFirstLine = lines.slice(1).join("\n");

    Papa.parse(withoutFirstLine, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;

        const books = rows.map((row, index) => {
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
      },
      error: (err) => reject(err),
    });
  });
}

function LibraryPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("Todas");
  const [subjectFilter, setSubjectFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Todos");

  const [activeTab, setActiveTab] = useState("todos");
  const [reservedIds, setReservedIds] = useState(() => {
  return JSON.parse(localStorage.getItem("reservedBooks") || "[]");
  });

  const [favoriteIds, setFavoriteIds] = useState(() => {
  return JSON.parse(localStorage.getItem("favoriteBooks") || "[]");
  });
  useEffect(() => {
  localStorage.setItem("reservedBooks", JSON.stringify(reservedIds));
  }, [reservedIds]);

  useEffect(() => {
  localStorage.setItem("favoriteBooks", JSON.stringify(favoriteIds));
  }, [favoriteIds]);



  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    async function loadBooks() {
      const [tecFile, salFile] = await Promise.all([
        fetch("/data/tecnologias.csv"),
        fetch("/data/salud.csv"),
      ]);

      const [tecText, salText] = await Promise.all([
        tecFile.text(),
        salFile.text(),
      ]);

      const [tecBooks, salBooks] = await Promise.all([
        parseCsvToBooks(tecText, "Tecnología"),
        parseCsvToBooks(salText, "Salud"),
      ]);

      setBooks([...tecBooks, ...salBooks]);
      setLoading(false);
    }

    loadBooks();
  }, []);

  const subjects = useMemo(() => {
    const set = new Set();
    books.forEach((b) => b.subjects.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [books]);

  const filteredBooks = useMemo(() => {
    let result = books.filter((book) => {
      const t = query.trim().toLowerCase();

      if (t) {
        const matches =
          book.title.toLowerCase().includes(t) ||
          book.author.toLowerCase().includes(t) ||
          book.area.toLowerCase().includes(t) ||
          book.subjects.some((s) => s.toLowerCase().includes(t)) ||
          (book.summary || "").toLowerCase().includes(t);
        if (!matches) return false;
      }

      if (areaFilter !== "Todas" && book.area !== areaFilter) return false;

      if (
        subjectFilter !== "Todas" &&
        !book.subjects.includes(subjectFilter)
      )
        return false;

      if (statusFilter !== "Todos" && book.status !== statusFilter)
        return false;

      return true;
    });

    if (activeTab === "reservados") {
      result = result.filter((b) => reservedIds.includes(b.id));
    }

    if (activeTab === "favoritos") {
      result = result.filter((b) => favoriteIds.includes(b.id));
    }

    return result;
  }, [
    books,
    query,
    areaFilter,
    subjectFilter,
    statusFilter,
    activeTab,
    reservedIds,
    favoriteIds,
  ]);

  const toggleReserve = (id) => {
    setReservedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleFavorite = (id) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="library-page">

      {/* SIDEBAR */}
      <aside className="library-sidebar">
        <div>
          <div className="sidebar-header">
            <h1>Biblioteca</h1>
            <p>Comunidad universitaria</p>
          </div>

          <nav className="sidebar-menu">
            <button
              className={
                "sidebar-item " +
                (activeTab === "todos" ? "sidebar-item-active" : "")
              }
              onClick={() => setActiveTab("todos")}
            >
              📚 Todos los libros
            </button>

            <button
              className={
                "sidebar-item " +
                (activeTab === "reservados" ? "sidebar-item-active" : "")
              }
              onClick={() => setActiveTab("reservados")}
            >
              📌 Reservados
            </button>

            <button
              className={
                "sidebar-item " +
                (activeTab === "favoritos" ? "sidebar-item-active" : "")
              }
              onClick={() => setActiveTab("favoritos")}
            >
              ⭐ Favoritos
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-section-title">Áreas</div>
          <ul>
            <li>Tecnología</li>
            <li>Salud</li>
          </ul>
        </div>
      </aside>

      {/* MAIN */}
      <main className="library-main">

        <header className="library-header">
          <div>
            <h2>
              {activeTab === "todos" && "Mis libros"}
              {activeTab === "reservados" && "Libros reservados"}
              {activeTab === "favoritos" && "Libros favoritos"}
            </h2>
            <p className="header-subtitle">
              Busca por título, autor o materia.
            </p>
          </div>

          <div className="header-filters">
            <input
              type="text"
              placeholder="Buscar…"
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
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
            >
              <option value="Todas">Todas las categorías</option>
              {subjects.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Todos">Todos</option>
              <option value="disponible">Disponibles</option>
              <option value="prestado">Prestados</option>
            </select>
          </div>
        </header>

        {loading && <p>Cargando libros…</p>}

        <section className="books-grid">
          {!loading &&
            filteredBooks.map((book) => (
              <article
                key={book.id}
                className="book-card"
                onClick={() => setSelectedBook(book)}
              >
                {/* Placeholder */}
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
                      {book.status}
                    </span>
                  </div>

                  <p className="book-author">{book.author}</p>

                  {/* RESUMEN COMPLETO SOLO EN LA TARJETA CLICADA */}
                  {(() => {
                    const isSelected =
                      selectedBook && selectedBook.id === book.id;

                    if (isSelected) {
                      return (
                        <p className="book-summary full-summary">
                          {book.summary || "Sin descripción disponible."}
                        </p>
                      );
                    }

                    const short =
                      book.summary && book.summary.length > 80
                        ? book.summary.slice(0, 80) + "..."
                        : book.summary;

                    return (
                      <p className="book-summary">
                        {short || "Sin descripción."}
                      </p>
                    );
                  })()}

                  <div className="book-tags">
                    {book.subjects.map((s) => (
                      <button
                        key={s}
                        className="book-tag"
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuery(s);
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <div className="book-actions">
                    <button
                      className={
                        "book-button " +
                        (reservedIds.includes(book.id)
                          ? "book-button-secondary"
                          : "")
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleReserve(book.id);
                      }}
                    >
                      {reservedIds.includes(book.id)
                        ? "Quitar reserva"
                        : "Reservar"}
                    </button>

                    <button
                      className={
                        "book-button book-button-fav " +
                        (favoriteIds.includes(book.id)
                          ? "book-button-fav-active"
                          : "")
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(book.id);
                      }}
                    >
                      {favoriteIds.includes(book.id)
                        ? "★ Favorito"
                        : "☆ Favorito"}
                    </button>
                  </div>
                </div>
              </article>
            ))}

          {!loading && filteredBooks.length === 0 && (
            <p className="empty-state">No hay resultados.</p>
          )}
        </section>

        {/* MODAL DETALLADO */}
        {selectedBook && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedBook(null)}
          >
            <div
              className="modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={() => setSelectedBook(null)}
              >
                ✕
              </button>

              <div
                className={
                  "modal-image " +
                  (selectedBook.area === "Tecnología"
                    ? "book-image-tech"
                    : "book-image-health")
                }
              >
                <span>{selectedBook.area}</span>
              </div>

              <h2 className="modal-title">{selectedBook.title}</h2>
              <p className="modal-author">{selectedBook.author}</p>

              <p className="modal-summary">
                {selectedBook.summary || "Sin resumen disponible."}
              </p>

              <div className="modal-tags">
                {selectedBook.subjects.map((s) => (
                  <span key={s} className="modal-tag">
                    {s}
                  </span>
                ))}
              </div>

              <div className="modal-actions">
                <button
                  className={
                    "book-button " +
                    (reservedIds.includes(selectedBook.id)
                      ? "book-button-secondary"
                      : "")
                  }
                  onClick={() => toggleReserve(selectedBook.id)}
                >
                  {reservedIds.includes(selectedBook.id)
                    ? "Quitar reserva"
                    : "Reservar"}
                </button>

                <button
                  className={
                    "book-button book-button-fav " +
                    (favoriteIds.includes(selectedBook.id)
                      ? "book-button-fav-active"
                      : "")
                  }
                  onClick={() => toggleFavorite(selectedBook.id)}
                >
                  {favoriteIds.includes(selectedBook.id)
                    ? "★ Favorito"
                    : "☆ Favorito"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default LibraryPage;
