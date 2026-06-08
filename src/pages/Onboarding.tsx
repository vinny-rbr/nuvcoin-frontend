import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../lib/api";
import { readApiErrorMessage } from "../lib/apiError";
import {
  deriveSubscriptionStatusFromAuthData,
  getSubscriptionStatus,
  persistSubscriptionState,
  subscribeToSubscriptionStatus,
  type SubscriptionStatus,
} from "../lib/auth";
import { completeOnboarding, hasCompletedOnboarding } from "../lib/onboarding";
import { logClientEvent } from "../lib/clientLogger";
import "./onboarding.css";


const tourSteps = [
  "Comece por uma receita para o saldo ficar vivo.",
  "Lance despesas e use categorias com a sua linguagem.",
  "Compare periodos no dashboard e descubra padroes.",
  "Use grupos quando precisar dividir custos com alguem.",
];

type Plan = {
  id: string;
  name: string;
};

async function startTrial(): Promise<{ status: SubscriptionStatus; endDateUtc?: string | null }> {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Faca login novamente para iniciar o trial.");
  }

  const plansResponse = await fetch(apiUrl("/api/plans"), { method: "GET" });

  if (!plansResponse.ok) {
    const message = await readApiErrorMessage(plansResponse, "Nao foi possivel carregar os planos.");
    throw new Error(message);
  }

  const plans = (await plansResponse.json()) as Plan[];
  const trialPlanId = Array.isArray(plans) ? plans[0]?.id : null;

  if (!trialPlanId) {
    throw new Error("Nenhum plano ativo encontrado para iniciar o trial.");
  }

  const response = await fetch(apiUrl("/api/subscriptions/start-trial"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ planId: trialPlanId }),
  });

  if (!response.ok) {
    const message = await readApiErrorMessage(response, "Nao foi possivel iniciar o trial.");
    throw new Error(message);
  }

  const data = (await response.json()) as {
    subscriptionEndDateUtc?: string | null;
    endDateUtc?: string | null;
  };

  return {
    status: "trial",
    endDateUtc: data.subscriptionEndDateUtc ?? data.endDateUtc ?? null,
  };
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(() => getSubscriptionStatus());
  const isTourStep = step < tourSteps.length;
  const isFinalStep = !isTourStep;
  const progressTotal = tourSteps.length + 1;
  const progress = Math.round(((step + 1) / progressTotal) * 100);

  const finalButtonLabel = useMemo(() => {
    if (subscriptionStatus === "active" || subscriptionStatus === "trial") return "Abrir dashboard";
    return "Ativar teste e abrir dashboard";
  }, [subscriptionStatus]);

  useEffect(() => {
    return subscribeToSubscriptionStatus(setSubscriptionStatus);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function syncSubscriptionStatus() {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch(apiUrl("/api/subscriptions/me"), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = (await response.json()) as Record<string, unknown>;
        const nextStatus = deriveSubscriptionStatusFromAuthData(data);
        if (!nextStatus || !isMounted) return;

        persistSubscriptionState(nextStatus);
        setSubscriptionStatus(nextStatus);
      } catch {
        // Mantem o status local quando a rede falhar.
      }
    }

    void syncSubscriptionStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasCompletedOnboarding()) return;
    if (subscriptionStatus !== "active" && subscriptionStatus !== "trial") return;

    navigate("/dashboard", { replace: true });
  }, [navigate, subscriptionStatus]);

  function goBack() {
    setFeedback(null);
    setStep((current) => Math.max(0, current - 1));
  }

  async function finish() {
    try {
      setLoading(true);
      setFeedback(null);
      completeOnboarding([]);

      if (subscriptionStatus !== "active" && subscriptionStatus !== "trial") {
        const result = await startTrial();

        if (result.endDateUtc) {
          localStorage.setItem("subscriptionEndDateUtc", result.endDateUtc);
        }

        persistSubscriptionState(result.status);
      }

      logClientEvent({
        event: "onboarding.completed",
        message: "Onboarding concluido",
        data: {},
      });

      navigate("/dashboard", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nao foi possivel finalizar agora.";
      setFeedback(message);
    } finally {
      setLoading(false);
    }
  }

  function skipOnboarding() {
    completeOnboarding([]);
    navigate("/dashboard", { replace: true });
  }

  return (
    <main className="onb-page">
      <section className="onb-v2-card">
        <div className="onb-topbar">
          <button type="button" className="onb-back-btn" onClick={goBack} disabled={step === 0 || loading} aria-label="Voltar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <span className="onb-counter">{step + 1} de {progressTotal}</span>
          <button type="button" className="onb-skip-btn" onClick={skipOnboarding} disabled={loading}>Pular</button>
        </div>

        <div className="onb-progress-bar">
          <span style={{ width: `${progress}%` }} />
        </div>

        {isTourStep ? (
          <div className="onb-tour" key={step}>
            <div className="onb-tour-art">
              <div className="onboarding-phone-chart" />
              <span /><span /><span />
            </div>
            <div className="onb-tour-copy">
              <span className="onb-tour-tag">Passo {step + 1}</span>
              <h1>{tourSteps[step]}</h1>
              <p>Nada fica travado: depois você troca categorias, datas e valores do seu jeito.</p>
              <button type="button" className="auth-btn-primary" onClick={() => setStep((c) => c + 1)}>
                Continuar
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6"/>
                </svg>
              </button>
            </div>
          </div>
        ) : null}

        {isFinalStep ? (
          <div className="onb-final" key="final">
            <div className="onb-final-check" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h1>Seu painel está pronto</h1>
            <p>Agora é só registrar os primeiros movimentos e acompanhar tudo pela visão geral.</p>
            {feedback ? <div className="onboarding-feedback">{feedback}</div> : null}
            <button type="button" className="auth-btn-primary" onClick={finish} disabled={loading}>
              {loading ? "Preparando..." : finalButtonLabel}
              {!loading && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6"/>
                </svg>
              )}
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
