export const INACTIVE_SUBSCRIPTION_MESSAGE =
  "Sua conta não está ativa. Ative seu plano para acessar este recurso.";

const SUBSCRIPTION_STATE_EVENT = "nuvcoin_subscription_state_changed";

const SUBSCRIPTION_STORAGE_KEYS = [
  "nuvcoin_subscription_active",
  "subscriptionActive",
  "hasActiveSubscription",
  "isSubscriptionActive",
];

const API_RESPONSE_SUBSCRIPTION_KEYS = [
  "subscriptionActive",
  "hasActiveSubscription",
  "isSubscriptionActive",
  "subscriptionStatus",
  "subscription_status",
  "planStatus",
  "plan_status",
  "planActive",
  "plan_active",
  "isActive",
];

const ACTIVE_STATUS_VALUES = new Set(["active", "trialing", "trial", "paid"]);
const INACTIVE_STATUS_VALUES = new Set([
  "inactive",
  "canceled",
  "cancelled",
  "past_due",
  "expired",
  "unpaid",
  "blocked",
]);

function coerceBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
    if (normalized === "false" || normalized === "0" || normalized === "no") return false;
    if (ACTIVE_STATUS_VALUES.has(normalized)) return true;
    if (INACTIVE_STATUS_VALUES.has(normalized)) return false;
  }

  return null;
}

function readSubscriptionStateFromApiResponse(source: Record<string, unknown> | null): boolean | null {
  if (!source) return null;

  for (const key of API_RESPONSE_SUBSCRIPTION_KEYS) {
    const value = source[key];
    const parsed = coerceBoolean(value);
    if (parsed !== null) return parsed;
  }

  return null;
}

export function getSubscriptionActiveState(): boolean | null {
  if (typeof window === "undefined") return null;

  for (const key of SUBSCRIPTION_STORAGE_KEYS) {
    const storedValue = window.localStorage.getItem(key);
    const parsed = coerceBoolean(storedValue);
    if (parsed !== null) return parsed;
  }

  return null;
}

export function persistSubscriptionState(value: boolean | null): void {
  if (typeof window === "undefined") return;

  if (value === null) {
    window.localStorage.removeItem("nuvcoin_subscription_active");
    return;
  }

  window.localStorage.setItem("nuvcoin_subscription_active", value ? "true" : "false");
  window.dispatchEvent(new CustomEvent<boolean | null>(SUBSCRIPTION_STATE_EVENT, { detail: value }));
}

export function deriveSubscriptionActiveFromAuthData(data: unknown): boolean | null {
  if (!data || typeof data !== "object") return null;

  const source = data as Record<string, unknown>;
  return readSubscriptionStateFromApiResponse(source);
}

export function canAccessSubscriptionRoute(pathname: string): boolean {
  if (
    pathname === "/dashboard" ||
    pathname === "/receitas" ||
    pathname === "/despesas" ||
    pathname === "/groups"
  ) {
    return true;
  }

  return true;
}

export function subscribeToSubscriptionState(listener: (value: boolean | null) => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<boolean | null>;
    listener(customEvent.detail ?? getSubscriptionActiveState());
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key && !SUBSCRIPTION_STORAGE_KEYS.includes(event.key)) return;
    listener(getSubscriptionActiveState());
  };

  window.addEventListener(SUBSCRIPTION_STATE_EVENT, handleCustomEvent as EventListener);
  window.addEventListener("storage", handleStorageEvent);

  return () => {
    window.removeEventListener(SUBSCRIPTION_STATE_EVENT, handleCustomEvent as EventListener);
    window.removeEventListener("storage", handleStorageEvent);
  };
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  const candidates = ["token", "nuvcoin_token", "auth_token", "accessToken", "jwt"];

  for (const key of candidates) {
    const value = window.localStorage.getItem(key);
    if (value && value.trim().length > 0) return value;
  }

  return null;
}

export async function probeSubscriptionStateFromFinanceApi(): Promise<boolean | null> {
  if (typeof window === "undefined") return null;

  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch("/api/finance", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 403) {
      persistSubscriptionState(false);
      return false;
    }

    if (response.ok) {
      persistSubscriptionState(true);
      return true;
    }

    return null;
  } catch {
    return null;
  }
}
