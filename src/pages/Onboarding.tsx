import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../lib/api";
import { readApiErrorMessage } from "../lib/apiError";
import { getSubscriptionStatus, persistSubscriptionState, type SubscriptionStatus } from "../lib/auth";
import { completeOnboarding, type OnboardingAnswer } from "../lib/onboarding";
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
    title: "Conta pra gente, qual sua situacao financeira atual?",
    subtitle: "Essas respostas vao ajudar a criar uma experiencia personalizada",
    options: [
      { id: "debt", label: "Tenho dividas", icon: "!" },
      { id: "no_save", label: "Nao tenho dividas, mas tambem nao consigo economizar", icon: "=" },
      { id: "save_little", label: "Ate que consigo economizar pouco", icon: "+" },
      { id: "investing", label: "Economizo e ja consigo investir", icon: "$" },
    ],
  },
  {
    id: "main_pain",
    title: "O que mais te tira o sono quando o assunto e dinheiro?",
    options: [
      { id: "unknown_spending", label: "Nao sei para onde o meu dinheiro vai", icon: "?" },
      { id: "cant_reduce", label: "Sei com o que gasto, mas nao consigo diminuir", icon: "-" },
      { id: "low_savings", label: "Economizo menos dinheiro do que gostaria", icon: "%" },
      { id: "late_payments", label: "Nunca lembro de pagar nas datas corretas", icon: "D" },
    ],
  },
  {
    id: "main_goal",
    title: "Chegou a hora de falar sobre suas expectativas. Qual seu principal objetivo?",
    options: [
      { id: "understand", label: "Entender minhas movimentacoes financeiras", icon: "R$" },
      { id: "discover_problem", label: "Descobrir o que mais prejudica minhas financas", icon: "L" },
      { id: "forecast", label: "Ter uma previsao e me preparar para gastos futuros", icon: "30" },
      { id: "plan", label: "Criar um planejamento financeiro personalizado", icon: "+" },
      { id: "centralize", label: "Centralizar meus gastos em uma so plataforma", icon: "1" },
    ],
  },
];

const tourSteps = [
  "Cadastre sua primeira receita para ver o saldo nascer.",
  "Registre despesas e separe tudo por categorias do seu jeito.",
  "Use o dashboard para comparar periodo, gastos e recebimentos.",
  "Crie grupos quando quiser dividir custos com outras pessoas.",
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
  const subscriptionStatus = getSubscriptionStatus();
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
    if (subscriptionStatus !== "active" && subscriptionStatus !== "trial") {
      setStep(questions.length + tourSteps.length);
      return;
    }
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
              <span>Tutorial rapido</span>
              <h1>{tourSteps[tourIndex]}</h1>
              <p>Voce pode ajustar tudo depois, mas esses passos deixam sua conta pronta para uso.</p>

              <button type="button" className="onboarding-primary" onClick={() => setStep((current) => current + 1)}>
                Continuar
              </button>
            </div>
          </div>
        ) : null}

        {isFinalStep ? (
          <div className="onboarding-final">
            <div className="onboarding-final-icon">✓</div>
            <h1>Tudo pronto para comecar</h1>
            <p>Seu painel vai abrir com receitas, despesas, categorias e dashboard prontos para voce alimentar.</p>
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
