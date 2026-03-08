import type { CSSProperties } from "react";

import type { GroupSplitMode } from "../types/groups.types";

type GroupsExpensesModalProps = {
  open: boolean;
  selectedGroupId: string | null;
  selectedGroupName: string | null;
  splitMode: GroupSplitMode;
  expensesTab: "HOUSE" | "QUICK";

  houseName: string;
  houseAmountBRL: string;
  houseDate: string;
  houseLoading: boolean;
  houseError: string | null;
  houseSuccess: string | null;

  quickDesc: string;
  quickAmountBRL: string;
  quickDate: string;
  quickLoading: boolean;
  quickError: string | null;
  quickSuccess: string | null;

  onClose: () => void;
  onChangeTab: (tab: "HOUSE" | "QUICK") => void;

  onHouseNameChange: (value: string) => void;
  onHouseAmountChange: (value: string) => void;
  onHouseDateChange: (value: string) => void;
  onHouseAmountFocus: () => void;
  onHouseAmountBlur: () => void;
  onCreateHouseExpense: () => void;

  onQuickDescChange: (value: string) => void;
  onQuickAmountChange: (value: string) => void;
  onQuickDateChange: (value: string) => void;
  onQuickAmountFocus: () => void;
  onQuickAmountBlur: () => void;
  onCreateQuickExpense: () => void;

  modalOverlay: CSSProperties;
  modalCard: CSSProperties;
  modalHeader: CSSProperties;
  modalBody: CSSProperties;
  subtleText: CSSProperties;
  inputStyle: CSSProperties;
  softButton: CSSProperties;
  primaryButton: CSSProperties;
  tabButton: (active: boolean) => CSSProperties;
};

export default function GroupsExpensesModal({
  open,
  selectedGroupId,
  selectedGroupName,
  splitMode,
  expensesTab,
  houseName,
  houseAmountBRL,
  houseDate,
  houseLoading,
  houseError,
  houseSuccess,
  quickDesc,
  quickAmountBRL,
  quickDate,
  quickLoading,
  quickError,
  quickSuccess,
  onClose,
  onChangeTab,
  onHouseNameChange,
  onHouseAmountChange,
  onHouseDateChange,
  onHouseAmountFocus,
  onHouseAmountBlur,
  onCreateHouseExpense,
  onQuickDescChange,
  onQuickAmountChange,
  onQuickDateChange,
  onQuickAmountFocus,
  onQuickAmountBlur,
  onCreateQuickExpense,
  modalOverlay,
  modalCard,
  modalHeader,
  modalBody,
  subtleText,
  inputStyle,
  softButton,
  primaryButton,
  tabButton,
}: GroupsExpensesModalProps) {
  if (!open || !selectedGroupId) return null;

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
            <div style={{ fontWeight: 900, fontSize: 18 }}>Adicionar despesas</div>
            <div style={subtleText}>
              Grupo: {selectedGroupName ?? ""} • Modo atual: {splitMode === "SALARY" ? "Automático por salário" : "Manual por percentual"}
            </div>
          </div>

          <button type="button" onClick={onClose} style={softButton}>
            Fechar
          </button>
        </div>

        <div style={modalBody}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={() => onChangeTab("HOUSE")} style={tabButton(expensesTab === "HOUSE")}>
              Conta do mês
            </button>
            <button type="button" onClick={() => onChangeTab("QUICK")} style={tabButton(expensesTab === "QUICK")}>
              Despesa avulsa
            </button>
          </div>

          {expensesTab === "HOUSE" && (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontWeight: 900 }}>Conta do mês</div>
                <div style={subtleText}>
                  Ex: aluguel, internet, luz. (Divisão atual: {splitMode === "SALARY" ? "automática pelo salário" : "manual por percentual"}.)
                </div>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontWeight: 800, opacity: 0.95 }}>Nome</div>
                <input value={houseName} onChange={(e) => onHouseNameChange(e.target.value)} placeholder="Ex: Aluguel" style={inputStyle} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 800, opacity: 0.95 }}>Valor</div>
                  <input
                    value={houseAmountBRL}
                    onChange={(e) => onHouseAmountChange(e.target.value)}
                    onFocus={onHouseAmountFocus}
                    onBlur={onHouseAmountBlur}
                    placeholder="0,00"
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 800, opacity: 0.95 }}>Data</div>
                  <input type="date" value={houseDate} onChange={(e) => onHouseDateChange(e.target.value)} style={inputStyle} />
                </div>
              </div>

              {houseError && (
                <div style={subtleText}>
                  <strong>Falha:</strong> {houseError}
                </div>
              )}

              {houseSuccess && <div style={subtleText}>✅ {houseSuccess}</div>}

              <button
                type="button"
                onClick={onCreateHouseExpense}
                disabled={houseLoading}
                style={{
                  ...primaryButton,
                  cursor: houseLoading ? "not-allowed" : "pointer",
                  opacity: houseLoading ? 0.7 : 1,
                }}
              >
                {houseLoading ? "Gerando…" : "Gerar conta do mês"}
              </button>
            </div>
          )}

          {expensesTab === "QUICK" && (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontWeight: 900 }}>Despesa avulsa</div>
                <div style={subtleText}>
                  Ex: mercado, pizza, compras. (Divisão atual: {splitMode === "SALARY" ? "automática pelo salário" : "manual por percentual"}.)
                </div>
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontWeight: 800, opacity: 0.95 }}>Descrição</div>
                <input value={quickDesc} onChange={(e) => onQuickDescChange(e.target.value)} placeholder="Ex: Mercado" style={inputStyle} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 800, opacity: 0.95 }}>Valor</div>
                  <input
                    value={quickAmountBRL}
                    onChange={(e) => onQuickAmountChange(e.target.value)}
                    onFocus={onQuickAmountFocus}
                    onBlur={onQuickAmountBlur}
                    placeholder="0,00"
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 800, opacity: 0.95 }}>Data</div>
                  <input type="date" value={quickDate} onChange={(e) => onQuickDateChange(e.target.value)} style={inputStyle} />
                </div>
              </div>

              {quickError && (
                <div style={subtleText}>
                  <strong>Falha:</strong> {quickError}
                </div>
              )}

              {quickSuccess && <div style={subtleText}>✅ {quickSuccess}</div>}

              <button
                type="button"
                onClick={onCreateQuickExpense}
                disabled={quickLoading}
                style={{
                  ...primaryButton,
                  cursor: quickLoading ? "not-allowed" : "pointer",
                  opacity: quickLoading ? 0.7 : 1,
                }}
              >
                {quickLoading ? "Salvando…" : "Salvar despesa"}
              </button>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 4 }}>
            <div style={subtleText}>Você pode fechar e continuar quando quiser.</div>

            <button type="button" onClick={onClose} style={softButton}>
              Concluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}