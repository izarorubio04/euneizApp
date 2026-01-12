import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import { db } from "../../firebase/config";
import { 
  collection, 
  onSnapshot, 
  query, 
  doc, 
  updateDoc, 
  deleteDoc, 
  where,
  addDoc,
  setDoc,
  orderBy
} from "firebase/firestore";
import "./Library.css";

// ICONOS
import { 
  Search, Filter, BookOpen, Heart, Bookmark, X, Info,
  Library as LibraryIcon, ChevronDown, QrCode, CheckCircle, User, Clock
} from "lucide-react";

// ICONOS PERSONALIZADOS
import IconTech from "../../assets/icon-tech.svg"; 
import IconHealth from "../../assets/icon-health.svg";

// CONFIGURACIÓN ADMIN
const ADMIN_EMAILS = ["admin@euneiz.com", "secretaria@euneiz.com"];

export const Library = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);
  
  // --- ESTADOS ---
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Tabs
  const [activeTab, setActiveTab] = useState(isAdmin ? "gestion" : "catalogo");
  
  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDegree, setFilterDegree] = useState("");
  const [filterMaterial, setFilterMaterial] = useState("");
  const [adminSearch, setAdminSearch] = useState("");
  
  const [selectedBook, setSelectedBook] = useState(null);
  const [userFavorites, setUserFavorites] = useState([]);
  
  // Reservas
  const [myReservations, setMyReservations] = useState([]); 
  const [allActiveReservations, setAllActiveReservations] = useState([]); 

  // --- EFECTOS ---
  useEffect(() => {
    if (location.state && location.state.view && !isAdmin) {
      setActiveTab(location.state.view);
    }
  }, [location, isAdmin]);

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

    let unsubRes;
    
    if (isAdmin) {
      const qAdmin = query(collection(db, "reservas_libros"));
      unsubRes = onSnapshot(qAdmin, (snapshot) => {
        setAllActiveReservations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    } else {
      const qUser = query(collection(db, "reservas_libros"), where("userEmail", "==", user.email));
      unsubRes = onSnapshot(qUser, (snapshot) => {
        setMyReservations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }

    return () => { unsubFavs(); if(unsubRes) unsubRes(); };
  }, [user, isAdmin]);

  // --- HELPERS & ACCIONES ---
  const generateCode = () => {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LIB-${random}`;
  };

  const getBookDetails = (bookId) => allBooks.find(b => b.id === bookId) || {};

  const toggleFavorite = async (e, bookId) => {
    e.stopPropagation();
    const favId = `${user.email}_${bookId}`;
    if (userFavorites.includes(bookId)) {
      await deleteDoc(doc(db, "favoritos_libros", favId));
    } else {
      await setDoc(doc(db, "favoritos_libros", favId), { userEmail: user.email, bookId });
    }
  };

  const handleReserve = async (e, book) => {
    e.stopPropagation();
    const existingRes = myReservations.find(r => r.bookId === book.id);

    if (existingRes) {
      if (existingRes.status === 'active') {
        alert("Ya tienes este libro. Devuélvelo en secretaría para finalizar.");
        return;
      }
      if (window.confirm("¿Cancelar reserva?")) {
        await deleteDoc(doc(db, "reservas_libros", existingRes.id));
        await updateDoc(doc(db, "libros", book.id), { disponible: true });
      }
    } else {
      if (!book.disponible) return alert("Libro no disponible.");
      
      // --- LÓGICA DE FECHA LÍMITE (NUEVO) ---
      const today = new Date();
      const due = new Date(today);
      due.setDate(due.getDate() + 7); // Sumamos 7 días
      
      const dueDateString = due.toLocaleDateString('es-ES', {
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric'
      });

      const code = generateCode();

      await addDoc(collection(db, "reservas_libros"), {
        userEmail: user.email,
        bookId: book.id,
        bookTitle: book.titulo,
        fecha: Date.now(),
        dueDate: dueDateString, // <--- Guardamos la fecha límite
        status: 'reserved',
        code: code
      });
      await updateDoc(doc(db, "libros", book.id), { disponible: false });
      alert(`¡Reserva realizada! Tu código es: ${code}. Recógelo en secretaría.`);
    }
  };

  // Acciones Admin
  const handleDeliverBook = async (resId) => {
    if(window.confirm("¿Confirmar entrega del libro al alumno?")) {
      await updateDoc(doc(db, "reservas_libros", resId), { status: 'active' });
    }
  };

  const handleReturnBook = async (reservation) => {
    if(window.confirm("¿Confirmar devolución? El libro volverá a estar disponible.")) {
      await deleteDoc(doc(db, "reservas_libros", reservation.id));
      await updateDoc(doc(db, "libros", reservation.bookId), { disponible: true });
    }
  };

  // Filtros
  const uniqueDegrees = useMemo(() => [...new Set(allBooks.map(b => b.titulacion).filter(Boolean))].sort(), [allBooks]);
  const uniqueMaterials = useMemo(() => [...new Set(allBooks.flatMap(b => b.materias || []).filter(Boolean))].sort(), [allBooks]);

  const displayedBooks = useMemo(() => {
    let base = allBooks;
    if (activeTab === "favoritos") base = allBooks.filter(b => userFavorites.includes(b.id));
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      base = base.filter(b => b.titulo?.toLowerCase().includes(q) || b.autor?.toLowerCase().includes(q));
    }
    if (filterDegree) base = base.filter(b => b.titulacion === filterDegree);
    if (filterMaterial) base = base.filter(b => b.materias?.includes(filterMaterial));
    return base;
  }, [allBooks, activeTab, userFavorites, searchQuery, filterDegree, filterMaterial]);

  const filteredReservationsAdmin = allActiveReservations.filter(r => 
    r.userEmail.toLowerCase().includes(adminSearch.toLowerCase()) ||
    r.bookTitle?.toLowerCase().includes(adminSearch.toLowerCase()) ||
    r.code?.toLowerCase().includes(adminSearch.toLowerCase())
  );

  if (loading) return <div className="lib-loading">Sincronizando biblioteca...</div>;

  return (
    <div className="library-container">
      
      {/* HEADER */}
      <header className="lib-header">
        <div className="lib-header-content">
          <h1>{isAdmin ? "Gestión Biblioteca" : "Biblioteca Digital"}</h1>
          <p>{isAdmin ? "Panel de control de préstamos." : "Consulta, reserva y gestiona tus libros."}</p>
          
          <nav className="lib-tabs">
            {!isAdmin && (
              <>
                <button className={`lib-tab-btn ${activeTab === "catalogo" ? "active" : ""}`} onClick={() => setActiveTab("catalogo")}>
                  <BookOpen size={18} /> Catálogo
                </button>
                <button className={`lib-tab-btn ${activeTab === "favoritos" ? "active" : ""}`} onClick={() => setActiveTab("favoritos")}>
                  <Heart size={18} /> Favoritos
                </button>
                <button className={`lib-tab-btn ${activeTab === "reservas" ? "active" : ""}`} onClick={() => setActiveTab("reservas")}>
                  <Bookmark size={18} /> Mis Reservas
                </button>
              </>
            )}
            {isAdmin && (
              <button className={`lib-tab-btn active`}>
                <BookOpen size={18} /> Gestión Préstamos
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* --- CONTENIDO --- */}
      {isAdmin ? (
        <div className="admin-lib-panel">
          <div className="admin-controls">
             <div className="search-box-admin">
                <Search size={18}/>
                <input 
                  placeholder="Buscar por alumno, libro o código..." 
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                />
             </div>
          </div>
          
          <div className="admin-table-container">
            <table className="rooms-admin-table">
              <thead>
                <tr>
                  <th>Libro</th>
                  <th>Alumno</th>
                  <th>Código</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservationsAdmin.length === 0 ? (
                  <tr><td colSpan="5" style={{textAlign:'center', padding:'2rem'}}>No hay reservas activas.</td></tr>
                ) : (
                  filteredReservationsAdmin.map(res => (
                    <tr key={res.id}>
                      <td className="font-bold">{res.bookTitle || "Libro desconocido"}</td>
                      <td className="text-small"><User size={14} style={{marginBottom:-2, marginRight:4}}/>{res.userEmail.split('@')[0]}</td>
                      <td className="font-mono">{res.code}</td>
                      <td>
                        {res.status === 'reserved' && <span className="status-pill pending">🟡 Recogida</span>}
                        {res.status === 'active' && <span className="status-pill active">🟢 Prestado</span>}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {res.status === 'reserved' && (
                            <button className="btn-admin-action give" onClick={() => handleDeliverBook(res.id)}>Entregar</button>
                          )}
                          {res.status === 'active' && (
                            <button className="btn-admin-action return" onClick={() => handleReturnBook(res)}>Devolución</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'reservas' ? (
             /* === DISEÑO MEJORADO DE TARJETA DE RESERVA === */
             <div className="my-res-container">
               {myReservations.length === 0 ? (
                 <div className="empty-state">No tienes reservas activas.</div>
               ) : (
                 <div className="res-tickets-grid">
                   {myReservations.map(res => {
                       const book = getBookDetails(res.bookId);
                       return (
                         <div key={res.id} className="res-ticket-clean">
                           <div className="ticket-header-clean">
                             <h4 className="ticket-title-clean" title={book.titulo || res.bookTitle}>
                               {book.titulo || res.bookTitle}
                             </h4>
                             {res.status === 'reserved' && (
                               <button className="btn-cancel-clean" onClick={(e) => handleReserve(e, book)} title="Cancelar reserva">
                                 <X size={18}/>
                               </button>
                             )}
                           </div>
                           
                           <p className="ticket-author-clean">{book.autor}</p>

                           <div className="ticket-body-clean">
                             <div className="code-box-clean">
                               <span className="code-label-clean">CÓDIGO DE RECOGIDA</span>
                               <span className="code-value-clean">{res.code}</span>
                             </div>

                             {/* --- NUEVO INDICADOR DE FECHA LÍMITE --- */}
                             <div className="due-date-indicator">
                               <Clock size={16} className="icon" />
                               <span>Devolver antes del: <strong>{res.dueDate || "Consultar"}</strong></span>
                             </div>

                           </div>

                           <div className="ticket-footer-clean">
                             {res.status === 'reserved' ? (
                               <span className="status-text-pending">🟡 Pendiente de recoger en secretaría</span>
                             ) : (
                               <span className="status-text-active">🟢 En tu poder (Devolver a tiempo)</span>
                             )}
                           </div>
                         </div>
                       );
                    })}
                  </div>
                )}
             </div>
          ) : (
             /* PESTAÑA CATÁLOGO */
             <>
                <div className="lib-filters-bar">
                  <div className="search-box">
                    <Search size={18} className="search-icon"/>
                    <input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <div className="filters-row">
                    <div className="filter-select-wrapper">
                      <select value={filterDegree} onChange={(e) => setFilterDegree(e.target.value)}>
                        <option value="">Grados</option>
                        {uniqueDegrees.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div className="filter-select-wrapper">
                      <select value={filterMaterial} onChange={(e) => setFilterMaterial(e.target.value)}>
                        <option value="">Temáticas</option>
                        {uniqueMaterials.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <main className="books-grid">
                  {displayedBooks.map(book => {
                    const myRes = myReservations.find(r => r.bookId === book.id);
                    const isTaken = !book.disponible && !myRes;
                    const CustomIcon = book.categoria === "Salud" ? IconHealth : IconTech;
                    
                    return (
                      <div key={book.id} className={`book-card ${isTaken ? "is-taken" : ""} ${myRes ? "is-mine" : ""}`} onClick={() => setSelectedBook(book)}>
                        <div className={`book-visual ${book.categoria === "Salud" ? "visual-health" : "visual-tech"}`}>
                          <img src={CustomIcon} alt={book.categoria} className="custom-book-icon" />
                          <span className="visual-degree">{book.titulacion}</span>
                          {isTaken && <div className="status-badge occupied">OCUPADO</div>}
                          {myRes && <div className="status-badge mine">TUYO</div>}
                        </div>
                        <div className="book-body">
                          <div className="book-status-row">
                            <span className={`status-dot ${book.disponible ? "online" : "offline"}`}></span>
                            <span className="status-text">
                              {myRes ? (myRes.status === 'active' ? "En préstamo" : "Reservado") : (book.disponible ? "Disponible" : "Prestado")}
                            </span>
                          </div>
                          <h3 className="book-title">{book.titulo}</h3>
                          <p className="book-author">{book.autor}</p>
                          <div className="book-actions" onClick={e => e.stopPropagation()}>
                            <button className={`action-btn fav-btn ${userFavorites.includes(book.id) ? "active" : ""}`} onClick={(e) => toggleFavorite(e, book.id)}>
                              <Heart size={20} fill={userFavorites.includes(book.id) ? "#F1595C" : "none"} />
                            </button>
                            <button className={`action-btn res-btn ${myRes ? "cancel" : "reserve"}`} disabled={isTaken} onClick={(e) => handleReserve(e, book)}>
                              {myRes ? (myRes.status === 'active' ? "Tuyo" : "Cancelar") : (isTaken ? "Ocupado" : "Reservar")}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </main>
             </>
          )}
        </>
      )}

      {/* MODAL */}
      {selectedBook && (
        <div className="modal-overlay" onClick={() => setSelectedBook(null)}>
          <div className="modal-book-content" onClick={e => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setSelectedBook(null)}><X size={24} /></button>
            <div className={`modal-visual-side ${selectedBook.categoria === "Salud" ? "visual-health" : "visual-tech"}`}>
               <img src={selectedBook.categoria === "Salud" ? IconHealth : IconTech} className="modal-icon-large" alt="icon"/>
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
                <p>{selectedBook.resumen || "No hay resumen."}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Library;