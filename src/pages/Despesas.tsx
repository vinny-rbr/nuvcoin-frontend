import { useCallback, useEffect, useMemo, useRef, useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
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
  if (paymentType === "debit") return "Débito";
  if (paymentType === "cash") return "Dinheiro";
  return "Crédito";
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

interface RecurringGroup {
  groupId: string;
  kind: "fixo" | "parcelado";
  title: string;
  category: string;
  paymentType: PaymentType;
  amountCents: number;
  total: number;
  items: FinanceItem[];
}

function buildRecurringGroups(despesas: FinanceItem[]): { groups: RecurringGroup[]; singles: FinanceItem[] } {
  const groupMap = new Map<string, FinanceItem[]>();
  const singles: FinanceItem[] = [];
  for (const item of despesas) {
    if (item.recurringGroupId) {
      const existing = groupMap.get(item.recurringGroupId) ?? [];
      existing.push(item);
      groupMap.set(item.recurringGroupId, existing);
    } else {
      singles.push(item);
    }
  }
  const groups: RecurringGroup[] = [];
  for (const [groupId, items] of groupMap) {
    const first = items[0];
    const sorted = [...items].sort((a, b) => a.dateISO.localeCompare(b.dateISO));
    groups.push({
      groupId,
      kind: first.recurringKind ?? "fixo",
      title: first.title,
      category: first.category,
      paymentType: first.paymentType,
      amountCents: first.amountCents,
      total: first.recurringTotal ?? items.length,
      items: sorted,
    });
  }
  groups.sort((a, b) => (a.items[0]?.dateISO ?? "").localeCompare(b.items[0]?.dateISO ?? ""));
  return { groups, singles };
}

function RecurringGroupRow({
  group, open, onToggle, onTogglePaid, onDelete,
}: {
  group: RecurringGroup;
  open: boolean;
  onToggle: () => void;
  onTogglePaid: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const paid = group.items.filter((m) => m.status === "paid").length;
  const total = group.items.length;
  const paidCents = paid * group.amountCents;
  const pendCents = (total - paid) * group.amountCents;
  const isParc = group.kind === "parcelado";
  const color = isParc ? "#8b5cf6" : "#ef4444";

  return (
    <div className={`fin-group${open ? " open" : ""}`}>
      <div className="fin-group-head" onClick={onToggle} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onToggle()}>
        <span className="fin-group-ic" style={{ background: `${color}26`, border: `1px solid ${color}40` }}>
          <span className="stack" />
          <span style={{ position: "relative", zIndex: 1 }}>💸</span>
        </span>
        <div className="fin-group-mid">
          <strong>{group.title}</strong>
          <div className="fin-group-path">{group.category}</div>
          <div className="fin-group-tags">
            <span className={isParc ? "tag-parc" : "tag-fixo"}>{isParc ? "Parcelado" : "Fixo mensal"}</span>
            <span className="tag-count">{isParc ? `${paid}/${total} pagas` : `${paid}/${total} pagos`}</span>
            <span className="fin-tx-tag">{getPaymentLabel(group.paymentType)}</span>
          </div>
        </div>
        <div className="fin-group-right">
          <span className="fin-group-amt">
            – {formatCentsBRL(group.amountCents)}
            <small>{isParc ? `${total}x` : "por mês"}</small>
          </span>
          <span className="fin-group-chev">▾</span>
        </div>
      </div>

      {open ? (
        <div className="fin-group-body">
          <div className="fin-bd-summary">
            <div className="fin-bd-cell pago">
              <div className="lbl">Já pago ({paid})</div>
              <div className="val">{formatCentsBRL(paidCents)}</div>
            </div>
            <div className="fin-bd-cell prev">
              <div className="lbl">Previsto ({total - paid})</div>
              <div className="val">{formatCentsBRL(pendCents)}</div>
            </div>
          </div>
          <div className="fin-mon-list">
            {group.items.map((item) => {
              const isPaid = item.status === "paid";
              return (
                <div key={item.id} className={`fin-mon${isPaid ? " is-paid" : ""}`}>
                  <span className="fin-mon-dot" />
                  <div className="fin-mon-info">
                    <strong>{new Date(`${item.dateISO}T00:00:00`).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</strong>
                    <span>{formatDateBR(item.dateISO)} · {isPaid ? "Pago" : "Pendente"}</span>
                  </div>
                  <div className="fin-mon-right">
                    <span className="fin-mon-amt">– {formatCentsBRL(item.amountCents)}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button type="button" className={`fin-mon-btn${isPaid ? " undo" : ""}`} onClick={(e) => { e.stopPropagation(); onTogglePaid(item.id); }}>
                        {isPaid ? "Desfazer" : "Marcar pago"}
                      </button>
                      <button type="button" className="fin-mon-btn undo" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}>✕</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
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

export default function Despesas() {
  const navigate = useNavigate();
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
  const [showForm, setShowForm] = useState(false);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChip, setActiveChip] = useState("Tudo");
  const savingRef = useRef(false);

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
        const options = categoriesForType(categories, "DESPESA");
        setCategoryRecords(categories.filter((item) => item.type === "DESPESA"));
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

  const despesas = useMemo(() => items.filter((x) => x.type === "DESPESA"), [items]);
  const summary = useMemo(() => calcFinanceSummary(items), [items]);
  const recurringData = useMemo(() => buildRecurringGroups(despesas), [despesas]);

  const chipOptions = useMemo(() => {
    const parents = new Set<string>();
    for (const item of despesas) {
      const parent = item.category.split(">")[0].trim();
      if (parent) parents.add(parent);
    }
    return ["Tudo", ...Array.from(parents).slice(0, 4)];
  }, [despesas]);

  const filteredDespesas = useMemo(() => {
    return despesas.filter((item) => {
      const matchesSearch = !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatCentsBRL(item.amountCents).includes(searchQuery);
      const matchesChip = activeChip === "Tudo" || item.category.split(">")[0].trim() === activeChip;
      return matchesSearch && matchesChip;
    });
  }, [despesas, searchQuery, activeChip]);

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
    if (!title.trim()) { financeDebugLog("validacao falhou despesa titulo", { title }); alert("Informe um titulo."); return; }
    if (amountCents <= 0) { financeDebugLog("valor invalido despesa", { amount, amountCents }); alert("Informe um valor valido."); return; }
    if (isRecurring && recurrenceMode === "months" && (!parsedMonths || parsedMonths < 1)) { alert("Informe por quantos meses essa despesa deve se repetir."); return; }
    savingRef.current = true;
    setSaving(true);
    setFeedback(isRecurring ? "Criando despesas mensais..." : "Salvando lancamento...");
    const createdAtISO = new Date().toISOString();
    const firstDateISO = isRecurring ? nextRecurringStartISO(dateISO) : dateISO;
    const groupId = isRecurring && totalMonths > 1 ? makeId() : undefined;
    const recurringKind = paymentType === "credit" ? "parcelado" as const : "fixo" as const;
    for (let index = 0; index < totalMonths; index += 1) {
      const installmentDateISO = addMonthsISO(firstDateISO, index);
      const newItem: FinanceItem = {
        id: makeId(), type: "DESPESA", title: title.trim(), category, amountCents,
        dateISO: installmentDateISO, createdAtISO, paymentType,
        status: index === 0 && installmentDateISO <= todayISO() ? status : "pending",
        ...(groupId ? { recurringGroupId: groupId, recurringKind, recurringTotal: totalMonths } : {}),
      };
      financeAdd(newItem);
    }
    window.setTimeout(() => { savingRef.current = false; setSaving(false); setFeedback(null); }, isRecurring ? 800 : 400);
    setTitle(""); setAmount(""); setDateISO(todayISO());
    setCategory(categoryOptions[0] ?? "Outros");
    setPaymentType("pix"); setStatus("paid"); setIsRecurring(false);
    setRecurrenceMode("forever"); setRecurrenceMonths("6");
    setShowForm(false);
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
    setOpenRowId(null);
  }

  function onDeleteAll() {
    if (despesas.length === 0) return;
    const ok = window.confirm(`Apagar todas as ${despesas.length} despesa(s)? Essa acao nao pode ser desfeita.`);
    if (!ok) return;
    let updated = items;
    for (const item of despesas) { updated = financeRemove(item.id); }
    setItems(updated);
    setFeedback(`${despesas.length} despesa(s) removida(s).`);
    window.setTimeout(() => { setFeedback(null); }, 2000);
  }

  function toggleStatus(item: FinanceItem) {
    const nextStatus: FinanceStatus = item.status === "paid" ? "pending" : "paid";
    const updated = financeUpdate(item.id, { status: nextStatus });
    setItems(updated);
  }

  function handleEditSaved(updated: FinanceItem[]) {
    setItems(updated);
    setFeedback("Despesa atualizada.");
    window.setTimeout(() => { setFeedback(null); }, 2000);
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

      <div className="fin-type-tabs">
        <button type="button" className="fin-type-tab" onClick={() => navigate("/receitas")}>Receitas</button>
        <button type="button" className="fin-type-tab is-active">Despesas</button>
      </div>

      <div className="ov-card">
        <DonutRing recCents={summary.totalReceitasCents} desCents={summary.totalDespesasCents} />
        <div className="ov-side">
          <div>
            <div className="ov-stat-row">
              <span className="ov-stat-dot" style={{ background: "#22c55e" }} />
              <span className="ov-stat-label">Receitas</span>
            </div>
            <div className="ov-stat-val" style={{ color: "#86efac" }}>{formatCentsBRL(summary.totalReceitasCents)}</div>
          </div>
          <div>
            <div className="ov-stat-row">
              <span className="ov-stat-dot" style={{ background: "#ef4444" }} />
              <span className="ov-stat-label">Despesas (pagas)</span>
            </div>
            <div className="ov-stat-val" style={{ color: "#fca5a5" }}>{formatCentsBRL(summary.totalDespesasCents)}</div>
          </div>
        </div>
      </div>

      <div className="ov-saldo">
        <span className="ov-saldo-label">Saldo real</span>
        <span className="ov-saldo-val" style={{ color: summary.saldoCents >= 0 ? "#86efac" : "#fca5a5" }}>
          {formatCentsBRL(summary.saldoCents)}
        </span>
      </div>

      {summary.totalPendingDespesasCents > 0 ? (
        <div className="ov-prev">
          <span className="ov-prev-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/></svg>
            Previsto (pendente)
          </span>
          <span className="ov-prev-val">{formatCentsBRL(summary.totalPendingDespesasCents)}</span>
        </div>
      ) : null}

      <button
        type="button"
        className="fin-cta"
        onClick={() => setShowForm((v) => !v)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 5v14"/><path d="M5 12h14"/>
        </svg>
        {showForm ? "Fechar formulário" : "Adicionar despesa"}
      </button>

      {showForm ? (
        <div className="chart-card finance-panel finance-form-panel">
          <div className="fin-form-close">
            <div>
              <span className="finance-kicker">Nova saída</span>
              <h3 style={{ margin: "3px 0 0", fontSize: 20, fontWeight: 700 }}>Adicionar Despesa</h3>
            </div>
            <button type="button" className="fin-form-close-btn" onClick={() => setShowForm(false)}>✕</button>
          </div>

          {feedback ? <div className="finance-feedback">{feedback}</div> : null}

          <div className="finance-form-grid">
            <label className="finance-field finance-field-title">
              <span>Título</span>
              <input className="finance-control" placeholder="Ex: Mercado" value={title} onChange={(e) => setTitle(e.target.value)} />
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
              <input className="finance-control" inputMode="decimal" placeholder="Ex: 150,00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>

            <label className="finance-field">
              <span>Data</span>
              <input className="finance-control" type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
            </label>

            <label className="finance-field">
              <span>Pagamento</span>
              <select className="finance-control" value={paymentType} onChange={(e) => setPaymentType(e.target.value as PaymentType)}>
                <option value="pix">Pix</option>
                <option value="debit">Débito</option>
                <option value="cash">Dinheiro</option>
                <option value="credit">Crédito</option>
              </select>
            </label>

            <label className="finance-field">
              <span>Status</span>
              <select className="finance-control" value={status} onChange={(e) => setStatus(e.target.value as FinanceStatus)}>
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
              </select>
            </label>
          </div>

          <div className="finance-recurring-box">
            <label className="finance-check-row">
              <input type="checkbox" checked={isRecurring} onChange={(event) => setIsRecurring(event.target.checked)} />
              <span>
                <strong>Gasto fixo mensal</strong>
                <small>Ex: aluguel, internet, mensalidade ou qualquer conta que volta todo mes.</small>
              </span>
            </label>

            {isRecurring ? (
              <div className="finance-recurring-options">
                <label className="finance-radio-card">
                  <input type="radio" name="recurrence-mode" checked={recurrenceMode === "forever"} onChange={() => setRecurrenceMode("forever")} />
                  <span>
                    <strong>Sem data para acabar</strong>
                    <small>Cria os proximos 12 meses agora.</small>
                  </span>
                </label>
                <label className="finance-radio-card">
                  <input type="radio" name="recurrence-mode" checked={recurrenceMode === "months"} onChange={() => setRecurrenceMode("months")} />
                  <span>
                    <strong>Por alguns meses</strong>
                    <small>Voce escolhe a quantidade de parcelas mensais.</small>
                  </span>
                </label>
                {recurrenceMode === "months" ? (
                  <label className="finance-field finance-recurring-months">
                    <span>Quantidade de meses</span>
                    <input className="finance-control" type="number" min="1" max="60" value={recurrenceMonths} onChange={(event) => setRecurrenceMonths(event.target.value)} />
                  </label>
                ) : null}
              </div>
            ) : null}
          </div>

          <button className="finance-primary-button" type="button" disabled={saving} onClick={onAdd}>
            {saving ? "Salvando..." : isRecurring ? "Adicionar despesas mensais" : "Adicionar Despesa"}
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
            <span className="fin-hist-cnt">{recurringData.groups.length + recurringData.singles.length} lançamentos</span>
            {despesas.length > 0 ? (
              <button className="finance-danger-button finance-bulk-delete-button" type="button" onClick={onDeleteAll}>
                Apagar todas
              </button>
            ) : null}
          </div>
        </div>

        {despesas.length > 0 ? (
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

        {despesas.length === 0 ? (
          <div className="finance-empty-state">
            <div className="finance-empty-icon">–</div>
            <strong>Nenhuma despesa cadastrada ainda.</strong>
            <span>Toque em "Adicionar despesa" para registrar sua primeira saída.</span>
          </div>
        ) : recurringData.groups.length === 0 && filteredDespesas.length === 0 ? (
          <div className="finance-empty-state">
            <div className="finance-empty-icon">🔍</div>
            <strong>Nenhum resultado encontrado.</strong>
            <span>Tente outro termo ou categoria.</span>
          </div>
        ) : (
          <div className="finance-list">
            {recurringData.groups.map((group) => (
              <RecurringGroupRow
                key={group.groupId}
                group={group}
                open={openGroupId === group.groupId}
                onToggle={() => setOpenGroupId((prev) => (prev === group.groupId ? null : group.groupId))}
                onTogglePaid={(id) => { toggleStatus(group.items.find((i) => i.id === id)!); }}
                onDelete={onDelete}
              />
            ))}
            {filteredDespesas.filter((d) => !d.recurringGroupId).map((d) => (
              <div
                key={d.id}
                className={`fin-tx${openRowId === d.id ? " open" : ""}`}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("button")) return;
                  setOpenRowId((prev) => (prev === d.id ? null : d.id));
                }}
              >
                <span className="fin-tx-ic" style={{ background: "rgba(239,68,68,.16)", fontSize: 20 }}>💸</span>
                <div className="fin-tx-mid">
                  <strong>{d.title}</strong>
                  <div className="fin-tx-path">{d.category}</div>
                  <div className="fin-tx-tags">
                    <span className="fin-tx-tag">{formatDateBR(d.dateISO)}</span>
                    <span className="fin-tx-tag">{getPaymentLabel(d.paymentType)}</span>
                    <span className={`fin-tx-tag ${d.status === "paid" ? "pago" : "pend"}`}>
                      {d.status === "paid" ? "Pago" : "Pendente"}
                    </span>
                  </div>
                </div>
                <div className="fin-tx-right">
                  <span className="fin-tx-amt" style={{ color: "#fca5a5" }}>– {formatCentsBRL(d.amountCents)}</span>
                  <button
                    type="button"
                    className="fin-tx-menu-btn"
                    onClick={(e) => { e.stopPropagation(); setOpenRowId((prev) => (prev === d.id ? null : d.id)); }}
                  >•••</button>
                </div>
                {openRowId === d.id ? (
                  <div className="fin-tx-actions">
                    <button type="button" className="fin-tx-act" onClick={(e) => { e.stopPropagation(); toggleStatus(d); }}>
                      {d.status === "paid" ? "Marcar pendente" : "Marcar pago"}
                    </button>
                    <button type="button" className="fin-tx-act" onClick={(e) => { e.stopPropagation(); setEditingItem(d); setOpenRowId(null); }}>
                      Editar
                    </button>
                    <button type="button" className="fin-tx-act danger" onClick={(e) => { e.stopPropagation(); onDelete(d.id); }}>
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
