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
import { completeOnboarding, hasCompletedOnboarding, type OnboardingAnswer } from "../lib/onboarding";
import { logClientEvent } from "../lib/clientLogger";
import "./onboarding.css";

type Question = {
  id: string;
  title: string;
  subtitle?: string;
  options: Array<{
    id: string;
    label: string;
    icon: string;
  }>;
};

const questions: Question[] = [
  {
    id: "financial_state",
    title: "Como esta sua relacao com o dinheiro hoje?",
    subtitle: "Suas respostas ajudam o Conciliaai a preparar um inicio mais util para voce.",
    options: [
      { id: "debt", label: "Estou organizando pendencias", icon: "!" },
      { id: "no_save", label: "Tenho controle, mas quase nao sobra", icon: "=" },
      { id: "save_little", label: "Consigo guardar um pouco por mes", icon: "+" },
      { id: "investing", label: "Ja guardo e quero evoluir melhor", icon: "$" },
    ],
  },
  {
    id: "main_pain",
    title: "Qual ponto mais atrapalha sua rotina financeira?",
    options: [
      { id: "unknown_spending", label: "Perco a visao dos gastos do mes", icon: "?" },
      { id: "cant_reduce", label: "Sei onde gasto, mas quero cortar excessos", icon: "-" },
      { id: "low_savings", label: "Quero guardar mais do que consigo hoje", icon: "%" },
      { id: "late_payments", label: "Preciso lembrar melhor contas e vencimentos", icon: "D" },
    ],
  },
  {
    id: "main_goal",
    title: "Qual resultado voce quer alcancar primeiro?",
    options: [
      { id: "understand", label: "Enxergar entradas e saidas com clareza", icon: "R$" },
      { id: "discover_problem", label: "Encontrar gastos que pesam no orcamento", icon: "L" },
      { id: "forecast", label: "Planejar os proximos meses com seguranca", icon: "30" },
      { id: "plan", label: "Criar um metodo simples de acompanhamento", icon: "+" },
      { id: "centralize", label: "Reunir tudo em um painel unico", icon: "1" },
    ],
  },
];

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
  const [answers, setAnswers] = useState<OnboardingAnswer[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(() => getSubscriptionStatus());
  const currentQuestion = questions[step];
  const isQuestionStep = step < questions.length;
  const tourIndex = step - questions.length;
  const isTourStep = !isQuestionStep && tourIndex < tourSteps.length;
  const isFinalStep = !isQuestionStep && !isTourStep;
  const progressTotal = questions.length + tourSteps.length + 1;
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

  function handleAnswer(option: Question["options"][number]) {
    if (!currentQuestion) return;

    setAnswers((current) => [
      ...current.filter((answer) => answer.questionId !== currentQuestion.id),
      {
        questionId: currentQuestion.id,
        optionId: option.id,
        label: option.label,
      },
    ]);
    setStep((current) => current + 1);
  }

  function goBack() {
    setFeedback(null);
    setStep((current) => Math.max(0, current - 1));
  }

  async function finish() {
    try {
      setLoading(true);
      setFeedback(null);
      completeOnboarding(answers);

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
        data: { answers },
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
    completeOnboarding(answers);
    navigate("/dashboard", { replace: true });
  }

  return (
    <main className="onboarding-screen">
      <section className="onboarding-card">
        <div className="onboarding-topbar">
          <button type="button" onClick={goBack} disabled={step === 0 || loading} aria-label="Voltar">
            ←
          </button>
          <span>{step + 1} de {progressTotal}</span>
          <button type="button" onClick={skipOnboarding} disabled={loading}>
            Pular
          </button>
        </div>

        <div className="onboarding-progress">
          <span style={{ width: `${progress}%` }} />
        </div>

        {isQuestionStep ? (
          <div className="onboarding-question">
            <h1>{currentQuestion.title}</h1>
            {currentQuestion.subtitle ? <p>{currentQuestion.subtitle}</p> : null}

            <div className="onboarding-options">
              {currentQuestion.options.map((option) => (
                <button key={option.id} type="button" onClick={() => handleAnswer(option)}>
                  <span>{option.icon}</span>
                  <strong>{option.label}</strong>
                  <small>›</small>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {isTourStep ? (
          <div className="onboarding-tour">
            <div className="onboarding-phone-preview">
              <div className="onboarding-phone-chart" />
              <span />
              <span />
              <span />
            </div>

            <div className="onboarding-tour-copy">
              <span>Primeiros passos</span>
              <h1>{tourSteps[tourIndex]}</h1>
              <p>Nada fica travado: depois voce troca categorias, datas e valores do seu jeito.</p>

              <button type="button" className="onboarding-primary" onClick={() => setStep((current) => current + 1)}>
                Continuar
              </button>
            </div>
          </div>
        ) : null}

        {isFinalStep ? (
          <div className="onboarding-final">
            <div className="onboarding-final-icon">✓</div>
            <h1>Seu painel esta pronto</h1>
            <p>Agora e so registrar os primeiros movimentos e acompanhar tudo pela visao geral.</p>
            {feedback ? <div className="onboarding-feedback">{feedback}</div> : null}
            <button type="button" className="onboarding-primary" onClick={finish} disabled={loading}>
              {loading ? "Preparando..." : finalButtonLabel}
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
