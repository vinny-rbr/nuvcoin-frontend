import "./dashboard.css"; // CSS do dashboard

import { useEffect, useMemo, useState } from "react"; // Hooks do React

import {
  ResponsiveContainer, // Container responsivo
  LineChart, // Gráfico de linha
  Line, // Linhas do gráfico
  XAxis, // Eixo X
  YAxis, // Eixo Y
  Tooltip, // Tooltip
  CartesianGrid, // Grade
  PieChart, // Donut
  Pie, // Donut
  Cell, // Fatias
} from "recharts"; // Biblioteca de gráficos

import type { FinanceItem } from "../types/finance"; // Tipo dos itens financeiros

import {
  financeList, // ✅ Lê itens via service
  financeSubscribe, // ✅ Escuta mudanças via service
} from "../lib/financeService"; // Camada única (hoje localStorage, amanhã API)

import {
  calculateSummary, // Resumo (cards)
  groupExpensesByCategory, // Agrupa despesas por categoria (donut)
  calculateMonthComparison, // Comparação vs mês anterior
} from "../lib/financeCalculations"; // Cálculos do dashboard

type PeriodKey = "MONTH" | "LAST_3" | "YEAR" | "ALL"; // Tipos de filtro

// Formata centavos para BRL (R$ 1.234,56)
function formatBRLFromCents(valueCents: number): string {
  const value = valueCents / 100; // Converte centavos -> reais
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); // Formata BRL
}

// Converte Date para "YYYY-MM-DD"
function toISODate(d: Date): string {
  const yyyy = d.getFullYear(); // Ano
  const mm = String(d.getMonth() + 1).padStart(2, "0"); // Mês 01-12
  const dd = String(d.getDate()).padStart(2, "0"); // Dia 01-31
  return `${yyyy}-${mm}-${dd}`; // ISO
}

// Retorna "YYYY-MM" (para agrupar no gráfico)
function getYearMonth(dateISO: string): string {
  return dateISO.slice(0, 7); // Ex: "2026-02-20" -> "2026-02"
}

// Converte "YYYY-MM" para label tipo "Fev/26"
function ymToLabel(ym: string): string {
  const [y, m] = ym.split("-"); // Separa ano e mês
  const month = Number(m); // Mês numérico

  const monthNames = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ]; // Nomes

  const yy = y.slice(2); // Dois últimos dígitos do ano

  return `${monthNames[month - 1]}/${yy}`; // Label
}

// Soma meses em um (ano, mês) e devolve "YYYY-MM"
function addMonthsYM(ym: string, add: number): string {
  const [y, m] = ym.split("-"); // Ano e mês
  const year = Number(y); // Ano numérico
  const month0 = Number(m) - 1; // Mês 0-based
  const d = new Date(year, month0 + add, 1); // Vai para o mês somado
  const yyyy = d.getFullYear(); // Ano final
  const mm = String(d.getMonth() + 1).padStart(2, "0"); // Mês final
  return `${yyyy}-${mm}`; // "YYYY-MM"
}

// Lista de meses (YM) do início até o fim (inclui os dois)
function listMonthsBetween(startYM: string, endYM: string): string[] {
  const months: string[] = []; // Array final
  let cur = startYM; // Começa no início

  while (cur <= endYM) {
    months.push(cur); // Adiciona
    cur = addMonthsYM(cur, 1); // Próximo mês
  }

  return months; // Retorna lista
}

// Calcula o "startISO" baseado no filtro escolhido
function getStartISO(period: PeriodKey): string | null {
  const now = new Date(); // Data atual

  if (period === "ALL") return null; // Sem filtro

  if (period === "MONTH") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1); // Primeiro dia do mês atual
    return toISODate(start); // ISO
  }

  if (period === "LAST_3") {
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1); // Primeiro dia do mês de 2 meses atrás
    return toISODate(start); // ISO
  }

  // YEAR
  const start = new Date(now.getFullYear(), 0, 1); // 01/01 do ano atual
  return toISODate(start); // ISO
}

// Label amigável do período
function getPeriodLabel(period: PeriodKey): string {
  if (period === "MONTH") return "Mês atual"; // Label
  if (period === "LAST_3") return "Últimos 3 meses"; // Label
  if (period === "YEAR") return "Ano"; // Label
  return "Tudo"; // Label
}

