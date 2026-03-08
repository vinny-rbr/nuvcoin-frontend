import type { CSSProperties } from "react";

import type { GroupBalancesResponse, GroupSplitMode } from "../types/groups.types";

type GroupsBaseModalProps = {
  open: boolean;
  selectedGroupId: string | null;
  balances: GroupBalancesResponse | null;
  splitMode: GroupSplitMode;
  salaryByUserId: Record<string, number>;
  manualPercentInputByUserId: Record<string, string>;
  manualPercentTotal: number;
  recommendedLimitPercent: number;
  onClose: () => void;
  onSplitModeChange: (mode: GroupSplitMode) => void;
  onSalaryChange: (userId: string, value: string) => void;
  onSalaryBlur: (userId: string) => void;
  onManualPercentChange: (userId: string, value: string) => void;
  onManualPercentBlur: (userId: string) => void;
  onResetSalaries: () => void;
  onSplitEqual: () => void;
  onSave: () => void;
  safeName: (name?: string | null, email?: string | null, fallbackId?: string | null) => string;
  salaryError: string | null;
  salarySuccess: string | null;
  modalOverlay: CSSProperties;
  modalCard: CSSProperties;
  modalHeader: CSSProperties;
  modalBody: CSSProperties;
  subtleText: CSSProperties;
  inputStyle: CSSProperties;
  softButton: CSSProperties;
  ghostButton: CSSProperties;
  tabButton: (active: boolean) => CSSProperties;
};

export default function GroupsBaseModal({
  open,
  selectedGroupId,
  balances,
  splitMode,
  salaryByUserId,
  manualPercentInputByUserId,
  manualPercentTotal,
  recommendedLimitPercent,
  onClose,
  onSplitModeChange,
  onSalaryChange,
  onSalaryBlur,
  onManualPercentChange,
  onManualPercentBlur,
  onResetSalaries,
  onSplitEqual,
  onSave,
  safeName,
  salaryError,
  salarySuccess,
  modalOverlay,
  modalCard,
  modalHeader,
  modalBody,
  subtleText,
  inputStyle,
  softButton,
  ghostButton,
  tabButton,
}: GroupsBaseModalProps) {
  if (!open || !selectedGroupId) return null;

  const members = balances?.members ?? [];
  const manualIsValid = Math.abs(manualPercentTotal - 100) < 0.01;

  return (
    <div
      style={modalOverlay}
      onClick={() => {
        onClose();
      }}
    >
      <div
        style={modalCard}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div style={modalHeader}>
          <div style={{ display: "grid", gap: 2 }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Base do grupo</div>
            <div style={subtleText}>Escolha entre divisão automática por salário ou manual por percentual.</div>
          </div>

          <button type="button" onClick={onClose} style={softButton}>
            Fechar
          </button>
        </div>

        <div style={modalBody}>
          {salaryError && (
            <div style={subtleText}>
              <strong>Falha:</strong> {salaryError}
            </div>
          )}

          {salarySuccess && <div style={subtleText}>✅ {salarySuccess}</div>}

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 900 }}>Modo de divisão</div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={() => onSplitModeChange("SALARY")} style={tabButton(splitMode === "SALARY")}>
                Automático por salário
              </button>

              <button type="button" onClick={() => onSplitModeChange("MANUAL")} style={tabButton(splitMode === "MANUAL")}>
                Manual por percentual
              </button>
            </div>

            <div style={subtleText}>
              {splitMode === "SALARY"
                ? "Cada pessoa informa o salário e o sistema calcula o peso automaticamente."
                : "Você define exatamente quanto % cada pessoa paga. A soma precisa fechar 100%."}
            </div>
          </div>

          {splitMode === "SALARY" && (
            <div style={{ display: "grid", gap: 10 }}>
              {members.map((m) => {
                const label = safeName(m.name, m.email, m.userId);
                const current = Number(salaryByUserId[m.userId] ?? 0) || 0;

                return (
                  <div
                    key={m.userId}
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.02)",
                      display: "grid",
                      gridTemplateColumns: "1fr 220px",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "grid", gap: 2 }}>
                      <div style={{ fontWeight: 900 }}>{label}</div>
                      <div style={subtleText}>Peso na divisão é proporcional ao salário.</div>
                    </div>

                    <input
                      value={current ? String(current).replace(".", ",") : ""}
                      onChange={(e) => onSalaryChange(m.userId, e.target.value)}
                      onBlur={() => onSalaryBlur(m.userId)}
                      placeholder="Salário (ex: 2500,00)"
                      style={inputStyle}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {splitMode === "MANUAL" && (
            <div style={{ display: "grid", gap: 10 }}>
              {members.map((m) => {
                const label = safeName(m.name, m.email, m.userId);
                const currentText = manualPercentInputByUserId[m.userId] ?? "";

                return (
                  <div
                    key={m.userId}
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.02)",
                      display: "grid",
                      gridTemplateColumns: "1fr 220px",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "grid", gap: 2 }}>
                      <div style={{ fontWeight: 900 }}>{label}</div>
                      <div style={subtleText}>Exemplo: 60,00 para 60%.</div>
                    </div>

                    <input
                      value={currentText}
                      onChange={(e) => onManualPercentChange(m.userId, e.target.value)}
                      onBlur={() => onManualPercentBlur(m.userId)}
                      placeholder="Percentual (ex: 50,00)"
                      style={inputStyle}
                    />
                  </div>
                );
              })}

              <div
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: manualIsValid ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(255,140,140,0.35)",
                  background: manualIsValid ? "rgba(255,255,255,0.02)" : "rgba(255,0,0,0.05)",
                }}
              >
                <div style={{ fontWeight: 900 }}>Total manual: {manualPercentTotal.toFixed(2)}%</div>
                <div style={subtleText}>{manualIsValid ? "Perfeito. A soma fechou em 100%." : "Ajuste os percentuais até fechar 100%."}</div>
              </div>
            </div>
          )}

          <div style={{ ...subtleText, marginTop: 4 }}>
            Limite recomendado: <strong>{recommendedLimitPercent}%</strong> do salário (apenas aviso no resumo).
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={onResetSalaries} style={ghostButton}>
                Zerar salários
              </button>

              <button type="button" onClick={onSplitEqual} style={ghostButton}>
                Repartir % igual
              </button>
            </div>

            <button type="button" onClick={onSave} style={softButton}>
              Salvar
            </button>
          </div>

          <div style={{ ...subtleText, marginTop: 2 }}>Você pode fechar e ajustar depois. O resumo do mês usa a última base salva.</div>
        </div>
      </div>
    </div>
  );
}