import type { CSSProperties } from "react";

import { formatBRL } from "../utils/groups.helpers";

type MonthSplitItem = {
  userId: string;
  label: string;
  salary: number;
  weightPercent: number;
  shouldPay: number;
  percentOfSalary: number;
  manualPercent: number;
};

type GroupsMonthSummaryProps = {
  selectedGroupId: string | null;
  splitMode: "SALARY" | "MANUAL";
  currentMonthKey: string;
  salaryTotal: number;
  isManualConfigValid: boolean;
  canCalculateMonthSplit: boolean;
  monthTotalCents: number;
  monthSplit: MonthSplitItem[];
  expensesLoading: boolean;
  onRefreshExpenses: () => void;
  recommendedLimitPercent: number;
  sectionCard: CSSProperties;
  panelTitle: CSSProperties;
  subtleText: CSSProperties;
  ghostButton: CSSProperties;
};

export default function GroupsMonthSummary({
  selectedGroupId,
  splitMode,
  currentMonthKey,
  salaryTotal,
  isManualConfigValid,
  canCalculateMonthSplit,
  monthTotalCents,
  monthSplit,
  expensesLoading,
  onRefreshExpenses,
  recommendedLimitPercent,
  sectionCard,
  panelTitle,
  subtleText,
  ghostButton,
}: GroupsMonthSummaryProps) {
  return (
    <div style={sectionCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 2 }}>
          <div style={panelTitle}>Resumo do mês</div>
          <div style={subtleText}>
            Mês atual (UTC): {currentMonthKey} • Modo: {splitMode === "SALARY" ? "Automático por salário" : "Manual por percentual"}
          </div>
        </div>

        <button
          type="button"
          onClick={onRefreshExpenses}
          disabled={!selectedGroupId || expensesLoading}
          style={{
            ...ghostButton,
            cursor: !selectedGroupId || expensesLoading ? "not-allowed" : "pointer",
            opacity: !selectedGroupId || expensesLoading ? 0.7 : 1,
          }}
        >
          {expensesLoading ? "…" : "Atualizar"}
        </button>
      </div>

      {splitMode === "SALARY" && salaryTotal <= 0 && (
        <div style={{ ...subtleText, marginTop: 12 }}>
          ⚠️ Para calcular “quanto cada um paga”, defina salários em <strong>Base do grupo</strong>.
        </div>
      )}

      {splitMode === "MANUAL" && !isManualConfigValid && (
        <div style={{ ...subtleText, marginTop: 12 }}>
          ⚠️ Para calcular “quanto cada um paga”, ajuste o modo <strong>Manual por percentual</strong> para somar 100%.
        </div>
      )}

      {canCalculateMonthSplit && monthTotalCents > 0 && (
        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          {monthSplit.map((r) => {
            const warn = r.salary > 0 ? r.percentOfSalary > recommendedLimitPercent : false;

            return (
              <div
                key={r.userId}
                style={{
                  padding: 14,
                  borderRadius: 18,
                  border: warn ? "1px solid rgba(255,140,140,0.28)" : "1px solid rgba(255,255,255,0.08)",
                  background: warn
                    ? "linear-gradient(180deg, rgba(255,70,70,0.08) 0%, rgba(255,255,255,0.02) 100%)"
                    : "rgba(255,255,255,0.02)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "grid", gap: 3 }}>
                  <div style={{ fontWeight: 900 }}>{r.label}</div>
                  <div style={subtleText}>
                    {splitMode === "SALARY"
                      ? `Peso: ${r.weightPercent.toFixed(0)}% • Salário: ${r.salary > 0 ? formatBRL(r.salary) : "—"}`
                      : `Percentual manual: ${r.manualPercent.toFixed(2)}% • Salário: ${r.salary > 0 ? formatBRL(r.salary) : "—"}`}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 3, textAlign: "right" }}>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{formatBRL(r.shouldPay)}</div>
                  <div style={{ ...subtleText, opacity: 0.92 }}>
                    {r.salary > 0 ? `${r.percentOfSalary.toFixed(1)}% do salário` : "Salário não informado"}
                    {warn ? ` • ⚠ acima de ${recommendedLimitPercent}%` : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {canCalculateMonthSplit && monthTotalCents === 0 && <div style={{ ...subtleText, marginTop: 12 }}>Sem despesas no mês atual ainda.</div>}
    </div>
  );
}

// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com
//
// Componente extraído do Groups.tsx:
// - Card Resumo do mês
// - Lista de quanto cada pessoa paga
// - Aviso de peso no salário
// - Atualização das despesas