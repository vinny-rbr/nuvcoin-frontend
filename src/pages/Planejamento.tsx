import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import type { FinanceItem, FinanceCategoryOption } from "../types/finance";
import { financeList, financeRefreshFromApi, financeSubscribe } from "../lib/financeService";
import { listFinanceCategories, DEFAULT_CATEGORIES } from "../lib/financeCategoriesService";
import "./planejamento.css";

const BUDGETS_KEY = "conciliaai_budgets";
const GOALS_KEY = "conciliaai_goals";

interface Goal {
  id: string;
  emoji: string;
  name: string;
  targetCents: number;
  savedCents: number;
}

const FALLBACK_EMOJI: Record<string, string> = {
  Alimentação: "🍔", Transporte: "🚗", Moradia: "🏠",
  Saúde: "💊", Lazer: "🎉", Outros: "💼",
};

const GOAL_EMOJIS = ["✈️", "🛡️", "🏖️", "🚗", "🏠", "🎓", "💍", "💻", "🎁", "📱"];

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function centsToInput(cents: number): string {
  if (!cents) return "";
  return (cents / 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}
function parseReaisToCents(raw: string): number {
  const norm = raw.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const val = parseFloat(norm);
  return Number.isFinite(val) && val > 0 ? Math.round(val * 100) : 0;
}
function currentMonthKey(): string { return new Date().toISOString().slice(0, 7); }
function monthKey(iso: string): string { return iso.slice(0, 7); }
function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
function hexToRgba(hex: string | undefined, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex ?? "").trim());
  if (!m) return `rgba(96, 165, 250, ${alpha})`;
  const int = parseInt(m[1], 16);
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`;
}
function loadBudgets(): Record<string, number> {
  try { const raw = localStorage.getItem(BUDGETS_KEY); return raw ? JSON.parse(raw) as Record<string, number> : {}; }
  catch { return {}; }
}
function loadGoals(): Goal[] {
  try { const raw = localStorage.getItem(GOALS_KEY); return raw ? JSON.parse(raw) as Goal[] : []; }
  catch { return []; }
}

const ICONS = {
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" /><path d="M5 12h14" />
    </svg>
  ),
  target: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
    </svg>
  ),
};

export default function Planejamento() {
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [categories, setCategories] = useState<FinanceCategoryOption[]>([]);
  const [budgets, setBudgets] = useState<Record<string, number>>(loadBudgets);
  const [goals, setGoals] = useState<Goal[]>(loadGoals);
  const [period, setPeriod] = useState<string>(currentMonthKey);

  const [editBudgets, setEditBudgets] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState<Record<string, string>>({});
  const [goalDraft, setGoalDraft] = useState<Goal | null>(null);

  useEffect(() => {
    const load = () => setItems(financeList());
    load();
    void financeRefreshFromApi().then(setItems).catch(() => undefined);
    const unsub = financeSubscribe(load);
    const refresh = () => void financeRefreshFromApi().then(setItems).catch(() => undefined);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { unsub(); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);

  useEffect(() => {
    void listFinanceCategories().then(setCategories).catch(() => undefined);
  }, []);

  function persistBudgets(next: Record<string, number>) {
    setBudgets(next);
    try { localStorage.setItem(BUDGETS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }
  function persistGoals(next: Goal[]) {
    setGoals(next);
    try { localStorage.setItem(GOALS_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }

  const expenseCategories = useMemo(() => {
    const fromApi = categories
      .filter((c) => c.type === "DESPESA")
      .map((c) => ({ name: c.fullPath ?? c.name, emoji: c.icon ?? "💼", color: c.color ?? "#60a5fa" }));
    if (fromApi.length > 0) return fromApi;
    return DEFAULT_CATEGORIES.DESPESA.map((name) => ({ name, emoji: FALLBACK_EMOJI[name] ?? "💼", color: "#60a5fa" }));
  }, [categories]);

  const catMeta = useMemo(() => {
    const map = new Map<string, { emoji: string; color: string }>();
    expenseCategories.forEach((c) => map.set(c.name, { emoji: c.emoji, color: c.color }));
    return map;
  }, [expenseCategories]);

  const periods = useMemo(() => {
    const keys = new Set<string>();
    items.forEach((it) => keys.add(monthKey(it.dateISO)));
    keys.add(currentMonthKey());
    return [...keys].sort((a, b) => b.localeCompare(a)).map((key) => ({ key, label: monthLabel(key) }));
  }, [items]);

  const gastoByCat = useMemo(() => {
    const map = new Map<string, number>();
    items
      .filter((it) => it.type === "DESPESA" && monthKey(it.dateISO) === period)
      .forEach((it) => map.set(it.category, (map.get(it.category) ?? 0) + it.amountCents));
    return map;
  }, [items, period]);

  const budgetRows = useMemo(() => {
    const names = new Set<string>([...Object.keys(budgets), ...gastoByCat.keys()]);
    return [...names]
      .map((name) => ({ name, budgetCents: budgets[name] ?? 0, gastoCents: gastoByCat.get(name) ?? 0 }))
      .filter((r) => r.budgetCents > 0 || r.gastoCents > 0)
      .sort((a, b) => b.gastoCents - a.gastoCents);
  }, [budgets, gastoByCat]);

  const totalPlanejado = useMemo(() => Object.values(budgets).reduce((s, v) => s + v, 0), [budgets]);
  const totalGasto = useMemo(() => [...gastoByCat.values()].reduce((s, v) => s + v, 0), [gastoByCat]);
  const disponivel = totalPlanejado - totalGasto;
  const heroPct = totalPlanejado > 0 ? Math.round((totalGasto / totalPlanejado) * 100) : 0;
  const heroFill = heroPct > 100 ? "fill-red" : heroPct >= 90 ? "fill-warn" : "fill-green";
  const currentPeriodLabel = periods.find((p) => p.key === period)?.label ?? monthLabel(period);

  function openBudgetEditor() {
    const draft: Record<string, string> = {};
    expenseCategories.forEach((c) => { draft[c.name] = centsToInput(budgets[c.name] ?? 0); });
    setBudgetDraft(draft);
    setEditBudgets(true);
  }
  function saveBudgets() {
    const next: Record<string, number> = {};
    Object.entries(budgetDraft).forEach(([name, value]) => {
      const cents = parseReaisToCents(value);
      if (cents > 0) next[name] = cents;
    });
    persistBudgets(next);
    setEditBudgets(false);
  }
  function openNewGoal() {
    setGoalDraft({ id: `g_${Date.now()}`, emoji: "✈️", name: "", targetCents: 0, savedCents: 0 });
  }
  function openEditGoal(goal: Goal) { setGoalDraft({ ...goal }); }
  function saveGoal() {
    if (!goalDraft || !goalDraft.name.trim() || goalDraft.targetCents <= 0) return;
    const exists = goals.some((g) => g.id === goalDraft.id);
    const next = exists ? goals.map((g) => (g.id === goalDraft.id ? goalDraft : g)) : [...goals, goalDraft];
    persistGoals(next);
    setGoalDraft(null);
  }
  function deleteGoal() {
    if (!goalDraft) return;
    persistGoals(goals.filter((g) => g.id !== goalDraft.id));
    setGoalDraft(null);
  }

  return (
    <div className="plan-view">
      <div className="plan-head">
        <h2>Planejamento</h2>
        <select className="plan-month-select" value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Selecionar mês">
          {periods.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
      </div>

      {/* Hero */}
      <div className="plan-hero">
        <div className="lbl">Orçamento de {currentPeriodLabel.split(" ")[0]}</div>
        <div className="big">{formatBRL(totalPlanejado)}</div>
        <div className="sub">
          {totalPlanejado > 0 ? `Você já usou ${heroPct}% do planejado` : "Defina orçamentos para acompanhar seus gastos"}
        </div>
        <div className="plan-hero-bar">
          <i className={heroFill} style={{ width: `${Math.min(heroPct, 100)}%` }} />
        </div>
        <div className="plan-hero-foot">
          <div className="mini"><small>Gasto</small><b>{formatBRL(totalGasto)}</b></div>
          <div className="mini"><small>Disponível</small><b>{formatBRL(disponivel)}</b></div>
        </div>
      </div>

      {/* Orçamentos */}
      <div className="plan-sec-head">
        <h3>Orçamentos por categoria</h3>
        <button className="plan-sec-link" onClick={openBudgetEditor}>Editar</button>
      </div>

      {budgetRows.length === 0 ? (
        <div className="plan-empty">
          {ICONS.target}
          <strong>Nenhum orçamento ainda</strong>
          <small>Defina limites por categoria para acompanhar.</small>
        </div>
      ) : (
        budgetRows.map((row) => {
          const meta = catMeta.get(row.name) ?? { emoji: "💼", color: "#60a5fa" };
          const hasBudget = row.budgetCents > 0;
          const pct = hasBudget ? Math.round((row.gastoCents / row.budgetCents) * 100) : 0;
          const over = row.gastoCents > row.budgetCents;
          const restante = row.budgetCents - row.gastoCents;
          let statusCls = "st-muted", fillCls = "fill-green", leftText = "Sem orçamento definido";
          if (hasBudget) {
            if (over) { statusCls = "st-red"; fillCls = "fill-red"; leftText = `Estourou ${formatBRL(row.gastoCents - row.budgetCents)} acima do limite`; }
            else if (pct >= 100) { statusCls = "st-warn"; fillCls = "fill-warn"; leftText = "Orçamento atingido"; }
            else if (pct >= 90) { statusCls = "st-warn"; fillCls = "fill-warn"; leftText = `Restam ${formatBRL(restante)} · perto do limite`; }
            else { statusCls = "st-green"; fillCls = "fill-green"; leftText = `Restam ${formatBRL(restante)}`; }
          }
          return (
            <div className="bcard" key={row.name}>
              <div className="bcard-top">
                <span className="bcard-emoji" style={{ background: hexToRgba(meta.color, 0.16) }}>{meta.emoji}</span>
                <div className="bcard-meta">
                  <div className="bcard-name">{row.name}</div>
                  <div className="bcard-nums"><b>{formatBRL(row.gastoCents)}</b>{hasBudget ? ` de ${formatBRL(row.budgetCents)}` : ""}</div>
                </div>
                <span className={`bcard-pct ${statusCls}`}>{hasBudget ? `${pct}%` : "—"}</span>
              </div>
              <div className="bcard-track"><i className={fillCls} style={{ width: `${hasBudget ? Math.min(pct, 100) : 0}%` }} /></div>
              <div className={`bcard-left ${statusCls}`}>{leftText}</div>
            </div>
          );
        })
      )}

      <button className="plan-add" onClick={openBudgetEditor}>{ICONS.plus}Novo orçamento</button>

      {/* Metas */}
      <div className="plan-sec-head">
        <h3>Metas</h3>
        {goals.length > 0 ? <button className="plan-sec-link" onClick={openNewGoal}>Nova meta</button> : null}
      </div>

      {goals.length === 0 ? (
        <div className="plan-empty">
          <span style={{ fontSize: 26 }}>🎯</span>
          <strong>Nenhuma meta ainda</strong>
          <small>Crie uma meta de economia e acompanhe o progresso.</small>
        </div>
      ) : (
        goals.map((g) => {
          const pct = g.targetCents > 0 ? Math.min(Math.round((g.savedCents / g.targetCents) * 100), 100) : 0;
          const missing = g.targetCents - g.savedCents;
          const done = missing <= 0;
          return (
            <button className="goal" key={g.id} onClick={() => openEditGoal(g)}>
              <span className="goal-ring" style={{ "--p": pct } as CSSProperties}><span>{g.emoji}</span></span>
              <span className="goal-meta">
                <span className="goal-name">{g.name}</span>
                <span className="goal-nums"><b>{formatBRL(g.savedCents)}</b> de {formatBRL(g.targetCents)}</span>
                {done ? <span className="goal-done">Meta concluída 🎉</span> : <span className="goal-miss">Faltam {formatBRL(missing)}</span>}
              </span>
              <span className="goal-pct">{pct}%</span>
            </button>
          );
        })
      )}

      {goals.length === 0 ? <button className="plan-add" onClick={openNewGoal}>{ICONS.plus}Nova meta</button> : null}

      {/* Sheet: orçamentos */}
      {editBudgets && createPortal(
        <div className="plan-sheet-scrim" onClick={() => setEditBudgets(false)}>
          <div className="plan-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="plan-sheet-handle" />
            <h4>Orçamentos por categoria</h4>
            <p className="plan-sheet-sub">Defina um limite mensal para cada categoria.</p>
            {expenseCategories.map((c) => (
              <div className="be-row" key={c.name}>
                <span className="be-emoji" style={{ background: hexToRgba(c.color, 0.16) }}>{c.emoji}</span>
                <span className="be-name">{c.name}</span>
                <span className="be-input-wrap">
                  <input className="be-input" inputMode="decimal" placeholder="0,00"
                    value={budgetDraft[c.name] ?? ""}
                    onChange={(e) => setBudgetDraft((d) => ({ ...d, [c.name]: e.target.value }))} />
                </span>
              </div>
            ))}
            <div className="plan-sheet-actions">
              <button className="plan-btn-ghost" onClick={() => setEditBudgets(false)}>Cancelar</button>
              <button className="plan-btn-primary" onClick={saveBudgets}>Salvar</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Sheet: meta */}
      {goalDraft && createPortal(
        <div className="plan-sheet-scrim" onClick={() => setGoalDraft(null)}>
          <div className="plan-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="plan-sheet-handle" />
            <h4>{goals.some((g) => g.id === goalDraft.id) ? "Editar meta" : "Nova meta"}</h4>
            <p className="plan-sheet-sub">Quanto você quer juntar e quanto já guardou.</p>
            <div className="plan-field">
              <label>Ícone</label>
              <div className="emoji-picker">
                {GOAL_EMOJIS.map((e) => (
                  <button key={e} className={goalDraft.emoji === e ? "is-active" : ""} onClick={() => setGoalDraft({ ...goalDraft, emoji: e })}>{e}</button>
                ))}
              </div>
            </div>
            <div className="plan-field">
              <label>Nome da meta</label>
              <input placeholder="Ex.: Viagem de fim de ano" value={goalDraft.name}
                onChange={(e) => setGoalDraft({ ...goalDraft, name: e.target.value })} />
            </div>
            <div className="plan-field">
              <label>Valor da meta (R$)</label>
              <input inputMode="decimal" placeholder="6.000,00" defaultValue={centsToInput(goalDraft.targetCents)}
                onChange={(e) => setGoalDraft({ ...goalDraft, targetCents: parseReaisToCents(e.target.value) })} />
            </div>
            <div className="plan-field">
              <label>Já guardado (R$)</label>
              <input inputMode="decimal" placeholder="0,00" defaultValue={centsToInput(goalDraft.savedCents)}
                onChange={(e) => setGoalDraft({ ...goalDraft, savedCents: parseReaisToCents(e.target.value) })} />
            </div>
            <div className="plan-sheet-actions">
              <button className="plan-btn-ghost" onClick={() => setGoalDraft(null)}>Cancelar</button>
              <button className="plan-btn-primary" onClick={saveGoal}>Salvar meta</button>
            </div>
            {goals.some((g) => g.id === goalDraft.id) ? (
              <button className="plan-btn-danger" onClick={deleteGoal}>Excluir meta</button>
            ) : null}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
