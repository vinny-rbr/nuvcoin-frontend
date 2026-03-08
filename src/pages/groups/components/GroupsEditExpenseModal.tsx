import type { CSSProperties } from "react";

import type { GroupExpenseListItemDto } from "../types/groups.types";

type GroupsEditExpenseModalProps = {
  open: boolean;
  selectedGroupId: string | null;
  editingExpense: GroupExpenseListItemDto | null;
  editDesc: string;
  editAmountBRL: string;
  editDate: string;
  editLoading: boolean;
  editError: string | null;
  editSuccess: string | null;
  onClose: () => void;
  onEditDescChange: (value: string) => void;
  onEditAmountChange: (value: string) => void;
  onEditDateChange: (value: string) => void;
  onEditAmountFocus: () => void;
  onEditAmountBlur: () => void;
  onSave: () => void;
  modalOverlay: CSSProperties;
  modalCard: CSSProperties;
  modalHeader: CSSProperties;
  modalBody: CSSProperties;
  subtleText: CSSProperties;
  inputStyle: CSSProperties;
  softButton: CSSProperties;
  ghostButton: CSSProperties;
};

export default function GroupsEditExpenseModal({
  open,
  selectedGroupId,
  editingExpense,
  editDesc,
  editAmountBRL,
  editDate,
  editLoading,
  editError,
  editSuccess,
  onClose,
  onEditDescChange,
  onEditAmountChange,
  onEditDateChange,
  onEditAmountFocus,
  onEditAmountBlur,
  onSave,
  modalOverlay,
  modalCard,
  modalHeader,
  modalBody,
  subtleText,
  inputStyle,
  softButton,
  ghostButton,
}: GroupsEditExpenseModalProps) {
  if (!open || !selectedGroupId || !editingExpense) return null;

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
            <div style={{ fontWeight: 900, fontSize: 18 }}>Editar despesa</div>
            <div style={subtleText}>Ajuste descrição, valor e data.</div>
          </div>

          <button type="button" onClick={onClose} style={softButton}>
            Fechar
          </button>
        </div>

        <div style={modalBody}>
          {editError && (
            <div style={subtleText}>
              <strong>Falha:</strong> {editError}
            </div>
          )}

          {editSuccess && <div style={subtleText}>✅ {editSuccess}</div>}

          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 800, opacity: 0.95 }}>Descrição</div>
            <input value={editDesc} onChange={(e) => onEditDescChange(e.target.value)} placeholder="Ex: Mercado" style={inputStyle} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800, opacity: 0.95 }}>Valor</div>
              <input
                value={editAmountBRL}
                onChange={(e) => onEditAmountChange(e.target.value)}
                onFocus={onEditAmountFocus}
                onBlur={onEditAmountBlur}
                placeholder="0,00"
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800, opacity: 0.95 }}>Data</div>
              <input type="date" value={editDate} onChange={(e) => onEditDateChange(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={editLoading}
              style={{
                ...ghostButton,
                cursor: editLoading ? "not-allowed" : "pointer",
                opacity: editLoading ? 0.7 : 1,
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onSave}
              disabled={editLoading}
              style={{
                ...softButton,
                cursor: editLoading ? "not-allowed" : "pointer",
                opacity: editLoading ? 0.7 : 1,
              }}
            >
              {editLoading ? "Salvando…" : "Salvar alterações"}
            </button>
          </div>

          <div style={subtleText}>Obs: manteremos “Quem pagou” igual ao original (requisito do backend).</div>
        </div>
      </div>
    </div>
  );
}