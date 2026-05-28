export const INACTIVE_SUBSCRIPTION_MESSAGE =
  "Sua conta não está ativa. Ative seu plano para acessar este recurso.";

const SUBSCRIPTION_STATE_EVENT = "nuvcoin_subscription_state_changed";

export type SubscriptionStatus = "active" | "trial" | "inactive";

const SUBSCRIPTION_STORAGE_KEYS = [
  "nuvcoin_subscription_active",
  "subscriptionActive",
  "hasActiveSubscription",
  "isSubscriptionActive",
];

const API_RESPONSE_SUBSCRIPTION_KEYS = [
  "subscriptionStatus",
  "subscription_status",
  "planStatus",
  "plan_status",
  "subscriptionActive",
  "hasActiveSubscription",
  "isSubscriptionActive",
  "planActive",
  "plan_active",
  "isActive",
];

const PAID_ACTIVE_STATUS_VALUES = new Set(["active", "paid"]);
const TRIAL_STATUS_VALUES = new Set(["trialing", "trial"]);
const INACTIVE_STATUS_VALUES = new Set([
  "inactive",
  "canceled",
  "cancelled",
  "past_due",
  "expired",
  "unpaid",
  "blocked",
]);

function normalizeSubscriptionStatus(value: unknown): SubscriptionStatus | null {
  if (typeof value === "boolean") {
    return value ? "active" : "inactive";
  }

  if (typeof value === "number") {
    if (value === 1) return "active";
    if (value === 0) return "inactive";
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true" || normalized === "1" || normalized === "yes") return "active";
    if (normalized === "false" || normalized === "0" || normalized === "no") return "inactive";
    if (PAID_ACTIVE_STATUS_VALUES.has(normalized)) return "active";
    if (TRIAL_STATUS_VALUES.has(normalized)) return "trial";
    if (INACTIVE_STATUS_VALUES.has(normalized)) return "inactive";
  }

  return null;
}

function readSubscriptionStatusFromApiResponse(source: Record<string, unknown> | null): SubscriptionStatus | null {
  if (!source) return null;

  for (const key of API_RESPONSE_SUBSCRIPTION_KEYS) {
    const value = source[key];
    const parsed = normalizeSubscriptionStatus(value);
    if (parsed !== null) return parsed;
  }

  return null;
}

function isActiveSubscriptionStatus(status: SubscriptionStatus | null): boolean | null {
  if (status === null) return null;

  return status === "active" || status === "trial";
}

export function getSubscriptionStatus(): SubscriptionStatus | null {
  if (typeof window === "undefined") return null;

  for (const key of SUBSCRIPTION_STORAGE_KEYS) {
    const storedValue = window.localStorage.getItem(key);
    const parsed = normalizeSubscriptionStatus(storedValue);
    if (parsed !== null) return parsed;
  }

  return null;
}

export function getSubscriptionActiveState(): boolean | null {
  return isActiveSubscriptionStatus(getSubscriptionStatus());
}

export function persistSubscriptionState(value: SubscriptionStatus | boolean | null): void {
  if (typeof window === "undefined") return;

  const normalizedValue =
    typeof value === "boolean"
      ? value
        ? "active"
        : "inactive"
      : value;

  if (value === null) {
    window.localStorage.removeItem("nuvcoin_subscription_active");
    return;
  }

  if (normalizedValue === null) return;

  window.localStorage.setItem("nuvcoin_subscription_active", normalizedValue);
  window.dispatchEvent(new CustomEvent<SubscriptionStatus | null>(SUBSCRIPTION_STATE_EVENT, { detail: normalizedValue }));
}

export function deriveSubscriptionStatusFromAuthData(data: unknown): SubscriptionStatus | null {
  if (!data || typeof data !== "object") return null;

  const source = data as Record<string, unknown>;
  return readSubscriptionStatusFromApiResponse(source);
}

export function deriveSubscriptionActiveFromAuthData(data: unknown): boolean | null {
  return isActiveSubscriptionStatus(deriveSubscriptionStatusFromAuthData(data));
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
  return subscribeToSubscriptionStatus((status) => {
    listener(isActiveSubscriptionStatus(status));
  });
}

export function subscribeToSubscriptionStatus(listener: (value: SubscriptionStatus | null) => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<SubscriptionStatus | null>;
    listener(customEvent.detail ?? getSubscriptionStatus());
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key && !SUBSCRIPTION_STORAGE_KEYS.includes(event.key)) return;
    listener(getSubscriptionStatus());
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
      return null;
    }

    return null;
  } catch {
    return null;
  }
}
