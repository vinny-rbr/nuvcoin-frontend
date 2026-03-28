import type { CSSProperties } from "react";

import type { GroupSplitMode } from "../types/groups.types";

type GroupsHeaderActionExpenseContentProps = {
  splitMode: GroupSplitMode;
  salaryTotal: number;
  isManualConfigValid: boolean;
  subtleText: CSSProperties;
  primaryButton: CSSProperties;
  ghostButton: CSSProperties;
  onOpenHouseExpenseFlow: () => void;
  onOpenQuickExpenseFlow: () => void;
};

export default function GroupsHeaderActionExpenseContent({
  splitMode,
  salaryTotal,
  isManualConfigValid,
  subtleText,
  primaryButton,
  ghostButton,
  onOpenHouseExpenseFlow,
  onOpenQuickExpenseFlow,
}: GroupsHeaderActionExpenseContentProps) {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>Lancar nova despesa</div>
        <div style={subtleText}>
          Escolha qual fluxo voce quer abrir. O cadastro continua no mesmo modal que voce ja aprovou.
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={onOpenHouseExpenseFlow} style={primaryButton}>
          Conta do mes
        </button>

        <button type="button" onClick={onOpenQuickExpenseFlow} style={ghostButton}>
          Despesa avulsa
        </button>
      </div>

      {splitMode === "SALARY" && salaryTotal <= 0 && (
        <div style={subtleText}>Dica: defina salarios primeiro para o resumo do mes ficar mais preciso.</div>
      )}

      {splitMode === "MANUAL" && !isManualConfigValid && (
        <div style={subtleText}>Dica: ajuste os percentuais manuais para 100% antes de conferir o resumo.</div>
      )}
    </div>
  );
}
