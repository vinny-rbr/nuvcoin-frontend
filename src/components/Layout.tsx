import "./layout.css"; // Importa o CSS do layout premium
import { Link } from "react-router-dom"; // Links sem recarregar a página

type Props = {
  children: React.ReactNode; // Tudo que vai dentro do layout (cada página)
};

export default function Layout({ children }: Props) {
  return (
    <div className="app-shell">
      {/* Topbar fixa com blur e cara de SaaS */}
      <header className="topbar">
        <div className="topbar-inner">
          {/* Marca do app */}
          <div className="brand">
            <span className="logo-dot" />
            <h1>NUVCOIN</h1>
            <span className="badge">Trial ativo</span>
          </div>

          {/* Navegação */}
          <nav className="nav">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/receitas">Receitas</Link>
            <Link to="/despesas">Despesas</Link>
          </nav>
        </div>
      </header>

      {/* Conteúdo da página */}
      <main className="page">{children}</main>
    </div>
  );
}

/*
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com

// O que esse Layout faz:
// - Cria uma Topbar premium (sticky + blur)
// - Centraliza tudo num container (max-width)
// - Adiciona navegação real (Dashboard/Receitas/Despesas)
// - Mantém o conteúdo das páginas dentro de <main className="page">
*/