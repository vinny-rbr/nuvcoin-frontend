import { useEffect, useMemo, useState } from "react";

import FinanceOfxImport from "../components/FinanceOfxImport";
import { financeList, financeRefreshFromApi, financeSubscribe } from "../lib/financeService";
import { DEFAULT_CATEGORIES } from "../lib/financeCategoriesService";
import { calcFinanceSummary } from "../lib/financeStorage";
import type { FinanceItem } from "../types/finance";

import "./dashboard.css";
import "./finance.css";

function formatBRLFromCents(valueCents: number): string {
  return (valueCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ImportOfx() {
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const load = () => {
      setItems(financeList());
    };

    load();
    void financeRefreshFromApi().then(setItems).catch(() => undefined);

    const unsubscribe = financeSubscribe(load);

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setAnimate(true);
    }, 40);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  const summary = useMemo(() => calcFinanceSummary(items), [items]);

  return (
    <div className={`finance-view finance-import${animate ? " is-ready" : ""}`}>
      <section className="finance-hero">
        <div>
          <span className="finance-kicker">Arquivo bancario</span>
          <h2>Importar OFX</h2>
        </div>
        <p>Envie o extrato exportado pelo banco e o Conciliaai transforma em entradas e saidas automaticamente.</p>
      </section>

      <div className="dashboard-grid finance-summary-grid finance-import-summary">
        <div className="stat-card">
          <div className="stat-title">Receitas atuais</div>
          <div className="stat-value green">{formatBRLFromCents(summary.totalReceitasCents)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Despesas atuais</div>
          <div className="stat-value red">{formatBRLFromCents(summary.totalDespesasCents)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Saldo atual</div>
          <div className="stat-value">{formatBRLFromCents(summary.saldoCents)}</div>
        </div>
      </div>

      <FinanceOfxImport
        incomeCategory={DEFAULT_CATEGORIES.RECEITA[0] ?? "Outros"}
        expenseCategory={DEFAULT_CATEGORIES.DESPESA[0] ?? "Outros"}
        onImported={setItems}
      />

      <div className="chart-card finance-panel finance-ofx-help">
        <div className="finance-section-heading">
          <div>
            <span className="finance-kicker">Como funciona</span>
            <h3>O que sera importado</h3>
          </div>
        </div>

        <div className="finance-ofx-steps">
          <div>
            <strong>1. Exporte no banco</strong>
            <span>Baixe o extrato no formato OFX pelo internet banking.</span>
          </div>
          <div>
            <strong>2. Envie aqui</strong>
            <span>O sistema le cada movimento do arquivo.</span>
          </div>
          <div>
            <strong>3. Lancamentos automaticos</strong>
            <span>Valores positivos entram como receitas e negativos entram como despesas.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
