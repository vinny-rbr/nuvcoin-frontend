import { Navigate, Outlet } from "react-router-dom"; 
// Importa componentes do React Router:
// - Navigate → redireciona
// - Outlet → renderiza a rota filha protegida

// Função que verifica se existe "login mock"
export function isMockLoggedIn(): boolean {
  const token = localStorage.getItem("nuvcoin_mock_token"); 
  // Busca no navegador um token salvo

  return Boolean(token); 
  // Se existir token → true
  // Se não existir → false
}

// Componente que protege rotas
export default function ProtectedRoute() {

  // Se NÃO estiver logado
  if (!isMockLoggedIn()) {
    return <Navigate to="/login" replace />;
    // Redireciona automaticamente para a página de login
  }

  // Se estiver logado
  return <Outlet />;
  // Libera acesso à rota filha (ex: /dashboard)
}
