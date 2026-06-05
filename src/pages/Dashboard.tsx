import "./dashboard.css";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

import {
  InteractiveDonut,
  AreaTrendChart,
  MiniRingsCompare,
  SummaryCards,
} from "./DashboardCharts";
import type { SummaryCardItem } from "./DashboardCharts";

import type { FinanceCategoryOption, FinanceItem, PaymentType } from "../types/finance";

import {
  financeList,
  financeSubscribe,
} from "../lib/financeService";

import {
  calculateMonthComparison,
  calculateSummary,
} from "../lib/financeCalculations";
import { listFinanceCategories } from "../lib/financeCategoriesService";

type PeriodKey = "MONTH" | "LAST_3" | "YEAR" | "ALL";
type DashboardViewMode = "CONFRONTO" | "GASTOS" | "RECEITAS" | "PAGAMENTO";

type DonutItem = {
  name: string;
  value: number;
  valueCents: number;
  percent: number;
  detailItems: FinanceItem[];
};

type ParentCategorySummary = {
  name: string;
  receitasCents: number;
  despesasCents: number;
  saldoCents: number;
  totalCents: number;
  receitaItems: FinanceItem[];
  despesaItems: FinanceItem[];
};

function formatBRLFromCents(valueCents: number): string {
  const value = valueCents / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("pt-BR");
}

function toISODate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getYearMonth(dateISO: string): string {
  return dateISO.slice(0, 7);
}

