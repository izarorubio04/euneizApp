import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/* ---- PÁGINA PRINCIPAL DE COMUNIDAD ---- */
import Comunidad from "./pages/Comunidad";

/* ---- COMUNIDADES ---- */
import ListaComunidades from "./pages/comunidades/ListaComunidades";
import ComunidadDetalle from "./pages/comunidades/ComunidadDetalle";
import CrearComunidad from "./pages/comunidades/CrearComunidad";

/* ---- CLUBS ---- */
import ListaClubs from "./pages/clubs/ListaClubs";
import ClubDetalle from "./pages/clubs/ClubDetalle";

/* ---- EVENTOS ---- */
import Eventos from "./pages/eventos/Eventos";

/* ---- COMPETICIONES ---- */
import Competiciones from "./pages/competiciones/Competiciones";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* 🔵 Redirección desde "/" → /comunidad */}
        <Route path="/" element={<Navigate to="/comunidad" replace />} />

        {/* ----------------- COMUNIDAD ----------------- */}
        <Route path="/comunidad" element={<Comunidad />} />

        {/* Comunidades */}
        <Route path="/comunidad/lista" element={<ListaComunidades />} />
        <Route path="/comunidad/:id" element={<ComunidadDetalle />} />
        <Route path="/comunidad/crear" element={<CrearComunidad />} />

        {/* ----------------- CLUBS ----------------- */}
        <Route path="/clubs" element={<ListaClubs />} />
        <Route path="/clubs/:id" element={<ClubDetalle />} />

        {/* ----------------- EVENTOS ----------------- */}
        <Route path="/eventos" element={<Eventos />} />

        {/* ----------------- COMPETICIONES ----------------- */}
        <Route path="/competiciones" element={<Competiciones />} />

      </Routes>
    </BrowserRouter>
  );
}
