import { useCallback, useEffect, useMemo, useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { FinanceCategory, FinanceCategoryOption, FinanceItem, FinanceStatus } from "../types/finance";
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

function DonutRing({ recCents, desCents }: { recCents: number; desCents: number }) {
  const r = 51;
  const circ = 2 * Math.PI * r;
  const total = recCents + desCents;
  const pctRec = total > 0 ? Math.round((recCents / total) * 100) : 50;
  const gLen = circ * pctRec / 100;
  return (
    <div className="ov-ring">
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(148,163,184,.14)" strokeWidth="13" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#ef4444" strokeWidth="13" strokeLinecap="round" strokeDasharray={`${circ}`} />
        <circle cx="60" cy="60" r={r} fill="none" stroke="#22c55e" strokeWidth="13" strokeLinecap="round" strokeDasharray={`${gLen} ${circ - gLen}`} />
      </svg>
      <div className="ov-ring-ctr">
        <small>Entrou</small>
        <b style={{ color: "#86efac" }}>{pctRec}%</b>
      </div>
    </div>
  );
}

export default function Receitas() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dateISO, setDateISO] = useState(todayISO());
  const [category, setCategory] = useState<FinanceCategory>(DEFAULT_CATEGORIES.RECEITA[0]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(DEFAULT_CATEGORIES.RECEITA);
  const [categoryRecords, setCategoryRecords] = useState<FinanceCategoryOption[]>([]);
  const [status, setStatus] = useState<FinanceStatus>("paid");
  const [animate, setAnimate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<FinanceItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChip, setActiveChip] = useState("Tudo");

  useEffect(() => {
    const load = () => { setItems(financeList()); };
    load();
    void financeRefreshFromApi().then(setItems).catch(() => undefined);
    const unsubscribe = financeSubscribe(load);
    const refresh = () => { void financeRefreshFromApi().then(setItems).catch(() => undefined); };
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
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { setAnimate(true); }, 40);
    return () => { window.clearTimeout(timeoutId); };
  }, []);

  const summary = useMemo(() => calcFinanceSummary(items), [items]);
  const receitas = useMemo(() => items.filter((x) => x.type === "RECEITA"), [items]);

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
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatBRLFromCents(item.amountCents).includes(searchQuery);
      const matchesChip = activeChip === "Tudo" || item.category.split(">")[0].trim() === activeChip;
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
    if (!title.trim() || !amount.trim()) { financeDebugLog("validacao falhou receita", { title, amount }); alert("Preencha titulo e valor."); return; }
    const amountCents = parseBRLToCents(amount);
    if (amountCents <= 0) { financeDebugLog("valor invalido receita", { amount, amountCents }); alert("Informe um valor valido."); return; }
    const newItem: FinanceItem = {
      id: makeId(), type: "RECEITA", title: title.trim(), category, amountCents,
      dateISO, createdAtISO: new Date().toISOString(), paymentType: "pix", status,
    };
    setSaving(true);
    setFeedback("Salvando lancamento...");
    financeAdd(newItem);
    window.setTimeout(() => { setSaving(false); setFeedback(null); }, 400);
    setTitle(""); setAmount(""); setDateISO(todayISO());
    setCategory(categoryOptions[0] ?? "Outros"); setStatus("paid");
    setShowForm(false);
  }, [amount, category, categoryOptions, dateISO, saving, status, title]);

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
    const ok = confirm("Remover esta receita?");
    if (!ok) return;
    const updated = financeRemove(id);
    setItems(updated);
    setOpenRowId(null);
  }

  function toggleStatus(item: FinanceItem) {
    const nextStatus: FinanceStatus = item.status === "paid" ? "pending" : "paid";
    const updated = financeUpdate(item.id, { status: nextStatus });
    setItems(updated);
  }

  function handleEditSaved(updated: FinanceItem[]) {
    setItems(updated);
    setFeedback("Receita atualizada.");
    window.setTimeout(() => { setFeedback(null); }, 2000);
  }

  function handleRemoveAll() {
    if (receitas.length === 0) return;
    const ok = window.confirm(`Apagar todas as ${receitas.length} receita(s)? Essa acao nao pode ser desfeita.`);
    if (!ok) return;
    let updated = items;
    for (const item of receitas) { updated = financeRemove(item.id); }
    setItems(updated);
    setFeedback(`${receitas.length} receita(s) removida(s).`);
    window.setTimeout(() => { setFeedback(null); }, 2000);
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

      <div className="fin-type-tabs">
        <button type="button" className="fin-type-tab is-active">Receitas</button>
        <button type="button" className="fin-type-tab" onClick={() => navigate("/despesas")}>Despesas</button>
      </div>

      <div className="ov-card">
        <DonutRing recCents={summary.totalReceitasCents} desCents={summary.totalDespesasCents} />
        <div className="ov-side">
          <div>
            <div className="ov-stat-row">
              <span className="ov-stat-dot" style={{ background: "#22c55e" }} />
              <span className="ov-stat-label">Receitas</span>
            </div>
            <div className="ov-stat-val" style={{ color: "#86efac" }}>{formatBRLFromCents(summary.totalReceitasCents)}</div>
          </div>
          <div>
            <div className="ov-stat-row">
              <span className="ov-stat-dot" style={{ background: "#ef4444" }} />
              <span className="ov-stat-label">Despesas</span>
            </div>
            <div className="ov-stat-val" style={{ color: "#fca5a5" }}>{formatBRLFromCents(summary.totalDespesasCents)}</div>
          </div>
        </div>
      </div>

      <div className="ov-saldo">
        <span className="ov-saldo-label">Saldo</span>
        <span className="ov-saldo-val" style={{ color: summary.saldoCents >= 0 ? "#86efac" : "#fca5a5" }}>
          {formatBRLFromCents(summary.saldoCents)}
        </span>
      </div>

      <button
        type="button"
        className="fin-cta"
        onClick={() => setShowForm((v) => !v)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 5v14"/><path d="M5 12h14"/>
        </svg>
        {showForm ? "Fechar formulário" : "Adicionar receita"}
      </button>

      {showForm ? (
        <div className="chart-card finance-panel finance-form-panel">
          <div className="fin-form-close">
            <div>
              <span className="finance-kicker">Nova entrada</span>
              <h3 style={{ margin: "3px 0 0", fontSize: 20, fontWeight: 700 }}>Adicionar Receita</h3>
            </div>
            <button type="button" className="fin-form-close-btn" onClick={() => setShowForm(false)}>✕</button>
          </div>

          {feedback ? <div className="finance-feedback">{feedback}</div> : null}

          <div className="finance-form-grid">
            <label className="finance-field finance-field-title">
              <span>Título</span>
              <input className="finance-control" placeholder="Ex: Salário" value={title} onChange={(e) => setTitle(e.target.value)} />
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
              <input className="finance-control" inputMode="decimal" placeholder="Ex: 2500,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>

            <label className="finance-field">
              <span>Data</span>
              <input className="finance-control" type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
            </label>

            <label className="finance-field">
              <span>Status</span>
              <select className="finance-control" value={status} onChange={(e) => setStatus(e.target.value as FinanceStatus)}>
                <option value="paid">Recebido</option>
                <option value="pending">Previsto</option>
              </select>
            </label>
          </div>

          <button className="finance-primary-button" type="button" disabled={saving} onClick={handleAdd}>
            {saving ? "Salvando..." : "Adicionar Receita"}
          </button>
        </div>
      ) : null}

      <div className="chart-card finance-panel finance-list-panel">
        <div className="fin-hist-head">
          <div className="fin-hist-head-l">
            <div className="k">Histórico</div>
            <h3>Lançamentos</h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="fin-hist-cnt">{receitas.length} no mês</span>
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
                placeholder="Buscar por nome ou valor…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="chip-row">
              {chipOptions.map((chip) => (
                <button key={chip} type="button" className={`chip${activeChip === chip ? " is-active" : ""}`} onClick={() => setActiveChip(chip)}>
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
            <span>Toque em "Adicionar receita" para registrar sua primeira entrada.</span>
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
              <div
                key={item.id}
                className={`fin-tx${openRowId === item.id ? " open" : ""}`}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("button")) return;
                  setOpenRowId((prev) => (prev === item.id ? null : item.id));
                }}
              >
                <span className="fin-tx-ic" style={{ background: "rgba(34,197,94,.16)", fontSize: 20 }}>💰</span>
                <div className="fin-tx-mid">
                  <strong>{item.title}</strong>
                  <div className="fin-tx-path">{item.category}</div>
                  <div className="fin-tx-tags">
                    <span className="fin-tx-tag">{formatDateBR(item.dateISO)}</span>
                    <span className={`fin-tx-tag ${item.status === "paid" ? "pago" : "pend"}`}>
                      {item.status === "paid" ? "Recebido" : "Previsto"}
                    </span>
                  </div>
                </div>
                <div className="fin-tx-right">
                  <span className="fin-tx-amt" style={{ color: "#86efac" }}>+ {formatBRLFromCents(item.amountCents)}</span>
                  <button
                    type="button"
                    className="fin-tx-menu-btn"
                    onClick={(e) => { e.stopPropagation(); setOpenRowId((prev) => (prev === item.id ? null : item.id)); }}
                  >•••</button>
                </div>
                {openRowId === item.id ? (
                  <div className="fin-tx-actions">
                    <button type="button" className="fin-tx-act" onClick={(e) => { e.stopPropagation(); toggleStatus(item); }}>
                      {item.status === "paid" ? "Marcar previsto" : "Marcar recebido"}
                    </button>
                    <button type="button" className="fin-tx-act" onClick={(e) => { e.stopPropagation(); setEditingItem(item); setOpenRowId(null); }}>
                      Editar
                    </button>
                    <button type="button" className="fin-tx-act danger" onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}>
                      Remover
                    </button>
                  </div>
                ) : null}
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
