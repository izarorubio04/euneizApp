import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import "./Library.css";

// FIREBASE IMPORTS
import { db } from "../../firebase/config";
import { 
  collection, onSnapshot, query, doc, updateDoc, deleteDoc, 
  where, addDoc, setDoc
} from "firebase/firestore";

// UI & ASSETS
import PageHeader from "../../components/UI/PageHeader";
import IconTech from "../../assets/icon-tech.svg"; 
import IconHealth from "../../assets/icon-health.svg";
import { 
  Search, Filter, BookOpen, Heart, Bookmark, X, Info,
  ChevronDown, User, Clock
} from "lucide-react";


export const Library = () => {
  // Pillo el usuario y el rol del contexto (así sé si mostrar la vista de profe/admin o la de alumno)
  const { user, isAdmin } = useAuth();
  const location = useLocation(); // Esto es para leer si me pasan datos al navegar aquí
  
  // --- ESTADOS DE DATOS ---
  const [allBooks, setAllBooks] = useState([]); // Aquí guardaré todos los libros que bajen de Firebase
  const [loading, setLoading] = useState(true); // Para mostrar el mensajito de "Cargando..." y que no se vea feo
  
  // Tabs: Si soy admin me interesa gestionar, si soy alumno quiero ver el catálogo
  const [activeTab, setActiveTab] = useState(isAdmin ? "gestion" : "catalogo");
  
  // --- ESTADOS DE FILTROS ---
  // Estos controlan los inputs de búsqueda y los desplegables
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDegree, setFilterDegree] = useState("");
  const [filterMaterial, setFilterMaterial] = useState("");
  const [adminSearch, setAdminSearch] = useState(""); // El buscador específico para cuando estoy en modo Dios (admin)
  
  // --- ESTADOS DE INTERACCIÓN ---
  const [selectedBook, setSelectedBook] = useState(null); // Si esto tiene algo, se abre el modal
  const [userFavorites, setUserFavorites] = useState([]); // Lista de IDs de los libros que me gustan
  const [myReservations, setMyReservations] = useState([]); // Mis reservas activas
  const [allActiveReservations, setAllActiveReservations] = useState([]); // (Admin) Todas las reservas de todo el mundo

  // 1. EFECTO: Redirección inicial
  // Si vengo desde la Home clicando en "Mis Préstamos", este efecto me cambia la pestaña sola.
  useEffect(() => {
    if (location.state && location.state.view && !isAdmin) {
      setActiveTab(location.state.view);
    }
  }, [location, isAdmin]);

  // 2. EFECTO: Carga de Libros (Tiempo Real)
  // IMPORTANTE: Uso onSnapshot en vez de getDocs. 
  // Así, si el admin marca un libro como "Ocupado", se me actualiza al instante sin recargar la página. Magia.
  useEffect(() => {
    const q = query(collection(db, "libros"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Mapeo los documentos para sacarles el ID y la data limpia
      setAllBooks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false); // Ya tenemos datos, quitamos el loader
    });
    return () => unsubscribe(); // Importante: limpiar el listener al salir para no dejar procesos zombis
  }, []);

  // 3. EFECTO: Datos del Usuario (Favoritos y Reservas)
  // Aquí cargo lo personal del usuario. Si no hay usuario logueado, no hago nada.
  useEffect(() => {
    if (!user) return;

    // A. Cargar mis favoritos (filtro por mi email)
    const qFavs = query(collection(db, "favoritos_libros"), where("userEmail", "==", user.email));
    const unsubFavs = onSnapshot(qFavs, (s) => setUserFavorites(s.docs.map(d => d.data().bookId)));

    // B. Cargar Reservas (Lógica diferente según quién sea)
    let unsubRes;
    
    if (isAdmin) {
      // Si soy admin, quiero ver TODO lo que pasa
      const qAdmin = query(collection(db, "reservas_libros"));
      unsubRes = onSnapshot(qAdmin, (snapshot) => {
        setAllActiveReservations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    } else {
      // Si soy alumno, solo quiero ver MIS cosas
      const qUser = query(collection(db, "reservas_libros"), where("userEmail", "==", user.email));
      unsubRes = onSnapshot(qUser, (snapshot) => {
        setMyReservations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    }

    // Limpieza de suscripciones al desmontar
    return () => { unsubFavs(); if(unsubRes) unsubRes(); };
  }, [user, isAdmin]);

  // --- HELPERS (Funciones auxiliares) ---
  
  // Genera un código tipo LIB-X9Z1 para que parezca profesional
  const generateCode = () => {
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LIB-${random}`;
  };

  // Busco el libro completo usando su ID (útil para las tarjetas de reserva)
  const getBookDetails = (bookId) => allBooks.find(b => b.id === bookId) || {};

  // --- HANDLERS (Manejadores de clicks) ---

  // Dar o quitar like
  const toggleFavorite = async (e, bookId) => {
    e.stopPropagation(); // Esto evita que se abra el modal del libro cuando solo quiero dar like
    const favId = `${user.email}_${bookId}`; // Me invento un ID único combinando email y libro
    
    if (userFavorites.includes(bookId)) {
      await deleteDoc(doc(db, "favoritos_libros", favId));
    } else {
      await setDoc(doc(db, "favoritos_libros", favId), { userEmail: user.email, bookId });
    }
  };

  // La lógica gorda: RESERVAR
  const handleReserve = async (e, book) => {
    e.stopPropagation();
    
    // Miro si ya tengo una reserva de ESTE libro
    const existingRes = myReservations.find(r => r.bookId === book.id);

    if (existingRes) {
      // Caso 1: Ya lo tengo reservado/prestado
      if (existingRes.status === 'active') {
        alert("Ya tienes este libro en casa. Debes devolverlo en secretaría.");
        return; // No dejo cancelar si ya se lo ha llevado
      }
      // Si solo está reservado (no recogido), dejo cancelar
      if (window.confirm("¿Quieres cancelar esta reserva y liberar el libro?")) {
        await deleteDoc(doc(db, "reservas_libros", existingRes.id));
        await updateDoc(doc(db, "libros", book.id), { disponible: true }); // Vuelve a estar libre para otros
      }
    } else {
      // Caso 2: Nueva Reserva
      if (!book.disponible) return alert("Ups, alguien ha sido más rápido. Libro no disponible.");
      
      // Calculo la fecha de devolución (hoy + 7 días)
      const today = new Date();
      const due = new Date(today);
      due.setDate(due.getDate() + 7);
      
      const dueDateString = due.toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });

      const code = generateCode();

      // Guardo la reserva...
      await addDoc(collection(db, "reservas_libros"), {
        userEmail: user.email,
        bookId: book.id,
        bookTitle: book.titulo,
        fecha: Date.now(),
        dueDate: dueDateString, 
        status: 'reserved', // 'reserved' = esperando recogida, 'active' = alumno lo tiene
        code: code
      });
      
      // ...y bloqueo el libro
      await updateDoc(doc(db, "libros", book.id), { disponible: false });
      alert(`¡Reserva realizada! Tu código es: ${code}.`);
    }
  };

  // --- LÓGICA DE FILTRADO (Optimizada) ---
  // Uso useMemo para que React no recalcule esto cada vez que escribo una letra en el buscador.
  // Saco listas únicas de grados y materias para rellenar los selects.
  const uniqueDegrees = useMemo(() => [...new Set(allBooks.map(b => b.titulacion).filter(Boolean))].sort(), [allBooks]);
  const uniqueMaterials = useMemo(() => [...new Set(allBooks.flatMap(b => b.materias || []).filter(Boolean))].sort(), [allBooks]);

  // Aquí aplico todos los filtros en cadena (Tab -> Texto -> Grado -> Materia)
  const displayedBooks = useMemo(() => {
    let base = allBooks;
    
    // Si estoy en la pestaña favoritos, filtro primero
    if (activeTab === "favoritos") base = allBooks.filter(b => userFavorites.includes(b.id));
    
    // Filtro por texto (título o autor)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      base = base.filter(b => b.titulo?.toLowerCase().includes(q) || b.autor?.toLowerCase().includes(q));
    }
    // Filtros de los selects
    if (filterDegree) base = base.filter(b => b.titulacion === filterDegree);
    if (filterMaterial) base = base.filter(b => b.materias?.includes(filterMaterial));
    
    return base;
  }, [allBooks, activeTab, userFavorites, searchQuery, filterDegree, filterMaterial]);

  // Filtro para la tabla de Admin
  const filteredReservationsAdmin = allActiveReservations.filter(r => 
    r.userEmail.toLowerCase().includes(adminSearch.toLowerCase()) ||
    r.bookTitle?.toLowerCase().includes(adminSearch.toLowerCase()) ||
    r.code?.toLowerCase().includes(adminSearch.toLowerCase())
  );

  // --- ACCIONES DE ADMIN ---
  
  // Confirmar que le doy el libro al alumno
  const handleDeliverBook = async (resId) => {
    if(window.confirm("¿Confirmar entrega del libro al alumno?")) {
      await updateDoc(doc(db, "reservas_libros", resId), { status: 'active' });
    }
  };

  // Confirmar que el alumno devuelve el libro
  const handleReturnBook = async (reservation) => {
    if(window.confirm("¿Confirmar devolución? El libro volverá a estar disponible.")) {
      // Borro la reserva del historial (o podría moverla a una colección 'historial', pero aquí borro)
      await deleteDoc(doc(db, "reservas_libros", reservation.id));
      // Libero el libro
      await updateDoc(doc(db, "libros", reservation.bookId), { disponible: true });
    }
  };

  if (loading) return <div className="lib-loading">Sincronizando biblioteca...</div>;

  return (
    <div className="library-container">
      
      {/* Header que cambia el subtítulo según si eres el jefe o un alumno */}
      <PageHeader 
        title={isAdmin ? "Gestión Biblioteca" : "Biblioteca Digital"} 
        subtitle={isAdmin ? "Panel de control de préstamos." : "Consulta, reserva y gestiona tus libros."}
      />

      {/* Navegación por pestañas */}
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
        {/* El admin solo ve su pestaña de gestión */}
        {isAdmin && (
          <button className={`lib-tab-btn active`}>
            <BookOpen size={18} /> Gestión Préstamos
          </button>
        )}
      </nav>

      {/* --- VISTA DE ADMINISTRADOR --- */}
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
                        {/* Renderizado condicional de los estados con los puntitos de color */}
                        {res.status === 'reserved' && (
                          <span className="status-pill pending">
                            <span className="dot-solid pending"></span> Recogida
                          </span>
                        )}
                        {res.status === 'active' && (
                          <span className="status-pill active">
                            <span className="dot-solid active"></span> Prestado
                          </span>
                        )}
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
        /* --- VISTA DE ALUMNO --- */
        <>
          {activeTab === 'reservas' ? (
             /* PESTAÑA: MIS RESERVAS */
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
                             {/* Solo permito cancelar si aún no lo ha recogido */}
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
                             
                             <div className="due-date-indicator">
                               <Clock size={16} className="icon" />
                               <span>Devolver antes del: <strong>{res.dueDate || "Consultar"}</strong></span>
                             </div>
                           </div>

                           <div className="ticket-footer-clean">
                             {/* Estados visuales para el alumno */}
                             {res.status === 'reserved' ? (
                               <span className="status-text-pending">
                                 <span className="dot-solid pending"></span> Pendiente de recoger en secretaría
                               </span>
                             ) : (
                               <span className="status-text-active">
                                 <span className="dot-solid active"></span> En tu poder (Devolver a tiempo)
                               </span>
                             )}
                           </div>
                         </div>
                       );
                    })}
                  </div>
                )}
             </div>
          ) : (
             /* PESTAÑA: CATÁLOGO DE LIBROS */
             <>
                {/* Barra de filtros (Buscador + Selects) */}
                <div className="lib-filters-bar">
                  <div className="search-box">
                    <Search size={18} className="search-icon"/>
                    <input type="text" placeholder="Buscar libros..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <div className="filters-row">
                    <div className="filter-select-wrapper">
                      <Filter size={16} className="filter-icon"/>
                      <select value={filterDegree} onChange={(e) => setFilterDegree(e.target.value)}>
                        <option value="">Todos los Grados</option>
                        {uniqueDegrees.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <ChevronDown size={14} className="select-arrow"/>
                    </div>
                    <div className="filter-select-wrapper">
                      <Filter size={16} className="filter-icon"/>
                      <select value={filterMaterial} onChange={(e) => setFilterMaterial(e.target.value)}>
                        <option value="">Todas las Materias</option>
                        {uniqueMaterials.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <ChevronDown size={14} className="select-arrow"/>
                    </div>
                  </div>
                </div>

                {/* Grid con las tarjetas de libros */}
                <main className="books-grid">
                  {displayedBooks.map(book => {
                    const myRes = myReservations.find(r => r.bookId === book.id);
                    // Está ocupado si no está disponible Y no soy yo quien lo tiene
                    const isTaken = !book.disponible && !myRes;
                    const CustomIcon = book.categoria === "Salud" ? IconHealth : IconTech;
                    
                    return (
                      <div key={book.id} className={`book-card ${isTaken ? "is-taken" : ""} ${myRes ? "is-mine" : ""}`} onClick={() => setSelectedBook(book)}>
                        <div className={`book-visual ${book.categoria === "Salud" ? "visual-health" : "visual-tech"}`}>
                          <img src={CustomIcon} alt={book.categoria} className="custom-book-icon" />
                          <span className="visual-degree">{book.titulacion}</span>
                          {/* Badges (etiquetas) de estado sobre la imagen */}
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

      {/* --- MODAL DE DETALLE DEL LIBRO --- */}
      {selectedBook && (
        <div className="modal-overlay" onClick={() => setSelectedBook(null)}>
          {/* stopPropagation para que si hago click DENTRO del modal no se cierre */}
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