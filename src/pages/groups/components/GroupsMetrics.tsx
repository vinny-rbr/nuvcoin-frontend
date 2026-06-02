import { useEffect, useState, type CSSProperties } from "react";

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

type GroupsMetricsProps = {
  monthTotalCents: number;
  monthExpensesCount: number;
  membersCount: number;
  averagePerPersonCents: number;
  highestBurden: number;
  recommendedLimitPercent: number;
  monthSplit: MonthSplitItem[];
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
  monthSplit,
  subtleText,
  metricCard,
}: GroupsMetricsProps) {
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

  const valueStyle: CSSProperties = {
    fontWeight: 900,
    fontSize: "clamp(16px, 1.8vw, 24px)",
    lineHeight: 1.1,
    letterSpacing: -0.4,
    overflowWrap: "anywhere",
    minWidth: 0,
  };

  const topBurdenRows = monthSplit
    .filter((item) => item.percentOfSalary > 0)
    .slice()
    .sort((a, b) => b.percentOfSalary - a.percentOfSalary)
    .slice(0, isMobile ? 3 : 4);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(142px, 1fr))", gap: 12 }}>
        <div style={{ ...metricCard("blue"), minWidth: 0 }}>
          <div style={subtleText}>Total do mes</div>
          <div style={valueStyle}>{formatBRLFromCents(monthTotalCents)}</div>
        </div>

        <div style={{ ...metricCard("green"), minWidth: 0 }}>
          <div style={subtleText}>Despesas</div>
          <div style={valueStyle}>{monthExpensesCount}</div>
        </div>

        <div style={{ ...metricCard("purple"), minWidth: 0 }}>
          <div style={subtleText}>Membros</div>
          <div style={valueStyle}>{membersCount}</div>
        </div>

        <div style={{ ...metricCard(highestBurden > recommendedLimitPercent ? "red" : "blue"), minWidth: 0 }}>
          <div style={subtleText}>Media por pessoa</div>
          <div style={valueStyle}>{formatBRLFromCents(averagePerPersonCents)}</div>
        </div>
      </div>

      <div
        style={{
          padding: isMobile ? 14 : 16,
          borderRadius: 20,
          border: "1px solid rgba(148,163,184,0.12)",
          background:
            "radial-gradient(circle at 0% 0%, rgba(20,184,166,0.12) 0%, rgba(20,184,166,0) 42%), rgba(255,255,255,0.025)",
          display: "grid",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "grid", gap: 3 }}>
            <div style={{ fontWeight: 900, fontSize: isMobile ? 16 : 18 }}>Comprometimento de renda</div>
            <div style={subtleText}>Quanto a divisao pesa para cada pessoa.</div>
          </div>
          <div
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.14)",
              background: "rgba(15,23,42,0.44)",
              color: "#dbeafe",
              fontWeight: 900,
              fontSize: 12,
            }}
          >
            meta ate {recommendedLimitPercent}%
          </div>
        </div>

        {topBurdenRows.length === 0 ? (
          <div style={subtleText}>Defina salarios e lance despesas para acompanhar esse indicador.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {topBurdenRows.map((item, index) => {
              const overLimit = item.percentOfSalary > recommendedLimitPercent;
              const color = overLimit ? "#f87171" : ["#60a5fa", "#22c55e", "#a78bfa", "#f59e0b"][index % 4];

              return (
                <div key={item.userId} style={{ display: "grid", gap: 6 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 900,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.label}
                    </div>
                    <div style={{ color, fontWeight: 900, whiteSpace: "nowrap" }}>
                      {item.percentOfSalary.toFixed(0)}%
                    </div>
                  </div>

                  <div
                    style={{
                      height: 7,
                      borderRadius: 999,
                      background: "rgba(255,255,255,0.06)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(item.percentOfSalary, 100)}%`,
                        height: "100%",
                        borderRadius: 999,
                        background: color,
                      }}
                    />
                  </div>

                  <div style={{ ...subtleText, fontSize: 11 }}>
                    Deve pagar {formatBRL(item.shouldPay)} sobre salario informado.
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
