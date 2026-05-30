import "./dashboard.css";

import { useEffect, useMemo, useState } from "react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import type { FinanceItem, PaymentType } from "../types/finance";

import {
  financeList,
  financeSubscribe,
} from "../lib/financeService";

import {
  calculateMonthComparison,
  calculateSummary,
} from "../lib/financeCalculations";

type PeriodKey = "MONTH" | "LAST_3" | "YEAR" | "ALL";
type DashboardViewMode = "CONFRONTO" | "GASTOS" | "RECEITAS" | "PAGAMENTO";

type DonutItem = {
  name: string;
  value: number;
  valueCents: number;
  percent: number;
  detailItems: FinanceItem[];
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

function getStartISO(period: PeriodKey): string | null {
  const now = new Date();

  if (period === "ALL") return null;
  if (period === "MONTH") return toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
  if (period === "LAST_3") return toISODate(new Date(now.getFullYear(), now.getMonth() - 2, 1));

  return toISODate(new Date(now.getFullYear(), 0, 1));
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
                  formatter={(_, name, props) => {
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

export default function Dashboard() {
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [period, setPeriod] = useState<PeriodKey>("LAST_3");
  const [viewMode, setViewMode] = useState<DashboardViewMode>("CONFRONTO");
  const [animate, setAnimate] = useState(false);

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
    setAnimate(false);

    const timeoutId = window.setTimeout(() => {
      setAnimate(true);
    }, 40);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [period, viewMode, items]);

  const filteredItems = useMemo(() => {
    const startISO = getStartISO(period);
    if (!startISO) return items;
    return items.filter((x) => x.dateISO >= startISO);
  }, [items, period]);

  const summary = useMemo(() => calculateSummary(filteredItems), [filteredItems]);
  const saldoClass = summary.saldoCents >= 0 ? "green" : "red";

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
          totalCents: summary.totalReceitasCents + summary.totalDespesasCents,
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
        totalCents: summary.totalReceitasCents + summary.totalDespesasCents,
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
      <div className="dashboard-hero dashboard-hero-panel">
        <div>
          <span className="dashboard-kicker">Painel financeiro</span>
          <h2>Visão Geral</h2>
          <p>Compare receitas, despesas, formas de pagamento e categorias por período.</p>
        </div>

        <div className="dashboard-filter-cluster">
          <label>
            <span>Período</span>
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
          <div className="stat-title">Receitas</div>
          <div className="stat-value green">{formatBRLFromCents(summary.totalReceitasCents)}</div>
          <div className="stat-caption">{cmpLine.receitas}</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Despesas</div>
          <div className="stat-value red">{formatBRLFromCents(summary.totalDespesasCents)}</div>
          <div className="stat-caption">{cmpLine.despesas}</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Crédito</div>
          <div className="stat-value red">{formatBRLFromCents(summary.totalCreditoCents)}</div>
          <div className="stat-caption">gastos no crédito</div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Saldo</div>
          <div className={`stat-value ${saldoClass}`}>{formatBRLFromCents(summary.saldoCents)}</div>
          <div className="stat-caption">{cmpLine.saldo}</div>
        </div>
      </div>

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

        <div className="dashboard-donut-grid">
          <DonutDashboardCard
            {...selectedAnalytics.primary}
            colors={donutColors}
          />
          <DonutDashboardCard
            {...selectedAnalytics.secondary}
            colors={donutColors.slice(2).concat(donutColors.slice(0, 2))}
          />
        </div>
      </section>

      <div className="dashboard-charts">
        <div className="chart-card dashboard-panel">
          <div className="chart-title">Receitas x Despesas ({getPeriodLabel(period)})</div>

          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="mes" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip
                  formatter={(value: unknown) => {
                    const n = typeof value === "number" ? value : Number(value);
                    if (Number.isNaN(n)) return String(value);
                    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                  }}
                  contentStyle={{
                    backgroundColor: "#0b1220",
                    border: "1px solid rgba(148,163,184,0.2)",
                    borderRadius: 10,
                    color: "#F1F5F9",
                  }}
                  itemStyle={{ color: "#F1F5F9", fontWeight: 800 }}
                  labelStyle={{ color: "#CBD5E1", fontWeight: 800 }}
                />
                <Line type="monotone" dataKey="receitas" stroke="#22C55E" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="despesas" stroke="#EF4444" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card dashboard-panel dashboard-mini-summary">
          <div className="chart-title">Resumo do período</div>
          <div className="dashboard-mini-list">
            <div>
              <span>Receitas</span>
              <strong className="green">{formatBRLFromCents(summary.totalReceitasCents)}</strong>
            </div>
            <div>
              <span>Despesas</span>
              <strong className="red">{formatBRLFromCents(summary.totalDespesasCents)}</strong>
            </div>
            <div>
              <span>Saldo</span>
              <strong className={saldoClass}>{formatBRLFromCents(summary.saldoCents)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-card dashboard-panel dashboard-transactions">
        <div className="chart-title">Últimas Transações</div>

        {latestItems.length === 0 ? (
          <div className="dashboard-empty-panel">Ainda não há transações cadastradas.</div>
        ) : (
          <div className="transactions-table">
            <div className="transaction-head">
              <div>Data</div>
              <div>Descrição</div>
              <div>Categoria</div>
              <div style={{ textAlign: "right" }}>Valor</div>
            </div>

            {latestItems.map((item) => (
              <div key={item.id} className="transaction-row">
                <div className="t-date">{new Date(`${item.dateISO}T00:00:00`).toLocaleDateString("pt-BR")}</div>
                <div className="t-title">{item.title}</div>
                <div className="t-category">{item.category}</div>
                <div className={item.type === "RECEITA" ? "t-value green" : "t-value red"}>
                  {item.type === "RECEITA" ? "+ " : "- "}
                  {formatBRLFromCents(item.amountCents)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
