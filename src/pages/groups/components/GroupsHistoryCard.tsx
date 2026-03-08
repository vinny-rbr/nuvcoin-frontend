import type { CSSProperties } from "react";

import type { GroupExpenseListItemDto } from "../types/groups.types";
import { formatBRLFromCents, monthKeyFromISO } from "../utils/groups.helpers";

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
  ghostButton,
  dangerButtonSmall,
  timelineCard,
  memberAvatarStyle,
}: GroupsHistoryCardProps) {
  return (
    <div style={sectionCard}>
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
            ...ghostButton,
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
        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          {historyItems.map((e) => {
            const deleting = deleteExpenseLoadingId === e.id;

            return (
              <div key={e.id} style={timelineCard}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", minWidth: 0 }}>
                    <div style={memberAvatarStyle}>R$</div>

                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontWeight: 900, fontSize: 17 }}>{e.description}</div>
                      <div style={{ ...subtleText, display: "flex", gap: 12, flexWrap: "wrap" }}>
                        <span>{new Date(e.date).toLocaleDateString("pt-BR")}</span>
                        <span>Mês: {monthKeyFromISO(e.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>{formatBRLFromCents(e.amountCents)}</div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => onOpenEditExpense(e)}
                        disabled={deleting}
                        style={{
                          ...ghostButton,
                          padding: "8px 10px",
                          cursor: deleting ? "not-allowed" : "pointer",
                          opacity: deleting ? 0.6 : 1,
                        }}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteExpenseFromHistory(e)}
                        disabled={deleting}
                        style={{
                          ...dangerButtonSmall,
                          padding: "8px 10px",
                          cursor: deleting ? "not-allowed" : "pointer",
                          opacity: deleting ? 0.7 : 1,
                        }}
                      >
                        {deleting ? "Excluindo…" : "Excluir"}
                      </button>
                    </div>
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