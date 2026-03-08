import type { CSSProperties } from "react";

import { formatBRL, getInitials, safeName } from "../utils/groups.helpers";
import type { GroupBalancesResponse } from "../types/groups.types";

type GroupsBaseCardProps = {
  balances: GroupBalancesResponse | null;
  splitMode: "SALARY" | "MANUAL";
  salaryFilledCount: number;
  salaryTotal: number;
  manualPercentTotal: number;
  isManualConfigValid: boolean;
  salaryByUserId: Record<string, number>;
  salaryWeights: Record<string, number>;
  manualPercentNumberByUserId: Record<string, number>;
  selectedGroupId: string | null;
  onOpenBaseModal: () => void;
  sectionCard: CSSProperties;
  panelTitle: CSSProperties;
  subtleText: CSSProperties;
  softButton: CSSProperties;
  memberAvatarStyle: CSSProperties;
};

export default function GroupsBaseCard({
  balances,
  splitMode,
  salaryFilledCount,
  salaryTotal,
  manualPercentTotal,
  isManualConfigValid,
  salaryByUserId,
  salaryWeights,
  manualPercentNumberByUserId,
  selectedGroupId,
  onOpenBaseModal,
  sectionCard,
  panelTitle,
  subtleText,
  softButton,
  memberAvatarStyle,
}: GroupsBaseCardProps) {
  const members = balances?.members ?? [];

  return (
    <div style={sectionCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 2 }}>
          <div style={panelTitle}>Base do grupo</div>
          <div style={subtleText}>
            {splitMode === "SALARY"
              ? `${salaryFilledCount}/${members.length} salários preenchidos. A divisão do mês usa isso.`
              : `Percentual manual total: ${manualPercentTotal.toFixed(2)}%. A soma precisa fechar 100%.`}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenBaseModal}
          disabled={!selectedGroupId || members.length === 0}
          style={{
            ...softButton,
            cursor: !selectedGroupId || members.length === 0 ? "not-allowed" : "pointer",
            opacity: !selectedGroupId || members.length === 0 ? 0.7 : 1,
          }}
        >
          Definir base
        </button>
      </div>

      {splitMode === "SALARY" && salaryTotal <= 0 && <div style={{ ...subtleText, marginTop: 12 }}>⚠️ Defina salários para o sistema calcular quanto cada um paga no mês.</div>}

      {splitMode === "MANUAL" && !isManualConfigValid && (
        <div style={{ ...subtleText, marginTop: 12 }}>⚠️ Ajuste os percentuais para a soma fechar exatamente em 100%.</div>
      )}

      {((splitMode === "SALARY" && salaryTotal > 0) || (splitMode === "MANUAL" && members.length > 0)) && (
        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          {members.map((m) => {
            const salary = Number(salaryByUserId[m.userId] ?? 0) || 0;
            const salaryWeight = (Number(salaryWeights[m.userId] ?? 0) || 0) * 100;
            const manualPercent = Number(manualPercentNumberByUserId[m.userId] ?? 0) || 0;
            const label = safeName(m.name, m.email, m.userId);

            return (
              <div
                key={m.userId}
                style={{
                  padding: 14,
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={memberAvatarStyle}>{getInitials(label)}</div>

                  <div style={{ display: "grid", gap: 2 }}>
                    <div style={{ fontWeight: 900 }}>{label}</div>

                    {splitMode === "SALARY" ? (
                      <div style={subtleText}>Salário: {salary > 0 ? formatBRL(salary) : "—"}</div>
                    ) : (
                      <div style={subtleText}>Percentual manual configurado</div>
                    )}
                  </div>
                </div>

                {splitMode === "SALARY" ? (
                  <div style={{ fontWeight: 900, opacity: 0.9 }}>Peso {salaryWeight.toFixed(0)}%</div>
                ) : (
                  <div style={{ fontWeight: 900, opacity: 0.9 }}>{manualPercent.toFixed(2)}%</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com
//
// Componente extraído do Groups.tsx:
// - Card Base do grupo
// - Lista de salários / percentuais
// - Estado visual do modo SALARY / MANUAL
// - Botão para abrir modal da base