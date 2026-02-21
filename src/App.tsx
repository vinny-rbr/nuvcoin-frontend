import { Routes, Route, Navigate } from "react-router-dom"; // Rotas do React Router
import Layout from "./components/Layout"; // Layout premium (topbar + container)
import ProtectedRoute from "./routes/ProtectedRoute"; // Proteção de rota (mock login)

import Login from "./pages/Login"; // Página de login
import Register from "./pages/Register"; // Página de cadastro
import Dashboard from "./pages/Dashboard"; // Página dashboard
import Receitas from "./pages/Receitas"; // Página receitas
import Despesas from "./pages/Despesas"; // Página despesas

export default function App() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Rotas protegidas (só entra se estiver logado no mock) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/receitas"
        element={
          <ProtectedRoute>
            <Layout>
              <Receitas />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/despesas"
        element={
          <ProtectedRoute>
            <Layout>
              <Despesas />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Rota inicial: manda pro dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Qualquer outra rota: manda pro dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

/*
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com

// O que este App.tsx faz:
// - Define as rotas públicas (/login e /register)
// - Protege as rotas principais com ProtectedRoute (mock login)
// - Envolve Dashboard/Receitas/Despesas com <Layout> para renderizar o conteúdo dentro do layout premium
// - Faz "/" e rotas desconhecidas redirecionarem para "/dashboard"
*/