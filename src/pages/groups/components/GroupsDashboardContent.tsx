import type { CSSProperties } from "react";
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
  return (
    <div style={getClockEntryStyle(3)}>
      <div
        style={{
          display: "grid",
          gap: 18,
          opacity: isSwitchingGroup ? 0 : 1,
          transform: isSwitchingGroup ? "translateY(6px)" : "translateY(0px)",
          transition: "opacity 0.25s ease, transform 0.25s ease",
        }}
      >
        <div style={sectionCard}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 900, fontSize: 26, letterSpacing: -0.5 }}>
                  {selectedGroupName ?? "Selecione um grupo"}
                </div>

                {selectedGroupId && (
                  <div style={pillStyle}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: "#3ddc84",
                        display: "inline-block",
                      }}
                    />
                    Grupo ativo
                  </div>
                )}
              </div>

              {selectedGroupId ? (
                <div style={{ ...subtleText, fontSize: 13 }}>
                  {membersCount} pessoa(s) {"\u2022"} m\u00eas atual {currentMonthKey} {"\u2022"} modo{" "}
                  {splitMode === "SALARY" ? "autom\u00e1tico por sal\u00e1rio" : "manual por percentual"}
                </div>
              ) : (
                <div style={{ ...subtleText, fontSize: 13 }}>
                  {groupsCount === 0
                    ? 'Crie seu primeiro grupo no bot\u00e3o do topo para come\u00e7ar.'
                    : "Escolha um grupo na barra superior para abrir o dashboard."}
                </div>
              )}
            </div>

            {selectedGroupId && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={onDeleteGroup}
                  disabled={deletingGroupId === selectedGroupId}
                  style={{
                    ...dangerButtonSmall,
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
            <div style={getClockEntryStyle(4)}>
              <GroupsMetrics
                monthTotalCents={monthTotalCents}
                monthExpensesCount={monthExpensesCount}
                membersCount={membersCount}
                averagePerPersonCents={averagePerPersonCents}
                highestBurden={highestBurden}
                recommendedLimitPercent={recommendedLimitPercent}
                subtleText={subtleText}
                metricCard={metricCard}
              />
            </div>

            <div style={getClockEntryStyle(5)}>
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

            <div style={getClockEntryStyle(6)}>
              <div style={sectionCard}>
                <div style={{ display: "grid", gap: 14 }}>
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={panelTitle}>Dashboard</div>
                    <div style={subtleText}>
                      Os atalhos de pessoas, base, despesas, resumo e hist\u00f3rico agora ficam no topo em formato quadrado.
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
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
