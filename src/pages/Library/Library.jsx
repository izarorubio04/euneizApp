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
  setDoc,
  addDoc
} from "firebase/firestore";
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
  const [userFavorites, setUserFavorites] = useState([]);
  const [userReservations, setUserReservations] = useState([]);

  // --- 1. CARGA EN TIEMPO REAL (FIREBASE) ---
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

  // --- 2. RECUPERACIÓN DE FILTROS DINÁMICOS ---
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

  // --- 3. ACCIONES DE FIREBASE ---
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

  // --- 4. MIGRACIÓN COMPLETA (SUBE TODO EL CONTENIDO DEL CSV) ---

  const migrateCSVToFirebase = async () => {
    if (!window.confirm("¿Migrar todos los libros? Se recomienda borrar la colección antes si ya lo hiciste.")) return;
    setLoading(true);
    
    try {
      const [resSalud, resTech] = await Promise.all([
        fetch("/data/salud.csv"),
        fetch("/data/tecnologias.csv")
      ]);
      const textSalud = await resSalud.text();
      const textTech = await resTech.text();

      const parseAndBatch = async (text, category) => {
        const rows = text.split("\n").filter(l => l.trim() !== "").slice(1);
        
        // Firestore permite grupos de 500 operaciones por batch
        let batch = writeBatch(db);
        let count = 0;

        for (const line of rows) {
          const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
          if (values.length < 2) continue;

          const newBookRef = doc(collection(db, "libros")); // Crea una referencia con ID automático
          
          batch.set(newBookRef, {
            titulo: values[0]?.replace(/"/g, "").trim() || "Sin título",
            autor: values[1]?.replace(/"/g, "").trim() || "Anónimo",
            editorial: values[2]?.replace(/"/g, "").trim() || "",
            edicion: values[3]?.replace(/"/g, "").trim() || "",
            año: values[4]?.replace(/"/g, "").trim() || "",
            isbn: values[5]?.replace(/"/g, "").trim() || "",
            titulacion: values[6]?.replace(/"/g, "").trim() || category,
            materias: values[7]?.replace(/"/g, "").split(";").map(s => s.trim()).filter(Boolean),
            resumen: values[9]?.replace(/"/g, "").trim() || "",
            categoria: category,
            disponible: true
          });

          count++;

          // Si llegamos a 450, enviamos el lote y empezamos uno nuevo (por seguridad)
          if (count >= 450) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
          }
        }
        // Enviar el resto
        if (count > 0) await batch.commit();
      };

      await parseAndBatch(textSalud, "Salud");
      await parseAndBatch(textTech, "Tecnología");

      alert("¡Éxito! Catálogo completo subido sin errores.");
    } catch (err) {
      console.error(err);
      alert("Error al migrar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="library-main"><h3>Sincronizando biblioteca EUNEIZ...</h3></div>;

  return (
    <div className="library-main">
      <header className="lib-dashboard-header">
        <div className="lib-header-top">
          <h1>Biblioteca Digital</h1>
          <nav className="lib-nav-horizontal">
            <button className={`lib-tab ${activeTab === "catalogo" ? "active" : ""}`} onClick={() => setActiveTab("catalogo")}>📚 Catálogo ({allBooks.length})</button>
            <button className={`lib-tab ${activeTab === "favoritos" ? "active" : ""}`} onClick={() => setActiveTab("favoritos")}>❤️ Favoritos ({userFavorites.length})</button>
            <button className={`lib-tab ${activeTab === "reservas" ? "active" : ""}`} onClick={() => setActiveTab("reservas")}>🔖 Reservas ({userReservations.length})</button>
          </nav>
        </div>

        {/* --- RECUPERACIÓN DE LA CUADRÍCULA DE FILTROS --- */}
        <div className="filters-grid">
          <div className="filter-group">
            <label>Buscador (Título, Autor, ISBN)</label>
            <input type="text" className="lib-input" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="filter-group">
            <label>Grado / Titulación</label>
            <select className="lib-input" value={filterDegree} onChange={(e) => setFilterDegree(e.target.value)}>
              <option value="">Todos los grados</option>
              {uniqueDegrees.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Temática</label>
            <select className="lib-input" value={filterMaterial} onChange={(e) => setFilterMaterial(e.target.value)}>
              <option value="">Todas las temáticas</option>
              {uniqueMaterials.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        
        {allBooks.length < 5 && (
          <button onClick={migrateCSVToFirebase} className="btn-lib" style={{marginTop: '1rem', background: '#003049', color: 'white'}}>
            🚀 Importar Catálogo desde CSV
          </button>
        )}
      </header>

      <main className="books-display-grid">
        {displayedBooks.map(book => {
          const isMyRes = userReservations.includes(book.id);
          const isTaken = !book.disponible && !isMyRes;
          return (
            <div key={book.id} className={`card-book ${isTaken ? "is-taken" : ""} ${isMyRes ? "is-mine" : ""}`} onClick={() => setSelectedBook(book)}>
              <div className={`card-visual ${book.categoria === "Salud" ? "bg-area-salud" : "bg-area-tech"}`}>
                <span className="visual-icon">{book.categoria === "Salud" ? "🩺" : "💻"}</span>
                <span className="visual-degree">{book.titulacion}</span>
                {isTaken && <div className="badge-status-overlay">OCUPADO</div>}
                {isMyRes && <div className="badge-status-overlay mine">TUYO</div>}
              </div>
              <div className="card-body">
                <div className="card-status">
                  <span className={`dot-indicator ${book.disponible ? "dot-online" : "dot-offline"}`}></span>
                  <span style={{color: book.disponible ? '#10b981' : '#ef4444', fontWeight:'700'}}>
                    {isMyRes ? "Reservado por ti" : (book.disponible ? "Disponible" : "En préstamo")}
                  </span>
                </div>
                <h3>{book.titulo}</h3>
                <p className="card-author">de {book.autor}</p>
                <div className="tag-box">
                   {book.materias?.slice(0,2).map(m => <span key={m} className="mini-tag">{m}</span>)}
                </div>
                <div className="card-actions-row" onClick={e => e.stopPropagation()}>
                  <button className={`btn-lib btn-lib-fav ${userFavorites.includes(book.id) ? "active" : ""}`} onClick={(e) => toggleFavorite(e, book.id)}>
                    {userFavorites.includes(book.id) ? "❤️" : "🤍"}
                  </button>
                  <button className={`btn-lib btn-lib-res ${isMyRes ? "active" : ""}`} disabled={isTaken} onClick={(e) => handleReservation(e, book)}>
                    {isMyRes ? "Anular" : (isTaken ? "Ocupado" : "Reservar")}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      {/* --- MODAL DETALLE --- */}
      {selectedBook && (
        <div className="overlay-modal" onClick={() => setSelectedBook(null)}>
          <div className="popup-ficha" onClick={e => e.stopPropagation()}>
            <button className="btn-close-popup" onClick={() => setSelectedBook(null)}>✕</button>
            <div className={`popup-visual-side ${selectedBook.categoria === "Salud" ? "bg-area-salud" : "bg-area-tech"}`}>
               <span className="big-icon">{selectedBook.categoria === "Salud" ? "🩺" : "💻"}</span>
            </div>
            <div className="popup-content-side">
              <span className="popup-degree-label">{selectedBook.titulacion}</span>
              <h2>{selectedBook.titulo}</h2>
              <div className="popup-full-meta">
                <div className="meta-block"><span>Autor</span><p>{selectedBook.autor}</p></div>
                <div className="meta-block"><span>Editorial</span><p>{selectedBook.editorial}</p></div>
                <div className="meta-block"><span>ISBN</span><p>{selectedBook.isbn}</p></div>
                <div className="meta-block"><span>Año</span><p>{selectedBook.año}</p></div>
              </div>
              <div className="popup-synopsis">
                <h4>Resumen</h4>
                <p>{selectedBook.resumen || "No hay resumen disponible."}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;