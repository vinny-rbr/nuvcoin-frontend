import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom"; // Redirecionamento de rota
import type { ReactNode } from "react"; // Tipo do React para children
import { apiUrl } from "../lib/api";
import {
  deriveSubscriptionStatusFromAuthData,
  getSubscriptionStatus,
  INACTIVE_SUBSCRIPTION_MESSAGE,
  persistSubscriptionState,
  subscribeToSubscriptionStatus,
  type SubscriptionStatus,
} from "../lib/auth";

type Props = {
  children: ReactNode; // Conteúdo protegido que vai renderizar se estiver logado
  requireActiveSubscription?: boolean; // Exige assinatura ativa para acessar
};

export default function ProtectedRoute({ children, requireActiveSubscription = false }: Props) {
  // ✅ Regra simples de "logado" no mock:
  // - se existir alguma chave comum no localStorage, consideramos logado
  const hasToken = !!localStorage.getItem("token"); // Caso você salve token
  const hasUser = !!localStorage.getItem("user"); // Caso você salve user
  const hasAuth = localStorage.getItem("auth") === "true"; // Caso você salve auth=true
  const hasLogged = localStorage.getItem("logged") === "true"; // Caso você salve logged=true

  const isLoggedIn = hasToken || hasUser || hasAuth || hasLogged; // Se qualquer uma existir, entra
  const location = useLocation();
  const hasShownInactiveAlertRef = useRef(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(() =>
    getSubscriptionStatus(),
  );
  const [isCheckingSubscriptionStatus, setIsCheckingSubscriptionStatus] = useState(
    () => requireActiveSubscription && getSubscriptionStatus() === null,
  );

  useEffect(() => {
    return subscribeToSubscriptionStatus(setSubscriptionStatus);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !requireActiveSubscription || subscriptionStatus !== null) {
      setIsCheckingSubscriptionStatus(false);
      return;
    }

    let isMounted = true;

    async function validateSubscription() {
      const token = localStorage.getItem("token");

      if (!token) {
        if (isMounted) setIsCheckingSubscriptionStatus(false);
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
          persistSubscriptionState("inactive");
          if (isMounted) setSubscriptionStatus("inactive");
          return;
        }

        const data = (await response.json()) as Record<string, unknown>;
        const nextStatus = deriveSubscriptionStatusFromAuthData(data) ?? "inactive";

        persistSubscriptionState(nextStatus);
        if (isMounted) setSubscriptionStatus(nextStatus);
      } catch {
        persistSubscriptionState("inactive");
        if (isMounted) setSubscriptionStatus("inactive");
      } finally {
        if (isMounted) setIsCheckingSubscriptionStatus(false);
      }
    }

    setIsCheckingSubscriptionStatus(true);
    void validateSubscription();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, requireActiveSubscription, subscriptionStatus]);

  useEffect(() => {
    if (!requireActiveSubscription || subscriptionStatus !== "inactive") {
      hasShownInactiveAlertRef.current = false;
      return;
    }

    if (!hasShownInactiveAlertRef.current) {
      hasShownInactiveAlertRef.current = true;
      window.alert(INACTIVE_SUBSCRIPTION_MESSAGE);
    }
  }, [requireActiveSubscription, subscriptionStatus, location.pathname]);

  // ❌ Se não estiver logado, manda pro login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />; // replace evita voltar pro protected pelo "voltar"
  }

  if (requireActiveSubscription && isCheckingSubscriptionStatus) {
    return null;
  }

  if (requireActiveSubscription && subscriptionStatus === "inactive") {
    return <Navigate to="/groups" replace state={{ from: location }} />;
  }

  // ✅ Se estiver logado, renderiza o conteúdo protegido (Layout + Página)
  return <>{children}</>; // Renderiza exatamente o que foi passado dentro do ProtectedRoute
}

/*
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com

// O que esse ProtectedRoute faz:
// - Verifica se o usuário está "logado" usando chaves comuns do localStorage
// - Se não estiver, redireciona para /login
// - Se estiver, renderiza o conteúdo (children)
*/


