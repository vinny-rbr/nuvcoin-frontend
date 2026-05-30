import type { SubscriptionStatus } from "./auth";

export type OnboardingAnswer = {
  questionId: string;
  optionId: string;
  label: string;
};

export type OnboardingState = {
  completed: boolean;
  completedAt?: string;
  answers: OnboardingAnswer[];
};

const ONBOARDING_EVENT = "conciliaai_onboarding_changed";

function getCurrentUserId(): string {
  if (typeof window === "undefined") return "anonymous";
  return window.localStorage.getItem("conciliaai_userId") || "anonymous";
}

export function getOnboardingStorageKey(userId = getCurrentUserId()): string {
  return `conciliaai_onboarding:${userId}`;
}

export function readOnboardingState(userId = getCurrentUserId()): OnboardingState {
  if (typeof window === "undefined") return { completed: false, answers: [] };

  const raw = window.localStorage.getItem(getOnboardingStorageKey(userId));
  if (!raw) return { completed: false, answers: [] };

  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      completed: Boolean(parsed.completed),
      completedAt: parsed.completedAt,
      answers: Array.isArray(parsed.answers) ? parsed.answers : [],
    };
  } catch {
    return { completed: false, answers: [] };
  }
}

export function hasCompletedOnboarding(userId = getCurrentUserId()): boolean {
  return readOnboardingState(userId).completed;
}

export function saveOnboardingState(state: OnboardingState, userId = getCurrentUserId()): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(getOnboardingStorageKey(userId), JSON.stringify(state));
  window.dispatchEvent(new CustomEvent<OnboardingState>(ONBOARDING_EVENT, { detail: state }));
}

export function completeOnboarding(answers: OnboardingAnswer[], userId = getCurrentUserId()): void {
  saveOnboardingState(
    {
      completed: true,
      completedAt: new Date().toISOString(),
      answers,
    },
    userId,
  );
}

export function getPostTrialPath(subscriptionStatus: SubscriptionStatus | null): string {
  if (subscriptionStatus === "active" || subscriptionStatus === "trial") {
    return hasCompletedOnboarding() ? "/dashboard" : "/onboarding";
  }

  return "/onboarding";
}
