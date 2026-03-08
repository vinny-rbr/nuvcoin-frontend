import type { CSSProperties } from "react";

import { formatBRLFromCents } from "../utils/groups.helpers";

type GroupsMetricsProps = {
  monthTotalCents: number;
  monthExpensesCount: number;
  membersCount: number;
  averagePerPersonCents: number;
  highestBurden: number;
  recommendedLimitPercent: number;
  subtleText: CSSProperties;
  metricCard: (accent?: "blue" | "green" | "red" | "purple") => CSSProperties;
};

export default function GroupsMetrics({
  monthTotalCents,
  monthExpensesCount,
  membersCount,
  averagePerPersonCents,
  highestBurden,
  recommendedLimitPercent,
  subtleText,
  metricCard,
}: GroupsMetricsProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
      <div style={metricCard("blue")}>
        <div style={subtleText}>Total do mês</div>
        <div style={{ fontWeight: 900, fontSize: 26, letterSpacing: -0.5 }}>{formatBRLFromCents(monthTotalCents)}</div>
      </div>

      <div style={metricCard("green")}>
        <div style={subtleText}>Despesas no mês</div>
        <div style={{ fontWeight: 900, fontSize: 26 }}>{monthExpensesCount}</div>
      </div>

      <div style={metricCard("purple")}>
        <div style={subtleText}>Membros</div>
        <div style={{ fontWeight: 900, fontSize: 26 }}>{membersCount}</div>
      </div>

      <div style={metricCard(highestBurden > recommendedLimitPercent ? "red" : "blue")}>
        <div style={subtleText}>Média por pessoa</div>
        <div style={{ fontWeight: 900, fontSize: 26, letterSpacing: -0.4 }}>{formatBRLFromCents(averagePerPersonCents)}</div>
      </div>
    </div>
  );
}

// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com
//
// Componente extraído do Groups.tsx:
// - Cards de métricas
// - Total do mês
// - Despesas no mês
// - Membros
// - Média por pessoa