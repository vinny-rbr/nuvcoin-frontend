import { useEffect, useMemo, useState } from "react";
import type { FinanceCategory, FinanceItem } from "../types/finance";
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
import "./finance.css";

function formatBRLFromCents(valueCents: number): string {
  const value = valueCents / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function parseBRLToCents(input: string): number {
  const normalized = input.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const value = Number(normalized || "0");
  return Math.round(value * 100);
}

function formatDateBR(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("pt-BR");
}

export default function Receitas() {
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dateISO, setDateISO] = useState(todayISO());
  const [category, setCategory] = useState<FinanceCategory>("Salário");
  const [animate, setAnimate] = useState(false);

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

  useEffect(() => {
    setAnimate(false);

    const timeoutId = window.setTimeout(() => {
      setAnimate(true);
    }, 40);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [items]);

  const summary = useMemo(() => calcFinanceSummary(items), [items]);
  const receitas = useMemo(() => items.filter((x) => x.type === "RECEITA"), [items]);

  function handleAdd() {
    if (!title.trim() || !amount.trim()) {
      alert("Preencha título e valor.");
      return;
    }

    const amountCents = parseBRLToCents(amount);

    if (amountCents <= 0) {
      alert("Informe um valor válido.");
      return;
    }

    const newItem: FinanceItem = {
      id: makeId(),
      type: "RECEITA",
      title: title.trim(),
      category,
      amountCents,
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
    <div className={`finance-view finance-income${animate ? " is-ready" : ""}`}>
      <section className="finance-hero">
        <div>
          <span className="finance-kicker">Entradas</span>
          <h2>Receitas</h2>
        </div>
        <p>Cadastre ganhos, acompanhe o saldo e mantenha suas entradas organizadas.</p>
      </section>

      <div className="dashboard-grid finance-summary-grid">
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

      <div className="chart-card finance-panel finance-form-panel">
        <div className="finance-section-heading">
          <div>
            <span className="finance-kicker">Nova entrada</span>
            <h3>Adicionar Receita</h3>
          </div>
        </div>

        <div className="finance-form-grid">
          <label className="finance-field finance-field-title">
            <span>Título</span>
            <input
              className="finance-control"
              placeholder="Ex: Salário"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="finance-field">
            <span>Categoria</span>
            <select
              className="finance-control"
              value={category}
              onChange={(e) => setCategory(e.target.value as FinanceCategory)}
            >
              <option value="Salário">Salário</option>
              <option value="Freelance">Freelance</option>
              <option value="Vendas">Vendas</option>
              <option value="Outros">Outros</option>
            </select>
          </label>

          <label className="finance-field">
            <span>Valor</span>
            <input
              className="finance-control"
              inputMode="decimal"
              placeholder="Ex: 2500,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

          <label className="finance-field">
            <span>Data</span>
            <input
              className="finance-control"
              type="date"
              value={dateISO}
              onChange={(e) => setDateISO(e.target.value)}
            />
          </label>
        </div>

        <button className="finance-primary-button" onClick={handleAdd}>
          Adicionar Receita
        </button>
      </div>

      <div className="chart-card finance-panel finance-list-panel">
        <div className="finance-section-heading">
          <div>
            <span className="finance-kicker">Histórico</span>
            <h3>Lista de Receitas</h3>
          </div>
          <span className="finance-count">{receitas.length} cadastrada(s)</span>
        </div>

        {receitas.length === 0 ? (
          <div className="finance-empty-state">
            <div className="finance-empty-icon">+</div>
            <strong>Nenhuma receita cadastrada ainda.</strong>
            <span>Adicione sua primeira entrada pelo formulário acima.</span>
          </div>
        ) : (
          <div className="finance-list">
            {receitas.map((item) => (
              <div key={item.id} className="finance-row">
                <div className="finance-row-main">
                  <div className="finance-row-icon">R$</div>
                  <div>
                    <div className="finance-row-title">{item.title}</div>
                    <div className="finance-row-meta">
                      {item.category} <span>•</span> {formatDateBR(item.dateISO)}
                    </div>
                  </div>
                </div>

                <div className="finance-row-actions">
                  <div className="finance-row-value green">
                    {formatBRLFromCents(item.amountCents)}
                  </div>

                  <button className="finance-danger-button" onClick={() => handleRemove(item.id)}>
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
