import React, { useState, useMemo, useEffect } from "react";
import Papa from "papaparse";
import "../Biblioteca/LibraryPage.css";

// Función para convertir una tabla CSV en un array de libros
function parseCsvToBooks(text, area) {
  return new Promise((resolve, reject) => {
    // En tus CSV la primera línea es "decorativa", así que la quitamos
    const lines = text.split("\n");
    const withoutFirstLine = lines.slice(1).join("\n");

    Papa.parse(withoutFirstLine, {
      header: true,           // Usa la primera línea (después de quitar la decorativa) como cabecera
      skipEmptyLines: true,   // Salta filas vacías
      complete: (results) => {
        const rows = results.data;

        const books = rows.map((row, index) => {
          // Algunas claves tienen acentos, las cogemos tal cual
          const title = row["Título"] || row["Titulo"] || "Sin título";
          const author = row["Autor/a"] || "Autor desconocido";
          const summary = row["Resumen"] || "";

          const rawSubjects =
            row["Materias/Temáticas"] ||
            row["Materias/Tem\u00e1ticas"] || // por si el acento viene raro
            "";

          const subjects = rawSubjects
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

          return {
            id: `${area}-${index}`,
            title,
            author,
            area,          // "Tecnología" o "Salud"
            subjects,
            summary,
            status: "disponible", // de momento todos disponibles
          };
        });

        resolve(books);
      },
      error: (err) => {
        reject(err);
      },
    });
  });
}

function LibraryPage() {
  const [books, setBooks] = useState([]);        // aquí guardamos TODOS los libros
  const [loading, setLoading] = useState(true);  // para mostrar "cargando..."
  const [error, setError] = useState("");        // por si falla algo

  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("Todas"); // "Todas", "Tecnología", "Salud"
  const [statusFilter, setStatusFilter] = useState("Todos"); // "Todos", "disponible", "prestado"

  // Cargar los CSV al montar el componente
  useEffect(() => {
    async function loadBooks() {
      try {
        // 1. Pedimos los dos CSV
        const [tecRes, salRes] = await Promise.all([
          fetch("/data/tecnologias.csv"),
          fetch("/data/salud.csv"),
        ]);

        const [tecText, salText] = await Promise.all([
          tecRes.text(),
          salRes.text(),
        ]);

        // 2. Parseamos cada uno, marcando el área
        const [tecBooks, salBooks] = await Promise.all([
          parseCsvToBooks(tecText, "Tecnología"),
          parseCsvToBooks(salText, "Salud"),
        ]);

        // 3. Juntamos todos los libros
        setBooks([...tecBooks, ...salBooks]);
      } catch (err) {
        console.error(err);
        setError("No se han podido cargar los libros.");
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, []);

  // Filtrar libros según búsqueda y filtros
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const text = query.trim().toLowerCase();

      // filtro del buscador
      if (text) {
        const inText =
          book.title.toLowerCase().includes(text) ||
          book.author.toLowerCase().includes(text) ||
          (book.summary || "").toLowerCase().includes(text) ||
          book.area.toLowerCase().includes(text) ||
          book.subjects.some((s) => s.toLowerCase().includes(text));

        if (!inText) return false;
      }

      // filtro área
      if (areaFilter !== "Todas" && book.area !== areaFilter) return false;

      // filtro disponibilidad
      if (statusFilter !== "Todos" && book.status !== statusFilter) return false;

      return true;
    });
  }, [books, query, areaFilter, statusFilter]);

  // Cuando pulsamos una etiqueta (materia)
  const handleTagClick = (tag) => {
    const t = tag.toLowerCase();
    setQuery((current) =>
      current.toLowerCase() === t ? "" : tag
    );
  };

  return (
    <div className="library-page">
      {/* Sidebar izquierda */}
      <aside className="library-sidebar">
        <div>
          <div className="sidebar-header">
            <h1>Biblioteca</h1>
            <p>Comunidad universitaria</p>
          </div>

          <nav className="sidebar-menu">
            <div className="sidebar-section-title">Menú</div>
            <button className="sidebar-item sidebar-item-active">
              📚 Todos los libros
            </button>
            <button className="sidebar-item" disabled>
              ❤️ Favoritos (próximamente)
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-section-title">Áreas</div>
          <ul>
            <li>Salud</li>
            <li>Tecnología</li>
          </ul>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="library-main">
        {/* Barra superior con título, buscador y filtros */}
        <header className="library-header">
          <div>
            <h2>Mis libros</h2>
            <p className="header-subtitle">
              Busca por título, autor, materias…
            </p>
          </div>

          <div className="header-filters">
            <input
              type="text"
              placeholder="Buscar..."
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
              <option value="Todos">Todos</option>
              <option value="disponible">Disponibles</option>
              <option value="prestado">Prestados</option>
            </select>
          </div>
        </header>

        {/* Mensajes de carga / error */}
        {loading && <p>Cargando libros...</p>}
        {error && !loading && <p style={{ color: "red" }}>{error}</p>}

        {/* Lista de libros */}
        {!loading && (
          <section className="books-grid">
            {filteredBooks.map((book) => (
              <article key={book.id} className="book-card">
                {/* Placeholder de imagen según área */}
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
                    <p className="book-summary">{book.summary}</p>
                  )}

                  <div className="book-tags">
                    {book.subjects.map((subject) => (
                      <button
                        key={subject}
                        className="book-tag"
                        onClick={() => handleTagClick(subject)}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            ))}

            {!error && !loading && filteredBooks.length === 0 && (
              <p className="empty-state">
                No se han encontrado libros con estos filtros.
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default LibraryPage;
