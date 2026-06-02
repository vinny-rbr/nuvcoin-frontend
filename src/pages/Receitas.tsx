import { useCallback, useEffect, useMemo, useState, type SyntheticEvent } from "react";
import type { FinanceCategory, FinanceCategoryOption, FinanceItem } from "../types/finance";
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
import CategoryPicker from "../components/CategoryPicker";
import FinanceItemEditModal from "../components/FinanceItemEditModal";
import { categoriesForType, createFinanceCategory, DEFAULT_CATEGORIES, listFinanceCategories } from "../lib/financeCategoriesService";
import { calcFinanceSummary } from "../lib/financeStorage";
import "./dashboard.css";
import "./finance.css";

function formatBRLFromCents(valueCents: number): string {
  return (valueCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
  const [category, setCategory] = useState<FinanceCategory>(DEFAULT_CATEGORIES.RECEITA[0]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(DEFAULT_CATEGORIES.RECEITA);
  const [categoryRecords, setCategoryRecords] = useState<FinanceCategoryOption[]>([]);
  const [animate, setAnimate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<FinanceItem | null>(null);

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
        const options = categoriesForType(categories, "RECEITA");
        setCategoryRecords(categories.filter((item) => item.type === "RECEITA"));
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

  const summary = useMemo(() => calcFinanceSummary(items), [items]);
  const receitas = useMemo(() => items.filter((x) => x.type === "RECEITA"), [items]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChip, setActiveChip] = useState("Tudo");

  const chipOptions = useMemo(() => {
    const parents = new Set<string>();
    for (const item of receitas) {
      const parent = item.category.split(">")[0].trim();
      if (parent) parents.add(parent);
    }
    return ["Tudo", ...Array.from(parents).slice(0, 4)];
  }, [receitas]);

  const filteredReceitas = useMemo(() => {
    return receitas.filter((item) => {
      const matchesSearch = !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesChip = activeChip === "Tudo" ||
        item.category.split(">")[0].trim() === activeChip;
      return matchesSearch && matchesChip;
    });
  }, [receitas, searchQuery, activeChip]);

  async function handleQuickCreateCategory(name: string, parentPath?: string): Promise<string> {
    const parent = parentPath ? categoryRecords.find((item) => item.fullPath === parentPath) : null;
    const created = await createFinanceCategory("RECEITA", name, parent?.id ?? null, parent?.icon ?? "💼", parent?.color ?? "#60a5fa");
    const categories = await listFinanceCategories();
    const options = categoriesForType(categories, "RECEITA");
    setCategoryRecords(categories.filter((item) => item.type === "RECEITA"));
    setCategoryOptions(options);

    const expectedPath = parentPath ? `${parentPath} > ${created.name}` : created.name;
    const createdValue = options.find((option) => option === expectedPath || option === created.name || option.endsWith(`> ${created.name}`)) ?? expectedPath;
    setCategory(createdValue);
    return createdValue;
  }

  const handleAdd = useCallback((event?: SyntheticEvent | Event) => {
    event?.preventDefault();
    event?.stopPropagation();
    financeDebugLog("handleAdd receita iniciou", { title, amount, dateISO, saving });

    if (saving) return;
    setFeedback(null);

    if (!title.trim() || !amount.trim()) {
      financeDebugLog("validacao falhou receita", { title, amount });
      alert("Preencha titulo e valor.");
      return;
    }

    const amountCents = parseBRLToCents(amount);

    if (amountCents <= 0) {
      financeDebugLog("valor invalido receita", { amount, amountCents });
      alert("Informe um valor valido.");
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
    setCategory(categoryOptions[0] ?? "Outros");
  }, [amount, category, categoryOptions, dateISO, saving, title]);

  useEffect(() => {
    function handleNativeAdd(event: Event) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-finance-add='receita']")) return;

      handleAdd(event);
    }

    document.addEventListener("click", handleNativeAdd, true);
    document.addEventListener("pointerdown", handleNativeAdd, true);
    document.addEventListener("touchstart", handleNativeAdd, true);

    return () => {
      document.removeEventListener("click", handleNativeAdd, true);
      document.removeEventListener("pointerdown", handleNativeAdd, true);
      document.removeEventListener("touchstart", handleNativeAdd, true);
    };
  }, [handleAdd]);

  function handleRemove(id: string) {
    const updated = financeRemove(id);
    setItems(updated);
  }

  function handleEditSaved(updated: FinanceItem[]) {
    setItems(updated);
    setFeedback("Receita atualizada.");
    window.setTimeout(() => {
      void financeRefreshFromApi().then(setItems).catch(() => undefined);
    }, 700);
  }

  function handleRemoveAll() {
    if (receitas.length === 0) return;

    const ok = window.confirm(`Apagar todas as ${receitas.length} receita(s)? Essa acao nao pode ser desfeita.`);
    if (!ok) return;

    let updated = items;
    for (const item of receitas) {
      updated = financeRemove(item.id);
    }

    setItems(updated);
    setFeedback(`${receitas.length} receita(s) removida(s).`);
    window.setTimeout(() => {
      void financeRefreshFromApi().then(setItems).catch(() => undefined);
    }, 1500);
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

        {feedback ? <div className="finance-feedback">{feedback}</div> : null}

        <div>
          <div className="finance-form-grid">
            <label className="finance-field finance-field-title">
              <span>Titulo</span>
              <input
                className="finance-control"
                placeholder="Ex: Salario"
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

          <button className="finance-primary-button" type="button" disabled={saving} onClick={handleAdd}>
            {saving ? "Salvando..." : "Adicionar Receita"}
          </button>
        </div>
      </div>

      <div className="chart-card finance-panel finance-list-panel">
        <div className="finance-section-heading">
          <div>
            <span className="finance-kicker">Historico</span>
            <h3>Lista de Receitas</h3>
          </div>
          <div className="finance-heading-actions">
            <span className="finance-count">{receitas.length} cadastrada(s)</span>
            {receitas.length > 0 ? (
              <button className="finance-danger-button finance-bulk-delete-button" type="button" onClick={handleRemoveAll}>
                Apagar todas
              </button>
            ) : null}
          </div>
        </div>

        {receitas.length > 0 ? (
          <div className="finance-filter-row">
            <div className="finance-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/>
              </svg>
              <input
                className="finance-control"
                placeholder="Buscar receita..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="chip-row">
              {chipOptions.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className={`chip${activeChip === chip ? " is-active" : ""}`}
                  onClick={() => setActiveChip(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {receitas.length === 0 ? (
          <div className="finance-empty-state">
            <div className="finance-empty-icon">+</div>
            <strong>Nenhuma receita cadastrada ainda.</strong>
            <span>Adicione sua primeira entrada pelo formulario acima.</span>
          </div>
        ) : filteredReceitas.length === 0 ? (
          <div className="finance-empty-state">
            <div className="finance-empty-icon">🔍</div>
            <strong>Nenhum resultado encontrado.</strong>
            <span>Tente outro termo ou categoria.</span>
          </div>
        ) : (
          <div className="finance-list">
            {filteredReceitas.map((item) => (
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
                  <div className="finance-row-value green">{formatBRLFromCents(item.amountCents)}</div>

                  <button className="categories-secondary-button" type="button" onClick={() => setEditingItem(item)}>
                    Editar
                  </button>

                  <button className="finance-danger-button" onClick={() => handleRemove(item.id)}>
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
