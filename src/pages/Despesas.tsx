import { useEffect, useMemo, useState } from "react"; // Hooks do React
import type { FinanceCategory, FinanceItem, PaymentType, FinanceStatus } from "../types/finance"; // Tipos do financeiro
import "./dashboard.css"; // Reaproveita visual

import {
  financeAdd,
  financeList,
  financeRemove,
  financeSubscribe,
  makeId,
  todayISO,
} from "../lib/financeService";

import { calcFinanceSummary } from "../lib/financeStorage";

// Converte "1.234,56" -> 123456
function parseAmountToCents(input: string): number {
  const normalized = input.trim().replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (Number.isNaN(value) || value <= 0) return 0;
  return Math.round(value * 100);
}

// Formata centavos em BRL
function formatCentsBRL(cents: number): string {
  const value = cents / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Despesas() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<FinanceCategory>("Alimentação");
  const [amount, setAmount] = useState("");
  const [dateISO, setDateISO] = useState(todayISO());
  const [items, setItems] = useState<FinanceItem[]>([]);

  const [paymentType, setPaymentType] = useState<PaymentType>("pix");
  const [status, setStatus] = useState<FinanceStatus>("paid");

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

  // 🔥 dispara animação
  useEffect(() => {
    setAnimate(false);

    const t = setTimeout(() => {
      setAnimate(true);
    }, 40);

    return () => clearTimeout(t);
  }, [items]);

  const despesas = useMemo(() => {
    return items.filter((x) => x.type === "DESPESA");
  }, [items]);

  const summary = useMemo(() => {
    return calcFinanceSummary(items);
  }, [items]);

  function onAdd() {
    const amountCents = parseAmountToCents(amount);
    if (!title.trim()) return alert("Informe um título.");
    if (amountCents <= 0) return alert("Informe um valor válido.");

    const newItem: FinanceItem = {
      id: makeId(),
      type: "DESPESA",
      title: title.trim(),
      category,
      amountCents,
      dateISO,
      createdAtISO: new Date().toISOString(),
      paymentType,
      status,
    };

    const updated = financeAdd(newItem);
    setItems(updated);

    setTitle("");
    setAmount("");
    setDateISO(todayISO());
    setPaymentType("pix");
    setStatus("paid");
  }

  function onDelete(id: string) {
    const ok = confirm("Remover esta despesa?");
    if (!ok) return;

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
      <h2 style={{ marginBottom: 14 }}>Despesas</h2>

      {/* Cards */}
      <div className="dashboard-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-title">Total Receitas</div>
          <div className="stat-value green">{formatCentsBRL(summary.totalReceitasCents)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Total Despesas</div>
          <div className="stat-value red">{formatCentsBRL(summary.totalDespesasCents)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Saldo</div>
          <div className="stat-value">{formatCentsBRL(summary.saldoCents)}</div>
        </div>
      </div>

      {/* Form */}
      <div className="chart-card" style={{ marginBottom: 18 }}>
        <div className="chart-title" style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
          Adicionar Despesa
        </div>

        {/* resto do seu código igual (não alterei UI) */}
      </div>

      {/* Lista */}
      <div className="chart-card">
        <div className="chart-title" style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
          Lista de Despesas
        </div>

        {despesas.length === 0 ? (
          <div style={{ color: "var(--text-secondary)", padding: 10 }}>
            Nenhuma despesa cadastrada ainda.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {despesas.map((d) => (
              <div
                key={d.id}
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
                  <div style={{ fontWeight: 800 }}>{d.title}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                    {d.category} • {d.dateISO}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontWeight: 900 }}>{formatCentsBRL(d.amountCents)}</div>
                  <button onClick={() => onDelete(d.id)}>Remover</button>
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
✔ Dispara ao atualizar lista
✔ Padrão igual Dashboard
*/