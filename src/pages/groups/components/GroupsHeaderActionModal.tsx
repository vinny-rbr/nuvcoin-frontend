import type { CSSProperties, ReactNode } from "react";

import type { GroupsHeaderActionId } from "../hooks/useGroupsModals";
import type {
  GroupBalancesResponse,
  GroupExpenseListItemDto,
  GroupMembersResponse,
  GroupSplitMode,
} from "../types/groups.types";
import GroupsHistoryCard from "./GroupsHistoryCard";
import GroupsMonthSummary from "./GroupsMonthSummary";
import GroupsPeopleCard from "./GroupsPeopleCard";

type MonthSplitItem = {
  userId: string;
  label: string;
  salary: number;
  weightPercent: number;
  shouldPay: number;
  percentOfSalary: number;
  manualPercent: number;
};

type GroupsHeaderActionModalProps = {
  activeHeaderAction: GroupsHeaderActionId | null;
  selectedGroupId: string | null;
  selectedGroupName: string | null;
  splitMode: GroupSplitMode;
  membersInfo: GroupMembersResponse | null;
  balances: GroupBalancesResponse | null;
  loadingDetails: boolean;
  removeMemberError: string | null;
  addMemberOpen: boolean;
  addMemberUserId: string;
  submittingMember: boolean;
  addMemberError: string | null;
  addMemberSuccess: string | null;
  removingMemberId: string | null;
  salaryFilledCount: number;
  membersCount: number;
  salaryTotal: number;
  manualPercentTotal: number;
  isManualConfigValid: boolean;
  currentMonthKey: string;
  canCalculateMonthSplit: boolean;
  monthTotalCents: number;
  monthSplit: MonthSplitItem[];
  historyItems: GroupExpenseListItemDto[];
  deletingExpenseId: string | null;
  recommendedLimitPercent: number;
  onClose: () => void;
  onToggleAddMember: () => void;
  onAddMemberUserIdChange: (value: string) => void;
  onAddMember: () => void;
  onRemoveMember: (memberId: string, role: string) => void;
  onOpenBaseConfigModal: () => void;
  onOpenHouseExpenseFlow: () => void;
  onOpenQuickExpenseFlow: () => void;
  onRefreshSelectedGroupData: () => void;
  onOpenEditExpense: (expense: GroupExpenseListItemDto) => void;
  onDeleteExpenseFromHistory: (expense: GroupExpenseListItemDto) => void;
  modalOverlay: CSSProperties;
  modalCard: CSSProperties;
  modalHeader: CSSProperties;
  modalBody: CSSProperties;
  sectionCard: CSSProperties;
  panelTitle: CSSProperties;
  subtleText: CSSProperties;
  softButton: CSSProperties;
  ghostButton: CSSProperties;
  primaryButton: CSSProperties;
  dangerButtonSmall: CSSProperties;
  inputStyle: CSSProperties;
  memberAvatarStyle: CSSProperties;
  timelineCard: CSSProperties;
};

function getHeaderActionModalTitle(action: GroupsHeaderActionId | null) {
  if (action === "people") return "Pessoas do grupo";
  if (action === "base") return "Base do grupo";
  if (action === "expense") return "Lancar despesa";
  if (action === "summary") return "Resumo do mes";
  if (action === "history") return "Historico";
  return "";
}

