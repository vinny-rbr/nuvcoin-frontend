import { useEffect, useState, type CSSProperties } from "react";
import type { ChartOptions } from "chart.js";

import GroupsDivisionChart from "./GroupsDivisionChart";
import GroupsMetrics from "./GroupsMetrics";

type MonthSplitItem = {
  userId: string;
  label: string;
  salary: number;
  weightPercent: number;
  shouldPay: number;
  percentOfSalary: number;
  manualPercent: number;
};

type GroupsDashboardContentProps = {
  selectedGroupId: string | null;
  selectedGroupName: string | null;
  groupsCount: number;
  isSwitchingGroup: boolean;
  membersCount: number;
  currentMonthKey: string;
  splitMode: "SALARY" | "MANUAL";
  deletingGroupId?: string | null;
  monthTotalCents: number;
  monthExpensesCount: number;
  averagePerPersonCents: number;
  highestBurden: number;
  recommendedLimitPercent: number;
  canCalculateMonthSplit: boolean;
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
  historyItemsCount: number;
  onDeleteGroup: () => void;
  getClockEntryStyle: (order: number) => CSSProperties;
  sectionCard: CSSProperties;
  panelTitle: CSSProperties;
  subtleText: CSSProperties;
  pillStyle: CSSProperties;
  dangerButtonSmall: CSSProperties;
  metricCard: (accent?: "blue" | "green" | "red" | "purple") => CSSProperties;
};

