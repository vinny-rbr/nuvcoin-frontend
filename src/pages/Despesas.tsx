import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import type { FinanceCategoryOption, FinanceItem, FinanceStatus, PaymentType } from "../types/finance";
import {
  financeAdd,
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
import BankAccountChips from "../components/BankAccountChips";
import { categoriesForType, createFinanceCategory, DEFAULT_CATEGORIES, listFinanceCategories } from "../lib/financeCategoriesService";
import { adjustBankAccountBalance } from "../lib/bankAccountsService";
import type { BankAccount } from "../types/finance";
import "./finance.css";

const MESES_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function parseAmountToCents(input: string): number {
  const normalized = input.trim().replace(/\./g, "").replace(",", ".");
  const value = Number(normalized);
  if (Number.isNaN(value) || value <= 0) return 0;
  return Math.round(value * 100);
}

function formatCentsBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
  target.setDate(Math.min(day, lastDay));
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
}

function nextRecurringStartISO(dateISO: string): string {
  const today = todayISO();
  if (dateISO >= today) return dateISO;
  const day = Number(dateISO.slice(8, 10));
  const now = new Date();
  const curYY = now.getFullYear();
  const curMM = now.getMonth();
  const curLastDay = new Date(curYY, curMM + 1, 0).getDate();
  const curCandidate = `${curYY}-${String(curMM + 1).padStart(2, "0")}-${String(Math.min(day, curLastDay)).padStart(2, "0")}`;
  if (curCandidate >= today) return curCandidate;
  const nextDate = new Date(curYY, curMM + 1, 1);
  const nextLastDay = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}-${String(Math.min(day, nextLastDay)).padStart(2, "0")}`;
}

function getDayLabel(dateISO: string): string {
  const today = todayISO();
  const d = new Date(today);
  d.setDate(d.getDate() - 1);
  const yesterdayISO = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (dateISO === today) return "Hoje";
  if (dateISO === yesterdayISO) return "Ontem";
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

function groupByDay(items: FinanceItem[]): { dateISO: string; label: string; items: FinanceItem[] }[] {
  const map = new Map<string, FinanceItem[]>();
  for (const item of items) {
    const day = item.dateISO.slice(0, 10);
    const existing = map.get(day) ?? [];
    existing.push(item);
    map.set(day, existing);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateISO, dayItems]) => ({ dateISO, label: getDayLabel(dateISO), items: dayItems }));
}

function TxRow({
  item, catIcon, catColor, onToggle, onOpen,
}: {
  item: FinanceItem;
  catIcon: string;
  catColor: string;
  onToggle: (item: FinanceItem) => void;
  onOpen: (item: FinanceItem) => void;
}) {
  const paid = item.status === "paid";
  return (
    <div className="dx-row" onClick={() => onOpen(item)}>
      <span className="dx-row-ic" style={{ background: `${catColor}28`, boxShadow: `inset 0 0 0 1px ${catColor}4d` }}>
        {catIcon}
      </span>
      <div className="dx-row-mid">
        <div className="dx-row-title">{item.title}</div>
        <div className="dx-row-sub">{item.category} · {getPaymentLabel(item.paymentType)}</div>
      </div>
      <div className="dx-row-right">
        <div className="dx-row-amt" style={{ color: "#fca5a5" }}>– {formatCentsBRL(item.amountCents)}</div>
        <button
          type="button"
          className={`dx-status${paid ? " is-paid" : ""}`}
          title={paid ? "Pago — toque para marcar pendente" : "Pendente — toque para marcar pago"}
          onClick={(e) => { e.stopPropagation(); onToggle(item); }}
          style={paid
            ? { background: "rgba(34,197,94,.18)", color: "#4ade80", borderColor: "transparent" }
            : { color: "#fbbf24", borderColor: "rgba(251,191,36,.55)" }}
        >
          {paid ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          ) : (
            <span className="dx-status-ring" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function Despesas() {
  const navigate = useNavigate();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(DEFAULT_CATEGORIES.DESPESA);
  const [categoryRecords, setCategoryRecords] = useState<FinanceCategoryOption[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinanceItem | null>(null);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all");

  // form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES.DESPESA[0]);
  const [amount, setAmount] = useState("");
  const [dateISO, setDateISO] = useState(todayISO());
  const [paymentType, setPaymentType] = useState<PaymentType>("pix");
  const [status, setStatus] = useState<FinanceStatus>("pending");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceMode, setRecurrenceMode] = useState<"forever" | "months">("forever");
  const [recurrenceMonths, setRecurrenceMonths] = useState("6");
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  useEffect(() => {
    const load = () => setItems(financeList());
    load();
    void financeRefreshFromApi().then(setItems).catch(() => undefined);
    const unsub = financeSubscribe(load);
    const refresh = () => { void financeRefreshFromApi().then(setItems).catch(() => undefined); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { unsub(); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);

  useEffect(() => {
    let mounted = true;
    void listFinanceCategories().then((cats) => {
      if (!mounted) return;
      const opts = categoriesForType(cats, "DESPESA");
      setCategoryRecords(cats.filter((c) => c.type === "DESPESA"));
      setCategoryOptions(opts);
      setCategory((cur) => (opts.includes(cur) ? cur : opts[0] ?? "Outros"));
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  // open form from Layout FAB
  useEffect(() => {
    function onFabEvent() {
      resetForm();
      setSheetOpen(true);
    }
    window.addEventListener("conciliaai:open-despesa", onFabEvent);
    return () => window.removeEventListener("conciliaai:open-despesa", onFabEvent);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryOptions]);

  // close type menu on outside click
  useEffect(() => {
    if (!typeMenuOpen) return;
    const close = () => setTypeMenuOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [typeMenuOpen]);

  function resetForm() {
    setTitle(""); setAmount(""); setDateISO(todayISO());
    setPaymentType("pix"); setStatus("pending");
    setIsRecurring(false); setRecurrenceMode("forever"); setRecurrenceMonths("6");
    setSelectedAccount(null);
    setCategory(categoryOptions[0] ?? "Outros");
  }

  const categoryMap = useMemo(() => {
    const map = new Map<string, { icon: string; color: string }>();
    for (const cat of categoryRecords) {
      const icon = cat.icon ?? "💼";
      const color = cat.color ?? "#60a5fa";
      if (cat.fullPath) map.set(cat.fullPath, { icon, color });
      map.set(cat.name, { icon, color });
    }
    return map;
  }, [categoryRecords]);

  function getCatInfo(cat: string) {
    return categoryMap.get(cat) ?? { icon: "💸", color: "#ef4444" };
  }

  function shiftMonth(delta: number) {
    setViewMonth((m) => {
      let next = m + delta;
      if (next < 0) { setViewYear((y) => y - 1); return 11; }
      if (next > 11) { setViewYear((y) => y + 1); return 0; }
      return next;
    });
    setEditingItem(null);
  }

  function goToday() {
    const d = new Date();
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  const despesas = useMemo(() => items.filter((x) => x.type === "DESPESA"), [items]);

  const monthItems = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
    return despesas.filter((x) => x.dateISO.startsWith(prefix));
  }, [despesas, viewYear, viewMonth]);

  const totals = useMemo(() => {
    let pend = 0, paid = 0;
    for (const item of monthItems) {
      if (item.status === "paid") paid += item.amountCents;
      else pend += item.amountCents;
    }
    return { pend, paid };
  }, [monthItems]);

  const visible = useMemo(() => {
    return monthItems.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const mq = !q || item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || formatCentsBRL(item.amountCents).includes(q);
      const mf = filter === "all" || item.status === (filter === "paid" ? "paid" : "pending");
      return mq && mf;
    });
  }, [monthItems, searchQuery, filter]);

  const groups = useMemo(() => groupByDay(visible), [visible]);

  function toggleStatus(item: FinanceItem) {
    const nextStatus: FinanceStatus = item.status === "paid" ? "pending" : "paid";
    setItems(financeUpdate(item.id, { status: nextStatus }));
  }

  function onDelete(id: string) {
    if (!confirm("Remover este lançamento?")) return;
    setItems(financeRemove(id));
    setEditingItem(null);
  }

  function handleEditSaved(updated: FinanceItem[]) {
    setItems(updated);
  }

  async function handleQuickCreateCategory(name: string, parentPath?: string): Promise<string> {
    const parent = parentPath ? categoryRecords.find((c) => c.fullPath === parentPath) : null;
    const created = await createFinanceCategory("DESPESA", name, parent?.id ?? null, parent?.icon ?? "💼", parent?.color ?? "#60a5fa");
    const cats = await listFinanceCategories();
    const opts = categoriesForType(cats, "DESPESA");
    setCategoryRecords(cats.filter((c) => c.type === "DESPESA"));
    setCategoryOptions(opts);
    const expectedPath = parentPath ? `${parentPath} > ${created.name}` : created.name;
    const val = opts.find((o) => o === expectedPath || o === created.name || o.endsWith(`> ${created.name}`)) ?? expectedPath;
    setCategory(val);
    return val;
  }

  const onAdd = useCallback(() => {
    if (savingRef.current || saving) return;
    const amountCents = parseAmountToCents(amount);
    const parsedMonths = Number(recurrenceMonths);
    const totalMonths = isRecurring
      ? (recurrenceMode === "forever" ? 12 : Math.min(Math.max(Math.trunc(parsedMonths || 0), 1), 60))
      : 1;
    if (!title.trim()) { alert("Informe um título."); return; }
    if (amountCents <= 0) { alert("Informe um valor válido."); return; }
    savingRef.current = true;
    setSaving(true);
    const createdAtISO = new Date().toISOString();
    const firstDateISO = isRecurring ? nextRecurringStartISO(dateISO) : dateISO;
    const groupId = isRecurring && totalMonths > 1 ? makeId() : undefined;
    const recurringKind = paymentType === "credit" ? "parcelado" as const : "fixo" as const;
    for (let i = 0; i < totalMonths; i++) {
      const isoDate = addMonthsISO(firstDateISO, i);
      financeAdd({
        id: makeId(), type: "DESPESA", title: title.trim(), category, amountCents,
        dateISO: isoDate, createdAtISO, paymentType,
        status: i === 0 && isoDate <= todayISO() ? status : "pending",
        ...(groupId ? { recurringGroupId: groupId, recurringKind, recurringTotal: totalMonths } : {}),
        ...(selectedAccount ? { accountId: selectedAccount.id } : {}),
      });
    }
    if (selectedAccount && !isRecurring) {
      void adjustBankAccountBalance(selectedAccount, -amountCents).catch(() => undefined);
    }
    window.setTimeout(() => { savingRef.current = false; setSaving(false); }, 400);
    setSheetOpen(false);
    resetForm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, category, dateISO, isRecurring, paymentType, recurrenceMode, recurrenceMonths, saving, selectedAccount, status, title]);

  return (
    <div className="dx-view">
      {/* Compact sticky header */}
      <header className="dx-head">
        <div className="dx-head-top">
          <button
            type="button"
            className="dx-type"
            onClick={(e) => { e.stopPropagation(); setTypeMenuOpen((v) => !v); }}
          >
            <span>Despesas</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" width="18" height="18"
              style={{ transform: typeMenuOpen ? "rotate(180deg)" : "none", transition: ".2s" }}>
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          <div className="dx-head-actions">
            <button type="button" className={`dx-icbtn${searchOpen ? " on" : ""}`} onClick={() => setSearchOpen((v) => !v)} aria-label="Buscar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
                <circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/>
              </svg>
            </button>
            <button
              type="button"
              className={`dx-icbtn${filter !== "all" ? " on" : ""}`}
              title="Filtrar status"
              onClick={() => setFilter((f) => f === "all" ? "pending" : f === "pending" ? "paid" : "all")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
                <path d="M22 3H2l8 9.46V19l4 2V12.46Z"/>
              </svg>
            </button>
          </div>
        </div>

        {typeMenuOpen && (
          <div className="dx-typemenu" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="on">Despesas</button>
            <button type="button" onClick={() => { setTypeMenuOpen(false); navigate("/receitas"); }}>Receitas</button>
          </div>
        )}

        {searchOpen && (
          <div className="dx-searchbar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18">
              <circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/>
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome ou valor…"
              autoFocus
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="16" height="16">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
        )}

        <div className="dx-monthnav">
          <button type="button" className="dx-mn-btn" onClick={() => shiftMonth(-1)} aria-label="Mês anterior">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" width="20" height="20">
              <path d="m15 18-6-6 6-6"/>
            </svg>
          </button>
          <button type="button" className="dx-mn-label" onClick={goToday} title="Ir para o mês atual">
            <span>{MESES_PT[viewMonth]}</span>
            <small>{viewYear}</small>
          </button>
          <button type="button" className="dx-mn-btn" onClick={() => shiftMonth(1)} aria-label="Próximo mês">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" width="20" height="20">
              <path d="m9 18 6-6-6-6"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Summary bar */}
      <div className="dx-summary">
        <div className="dx-sum-cell">
          <div className="dx-sum-top">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15">
              <path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/>
            </svg>
            <span>Total pendente</span>
          </div>
          <div className="dx-sum-val" style={{ color: "#fbbf24" }}>{formatCentsBRL(totals.pend)}</div>
        </div>
        <div className="dx-sum-div" />
        <div className="dx-sum-cell">
          <div className="dx-sum-top">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
            <span>Total pago</span>
          </div>
          <div className="dx-sum-val" style={{ color: "#fca5a5" }}>{formatCentsBRL(totals.paid)}</div>
        </div>
      </div>

      {filter !== "all" && (
        <div className="dx-filterchip">
          Mostrando: <strong>{filter === "pending" ? "pendentes" : "pagas"}</strong>
          <button type="button" onClick={() => setFilter("all")}>limpar</button>
        </div>
      )}

      {/* Day-grouped list */}
      <div className="dx-list">
        {groups.length === 0 ? (
          <div className="dx-empty">
            <span className="dx-empty-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="26" height="26">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                <path d="M14 2v6h6"/>
              </svg>
            </span>
            <strong>Nada por aqui em {MESES_PT[viewMonth]}</strong>
            <small>Toque no <b>+</b> para lançar uma despesa.</small>
          </div>
        ) : groups.map((g) => {
          const dayTotal = g.items.reduce((s, x) => s + x.amountCents, 0);
          return (
            <div className="dx-day" key={g.dateISO}>
              <div className="dx-day-h">
                <span className="dx-day-lbl">{g.label}</span>
                <span className="dx-day-tot">{formatCentsBRL(dayTotal)}</span>
              </div>
              <div className="dx-day-rows">
                {g.items.map((item) => {
                  const { icon, color } = getCatInfo(item.category);
                  return (
                    <TxRow
                      key={item.id}
                      item={item}
                      catIcon={icon}
                      catColor={color}
                      onToggle={toggleStatus}
                      onOpen={setEditingItem}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="dx-list-pad" />
      </div>

      {/* Edit modal */}
      {editingItem && (
        <FinanceItemEditModal
          item={editingItem}
          categoryOptions={categoryOptions}
          onClose={() => setEditingItem(null)}
          onSaved={handleEditSaved}
          onDelete={onDelete}
        />
      )}

      {/* Add form — bottom sheet */}
      {sheetOpen && createPortal(
        <div className="dx-sheet-scrim" onClick={() => setSheetOpen(false)}>
          <div className="dx-sheet is-expense" onClick={(e) => e.stopPropagation()}>
            <div className="dx-sheet-grip" />
            <div className="dx-sheet-head">
              <div>
                <span className="dx-sheet-kick">Novo lançamento</span>
                <h3>Nova despesa</h3>
              </div>
              <button type="button" className="dx-sheet-x" onClick={() => setSheetOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="18" height="18">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="dx-form">
              <div className="dx-field-full">
                <BankAccountChips selectedId={selectedAccount?.id ?? null} onChange={setSelectedAccount} />
              </div>

              <label className="dx-field dx-field-full">
                <span>Título</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Mercado" autoFocus />
              </label>

              <div className="dx-field dx-field-full">
                <CategoryPicker
                  label="Categoria"
                  value={category}
                  options={categoryOptions}
                  onChange={setCategory}
                  onCreateCategory={handleQuickCreateCategory}
                />
              </div>

              <label className="dx-field">
                <span>Valor</span>
                <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
              </label>

              <label className="dx-field">
                <span>Data</span>
                <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
              </label>

              <label className="dx-field">
                <span>Pagamento</span>
                <select value={paymentType} onChange={(e) => setPaymentType(e.target.value as PaymentType)}>
                  <option value="pix">Pix</option>
                  <option value="debit">Débito</option>
                  <option value="cash">Dinheiro</option>
                  <option value="credit">Crédito</option>
                </select>
              </label>

              <div className="dx-field dx-field-full">
                <span>Status</span>
                <div className="dx-seg">
                  <button type="button" className={status === "pending" ? "on" : ""} onClick={() => setStatus("pending")}>Pendente</button>
                  <button type="button" className={status === "paid" ? "on" : ""} onClick={() => setStatus("paid")}>Pago</button>
                </div>
              </div>

              <button
                type="button"
                className={`dx-fixo${isRecurring ? " on" : ""}`}
                onClick={() => setIsRecurring((v) => !v)}
              >
                <span className="dx-fixo-ic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18">
                    <path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                    <path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                  </svg>
                </span>
                <span className="dx-fixo-txt">
                  <strong>Gasto fixo mensal</strong>
                  <small>Repete nos próximos meses automaticamente</small>
                </span>
                <span className={`dx-switch${isRecurring ? " on" : ""}`}><i /></span>
              </button>

              {isRecurring && (
                <>
                  <label className="finance-radio-card dx-field-full">
                    <input type="radio" name="rec-mode-d" checked={recurrenceMode === "forever"} onChange={() => setRecurrenceMode("forever")} />
                    <span>
                      <strong>Sem data para acabar</strong>
                      <small>Cria os próximos 12 meses agora.</small>
                    </span>
                  </label>
                  <label className="finance-radio-card dx-field-full">
                    <input type="radio" name="rec-mode-d" checked={recurrenceMode === "months"} onChange={() => setRecurrenceMode("months")} />
                    <span>
                      <strong>Por alguns meses</strong>
                      <small>Você escolhe a quantidade de parcelas mensais.</small>
                    </span>
                  </label>
                  {recurrenceMode === "months" && (
                    <label className="dx-field dx-field-full">
                      <span>Quantidade de meses</span>
                      <input type="number" min="1" max="60" value={recurrenceMonths} onChange={(e) => setRecurrenceMonths(e.target.value)} />
                    </label>
                  )}
                </>
              )}
            </div>

            <button type="button" className="dx-save" onClick={onAdd} disabled={saving}>
              {saving ? "Salvando..." : "Adicionar despesa"}
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
