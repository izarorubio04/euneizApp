import React, { useState, useMemo, useEffect } from "react";
import "./Library.css";

// --- FUNCIONES AUXILIARES (Sin dependencias externas) ---

// Función simple para parsear una línea CSV respetando comillas
function parseCSVLine(text) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Función para convertir texto CSV en objetos
function parseCsvToBooks(text, area) {
  return new Promise((resolve) => {
    const lines = text.split("\n");
    // Asumimos que la primera línea es decorativa/inútil
    // La segunda línea suele ser el Header
    const headers = parseCSVLine(lines[1] || "");
    const dataLines = lines.slice(2); // Datos reales

    const books = dataLines
      .filter(line => line.trim() !== "")
      .map((line, index) => {
        const values = parseCSVLine(line);
        const row = {};
        
        headers.forEach((header, i) => {
            // Limpiamos comillas extra del header si las hubiera
            const key = header.replace(/^"|"$/g, '').trim();
            // Asignamos el valor correspondiente, limpiando comillas
            row[key] = values[i] ? values[i].replace(/^"|"$/g, '') : "";
        });

        // Mapeo flexible de claves (por si vienen con/sin acentos)
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

// --- COMPONENTE PRINCIPAL ---
export const Library = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState("Todos");

  useEffect(() => {
    async function loadBooks() {
      try {
        // Carga los archivos desde public/data/
        const [tecRes, salRes] = await Promise.all([
          fetch("/data/tecnologias.csv"),
          fetch("/data/salud.csv"),
        ]);

        if (!tecRes.ok || !salRes.ok) {
           console.warn("Archivos CSV no encontrados, usando datos de ejemplo.");
           // Mock data para que no se quede vacío si fallan los CSVs en la demo
           const mockBooks = [
               { id: 'mock-1', title: 'Anatomía Básica', author: 'Dr. Smith', area: 'Salud', subjects: ['Medicina', 'Cuerpo'], summary: 'Intro a la anatomía.', status: 'disponible' },
               { id: 'mock-2', title: 'React Moderno', author: 'Dev Guru', area: 'Tecnología', subjects: ['Programación', 'Web'], summary: 'Guía completa de hooks.', status: 'prestado' },
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
        setError("Error cargando los datos. Verifica los archivos CSV.");
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
            <button className="sidebar-item sidebar-item-active">
              📚 Todos los libros
            </button>
            <button className="sidebar-item" disabled>
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

        {loading && <div className="loading-spinner">Cargando biblioteca...</div>}
        {error && !loading && <div className="error-message">{error}</div>}

        {!loading && (
          <section className="books-grid">
            {filteredBooks.map((book) => (
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
                      {book.status === "disponible" ? "Disponible" : "Prestado"}
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
                </div>
              </article>
            ))}

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
}

// ⚠️ ¡IMPORTANTE! ⚠️
// He añadido esta línea al final para solucionar el error "Element type is invalid".
export default Library;