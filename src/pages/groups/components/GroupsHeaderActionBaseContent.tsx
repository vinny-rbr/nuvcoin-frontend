import type { CSSProperties } from "react";

import type { GroupSplitMode } from "../types/groups.types";
import GroupsHeaderActionQuickInfoCard from "./GroupsHeaderActionQuickInfoCard";

type GroupsHeaderActionBaseContentProps = {
  splitMode: GroupSplitMode;
  salaryFilledCount: number;
  membersCount: number;
  salaryTotal: number;
  manualPercentTotal: number;
  subtleText: CSSProperties;
  primaryButton: CSSProperties;
  onOpenBaseConfigModal: () => void;
};

export default function GroupsHeaderActionBaseContent({
  splitMode,
  salaryFilledCount,
  membersCount,
  salaryTotal,
  manualPercentTotal,
  subtleText,
  primaryButton,
  onOpenBaseConfigModal,
}: GroupsHeaderActionBaseContentProps) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ ...subtleText, fontSize: 13 }}>
        Aqui voce ajusta salarios e percentuais do grupo sem ocupar espaco fixo no dashboard.
      </div>

      <button type="button" onClick={onOpenBaseConfigModal} style={{ ...primaryButton, width: "fit-content" }}>
        Abrir configuracao da base
      </button>

      <GroupsHeaderActionQuickInfoCard title="Resumo rapido da base">
        <div style={subtleText}>
          Modo atual: {splitMode === "SALARY" ? "Automatico por salario" : "Manual por percentual"}
        </div>
        <div style={subtleText}>
          Salarios preenchidos: {salaryFilledCount}/{membersCount}
        </div>
        <div style={subtleText}>Total de salarios: {salaryTotal > 0 ? "Configurado" : "Ainda nao definido"}</div>
        {splitMode === "MANUAL" && (
          <div style={subtleText}>Percentual manual total: {manualPercentTotal.toFixed(2)}%</div>
        )}
      </GroupsHeaderActionQuickInfoCard>
    </div>
  );
}
