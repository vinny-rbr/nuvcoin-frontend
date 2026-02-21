import { useEffect, useMemo, useState } from "react"; // Hooks
import type { FinanceCategory, FinanceItem } from "../types/finance"; // Tipos
import {
  addFinanceItem, // Adiciona item
  deleteFinanceItem, // Remove item
  loadFinanceItems, // Carrega itens
  calcFinanceSummary, // Resumo
  makeId, // ID
  todayISO, // Data ISO
} from "../lib/financeStorage"; // Storage
import "./dashboard.css"; // Reaproveita visual

// Formata centavos para BRL
function formatBRLFromCents(valueCents: number): string {
  const value = valueCents / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Converte "1500", "1500,50", "1.500,50" -> centavos
function parseBRLToCents(input: string): number {
  const normalized = input
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");

  const value = Number(normalized || "0");
  return Math.round(value * 100);
}

export default function Receitas() {
  const [items, setItems] = useState<FinanceItem[]>([]); // Itens do storage

  // Form
  const [title, setTitle] = useState(""); // Título
  const [amount, setAmount] = useState(""); // Valor
  const [dateISO, setDateISO] = useState(todayISO()); // Data ISO
  const [category, setCategory] = useState<FinanceCategory>("Salário"); // Categoria válida

  // Carrega ao abrir
  useEffect(() => {
    setItems(loadFinanceItems());
  }, []);

  // Resumo
  const summary = useMemo(() => calcFinanceSummary(items), [items]);

  // Lista só receitas
  const receitas = useMemo(() => items.filter((x) => x.type === "RECEITA"), [items]);

  function handleAdd() {
    if (!title || !amount) {
      alert("Preencha título e valor.");
      return;
    }

    const newItem: FinanceItem = {
      id: makeId(),
      type: "RECEITA",
      title: title.trim(),
      category, // ✅ Categoria válida pelo tipo FinanceCategory
      amountCents: parseBRLToCents(amount),
      dateISO,
      createdAtISO: new Date().toISOString(),
    };

    const updated = addFinanceItem(newItem);
    setItems(updated);

    setTitle("");
    setAmount("");
    setDateISO(todayISO());
    setCategory("Salário");
  }

  function handleRemove(id: string) {
    const updated = deleteFinanceItem(id);
    setItems(updated);
  }

  return (
    <>
      <h2 style={{ marginBottom: 14 }}>Receitas</h2>

      {/* Cards */}
      <div className="dashboard-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-title">Total Receitas</div>
          <div className="stat-value green">{formatBRLFromCents(summary.totalReceitasCents)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Total Despesas</div>
          <div className="stat-value red">{formatBRLFromCents(summary.totalDespesasCents)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Saldo</div>
          <div className="stat-value">{formatBRLFromCents(summary.saldoCents)}</div>
        </div>
      </div>

      {/* Card Form */}
      <div className="chart-card" style={{ marginBottom: 18 }}>
        <div className="chart-title" style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
          Adicionar Receita
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr", gap: 12 }}>
          <input
            placeholder="Título (ex: Salário)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(148,163,184,0.18)", background: "rgba(15,23,42,0.25)", color: "white" }}
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as FinanceCategory)}
            style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(148,163,184,0.18)", background: "rgba(15,23,42,0.25)", color: "white" }}
          >
            <option value="Salário">Salário</option>
            <option value="Freelance">Freelance</option>
            <option value="Vendas">Vendas</option>
            <option value="Outros">Outros</option>
          </select>

          <input
            placeholder="Valor (ex: 2500,00)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(148,163,184,0.18)", background: "rgba(15,23,42,0.25)", color: "white" }}
          />

          <input
            type="date"
            value={dateISO}
            onChange={(e) => setDateISO(e.target.value)}
            style={{ padding: 12, borderRadius: 10, border: "1px solid rgba(148,163,184,0.18)", background: "rgba(15,23,42,0.25)", color: "white" }}
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <button
            onClick={handleAdd}
            style={{
              padding: "12px 18px",
              borderRadius: 10,
              border: "none",
              background: "#3b82f6",
              color: "white",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Adicionar Receita
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="chart-card">
        <div className="chart-title" style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
          Lista de Receitas
        </div>

        {receitas.length === 0 ? (
          <div style={{ color: "var(--text-secondary)", padding: 10 }}>
            Nenhuma receita cadastrada ainda.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {receitas.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 14,
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.18)",
                  background: "rgba(15,23,42,0.25)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>{item.title}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                    {item.category} • {item.dateISO}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontWeight: 900 }}>{formatBRLFromCents(item.amountCents)}</div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: "1px solid rgba(148,163,184,0.25)",
                      background: "transparent",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/*
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com

// Receitas.tsx:
// - Cria receitas com categoria válida (FinanceCategory)
// - Salva em nuvcoin_finance_items_v1
// - Lista e remove receitas
*/