export default function GroupsDashboardContent({
  selectedGroupId,
  selectedGroupName,
  groupsCount,
  isSwitchingGroup,
  membersCount,
  currentMonthKey,
  splitMode,
  deletingGroupId,
  monthTotalCents,
  monthExpensesCount,
  averagePerPersonCents,
  highestBurden,
  recommendedLimitPercent,
  canCalculateMonthSplit,
  monthSplit,
  monthSplitChartColors,
  monthSplitChartData,
  monthSplitChartOptions,
  historyItemsCount,
  onDeleteGroup,
  getClockEntryStyle,
  sectionCard,
  panelTitle,
  subtleText,
  pillStyle,
  dangerButtonSmall,
  metricCard,
}: GroupsDashboardContentProps) {
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

  const metricsBlock = (
    <div style={getClockEntryStyle(isMobile ? 5 : 4)}>
      <GroupsMetrics
        monthTotalCents={monthTotalCents}
        monthExpensesCount={monthExpensesCount}
        membersCount={membersCount}
        averagePerPersonCents={averagePerPersonCents}
        highestBurden={highestBurden}
        recommendedLimitPercent={recommendedLimitPercent}
        monthSplit={monthSplit}
        subtleText={subtleText}
        metricCard={metricCard}
      />
    </div>
  );

  const chartBlock = (
    <div style={getClockEntryStyle(isMobile ? 4 : 5)}>
      <GroupsDivisionChart
        splitMode={splitMode}
        canCalculateMonthSplit={canCalculateMonthSplit}
        monthTotalCents={monthTotalCents}
        monthSplit={monthSplit}
        monthSplitChartColors={monthSplitChartColors}
        monthSplitChartData={monthSplitChartData}
        monthSplitChartOptions={monthSplitChartOptions}
        sectionCard={sectionCard}
        panelTitle={panelTitle}
        subtleText={subtleText}
      />
    </div>
  );

  return (
    <div style={getClockEntryStyle(3)}>
      <div
        style={{
          display: "grid",
          gap: isMobile ? 14 : 18,
          opacity: isSwitchingGroup ? 0 : 1,
          transform: isSwitchingGroup ? "translateY(6px)" : "translateY(0px)",
          transition: "opacity 0.25s ease, transform 0.25s ease",
        }}
      >
        <div
          style={{
            ...sectionCard,
            border: selectedGroupId
              ? "1px solid rgba(96,165,250,0.20)"
              : sectionCard.border,
            background: selectedGroupId
              ? "radial-gradient(circle at 0% 0%, rgba(91,140,255,0.16), rgba(91,140,255,0) 36%), linear-gradient(135deg, rgba(30,41,59,0.88), rgba(15,23,42,0.68))"
              : sectionCard.background,
            padding: isMobile ? 16 : sectionCard.padding,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: isMobile ? "stretch" : "flex-start",
              flexDirection: isMobile ? "column" : "row",
              gap: isMobile ? 12 : 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "grid", gap: 8, minWidth: 0 }}>
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
                Grupo ativo
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, flexWrap: "wrap" }}>
                <div
                  style={{
                    fontWeight: 900,
                    fontSize: isMobile ? 25 : 34,
                    letterSpacing: -0.5,
                    lineHeight: 1.12,
                    overflowWrap: "anywhere",
                  }}
                >
                  {selectedGroupName ?? "Selecione um grupo"}
                </div>

                {selectedGroupId && (
                  <div
                    style={{
                      ...pillStyle,
                      color: "#bbf7d0",
                      border: "1px solid rgba(34,197,94,0.20)",
                      background: "rgba(22,101,52,0.18)",
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: "#3ddc84",
                        display: "inline-block",
                      }}
                    />
                    Compartilhado
                  </div>
                )}
              </div>

              {selectedGroupId ? (
                <div style={{ ...subtleText, fontSize: isMobile ? 12 : 13, lineHeight: 1.45 }}>
                  {membersCount} pessoa(s) {"\u2022"} m\u00eas atual {currentMonthKey} {"\u2022"} modo{" "}
                  {splitMode === "SALARY" ? "autom\u00e1tico por sal\u00e1rio" : "manual por percentual"}
                </div>
              ) : (
                <div style={{ ...subtleText, fontSize: isMobile ? 12 : 13, lineHeight: 1.45 }}>
                  {groupsCount === 0
                    ? 'Crie seu primeiro grupo no bot\u00e3o do topo para come\u00e7ar.'
                    : "Escolha um grupo na barra superior para abrir o dashboard."}
                </div>
              )}
            </div>

            {selectedGroupId && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", width: isMobile ? "100%" : undefined }}>
                <button
                  type="button"
                  onClick={onDeleteGroup}
                  disabled={deletingGroupId === selectedGroupId}
                  style={{
                    ...dangerButtonSmall,
                    width: isMobile ? "100%" : undefined,
                    cursor: deletingGroupId === selectedGroupId ? "not-allowed" : "pointer",
                    opacity: deletingGroupId === selectedGroupId ? 0.7 : 1,
                  }}
                >
                  {deletingGroupId === selectedGroupId ? "Excluindo..." : "Excluir grupo"}
                </button>
              </div>
            )}
          </div>
        </div>

        {!selectedGroupId && (
          <div style={sectionCard}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={panelTitle}>Comece por um grupo</div>
              <div style={subtleText}>
                {groupsCount === 0
                  ? 'Use o bot\u00e3o quadrado \u201c+\u201d no topo para criar seu primeiro grupo.'
                  : "Selecione um grupo na barra superior para abrir o dashboard."}
              </div>
            </div>
          </div>
        )}

        {selectedGroupId && (
          <>
            {chartBlock}
            {metricsBlock}

            <div style={getClockEntryStyle(6)}>
              <div style={sectionCard}>
                <div style={{ display: "grid", gap: 14 }}>
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={panelTitle}>Resumo rápido</div>
                    <div style={subtleText}>
                      Informações principais do grupo selecionado para você conferir antes de lançar ou dividir despesas.
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 18,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.02)",
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: 15 }}>Grupo</div>
                      <div style={subtleText}>{selectedGroupName ?? "Sem grupo selecionado"}</div>
                    </div>

                    <div
                      style={{
                        padding: 16,
                        borderRadius: 18,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.02)",
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: 15 }}>Membros</div>
                      <div style={subtleText}>{membersCount} pessoa(s)</div>
                    </div>

                    <div
                      style={{
                        padding: 16,
                        borderRadius: 18,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.02)",
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: 15 }}>Modo</div>
                      <div style={subtleText}>
                        {splitMode === "SALARY" ? "Autom\u00e1tico por sal\u00e1rio" : "Manual por percentual"}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: 16,
                        borderRadius: 18,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.02)",
                        display: "grid",
                        gap: 6,
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: 15 }}>\u00daltimas despesas</div>
                      <div style={subtleText}>{historyItemsCount} item(ns) no hist\u00f3rico</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
