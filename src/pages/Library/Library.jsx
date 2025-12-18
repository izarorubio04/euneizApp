import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import "./Library.css";


export const Library = () => {
  const { user } = useAuth();
  
  // --- ESTADOS ---
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("catalogo");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDegree, setFilterDegree] = useState("");
  const [filterMaterial, setFilterMaterial] = useState("");
  
  const [selectedBook, setSelectedBook] = useState(null);

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem(`euneiz_lib_favs_${user?.email}`);
    return saved ? JSON.parse(saved) : [];
  });

  const [reservations, setReservations] = useState(() => {
    const saved = localStorage.getItem(`euneiz_lib_res_${user?.email}`);
    return saved ? JSON.parse(saved) : [];
  });

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const loadLibraryData = async () => {
      try {
        const [resSalud, resTech] = await Promise.all([
          fetch("/data/salud.csv"),
          fetch("/data/tecnologias.csv")
        ]);

        const textSalud = await resSalud.text();
        const textTech = await resTech.text();

        const parseCSV = (text, category) => {
          const lines = text.split("\n").filter(l => l.trim() !== "");
          return lines.slice(1).map((line, index) => {
            const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            return {
              id: `${category}-${index}`,
              titulo: values[0]?.replace(/"/g, "").trim(),
              autor: values[1]?.replace(/"/g, "").trim(),
              editorial: values[2]?.replace(/"/g, "").trim(),
              edicion: values[3]?.replace(/"/g, "").trim(),
              año: values[4]?.replace(/"/g, "").trim(),
              isbn: values[5]?.replace(/"/g, "").trim(),
              titulacion: values[6]?.replace(/"/g, "").trim(),
              materias: values[7]?.replace(/"/g, "").split(";").map(s => s.trim()).filter(Boolean),
              signatura: values[8]?.replace(/"/g, "").trim(),
              resumen: values[9]?.replace(/"/g, "").trim(),
              categoria: category,
              disponible: Math.random() > 0.3
            };
          });
        };

        setAllBooks([...parseCSV(textSalud, "Salud"), ...parseCSV(textTech, "Tecnología")]);
      } catch (err) {
        console.error("Error al cargar biblioteca:", err);
      } finally {
        setLoading(false);
      }
    };
    loadLibraryData();
  }, []);

  // --- PERSISTENCIA ---
  useEffect(() => {
    if (user?.email) localStorage.setItem(`euneiz_lib_favs_${user.email}`, JSON.stringify(favorites));
  }, [favorites, user]);

  useEffect(() => {
    if (user?.email) localStorage.setItem(`euneiz_lib_res_${user.email}`, JSON.stringify(reservations));
  }, [reservations, user]);

  const uniqueDegrees = useMemo(() => [...new Set(allBooks.map(b => b.titulacion).filter(Boolean))].sort(), [allBooks]);
  const uniqueMaterials = useMemo(() => [...new Set(allBooks.flatMap(b => b.materias).filter(Boolean))].sort(), [allBooks]);

  // --- FILTRADO ---
  const displayedBooks = useMemo(() => {
    let base = allBooks;
    if (activeTab === "favoritos") base = allBooks.filter(b => favorites.includes(b.id));
    if (activeTab === "reservas") base = allBooks.filter(b => reservations.some(r => r.id === b.id));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      base = base.filter(b => b.titulo?.toLowerCase().includes(q) || b.autor?.toLowerCase().includes(q) || b.isbn?.toLowerCase().includes(q));
    }
    if (filterDegree) base = base.filter(b => b.titulacion === filterDegree);
    if (filterMaterial) base = base.filter(b => b.materias?.includes(filterMaterial));

    return base;
  }, [allBooks, activeTab, favorites, reservations, searchQuery, filterDegree, filterMaterial]);

  const toggleFavorite = (e, id) => {
    e.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const toggleReservation = (e, book) => {
    e.stopPropagation();
    const isReserved = reservations.some(r => r.id === book.id);
    if (isReserved) {
      setReservations(prev => prev.filter(r => r.id !== book.id));
    } else {
      setReservations(prev => [...prev, { id: book.id, date: new Date().toISOString() }]);
    }
  };

  if (loading) return <div className="library-main"><h3>Accediendo a la base de datos de EUNEIZ...</h3></div>;

  return (
    <div className="library-main">

      <header className="lib-dashboard-header">
        <div className="lib-header-top">
          <h1>Biblioteca Digital</h1>
          <nav className="lib-nav-horizontal">
            <button className={`lib-tab ${activeTab === "catalogo" ? "active" : ""}`} onClick={() => setActiveTab("catalogo")}>📚 Catálogo</button>
            <button className={`lib-tab ${activeTab === "favoritos" ? "active" : ""}`} onClick={() => setActiveTab("favoritos")}>❤️ Favoritos ({favorites.length})</button>
            <button className={`lib-tab ${activeTab === "reservas" ? "active" : ""}`} onClick={() => setActiveTab("reservas")}>🔖 Reservas ({reservations.length})</button>
          </nav>
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label>Buscador (Título, Autor, ISBN)</label>
            <input type="text" className="lib-input" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Grado / Titulación</label>
            <select className="lib-input" value={filterDegree} onChange={(e) => setFilterDegree(e.target.value)}>
              <option value="">Todos</option>
              {uniqueDegrees.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Temática</label>
            <select className="lib-input" value={filterMaterial} onChange={(e) => setFilterMaterial(e.target.value)}>
              <option value="">Todas</option>
              {uniqueMaterials.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </header>

      <main className="books-display-grid">
        {displayedBooks.map(book => {
          const isFav = favorites.includes(book.id);
          const isRes = reservations.some(r => r.id === book.id);

          return (
            <div key={book.id} className="card-book" onClick={() => setSelectedBook(book)}>
              <div className={`card-visual ${book.categoria === "Salud" ? "bg-area-salud" : "bg-area-tech"}`}>
                <span className="visual-icon">{book.categoria === "Salud" ? "🩺" : "💻"}</span>
                <span className="visual-degree">{book.titulacion || book.categoria}</span>
              </div>
              <div className="card-body">
                <div className="card-status">
                  <span className={`dot-indicator ${book.disponible ? "dot-online" : "dot-offline"}`}></span>
                  {book.disponible ? "Disponible" : "Préstamo activo"}
                </div>
                <h3>{book.titulo}</h3>
                <p className="card-author">de {book.autor}</p>
                <div className="card-metadata-info">
                  <div className="meta-item"><b>Año:</b> {book.año}</div>
                  <div className="meta-item"><b>Editorial:</b> {book.editorial}</div>
                </div>
                <div className="tag-box">
                  {book.materias?.slice(0, 3).map(m => <span key={m} className="mini-tag">{m}</span>)}
                </div>
                <div className="card-actions-row" onClick={e => e.stopPropagation()}>
                  <button className={`btn-lib btn-lib-fav ${isFav ? "active" : ""}`} onClick={(e) => toggleFavorite(e, book.id)}>
                    {isFav ? "❤️" : "🤍"}
                  </button>
                  <button className={`btn-lib btn-lib-res ${isRes ? "active" : ""}`} disabled={!book.disponible && !isRes} onClick={(e) => toggleReservation(e, book)}>
                    {isRes ? "Anular" : "Reservar"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {selectedBook && (
        <div 
          className="overlay-modal" 
          onClick={(e) => {
            // Cerramos si el clic es en el fondo oscuro
            setSelectedBook(null);
          }}
        >
          <div 
            className="popup-ficha" 
            onClick={e => e.stopPropagation()} // Evitamos que el clic en el modal lo cierre
          >
            {/* BOTÓN DE CIERRE REFORZADO */}
            <button 
              className="btn-close-popup" 
              title="Cerrar ventana"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedBook(null);
              }}
            >
              ✕
            </button>
            
            <div className={`popup-visual-side ${selectedBook.categoria === "Salud" ? "bg-area-salud" : "bg-area-tech"}`}>
              <span className="big-icon">{selectedBook.categoria === "Salud" ? "🩺" : "💻"}</span>
            </div>
            
            <div className="popup-content-side">
              <span className="popup-degree-label">{selectedBook.titulacion}</span>
              <h2>{selectedBook.titulo}</h2>
              <div className="popup-full-meta">
                <div className="meta-block"><span>Autor/a</span><p>{selectedBook.autor}</p></div>
                <div className="meta-block"><span>Editorial</span><p>{selectedBook.editorial}</p></div>
                <div className="meta-block"><span>ISBN</span><p>{selectedBook.isbn}</p></div>
                <div className="meta-block"><span>Signatura</span><p>{selectedBook.signatura}</p></div>
              </div>
              <div className="popup-synopsis">
                <h4>Resumen</h4>
                <p>{selectedBook.resumen || "No se dispone de resumen."}</p>
              </div>
              <div className="card-actions-row">
                <button 
                  className={`btn-lib btn-lib-fav ${favorites.includes(selectedBook.id) ? "active" : ""}`} 
                  onClick={(e) => toggleFavorite(e, selectedBook.id)}
                >
                  {favorites.includes(selectedBook.id) ? "❤️ Quitar" : "🤍 Favorito"}
                </button>
                {selectedBook.disponible && (
                  <button 
                    className={`btn-lib btn-lib-res ${reservations.some(r => r.id === selectedBook.id) ? "active" : ""}`} 
                    onClick={(e) => toggleReservation(e, selectedBook)}
                  >
                    {reservations.some(r => r.id === selectedBook.id) ? "Anular Reserva" : "Reservar"}
                  </button>
                )}
              </div>
              {reservations.some(r => r.id === selectedBook.id) && (
                <div className="reservation-note-box">
                  ⚠️ <b>Importante:</b> Tienes 24 horas para recoger el ejemplar en Secretaría.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;