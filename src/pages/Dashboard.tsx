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
} from "recharts"; // Biblioteca de gráficos

import type { FinanceItem } from "../types/finance"; // Tipo dos itens financeiros

import { loadFinanceItems, calcFinanceSummary } from "../lib/financeStorage"; // Storage + resumo

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
  if (period === "MONTH") return "Mês atual";
  if (period === "LAST_3") return "Últimos 3 meses";
  if (period === "YEAR") return "Ano";
  return "Tudo";
}

export default function Dashboard() {
  const [items, setItems] = useState<FinanceItem[]>([]); // Estado com itens
  const [period, setPeriod] = useState<PeriodKey>("LAST_3"); // Filtro padrão: últimos 3 meses

  // Carrega itens na entrada + escuta mudanças do localStorage (entre abas) e evento custom (mesma aba)
  useEffect(() => {
    const load = () => {
      setItems(loadFinanceItems()); // Lê do localStorage
    };

    load(); // Carrega ao abrir

    // Atualiza quando mudar o localStorage (outra aba)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "nuvcoin_finance_items_v1") load(); // Recarrega se mudou a chave
    };

    // Atualiza na mesma aba quando suas telas dispararem o evento custom
    const onUpdated = () => {
      load(); // Recarrega
    };

    window.addEventListener("storage", onStorage); // Listener entre abas
    window.addEventListener("nuvcoin_finance_updated", onUpdated as EventListener); // Listener mesma aba

    return () => {
      window.removeEventListener("storage", onStorage); // Remove listener
      window.removeEventListener("nuvcoin_finance_updated", onUpdated as EventListener); // Remove listener
    };
  }, []);

  // ✅ Filtra itens conforme o período
  const filteredItems = useMemo(() => {
    const startISO = getStartISO(period); // Pega startISO ou null

    if (!startISO) return items; // ALL: retorna tudo

    // Como é "YYYY-MM-DD", comparar string funciona corretamente
    return items.filter((x) => x.dateISO >= startISO); // Filtra por data
  }, [items, period]);

  // ✅ Cards respeitam período
  const summary = useMemo(() => calcFinanceSummary(filteredItems), [filteredItems]);

  // ✅ Gráfico respeita período e inclui meses vazios
  const chartData = useMemo(() => {
    const map = new Map<string, { receitasCents: number; despesasCents: number }>(); // Buckets por mês

    // Soma valores por mês
    for (const item of filteredItems) {
      const ym = getYearMonth(item.dateISO); // "YYYY-MM"

      if (!map.has(ym)) {
        map.set(ym, { receitasCents: 0, despesasCents: 0 }); // Bucket do mês
      }

      const bucket = map.get(ym)!; // Bucket

      if (item.type === "RECEITA") bucket.receitasCents += item.amountCents; // Soma receita
      if (item.type === "DESPESA") bucket.despesasCents += item.amountCents; // Soma despesa
    }

    // Intervalo de meses a exibir
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
      // ALL: do primeiro mês com dado até o atual; se não tiver dado, só atual
      const monthsWithData = Array.from(map.keys()).sort(); // Meses existentes
      startYM = monthsWithData.length > 0 ? monthsWithData[0] : endYM; // Primeiro mês com dado
    }

    const monthsToShow = listMonthsBetween(startYM, endYM); // Meses no período

    // Dataset final (inclui meses sem movimento como 0)
    return monthsToShow.map((ym) => {
      const bucket = map.get(ym) ?? { receitasCents: 0, despesasCents: 0 }; // Se não existir, zera
      return {
        mes: ymToLabel(ym), // Label
        receitas: Math.round(bucket.receitasCents / 100), // Reais número
        despesas: Math.round(bucket.despesasCents / 100), // Reais número
      };
    });
  }, [filteredItems, period]);

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
        </div>

        <div className="stat-card">
          <div className="stat-title">Despesas</div>
          <div className="stat-value red">
            {formatBRLFromCents(summary.totalDespesasCents)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-title">Saldo</div>
          <div className="stat-value">{formatBRLFromCents(summary.saldoCents)}</div>
        </div>
      </div>

      {/* Gráfico */}
      <div className="chart-card">
        <div className="chart-title">Receitas x Despesas ({getPeriodLabel(period)})</div>

        {chartData.length === 0 ? (
          <div style={{ color: "var(--text-secondary)", padding: 10 }}>
            Ainda não há lançamentos suficientes para montar o gráfico. Cadastre uma receita e uma despesa.
          </div>
        ) : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                <XAxis dataKey="mes" stroke="#94A3B8" />
                <YAxis stroke="#94A3B8" />
                <Tooltip
                  formatter={(value: any) => {
                    const n = typeof value === "number" ? value : Number(value); // Converte seguro
                    if (Number.isNaN(n)) return value; // Se não for número, volta
                    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); // Formata BRL
                  }}
                  contentStyle={{
                    backgroundColor: "#0b1220",
                    border: "1px solid rgba(148,163,184,0.2)",
                    borderRadius: 10,
                    color: "#F1F5F9",
                  }}
                />
                <Line type="monotone" dataKey="receitas" stroke="#22C55E" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="despesas" stroke="#EF4444" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </>
  );
}

/*
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com

// O que foi corrigido aqui:
// - filteredItems respeita o período e alimenta cards + chart
// - Gráfico mostra meses vazios como 0
// - Select usa className="period-select" (pra corrigir o dropdown branco via CSS)
*/