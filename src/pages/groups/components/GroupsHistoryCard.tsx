import type { CSSProperties } from "react";

import type { GroupExpenseListItemDto } from "../types/groups.types";
import { formatBRLFromCents } from "../utils/groups.helpers";

type GroupsHistoryCardProps = {
  selectedGroupId: string | null;
  expensesLoading: boolean;
  expensesError: string | null;
  historyItems: GroupExpenseListItemDto[];
  deleteExpenseLoadingId: string | null;
  balancesLoading: boolean;
  onRefreshExpenses: () => void;
  onOpenEditExpense: (expense: GroupExpenseListItemDto) => void;
  onDeleteExpenseFromHistory: (expense: GroupExpenseListItemDto) => void;
  sectionCard: CSSProperties;
  panelTitle: CSSProperties;
  subtleText: CSSProperties;
  ghostButton: CSSProperties;
  dangerButtonSmall: CSSProperties;
  timelineCard: CSSProperties;
  memberAvatarStyle: CSSProperties;
};

export default function GroupsHistoryCard({
  selectedGroupId,
  expensesLoading,
  expensesError,
  historyItems,
  deleteExpenseLoadingId,
  balancesLoading,
  onRefreshExpenses,
  onOpenEditExpense,
  onDeleteExpenseFromHistory,
  sectionCard,
  panelTitle,
  subtleText,
  ghostButton: _ghostButton,
  dangerButtonSmall,
  timelineCard: _timelineCard,
  memberAvatarStyle: _memberAvatarStyle,
}: GroupsHistoryCardProps) {
  return (
    <div className="grp-card" style={sectionCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 2 }}>
          <div style={panelTitle}>Histórico</div>
          <div style={subtleText}>Últimas movimentações do grupo com ações rápidas para editar ou excluir.</div>
        </div>

        <button
          type="button"
          onClick={onRefreshExpenses}
          disabled={!selectedGroupId || expensesLoading}
          style={{
            ..._ghostButton,
            cursor: !selectedGroupId || expensesLoading ? "not-allowed" : "pointer",
            opacity: !selectedGroupId || expensesLoading ? 0.7 : 1,
          }}
        >
          {expensesLoading ? "…" : "Atualizar"}
        </button>
      </div>

      {expensesLoading && <div style={{ ...subtleText, marginTop: 12 }}>Carregando…</div>}

      {expensesError && (
        <div style={{ ...subtleText, marginTop: 12 }}>
          <strong>Falha:</strong> {expensesError}
        </div>
      )}

      {!expensesLoading && !expensesError && historyItems.length === 0 && <div style={{ ...subtleText, marginTop: 12 }}>Sem despesas ainda.</div>}

      {!expensesLoading && !expensesError && historyItems.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {historyItems.map((e) => {
            const deleting = deleteExpenseLoadingId === e.id;
            const paidByName = e.paidByName || e.paidByEmail || "Membro";

            return (
              <div key={e.id} className="grp-tx-row">
                <span className="grp-tx-ic" style={{ background: "rgba(59,130,246,.14)", color: "#60A5FA", fontSize: 18 }}>
                  💳
                </span>
                <div className="grp-tx-main">
                  <strong>{e.description}</strong>
                  <span>Pago por {paidByName} • {new Date(e.date).toLocaleDateString("pt-BR")}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div className="grp-tx-amt">{formatBRLFromCents(e.amountCents)}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => onOpenEditExpense(e)}
                      disabled={deleting}
                      className="grp-btn-ghost"
                      style={{ fontSize: 12, padding: "6px 10px" }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteExpenseFromHistory(e)}
                      disabled={deleting}
                      style={{
                        ...dangerButtonSmall,
                        padding: "6px 10px",
                        fontSize: 12,
                        cursor: deleting ? "not-allowed" : "pointer",
                        opacity: deleting ? 0.7 : 1,
                      }}
                    >
                      {deleting ? "…" : "Excluir"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={subtleText}>{balancesLoading ? "Atualizando dados do grupo…" : ""}</div>
    </div>
  );
}

// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com
//
// Componente extraído do Groups.tsx:
// - Card Histórico
// - Lista das últimas despesas
// - Botão editar
// - Botão excluir
// - Atualização da lista