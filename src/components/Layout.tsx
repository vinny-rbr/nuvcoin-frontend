import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PhotoFlow from "./PhotoFlow";
import TutoriaisModal from "./TutoriaisModal";
import {
  deriveSubscriptionStatusFromAuthData,
  INACTIVE_SUBSCRIPTION_MESSAGE,
  persistSubscriptionState,
  subscribeToSubscriptionStatus,
  type SubscriptionStatus,
} from "../lib/auth";
import { apiUrl } from "../lib/api";
import { readApiErrorMessage } from "../lib/apiError";
import { logClientEvent } from "../lib/clientLogger";
import { hasCompletedOnboarding } from "../lib/onboarding";

import "./layout.css"; // Importa o CSS do layout premium

type Props = {
  children: React.ReactNode; // Tudo que vai dentro do layout (cada pÃ¡gina)
};

type Plan = {
  id: string;
  name: string;
  priceCents: number;
  monthlyTransactionLimit: number | null;
  subcategoryLimit: number | null;
  groupLimit: number | null;
};

function readStoredLifetimeState(): boolean {
  if (typeof window === "undefined") return false;

  return window.localStorage.getItem("conciliaai_subscription_lifetime") === "true";
}

function readLifetimeStateFromApiResponse(data: Record<string, unknown>): boolean {
  return data.isLifetime === true || data.lifetime === true || data.planLifetime === true;
}

function persistLifetimeState(value: boolean): void {
  if (typeof window === "undefined") return;

  if (value) {
    window.localStorage.setItem("conciliaai_subscription_lifetime", "true");
    window.localStorage.removeItem("subscriptionEndDateUtc");
    return;
  }

  window.localStorage.removeItem("conciliaai_subscription_lifetime");
}

const NAV_ICONS = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>
    </svg>
  ),
  receitas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>
    </svg>
  ),
  despesas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>
    </svg>
  ),
  categorias: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.6 13.4 12 22l-9-9V4a1 1 0 0 1 1-1h9z"/><circle cx="7.5" cy="7.5" r="1.5"/>
    </svg>
  ),
  importar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  groups: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6"/><path d="M17.5 14.4A5.5 5.5 0 0 1 20.5 19.5"/>
    </svg>
  ),
  contas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/>
    </svg>
  ),
  cartaoCredito: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><path d="M6 15h4"/>
    </svg>
  ),
  orcamento: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  metas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
    </svg>
  ),
};

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: NAV_ICONS.dashboard, requiresActiveSubscription: true },
  { to: "/receitas", label: "Receitas", icon: NAV_ICONS.receitas, requiresActiveSubscription: true },
  { to: "/despesas", label: "Despesas", icon: NAV_ICONS.despesas, requiresActiveSubscription: true },
  { to: "/categorias", label: "Categorias", icon: NAV_ICONS.categorias, requiresActiveSubscription: true },
  { to: "/importar-ofx", label: "Importar extrato", icon: NAV_ICONS.importar, requiresActiveSubscription: true },
  { to: "/contas", label: "Carteiras", icon: NAV_ICONS.contas, requiresActiveSubscription: true },
  { to: "/cartao-credito", label: "Crédito", icon: NAV_ICONS.cartaoCredito, requiresActiveSubscription: true },
  { to: "/planejamento", label: "Planejamento", icon: NAV_ICONS.orcamento, requiresActiveSubscription: true },
  { to: "/groups", label: "Grupos", icon: NAV_ICONS.groups, requiresActiveSubscription: false },
];


function formatPriceCents(priceCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(priceCents / 100);
}

function getProfilePhotoStorageKey(userId: string | null): string {
  return `conciliaai_profile_photo:${userId || "anonymous"}`;
}

