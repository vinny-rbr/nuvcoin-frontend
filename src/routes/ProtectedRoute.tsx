import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom"; // Redirecionamento de rota
import type { ReactNode } from "react"; // Tipo do React para children
import {
  getSubscriptionActiveState,
  INACTIVE_SUBSCRIPTION_MESSAGE,
  subscribeToSubscriptionState,
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
  const [subscriptionState, setSubscriptionState] = useState<boolean | null>(() =>
    getSubscriptionActiveState(),
  );

  useEffect(() => {
    return subscribeToSubscriptionState(setSubscriptionState);
  }, []);

  useEffect(() => {
    if (!requireActiveSubscription || subscriptionState !== false) {
      hasShownInactiveAlertRef.current = false;
      return;
    }

    if (!hasShownInactiveAlertRef.current) {
      hasShownInactiveAlertRef.current = true;
      window.alert(INACTIVE_SUBSCRIPTION_MESSAGE);
    }
  }, [requireActiveSubscription, subscriptionState, location.pathname]);

  // ❌ Se não estiver logado, manda pro login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />; // replace evita voltar pro protected pelo "voltar"
  }

  if (requireActiveSubscription && subscriptionState === false) {
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
