import { apiUrl } from "./api";

type ClientLogPayload = {
  event: string;
  message: string;
  data?: unknown;
};

function getStoredUser() {
  const userId = window.localStorage.getItem("conciliaai_userId") ?? window.localStorage.getItem("userId");
  const email = window.localStorage.getItem("conciliaai_email") ?? window.localStorage.getItem("email");
  const name = window.localStorage.getItem("conciliaai_name") ?? window.localStorage.getItem("name");
  const hasToken = Boolean(
    window.localStorage.getItem("token") ??
      window.localStorage.getItem("conciliaai_token") ??
      window.localStorage.getItem("auth_token") ??
      window.localStorage.getItem("accessToken") ??
      window.localStorage.getItem("jwt")
  );

  return {
    id: userId || null,
    email: email || null,
    name: name || null,
    hasToken,
  };
}

function getElementLabel(element: HTMLElement): string | null {
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel?.trim()) return ariaLabel.trim();

  const title = element.getAttribute("title");
  if (title?.trim()) return title.trim();

  const text = element.innerText || element.textContent;
  if (text?.trim()) return text.trim().replace(/\s+/g, " ").slice(0, 100);

  const placeholder = element.getAttribute("placeholder");
  if (placeholder?.trim()) return placeholder.trim();

  return null;
}

function describeElement(element: HTMLElement) {
  const interactive = element.closest("button,a,input,select,textarea,[role='button']") as HTMLElement | null;
  const target = interactive ?? element;

  return {
    tag: target.tagName.toLowerCase(),
    id: target.id || null,
    className: typeof target.className === "string" ? target.className.slice(0, 160) : null,
    label: getElementLabel(target),
    href: target instanceof HTMLAnchorElement ? target.href : null,
    inputType: target instanceof HTMLInputElement ? target.type : null,
    route: window.location.pathname,
  };
}

export function logClientEvent({ event, message, data }: ClientLogPayload): void {
  if (typeof window === "undefined") return;

  const payload = {
    at: new Date().toISOString(),
    event,
    message,
    data,
    url: window.location.href,
    userAgent: window.navigator.userAgent,
    user: getStoredUser(),
  };

  console.log("[client-log]", event, message, data ?? "");

  void fetch(apiUrl("/api/client-logs"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);
}

export function installGlobalClientLogger(): void {
  if (typeof window === "undefined") return;
  if ((window as unknown as { __conciliaaiClientLoggerInstalled?: boolean }).__conciliaaiClientLoggerInstalled) return;

  (window as unknown as { __conciliaaiClientLoggerInstalled?: boolean }).__conciliaaiClientLoggerInstalled = true;

  document.addEventListener(
    "click",
    (event) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      logClientEvent({
        event: "ui.click",
        message: "Clique na interface",
        data: describeElement(target),
      });
    },
    true
  );
}