function getInitials(nameOrEmail: string): string {
  const cleaned = nameOrEmail.trim();
  if (!cleaned) return "US";

  const namePart = cleaned.includes("@") ? cleaned.split("@")[0] : cleaned;
  const words = namePart.split(/\s+|[._-]+/).filter(Boolean);

  if (words.length === 0) return "US";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export default function Layout({ children }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isPhotoFlowOpen, setIsPhotoFlowOpen] = useState(false);
  const [isActivatePlanModalOpen, setIsActivatePlanModalOpen] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [isWaitingForPayment, setIsWaitingForPayment] = useState(false);
  const paymentPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cpfInput, setCpfInput] = useState("");
  const [fullNameInput, setFullNameInput] = useState("");
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [showCpfModal, setShowCpfModal] = useState(false);
  const [isCheckingSubscriptionStatus, setIsCheckingSubscriptionStatus] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;

    return window.innerWidth < 768;
  });
  const quickAddRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [, setIsLifetimeSubscription] = useState(readStoredLifetimeState);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isTutoriaisOpen, setIsTutoriaisOpen] = useState(false);
  const [showTutorialBalloon, setShowTutorialBalloon] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("conciliaai_tutorial_balloon_seen") !== "true";
  });
  const [profileName, setProfileName] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem("conciliaai_name") ?? "",
  );
  const [profileEmail, setProfileEmail] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem("conciliaai_email") ?? "",
  );
  const [profileUserId, setProfileUserId] = useState(() =>
    typeof window === "undefined" ? "" : window.localStorage.getItem("conciliaai_userId") ?? "",
  );
  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const userId = window.localStorage.getItem("conciliaai_userId");
    return window.localStorage.getItem(getProfilePhotoStorageKey(userId));
  });
  const profileDisplayName = profileName || profileEmail.split("@")[0] || "Usuário";
  const profileInitials = getInitials(profileDisplayName || profileEmail);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    function syncProfileFromStorage() {
      const nextUserId = window.localStorage.getItem("conciliaai_userId") ?? "";
      const nextEmail = window.localStorage.getItem("conciliaai_email") ?? "";
      const nextName = window.localStorage.getItem("conciliaai_name") ?? "";

      setProfileUserId(nextUserId);
      setProfileEmail(nextEmail);
      setProfileName(nextName);
      setProfilePhoto(window.localStorage.getItem(getProfilePhotoStorageKey(nextUserId)));
    }

    syncProfileFromStorage();
    window.addEventListener("storage", syncProfileFromStorage);

    return () => {
      window.removeEventListener("storage", syncProfileFromStorage);
    };
  }, []);

  useEffect(() => {
    if (!isProfileMenuOpen) return undefined;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!profileMenuRef.current) return;
      if (profileMenuRef.current.contains(event.target as Node)) return;

      setIsProfileMenuOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
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
  }, [isProfileMenuOpen]);

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
      setIsQuickAddOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    setIsQuickAddOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isQuickAddOpen) return undefined;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!quickAddRef.current) return;
      if (quickAddRef.current.contains(event.target as Node)) return;

      setIsQuickAddOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsQuickAddOpen(false);
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
  }, [isQuickAddOpen]);

  useEffect(() => {
    return subscribeToSubscriptionStatus(setSubscriptionStatus);
  }, []);

  useEffect(() => {
    if (!isCheckingSubscriptionStatus && subscriptionStatus === "inactive" && location.pathname !== "/onboarding" && !isWaitingForPayment) {
      setShowTrialModal(true);
    }
  }, [isCheckingSubscriptionStatus, isWaitingForPayment, location.pathname, subscriptionStatus]);

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
        const response = await fetch(apiUrl("/api/subscriptions/me"), {
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
        const nextIsLifetime = readLifetimeStateFromApiResponse(data);
        const nextEndDate =
          typeof data.subscriptionEndDateUtc === "string"
            ? data.subscriptionEndDateUtc
            : typeof data.endDateUtc === "string"
              ? data.endDateUtc
              : null;

        if (!isMounted) {
          return;
        }

        if (nextSubscriptionStatus === "active") {
          setIsLifetimeSubscription(nextIsLifetime);
          persistLifetimeState(nextIsLifetime);
          if (!nextIsLifetime && nextEndDate) {
            localStorage.setItem("subscriptionEndDateUtc", nextEndDate);
          }
          setSubscriptionStatus("active");
          persistSubscriptionState("active");
          setShowTrialModal(false);
          return;
        }

        if (nextSubscriptionStatus === "trial") {
          setIsLifetimeSubscription(false);
          persistLifetimeState(false);
          if (nextEndDate) {
            localStorage.setItem("subscriptionEndDateUtc", nextEndDate);
          }
          setSubscriptionStatus("trial");
          persistSubscriptionState("trial");
          setShowTrialModal(false);
          return;
        }

        setIsLifetimeSubscription(false);
        persistLifetimeState(false);
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
    return () => {
      if (paymentPollingRef.current) {
        clearInterval(paymentPollingRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isActivatePlanModalOpen) return;

    let isMounted = true;

    async function fetchPlans() {
      try {
        const response = await fetch(apiUrl("/api/plans"), {
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

  function stopPaymentPolling() {
    if (paymentPollingRef.current) {
      clearInterval(paymentPollingRef.current);
      paymentPollingRef.current = null;
    }
    setIsWaitingForPayment(false);
  }

  function startPaymentPolling() {
    stopPaymentPolling();
    setIsWaitingForPayment(true);

    paymentPollingRef.current = setInterval(() => {
      const token = localStorage.getItem("token");
      if (!token) return;

      void (async () => {
        try {
          const response = await fetch(apiUrl("/api/subscriptions/me"), {
            method: "GET",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          });

          if (!response.ok) return;

          const data = (await response.json()) as Record<string, unknown>;
          const nextStatus = deriveSubscriptionStatusFromAuthData(data);

          if (nextStatus === "active") {
            stopPaymentPolling();
            const nextIsLifetime = readLifetimeStateFromApiResponse(data);
            const nextEndDate =
              typeof data.subscriptionEndDateUtc === "string"
                ? data.subscriptionEndDateUtc
                : typeof data.endDateUtc === "string"
                  ? data.endDateUtc
                  : null;

            setIsLifetimeSubscription(nextIsLifetime);
            persistLifetimeState(nextIsLifetime);
            if (!nextIsLifetime && nextEndDate) {
              localStorage.setItem("subscriptionEndDateUtc", nextEndDate);
            }
            setSubscriptionStatus("active");
            persistSubscriptionState("active");
            setShowTrialModal(false);
            setIsActivatePlanModalOpen(false);
            navigate("/dashboard", { replace: true });
          }
        } catch {
          // ignore, continue polling
        }
      })();
    }, 5000);
  }


  function handleBlockedNavigation(event: ReactMouseEvent<HTMLElement>) {
    event.preventDefault();
    window.alert(INACTIVE_SUBSCRIPTION_MESSAGE);
    setIsQuickAddOpen(false);
  }

  function canOpenPremiumRoute(): boolean {
    return subscriptionStatus !== "inactive";
  }

  function handleMobileRoute(to: string, requiresActiveSubscription = true) {
    if (requiresActiveSubscription && !canOpenPremiumRoute()) {
      window.alert(INACTIVE_SUBSCRIPTION_MESSAGE);
      setIsQuickAddOpen(false);
      return;
    }

    logClientEvent({
      event: "navigation.mobile_bottom.open",
      message: "Navegacao pelo menu inferior",
      data: { to },
    });
    setIsQuickAddOpen(false);
    navigate(to);
  }

  function handleQuickAddToggle(event: ReactMouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (location.pathname === "/contas") {
      window.dispatchEvent(new CustomEvent("conciliaai:open-quick-add-accounts"));
      return;
    }

    logClientEvent({
      event: "navigation.quick_add.toggle",
      message: "Menu rapido de lancamento alternado",
      data: { nextOpen: !isQuickAddOpen },
    });
    setIsQuickAddOpen((current) => !current);
  }

  function handleGroupExpenseQuickAdd() {
    logClientEvent({
      event: "navigation.quick_add.group_expense",
      message: "Abriu lancamento rapido de despesa de grupo",
    });
    setIsQuickAddOpen(false);
    window.dispatchEvent(new CustomEvent("conciliaai:open-group-expense"));
  }

  function handleActivatePlan() {
    logClientEvent({ event: "subscription.activate.open", message: "Abriu modal de ativar plano" });
    setIsActivatePlanModalOpen(true);
  }

  function handleCloseActivatePlanModal() {
    logClientEvent({ event: "subscription.activate.close", message: "Fechou modal de ativar plano" });
    setIsActivatePlanModalOpen(false);
  }

  function dismissTutorialBalloon() {
    setShowTutorialBalloon(false);
    try { localStorage.setItem("conciliaai_tutorial_balloon_seen", "true"); } catch { /* ignore */ }
  }

  function openTutoriais() {
    dismissTutorialBalloon();
    setIsTutoriaisOpen(true);
  }

  function formatCpf(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  async function handleSubscribe(planId: string, cpfCnpj?: string, fullName?: string) {
    const token = localStorage.getItem("token") ?? "";

    const storedCpf = localStorage.getItem("conciliaai_cpf") ?? "";
    const storedName = localStorage.getItem("conciliaai_name") ?? "";
    const resolvedCpf = cpfCnpj ?? storedCpf;
    const resolvedName = fullName ?? storedName;

    const cpfDigits = resolvedCpf.replace(/\D/g, "");
    if (!cpfDigits || cpfDigits.length !== 11) {
      setPendingPlanId(planId);
      setFullNameInput(storedName);
      setCpfInput(storedCpf);
      setShowCpfModal(true);
      return;
    }

    try {
      setLoadingPlanId(planId);

      const response = await fetch(apiUrl("/api/payments/checkout"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId,
          cpfCnpj: cpfDigits,
          ...(resolvedName.trim() ? { fullName: resolvedName.trim() } : {}),
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

      window.open(data.invoiceUrl, "_blank", "noopener,noreferrer");
      setLoadingPlanId(null);
      startPaymentPolling();
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
        const plansResponse = await fetch(apiUrl("/api/plans"), { method: "GET" });

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

      const response = await fetch(apiUrl("/api/subscriptions/start-trial"), {
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
        isLifetime?: boolean;
        lifetime?: boolean;
        planLifetime?: boolean;
      };
      const endDateUtc = data.subscriptionEndDateUtc ?? data.endDateUtc;
      const nextIsLifetime = data.isLifetime === true || data.lifetime === true || data.planLifetime === true;

      persistLifetimeState(nextIsLifetime);
      setIsLifetimeSubscription(nextIsLifetime);

      if (endDateUtc && !nextIsLifetime) {
        localStorage.setItem("subscriptionEndDateUtc", endDateUtc);
      }

      persistSubscriptionState("trial");
      setSubscriptionStatus("trial");
      setShowTrialModal(false);
      navigate(hasCompletedOnboarding(profileUserId) ? "/dashboard" : "/onboarding", { replace: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Nao foi possivel iniciar o trial.";
      window.alert(message);
    }
  }


  const hasConfirmedPaidSubscription = !isCheckingSubscriptionStatus && subscriptionStatus === "active";

  return (
    <div className="app-shell">
      {/* Topbar fixa com blur e cara de SaaS */}
      <header className="topbar">
        <div className="topbar-inner">
          {/* Perfil no topo (mobile) */}
          {isMobile ? (
            <button
              type="button"
              className="mobile-top-profile"
              aria-label="Abrir perfil"
              onClick={() => navigate("/perfil")}
            >
              <span className="mobile-top-profile-avatar" aria-hidden="true">
                {profilePhoto ? <img src={profilePhoto} alt="" /> : profileInitials.slice(0, 1)}
              </span>
            </button>
          ) : null}
          {/* Marca do app */}
          <div className="brand-cluster">
            <div className="brand">
              <span className="app-logo-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 17l5-5 4 3 8-8"/><path d="M16 7h4v4"/>
                </svg>
              </span>
              <span className="brand-copy">
                <strong>Conciliaaí</strong>
                <small>FINANÇAS</small>
              </span>
            </div>
            <span className="badge">FINANÇAS</span>
          </div>

          <div
            className="topbar-actions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginLeft: "auto",
            }}
          >
            {!hasConfirmedPaidSubscription ? (
              <button
                type="button"
                className="activate-plan-button"
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

            {/* NavegaÃ§Ã£o */}
            <nav className="nav" aria-label="Navegação principal">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-disabled={subscriptionStatus === "inactive" && item.requiresActiveSubscription}
                  aria-current={location.pathname === item.to ? "page" : undefined}
                  onClick={
                    subscriptionStatus === "inactive" && item.requiresActiveSubscription
                      ? handleBlockedNavigation
                      : undefined
                  }
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Help / Tutoriais button */}
            <button
              type="button"
              onClick={openTutoriais}
              aria-label="Tutoriais em vídeo"
              style={{
                position: "relative",
                width: 38,
                height: 38,
                borderRadius: "999px",
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                color: isTutoriaisOpen ? "#fff" : "#bfdbfe",
                border: `1px solid ${isTutoriaisOpen ? "rgba(96,165,250,.5)" : "rgba(96,165,250,.26)"}`,
                background: isTutoriaisOpen
                  ? "linear-gradient(135deg,rgba(59,130,246,.5),rgba(37,99,235,.42))"
                  : "linear-gradient(135deg,rgba(15,23,42,.72),rgba(30,41,59,.62))",
                transition: "border-color .2s, background .2s",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }} aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M9.2 9.3a2.8 2.8 0 0 1 5.4 1c0 1.9-2.8 2.3-2.8 4" />
                <circle cx="11.8" cy="17.4" r="0.5" fill="currentColor" stroke="none" />
              </svg>
              {/* pulse glow for new users */}
              {showTutorialBalloon && !isTutoriaisOpen && (
                <span style={{
                  position: "absolute", inset: -3, borderRadius: "999px", pointerEvents: "none",
                  animation: "tutHelpPulse 2s ease-in-out infinite",
                }} />
              )}
            </button>

            {!isMobile ? (
              <button
                type="button"
                onClick={() => navigate("/perfil")}
                aria-label="Abrir perfil"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 10px 6px 6px",
                  borderRadius: "10px",
                  border: "1px solid rgba(148, 163, 184, 0.18)",
                  background: "rgba(30, 41, 59, 0.6)",
                  color: "var(--text-main)",
                  cursor: "pointer",
                  transition: "0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                <span className="profile-avatar" style={{ width: 28, height: 28, fontSize: 11 }} aria-hidden="true">
                  {profilePhoto ? <img src={profilePhoto} alt="" /> : profileInitials}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{profileDisplayName}</span>
              </button>
            ) : null}
          </div>

        </div>
      </header>

      {isMobile ? (
        <>
          {/* Scrim behind popup */}
          {isQuickAddOpen ? (
            <div
              className="mobile-nav-scrim"
              aria-hidden="true"
              onClick={() => setIsQuickAddOpen(false)}
            />
          ) : null}

          {/* Bottom sheet menu */}
          <div
            ref={quickAddRef}
            className={`quick-add-sheet${isQuickAddOpen ? " is-open" : ""}`}
            role="menu"
            aria-label="Adicionar"
          >
            <div className="quick-add-sheet-handle" aria-hidden="true" />
            <div className="quick-add-sheet-title">Adicionar</div>
            <div className="quick-add-sheet-list">
              {location.pathname === "/groups" ? (
                <button type="button" className="quick-add-item" onClick={handleGroupExpenseQuickAdd}>
                  <span className="quick-add-item-icon" style={{ background: "rgba(96,165,250,.18)", color: "#60a5fa" }} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6"/><path d="M17.5 14.4A5.5 5.5 0 0 1 20.5 19.5"/></svg>
                  </span>
                  <span className="quick-add-item-text">
                    <span className="quick-add-item-title">Despesa de grupo</span>
                    <span className="quick-add-item-desc">Lançar gasto compartilhado</span>
                  </span>
                  <span className="quick-add-item-chevron" aria-hidden="true">›</span>
                </button>
              ) : (
                <>
                  <button type="button" className="quick-add-item" onClick={() => handleMobileRoute("/contas")}>
                    <span className="quick-add-item-icon" style={{ background: "rgba(59,130,246,.18)", color: "#60a5fa" }} aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-5h4v5h5V9.5"/></svg>
                    </span>
                    <span className="quick-add-item-text">
                      <span className="quick-add-item-title">Novo banco</span>
                      <span className="quick-add-item-desc">Cadastrar conta ou cartão</span>
                    </span>
                    <span className="quick-add-item-chevron" aria-hidden="true">›</span>
                  </button>

                  <button type="button" className="quick-add-item" onClick={() => handleMobileRoute("/cartao-credito")}>
                    <span className="quick-add-item-icon" style={{ background: "rgba(245,158,11,.18)", color: "#F59E0B" }} aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>
                    </span>
                    <span className="quick-add-item-text">
                      <span className="quick-add-item-title">Novo cartão de crédito</span>
                      <span className="quick-add-item-desc">Limite, fatura e vencimento</span>
                    </span>
                    <span className="quick-add-item-chevron" aria-hidden="true">›</span>
                  </button>

                  <button type="button" className="quick-add-item" onClick={() => { setIsQuickAddOpen(false); navigate("/cartao-credito"); }}>
                    <span className="quick-add-item-icon" style={{ background: "rgba(217,119,6,.22)", color: "#D97706" }} aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m6 13 6 6 6-6"/></svg>
                    </span>
                    <span className="quick-add-item-text">
                      <span className="quick-add-item-title">Gasto no cartão</span>
                      <span className="quick-add-item-desc">Lançar compra na fatura</span>
                    </span>
                    <span className="quick-add-item-chevron" aria-hidden="true">›</span>
                  </button>

                  <button type="button" className="quick-add-item" onClick={() => handleMobileRoute("/importar-ofx")}>
                    <span className="quick-add-item-icon" style={{ background: "rgba(139,92,246,.18)", color: "#a78bfa" }} aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </span>
                    <span className="quick-add-item-text">
                      <span className="quick-add-item-title">Importar extrato</span>
                      <span className="quick-add-item-desc">OFX, CSV, XLSX ou PDF</span>
                    </span>
                    <span className="quick-add-item-chevron" aria-hidden="true">›</span>
                  </button>

                  <button type="button" className="quick-add-item" onClick={() => { setIsQuickAddOpen(false); navigate("/contas"); window.dispatchEvent(new CustomEvent("conciliaai:open-transfer")); }}>
                    <span className="quick-add-item-icon" style={{ background: "rgba(20,184,166,.18)", color: "#2dd4bf" }} aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 0L3 8m4-4 4 4"/><path d="M17 8v12m0 0 4-4m-4 4-4-4"/></svg>
                    </span>
                    <span className="quick-add-item-text">
                      <span className="quick-add-item-title">Transferência</span>
                      <span className="quick-add-item-desc">Mover entre suas contas</span>
                    </span>
                    <span className="quick-add-item-chevron" aria-hidden="true">›</span>
                  </button>

                  <button type="button" className="quick-add-item" onClick={() => { setIsQuickAddOpen(false); setIsPhotoFlowOpen(true); }}>
                    <span className="quick-add-item-icon" style={{ background: "rgba(96,165,250,.18)", color: "#60a5fa" }} aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                    </span>
                    <span className="quick-add-item-text">
                      <span className="quick-add-item-title">Lançar por foto</span>
                      <span className="quick-add-item-desc">IA lê o recibo automaticamente</span>
                    </span>
                    <span className="quick-add-item-chevron quick-add-item-chevron-new" aria-hidden="true">NOVO</span>
                  </button>

                  <button type="button" className="quick-add-item" onClick={() => handleMobileRoute("/receitas")}>
                    <span className="quick-add-item-icon" style={{ background: "rgba(34,197,94,.16)", color: "#4ade80" }} aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="m6 11 6-6 6 6"/></svg>
                    </span>
                    <span className="quick-add-item-text">
                      <span className="quick-add-item-title">Nova receita</span>
                      <span className="quick-add-item-desc">Lançar entrada manual</span>
                    </span>
                    <span className="quick-add-item-chevron" aria-hidden="true">›</span>
                  </button>

                  <button type="button" className="quick-add-item" onClick={() => handleMobileRoute("/despesas")}>
                    <span className="quick-add-item-icon" style={{ background: "rgba(239,68,68,.16)", color: "#f87171" }} aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m6 13 6 6 6-6"/></svg>
                    </span>
                    <span className="quick-add-item-text">
                      <span className="quick-add-item-title">Nova despesa</span>
                      <span className="quick-add-item-desc">Lançar saída manual</span>
                    </span>
                    <span className="quick-add-item-chevron" aria-hidden="true">›</span>
                  </button>
                  <button type="button" className="quick-add-item" onClick={() => handleMobileRoute("/relatorios")}>
                    <span className="quick-add-item-icon" style={{ background: "rgba(99,102,241,.18)", color: "#a5b4fc" }} aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
                    </span>
                    <span className="quick-add-item-text">
                      <span className="quick-add-item-title">Relatórios</span>
                      <span className="quick-add-item-desc">Gráficos e exportar PDF</span>
                    </span>
                    <span className="quick-add-item-chevron" aria-hidden="true">›</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Curved bottom nav */}
          <nav className="mobile-bottom-nav" aria-label="Menu principal mobile">
            {/* Glow behind FAB */}
            <div className="mobile-nav-glow" aria-hidden="true" />

            {/* SVG curved background */}
            <svg
              className="mobile-nav-curve"
              viewBox="0 0 320 80"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="curveBarFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#0f172a" stopOpacity="0.97" />
                  <stop offset="1" stopColor="#080d19" stopOpacity="0.99" />
                </linearGradient>
              </defs>
              <path
                fill="url(#curveBarFill)"
                d="M0,22 L98,22 C124,22 120,54 160,54 C200,54 196,22 222,22 L320,22 L320,80 L0,80 Z"
              />
              <path
                fill="none"
                stroke="rgba(148,163,184,0.18)"
                strokeWidth="1.2"
                d="M0,22 L98,22 C124,22 120,54 160,54 C200,54 196,22 222,22 L320,22"
              />
            </svg>

            {/* Nav row */}
            <div className="mobile-nav-row">
              <button
                type="button"
                className={`mobile-nav-btn${location.pathname === "/dashboard" ? " is-active" : ""}`}
                onClick={() => handleMobileRoute("/dashboard")}
              >
                {NAV_ICONS.dashboard}
                <span>Início</span>
              </button>

              <button
                type="button"
                className={`mobile-nav-btn${location.pathname === "/categorias" ? " is-active" : ""}`}
                onClick={() => handleMobileRoute("/categorias")}
              >
                {NAV_ICONS.categorias}
                <span>Categorias</span>
              </button>

              {/* Central FAB */}
              <div className="mobile-fab-slot">
                <button
                  type="button"
                  className={`mobile-fab${isQuickAddOpen ? " is-open" : ""}`}
                  aria-label={isQuickAddOpen ? "Fechar lançamento rápido" : "Novo lançamento"}
                  aria-expanded={isQuickAddOpen}
                  onClick={handleQuickAddToggle}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 5v14" /><path d="M5 12h14" />
                  </svg>
                </button>
              </div>

              <button
                type="button"
                className={`mobile-nav-btn${location.pathname === "/groups" ? " is-active" : ""}`}
                onClick={() => handleMobileRoute("/groups", false)}
              >
                {NAV_ICONS.groups}
                <span>Grupos</span>
              </button>

              <button
                type="button"
                className={`mobile-nav-btn${location.pathname === "/planejamento" ? " is-active" : ""}`}
                aria-label="Planejamento"
                onClick={() => handleMobileRoute("/planejamento")}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
                </svg>
                <span>Planejamento</span>
              </button>
            </div>
          </nav>
        </>
      ) : null}

      {isPhotoFlowOpen ? (
        <PhotoFlow onClose={() => setIsPhotoFlowOpen(false)} />
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
                Ative seu plano e libere toda a experiencia
              </h2>
              <p style={{ margin: 0, fontSize: "16px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Continue com um plano ativo para usar sem bloqueios, manter seu historico sincronizado e acessar
                todos os recursos da plataforma.
              </p>
            </div>

            {isWaitingForPayment ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "18px",
                  padding: "32px 16px",
                  borderRadius: "18px",
                  border: "1px solid rgba(96, 165, 250, 0.25)",
                  background: "rgba(15, 23, 42, 0.65)",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    border: "3px solid rgba(96, 165, 250, 0.3)",
                    borderTopColor: "#60a5fa",
                    animation: "spin 1s linear infinite",
                  }}
                />
                <div style={{ display: "grid", gap: "8px" }}>
                  <strong style={{ fontSize: "18px", color: "#f1f5f9" }}>Aguardando pagamento...</strong>
                  <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8", lineHeight: 1.5 }}>
                    A fatura foi aberta em uma nova aba. Após pagar, você será redirecionado automaticamente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={stopPaymentPolling}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "10px",
                    border: "1px solid rgba(148, 163, 184, 0.18)",
                    background: "rgba(30, 41, 59, 0.7)",
                    color: "#94a3b8",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Cancelar
                </button>
              </div>
            ) : (
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
                        <li>
                          {plan.monthlyTransactionLimit === null
                            ? "Lancamentos ilimitados por mes"
                            : `Ate ${plan.monthlyTransactionLimit} lancamentos por mes`}
                        </li>
                        <li>
                          {plan.subcategoryLimit === null
                            ? "Subcategorias ilimitadas"
                            : plan.subcategoryLimit === 0
                            ? "Sem subcategorias"
                            : `Ate ${plan.subcategoryLimit} subcategoria${plan.subcategoryLimit > 1 ? "s" : ""}`}
                        </li>
                        <li>
                          {plan.groupLimit === null
                            ? "Grupos ilimitados"
                            : plan.groupLimit === 0
                            ? "Pode participar de grupos (sem criar)"
                            : `Ate ${plan.groupLimit} grupo${plan.groupLimit > 1 ? "s" : ""} criados`}
                        </li>
                        <li>Acesso completo ao dashboard e modulos financeiros</li>
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
                  Nenhum plano disponivel no momento.
                </div>
              ) : null}
            </div>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: "12px",
              }}
            >
              {!isWaitingForPayment ? (
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
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {showCpfModal ? (
        <div
          aria-live="polite"
          aria-modal="true"
          role="dialog"
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div style={{
            background: "#1e293b", borderRadius: 16, padding: 32, width: "90%", maxWidth: 380,
            display: "flex", flexDirection: "column", gap: 16,
          }}>
            <h2 style={{ color: "#f1f5f9", margin: 0, fontSize: 20 }}>Cadastro completo</h2>
            <p style={{ color: "#94a3b8", margin: 0, fontSize: 14 }}>
              Preencha seus dados para processar o pagamento. Estas informações ficam salvas no seu perfil.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                style={{
                  background: "#0f172a", border: "1px solid #334155", borderRadius: 10,
                  padding: "12px 16px", color: "#f1f5f9", fontSize: 16, outline: "none",
                }}
                placeholder="Nome completo"
                value={fullNameInput}
                autoComplete="name"
                onChange={(e) => setFullNameInput(e.target.value)}
              />
              <input
                style={{
                  background: "#0f172a", border: "1px solid #334155", borderRadius: 10,
                  padding: "12px 16px", color: "#f1f5f9", fontSize: 16, outline: "none",
                }}
                placeholder="CPF (000.000.000-00)"
                value={cpfInput}
                inputMode="numeric"
                onChange={(e) => setCpfInput(formatCpf(e.target.value))}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setShowCpfModal(false); setCpfInput(""); setFullNameInput(""); setPendingPlanId(null); }}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 10, border: "1px solid #334155",
                  background: "transparent", color: "#94a3b8", cursor: "pointer", fontSize: 15,
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (pendingPlanId) {
                    setShowCpfModal(false);
                    void handleSubscribe(pendingPlanId, cpfInput, fullNameInput);
                    setCpfInput("");
                    setFullNameInput("");
                    setPendingPlanId(null);
                  }
                }}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
                  background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: 15, fontWeight: 600,
                }}
              >
                Continuar
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

      {/* Onboarding balloon — shows once for new users */}
      {showTutorialBalloon && !isTutoriaisOpen && (
        <div style={{
          position: "fixed",
          top: isMobile ? 62 : 68,
          right: isMobile ? 56 : 80,
          width: 250,
          zIndex: 9980,
          animation: "tutBalloonIn .34s cubic-bezier(.16,1,.3,1) both",
        }}>
          {/* arrow pointing up */}
          <div style={{
            position: "absolute", top: -7, right: isMobile ? 4 : 168,
            width: 14, height: 14, rotate: "45deg",
            background: "linear-gradient(135deg,#1d6ff2,#2563eb)", borderRadius: 3,
          }} />
          <div style={{
            borderRadius: 16, padding: "14px 15px 13px",
            background: "linear-gradient(135deg,#2563eb,#1e40af)",
            border: "1px solid rgba(147,197,253,.4)",
            boxShadow: "0 22px 54px rgba(30,64,175,.5)", color: "#fff",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
              <span style={{ fontSize: 17 }}>👋</span>
              <strong style={{ fontFamily: "var(--display)", fontSize: 14.5, whiteSpace: "nowrap" }}>Novo por aqui?</strong>
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.4, color: "rgba(255,255,255,.9)", marginBottom: 11, margin: "0 0 11px" }}>
              Toque no <b>?</b> pra ver tutoriais rápidos em vídeo e dominar o app em minutos.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={openTutoriais}
                style={{
                  flex: 1, minHeight: 34, borderRadius: 10, border: 0, cursor: "pointer",
                  background: "#fff", color: "#1e3a8a", fontWeight: 800, fontSize: 12.5,
                }}
              >Ver tutoriais</button>
              <button
                type="button"
                onClick={dismissTutorialBalloon}
                style={{
                  minHeight: 34, padding: "0 11px", borderRadius: 10, cursor: "pointer",
                  background: "rgba(255,255,255,.14)", color: "#fff",
                  border: "1px solid rgba(255,255,255,.28)", fontWeight: 700, fontSize: 12.5,
                }}
              >Agora não</button>
            </div>
          </div>
        </div>
      )}

      {/* Tutoriais modal */}
      {isTutoriaisOpen && (
        <TutoriaisModal onClose={() => setIsTutoriaisOpen(false)} isMobile={isMobile} />
      )}

      {/* ConteÃºdo da pÃ¡gina */}
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

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .quick-add-dot-photo {
            background: #60A5FA;
            box-shadow: 0 0 8px #60A5FA;
          }

          @keyframes tutHelpPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(96,165,250,.5); }
            50% { box-shadow: 0 0 0 7px rgba(96,165,250,0); }
          }

          @keyframes tutBalloonIn {
            from { transform: translateY(-8px) scale(.97); opacity: 0; }
            to { transform: none; opacity: 1; }
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
// - Adiciona navegaÃ§Ã£o real (Dashboard/Receitas/Despesas/Groups)
// - MantÃ©m o conteÃºdo das pÃ¡ginas dentro de <main className="page">
*/





