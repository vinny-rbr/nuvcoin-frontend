import { Routes, Route, Navigate } from "react-router-dom";
// Sistema de rotas

import ProtectedRoute from "./routes/ProtectedRoute";
// Guard que verifica se está logado

import Layout from "./components/Layout";
// Layout com Sidebar + Outlet

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

// Páginas placeholder (vamos criar já já)
function Receitas() {
  return <h2>Receitas (em breve)</h2>;
}

function Despesas() {
  return <h2>Despesas (em breve)</h2>;
}

function Config() {
  return <h2>Configurações (em breve)</h2>;
}

export default function App() {
  return (
    <Routes>

      {/* Redireciona raiz para login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Rotas protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>

          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/receitas" element={<Receitas />} />
          <Route path="/despesas" element={<Despesas />} />
          <Route path="/config" element={<Config />} />

        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  );
}