export default function GroupsHeaderActionModal({
  activeHeaderAction,
  selectedGroupId,
  selectedGroupName,
  splitMode,
  membersInfo,
  balances,
  loadingDetails,
  removeMemberError,
  addMemberOpen,
  addMemberUserId,
  submittingMember,
  addMemberError,
  addMemberSuccess,
  removingMemberId,
  salaryFilledCount,
  membersCount,
  salaryTotal,
  manualPercentTotal,
  isManualConfigValid,
  currentMonthKey,
  canCalculateMonthSplit,
  monthTotalCents,
  monthSplit,
  historyItems,
  deletingExpenseId,
  recommendedLimitPercent,
  onClose,
  onToggleAddMember,
  onAddMemberUserIdChange,
  onAddMember,
  onRemoveMember,
  onOpenBaseConfigModal,
  onOpenHouseExpenseFlow,
  onOpenQuickExpenseFlow,
  onRefreshSelectedGroupData,
  onOpenEditExpense,
  onDeleteExpenseFromHistory,
  modalOverlay,
  modalCard,
  modalHeader,
  modalBody,
  sectionCard,
  panelTitle,
  subtleText,
  softButton,
  ghostButton,
  primaryButton,
  dangerButtonSmall,
  inputStyle,
  memberAvatarStyle,
  timelineCard,
}: GroupsHeaderActionModalProps) {
  if (!activeHeaderAction || !selectedGroupId) {
    return null;
  }

  let content: ReactNode = null;

  if (activeHeaderAction === "people") {
    content = (
      <GroupsPeopleCard
        membersInfo={membersInfo}
        balances={balances}
        membersLoading={loadingDetails}
        balancesLoading={loadingDetails}
        membersError={null}
        balancesError={null}
        removeMemberError={removeMemberError}
        addMemberOpen={addMemberOpen}
        addMemberUserId={addMemberUserId}
        addMemberLoading={submittingMember}
        addMemberError={addMemberError}
        addMemberSuccess={addMemberSuccess}
        removeMemberLoadingId={removingMemberId}
        onToggleAddMember={onToggleAddMember}
        onAddMemberUserIdChange={onAddMemberUserIdChange}
        onAddMember={onAddMember}
        onRemoveMember={onRemoveMember}
        sectionCard={{
          ...sectionCard,
          background: "transparent",
          border: "none",
          boxShadow: "none",
          padding: 0,
        }}
        panelTitle={panelTitle}
        subtleText={subtleText}
        softButton={softButton}
        ghostButton={ghostButton}
        primaryButton={primaryButton}
        inputStyle={inputStyle}
        memberAvatarStyle={memberAvatarStyle}
      />
    );
  } else if (activeHeaderAction === "base") {
    content = (
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ ...subtleText, fontSize: 13 }}>
          Aqui voce ajusta salarios e percentuais do grupo sem ocupar espaco fixo no dashboard.
        </div>

        <button type="button" onClick={onOpenBaseConfigModal} style={{ ...primaryButton, width: "fit-content" }}>
          Abrir configuracao da base
        </button>

        <div
          style={{
            display: "grid",
            gap: 12,
            padding: 18,
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 16 }}>Resumo rapido da base</div>
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
        </div>
      </div>
    );
  } else if (activeHeaderAction === "expense") {
    content = (
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
          <div style={subtleText}>
            Dica: defina salarios primeiro para o resumo do mes ficar mais preciso.
          </div>
        )}

        {splitMode === "MANUAL" && !isManualConfigValid && (
          <div style={subtleText}>
            Dica: ajuste os percentuais manuais para 100% antes de conferir o resumo.
          </div>
        )}
      </div>
    );
  } else if (activeHeaderAction === "summary") {
    content = (
      <GroupsMonthSummary
        selectedGroupId={selectedGroupId}
        splitMode={splitMode}
        currentMonthKey={currentMonthKey}
        salaryTotal={salaryTotal}
        isManualConfigValid={isManualConfigValid}
        canCalculateMonthSplit={canCalculateMonthSplit}
        monthTotalCents={monthTotalCents}
        monthSplit={monthSplit}
        expensesLoading={loadingDetails}
        onRefreshExpenses={onRefreshSelectedGroupData}
        recommendedLimitPercent={recommendedLimitPercent}
        sectionCard={{
          ...sectionCard,
          background: "transparent",
          border: "none",
          boxShadow: "none",
          padding: 0,
        }}
        panelTitle={panelTitle}
        subtleText={subtleText}
        ghostButton={ghostButton}
      />
    );
  } else if (activeHeaderAction === "history") {
    content = (
      <GroupsHistoryCard
        selectedGroupId={selectedGroupId}
        expensesLoading={loadingDetails}
        expensesError={null}
        historyItems={historyItems}
        deleteExpenseLoadingId={deletingExpenseId}
        balancesLoading={loadingDetails}
        onRefreshExpenses={onRefreshSelectedGroupData}
        onOpenEditExpense={onOpenEditExpense}
        onDeleteExpenseFromHistory={onDeleteExpenseFromHistory}
        sectionCard={{
          ...sectionCard,
          background: "transparent",
          border: "none",
          boxShadow: "none",
          padding: 0,
        }}
        panelTitle={panelTitle}
        subtleText={subtleText}
        ghostButton={ghostButton}
        dangerButtonSmall={dangerButtonSmall}
        timelineCard={timelineCard}
        memberAvatarStyle={memberAvatarStyle}
      />
    );
  }

  return (
    <div
      style={{
        ...modalOverlay,
        zIndex: 1150,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...modalCard,
          width: "min(980px, 100%)",
          maxHeight: "88vh",
          overflow: "hidden",
          display: "grid",
          gridTemplateRows: "auto 1fr",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            ...modalHeader,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.3 }}>
              {getHeaderActionModalTitle(activeHeaderAction)}
            </div>
            <div style={{ ...subtleText, fontSize: 13 }}>
              {selectedGroupName} - acesso rapido pelo topo
            </div>
          </div>

          <button type="button" onClick={onClose} style={ghostButton}>
            Fechar
          </button>
        </div>

        <div
          style={{
            ...modalBody,
            overflowY: "auto",
            paddingTop: 18,
          }}
        >
          {content}
        </div>
      </div>
    </div>
  );
}