export default function Dashboard() {
  const [items, setItems] = useState<FinanceItem[]>([]); // Estado com itens
  const [period, setPeriod] = useState<PeriodKey>("LAST_3"); // Filtro padrão

  // Carrega itens na entrada + escuta mudanças via service (entre abas + mesma aba)
  useEffect(() => {
    const load = () => {
      setItems(financeList()); // ✅ Lê via service
    };

    load(); // Carrega ao abrir

    const unsubscribe = financeSubscribe(load); // ✅ Assina mudanças

    return () => {
      unsubscribe(); // ✅ Remove listeners
    };
  }, []);

  // Filtra itens conforme o período
  const filteredItems = useMemo(() => {
    const startISO = getStartISO(period); // Pega startISO ou null
    if (!startISO) return items; // ALL: retorna tudo
    return items.filter((x) => x.dateISO >= startISO); // Filtra por data (string ISO)
  }, [items, period]);

  // Cards respeitam período (com crédito)
  const summary = useMemo(() => calculateSummary(filteredItems), [filteredItems]);

  // Saldo com cor (verde se >= 0, vermelho se < 0)
  const saldoClass = summary.saldoCents >= 0 ? "green" : "red"; // Classe pra cor do saldo

  // Comparação mês atual vs mês anterior (baseado em "hoje")
  const monthCmp = useMemo(() => {
    const referenceISO = toISODate(new Date()); // Hoje (mês atual)
    return calculateMonthComparison(items, referenceISO); // Compara mês atual vs anterior
  }, [items]);

  // Texto curto “vs mês anterior”
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

  // Gráfico respeita período e inclui meses vazios
  const chartData = useMemo(() => {
    const map = new Map<string, { receitasCents: number; despesasCents: number }>(); // Buckets por mês

    for (const item of filteredItems) {
      const ym = getYearMonth(item.dateISO); // "YYYY-MM"

      if (!map.has(ym)) {
        map.set(ym, { receitasCents: 0, despesasCents: 0 }); // Bucket do mês
      }

      const bucket = map.get(ym)!; // Bucket

      if (item.type === "RECEITA") bucket.receitasCents += item.amountCents; // Soma receita
      if (item.type === "DESPESA") bucket.despesasCents += item.amountCents; // Soma despesa
    }

    const now = new Date(); // Hoje
    const endYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; // "YYYY-MM" do mês atual

    let startYM = endYM; // Default

    if (period === "MONTH") {
      startYM = endYM; // Só mês atual
    } else if (period === "LAST_3") {
      startYM = addMonthsYM(endYM, -2); // 3 meses incluindo atual
    } else if (period === "YEAR") {
      startYM = `${now.getFullYear()}-01`; // Janeiro do ano
    } else {
      const monthsWithData = Array.from(map.keys()).sort(); // Meses existentes
      startYM = monthsWithData.length > 0 ? monthsWithData[0] : endYM; // Primeiro mês com dado
    }

    const monthsToShow = listMonthsBetween(startYM, endYM); // Meses no período

    return monthsToShow.map((ym) => {
      const bucket = map.get(ym) ?? { receitasCents: 0, despesasCents: 0 }; // Se não existir, zera
      return {
        mes: ymToLabel(ym), // Label
        receitas: Math.round(bucket.receitasCents / 100), // Reais número
        despesas: Math.round(bucket.despesasCents / 100), // Reais número
      };
    });
  }, [filteredItems, period]);

  // Donut: despesas por categoria (respeita período)
  const donutData = useMemo(() => {
    const grouped = groupExpensesByCategory(filteredItems); // Agrupa em centavos

    return grouped.map((x) => ({
      name: x.category, // Label
      value: Math.round(x.totalCents / 100), // Reais (número)
      valueCents: x.totalCents, // Mantém centavos pra tooltip e lista
    }));
  }, [filteredItems]);

  // Paleta simples (9 cores)
  const donutColors = [
    "#60A5FA",
    "#22C55E",
    "#F97316",
    "#A78BFA",
    "#EF4444",
    "#14B8A6",
    "#EAB308",
    "#F472B6",
    "#94A3B8",
  ]; // Cores do donut

  // Últimas transações (ordena por data desc e pega 8)
  const latestItems = useMemo(() => {
    return filteredItems
      .slice() // Cria cópia
      .sort((a, b) => b.dateISO.localeCompare(a.dateISO)) // Ordena desc
      .slice(0, 8); // Pega 8
  }, [filteredItems]);

  return (
    <>
      {/* Cabeçalho + filtro */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: 0 }}>Visão Geral</h2>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ color: "var(--text-secondary)" }}>Período:</div>

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
        </div>
      </div>

      {/* Cards */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-title">Receitas</div>
          <div className="stat-value green">
            {formatBRLFromCents(summary.totalReceitasCents)}
          </div>

          <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-secondary)" }}>
            {cmpLine.receitas}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Despesas</div>
          <div className="stat-value red">
            {formatBRLFromCents(summary.totalDespesasCents)}
          </div>

          <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-secondary)" }}>
            {cmpLine.despesas}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Crédito</div>
          <div className="stat-value red">
            {formatBRLFromCents(summary.totalCreditoCents)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Saldo</div>

          <div className={`stat-value ${saldoClass}`}>
            {formatBRLFromCents(summary.saldoCents)}
          </div>

          <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-secondary)" }}>
            {cmpLine.saldo}
          </div>
        </div>
      </div>

      {/* Layout 2 colunas: linha à esquerda + donut à direita */}
      <div className="dashboard-charts">
        {/* Gráfico linha */}
        <div className="chart-card">
          <div className="chart-title">
            Receitas x Despesas ({getPeriodLabel(period)})
          </div>

          {chartData.length === 0 ? (
            <div style={{ color: "var(--text-secondary)", padding: 10 }}>
              Ainda não há lançamentos suficientes para montar o gráfico. Cadastre
              uma receita e uma despesa.
            </div>
          ) : (
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.15)"
                  />
                  <XAxis dataKey="mes" stroke="#94A3B8" />
                  <YAxis stroke="#94A3B8" />
                  <Tooltip
                    formatter={(value: any) => {
                      const n = typeof value === "number" ? value : Number(value);
                      if (Number.isNaN(n)) return value;
                      return n.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      });
                    }}
                    contentStyle={{
                      backgroundColor: "#0b1220",
                      border: "1px solid rgba(148,163,184,0.2)",
                      borderRadius: 10,
                      color: "#F1F5F9",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="receitas"
                    stroke="#22C55E"
                    strokeWidth={3}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="despesas"
                    stroke="#EF4444"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Donut */}
        <div className="chart-card">
          <div className="chart-title">
            Despesas por categoria ({getPeriodLabel(period)})
          </div>

          {donutData.length === 0 ? (
            <div style={{ color: "var(--text-secondary)", padding: 10 }}>
              Ainda não há despesas suficientes para montar o gráfico.
            </div>
          ) : (
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div style={{ width: 240, height: 240, position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {donutData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={donutColors[index % donutColors.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    textAlign: "center",
                    fontWeight: 700,
                  }}
                >
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    Total
                  </div>
                  <div style={{ fontSize: 18 }}>
                    {formatBRLFromCents(summary.totalDespesasCents)}
                  </div>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                {donutData.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: donutColors[index % donutColors.length],
                        }}
                      />
                      <span style={{ fontSize: 13 }}>{item.name}</span>
                    </div>

                    <span style={{ fontWeight: 600 }}>
                      {formatBRLFromCents(item.valueCents)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Últimas Transações */}
      <div className="chart-card" style={{ marginTop: 18 }}>
        <div className="chart-title">Últimas Transações</div>

        {latestItems.length === 0 ? (
          <div style={{ color: "var(--text-secondary)", padding: 10 }}>
            Ainda não há transações cadastradas.
          </div>
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
                <div className="t-date">
                  {new Date(item.dateISO).toLocaleDateString("pt-BR")}
                </div>

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
    </>
  );
}

/*
=====================================================
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com
=====================================================

Mudança feita:

✔ Dashboard agora pega dados via financeService (hoje localStorage, amanhã API)
✔ Não mexi em layout, gráficos, donut, tabela, nem filtro
*/