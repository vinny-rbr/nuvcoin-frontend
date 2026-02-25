import { useEffect, useMemo, useState } from "react"; // Hooks do React
import type { FinanceCategory, FinanceItem, PaymentType, FinanceStatus } from "../types/finance"; // Tipos do financeiro
import "./dashboard.css"; // Reaproveita visual

import {
  financeAdd, // ✅ Add via service
  financeList, // ✅ List via service
  financeRemove, // ✅ Remove via service
  financeSubscribe, // ✅ Atualiza em tempo real
  makeId, // ✅ Helper
  todayISO, // ✅ Helper
} from "../lib/financeService"; // ✅ Service

import { calcFinanceSummary } from "../lib/financeStorage"; // Resumo (mantém igual)

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
  const [title, setTitle] = useState(""); // Campo: título
  const [category, setCategory] = useState<FinanceCategory>("Alimentação"); // Categoria
  const [amount, setAmount] = useState(""); // Valor
  const [dateISO, setDateISO] = useState(todayISO()); // Data
  const [items, setItems] = useState<FinanceItem[]>([]); // Lista do service

  // Campos obrigatórios (já prepara crédito depois)
  const [paymentType, setPaymentType] = useState<PaymentType>("pix"); // pix | debit | cash | credit
  const [status, setStatus] = useState<FinanceStatus>("paid"); // paid | pending

  // Carrega ao abrir + escuta mudanças
  useEffect(() => {
    const load = () => {
      setItems(financeList()); // ✅ Lê via service
    };

    load();

    const unsubscribe = financeSubscribe(load); // ✅ Atualiza em tempo real

    return () => {
      unsubscribe();
    };
  }, []);

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

      // ✅ Campos obrigatórios do seu types/finance.ts
      paymentType,
      status,
    };

    const updated = financeAdd(newItem); // ✅ Add via service
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

    const updated = financeRemove(id); // ✅ Remove via service
    setItems(updated);
  }

  return (
    <>
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

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1.4fr 1fr 1fr 0.8fr" }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título (ex: Aluguel)"
            style={{
              padding: 12,
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(15,23,42,0.25)",
              color: "white",
            }}
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as FinanceCategory)}
            style={{
              padding: 12,
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(15,23,42,0.25)",
              color: "white",
            }}
          >
            <option>Salário</option>
            <option>Freelance</option>
            <option>Vendas</option>
            <option>Alimentação</option>
            <option>Transporte</option>
            <option>Moradia</option>
            <option>Saúde</option>
            <option>Lazer</option>
            <option>Outros</option>
          </select>

          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Valor (ex: 250,00)"
            style={{
              padding: 12,
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(15,23,42,0.25)",
              color: "white",
            }}
          />

          <input
            type="date"
            value={dateISO}
            onChange={(e) => setDateISO(e.target.value)}
            style={{
              padding: 12,
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(15,23,42,0.25)",
              color: "white",
            }}
          />
        </div>

        {/* Extras: paymentType + status (não muda visual do app, só dá controle) */}
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr", marginTop: 12 }}>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value as PaymentType)}
            style={{
              padding: 12,
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(15,23,42,0.25)",
              color: "white",
            }}
          >
            <option value="pix">pix</option>
            <option value="debit">debit</option>
            <option value="cash">cash</option>
            <option value="credit">credit</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as FinanceStatus)}
            style={{
              padding: 12,
              borderRadius: 10,
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(15,23,42,0.25)",
              color: "white",
            }}
          >
            <option value="paid">paid</option>
            <option value="pending">pending</option>
          </select>
        </div>

        <div style={{ marginTop: 14 }}>
          <button
            onClick={onAdd}
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
            Adicionar Despesa
          </button>
        </div>
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
                  <button
                    onClick={() => onDelete(d.id)}
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

Despesas.tsx:
- Migrado para financeService (hoje localStorage, amanhã API)
- Mantém UI igual
*/