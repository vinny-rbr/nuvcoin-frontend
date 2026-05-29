import { useCallback, useEffect, useMemo, useState, type SyntheticEvent } from "react";
import type { FinanceCategory, FinanceItem, FinanceStatus, PaymentType } from "../types/finance";
import {
  financeAdd,
  financeDebugLog,
  financeList,
  financeRefreshFromApi,
  financeRemove,
  financeSubscribe,
  makeId,
  todayISO,
} from "../lib/financeService";
import { calcFinanceSummary } from "../lib/financeStorage";
import "./dashboard.css";
import "./finance.css";

function parseAmountToCents(input: string): number {
  const normalized = input.trim().replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (Number.isNaN(value) || value <= 0) return 0;
  return Math.round(value * 100);
}

function formatCentsBRL(cents: number): string {
  const value = cents / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("pt-BR");
}

function getPaymentLabel(paymentType: PaymentType): string {
  if (paymentType === "pix") return "Pix";
  if (paymentType === "debit") return "Débito";
  if (paymentType === "cash") return "Dinheiro";
  return "Crédito";
}

function getStatusLabel(status: FinanceStatus): string {
  return status === "paid" ? "Pago" : "Pendente";
}

export default function Despesas() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<FinanceCategory>("Alimentação");
  const [amount, setAmount] = useState("");
  const [dateISO, setDateISO] = useState(todayISO());
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [paymentType, setPaymentType] = useState<PaymentType>("pix");
  const [status, setStatus] = useState<FinanceStatus>("paid");
  const [animate, setAnimate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      setItems(financeList());
    };

    load();
    void financeRefreshFromApi().then(setItems).catch(() => undefined);

    const unsubscribe = financeSubscribe(load);

    const refresh = () => {
      void financeRefreshFromApi().then(setItems).catch(() => undefined);
    };

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    const handleFinanceError = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      setFeedback(customEvent.detail || "Nao foi possivel sincronizar agora.");
    };

    window.addEventListener("conciliaai_finance_error", handleFinanceError as EventListener);

    return () => {
      unsubscribe();
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("conciliaai_finance_error", handleFinanceError as EventListener);
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

  const despesas = useMemo(() => items.filter((x) => x.type === "DESPESA"), [items]);
  const summary = useMemo(() => calcFinanceSummary(items), [items]);

  const onAdd = useCallback((event?: SyntheticEvent | Event) => {
    event?.preventDefault();
    event?.stopPropagation();
    financeDebugLog("onAdd despesa iniciou", { title, amount, dateISO, paymentType, status, saving });

    if (saving) return;
    setFeedback(null);

    const amountCents = parseAmountToCents(amount);

    if (!title.trim()) {
      financeDebugLog("validacao falhou despesa titulo", { title });
      alert("Informe um título.");
      return;
    }

    if (amountCents <= 0) {
      financeDebugLog("valor invalido despesa", { amount, amountCents });
      alert("Informe um valor válido.");
      return;
    }

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

    setSaving(true);
    setFeedback("Salvando lancamento...");
    const updated = financeAdd(newItem);
    setItems(updated);
    window.setTimeout(() => {
      void financeRefreshFromApi()
        .then(setItems)
        .catch(() => undefined)
        .finally(() => setSaving(false));
    }, 700);

    setTitle("");
    setAmount("");
    setDateISO(todayISO());
    setCategory("Alimentação");
    setPaymentType("pix");
    setStatus("paid");
  }, [amount, category, dateISO, paymentType, saving, status, title]);

  useEffect(() => {
    function handleNativeAdd(event: Event) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-finance-add='despesa']")) return;

      onAdd(event);
    }

    document.addEventListener("click", handleNativeAdd, true);
    document.addEventListener("pointerdown", handleNativeAdd, true);
    document.addEventListener("touchstart", handleNativeAdd, true);

    return () => {
      document.removeEventListener("click", handleNativeAdd, true);
      document.removeEventListener("pointerdown", handleNativeAdd, true);
      document.removeEventListener("touchstart", handleNativeAdd, true);
    };
  }, [onAdd]);

  function onDelete(id: string) {
    const ok = confirm("Remover esta despesa?");
    if (!ok) return;

    const updated = financeRemove(id);
    setItems(updated);
  }

  return (
    <div className={`finance-view finance-expense${animate ? " is-ready" : ""}`}>
      <section className="finance-hero">
        <div>
          <span className="finance-kicker">Saídas</span>
          <h2>Despesas</h2>
        </div>
        <p>Registre gastos, separe por categoria e acompanhe o impacto no saldo.</p>
      </section>

      <div className="dashboard-grid finance-summary-grid">
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

      <div className="chart-card finance-panel finance-form-panel">
        <div className="finance-section-heading">
          <div>
            <span className="finance-kicker">Nova saída</span>
            <h3>Adicionar Despesa</h3>
          </div>
        </div>

        {feedback ? <div className="finance-feedback">{feedback}</div> : null}

        <div>
        <div className="finance-form-grid">
          <label className="finance-field finance-field-title">
            <span>Título</span>
            <input
              className="finance-control"
              placeholder="Ex: Mercado"
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
              <option value="Alimentação">Alimentação</option>
              <option value="Transporte">Transporte</option>
              <option value="Moradia">Moradia</option>
              <option value="Saúde">Saúde</option>
              <option value="Lazer">Lazer</option>
              <option value="Outros">Outros</option>
            </select>
          </label>

          <label className="finance-field">
            <span>Valor</span>
            <input
              className="finance-control"
              inputMode="decimal"
              placeholder="Ex: 150,00"
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

          <label className="finance-field">
            <span>Pagamento</span>
            <select
              className="finance-control"
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as PaymentType)}
            >
              <option value="pix">Pix</option>
              <option value="debit">Débito</option>
              <option value="cash">Dinheiro</option>
              <option value="credit">Crédito</option>
            </select>
          </label>

          <label className="finance-field">
            <span>Status</span>
            <select
              className="finance-control"
              value={status}
              onChange={(e) => setStatus(e.target.value as FinanceStatus)}
            >
              <option value="paid">Pago</option>
              <option value="pending">Pendente</option>
            </select>
          </label>
        </div>

        <button
          className="finance-primary-button"
          type="button"
          disabled={saving}
          onClick={onAdd}
        >
          {saving ? "Salvando..." : "Adicionar Despesa"}
        </button>
        </div>
      </div>

      <div className="chart-card finance-panel finance-list-panel">
        <div className="finance-section-heading">
          <div>
            <span className="finance-kicker">Histórico</span>
            <h3>Lista de Despesas</h3>
          </div>
          <span className="finance-count">{despesas.length} cadastrada(s)</span>
        </div>

        {despesas.length === 0 ? (
          <div className="finance-empty-state">
            <div className="finance-empty-icon">-</div>
            <strong>Nenhuma despesa cadastrada ainda.</strong>
            <span>Adicione sua primeira saída pelo formulário acima.</span>
          </div>
        ) : (
          <div className="finance-list">
            {despesas.map((d) => (
              <div key={d.id} className="finance-row">
                <div className="finance-row-main">
                  <div className="finance-row-icon">R$</div>
                  <div>
                    <div className="finance-row-title">{d.title}</div>
                    <div className="finance-row-meta">
                      {d.category} <span>•</span> {formatDateBR(d.dateISO)}
                      <span>•</span> {getPaymentLabel(d.paymentType)}
                      <span>•</span> {getStatusLabel(d.status)}
                    </div>
                  </div>
                </div>

                <div className="finance-row-actions">
                  <div className="finance-row-value red">- {formatCentsBRL(d.amountCents)}</div>
                  <button className="finance-danger-button" onClick={() => onDelete(d.id)}>
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
