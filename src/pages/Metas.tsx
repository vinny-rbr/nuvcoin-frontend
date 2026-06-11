import { useState, useEffect, useCallback } from "react";
import { apiUrl } from "../lib/api";

type Goal = {
  id: string;
  title: string;
  targetCents: number;
  currentCents: number;
  deadline: string | null;
  emoji: string;
};

function fmtBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function authHeaders() {
  const token = localStorage.getItem("token") ?? "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

const EMOJIS = ["🎯","🏠","🚗","✈️","💍","🎓","💻","📱","🏖️","💰","🐾","🎸","⛵","🏋️","👶"];

export default function Metas() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [depositId, setDepositId] = useState<string | null>(null);
  const [depositValue, setDepositValue] = useState("");
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formTarget, setFormTarget] = useState("");
  const [formDeadline, setFormDeadline] = useState("");
  const [formEmoji, setFormEmoji] = useState("🎯");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/goals"), { headers: authHeaders() });
      if (res.ok) {
        const data: Goal[] = await res.json();
        setGoals(Array.isArray(data) ? data : []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchGoals(); }, [fetchGoals]);

  function openCreate() {
    setEditGoal(null);
    setFormTitle("");
    setFormTarget("");
    setFormDeadline("");
    setFormEmoji("🎯");
    setError(null);
    setFormOpen(true);
  }

  function openEdit(g: Goal) {
    setEditGoal(g);
    setFormTitle(g.title);
    setFormTarget(String(g.targetCents / 100));
    setFormDeadline(g.deadline ?? "");
    setFormEmoji(g.emoji);
    setError(null);
    setFormOpen(true);
  }

  async function handleSave() {
    const targetCents = Math.round(parseFloat(formTarget.replace(",", ".")) * 100);
    if (!formTitle.trim() || isNaN(targetCents) || targetCents <= 0) {
      setError("Preencha o título e o valor alvo.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = { title: formTitle.trim(), targetCents, deadline: formDeadline || undefined, emoji: formEmoji };
      const url = editGoal ? apiUrl(`/api/goals/${editGoal.id}`) : apiUrl("/api/goals");
      const method = editGoal ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
      if (!res.ok) throw new Error("Erro ao salvar.");
      setFormOpen(false);
      await fetchGoals();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeposit(goalId: string) {
    const amountCents = Math.round(parseFloat(depositValue.replace(",", ".")) * 100);
    if (isNaN(amountCents) || amountCents <= 0) return;
    setSaving(true);
    try {
      await fetch(apiUrl(`/api/goals/${goalId}/deposit`), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ amountCents }),
      });
      setDepositId(null);
      setDepositValue("");
      await fetchGoals();
    } catch { /* ignore */ }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta meta?")) return;
    await fetch(apiUrl(`/api/goals/${id}`), { method: "DELETE", headers: authHeaders() });
    await fetchGoals();
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>Metas financeiras</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
            Defina objetivos e acompanhe sua evolução
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 18px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
            color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}
        >
          + Nova meta
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#64748b", padding: 40 }}>Carregando...</div>
      ) : goals.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "40px 20px",
          background: "rgba(30,41,59,.5)", borderRadius: 16,
          border: "1px dashed rgba(148,163,184,.2)", color: "#64748b",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#94a3b8" }}>Nenhuma meta criada</p>
          <p style={{ margin: "6px 0 0", fontSize: 13 }}>Crie sua primeira meta e comece a poupar com objetivo.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {goals.map(g => {
            const pct = g.targetCents > 0 ? Math.min(100, (g.currentCents / g.targetCents) * 100) : 0;
            const done = g.currentCents >= g.targetCents;
            const remaining = Math.max(0, g.targetCents - g.currentCents);
            return (
              <div key={g.id} style={{
                background: done ? "rgba(34,197,94,.07)" : "rgba(30,41,59,.65)",
                borderRadius: 18, padding: "18px 20px",
                border: `1px solid ${done ? "rgba(34,197,94,.3)" : "rgba(148,163,184,.12)"}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 28 }}>{g.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: "#f1f5f9" }}>{g.title}</div>
                      {g.deadline && (
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                          Prazo: {new Date(g.deadline + "T12:00:00").toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" onClick={() => openEdit(g)} style={iconBtnStyle} title="Editar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button type="button" onClick={() => handleDelete(g.id)} style={{ ...iconBtnStyle, color: "#f87171" }} title="Excluir">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ color: "#94a3b8" }}>
                      {fmtBRL(g.currentCents)} <span style={{ color: "#64748b" }}>de {fmtBRL(g.targetCents)}</span>
                    </span>
                    <span style={{ fontWeight: 700, color: done ? "#4ade80" : "#f1f5f9" }}>
                      {done ? "✓ Concluída!" : `${pct.toFixed(0)}%`}
                    </span>
                  </div>
                  <div style={{ height: 10, borderRadius: 999, background: "rgba(148,163,184,.1)", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 999, width: `${pct}%`,
                      background: done ? "#22c55e" : "linear-gradient(90deg,#8b5cf6,#6d28d9)",
                      transition: "width .5s ease",
                    }} />
                  </div>
                  {!done && <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Faltam {fmtBRL(remaining)}</div>}
                </div>

                {/* Deposit UI */}
                {!done && (
                  depositId === g.id ? (
                    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                      <input
                        value={depositValue}
                        onChange={e => setDepositValue(e.target.value)}
                        placeholder="Valor (R$)"
                        inputMode="decimal"
                        style={{ ...inputStyle, flex: 1, fontSize: 14, padding: "9px 12px" }}
                        autoFocus
                      />
                      <button type="button" onClick={() => handleDeposit(g.id)} disabled={saving} style={{
                        padding: "9px 16px", borderRadius: 10, border: "none",
                        background: "#8b5cf6", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13,
                      }}>
                        {saving ? "..." : "Guardar"}
                      </button>
                      <button type="button" onClick={() => { setDepositId(null); setDepositValue(""); }} style={{
                        padding: "9px 12px", borderRadius: 10, border: "1px solid rgba(148,163,184,.2)",
                        background: "transparent", color: "#94a3b8", cursor: "pointer",
                      }}>✕</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => { setDepositId(g.id); setDepositValue(""); }} style={{
                      marginTop: 12, padding: "8px 16px", borderRadius: 10,
                      border: "1px solid rgba(139,92,246,.35)", background: "rgba(139,92,246,.1)",
                      color: "#a78bfa", fontWeight: 600, fontSize: 13, cursor: "pointer",
                    }}>
                      + Guardar dinheiro
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      {formOpen && (
        <div
          onClick={() => setFormOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9998,
            background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 420,
              background: "linear-gradient(180deg,rgba(15,23,42,.98),rgba(30,41,59,.96))",
              borderRadius: 20, padding: 28, display: "grid", gap: 16,
              border: "1px solid rgba(148,163,184,.18)",
              boxShadow: "0 30px 80px rgba(0,0,0,.45)",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>
              {editGoal ? "Editar meta" : "Nova meta"}
            </h2>

            {/* Emoji picker */}
            <div>
              <label style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: 8 }}>Emoji</label>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {EMOJIS.map(e => (
                  <button
                    key={e} type="button"
                    onClick={() => setFormEmoji(e)}
                    style={{
                      fontSize: 22, borderRadius: 10, border: `2px solid ${formEmoji === e ? "#8b5cf6" : "transparent"}`,
                      background: formEmoji === e ? "rgba(139,92,246,.2)" : "rgba(148,163,184,.08)",
                      cursor: "pointer", padding: "4px 6px", lineHeight: 1,
                    }}
                  >{e}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>Título</label>
              <input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="Ex: Viagem para Europa" style={inputStyle} />
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>Valor alvo (R$)</label>
              <input value={formTarget} onChange={e => setFormTarget(e.target.value)} placeholder="Ex: 10000" inputMode="decimal" style={inputStyle} />
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>Prazo (opcional)</label>
              <input type="date" value={formDeadline} onChange={e => setFormDeadline(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />
            </div>

            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)",
                color: "#fca5a5", fontSize: 13,
              }}>{error}</div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setFormOpen(false)} style={cancelBtnStyle}>Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving} style={{
                ...saveBtnStyle,
                background: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
              }}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: "rgba(148,163,184,.1)", border: "none", color: "#94a3b8",
  borderRadius: 8, width: 28, height: 28, cursor: "pointer", fontSize: 12,
  display: "flex", alignItems: "center", justifyContent: "center",
};

const inputStyle: React.CSSProperties = {
  background: "#0f172a", border: "1px solid rgba(148,163,184,.2)", borderRadius: 10,
  padding: "12px 14px", color: "#f1f5f9", fontSize: 15, outline: "none", width: "100%",
  boxSizing: "border-box",
};

const cancelBtnStyle: React.CSSProperties = {
  flex: 1, padding: "12px 0", borderRadius: 12, border: "1px solid rgba(148,163,184,.18)",
  background: "rgba(30,41,59,.7)", color: "#94a3b8", cursor: "pointer", fontWeight: 600,
};

const saveBtnStyle: React.CSSProperties = {
  flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
  background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff",
  cursor: "pointer", fontWeight: 700,
};
