import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css"; // Importa o CSS profissional

type SubscriptionInfo = {
  status: string;
  endDateUtc?: string;
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("nuvcoin_mock_token");

        const response = await fetch("/api/subscriptions/me", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (!response.ok) {
          throw new Error();
        }

        const data = await response.json();
        setSub(data);
      } catch {
        setSub({
          status: "Trial (mock)",
        });
        setError("Backend ainda não conectado (modo mock).");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("nuvcoin_mock_token");
    navigate("/login");
  };

  const email = localStorage.getItem("nuvcoin_email");

  return (
    <div className="dash-wrap">
      {/* Topo */}
      <div className="dash-top">
        <div>
          <h1 className="dash-title">Dashboard</h1>
          <p className="dash-subtitle">
            Bem-vindo {email ?? "usuário"} 👋
          </p>
        </div>

        <button className="btn btn-ghost" onClick={handleLogout}>
          Sair
        </button>
      </div>

      {/* Cards */}
      <div className="dash-grid">
        {/* Card Status */}
        <div className="card">
          <h3 className="card-title">Status da Assinatura</h3>

          {loading ? (
            <p className="big">Carregando...</p>
          ) : (
            <>
              <p className="big">{sub?.status}</p>

              <div className="hr"></div>

              <p className="muted">
                Válido até: {sub?.endDateUtc ?? "Sem data (mock)"}
              </p>

              {error && (
                <div style={{ marginTop: 10 }}>
                  <span className="badge">Modo Mock</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Card Resumo Financeiro (placeholder) */}
        <div className="card">
          <h3 className="card-title">Resumo Financeiro</h3>

          <p className="big">R$ 0,00</p>

          <div className="hr"></div>

          <p className="muted">
            Em breve: receitas, despesas e gráficos.
          </p>
        </div>

        {/* Card Próximos Passos */}
        <div className="card">
          <h3 className="card-title">Próximos Passos</h3>

          <p className="muted">
            Conectar backend real (JWT + Trial automático).
          </p>

          <div className="hr"></div>

          <p className="muted">
            Adicionar sidebar e layout completo.
          </p>
        </div>
      </div>
    </div>
  );
}
