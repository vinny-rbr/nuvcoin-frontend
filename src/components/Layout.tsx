import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import "./layout.css";

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    localStorage.removeItem("nuvcoin_mock_token");
    navigate("/login");
  }

  // Título do topo conforme rota atual
  const pageTitle =
    location.pathname === "/dashboard"
      ? "Visão geral"
      : location.pathname === "/receitas"
      ? "Receitas"
      : location.pathname === "/despesas"
      ? "Despesas"
      : location.pathname === "/config"
      ? "Configurações"
      : "Nuvcoin";

  return (
    <div className="layout">
      <aside className="sidebar">
        <div>
          <div className="sidebar-logo">
            <span className="logo-dot" />
            Nuvcoin
          </div>

          <nav className="sidebar-menu">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              <span className="sidebar-ico">📊</span>
              Dashboard
            </NavLink>

            <NavLink
              to="/receitas"
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              <span className="sidebar-ico">💰</span>
              Receitas
            </NavLink>

            <NavLink
              to="/despesas"
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              <span className="sidebar-ico">🧾</span>
              Despesas
            </NavLink>

            <NavLink
              to="/config"
              className={({ isActive }) =>
                isActive ? "sidebar-link active" : "sidebar-link"
              }
            >
              <span className="sidebar-ico">⚙️</span>
              Configurações
            </NavLink>

            <button
              onClick={handleLogout}
              className="sidebar-link sidebar-btn"
            >
              <span className="sidebar-ico">🚪</span>
              Sair
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">MVP • Mock Login • v0.1</div>
      </aside>

      <main className="content">
        <div className="content-top">
          <p className="content-title">{pageTitle}</p>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
