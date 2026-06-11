import { useState, useEffect, useCallback } from "react";
import { apiUrl } from "../lib/api";

type Budget = {
  id: string;
  monthKey: string;
  category: string;
  limitCents: number;
};

type FinanceItem = {
  type: string;
  category: string;
  amountCents: number;
  dateISO: string;
};

function fmtBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function prevMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(key: string) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function authHeaders() {
  const token = localStorage.getItem("token") ?? "";
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

export default function Orcamento() {
  const [monthKey, setMonthKey] = useState(currentMonthKey);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spendMap, setSpendMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // form state
  const [formOpen, setFormOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [formCategory, setFormCategory] = useState("");
  const [formLimit, setFormLimit] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, fRes] = await Promise.all([
        fetch(apiUrl(`/api/budgets?monthKey=${monthKey}`), { headers: authHeaders() }),
        fetch(apiUrl("/api/finance"), { headers: authHeaders() }),
      ]);
      const bRows: Budget[] = bRes.ok ? await bRes.json() : [];
      const fRows: FinanceItem[] = fRes.ok ? (await fRes.json() as { items?: FinanceItem[] }).items ?? [] : [];

      setBudgets(Array.isArray(bRows) ? bRows : []);

      const map: Record<string, number> = {};
      for (const item of fRows) {
        if (item.type !== "DESPESA") continue;
        if (!item.dateISO.startsWith(monthKey)) continue;
        const cat = item.category.split(">")[0].trim();
        map[cat] = (map[cat] ?? 0) + item.amountCents;
      }
      setSpendMap(map);
    } catch {
      setError("Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  function openCreate() {
    setEditBudget(null);
    setFormCategory("");
    setFormLimit("");
    setError(null);
    setFormOpen(true);
  }

  function openEdit(b: Budget) {
    setEditBudget(b);
    setFormCategory(b.category);
    setFormLimit(String(b.limitCents / 100));
    setError(null);
    setFormOpen(true);
  }

  async function handleSave() {
    const limitCents = Math.round(parseFloat(formLimit.replace(",", ".")) * 100);
    if (!formCategory.trim() || isNaN(limitCents) || limitCents <= 0) {
      setError("Preencha categoria e limite válido.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(apiUrl("/api/budgets"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ monthKey, category: formCategory.trim(), limitCents }),
      });
      if (!res.ok) throw new Error("Erro ao salvar.");
      setFormOpen(false);
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este orçamento?")) return;
    await fetch(apiUrl(`/api/budgets/${id}`), { method: "DELETE", headers: authHeaders() });
    await fetchData();
  }

  // All categories with budgets + all categories with spend this month
  const allCategories = Array.from(new Set([
    ...budgets.map(b => b.category),
    ...Object.keys(spendMap),
  ])).sort();

  const rows = allCategories.map(cat => {
    const budget = budgets.find(b => b.category === cat);
    const spent = spendMap[cat] ?? 0;
    const limit = budget?.limitCents ?? 0;
    const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
    const over = limit > 0 && spent > limit;
    return { cat, budget, spent, limit, pct, over };
  });

  const totalLimit = budgets.reduce((s, b) => s + b.limitCents, 0);
  const totalSpent = budgets.reduce((s, b) => s + (spendMap[b.category] ?? 0), 0);
  const totalPct = totalLimit > 0 ? Math.min(100, (totalSpent / totalLimit) * 100) : 0;

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 80px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>Orçamento mensal</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
            Defina limites por categoria e acompanhe seu progresso
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "10px 18px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
            color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}
        >
          + Nova categoria
        </button>
      </div>

      {/* Month navigator */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 20,
        background: "rgba(30,41,59,.6)", borderRadius: 14, padding: "10px 16px",
        border: "1px solid rgba(148,163,184,.12)",
      }}>
        <button type="button" onClick={() => setMonthKey(prevMonth(monthKey))} style={navBtnStyle}>‹</button>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#cbd5e1", textTransform: "capitalize" }}>
          {monthLabel(monthKey)}
        </span>
        <button type="button" onClick={() => setMonthKey(nextMonth(monthKey))} style={navBtnStyle}>›</button>
      </div>

      {/* Summary card */}
      {totalLimit > 0 && (
        <div style={{
          background: "rgba(30,41,59,.7)", borderRadius: 16, padding: "16px 20px", marginBottom: 20,
          border: `1px solid ${totalPct >= 100 ? "rgba(239,68,68,.4)" : totalPct >= 80 ? "rgba(245,158,11,.4)" : "rgba(34,197,94,.25)"}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}>
            <span style={{ color: "#94a3b8" }}>Total gasto vs limite</span>
            <span style={{ fontWeight: 700, color: totalPct >= 100 ? "#f87171" : "#f1f5f9" }}>
              {fmtBRL(totalSpent)} / {fmtBRL(totalLimit)}
            </span>
          </div>
          <ProgressBar pct={totalPct} over={totalSpent > totalLimit} />
        </div>
      )}

      {/* Rows */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#64748b", padding: 40 }}>Carregando...</div>
      ) : rows.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "40px 20px",
          background: "rgba(30,41,59,.5)", borderRadius: 16,
          border: "1px dashed rgba(148,163,184,.2)", color: "#64748b",
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#94a3b8" }}>Nenhuma categoria com orçamento</p>
          <p style={{ margin: "6px 0 0", fontSize: 13 }}>Adicione limites para acompanhar seus gastos por categoria.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {rows.map(({ cat, budget, spent, limit, pct, over }) => (
            <div key={cat} style={{
              background: "rgba(30,41,59,.65)", borderRadius: 16, padding: "16px 18px",
              border: `1px solid ${over ? "rgba(239,68,68,.35)" : "rgba(148,163,184,.12)"}`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#f1f5f9" }}>{cat}</span>
                  {!budget && (
                    <span style={{
                      marginLeft: 8, fontSize: 11, padding: "2px 7px", borderRadius: 999,
                      background: "rgba(100,116,139,.2)", color: "#94a3b8",
                    }}>sem limite</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {budget && (
                    <>
                      <button type="button" onClick={() => openEdit(budget)} style={iconBtnStyle} title="Editar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button type="button" onClick={() => handleDelete(budget.id)} style={{ ...iconBtnStyle, color: "#f87171" }} title="Excluir">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </>
                  )}
                  {!budget && (
                    <button type="button" onClick={() => { setFormCategory(cat); setFormLimit(""); setEditBudget(null); setError(null); setFormOpen(true); }} style={{ ...iconBtnStyle, color: "#60a5fa" }} title="Definir limite">
                      + limite
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: over ? "#f87171" : "#94a3b8" }}>
                  Gasto: <strong style={{ color: over ? "#f87171" : "#f1f5f9" }}>{fmtBRL(spent)}</strong>
                </span>
                {limit > 0 && (
                  <span style={{ color: "#64748b" }}>
                    Limite: <strong style={{ color: "#cbd5e1" }}>{fmtBRL(limit)}</strong>
                    {" "}
                    <span style={{ color: over ? "#f87171" : "#4ade80" }}>
                      ({over ? `+${fmtBRL(spent - limit)}` : `sobra ${fmtBRL(limit - spent)}`})
                    </span>
                  </span>
                )}
              </div>

              {limit > 0 && <ProgressBar pct={pct} over={over} />}
            </div>
          ))}
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
              {editBudget ? "Editar orçamento" : "Novo orçamento"}
            </h2>

            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>Categoria</label>
              <input
                value={formCategory}
                onChange={e => setFormCategory(e.target.value)}
                placeholder="Ex: Alimentação, Transporte..."
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <label style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>Limite (R$)</label>
              <input
                value={formLimit}
                onChange={e => setFormLimit(e.target.value)}
                placeholder="Ex: 800"
                inputMode="decimal"
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)",
                color: "#fca5a5", fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setFormOpen(false)} style={cancelBtnStyle}>Cancelar</button>
              <button type="button" onClick={handleSave} disabled={saving} style={saveBtnStyle}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProgressBar({ pct, over }: { pct: number; over: boolean }) {
  const color = over ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#22c55e";
  return (
    <div style={{ height: 8, borderRadius: 999, background: "rgba(148,163,184,.12)", overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 999, width: `${pct}%`,
        background: color, transition: "width .4s ease",
        boxShadow: `0 0 8px ${color}55`,
      }} />
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  background: "rgba(148,163,184,.12)", border: "none", color: "#cbd5e1",
  borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 18,
  display: "flex", alignItems: "center", justifyContent: "center",
};

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
