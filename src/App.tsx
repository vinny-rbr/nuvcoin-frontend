import { useEffect, useState, type ReactNode } from "react"; // Hooks + tipo
import { Routes, Route, Navigate, useLocation } from "react-router-dom"; // Rotas do React Router
import Layout from "./components/Layout"; // Layout premium (topbar + container)
import ProtectedRoute from "./routes/ProtectedRoute"; // Proteção de rota (mock login)

import Login from "./pages/Login"; // Página de login
import Register from "./pages/Register"; // Página de cadastro
import Dashboard from "./pages/Dashboard"; // Página dashboard
import Receitas from "./pages/Receitas"; // Página receitas
import Despesas from "./pages/Despesas"; // Página despesas
import Groups from "./pages/Groups"; // Página de grupos (Splitwise)

type AnimatedPageProps = {
  children: ReactNode; // Conteúdo da página
};

// Componente interno para animar a entrada das páginas
function AnimatedPage({ children }: AnimatedPageProps) {
  const location = useLocation(); // Detecta troca de rota
  const [visible, setVisible] = useState(false); // Controla animação

  useEffect(() => {
    setVisible(false); // Reseta ao mudar rota

    const timeoutId = window.setTimeout(() => {
      setVisible(true); // Ativa a animação logo após montar
    }, 40);

    return () => {
      window.clearTimeout(timeoutId); // Limpa timeout
    };
  }, [location.pathname]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(12px)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <AnimatedPage>
                <Dashboard />
              </AnimatedPage>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Receitas */}
      <Route
        path="/receitas"
        element={
          <ProtectedRoute>
            <Layout>
              <AnimatedPage>
                <Receitas />
              </AnimatedPage>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Despesas */}
      <Route
        path="/despesas"
        element={
          <ProtectedRoute>
            <Layout>
              <AnimatedPage>
                <Despesas />
              </AnimatedPage>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Groups */}
      <Route
        path="/groups"
        element={
          <ProtectedRoute>
            <Layout>
              <AnimatedPage>
                <Groups />
              </AnimatedPage>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Rota inicial */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Qualquer rota desconhecida */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

/*
=====================================================
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com
=====================================================

Mudança feita:

✔ Adicionada animação global entre páginas protegidas
✔ Fade + subida suave ao trocar rota
✔ Aplicado em Dashboard, Receitas, Despesas e Groups
✔ Sem criar arquivo novo
✔ Sem depender de biblioteca externa
*/