function ymToLabel(ym: string): string {
  const [y, m] = ym.split("-");
  const month = Number(m);
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${monthNames[month - 1]}/${y.slice(2)}`;
}

function addMonthsYM(ym: string, add: number): string {
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1 + add, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function listMonthsBetween(startYM: string, endYM: string): string[] {
  const months: string[] = [];
  let cur = startYM;

  while (cur <= endYM) {
    months.push(cur);
    cur = addMonthsYM(cur, 1);
  }

  return months;
}

function getPeriodRange(period: PeriodKey): { startISO: string | null; endISOExclusive: string | null } {
  const now = new Date();

  if (period === "ALL") return { startISO: null, endISOExclusive: null };
  if (period === "MONTH") {
    return {
      startISO: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)),
      endISOExclusive: toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 1)),
    };
  }

  if (period === "LAST_3") {
    return {
      startISO: toISODate(new Date(now.getFullYear(), now.getMonth() - 2, 1)),
      endISOExclusive: toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 1)),
    };
  }

  return {
    startISO: toISODate(new Date(now.getFullYear(), 0, 1)),
    endISOExclusive: toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 1)),
  };
}

function getPeriodLabel(period: PeriodKey): string {
  if (period === "MONTH") return "Mês atual";
  if (period === "LAST_3") return "Últimos 3 meses";
  if (period === "YEAR") return "Ano";
  return "Tudo";
}

function getPaymentLabel(paymentType: PaymentType): string {
  if (paymentType === "pix") return "Pix";
  if (paymentType === "debit") return "Débito";
  if (paymentType === "cash") return "Dinheiro";
  return "Crédito";
}

function getParentCategoryName(category: string): string {
  return category
    .split(">")
    .map((part) => part.trim())
    .filter(Boolean)[0] || "Outros";
}

const MONTH_NAMES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function ymToFullMonth(ym: string): string {
  const m = Number(ym.split("-")[1]);
  const y = ym.split("-")[0];
  return `${MONTH_NAMES_PT[m - 1]} ${y}`;
}

function heroBalSize(cents: number, hidden: boolean): number {
  const str = hidden ? "R$ •••••" : formatBRLFromCents(Math.abs(cents));
  const n = str.length;
  if (n <= 12) return 36;
  if (n <= 15) return 30;
  if (n <= 18) return 25;
  return 21;
}

function toDonutData(entries: Array<{ name: string; valueCents: number; detailItems?: FinanceItem[] }>): DonutItem[] {
  const total = entries.reduce((sum, item) => sum + item.valueCents, 0);

  return entries
    .filter((item) => item.valueCents > 0)
    .sort((a, b) => b.valueCents - a.valueCents)
    .map((item) => ({
      name: item.name,
      value: Math.max(1, Math.round(item.valueCents / 100)),
      valueCents: item.valueCents,
      percent: total > 0 ? (item.valueCents / total) * 100 : 0,
      detailItems: item.detailItems ?? [],
    }));
}

function groupByCategory(items: FinanceItem[], type: "RECEITA" | "DESPESA"): DonutItem[] {
  const map = new Map<string, { valueCents: number; detailItems: FinanceItem[] }>();

  for (const item of items) {
    if (item.type !== type) continue;
    const current = map.get(item.category) ?? { valueCents: 0, detailItems: [] };
    current.valueCents += item.amountCents;
    current.detailItems.push(item);
    map.set(item.category, current);
  }

  return toDonutData(
    Array.from(map.entries()).map(([name, value]) => ({
      name,
      valueCents: value.valueCents,
      detailItems: value.detailItems,
    }))
  );
}

function summarizeParentCategories(items: FinanceItem[], registeredParentNames: string[]): ParentCategorySummary[] {
  const map = new Map<string, ParentCategorySummary>();

  for (const name of registeredParentNames) {
    map.set(name, {
      name,
      receitasCents: 0,
      despesasCents: 0,
      saldoCents: 0,
      totalCents: 0,
      receitaItems: [],
      despesaItems: [],
    });
  }

  for (const item of items) {
    const name = getParentCategoryName(item.category);
    const current =
      map.get(name) ??
      {
        name,
        receitasCents: 0,
        despesasCents: 0,
        saldoCents: 0,
        totalCents: 0,
        receitaItems: [],
        despesaItems: [],
      };

    if (item.type === "RECEITA") {
      current.receitasCents += item.amountCents;
      current.receitaItems.push(item);
    } else {
      current.despesasCents += item.amountCents;
      current.despesaItems.push(item);
    }

    current.saldoCents = current.receitasCents - current.despesasCents;
    current.totalCents = current.receitasCents + current.despesasCents;
    map.set(name, current);
  }

  if (registeredParentNames.length === 0) {
    return Array.from(map.values()).sort((a, b) => b.totalCents - a.totalCents);
  }

  const registeredSet = new Set(registeredParentNames);
  const registeredSummaries = registeredParentNames
    .map((name) => map.get(name))
    .filter((item): item is ParentCategorySummary => Boolean(item));
  const extraSummaries = Array.from(map.values())
    .filter((item) => !registeredSet.has(item.name))
    .sort((a, b) => b.totalCents - a.totalCents);

  return [...registeredSummaries, ...extraSummaries];
}

function groupByPayment(items: FinanceItem[]): DonutItem[] {
  const map = new Map<string, { valueCents: number; detailItems: FinanceItem[] }>();

  for (const item of items) {
    if (item.type !== "DESPESA") continue;
    const label = getPaymentLabel(item.paymentType);
    const current = map.get(label) ?? { valueCents: 0, detailItems: [] };
    current.valueCents += item.amountCents;
    current.detailItems.push(item);
    map.set(label, current);
  }

  return toDonutData(
    Array.from(map.entries()).map(([name, value]) => ({
      name,
      valueCents: value.valueCents,
      detailItems: value.detailItems,
    }))
  );
}

function DonutDashboardCard({
  title,
  subtitle,
  data,
  colors,
  totalCents,
  emptyText,
}: {
  title: string;
  subtitle: string;
  data: DonutItem[];
  colors: string[];
  totalCents: number;
  emptyText: string;
}) {
  const [selectedName, setSelectedName] = useState<string | null>(null);

  useEffect(() => {
    setSelectedName(null);
  }, [title, subtitle, data]);

  const selectedItem = selectedName ? data.find((item) => item.name === selectedName) ?? null : null;
  const selectedDetails = selectedItem?.detailItems ?? [];

  return (
    <div className="chart-card dashboard-panel dashboard-donut-card">
      <div className="dashboard-card-head">
        <div>
          <div className="chart-title">{title}</div>
          <div className="dashboard-card-subtitle">{subtitle}</div>
        </div>
        <span className="dashboard-total-pill">{formatBRLFromCents(totalCents)}</span>
      </div>

      {data.length === 0 ? (
        <div className="dashboard-empty-panel">{emptyText}</div>
      ) : (
        <div className="dashboard-donut-layout">
          <div className="dashboard-donut-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="58%"
                  outerRadius="86%"
                  paddingAngle={2}
                  stroke="rgba(241,245,249,0.8)"
                  strokeWidth={2}
                >
                  {data.map((_, index) => (
                    <Cell key={index} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(_value: any, name: any, props: any) => {
                    const item = props.payload as DonutItem;
                    return [formatBRLFromCents(item.valueCents), name];
                  }}
                  contentStyle={{
                    backgroundColor: "#0b1220",
                    border: "1px solid rgba(148,163,184,0.2)",
                    borderRadius: 12,
                    color: "#F1F5F9",
                  }}
                  itemStyle={{ color: "#F1F5F9", fontWeight: 800 }}
                  labelStyle={{ color: "#CBD5E1", fontWeight: 800 }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="dashboard-donut-center">
              <span>Total</span>
              <strong>{formatBRLFromCents(totalCents)}</strong>
              <small>{subtitle}</small>
            </div>
          </div>

          <div className="dashboard-donut-legend">
            {data.map((item, index) => (
              <button
                key={item.name}
                type="button"
                className={`dashboard-donut-legend-row${selectedName === item.name ? " is-selected" : ""}`}
                onClick={() => setSelectedName((current) => (current === item.name ? null : item.name))}
              >
                <span
                  className="dashboard-dot"
                  style={{ background: colors[index % colors.length] }}
                />
                <span className="dashboard-legend-name">{item.name}</span>
                <strong>{formatBRLFromCents(item.valueCents)}</strong>
                <span className="dashboard-legend-percent">{item.percent.toFixed(1)}%</span>
              </button>
            ))}
          </div>

          {selectedItem ? (
            <div className="dashboard-drilldown">
              <div className="dashboard-drilldown-head">
                <div>
                  <span>Detalhes</span>
                  <strong>{selectedItem.name}</strong>
                </div>
                <button type="button" onClick={() => setSelectedName(null)}>
                  Fechar
                </button>
              </div>

              {selectedDetails.length === 0 ? (
                <div className="dashboard-drilldown-empty">
                  Essa fatia é um resumo calculado e não possui lançamentos individuais.
                </div>
              ) : (
                <div className="dashboard-drilldown-list">
                  {selectedDetails
                    .slice()
                    .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
                    .map((detail) => (
                      <div key={detail.id} className="dashboard-drilldown-row">
                        <div>
                          <strong>{detail.title}</strong>
                          <span>
                            {detail.category} • {formatDateBR(detail.dateISO)}
                          </span>
                        </div>
                        <strong className={detail.type === "RECEITA" ? "green" : "red"}>
                          {detail.type === "RECEITA" ? "+ " : "- "}
                          {formatBRLFromCents(detail.amountCents)}
                        </strong>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function FitValue({ children, max = 26, min = 12 }: { children: React.ReactNode; max?: number; min?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const text = textRef.current;
    if (!wrap || !text) return;

    const fit = () => {
      let size = max;
      text.style.fontSize = `${size}px`;
      while (text.scrollWidth > wrap.clientWidth && size > min) {
        size -= 0.5;
        text.style.fontSize = `${size}px`;
      }
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    if (document.fonts?.ready) void document.fonts.ready.then(fit);
    return () => ro.disconnect();
  }, [children, max, min]);

  return (
    <div ref={wrapRef} style={{ width: "100%", overflow: "hidden" }}>
      <span ref={textRef} style={{ display: "inline-block", whiteSpace: "nowrap", lineHeight: 1.05 }}>
        {children}
      </span>
    </div>
  );
}

function SparkLine({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const w = 160, h = 38;
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * w},${h - 3 - ((v - min) / range) * (h - 8)}`)
    .join(" ");
  return (
    <svg className="stat-sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Dashboard() {
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [registeredCategories, setRegisteredCategories] = useState<FinanceCategoryOption[]>([]);
  const [period, setPeriod] = useState<PeriodKey>("LAST_3");
  const [viewMode, setViewMode] = useState<DashboardViewMode>("CONFRONTO");
  const [parentDashboardA, setParentDashboardA] = useState("");
  const [parentDashboardB, setParentDashboardB] = useState("");
  const [animate, setAnimate] = useState(false);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [heroMonth, setHeroMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const currentMonthYM = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);
  const planBadge = useMemo(() => {
    if (localStorage.getItem("conciliaai_subscription_lifetime") === "true") return "Vitalício";
    const s = localStorage.getItem("subscriptionStatus") ?? localStorage.getItem("subscriptionActive") ?? "";
    if (s === "trial") return "Trial";
    if (s === "active" || s === "true") return "Ativo";
    return null;
  }, []);

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
    let isMounted = true;

    async function loadCategories() {
      try {
        const loadedCategories = await listFinanceCategories();

        if (isMounted) {
          setRegisteredCategories(loadedCategories);
        }
      } catch {
        if (isMounted) {
          setRegisteredCategories([]);
        }
      }
    }

    void loadCategories();

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
  }, [period, viewMode, items]);

  const filteredItems = useMemo(() => {
    const today = toISODate(new Date());
    const { startISO, endISOExclusive } = getPeriodRange(period);

    return items.filter((item) => {
      if (item.status !== "paid" && item.dateISO > today) return false;
      if (startISO && item.dateISO < startISO) return false;
      if (endISOExclusive && item.dateISO >= endISOExclusive) return false;
      return true;
    });
  }, [items, period]);

  const summary = useMemo(() => calculateSummary(filteredItems), [filteredItems]);
  const saldoClass = summary.saldoCents >= 0 ? "green" : "red";

  const heroData = useMemo(() => {
    let rec = 0, des = 0;
    for (const item of items) {
      if (!item.dateISO.startsWith(heroMonth)) continue;
      if (item.type === "RECEITA") rec += item.amountCents;
      if (item.type === "DESPESA") des += item.amountCents;
    }
    return { receitasCents: rec, despesasCents: des, saldoCents: rec - des };
  }, [items, heroMonth]);

  const sparklines = useMemo(() => {
    const now = new Date();
    const months: Array<{ rec: number; des: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      let rec = 0, des = 0;
      for (const item of items) {
        if (!item.dateISO.startsWith(ym)) continue;
        if (item.type === "RECEITA") rec += item.amountCents;
        if (item.type === "DESPESA") des += item.amountCents;
      }
      months.push({ rec, des });
    }
    return {
      receitas: months.map(m => m.rec),
      despesas: months.map(m => m.des),
      credito: months.map(m => m.des),
      saldo: months.map(m => m.rec - m.des),
    };
  }, [items]);
  const dueSoonExpenses = useMemo(() => {
    const todayISODate = toISODate(new Date());
    const limitISODate = toISODate(addDays(new Date(), 3));

    return items
      .filter((item) => {
        return (
          item.type === "DESPESA" &&
          item.status !== "paid" &&
          item.dateISO >= todayISODate &&
          item.dateISO <= limitISODate
        );
      })
      .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
      .slice(0, 4);
  }, [items]);

  const monthCmp = useMemo(() => {
    const referenceISO = toISODate(new Date());
    return calculateMonthComparison(items, referenceISO);
  }, [items]);

  const cmpLine = useMemo(() => {
    const arrow = (dir: "UP" | "DOWN" | "FLAT") => {
      if (dir === "UP") return "↑";
      if (dir === "DOWN") return "↓";
      return "—";
    };

    const lineFrom = (pct: number | null, dir: "UP" | "DOWN" | "FLAT") => {
      if (pct === null) return "vs mês anterior: —";
      return `vs mês anterior: ${arrow(dir)} ${Math.abs(pct).toFixed(1)}%`;
    };

    return {
      receitas: lineFrom(monthCmp.receitas.pct, monthCmp.receitas.direction),
      despesas: lineFrom(monthCmp.despesas.pct, monthCmp.despesas.direction),
      saldo: lineFrom(monthCmp.saldo.pct, monthCmp.saldo.direction),
    };
  }, [monthCmp]);

  const summaryCardItems = useMemo((): SummaryCardItem[] => {
    const fmtPct = (pct: number | null, dir: "UP" | "DOWN" | "FLAT") => ({
      dl: pct != null ? `${Math.abs(pct).toFixed(1)}%` : "—",
      up: dir !== "DOWN",
    });
    const savingPct = summary.totalReceitasCents > 0
      ? (Math.max(0, summary.saldoCents) / summary.totalReceitasCents * 100).toFixed(1) + "%"
      : "0%";
    return [
      { lab: "Receitas", v: summary.totalReceitasCents, c: "#34d399", s: sparklines.receitas, ...fmtPct(monthCmp.receitas.pct, monthCmp.receitas.direction) },
      { lab: "Despesas", v: summary.totalDespesasCents, c: "#fb7185", s: sparklines.despesas, ...fmtPct(monthCmp.despesas.pct, monthCmp.despesas.direction) },
      { lab: "Saldo", v: summary.saldoCents, c: "#60a5fa", s: sparklines.saldo, ...fmtPct(monthCmp.saldo.pct, monthCmp.saldo.direction) },
      { lab: "Poupança", v: 0, c: "#fbbf24", s: sparklines.saldo, dl: savingPct, up: true, txt: savingPct },
    ];
  }, [summary, sparklines, monthCmp]);

  const chartData = useMemo(() => {
    const map = new Map<string, { receitasCents: number; despesasCents: number }>();

    for (const item of filteredItems) {
      const ym = getYearMonth(item.dateISO);

      if (!map.has(ym)) {
        map.set(ym, { receitasCents: 0, despesasCents: 0 });
      }

      const bucket = map.get(ym)!;

      if (item.type === "RECEITA") bucket.receitasCents += item.amountCents;
      if (item.type === "DESPESA") bucket.despesasCents += item.amountCents;
    }

    const now = new Date();
    const endYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    let startYM = endYM;

    if (period === "LAST_3") startYM = addMonthsYM(endYM, -2);
    if (period === "YEAR") startYM = `${now.getFullYear()}-01`;
    if (period === "ALL") {
      const monthsWithData = Array.from(map.keys()).sort();
      startYM = monthsWithData.length > 0 ? monthsWithData[0] : endYM;
    }

    return listMonthsBetween(startYM, endYM).map((ym) => {
      const bucket = map.get(ym) ?? { receitasCents: 0, despesasCents: 0 };

      return {
        mes: ymToLabel(ym),
        receitas: Math.round(bucket.receitasCents / 100),
        despesas: Math.round(bucket.despesasCents / 100),
      };
    });
  }, [filteredItems, period]);

  const expensesByCategory = useMemo(() => {
    return groupByCategory(filteredItems, "DESPESA");
  }, [filteredItems]);

  const receitasByCategory = useMemo(() => groupByCategory(filteredItems, "RECEITA"), [filteredItems]);
  const paymentData = useMemo(() => groupByPayment(filteredItems), [filteredItems]);
  const registeredParentCategoryNames = useMemo(() => {
    const names = new Map<string, string>();

    for (const category of registeredCategories) {
      if (category.parentId || (category.level ?? 1) !== 1) continue;

      const trimmedName = category.name.trim();
      if (!trimmedName) continue;

      const key = trimmedName.toLocaleLowerCase("pt-BR");
      if (!names.has(key)) {
        names.set(key, trimmedName);
      }
    }

    return Array.from(names.values());
  }, [registeredCategories]);
  const parentCategorySummaries = useMemo(
    () => summarizeParentCategories(filteredItems, registeredParentCategoryNames),
    [filteredItems, registeredParentCategoryNames],
  );
  const parentCategoryNames = useMemo(() => parentCategorySummaries.map((item) => item.name), [parentCategorySummaries]);

  useEffect(() => {
    if (parentCategoryNames.length === 0) {
      setParentDashboardA("");
      setParentDashboardB("");
      return;
    }

    setParentDashboardA((current) => (current && parentCategoryNames.includes(current) ? current : parentCategoryNames[0]));
    setParentDashboardB((current) => {
      if (current && parentCategoryNames.includes(current)) return current;
      return parentCategoryNames[1] ?? parentCategoryNames[0];
    });
  }, [parentCategoryNames]);

  const selectedParentDashboardA = useMemo(
    () => parentCategorySummaries.find((item) => item.name === parentDashboardA) ?? null,
    [parentCategorySummaries, parentDashboardA],
  );
  const selectedParentDashboardB = useMemo(
    () => parentCategorySummaries.find((item) => item.name === parentDashboardB) ?? null,
    [parentCategorySummaries, parentDashboardB],
  );

  const confrontationData = useMemo(() => {
    return toDonutData([
      {
        name: "Receitas",
        valueCents: summary.totalReceitasCents,
        detailItems: filteredItems.filter((item) => item.type === "RECEITA"),
      },
      {
        name: "Despesas",
        valueCents: summary.totalDespesasCents,
        detailItems: filteredItems.filter((item) => item.type === "DESPESA"),
      },
      {
        name: "Crédito",
        valueCents: summary.totalCreditoCents,
        detailItems: filteredItems.filter((item) => item.type === "DESPESA" && item.paymentType === "credit"),
      },
    ]);
  }, [filteredItems, summary]);

  const selectedAnalytics = useMemo(() => {
    if (viewMode === "GASTOS") {
      return {
        primary: {
          title: "Gastos por categoria",
          subtitle: getPeriodLabel(period),
          data: expensesByCategory,
          totalCents: summary.totalDespesasCents,
          emptyText: "Ainda não há despesas nesse período.",
        },
        secondary: {
          title: "Formas de pagamento",
          subtitle: "Somente despesas",
          data: paymentData,
          totalCents: summary.totalDespesasCents,
          emptyText: "Sem pagamentos para analisar.",
        },
      };
    }

    if (viewMode === "RECEITAS") {
      return {
        primary: {
          title: "Receitas por categoria",
          subtitle: getPeriodLabel(period),
          data: receitasByCategory,
          totalCents: summary.totalReceitasCents,
          emptyText: "Ainda não há receitas nesse período.",
        },
        secondary: {
          title: "Confronto financeiro",
          subtitle: "Receitas, despesas e crédito",
          data: confrontationData,
          totalCents: summary.totalReceitasCents - summary.totalDespesasCents,
          emptyText: "Sem dados para comparar.",
        },
      };
    }

    if (viewMode === "PAGAMENTO") {
      return {
        primary: {
          title: "Formas de pagamento",
          subtitle: getPeriodLabel(period),
          data: paymentData,
          totalCents: summary.totalDespesasCents,
          emptyText: "Sem pagamentos para analisar.",
        },
        secondary: {
          title: "Gastos por categoria",
          subtitle: "Detalhe dos gastos",
          data: expensesByCategory,
          totalCents: summary.totalDespesasCents,
          emptyText: "Ainda não há despesas nesse período.",
        },
      };
    }

    return {
      primary: {
        title: "Confronto de receitas e despesas",
        subtitle: getPeriodLabel(period),
        data: confrontationData,
        totalCents: summary.totalReceitasCents - summary.totalDespesasCents,
        emptyText: "Cadastre receitas ou despesas para montar o confronto.",
      },
      secondary: {
        title: "Gastos por categoria",
        subtitle: "Onde o dinheiro saiu",
        data: expensesByCategory,
        totalCents: summary.totalDespesasCents,
        emptyText: "Ainda não há despesas nesse período.",
      },
    };
  }, [confrontationData, expensesByCategory, paymentData, period, receitasByCategory, summary, viewMode]);

  const donutColors = ["#60A5FA", "#22C55E", "#F97316", "#A78BFA", "#EF4444", "#14B8A6", "#EAB308", "#F472B6"];

  const latestItems = useMemo(() => {
    return filteredItems
      .slice()
      .sort((a, b) => b.dateISO.localeCompare(a.dateISO))
      .slice(0, 8);
  }, [filteredItems]);

  return (
    <div className={`dashboard-view${animate ? " is-ready" : ""}`}>
      <div className="dashboard-hero">
        {/* Mobile-only brand bar */}
        <div className="dash-brand-bar">
          <div className="dash-brand-id">
            <span className="dash-brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 15l4-5 3 3 5-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <div className="dash-brand-copy">
              <strong>Conciliaaí</strong>
              <small>FINANÇAS</small>
            </div>
          </div>
          {planBadge ? <span className="dash-plan-badge">{planBadge}</span> : null}
        </div>

        {/* Cartão azul — monthly summary card */}
        <div className="dash-hero-card">
          <div className="dash-hero-deco" aria-hidden="true" />

          <div className="dash-hero-top">
            <span className="dash-hero-label">Saldo em contas</span>
            <div className="dash-month-nav">
              <button
                type="button"
                className="dash-month-btn"
                aria-label="Mês anterior"
                onClick={() => setHeroMonth((m) => addMonthsYM(m, -1))}
                disabled={heroMonth <= addMonthsYM(currentMonthYM, -23)}
              >
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden="true">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              <span className="dash-month-label">{ymToFullMonth(heroMonth)}</span>
              <button
                type="button"
                className="dash-month-btn"
                aria-label="Próximo mês"
                onClick={() => setHeroMonth((m) => addMonthsYM(m, 1))}
                disabled={heroMonth >= currentMonthYM}
              >
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="dash-hero-bal-row">
            <span
              className="dash-hero-bal"
              style={{
                fontSize: heroBalSize(heroData.saldoCents, balanceHidden),
                color: heroData.saldoCents < 0 ? "#FFCBC6" : "#ffffff",
              }}
            >
              {balanceHidden ? "R$ •••••" : formatBRLFromCents(heroData.saldoCents)}
            </span>
            <button
              type="button"
              className="dash-hero-eye"
              aria-label={balanceHidden ? "Mostrar saldo" : "Esconder saldo"}
              onClick={() => setBalanceHidden((h) => !h)}
            >
              {balanceHidden ? (
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden="true">
                  <path d="M3 3l18 18M10.6 5.2A10.6 10.6 0 0 1 12 5c6.2 0 10 7 10 7a18 18 0 0 1-3.3 4.1M6.1 6.6A18 18 0 0 0 2 12s3.8 7 10 7a10.3 10.3 0 0 0 4-.8" stroke="rgba(255,255,255,0.75)" strokeWidth="1.9" strokeLinecap="round"/>
                  <path d="M9.5 9.6a3 3 0 0 0 4.2 4.2" stroke="rgba(255,255,255,0.75)" strokeWidth="1.9" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden="true">
                  <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7S2 12 2 12Z" stroke="rgba(255,255,255,0.75)" strokeWidth="1.9"/>
                  <circle cx="12" cy="12" r="3" stroke="rgba(255,255,255,0.75)" strokeWidth="1.9"/>
                </svg>
              )}
            </button>
          </div>

          <div className="dash-hero-stats">
            <div className="dash-hero-stat">
              <span className="dash-stat-ic dash-stat-ic--up" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                  <path d="M12 19V5M12 5l-6 6M12 5l6 6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <div>
                <small>Receitas</small>
                <strong>{formatBRLFromCents(heroData.receitasCents)}</strong>
              </div>
            </div>
            <div className="dash-hero-divider" aria-hidden="true" />
            <div className="dash-hero-stat">
              <span className="dash-stat-ic dash-stat-ic--down" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                  <path d="M12 5v14M12 19l6-6M12 19l-6-6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <div>
                <small>Despesas</small>
                <strong>{formatBRLFromCents(heroData.despesasCents)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Period filter (compact row) */}
        <div className="dash-period-row">
          <label className="dash-period-label">
            <span>Período da análise</span>
            <select
              className="period-select"
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodKey)}
            >
              <option value="MONTH">Mês atual</option>
              <option value="LAST_3">Últimos 3 meses</option>
              <option value="YEAR">Ano</option>
              <option value="ALL">Tudo</option>
            </select>
          </label>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-title">Receitas</span>
            <span className="stat-ic" style={{ background: "rgba(34,197,94,.14)", color: "#4ADE80" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="m6 11 6-6 6 6"/></svg>
            </span>
          </div>
          <div className="stat-value green"><FitValue>{formatBRLFromCents(summary.totalReceitasCents)}</FitValue></div>
          <div className="stat-caption">{cmpLine.receitas}</div>
          <SparkLine values={sparklines.receitas} color="#4ADE80" />
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-title">Despesas</span>
            <span className="stat-ic" style={{ background: "rgba(239,68,68,.14)", color: "#F87171" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m6 13 6 6 6-6"/></svg>
            </span>
          </div>
          <div className="stat-value red"><FitValue>{formatBRLFromCents(summary.totalDespesasCents)}</FitValue></div>
          <div className="stat-caption">{cmpLine.despesas}</div>
          <SparkLine values={sparklines.despesas} color="#F87171" />
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-title">Crédito</span>
            <span className="stat-ic" style={{ background: "rgba(249,115,22,.14)", color: "#F97316" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/></svg>
            </span>
          </div>
          <div className="stat-value red"><FitValue>{formatBRLFromCents(summary.totalCreditoCents)}</FitValue></div>
          <div className="stat-caption">gastos no crédito</div>
          <SparkLine values={sparklines.credito} color="#F97316" />
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <span className="stat-title">Saldo</span>
            <span className="stat-ic" style={{ background: "rgba(59,130,246,.14)", color: "#60A5FA" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h12v4"/><path d="M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5"/><circle cx="16.5" cy="12.5" r="1.3"/></svg>
            </span>
          </div>
          <div className={`stat-value ${saldoClass}`}><FitValue>{formatBRLFromCents(summary.saldoCents)}</FitValue></div>
          <div className="stat-caption">{cmpLine.saldo}</div>
          <SparkLine values={sparklines.saldo} color="#60A5FA" />
        </div>
      </div>

      {dueSoonExpenses.length > 0 ? (
        <section className="dashboard-due-alert dashboard-panel" aria-label="Despesas proximas do vencimento">
          <div className="dashboard-due-alert-main">
            <span className="dashboard-kicker">Atenção</span>
            <h3>
              {dueSoonExpenses.length === 1
                ? "1 despesa vence nos próximos dias"
                : `${dueSoonExpenses.length} despesas vencem nos próximos dias`}
            </h3>
            <p>Marque como paga quando resolver ou ajuste a data se precisar reorganizar o mês.</p>
          </div>

          <div className="dashboard-due-alert-list">
            {dueSoonExpenses.map((item) => (
              <div key={item.id} className="dashboard-due-alert-row">
                <div>
                  <strong>{item.title}</strong>
                  <span>
                    {item.category} • {formatDateBR(item.dateISO)}
                  </span>
                </div>
                <strong>{formatBRLFromCents(item.amountCents)}</strong>
              </div>
            ))}
          </div>

          <a className="dashboard-due-alert-action" href="/despesas">
            Ver despesas
          </a>
        </section>
      ) : null}

      <section className="dashboard-analytics-shell dashboard-panel">
        <div className="dashboard-analytics-head">
          <div>
            <span className="dashboard-kicker">Análise</span>
            <h3>Escolha o tipo de visão</h3>
          </div>

          <div className="dashboard-segmented" aria-label="Tipo de visão do dashboard">
            {[
              ["CONFRONTO", "Confronto"],
              ["GASTOS", "Gastos"],
              ["RECEITAS", "Receitas"],
              ["PAGAMENTO", "Pagamento"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={viewMode === value ? "is-active" : ""}
                onClick={() => setViewMode(value as DashboardViewMode)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {viewMode === "CONFRONTO" ? (
          <InteractiveDonut
            receitasCents={summary.totalReceitasCents}
            despesasCents={summary.totalDespesasCents}
            saldoCents={summary.saldoCents}
            periodo={getPeriodLabel(period)}
            receitaItems={filteredItems.filter(i => i.type === "RECEITA")}
            despesaItems={filteredItems.filter(i => i.type === "DESPESA")}
          />
        ) : (
          <DonutDashboardCard
            {...selectedAnalytics.primary}
            colors={donutColors}
          />
        )}
      </section>

      {parentCategorySummaries.length > 0 ? (
        <section className="parent-category-compare-shell dashboard-panel">
          <div className="parent-category-compare-head">
            <div>
              <span className="dashboard-kicker">Categorias pai</span>
              <h3>Compare dois blocos financeiros</h3>
              <p>Escolha duas categorias principais para ver quanto cada uma recebeu, gastou e manteve de saldo.</p>
            </div>
          </div>

          <div className="parent-category-select-grid">
            <label>
              <span>Dashboard 1</span>
              <select
                className="period-select"
                value={parentDashboardA}
                onChange={(event) => setParentDashboardA(event.target.value)}
              >
                {parentCategoryNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Dashboard 2</span>
              <select
                className="period-select"
                value={parentDashboardB}
                onChange={(event) => setParentDashboardB(event.target.value)}
              >
                {parentCategoryNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <MiniRingsCompare
            blockA={selectedParentDashboardA ? {
              label: "Dashboard 1",
              name: selectedParentDashboardA.name,
              receitasCents: selectedParentDashboardA.receitasCents,
              despesasCents: selectedParentDashboardA.despesasCents,
              saldoCents: selectedParentDashboardA.saldoCents,
            } : null}
            blockB={selectedParentDashboardB ? {
              label: "Dashboard 2",
              name: selectedParentDashboardB.name,
              receitasCents: selectedParentDashboardB.receitasCents,
              despesasCents: selectedParentDashboardB.despesasCents,
              saldoCents: selectedParentDashboardB.saldoCents,
            } : null}
          />
        </section>
      ) : null}

      <div className="dashboard-charts">
        <AreaTrendChart data={chartData} periodo={getPeriodLabel(period)} />
        <SummaryCards
          periodo={getPeriodLabel(period)}
          items={summaryCardItems}
        />
      </div>

      <div className="chart-card dashboard-panel dashboard-transactions">
        <div className="dashboard-card-head" style={{ marginBottom: 16 }}>
          <div>
            <span className="dashboard-kicker">Movimentações</span>
            <h3 style={{ margin: "4px 0 0", fontSize: 18 }}>Últimas transações</h3>
          </div>
        </div>

        {latestItems.length === 0 ? (
          <div className="dashboard-empty-panel">Ainda não há transações cadastradas.</div>
        ) : (
          <div className="tx-list">
            {latestItems.map((item) => {
              const isRec = item.type === "RECEITA";
              const color = isRec ? "#22C55E" : "#EF4444";
              const bg = isRec ? "rgba(34,197,94,.14)" : "rgba(239,68,68,.14)";
              const emoji = isRec ? "↑" : "↓";
              return (
                <div key={item.id} className="tx-row">
                  <span className="tx-ic" style={{ background: bg, color }}>{emoji}</span>
                  <div className="tx-main">
                    <strong>{item.title}</strong>
                    <span>{item.category} • {formatDateBR(item.dateISO)}</span>
                  </div>
                  <div className={`tx-amt ${isRec ? "green" : "red"}`}>
                    {isRec ? "+ " : "– "}{formatBRLFromCents(item.amountCents)}
                    <small>{isRec ? "Receita" : "Despesa"}</small>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
