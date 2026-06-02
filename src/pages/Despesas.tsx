import { useCallback, useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import type { FinanceCategory, FinanceCategoryOption, FinanceItem, FinanceStatus, PaymentType } from "../types/finance";
import {
  financeAdd,
  financeDebugLog,
  financeList,
  financeRefreshFromApi,
  financeRemove,
  financeSubscribe,
  financeUpdate,
  makeId,
  todayISO,
} from "../lib/financeService";
import CategoryPicker from "../components/CategoryPicker";
import FinanceItemEditModal from "../components/FinanceItemEditModal";
import { categoriesForType, createFinanceCategory, DEFAULT_CATEGORIES, listFinanceCategories } from "../lib/financeCategoriesService";
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
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("pt-BR");
}

function getPaymentLabel(paymentType: PaymentType): string {
  if (paymentType === "pix") return "Pix";
  if (paymentType === "debit") return "Debito";
  if (paymentType === "cash") return "Dinheiro";
  return "Credito";
}

function getStatusLabel(status: FinanceStatus): string {
  return status === "paid" ? "Pago" : "Pendente";
}

function addMonthsISO(dateISO: string, monthsToAdd: number): string {
  const [year, month, day] = dateISO.split("-").map(Number);
  const target = new Date(year, month - 1 + monthsToAdd, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const safeDay = Math.min(day, lastDay);
  target.setDate(safeDay);

  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, "0");
  const dd = String(target.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function nextRecurringStartISO(dateISO: string): string {
  const today = todayISO();
  if (dateISO >= today) return dateISO;

  const day = Number(dateISO.slice(8, 10));
  const now = new Date();
  const currentMonthCandidate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    Math.min(day, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()),
  ).padStart(2, "0")}`;

  if (currentMonthCandidate >= today) return currentMonthCandidate;

  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
  return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-${String(
    Math.min(day, lastDay),
  ).padStart(2, "0")}`;
}

