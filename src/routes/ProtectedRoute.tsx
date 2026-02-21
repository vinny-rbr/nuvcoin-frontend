import { Navigate } from "react-router-dom"; // Redirecionamento de rota
import type { ReactNode } from "react"; // Tipo do React para children

type Props = {
  children: ReactNode; // Conteúdo protegido que vai renderizar se estiver logado
};

export default function ProtectedRoute({ children }: Props) {
  // ✅ Regra simples de "logado" no mock:
  // - se existir alguma chave comum no localStorage, consideramos logado
  const hasToken = !!localStorage.getItem("token"); // Caso você salve token
  const hasUser = !!localStorage.getItem("user"); // Caso você salve user
  const hasAuth = localStorage.getItem("auth") === "true"; // Caso você salve auth=true
  const hasLogged = localStorage.getItem("logged") === "true"; // Caso você salve logged=true

  const isLoggedIn = hasToken || hasUser || hasAuth || hasLogged; // Se qualquer uma existir, entra

  // ❌ Se não estiver logado, manda pro login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />; // replace evita voltar pro protected pelo "voltar"
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