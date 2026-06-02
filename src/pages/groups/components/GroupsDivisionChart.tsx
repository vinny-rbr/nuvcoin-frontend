import { useEffect, useState, type CSSProperties } from "react";
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
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 767px)");

    function handleMediaChange(event: MediaQueryListEvent) {
      setIsMobile(event.matches);
    }

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  const hasRenderableChart =
    canCalculateMonthSplit &&
    monthTotalCents > 0 &&
    monthSplit.length > 0 &&
    monthSplitChartData.datasets.some((dataset) => dataset.data.some((value) => Number(value) > 0));

  const modeLabel = splitMode === "SALARY" ? "Proporcional ao salario" : "Percentual manual";

  return (
    <div
      style={{
        ...sectionCard,
        padding: isMobile ? 16 : 22,
        border: "1px solid rgba(96,165,250,0.18)",
        background:
          "radial-gradient(circle at 22% 0%, rgba(91,140,255,0.15) 0%, rgba(91,140,255,0) 38%), linear-gradient(135deg, rgba(30,41,59,0.86), rgba(15,23,42,0.72))",
      }}
    >
      <div style={{ display: "grid", gap: isMobile ? 14 : 18 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            flexDirection: isMobile ? "column" : "row",
            gap: 12,
          }}
        >
          <div style={{ display: "grid", gap: 5, minWidth: 0 }}>
            <div
              style={{
                ...subtleText,
                opacity: 1,
                color: "#93c5fd",
                textTransform: "uppercase",
                letterSpacing: 1.2,
                fontWeight: 900,
              }}
            >
              Divisao compartilhada
            </div>
            <div style={{ ...panelTitle, fontSize: isMobile ? 21 : 28, letterSpacing: -0.5 }}>
              Divisao do mes
            </div>
            <div style={{ ...subtleText, fontSize: isMobile ? 12 : 13 }}>
              Quanto cada pessoa representa no total e qual peso isso tem na renda.
            </div>
          </div>

          <div
            style={{
              padding: "8px 12px",
              borderRadius: 999,
              border: "1px solid rgba(96,165,250,0.24)",
              background: "rgba(59,130,246,0.12)",
              color: "#dbeafe",
              fontWeight: 900,
              fontSize: 12,
              whiteSpace: "nowrap",
            }}
          >
            {modeLabel}
          </div>
        </div>

        {!canCalculateMonthSplit && (
          <div style={subtleText}>
            {splitMode === "SALARY"
              ? "Defina os salarios em Base do grupo para exibir o grafico de divisao."
              : "Ajuste os percentuais manuais ate fechar 100% para exibir o grafico de divisao."}
          </div>
        )}

        {canCalculateMonthSplit && monthTotalCents === 0 && (
          <div style={subtleText}>Sem despesas no mes atual ainda.</div>
        )}

        {canCalculateMonthSplit && monthTotalCents > 0 && !hasRenderableChart && (
          <div style={subtleText}>Nao ha dados suficientes de participantes para montar a divisao deste mes.</div>
        )}

        {hasRenderableChart && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "minmax(240px, 0.9fr) minmax(280px, 1.1fr)",
              gap: isMobile ? 16 : 22,
              alignItems: "center",
              minWidth: 0,
            }}
          >
            <div
              style={{
                minHeight: isMobile ? 250 : 330,
                padding: isMobile ? 14 : 18,
                borderRadius: 20,
                border: "1px solid rgba(255,255,255,0.09)",
                background:
                  "linear-gradient(180deg, rgba(91,140,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
                display: "grid",
                placeItems: "center",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: isMobile ? 220 : 270,
                  height: isMobile ? 220 : 270,
                  position: "relative",
                }}
              >
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
                    <div style={{ ...subtleText, fontSize: 11 }}>Total do mes</div>
                    <div style={{ fontWeight: 900, fontSize: isMobile ? 20 : 24, letterSpacing: -0.4 }}>
                      {formatBRLFromCents(monthTotalCents)}
                    </div>
                    <div style={{ ...subtleText, fontSize: 11 }}>{monthSplit.length} pessoa(s)</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gap: 10, minWidth: 0, overflow: "hidden" }}>
              {monthSplit.map((item, index) => {
                const color = monthSplitChartColors[index];
                const percent = monthTotalCents > 0 ? (item.shouldPay / (monthTotalCents / 100)) * 100 : 0;

                return (
                  <div
                    key={item.userId}
                    style={{
                      padding: isMobile ? 12 : 14,
                      borderRadius: 16,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background:
                        index === 0
                          ? "linear-gradient(135deg, rgba(91,140,255,0.15), rgba(255,255,255,0.03))"
                          : "rgba(255,255,255,0.025)",
                      display: "grid",
                      gap: 9,
                      minWidth: 0,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) auto",
                        alignItems: "center",
                        gap: isMobile ? 8 : 12,
                        minWidth: 0,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <span
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 11,
                            display: "grid",
                            placeItems: "center",
                            background: "rgba(15,23,42,0.58)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            fontWeight: 900,
                            fontSize: 11,
                            color: "#dbeafe",
                            flexShrink: 0,
                          }}
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            minWidth: 12,
                            borderRadius: 999,
                            display: "inline-block",
                            background: color,
                            boxShadow: `0 0 0 4px ${color}22`,
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
                          textAlign: isMobile ? "left" : "right",
                          display: "grid",
                          gap: 2,
                          minWidth: 0,
                          justifySelf: isMobile ? "start" : "end",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 900,
                            fontSize: isMobile ? 16 : 18,
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
                        height: 7,
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
