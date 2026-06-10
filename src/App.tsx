import { logClientEvent } from "./lib/clientLogger";
import { playSound, vibrateDevice } from "./lib/pushService";
import { useEffect, useState, type ReactNode } from "react"; // Hooks + tipo
import { Routes, Route, Navigate, useLocation } from "react-router-dom"; // Rotas do React Router
import Layout from "./components/Layout"; // Layout premium (topbar + container)
import AppUpdatePrompt from "./components/AppUpdatePrompt";
import PwaInstallPrompt from "./components/PwaInstallPrompt";
import WhatsNewModal from "./components/WhatsNewModal";
import ProtectedRoute from "./routes/ProtectedRoute"; // Proteção de rota (mock login)

import Login from "./pages/Login"; // Página de login
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmail from "./pages/VerifyEmail"; // Página de cadastro
import Welcome from "./pages/Welcome";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard"; // Página dashboard
import Receitas from "./pages/Receitas"; // Página receitas
import Despesas from "./pages/Despesas"; // Página despesas
import Categorias from "./pages/Categorias";
import ImportOfx from "./pages/ImportOfx";
import Groups from "./pages/Groups"; // Página de grupos (Splitwise)
import Relatorios from "./pages/Relatorios";
import Perfil from "./pages/Perfil";
import AdminSugestoes from "./pages/AdminSugestoes";
import Contas from "./pages/Contas";

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
  const location = useLocation();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "NOTIF_SOUND") {
        playSound(e.data.sound as string | undefined);
        if (e.data.vibrate) vibrateDevice();
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    logClientEvent({
      event: "navigation.route",
      message: "Navegacao de tela",
      data: {
        pathname: location.pathname,
        search: location.search,
      },
    });
  }, [location.pathname, location.search]);

  return (
    <>
      <AppUpdatePrompt />
      <PwaInstallPrompt />
      <WhatsNewModal />
      <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/welcome" element={<Welcome />} />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      {/* Dashboard */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requireActiveSubscription>
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
          <ProtectedRoute requireActiveSubscription>
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
          <ProtectedRoute requireActiveSubscription>
            <Layout>
              <AnimatedPage>
                <Despesas />
              </AnimatedPage>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/categorias"
        element={
          <ProtectedRoute requireActiveSubscription>
            <Layout>
              <AnimatedPage>
                <Categorias />
              </AnimatedPage>
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/importar-ofx"
        element={
          <ProtectedRoute requireActiveSubscription>
            <Layout>
              <AnimatedPage>
                <ImportOfx />
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

      {/* Relatórios */}
      <Route
        path="/relatorios"
        element={
          <ProtectedRoute requireActiveSubscription>
            <Layout>
              <AnimatedPage>
                <Relatorios />
              </AnimatedPage>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Perfil */}
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <Layout>
              <AnimatedPage>
                <Perfil />
              </AnimatedPage>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Contas / Carteiras */}
      <Route
        path="/contas"
        element={
          <ProtectedRoute requireActiveSubscription>
            <Layout>
              <AnimatedPage>
                <Contas />
              </AnimatedPage>
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin/sugestoes"
        element={
          <ProtectedRoute>
            <AdminSugestoes />
          </ProtectedRoute>
        }
      />

      {/* Rota inicial */}
      <Route path="/" element={<Navigate to="/welcome" replace />} />

      {/* Qualquer rota desconhecida */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
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

