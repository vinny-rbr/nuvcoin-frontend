import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import type { FinanceCategoryOption, FinanceItem, FinanceStatus } from "../types/finance";
import {
  financeAdd,
  financeList,
  financeRefreshFromApi,
  financeRemove,
  financeRemoveMany,
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
  const received = item.status === "paid";
  return (
    <div className="dx-row" onClick={() => onOpen(item)}>
      <span className="dx-row-ic" style={{ background: `${catColor}28`, boxShadow: `inset 0 0 0 1px ${catColor}4d` }}>
        {catIcon}
      </span>
      <div className="dx-row-mid">
        <div className="dx-row-title">{item.title}</div>
        <div className="dx-row-sub">{item.category}</div>
      </div>
      <div className="dx-row-right">
        <div className="dx-row-amt" style={{ color: "#86efac" }}>{formatCentsBRL(item.amountCents)}</div>
        <button
          type="button"
          className={`dx-status${received ? " is-paid" : ""}`}
          title={received ? "Recebido — toque para marcar a receber" : "A receber — toque para marcar recebido"}
          onClick={(e) => { e.stopPropagation(); onToggle(item); }}
          style={received
            ? { background: "rgba(34,197,94,.18)", color: "#4ade80", borderColor: "transparent" }
            : { color: "#fbbf24", borderColor: "rgba(251,191,36,.55)" }}
        >
          {received ? (
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

export default function Receitas() {
  const navigate = useNavigate();
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>(DEFAULT_CATEGORIES.RECEITA);
  const [categoryRecords, setCategoryRecords] = useState<FinanceCategoryOption[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FinanceItem | null>(null);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "paid">("all");
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  // form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES.RECEITA[0]);
  const [amount, setAmount] = useState("");
  const [dateISO, setDateISO] = useState(todayISO());
  const [status, setStatus] = useState<FinanceStatus>("paid");
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
      const opts = categoriesForType(cats, "RECEITA");
      setCategoryRecords(cats.filter((c) => c.type === "RECEITA"));
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
    window.addEventListener("conciliaai:open-receita", onFabEvent);
    return () => window.removeEventListener("conciliaai:open-receita", onFabEvent);
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
    setStatus("paid"); setSelectedAccount(null);
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
    return categoryMap.get(cat) ?? { icon: "💰", color: "#22c55e" };
  }

  function shiftMonth(delta: number) {
    setViewMonth((m) => {
      const next = m + delta;
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

  const receitas = useMemo(() => items.filter((x) => x.type === "RECEITA"), [items]);

  const monthItems = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
    return receitas.filter((x) => x.dateISO.startsWith(prefix));
  }, [receitas, viewYear, viewMonth]);

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
    if (!confirm("Remover esta receita?")) return;
    setItems(financeRemove(id));
    setEditingItem(null);
  }

  function onDeleteAll() {
    setItems(financeRemoveMany(monthItems.map((i) => i.id)));
    setConfirmDeleteAll(false);
  }

  function handleEditSaved(updated: FinanceItem[]) {
    setItems(updated);
  }

  async function handleQuickCreateCategory(name: string, parentPath?: string): Promise<string> {
    const parent = parentPath ? categoryRecords.find((c) => c.fullPath === parentPath) : null;
    const created = await createFinanceCategory("RECEITA", name, parent?.id ?? null, parent?.icon ?? "💼", parent?.color ?? "#60a5fa");
    const cats = await listFinanceCategories();
    const opts = categoriesForType(cats, "RECEITA");
    setCategoryRecords(cats.filter((c) => c.type === "RECEITA"));
    setCategoryOptions(opts);
    const expectedPath = parentPath ? `${parentPath} > ${created.name}` : created.name;
    const val = opts.find((o) => o === expectedPath || o === created.name || o.endsWith(`> ${created.name}`)) ?? expectedPath;
    setCategory(val);
    return val;
  }

  const onAdd = useCallback(() => {
    if (savingRef.current || saving) return;
    const amountCents = parseAmountToCents(amount);
    if (!title.trim()) { alert("Informe um título."); return; }
    if (amountCents <= 0) { alert("Informe um valor válido."); return; }
    savingRef.current = true;
    setSaving(true);
    financeAdd({
      id: makeId(), type: "RECEITA", title: title.trim(), category, amountCents,
      dateISO, createdAtISO: new Date().toISOString(), paymentType: "pix", status,
      ...(selectedAccount ? { accountId: selectedAccount.id } : {}),
    });
    if (selectedAccount) {
      void adjustBankAccountBalance(selectedAccount, amountCents).catch(() => undefined);
    }
    window.setTimeout(() => { savingRef.current = false; setSaving(false); }, 400);
    setSheetOpen(false);
    resetForm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, category, dateISO, saving, selectedAccount, status, title]);

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
            <span>Receitas</span>
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
            {monthItems.length > 0 && (
              <button
                type="button"
                className={`dx-icbtn${confirmDeleteAll ? " on" : ""}`}
                title="Apagar todos do mês"
                onClick={() => setConfirmDeleteAll((v) => !v)}
                style={confirmDeleteAll ? { color: "#ff6b6b" } : undefined}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="20" height="20">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {confirmDeleteAll && (
          <div className="dx-confirm-delete">
            <span>Apagar {monthItems.length} lançamento{monthItems.length !== 1 ? "s" : ""} de {MESES_PT[viewMonth]}?</span>
            <div className="dx-confirm-actions">
              <button type="button" onClick={() => setConfirmDeleteAll(false)}>Cancelar</button>
              <button type="button" className="danger" onClick={onDeleteAll}>Apagar tudo</button>
            </div>
          </div>
        )}

        {typeMenuOpen && (
          <div className="dx-typemenu" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => { setTypeMenuOpen(false); navigate("/despesas"); }}>Despesas</button>
            <button type="button" className="on">Receitas</button>
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
            <span>A receber</span>
          </div>
          <div className="dx-sum-val" style={{ color: "#fbbf24" }}>{formatCentsBRL(totals.pend)}</div>
        </div>
        <div className="dx-sum-div" />
        <div className="dx-sum-cell">
          <div className="dx-sum-top">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
            <span>Recebido</span>
          </div>
          <div className="dx-sum-val" style={{ color: "#86efac" }}>{formatCentsBRL(totals.paid)}</div>
        </div>
      </div>

      {filter !== "all" && (
        <div className="dx-filterchip">
          Mostrando: <strong>{filter === "pending" ? "a receber" : "recebidas"}</strong>
          <button type="button" onClick={() => setFilter("all")}>limpar</button>
        </div>
      )}

      {/* Day-grouped list */}
      <div className="dx-list">
        {groups.length === 0 ? (
          <div className="dx-empty">
            <span className="dx-empty-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="26" height="26">
                <path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>
              </svg>
            </span>
            <strong>Nada por aqui em {MESES_PT[viewMonth]}</strong>
            <small>Toque no <b>+</b> para lançar uma receita.</small>
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
          <div className="dx-sheet is-income" onClick={(e) => e.stopPropagation()}>
            <div className="dx-sheet-grip" />
            <div className="dx-sheet-head">
              <div>
                <span className="dx-sheet-kick">Novo lançamento</span>
                <h3>Nova receita</h3>
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
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Salário" autoFocus />
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

              <div className="dx-field dx-field-full">
                <span>Status</span>
                <div className="dx-seg">
                  <button type="button" className={status === "pending" ? "on" : ""} onClick={() => setStatus("pending")}>A receber</button>
                  <button type="button" className={status === "paid" ? "on" : ""} onClick={() => setStatus("paid")}>Recebido</button>
                </div>
              </div>
            </div>

            <button type="button" className="dx-save" onClick={onAdd} disabled={saving}>
              {saving ? "Salvando..." : "Adicionar receita"}
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
