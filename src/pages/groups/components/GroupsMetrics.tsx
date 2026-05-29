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
  const valueStyle: CSSProperties = {
    fontWeight: 900,
    fontSize: "clamp(13px, 1.6vw, 22px)",
    lineHeight: 1.1,
    letterSpacing: -0.4,
    whiteSpace: "normal",
    overflowWrap: "anywhere",
    minWidth: 0,
  }; // Fonte menor e mais proporcional para caber sem cortar

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(132px, 1fr))", gap: 12 }}>
      <div style={{ ...metricCard("blue"), minWidth: 0 }}>
        <div style={subtleText}>Total do mês</div>
        <div style={valueStyle}>{formatBRLFromCents(monthTotalCents)}</div>
      </div>

      <div style={{ ...metricCard("green"), minWidth: 0 }}>
        <div style={subtleText}>Despesas no mês</div>
        <div style={valueStyle}>{monthExpensesCount}</div>
      </div>

      <div style={{ ...metricCard("purple"), minWidth: 0 }}>
        <div style={subtleText}>Membros</div>
        <div style={valueStyle}>{membersCount}</div>
      </div>

      <div style={{ ...metricCard(highestBurden > recommendedLimitPercent ? "red" : "blue"), minWidth: 0 }}>
        <div style={subtleText}>Média por pessoa</div>
        <div style={valueStyle}>{formatBRLFromCents(averagePerPersonCents)}</div>
      </div>
    </div>
  );
}

// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com
//
// Ajuste aplicado:
// - ✅ removido ellipsis
// - ✅ mantido valor completo
// - ✅ fonte reduzida de forma proporcional
// - ✅ espaçamento ajustado para caber melhor no card
