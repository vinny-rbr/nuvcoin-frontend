import type { FinanceItem, FinanceSummary } from "../types/finance";

// =============================
// RESUMO PRINCIPAL
// =============================
export function calculateSummary(items: FinanceItem[]): FinanceSummary {
  let totalReceitasCents = 0;
  let totalDespesasCents = 0;
  let totalCreditoCents = 0;

  for (const item of items) {
    // Soma receitas
    if (item.type === "RECEITA") {
      totalReceitasCents += item.amountCents;
    }

    // Soma despesas
    if (item.type === "DESPESA") {
      totalDespesasCents += item.amountCents;

      // Crédito é despesa com paymentType = credit
      if (item.paymentType === "credit") {
        totalCreditoCents += item.amountCents;
      }
    }
  }

  const saldoCents = totalReceitasCents - totalDespesasCents;

  return {
    totalReceitasCents,
    totalDespesasCents,
    totalCreditoCents,
    saldoCents,
  };
}

// =============================
// PASSO 3.6 — COMPARAÇÃO VS MÊS ANTERIOR
// (Receitas, Despesas, Crédito e Saldo do mês atual vs mês anterior)
// =============================

export type TrendDirection = "UP" | "DOWN" | "FLAT";

export type MetricDelta = {
  currentCents: number;
  previousCents: number;
  deltaCents: number;
  pct: number | null; // null quando previous = 0
  direction: TrendDirection;
};

export type MonthComparisonResult = {
  current: FinanceSummary;
  previous: FinanceSummary;

  receitas: MetricDelta;
  despesas: MetricDelta;
  credito: MetricDelta;
  saldo: MetricDelta;

  currentMonthKey: string; // "YYYY-MM"
  previousMonthKey: string; // "YYYY-MM"
};

// Parse ISO seguro (evita bug de timezone do new Date("YYYY-MM-DD"))
function parseISODateSafe(iso: string): Date {
  const [yyyy, mm, dd] = iso.split("-").map(Number);
  return new Date(yyyy, (mm ?? 1) - 1, dd ?? 1, 0, 0, 0, 0);
}

// Date -> "YYYY-MM-DD" (sem UTC)
function toISODateOnly(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Date -> "YYYY-MM"
function monthKeyFromDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

// Range: [startISO, endISOExclusive)
function isISOInRange(dateISO: string, startISO: string, endISOExclusive: string): boolean {
  const d = parseISODateSafe(dateISO).getTime();
  const start = parseISODateSafe(startISO).getTime();
  const end = parseISODateSafe(endISOExclusive).getTime();
  return d >= start && d < end;
}

// Bounds do mês do referenceISO
function getMonthBounds(referenceISO: string): { startISO: string; endISOExclusive: string } {
  const d = parseISODateSafe(referenceISO);
  const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1, 0, 0, 0, 0);
  return { startISO: toISODateOnly(start), endISOExclusive: toISODateOnly(end) };
}

// Bounds do mês anterior (usando start do mês atual)
function getPreviousMonthBounds(currentMonthStartISO: string): { startISO: string; endISOExclusive: string } {
  const curStart = parseISODateSafe(currentMonthStartISO);
  const prevStart = new Date(curStart.getFullYear(), curStart.getMonth() - 1, 1, 0, 0, 0, 0);
  const prevEnd = new Date(curStart.getFullYear(), curStart.getMonth(), 1, 0, 0, 0, 0);
  return { startISO: toISODateOnly(prevStart), endISOExclusive: toISODateOnly(prevEnd) };
}

// Monta delta (diferença + % + direção)
function buildMetricDelta(currentCents: number, previousCents: number): MetricDelta {
  const deltaCents = currentCents - previousCents;

  let direction: TrendDirection = "FLAT";
  if (deltaCents > 0) direction = "UP";
  if (deltaCents < 0) direction = "DOWN";

  const pct = previousCents === 0 ? null : (deltaCents / previousCents) * 100;

  return {
    currentCents,
    previousCents,
    deltaCents,
    pct,
    direction,
  };
}

// Summary por período (reaproveita sua regra oficial do summary, incluindo crédito)
export function calculateSummaryInRange(
  items: FinanceItem[],
  startISO: string,
  endISOExclusive: string
): FinanceSummary {
  const filtered = items.filter((item) => isISOInRange(item.dateISO, startISO, endISOExclusive));
  return calculateSummary(filtered);
}

// Função principal do comparativo mês atual vs mês anterior
export function calculateMonthComparison(
  items: FinanceItem[],
  referenceISO: string
): MonthComparisonResult {
  const currentBounds = getMonthBounds(referenceISO);
  const previousBounds = getPreviousMonthBounds(currentBounds.startISO);

  const currentSummary = calculateSummaryInRange(items, currentBounds.startISO, currentBounds.endISOExclusive);
  const previousSummary = calculateSummaryInRange(items, previousBounds.startISO, previousBounds.endISOExclusive);

  const refDate = parseISODateSafe(referenceISO);
  const currentKey = monthKeyFromDate(refDate);
  const prevKey = monthKeyFromDate(new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1, 0, 0, 0, 0));

  return {
    current: currentSummary,
    previous: previousSummary,

    receitas: buildMetricDelta(currentSummary.totalReceitasCents, previousSummary.totalReceitasCents),
    despesas: buildMetricDelta(currentSummary.totalDespesasCents, previousSummary.totalDespesasCents),
    credito: buildMetricDelta(currentSummary.totalCreditoCents, previousSummary.totalCreditoCents),
    saldo: buildMetricDelta(currentSummary.saldoCents, previousSummary.saldoCents),

    currentMonthKey: currentKey,
    previousMonthKey: prevKey,
  };
}

// =============================
// AGRUPAR DESPESAS POR CATEGORIA (DONUT)
// =============================
export function groupExpensesByCategory(items: FinanceItem[]) {
  const map: Record<string, number> = {};

  for (const item of items) {
    if (item.type === "DESPESA") {
      if (!map[item.category]) {
        map[item.category] = 0;
      }

      map[item.category] += item.amountCents;
    }
  }

  return Object.entries(map).map(([category, total]) => ({
    category,
    totalCents: total,
  }));
}

// =============================
// AGRUPAR POR MÊS (SÉRIE DO GRÁFICO)
// =============================
export function groupByMonth(items: FinanceItem[]) {
  const map: Record<string, { receitas: number; despesas: number }> = {};

  for (const item of items) {
    const date = parseISODateSafe(item.dateISO); // usa parse seguro
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; // pad 01..12

    if (!map[key]) {
      map[key] = { receitas: 0, despesas: 0 };
    }

    if (item.type === "RECEITA") {
      map[key].receitas += item.amountCents;
    }

    if (item.type === "DESPESA") {
      map[key].despesas += item.amountCents;
    }
  }

  return Object.entries(map).map(([month, values]) => ({
    month,
    receitas: values.receitas,
    despesas: values.despesas,
  }));
}

/*
=====================================================
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com
=====================================================

O que este arquivo faz agora:

✔ calculateSummary → cards principais (inclui crédito)
✔ PASSO 3.6 → comparação mês atual vs mês anterior
  - Receitas, Despesas, Crédito e Saldo
  - delta em cents
  - % (null se anterior = 0)
  - direção UP/DOWN/FLAT (setinha)
✔ groupExpensesByCategory → donut
✔ groupByMonth → gráfico de linha
✔ amountCents sempre positivo
✔ Crédito = DESPESA + paymentType="credit"
*/