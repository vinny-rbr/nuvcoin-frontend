import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../lib/api";

interface Suggestion {
  id: string;
  text: string;
  createdAtUtc: string;
  userName: string;
  userEmail: string;
}

export default function AdminSugestoes() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }

    fetch(apiUrl("/api/suggestions"), { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (r.status === 403) throw new Error("Acesso negado");
        if (!r.ok) throw new Error("Erro ao carregar");
        return r.json() as Promise<Suggestion[]>;
      })
      .then(setRows)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }, [navigate]);

  return (
    <div style={{ minHeight: "100dvh", background: "#0a0f1e", color: "#f1f5f9", padding: "24px 16px 48px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            width: 36, height: 36, borderRadius: 10, border: "1px solid rgba(148,163,184,.18)",
            background: "rgba(30,41,59,.6)", color: "#94a3b8", cursor: "pointer",
            display: "grid", placeItems: "center",
          }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontSize: 22, fontWeight: 700, margin: 0 }}>
            Sugestões dos usuários
          </h1>
          <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{rows.length} registros</p>
        </div>
      </div>

      {loading && (
        <div style={{ color: "#64748b", textAlign: "center", paddingTop: 60 }}>Carregando...</div>
      )}
      {error && (
        <div style={{ color: "#f87171", textAlign: "center", paddingTop: 60, fontSize: 15 }}>{error}</div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div style={{ color: "#64748b", textAlign: "center", paddingTop: 60 }}>Nenhuma sugestão ainda.</div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map((s) => (
            <div
              key={s.id}
              style={{
                borderRadius: 16, padding: 18,
                background: "rgba(30,41,59,0.5)",
                border: "1px solid rgba(148,163,184,.12)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{s.userName || "—"}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>{s.userEmail}</div>
                </div>
                <div style={{ fontSize: 11.5, color: "#64748b", whiteSpace: "nowrap" }}>
                  {new Date(s.createdAtUtc).toLocaleString("pt-BR")}
                </div>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#e2e8f0" }}>{s.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
