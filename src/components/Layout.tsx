import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom"; // Links sem recarregar a página
import {
  getSubscriptionActiveState,
  INACTIVE_SUBSCRIPTION_MESSAGE,
  persistSubscriptionState,
  subscribeToSubscriptionState,
} from "../lib/auth";

import "./layout.css"; // Importa o CSS do layout premium

type Props = {
  children: React.ReactNode; // Tudo que vai dentro do layout (cada página)
};

const navItems = [
  { to: "/dashboard", label: "Dashboard", requiresActiveSubscription: true },
  { to: "/receitas", label: "Receitas", requiresActiveSubscription: true },
  { to: "/despesas", label: "Despesas", requiresActiveSubscription: true },
  { to: "/groups", label: "Groups", requiresActiveSubscription: false },
];

function getRemainingDays(endDateRaw: string | null): number | null {
  if (!endDateRaw) return null;

  const endDate = new Date(endDateRaw);
  const now = new Date();

  const diff = endDate.getTime() - now.getTime();
  const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)) - 1);

  return days;
}

export default function Layout({ children }: Props) {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;

    return window.innerWidth < 768;
  });
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const [subscriptionState, setSubscriptionState] = useState<boolean | null>(() => getSubscriptionActiveState());
  const endDateRaw = typeof window === "undefined" ? null : localStorage.getItem("subscriptionEndDateUtc");
  const remainingDays = getRemainingDays(endDateRaw);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 767px)");

    function handleMediaChange(event: MediaQueryListEvent) {
      setIsMobile(event.matches);
    }

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!mobileMenuRef.current) return;
      if (mobileMenuRef.current.contains(event.target as Node)) return;

      setIsMobileMenuOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    return subscribeToSubscriptionState(setSubscriptionState);
  }, []);

  useEffect(() => {
    if (subscriptionState === false) {
      setShowTrialModal(true);
    }
  }, [subscriptionState]);

  function handleMobileMenuToggle(event: ReactMouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setIsMobileMenuOpen((current) => !current);
  }

  function handleMobileMenuClose() {
    setIsMobileMenuOpen(false);
  }

  function handleBlockedNavigation(event: ReactMouseEvent<HTMLElement>) {
    event.preventDefault();
    window.alert(INACTIVE_SUBSCRIPTION_MESSAGE);
    handleMobileMenuClose();
  }

  async function handleStartTrial() {
    try {
      const response = await fetch("/api/subscriptions/start-trial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          planId: "daeb0e00-df7d-4b24-8392-ef53fbac7e7c",
        }),
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel iniciar o trial.");
      }

      persistSubscriptionState(true);
      setSubscriptionState(true);
      setShowTrialModal(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel iniciar o trial.";
      window.alert(message);
    }
  }

  function handleLogout() {
    setIsLoggingOut(true);
    handleMobileMenuClose();

    window.setTimeout(() => {
      const localStorageKeysToRemove = [
        "token",
        "nuvcoin_token",
        "auth_token",
        "accessToken",
        "jwt",
        "auth",
        "logged",
        "user",
        "session",
        "sessionId",
        "refreshToken",
        "nuvcoin_email",
        "nuvcoin_userId",
        "nuvcoin_name",
        "nuvcoin_subscription_active",
        "subscriptionActive",
        "subscriptionStatus",
        "subscription_status",
        "hasActiveSubscription",
        "isSubscriptionActive",
        "planStatus",
        "plan_status",
        "planActive",
        "plan_active",
        "isActive",
      ];

      localStorageKeysToRemove.forEach((key) => {
        window.localStorage.removeItem(key);
      });

      setSubscriptionState(null);
      navigate("/login");
    }, 1500);
  }

  const planBadgeLabel =
    subscriptionState === true ? "Plano ativo" : subscriptionState === false ? "Conta inativa" : "Status do plano";
  const trialBadgeLabel =
    remainingDays === null
      ? null
      : remainingDays > 1
        ? `💎 Trial ativo • ${remainingDays} dias restantes`
        : remainingDays === 1
          ? "⚠️ Termina amanhã"
          : "❌ Trial expirado";

  return (
    <div className="app-shell">
      {/* Topbar fixa com blur e cara de SaaS */}
      <header className="topbar">
        <div className="topbar-inner">
          {/* Marca do app */}
          <div className="brand-cluster">
            <div className="brand">
              <span className="logo-dot" />
              <h1>NUVCOIN</h1>
            </div>
            <span className="badge">{planBadgeLabel}</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginLeft: "auto",
            }}
          >
            {trialBadgeLabel ? (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "6px 10px",
                  borderRadius: "999px",
                  background: "rgba(255, 255, 255, 0.12)",
                  color: "var(--text-main)",
                  fontSize: "12px",
                  fontWeight: 600,
                  lineHeight: 1,
                  whiteSpace: "nowrap",
                }}
              >
                {trialBadgeLabel}
              </span>
            ) : null}

            {/* Navegação */}
            <nav className="nav" aria-label="Navegação principal">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-disabled={subscriptionState === false && item.requiresActiveSubscription}
                  onClick={
                    subscriptionState === false && item.requiresActiveSubscription
                      ? handleBlockedNavigation
                      : undefined
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: isMobile ? "none" : "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "8px 14px",
                borderRadius: "10px",
                border: "1px solid rgba(148, 163, 184, 0.18)",
                background: "rgba(30, 41, 59, 0.6)",
                color: "var(--text-main)",
                cursor: "pointer",
                transition: "0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              Sair
            </button>
          </div>

          <div className="mobile-nav-shell" ref={mobileMenuRef}>
            <button
              type="button"
              className={`mobile-menu-button${isMobileMenuOpen ? " is-open" : ""}`}
              aria-label={isMobileMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-panel"
              onClick={handleMobileMenuToggle}
            >
              <span className="mobile-menu-icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>

            <div
              id="mobile-nav-panel"
              className={`mobile-nav-menu${isMobileMenuOpen ? " is-open" : ""}`}
            >
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-disabled={subscriptionState === false && item.requiresActiveSubscription}
                  onClick={
                    subscriptionState === false && item.requiresActiveSubscription
                      ? handleBlockedNavigation
                      : handleMobileMenuClose
                  }
                >
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                  background: "rgba(30, 41, 59, 0.6)",
                  color: "var(--text-main)",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {isMobile && isMobileMenuOpen ? (
        <div
          className="mobile-nav-overlay"
          aria-hidden="true"
          onClick={handleMobileMenuClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 39,
          }}
        />
      ) : null}

      {isLoggingOut ? (
        <div
          aria-live="polite"
          aria-label="Saindo da conta"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "rgba(0, 0, 0, 0.82)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            pointerEvents: "all",
            animation: "fadeInLogoutOverlay 0.25s ease-out",
          }}
        >
          <div
            style={{
              display: "grid",
              gap: "10px",
              justifyItems: "center",
              textAlign: "center",
              color: "var(--text-main)",
              padding: "28px 32px",
              borderRadius: "20px",
              border: "1px solid rgba(148, 163, 184, 0.16)",
              background: "rgba(15, 23, 42, 0.9)",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
              animation: "logoutPulse 1.2s ease-in-out infinite",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "28px", fontWeight: 700 }}>Saindo...</h2>
            <p style={{ margin: 0, fontSize: "16px", color: "var(--text-secondary)" }}>Volte sempre 👋</p>
          </div>
        </div>
      ) : null}

      {showTrialModal ? (
        <div
          aria-live="polite"
          aria-modal="true"
          role="dialog"
          aria-label="Iniciar teste gratis"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "rgba(0, 0, 0, 0.72)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            animation: "fadeInTrialModal 0.25s ease-out",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              display: "grid",
              gap: "18px",
              padding: "28px",
              borderRadius: "20px",
              border: "1px solid rgba(148, 163, 184, 0.18)",
              background: "linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.96))",
              boxShadow: "0 30px 80px rgba(0, 0, 0, 0.45)",
              color: "var(--text-main)",
              textAlign: "center",
            }}
          >
            <div style={{ display: "grid", gap: "10px" }}>
              <h2 style={{ margin: 0, fontSize: "28px", fontWeight: 700 }}>Iniciar teste gratis?</h2>
              <p style={{ margin: 0, fontSize: "16px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Voce pode usar todas as funcionalidades por 15 dias gratis.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: "12px",
              }}
            >
              <button
                type="button"
                onClick={handleStartTrial}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#3b82f6",
                  color: "#ffffff",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "opacity 0.2s ease",
                }}
              >
                Iniciar trial
              </button>
              <button
                type="button"
                onClick={() => setShowTrialModal(false)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                  background: "rgba(30, 41, 59, 0.7)",
                  color: "var(--text-main)",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "opacity 0.2s ease",
                }}
              >
                Agora nao
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Conteúdo da página */}
      <main className="page">{children}</main>

      <style>
        {`
          @keyframes fadeInLogoutOverlay {
            from {
              opacity: 0;
            }

            to {
              opacity: 1;
            }
          }

          @keyframes logoutPulse {
            0%,
            100% {
              transform: scale(1);
            }

            50% {
              transform: scale(1.02);
            }
          }

          @keyframes fadeInTrialModal {
            from {
              opacity: 0;
            }

            to {
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}

/*
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com

// O que esse Layout faz:
// - Cria uma Topbar premium (sticky + blur)
// - Centraliza tudo num container (max-width)
// - Adiciona navegação real (Dashboard/Receitas/Despesas/Groups)
// - Mantém o conteúdo das páginas dentro de <main className="page">
*/
