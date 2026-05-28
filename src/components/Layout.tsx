import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Link, useNavigate } from "react-router-dom"; // Links sem recarregar a página
import {
  deriveSubscriptionStatusFromAuthData,
  INACTIVE_SUBSCRIPTION_MESSAGE,
  persistSubscriptionState,
  subscribeToSubscriptionStatus,
  type SubscriptionStatus,
} from "../lib/auth";
import { readApiErrorMessage } from "../lib/apiError";

import "./layout.css"; // Importa o CSS do layout premium

type Props = {
  children: React.ReactNode; // Tudo que vai dentro do layout (cada página)
};

type Plan = {
  id: string;
  name: string;
  priceCents: number;
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

function formatPriceCents(priceCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceCents / 100);
}

export default function Layout({ children }: Props) {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isActivatePlanModalOpen, setIsActivatePlanModalOpen] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [isCheckingSubscriptionStatus, setIsCheckingSubscriptionStatus] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;

    return window.innerWidth < 768;
  });
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
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
    return subscribeToSubscriptionStatus(setSubscriptionStatus);
  }, []);

  useEffect(() => {
    if (!isCheckingSubscriptionStatus && subscriptionStatus === "inactive") {
      setShowTrialModal(true);
    }
  }, [isCheckingSubscriptionStatus, subscriptionStatus]);

  useEffect(() => {
    let isMounted = true;

    async function refreshSubscriptionStatus() {
      const token = localStorage.getItem("token");

      if (!token) {
        if (isMounted) {
          setIsCheckingSubscriptionStatus(false);
        }

        return;
      }

      try {
        const response = await fetch("/api/subscriptions/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as Record<string, unknown>;
        const nextSubscriptionStatus = deriveSubscriptionStatusFromAuthData(data);

        if (!isMounted) {
          return;
        }

        if (nextSubscriptionStatus === "active") {
          setSubscriptionStatus("active");
          persistSubscriptionState("active");
          setShowTrialModal(false);
          return;
        }

        if (nextSubscriptionStatus === "trial") {
          setSubscriptionStatus("trial");
          persistSubscriptionState("trial");
          setShowTrialModal(false);
          return;
        }

        setSubscriptionStatus("inactive");
        persistSubscriptionState("inactive");
      } catch {
        // Mantem o comportamento atual sem interromper a experiencia.
      } finally {
        if (isMounted) {
          setIsCheckingSubscriptionStatus(false);
        }
      }
    }

    void refreshSubscriptionStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isActivatePlanModalOpen) return;

    let isMounted = true;

    async function fetchPlans() {
      try {
        const response = await fetch("/api/plans", {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error("Nao foi possivel carregar os planos.");
        }

        const data = (await response.json()) as Plan[];

        if (isMounted) {
          setPlans(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!isMounted) return;

        setPlans([]);
        const message = error instanceof Error ? error.message : "Nao foi possivel carregar os planos.";
        window.alert(message);
      }
    }

    void fetchPlans();

    return () => {
      isMounted = false;
    };
  }, [isActivatePlanModalOpen]);

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

  function handleActivatePlan() {
    setIsActivatePlanModalOpen(true);
  }

  function handleCloseActivatePlanModal() {
    setIsActivatePlanModalOpen(false);
  }

  async function handleSubscribe(planId: string) {
    const token = localStorage.getItem("token") ?? "";

    try {
      setLoadingPlanId(planId);

      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId,
        }),
      });

      if (!response.ok) {
        const message = await readApiErrorMessage(response, "Erro ao iniciar pagamento.");
        throw new Error(message);
      }

      const data = (await response.json()) as {
        invoiceUrl?: string;
      };

      if (!data.invoiceUrl) {
        throw new Error("Erro ao iniciar pagamento");
      }

      window.location.href = data.invoiceUrl;
    } catch (error: unknown) {
      setLoadingPlanId(null);
      const message = error instanceof Error ? error.message : "Erro ao iniciar pagamento. Tente novamente.";
      window.alert(message);
    }
  }

  async function handleStartTrial() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        window.alert("Faca login novamente para iniciar o trial.");
        return;
      }

      let trialPlanId = plans[0]?.id ?? null;

      if (!trialPlanId) {
        const plansResponse = await fetch("/api/plans", { method: "GET" });

        if (!plansResponse.ok) {
          const message = await readApiErrorMessage(plansResponse, "Nao foi possivel carregar os planos.");
          throw new Error(message);
        }

        const loadedPlans = (await plansResponse.json()) as Plan[];
        const nextPlans = Array.isArray(loadedPlans) ? loadedPlans : [];
        setPlans(nextPlans);
        trialPlanId = nextPlans[0]?.id ?? null;
      }

      if (!trialPlanId) {
        window.alert("Nenhum plano ativo encontrado para iniciar o trial.");
        return;
      }

      const response = await fetch("/api/subscriptions/start-trial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: trialPlanId,
        }),
      });

      if (!response.ok) {
        const message = await readApiErrorMessage(response, "Nao foi possivel iniciar o trial.");
        throw new Error(message);
      }

      const data = (await response.json()) as {
        subscriptionEndDateUtc?: string | null;
        endDateUtc?: string | null;
      };
      const endDateUtc = data.subscriptionEndDateUtc ?? data.endDateUtc;

      if (endDateUtc) {
        localStorage.setItem("subscriptionEndDateUtc", endDateUtc);
      }

      persistSubscriptionState("trial");
      setSubscriptionStatus("trial");
      setShowTrialModal(false);
    } catch (error: unknown) {
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

      setSubscriptionStatus(null);
      navigate("/login");
    }, 1500);
  }

  const planBadgeLabel =
    subscriptionStatus === "active"
      ? "Plano ativo"
      : subscriptionStatus === "trial"
        ? "Periodo de teste"
        : subscriptionStatus === "inactive"
          ? "Conta inativa"
          : "Status do plano";
  const hasConfirmedPaidSubscription = !isCheckingSubscriptionStatus && subscriptionStatus === "active";
  const trialBadgeLabel =
    subscriptionStatus !== "trial" || remainingDays === null
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

            {!hasConfirmedPaidSubscription ? (
              <button
                type="button"
                onClick={handleActivatePlan}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px 14px",
                  borderRadius: "10px",
                  border: "1px solid rgba(96, 165, 250, 0.35)",
                  background: "rgba(59, 130, 246, 0.16)",
                  color: "#bfdbfe",
                  cursor: "pointer",
                  transition: "0.2s ease",
                  whiteSpace: "nowrap",
                  fontWeight: 600,
                }}
              >
                Ativar plano
              </button>
            ) : null}

            {/* Navegação */}
            <nav className="nav" aria-label="Navegação principal">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-disabled={subscriptionStatus === "inactive" && item.requiresActiveSubscription}
                  onClick={
                    subscriptionStatus === "inactive" && item.requiresActiveSubscription
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
                  aria-disabled={subscriptionStatus === "inactive" && item.requiresActiveSubscription}
                  onClick={
                    subscriptionStatus === "inactive" && item.requiresActiveSubscription
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

      {isActivatePlanModalOpen ? (
        <div
          aria-live="polite"
          aria-modal="true"
          role="dialog"
          aria-label="Ativar plano"
          onClick={handleCloseActivatePlanModal}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "rgba(0, 0, 0, 0.72)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            animation: "fadeInActivatePlanModal 0.25s ease-out",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "960px",
              display: "grid",
              gap: "22px",
              padding: isMobile ? "20px" : "28px",
              borderRadius: "24px",
              border: "1px solid rgba(148, 163, 184, 0.18)",
              background: "linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.96))",
              boxShadow: "0 30px 80px rgba(0, 0, 0, 0.45)",
              color: "var(--text-main)",
              maxHeight: "min(88vh, 920px)",
              overflowY: "auto",
            }}
          >
            <div style={{ display: "grid", gap: "10px" }}>
              <span
                style={{
                  display: "inline-flex",
                  width: "fit-content",
                  padding: "6px 10px",
                  borderRadius: "999px",
                  background: "rgba(59, 130, 246, 0.14)",
                  color: "#bfdbfe",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                }}
              >
                Acesso premium
              </span>
              <h2 style={{ margin: 0, fontSize: "30px", fontWeight: 800, lineHeight: 1.1 }}>
                Ative seu plano e libere toda a experiência
              </h2>
              <p style={{ margin: 0, fontSize: "16px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Continue com um plano ativo para usar sem bloqueios, manter seu histórico sincronizado e acessar
                todos os recursos da plataforma.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "14px",
              }}
            >
              {plans.map((plan) => {
                const isRecommended = plan.name.toLowerCase().includes("pro");

                return (
                  <div
                    key={plan.id}
                    style={{
                      display: "grid",
                      gap: "14px",
                      padding: "16px",
                      borderRadius: "18px",
                      border: isRecommended
                        ? "1px solid rgba(96, 165, 250, 0.45)"
                        : "1px solid rgba(148, 163, 184, 0.18)",
                      background: isRecommended
                        ? "linear-gradient(180deg, rgba(30, 64, 175, 0.22), rgba(15, 23, 42, 0.72))"
                        : "rgba(15, 23, 42, 0.65)",
                      boxShadow: isRecommended ? "0 18px 40px rgba(37, 99, 235, 0.18)" : "none",
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                    <div style={{ display: "grid", gap: "4px" }}>
                        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Plano</span>
                        <strong
                          style={{
                            fontSize: "20px",
                            color: "var(--text-main)",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {plan.name}
                        </strong>
                      </div>
                      <div style={{ display: "grid", gap: "4px", textAlign: "right" }}>
                        {isRecommended ? (
                          <span
                            style={{
                              justifySelf: "end",
                              padding: "4px 8px",
                              borderRadius: "999px",
                              background: "rgba(96, 165, 250, 0.16)",
                              color: "#bfdbfe",
                              fontSize: "11px",
                              fontWeight: 700,
                              letterSpacing: "0.02em",
                            }}
                          >
                            Recomendado
                          </span>
                        ) : null}
                        <strong
                          style={{
                            fontSize: "24px",
                            color: isRecommended ? "#dbeafe" : "#bfdbfe",
                            overflowWrap: "anywhere",
                          }}
                        >
                          {formatPriceCents(plan.priceCents)}
                        </strong>
                      </div>
                    </div>

                    <div style={{ display: "grid", gap: "10px" }}>
                      <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Inclui</span>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "20px",
                          color: "var(--text-main)",
                          lineHeight: 1.6,
                        }}
                      >
                        <li>Acesso completo ao dashboard e aos módulos financeiros</li>
                        <li>Recursos premium liberados para controle e organização</li>
                        <li>Continuidade do histórico e suporte ao crescimento da conta</li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loadingPlanId === plan.id}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        borderRadius: "12px",
                        border: "none",
                        background: isRecommended ? "#60a5fa" : "#3b82f6",
                        color: "#ffffff",
                        fontWeight: 700,
                        cursor: loadingPlanId === plan.id ? "not-allowed" : "pointer",
                        transition: "opacity 0.2s ease",
                        opacity: loadingPlanId === plan.id ? 0.75 : 1,
                      }}
                    >
                      {loadingPlanId === plan.id ? "Processando..." : "Assinar agora"}
                    </button>
                  </div>
                );
              })}

              {plans.length === 0 ? (
                <div
                  style={{
                    padding: "18px",
                    borderRadius: "18px",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    background: "rgba(15, 23, 42, 0.65)",
                    color: "var(--text-secondary)",
                    textAlign: "center",
                  }}
                >
                  Nenhum plano disponível no momento.
                </div>
              ) : null}
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
                onClick={handleCloseActivatePlanModal}
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

          @keyframes fadeInActivatePlanModal {
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
