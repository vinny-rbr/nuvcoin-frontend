import { useEffect, useState } from "react";

type AppVersionPayload = {
  version?: string;
  buildId?: string;
  builtAt?: string;
};

const VERSION_STORAGE_KEY = "conciliaai_current_build_id";
const CHECK_INTERVAL_MS = 60_000;

async function fetchVersion(): Promise<AppVersionPayload | null> {
  const response = await fetch(`/version.json?t=${Date.now()}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) return null;
  return (await response.json()) as AppVersionPayload;
}

export default function AppUpdatePrompt() {
  const [availableVersion, setAvailableVersion] = useState<AppVersionPayload | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkVersion() {
      try {
        const remoteVersion = await fetchVersion();
        const remoteBuildId = remoteVersion?.buildId;

        if (!remoteBuildId || cancelled) return;

        const storedBuildId = window.localStorage.getItem(VERSION_STORAGE_KEY);

        if (!storedBuildId) {
          window.localStorage.setItem(VERSION_STORAGE_KEY, remoteBuildId);
          return;
        }

        if (storedBuildId !== remoteBuildId) {
          setAvailableVersion(remoteVersion);
        }
      } catch {
        // Silent: update checks should never interrupt app usage.
      }
    }

    void checkVersion();

    const intervalId = window.setInterval(checkVersion, CHECK_INTERVAL_MS);
    const handleFocus = () => void checkVersion();
    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("focus", handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  if (!availableVersion?.buildId) return null;

  function handleUpdate() {
    if (availableVersion?.buildId) {
      window.localStorage.setItem(VERSION_STORAGE_KEY, availableVersion.buildId);
    }

    window.localStorage.setItem("conciliaai_pending_whats_new", "1");
    window.location.reload();
  }

  return (
    <div className="app-update-toast" role="status" aria-live="polite">
      <div>
        <strong>Atualizacao disponivel</strong>
        <span>Tem uma versao nova do Conciliaai pronta para carregar.</span>
      </div>
      <button type="button" onClick={handleUpdate}>
        Atualizar
      </button>
    </div>
  );
}
