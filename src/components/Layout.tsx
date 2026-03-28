import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Link } from "react-router-dom"; // Links sem recarregar a página

import "./layout.css"; // Importa o CSS do layout premium

type Props = {
  children: React.ReactNode; // Tudo que vai dentro do layout (cada página)
};

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/receitas", label: "Receitas" },
  { to: "/despesas", label: "Despesas" },
  { to: "/groups", label: "Groups" },
];

export default function Layout({ children }: Props) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;

    return window.innerWidth < 768;
  });
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 767px)");

    function handleMediaChange(event: MediaQueryListEvent) {
      setIsMobile(event.matches);
    }

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!mobileMenuRef.current) return;
      if (mobileMenuRef.current.contains(event.target as Node)) return;

      setIsMobileMenuOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMobileMenuOpen]);

  function handleMobileMenuToggle(event: ReactMouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setIsMobileMenuOpen((current) => !current);
  }

  function handleMobileMenuClose() {
    setIsMobileMenuOpen(false);
  }

  return (
    <div className="app-shell">
      {/* Topbar fixa com blur e cara de SaaS */}
      <header className="topbar">
        <div className="topbar-inner">
          {/* Marca do app */}
          <div className="brand-cluster">
            <div className="brand">
              <span className="logo-dot" />
              <h1>NUVCOIN</h1>
            </div>
            <span className="badge">Trial ativo</span>
          </div>

          {/* Navegação */}
          <nav className="nav" aria-label="Navegação principal">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mobile-nav-shell" ref={mobileMenuRef}>
            <button
              type="button"
              className={`mobile-menu-button${isMobileMenuOpen ? " is-open" : ""}`}
              aria-label={isMobileMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-panel"
              onClick={handleMobileMenuToggle}
            >
              <span className="mobile-menu-icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>

            <div
              id="mobile-nav-panel"
              className={`mobile-nav-menu${isMobileMenuOpen ? " is-open" : ""}`}
            >
              {navItems.map((item) => (
                <Link key={item.to} to={item.to} onClick={handleMobileMenuClose}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>

      {isMobile && isMobileMenuOpen ? (
        <div
          className="mobile-nav-overlay"
          aria-hidden="true"
          onClick={handleMobileMenuClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            background: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 39,
          }}
        />
      ) : null}

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
// - Adiciona navegação real (Dashboard/Receitas/Despesas/Groups)
// - Mantém o conteúdo das páginas dentro de <main className="page">
*/