export default function Despesas() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<FinanceCategory>(DEFAULT_CATEGORIES.DESPESA[0]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(DEFAULT_CATEGORIES.DESPESA);
  const [categoryRecords, setCategoryRecords] = useState<FinanceCategoryOption[]>([]);
  const [amount, setAmount] = useState("");
  const [dateISO, setDateISO] = useState(todayISO());
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [paymentType, setPaymentType] = useState<PaymentType>("pix");
  const [status, setStatus] = useState<FinanceStatus>("paid");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceMode, setRecurrenceMode] = useState<"forever" | "months">("forever");
  const [recurrenceMonths, setRecurrenceMonths] = useState("6");
  const [animate, setAnimate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<FinanceItem | null>(null);
  const savingRef = useRef(false);

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
    let isMounted = true;

    void listFinanceCategories()
      .then((categories) => {
        if (!isMounted) return;
        const options = categoriesForType(categories, "DESPESA");
        setCategoryRecords(categories.filter((item) => item.type === "DESPESA"));
        setCategoryOptions(options);
        setCategory((current) => (options.includes(current) ? current : options[0] ?? "Outros"));
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
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

  async function handleQuickCreateCategory(name: string, parentPath?: string): Promise<string> {
    const parent = parentPath ? categoryRecords.find((item) => item.fullPath === parentPath) : null;
    const created = await createFinanceCategory("DESPESA", name, parent?.id ?? null, parent?.icon ?? "💼", parent?.color ?? "#60a5fa");
    const categories = await listFinanceCategories();
    const options = categoriesForType(categories, "DESPESA");
    setCategoryRecords(categories.filter((item) => item.type === "DESPESA"));
    setCategoryOptions(options);

    const expectedPath = parentPath ? `${parentPath} > ${created.name}` : created.name;
    const createdValue = options.find((option) => option === expectedPath || option === created.name || option.endsWith(`> ${created.name}`)) ?? expectedPath;
    setCategory(createdValue);
    return createdValue;
  }

  const onAdd = useCallback((event?: SyntheticEvent | Event) => {
    event?.preventDefault();
    event?.stopPropagation();
    financeDebugLog("onAdd despesa iniciou", { title, amount, dateISO, paymentType, status, saving, isRecurring });

    if (savingRef.current || saving) return;
    setFeedback(null);

    const amountCents = parseAmountToCents(amount);
    const parsedMonths = Number(recurrenceMonths);
    const totalMonths = isRecurring ? (recurrenceMode === "forever" ? 12 : Math.min(Math.max(Math.trunc(parsedMonths || 0), 1), 60)) : 1;

    if (!title.trim()) {
      financeDebugLog("validacao falhou despesa titulo", { title });
      alert("Informe um titulo.");
      return;
    }

    if (amountCents <= 0) {
      financeDebugLog("valor invalido despesa", { amount, amountCents });
      alert("Informe um valor valido.");
      return;
    }

    if (isRecurring && recurrenceMode === "months" && (!parsedMonths || parsedMonths < 1)) {
      alert("Informe por quantos meses essa despesa deve se repetir.");
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setFeedback(isRecurring ? "Criando despesas mensais..." : "Salvando lancamento...");

    let updated = financeList();
    const createdAtISO = new Date().toISOString();
    const firstDateISO = isRecurring ? nextRecurringStartISO(dateISO) : dateISO;

    for (let index = 0; index < totalMonths; index += 1) {
      const installmentDateISO = addMonthsISO(firstDateISO, index);
      const newItem: FinanceItem = {
        id: makeId(),
        type: "DESPESA",
        title: title.trim(),
        category,
        amountCents,
        dateISO: installmentDateISO,
        createdAtISO,
        paymentType,
        status: index === 0 && installmentDateISO <= todayISO() ? status : "pending",
      };

      updated = financeAdd(newItem);
    }

    setItems(updated);
    window.setTimeout(() => {
      void financeRefreshFromApi()
        .then(setItems)
        .catch(() => undefined)
        .finally(() => {
          savingRef.current = false;
          setSaving(false);
        });
    }, isRecurring ? 1200 : 700);

    setTitle("");
    setAmount("");
    setDateISO(todayISO());
    setCategory(categoryOptions[0] ?? "Outros");
    setPaymentType("pix");
    setStatus("paid");
    setIsRecurring(false);
    setRecurrenceMode("forever");
    setRecurrenceMonths("6");
  }, [amount, category, categoryOptions, dateISO, isRecurring, paymentType, recurrenceMode, recurrenceMonths, saving, status, title]);

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

  function onDeleteAll() {
    if (despesas.length === 0) return;

    const ok = window.confirm(`Apagar todas as ${despesas.length} despesa(s)? Essa acao nao pode ser desfeita.`);
    if (!ok) return;

    let updated = items;
    for (const item of despesas) {
      updated = financeRemove(item.id);
    }

    setItems(updated);
    setFeedback(`${despesas.length} despesa(s) removida(s).`);
    window.setTimeout(() => {
      void financeRefreshFromApi().then(setItems).catch(() => undefined);
    }, 1500);
  }

  function toggleStatus(item: FinanceItem) {
    const nextStatus: FinanceStatus = item.status === "paid" ? "pending" : "paid";
    const updated = financeUpdate(item.id, { status: nextStatus });
    setItems(updated);
  }

  function handleEditSaved(updated: FinanceItem[]) {
    setItems(updated);
    setFeedback("Despesa atualizada.");
    window.setTimeout(() => {
      void financeRefreshFromApi().then(setItems).catch(() => undefined);
    }, 700);
  }

  return (
    <div className={`finance-view finance-expense${animate ? " is-ready" : ""}`}>
      <section className="finance-hero">
        <div>
          <span className="finance-kicker">Saidas</span>
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
            <span className="finance-kicker">Nova saida</span>
            <h3>Adicionar Despesa</h3>
          </div>
        </div>

        {feedback ? <div className="finance-feedback">{feedback}</div> : null}

        <div>
          <div className="finance-form-grid">
            <label className="finance-field finance-field-title">
              <span>Titulo</span>
              <input
                className="finance-control"
                placeholder="Ex: Mercado"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <CategoryPicker
              label="Categoria"
              value={category}
              options={categoryOptions}
              onChange={(nextCategory) => setCategory(nextCategory)}
              onCreateCategory={handleQuickCreateCategory}
            />

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
              <input className="finance-control" type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
            </label>

            <label className="finance-field">
              <span>Pagamento</span>
              <select
                className="finance-control"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentType)}
              >
                <option value="pix">Pix</option>
                <option value="debit">Debito</option>
                <option value="cash">Dinheiro</option>
                <option value="credit">Credito</option>
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

          <div className="finance-recurring-box">
            <label className="finance-check-row">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(event) => setIsRecurring(event.target.checked)}
              />
              <span>
                <strong>Gasto fixo mensal</strong>
                <small>Ex: aluguel, internet, mensalidade ou qualquer conta que volta todo mes.</small>
              </span>
            </label>

            {isRecurring ? (
              <div className="finance-recurring-options">
                <label className="finance-radio-card">
                  <input
                    type="radio"
                    name="recurrence-mode"
                    checked={recurrenceMode === "forever"}
                    onChange={() => setRecurrenceMode("forever")}
                  />
                  <span>
                    <strong>Sem data para acabar</strong>
                    <small>Cria os proximos 12 meses agora.</small>
                  </span>
                </label>

                <label className="finance-radio-card">
                  <input
                    type="radio"
                    name="recurrence-mode"
                    checked={recurrenceMode === "months"}
                    onChange={() => setRecurrenceMode("months")}
                  />
                  <span>
                    <strong>Por alguns meses</strong>
                    <small>Voce escolhe a quantidade de parcelas mensais.</small>
                  </span>
                </label>

                {recurrenceMode === "months" ? (
                  <label className="finance-field finance-recurring-months">
                    <span>Quantidade de meses</span>
                    <input
                      className="finance-control"
                      type="number"
                      min="1"
                      max="60"
                      value={recurrenceMonths}
                      onChange={(event) => setRecurrenceMonths(event.target.value)}
                    />
                  </label>
                ) : null}
              </div>
            ) : null}
          </div>

          <button className="finance-primary-button" type="button" disabled={saving} onClick={onAdd}>
            {saving ? "Salvando..." : isRecurring ? "Adicionar despesas mensais" : "Adicionar Despesa"}
          </button>
        </div>
      </div>

      <div className="chart-card finance-panel finance-list-panel">
        <div className="finance-section-heading">
          <div>
            <span className="finance-kicker">Historico</span>
            <h3>Lista de Despesas</h3>
          </div>
          <div className="finance-heading-actions">
            <span className="finance-count">{despesas.length} cadastrada(s)</span>
            {despesas.length > 0 ? (
              <button className="finance-danger-button finance-bulk-delete-button" type="button" onClick={onDeleteAll}>
                Apagar todas
              </button>
            ) : null}
          </div>
        </div>

        {despesas.length === 0 ? (
          <div className="finance-empty-state">
            <div className="finance-empty-icon">-</div>
            <strong>Nenhuma despesa cadastrada ainda.</strong>
            <span>Adicione sua primeira saida pelo formulario acima.</span>
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
                  <button className="categories-secondary-button" type="button" onClick={() => toggleStatus(d)}>
                    {d.status === "paid" ? "Marcar pendente" : "Marcar pago"}
                  </button>
                  <button className="categories-secondary-button" type="button" onClick={() => setEditingItem(d)}>
                    Editar
                  </button>
                  <button className="finance-danger-button" onClick={() => onDelete(d.id)}>
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingItem ? (
        <FinanceItemEditModal
          item={editingItem}
          categoryOptions={categoryOptions}
          onClose={() => setEditingItem(null)}
          onSaved={handleEditSaved}
        />
      ) : null}
    </div>
  );
}
