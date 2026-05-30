import { useEffect, useMemo, useState } from "react";
import { logClientEvent } from "../lib/clientLogger";
import "./pwa-install-prompt.css";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIosDevice() {
  if (typeof window === "undefined") return false;

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export default function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(isStandaloneDisplay);
  const [dismissed, setDismissed] = useState(() =>
    typeof window === "undefined" ? false : window.sessionStorage.getItem("conciliaai_pwa_prompt_dismissed") === "1",
  );

  const shouldShowIosHint = useMemo(
    () => isIosDevice() && !isInstalled && !dismissed,
    [dismissed, isInstalled],
  );
  const shouldShowInstallButton = Boolean(installPrompt) && !isInstalled && !dismissed;

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setIsInstalled(isStandaloneDisplay());
      logClientEvent({
        event: "pwa.install.available",
        message: "Instalacao PWA disponivel",
      });
    }

    function handleAppInstalled() {
      setInstallPrompt(null);
      setIsInstalled(true);
      window.sessionStorage.setItem("conciliaai_pwa_prompt_dismissed", "1");
      logClientEvent({
        event: "pwa.install.finished",
        message: "App instalado como PWA",
      });
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    setIsInstalled(isStandaloneDisplay());
  }, []);

  function handleDismiss() {
    setDismissed(true);
    window.sessionStorage.setItem("conciliaai_pwa_prompt_dismissed", "1");
    logClientEvent({
      event: "pwa.install.dismiss",
      message: "Banner de instalacao PWA dispensado",
    });
  }

  async function handleInstall() {
    if (!installPrompt) return;

    logClientEvent({
      event: "pwa.install.click",
      message: "Clicou para instalar PWA",
    });

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    logClientEvent({
      event: "pwa.install.choice",
      message: "Resposta ao prompt de instalacao PWA",
      data: choice,
    });

    if (choice.outcome === "accepted") {
      setIsInstalled(true);
    } else {
      setDismissed(true);
      window.sessionStorage.setItem("conciliaai_pwa_prompt_dismissed", "1");
    }

    setInstallPrompt(null);
  }

  if (!shouldShowInstallButton && !shouldShowIosHint) {
    return null;
  }

  return (
    <aside className="pwa-install" aria-label="Instalar aplicativo">
      <div className="pwa-install__icon" aria-hidden="true">
        CA
      </div>

      <div className="pwa-install__copy">
        <strong>Instale o Conciliaaí</strong>
        <span>
          {shouldShowInstallButton
            ? "Abra mais rapido e use com cara de app no celular."
            : "No iPhone, toque em compartilhar e depois em Adicionar a Tela de Inicio."}
        </span>
      </div>

      {shouldShowInstallButton ? (
        <button type="button" className="pwa-install__button" onClick={handleInstall}>
          Instalar
        </button>
      ) : null}

      <button type="button" className="pwa-install__close" aria-label="Fechar aviso de instalacao" onClick={handleDismiss}>
        ×
      </button>
    </aside>
  );
}
