import { useEffect, useMemo, useState } from "react"; // Hooks
import type { FinanceCategory, FinanceItem } from "../types/finance"; // Tipos
import {
  financeAdd,
  financeList,
  financeRemove,
  financeSubscribe,
  makeId,
  todayISO,
} from "../lib/financeService";
import { calcFinanceSummary } from "../lib/financeStorage";
import "./dashboard.css";

// Formata centavos para BRL
function formatBRLFromCents(valueCents: number): string {
  const value = valueCents / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Converte para centavos
function parseBRLToCents(input: string): number {
  const normalized = input.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const value = Number(normalized || "0");
  return Math.round(value * 100);
}

export default function Receitas() {
  const [items, setItems] = useState<FinanceItem[]>([]);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dateISO, setDateISO] = useState(todayISO());
  const [category, setCategory] = useState<FinanceCategory>("Salário");

  const [animate, setAnimate] = useState(false); // 🔥 animação

  // Carrega + subscribe
  useEffect(() => {
    const load = () => {
      setItems(financeList());
    };

    load();

    const unsubscribe = financeSubscribe(load);

    return () => {
      unsubscribe();
    };
  }, []);

  // 🔥 animação ao mudar dados
  useEffect(() => {
    setAnimate(false);

    const t = setTimeout(() => {
      setAnimate(true);
    }, 40);

    return () => clearTimeout(t);
  }, [items]);

  const summary = useMemo(() => calcFinanceSummary(items), [items]);

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
      category,
      amountCents: parseBRLToCents(amount),
      dateISO,
      createdAtISO: new Date().toISOString(),
      paymentType: "pix",
      status: "paid",
    };

    const updated = financeAdd(newItem);
    setItems(updated);

    setTitle("");
    setAmount("");
    setDateISO(todayISO());
    setCategory("Salário");
  }

  function handleRemove(id: string) {
    const updated = financeRemove(id);
    setItems(updated);
  }

  return (
    <div
      style={{
        opacity: animate ? 1 : 0,
        transform: animate ? "translateY(0px)" : "translateY(10px)",
        transition: "all 0.35s ease",
      }}
    >
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

      {/* Form */}
      <div className="chart-card" style={{ marginBottom: 18 }}>
        <div className="chart-title" style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
          Adicionar Receita
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr", gap: 12 }}>
          <input
            placeholder="Título (ex: Salário)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as FinanceCategory)}
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
          />

          <input
            type="date"
            value={dateISO}
            onChange={(e) => setDateISO(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <button onClick={handleAdd}>Adicionar Receita</button>
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
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{item.title}</div>
                  <div style={{ fontSize: 13 }}>
                    {item.category} • {item.dateISO}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ fontWeight: 900 }}>
                    {formatBRLFromCents(item.amountCents)}
                  </div>

                  <button onClick={() => handleRemove(item.id)}>
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/*
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com

✔ Animação adicionada (fade + subida)
✔ Dispara ao atualizar dados
✔ Mesmo padrão do Dashboard e Despesas
*/