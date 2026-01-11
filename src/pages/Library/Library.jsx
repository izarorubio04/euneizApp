import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  updateDoc, 
  deleteDoc, 
  where,
  writeBatch,
  setDoc
} from "firebase/firestore";
import "./Library.css";

// 1. IMPORTAR ICONOS DE INTERFAZ (Lucide)
import { 
  Search, 
  Filter, 
  BookOpen, 
  Heart, 
  Bookmark, 
  X, 
  Info,
  Library as LibraryIcon,
  ChevronDown
} from "lucide-react";

// 2. IMPORTAR TUS ICONOS PERSONALIZADOS
// Asegúrate de que la ruta coincida con donde guardaste los archivos
import IconTech from "../../assets/icon-tech.svg"; 
import IconHealth from "../../assets/icon-health.svg";

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
  const [userFavorites, setUserFavorites] = useState([]);
  const [userReservations, setUserReservations] = useState([]);

  // --- CARGA DE DATOS (FIREBASE) ---
  useEffect(() => {
    const q = query(collection(db, "libros"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllBooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const qFavs = query(collection(db, "favoritos_libros"), where("userEmail", "==", user.email));
    const unsubFavs = onSnapshot(qFavs, (s) => setUserFavorites(s.docs.map(d => d.data().bookId)));

    const qRes = query(collection(db, "reservas_libros"), where("userEmail", "==", user.email));
    const unsubRes = onSnapshot(qRes, (s) => setUserReservations(s.docs.map(d => d.data().bookId)));

    return () => { unsubFavs(); unsubRes(); };
  }, [user]);

  // --- FILTROS ---
  const uniqueDegrees = useMemo(() => 
    [...new Set(allBooks.map(b => b.titulacion).filter(Boolean))].sort(), 
  [allBooks]);

  const uniqueMaterials = useMemo(() => 
    [...new Set(allBooks.flatMap(b => b.materias || []).filter(Boolean))].sort(), 
  [allBooks]);

  const displayedBooks = useMemo(() => {
    let base = allBooks;
    if (activeTab === "favoritos") base = allBooks.filter(b => userFavorites.includes(b.id));
    if (activeTab === "reservas") base = allBooks.filter(b => userReservations.includes(b.id));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      base = base.filter(b => 
        b.titulo?.toLowerCase().includes(q) || 
        b.autor?.toLowerCase().includes(q) ||
        b.isbn?.toLowerCase().includes(q)
      );
    }
    if (filterDegree) base = base.filter(b => b.titulacion === filterDegree);
    if (filterMaterial) base = base.filter(b => b.materias?.includes(filterMaterial));

    return base;
  }, [allBooks, activeTab, userFavorites, userReservations, searchQuery, filterDegree, filterMaterial]);

  // --- ACCIONES ---
  const toggleFavorite = async (e, bookId) => {
    e.stopPropagation();
    const favId = `${user.email}_${bookId}`;
    if (userFavorites.includes(bookId)) {
      await deleteDoc(doc(db, "favoritos_libros", favId));
    } else {
      await setDoc(doc(db, "favoritos_libros", favId), { userEmail: user.email, bookId });
    }
  };

  const handleReservation = async (e, book) => {
    e.stopPropagation();
    const resId = `${user.email}_${book.id}`;
    if (userReservations.includes(book.id)) {
      await deleteDoc(doc(db, "reservas_libros", resId));
      await updateDoc(doc(db, "libros", book.id), { disponible: true });
    } else {
      if (!book.disponible) return alert("Libro no disponible.");
      await setDoc(doc(db, "reservas_libros", resId), { userEmail: user.email, bookId: book.id, fecha: Date.now() });
      await updateDoc(doc(db, "libros", book.id), { disponible: false });
    }
  };

  // Función de migración (Omitida por brevedad, mantenla si la necesitas)

  if (loading) return <div className="lib-loading">Sincronizando biblioteca...</div>;

  return (
    <div className="library-container">
      
      {/* HEADER FLOTANTE */}
      <header className="lib-header">
        <div className="lib-header-content">
          <h1>Biblioteca Digital</h1>
          <p>Consulta, reserva y gestiona tus préstamos académicos</p>
          
          <nav className="lib-tabs">
            <button className={`lib-tab-btn ${activeTab === "catalogo" ? "active" : ""}`} onClick={() => setActiveTab("catalogo")}>
              <BookOpen size={18} /> Catálogo
            </button>
            <button className={`lib-tab-btn ${activeTab === "favoritos" ? "active" : ""}`} onClick={() => setActiveTab("favoritos")}>
              <Heart size={18} /> Favoritos
            </button>
            <button className={`lib-tab-btn ${activeTab === "reservas" ? "active" : ""}`} onClick={() => setActiveTab("reservas")}>
              <Bookmark size={18} /> Mis Reservas
            </button>
          </nav>
        </div>
      </header>

      {/* BARRA DE FILTROS REPARADA */}
      <div className="lib-filters-bar">
        <div className="search-box">
          <Search size={18} className="search-icon"/>
          <input 
            type="text" 
            placeholder="Buscar por título, autor..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </div>
        
        <div className="filters-row">
          <div className="filter-select-wrapper">
            <Filter size={16} className="filter-icon" />
            <select value={filterDegree} onChange={(e) => setFilterDegree(e.target.value)}>
              <option value="">Todos los grados</option>
              {uniqueDegrees.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {/* Flecha manual para indicar dropdown */}
            <ChevronDown size={14} className="select-arrow" />
          </div>
          
          <div className="filter-select-wrapper">
            <LibraryIcon size={16} className="filter-icon" />
            <select value={filterMaterial} onChange={(e) => setFilterMaterial(e.target.value)}>
              <option value="">Todas las temáticas</option>
              {uniqueMaterials.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {/* Flecha manual para indicar dropdown */}
            <ChevronDown size={14} className="select-arrow" />
          </div>
        </div>
      </div>

      {/* GRID DE LIBROS */}
      <main className="books-grid">
        {displayedBooks.map(book => {
          const isMyRes = userReservations.includes(book.id);
          const isTaken = !book.disponible && !isMyRes;
          // Determinamos qué icono usar
          const CustomIcon = book.categoria === "Salud" ? IconHealth : IconTech;
          
          return (
            <div 
              key={book.id} 
              className={`book-card ${isTaken ? "is-taken" : ""} ${isMyRes ? "is-mine" : ""}`} 
              onClick={() => setSelectedBook(book)}
            >
              {/* CABECERA VISUAL CON TUS ICONOS */}
              <div className={`book-visual ${book.categoria === "Salud" ? "visual-health" : "visual-tech"}`}>
                <img src={CustomIcon} alt={book.categoria} className="custom-book-icon" />
                <span className="visual-degree">{book.titulacion}</span>
                
                {isTaken && <div className="status-badge occupied">OCUPADO</div>}
                {isMyRes && <div className="status-badge mine">TUYO</div>}
              </div>

              <div className="book-body">
                <div className="book-status-row">
                  <span className={`status-dot ${book.disponible ? "online" : "offline"}`}></span>
                  <span className="status-text">
                    {isMyRes ? "Reservado por ti" : (book.disponible ? "Disponible" : "Prestado")}
                  </span>
                </div>

                <h3 className="book-title">{book.titulo}</h3>
                <p className="book-author">de {book.autor}</p>
                
                <div className="book-tags">
                   {book.materias?.slice(0,2).map(m => <span key={m} className="tag-pill">{m}</span>)}
                </div>

                <div className="book-actions" onClick={e => e.stopPropagation()}>
                  <button 
                    className={`action-btn fav-btn ${userFavorites.includes(book.id) ? "active" : ""}`} 
                    onClick={(e) => toggleFavorite(e, book.id)}
                    title="Añadir a favoritos"
                  >
                    <Heart size={20} fill={userFavorites.includes(book.id) ? "#F1595C" : "none"} />
                  </button>
                  
                  <button 
                    className={`action-btn res-btn ${isMyRes ? "cancel" : "reserve"}`} 
                    disabled={isTaken} 
                    onClick={(e) => handleReservation(e, book)}
                  >
                    {isMyRes ? "Devolver" : (isTaken ? "No disponible" : "Reservar")}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* MODAL DETALLE */}
      {selectedBook && (
        <div className="modal-overlay" onClick={() => setSelectedBook(null)}>
          <div className="modal-book-content" onClick={e => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setSelectedBook(null)}>
              <X size={24} />
            </button>
            
            <div className={`modal-visual-side ${selectedBook.categoria === "Salud" ? "visual-health" : "visual-tech"}`}>
               {/* Usamos el icono también en el modal */}
               <img 
                 src={selectedBook.categoria === "Salud" ? IconHealth : IconTech} 
                 alt="Category Icon" 
                 className="modal-icon-large"
               />
            </div>
            
            <div className="modal-info-side">
              <span className="modal-degree">{selectedBook.titulacion}</span>
              <h2>{selectedBook.titulo}</h2>
              
              <div className="modal-meta-grid">
                <div className="meta-item"><span>Autor</span><p>{selectedBook.autor}</p></div>
                <div className="meta-item"><span>Editorial</span><p>{selectedBook.editorial}</p></div>
                <div className="meta-item"><span>ISBN</span><p>{selectedBook.isbn}</p></div>
                <div className="meta-item"><span>Año</span><p>{selectedBook.año}</p></div>
              </div>

              <div className="modal-synopsis">
                <h4><Info size={18}/> Resumen</h4>
                <p>{selectedBook.resumen || "No hay resumen disponible para este libro."}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;