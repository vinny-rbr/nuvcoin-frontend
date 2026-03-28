import type { CSSProperties, ReactNode } from "react";

import type { GroupsHeaderActionId } from "../hooks/useGroupsModals";
import type {
  GroupBalancesResponse,
  GroupExpenseListItemDto,
  GroupMembersResponse,
  GroupSplitMode,
} from "../types/groups.types";
import GroupsHeaderActionBaseContent from "./GroupsHeaderActionBaseContent";
import GroupsHeaderActionExpenseContent from "./GroupsHeaderActionExpenseContent";
import GroupsHeaderActionModalShell from "./GroupsHeaderActionModalShell";
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
  addMemberEmail: string;
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
  onAddMemberEmailChange: (value: string) => void;
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

function getEmbeddedSectionCardStyle(sectionCard: CSSProperties): CSSProperties {
  return {
    ...sectionCard,
    background: "transparent",
    border: "none",
    boxShadow: "none",
    padding: 0,
  };
}

function getHeaderActionModalTitle(action: GroupsHeaderActionId | null) {
  if (action === "people") return "Pessoas do grupo";
  if (action === "base") return "Base do grupo";
  if (action === "expense") return "Lancar despesa";
  if (action === "summary") return "Resumo do mes";
  if (action === "history") return "Historico";
  return "";
}

function renderModalContent(props: GroupsHeaderActionModalProps): ReactNode {
  const embeddedSectionCard = getEmbeddedSectionCardStyle(props.sectionCard);

  switch (props.activeHeaderAction) {
    case "people":
      return (
        <GroupsPeopleCard
          membersInfo={props.membersInfo}
          balances={props.balances}
          membersLoading={props.loadingDetails}
          balancesLoading={props.loadingDetails}
          membersError={null}
          balancesError={null}
          removeMemberError={props.removeMemberError}
          addMemberOpen={props.addMemberOpen}
          addMemberEmail={props.addMemberEmail}
          addMemberLoading={props.submittingMember}
          addMemberError={props.addMemberError}
          addMemberSuccess={props.addMemberSuccess}
          removeMemberLoadingId={props.removingMemberId}
          onToggleAddMember={props.onToggleAddMember}
          onAddMemberEmailChange={props.onAddMemberEmailChange}
          onAddMember={props.onAddMember}
          onRemoveMember={props.onRemoveMember}
          sectionCard={embeddedSectionCard}
          panelTitle={props.panelTitle}
          subtleText={props.subtleText}
          softButton={props.softButton}
          ghostButton={props.ghostButton}
          primaryButton={props.primaryButton}
          inputStyle={props.inputStyle}
          memberAvatarStyle={props.memberAvatarStyle}
        />
      );
    case "base":
      return (
        <GroupsHeaderActionBaseContent
          splitMode={props.splitMode}
          salaryFilledCount={props.salaryFilledCount}
          membersCount={props.membersCount}
          salaryTotal={props.salaryTotal}
          manualPercentTotal={props.manualPercentTotal}
          subtleText={props.subtleText}
          primaryButton={props.primaryButton}
          onOpenBaseConfigModal={props.onOpenBaseConfigModal}
        />
      );
    case "expense":
      return (
        <GroupsHeaderActionExpenseContent
          splitMode={props.splitMode}
          salaryTotal={props.salaryTotal}
          isManualConfigValid={props.isManualConfigValid}
          subtleText={props.subtleText}
          primaryButton={props.primaryButton}
          ghostButton={props.ghostButton}
          onOpenHouseExpenseFlow={props.onOpenHouseExpenseFlow}
          onOpenQuickExpenseFlow={props.onOpenQuickExpenseFlow}
        />
      );
    case "summary":
      return (
        <GroupsMonthSummary
          selectedGroupId={props.selectedGroupId}
          splitMode={props.splitMode}
          currentMonthKey={props.currentMonthKey}
          salaryTotal={props.salaryTotal}
          isManualConfigValid={props.isManualConfigValid}
          canCalculateMonthSplit={props.canCalculateMonthSplit}
          monthTotalCents={props.monthTotalCents}
          monthSplit={props.monthSplit}
          expensesLoading={props.loadingDetails}
          onRefreshExpenses={props.onRefreshSelectedGroupData}
          recommendedLimitPercent={props.recommendedLimitPercent}
          sectionCard={embeddedSectionCard}
          panelTitle={props.panelTitle}
          subtleText={props.subtleText}
          ghostButton={props.ghostButton}
        />
      );
    case "history":
      return (
        <GroupsHistoryCard
          selectedGroupId={props.selectedGroupId}
          expensesLoading={props.loadingDetails}
          expensesError={null}
          historyItems={props.historyItems}
          deleteExpenseLoadingId={props.deletingExpenseId}
          balancesLoading={props.loadingDetails}
          onRefreshExpenses={props.onRefreshSelectedGroupData}
          onOpenEditExpense={props.onOpenEditExpense}
          onDeleteExpenseFromHistory={props.onDeleteExpenseFromHistory}
          sectionCard={embeddedSectionCard}
          panelTitle={props.panelTitle}
          subtleText={props.subtleText}
          ghostButton={props.ghostButton}
          dangerButtonSmall={props.dangerButtonSmall}
          timelineCard={props.timelineCard}
          memberAvatarStyle={props.memberAvatarStyle}
        />
      );
    default:
      return null;
  }
}

export default function GroupsHeaderActionModal(props: GroupsHeaderActionModalProps) {
  const { activeHeaderAction, selectedGroupId, selectedGroupName } = props;

  if (!activeHeaderAction || !selectedGroupId) {
    return null;
  }

  const content = renderModalContent(props);

  return (
    <GroupsHeaderActionModalShell
      title={getHeaderActionModalTitle(activeHeaderAction)}
      selectedGroupName={selectedGroupName}
      onClose={props.onClose}
      modalOverlay={props.modalOverlay}
      modalCard={props.modalCard}
      modalHeader={props.modalHeader}
      modalBody={props.modalBody}
      subtleText={props.subtleText}
      ghostButton={props.ghostButton}
    >
      {content}
    </GroupsHeaderActionModalShell>
  );
}
