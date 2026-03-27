import { useMemo } from "react"; // Hook do React para memorizar cálculos pesados
import type { ChartOptions, TooltipItem } from "chart.js"; // Tipos do gráfico doughnut

import type {
  GroupBalancesResponse,
  GroupExpensesListResponse,
  GroupMembersResponse,
  GroupSplitMode,
} from "../types/groups.types"; // Tipos principais do módulo Groups

import {
  currentMonthKeyUTC,
  formatBRL,
  monthKeyFromISO,
  safeName,
  percentTextToNumber,
} from "../utils/groups.helpers"; // Helpers reutilizados do módulo

type UseGroupsCalculationsParams = {
  balances: GroupBalancesResponse | null; // Dados de balances do grupo selecionado
  membersInfo: GroupMembersResponse | null; // Dados completos de membros
  expenses: GroupExpensesListResponse | null; // Lista de despesas do grupo
  splitMode: GroupSplitMode; // Modo atual de divisão (SALARY ou MANUAL)
  salaryByUserId: Record<string, number>; // Base salarial por usuário
  manualPercentInputByUserId: Record<string, string>; // Inputs manuais em texto por usuário
}; // Parâmetros de entrada do hook

export function useGroupsCalculations({
  balances,
  membersInfo,
  expenses,
  splitMode,
  salaryByUserId,
  manualPercentInputByUserId,
}: UseGroupsCalculationsParams) {
  const members = useMemo(() => {
    return balances?.members ?? []; // Usa membros vindos de balances ou array vazio
  }, [balances?.members]); // Recalcula quando balances.members mudar

  const membersCount = useMemo(() => {
    return membersInfo?.members?.length ?? 0; // Conta membros do payload de membersInfo
  }, [membersInfo?.members?.length]); // Recalcula quando a quantidade mudar

  const currentMonthKey = useMemo(() => {
    return currentMonthKeyUTC(); // Gera chave do mês atual em UTC
  }, []); // Executa apenas uma vez

  const monthExpenses = useMemo(() => {
    const items = expenses?.items ?? []; // Lê lista de despesas com fallback
    return items.filter((expense) => monthKeyFromISO(expense.date) === currentMonthKey); // Filtra só despesas do mês atual
  }, [expenses?.items, currentMonthKey]); // Recalcula quando despesas ou mês mudarem

  const monthTotalCents = useMemo(() => {
    return monthExpenses.reduce((accumulator, expense) => accumulator + (expense.amountCents ?? 0), 0); // Soma total do mês em centavos
  }, [monthExpenses]); // Recalcula quando a lista do mês mudar

  const salaryTotal = useMemo(() => {
    return members.reduce((accumulator, member) => accumulator + (Number(salaryByUserId[member.userId] ?? 0) || 0), 0); // Soma todos os salários cadastrados
  }, [members, salaryByUserId]); // Recalcula quando membros ou salários mudarem

  const salaryWeights = useMemo(() => {
    const total = salaryTotal; // Guarda total salarial para cálculo dos pesos
    const map: Record<string, number> = {}; // Cria mapa final de pesos por usuário

    if (total <= 0) {
      for (const member of members) {
        map[member.userId] = 0; // Se não houver base salarial válida, zera todos os pesos
      }

      return map; // Retorna mapa zerado
    }

    for (const member of members) {
      const salary = Number(salaryByUserId[member.userId] ?? 0) || 0; // Lê salário do usuário atual
      map[member.userId] = salary > 0 ? salary / total : 0; // Calcula peso proporcional do salário
    }

    return map; // Retorna pesos calculados
  }, [members, salaryByUserId, salaryTotal]); // Recalcula quando base salarial mudar

  const manualPercentNumberByUserId = useMemo(() => {
    const map: Record<string, number> = {}; // Cria mapa numérico final

    for (const member of members) {
      map[member.userId] = percentTextToNumber(manualPercentInputByUserId[member.userId] ?? "0"); // Converte input textual em número
    }

    return map; // Retorna mapa numérico dos percentuais
  }, [members, manualPercentInputByUserId]); // Recalcula quando inputs manuais mudarem

  const manualPercentTotal = useMemo(() => {
    return members.reduce((accumulator, member) => accumulator + (Number(manualPercentNumberByUserId[member.userId] ?? 0) || 0), 0); // Soma total dos percentuais manuais
  }, [members, manualPercentNumberByUserId]); // Recalcula quando percentuais mudarem

  const manualWeights = useMemo(() => {
    const map: Record<string, number> = {}; // Cria mapa final de pesos manuais

    for (const member of members) {
      const percent = Number(manualPercentNumberByUserId[member.userId] ?? 0) || 0; // Lê percentual manual do membro
      map[member.userId] = percent > 0 ? percent / 100 : 0; // Converte percentual em peso decimal
    }

    return map; // Retorna pesos manuais
  }, [members, manualPercentNumberByUserId]); // Recalcula quando percentuais numéricos mudarem

  const isManualConfigValid = useMemo(() => {
    if (members.length === 0) return false; // Sem membros não existe base manual válida
    if (manualPercentTotal <= 0) return false; // Soma zerada não é válida
    return Math.abs(manualPercentTotal - 100) < 0.01; // A soma precisa fechar 100%
  }, [members.length, manualPercentTotal]); // Recalcula quando membros ou soma mudarem

  const activeWeights = useMemo(() => {
    return splitMode === "MANUAL" ? manualWeights : salaryWeights; // Decide qual mapa de pesos está valendo
  }, [splitMode, manualWeights, salaryWeights]); // Recalcula quando modo ou pesos mudarem

  const canCalculateMonthSplit = useMemo(() => {
    if (splitMode === "MANUAL") {
      return isManualConfigValid; // No modo manual precisa fechar 100%
    }

    return salaryTotal > 0; // No modo salary precisa haver base salarial
  }, [splitMode, isManualConfigValid, salaryTotal]); // Recalcula quando as validações mudarem

  const monthSplit = useMemo(() => {
    const totalInCurrency = monthTotalCents / 100; // Converte total do mês de centavos para reais

    const rows = members.map((member) => {
      const salary = Number(salaryByUserId[member.userId] ?? 0) || 0; // Lê salário do membro
      const weight = Number(activeWeights[member.userId] ?? 0) || 0; // Lê peso ativo do membro
      const shouldPay = totalInCurrency * weight; // Calcula quanto o membro deveria pagar
      const percentOfSalary = salary > 0 ? (shouldPay / salary) * 100 : 0; // Calcula quanto isso representa do salário

      return {
        userId: member.userId, // Mantém userId na linha final
        label: safeName(member.name, member.email, member.userId), // Gera nome amigável para exibição
        salary, // Salário numérico do membro
        weightPercent: weight * 100, // Peso em percentual
        shouldPay, // Valor que deveria pagar em reais
        percentOfSalary, // Quanto compromete do salário
        manualPercent: Number(manualPercentNumberByUserId[member.userId] ?? 0) || 0, // Percentual manual do membro
      }; // Retorna linha consolidada do resumo
    });

    rows.sort((firstRow, secondRow) => secondRow.shouldPay - firstRow.shouldPay); // Ordena do maior impacto para o menor
    return rows; // Retorna resumo final do mês
  }, [members, monthTotalCents, salaryByUserId, activeWeights, manualPercentNumberByUserId]); // Recalcula quando entradas principais mudarem

  const historyItems = useMemo(() => {
    const items = expenses?.items ?? []; // Lê todas as despesas com fallback
    return items.slice(0, 12); // Mantém apenas os últimos 12 itens do histórico
  }, [expenses?.items]); // Recalcula quando lista de despesas mudar

  const salaryFilledCount = useMemo(() => {
    const ids = members.map((member) => member.userId); // Extrai ids dos membros atuais
    return ids.filter((id) => (Number(salaryByUserId[id] ?? 0) || 0) > 0).length; // Conta quantos salários válidos foram preenchidos
  }, [members, salaryByUserId]); // Recalcula quando membros ou salários mudarem

  const averagePerPersonCents = useMemo(() => {
    if (membersCount <= 0) return 0; // Evita divisão por zero
    return Math.round(monthTotalCents / membersCount); // Calcula média por pessoa em centavos
  }, [monthTotalCents, membersCount]); // Recalcula quando total ou quantidade de membros mudar

  const highestBurden = useMemo(() => {
    if (monthSplit.length === 0) return 0; // Sem linhas não há comprometimento
    return Math.max(...monthSplit.map((item) => item.percentOfSalary || 0)); // Pega maior percentual de comprometimento
  }, [monthSplit]); // Recalcula quando monthSplit mudar

  const chartPalette = useMemo(() => {
    return ["#5B8CFF", "#8B5CF6", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#A3E635", "#F97316", "#14B8A6"]; // Define paleta visual do gráfico
  }, []); // Executa apenas uma vez

  const monthSplitChartColors = useMemo(() => {
    return monthSplit.map((_, index) => chartPalette[index % chartPalette.length]); // Distribui cores de forma cíclica
  }, [monthSplit, chartPalette]); // Recalcula quando quantidade de linhas mudar

  const monthSplitChartData = useMemo(() => {
    return {
      labels: monthSplit.map((item) => item.label), // Usa rótulos amigáveis dos membros
      datasets: [
        {
          data: monthSplit.map((item) => Number(item.shouldPay.toFixed(2))), // Dados do gráfico em reais com duas casas
          backgroundColor: monthSplitChartColors, // Define cor de cada fatia
          borderColor: "rgba(9,13,22,0.92)", // Cor da borda do gráfico
          borderWidth: 3, // Largura da borda
          hoverOffset: 8, // Destaque visual ao passar o mouse
        },
      ],
    }; // Retorna estrutura esperada pelo Chart.js
  }, [monthSplit, monthSplitChartColors]); // Recalcula quando dados do split mudarem

  const monthSplitChartOptions = useMemo<ChartOptions<"doughnut">>(() => {
    return {
      responsive: true, // Mantém gráfico responsivo
      maintainAspectRatio: false, // Permite ocupar altura do card
      cutout: "68%", // Define espessura do doughnut
      plugins: {
        legend: {
          display: false, // Esconde legenda padrão
        },
        tooltip: {
          backgroundColor: "rgba(12,16,25,0.96)", // Cor de fundo do tooltip
          borderColor: "rgba(255,255,255,0.10)", // Borda sutil do tooltip
          borderWidth: 1, // Espessura da borda
          padding: 12, // Espaçamento interno
          titleColor: "#ffffff", // Cor do título
          bodyColor: "rgba(255,255,255,0.86)", // Cor do corpo
          callbacks: {
            label: (context: TooltipItem<"doughnut">) => {
              const total = monthSplit.reduce((accumulator, item) => accumulator + item.shouldPay, 0); // Soma total do gráfico
              const raw = Number(context.raw ?? 0); // Lê valor bruto da fatia atual
              const percent = total > 0 ? (raw / total) * 100 : 0; // Calcula percentual da fatia
              return `${context.label ?? ""}: ${formatBRL(raw)} • ${percent.toFixed(1)}%`; // Retorna texto final do tooltip
            },
          },
        },
      },
    }; // Retorna opções prontas do doughnut
  }, [monthSplit]); // Recalcula quando os dados do split mudarem

  return {
    members, // Lista de membros derivada de balances
    membersCount, // Quantidade total de membros
    currentMonthKey, // Chave do mês atual
    monthExpenses, // Lista de despesas do mês atual
    monthTotalCents, // Total do mês em centavos
    salaryTotal, // Soma total dos salários
    salaryWeights, // Pesos calculados por salário
    manualPercentNumberByUserId, // Percentuais manuais convertidos para número
    manualPercentTotal, // Soma dos percentuais manuais
    manualWeights, // Pesos manuais convertidos para decimal
    isManualConfigValid, // Indica se a base manual fecha 100%
    activeWeights, // Pesos realmente usados pelo dashboard
    canCalculateMonthSplit, // Indica se já dá para calcular o resumo do mês
    monthSplit, // Linhas finais do resumo por pessoa
    historyItems, // Últimos 12 itens do histórico
    salaryFilledCount, // Quantidade de salários preenchidos
    averagePerPersonCents, // Média por pessoa em centavos
    highestBurden, // Maior comprometimento percentual
    monthSplitChartColors, // Cores finais do gráfico
    monthSplitChartData, // Dados prontos do gráfico
    monthSplitChartOptions, // Opções prontas do gráfico
  }; // Retorna tudo consolidado para o componente
}
