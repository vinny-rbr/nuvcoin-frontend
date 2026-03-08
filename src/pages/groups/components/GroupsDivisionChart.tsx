import type { CSSProperties } from "react";
import type { ChartOptions } from "chart.js";
import { Doughnut } from "react-chartjs-2";

import { formatBRL, formatBRLFromCents } from "../utils/groups.helpers";

type MonthSplitItem = {
  userId: string;
  label: string;
  salary: number;
  weightPercent: number;
  shouldPay: number;
  percentOfSalary: number;
  manualPercent: number;
};

type GroupsDivisionChartProps = {
  splitMode: "SALARY" | "MANUAL";
  canCalculateMonthSplit: boolean;
  monthTotalCents: number;
  monthSplit: MonthSplitItem[];
  monthSplitChartColors: string[];
  monthSplitChartData: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
      borderColor: string;
      borderWidth: number;
      hoverOffset: number;
    }[];
  };
  monthSplitChartOptions: ChartOptions<"doughnut">;
  sectionCard: CSSProperties;
  panelTitle: CSSProperties;
  subtleText: CSSProperties;
};

export default function GroupsDivisionChart({
  splitMode,
  canCalculateMonthSplit,
  monthTotalCents,
  monthSplit,
  monthSplitChartColors,
  monthSplitChartData,
  monthSplitChartOptions,
  sectionCard,
  panelTitle,
  subtleText,
}: GroupsDivisionChartProps) {
  return (
    <div style={sectionCard}>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <div style={panelTitle}>Divisão do mês</div>
          <div style={subtleText}>Visual estilo app financeiro para mostrar quanto cada pessoa representa no total do grupo.</div>
        </div>

        {!canCalculateMonthSplit && (
          <div style={subtleText}>
            {splitMode === "SALARY"
              ? "Defina os salários em Base do grupo para exibir o gráfico de divisão."
              : "Ajuste os percentuais manuais até fechar 100% para exibir o gráfico de divisão."}
          </div>
        )}

        {canCalculateMonthSplit && monthTotalCents === 0 && <div style={subtleText}>Sem despesas no mês atual ainda.</div>}

        {canCalculateMonthSplit && monthTotalCents > 0 && monthSplit.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(260px, 340px) minmax(0, 1fr)",
              gap: 24,
              alignItems: "center",
              minWidth: 0,
            }}
          >
            <div
              style={{
                minHeight: 300,
                padding: 16,
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "linear-gradient(180deg, rgba(91,140,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                display: "grid",
                placeItems: "center",
                minWidth: 0,
              }}
            >
              <div style={{ width: "100%", maxWidth: 260, height: 260, position: "relative" }}>
                <Doughnut data={monthSplitChartData} options={monthSplitChartOptions} />

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    pointerEvents: "none",
                  }}
                >
                  <div style={{ textAlign: "center", display: "grid", gap: 4, minWidth: 0 }}>
                    <div style={{ ...subtleText, fontSize: 11 }}>Total do mês</div>
                    <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: -0.4 }}>{formatBRLFromCents(monthTotalCents)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 12, minWidth: 0, overflow: "hidden" }}>
              {monthSplit.map((item, index) => {
                const color = monthSplitChartColors[index];
                const percent = monthTotalCents > 0 ? (item.shouldPay / (monthTotalCents / 100)) * 100 : 0;

                return (
                  <div
                    key={item.userId}
                    style={{
                      padding: 14,
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(255,255,255,0.02)",
                      display: "grid",
                      gap: 10,
                      minWidth: 0,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                        flexWrap: "wrap",
                        minWidth: 0,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0, flex: "1 1 220px" }}>
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            minWidth: 12,
                            borderRadius: 999,
                            display: "inline-block",
                            background: color,
                            boxShadow: `0 0 0 4px ${color}22`,
                            marginTop: 4,
                            flexShrink: 0,
                          }}
                        />

                        <div style={{ display: "grid", gap: 2, minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 900,
                              minWidth: 0,
                              overflowWrap: "anywhere",
                              wordBreak: "break-word",
                            }}
                          >
                            {item.label}
                          </div>

                          <div
                            style={{
                              ...subtleText,
                              minWidth: 0,
                              overflowWrap: "anywhere",
                              wordBreak: "break-word",
                            }}
                          >
                            {splitMode === "SALARY"
                              ? `Peso ${item.weightPercent.toFixed(1)}%`
                              : `Percentual manual ${item.manualPercent.toFixed(2)}%`}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          textAlign: "right",
                          display: "grid",
                          gap: 2,
                          minWidth: 0,
                          flex: "0 1 160px",
                          justifySelf: "end",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 900,
                            fontSize: 18,
                            minWidth: 0,
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                          }}
                        >
                          {formatBRL(item.shouldPay)}
                        </div>

                        <div
                          style={{
                            ...subtleText,
                            minWidth: 0,
                            overflowWrap: "anywhere",
                            wordBreak: "break-word",
                          }}
                        >
                          {percent.toFixed(1)}% do total
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: 8,
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.06)",
                        overflow: "hidden",
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(percent, 100)}%`,
                          height: "100%",
                          borderRadius: 999,
                          background: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com
//
// Componente extraído do Groups.tsx:
// - Card da divisão do mês
// - Doughnut chart
// - Legenda lateral do gráfico
// - Barra visual de participação