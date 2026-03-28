import type { CSSProperties } from "react";

import type {
  GroupBalancesResponse,
  GroupExpenseListItemDto,
  GroupMembersResponse,
  GroupSplitMode,
} from "../types/groups.types";
import GroupsBaseModal from "./GroupsBaseModal";
import GroupsCreateModal from "./GroupsCreateModal";
import GroupsCreateTransitionOverlay from "./GroupsCreateTransitionOverlay";
import GroupsEditExpenseModal from "./GroupsEditExpenseModal";
import GroupsExpensesModal from "./GroupsExpensesModal";
import GroupsHeaderActionModal from "./GroupsHeaderActionModal";

type MonthSplitItem = {
  userId: string;
  label: string;
  salary: number;
  weightPercent: number;
  shouldPay: number;
  percentOfSalary: number;
  manualPercent: number;
};

type GroupsModalsHubProps = {
  isCreateExpenseModalOpen: boolean;
  isEditExpenseModalOpen: boolean;
  isBaseConfigModalOpen: boolean;
  activeHeaderAction:
    | "people"
    | "base"
    | "expense"
    | "summary"
    | "history"
    | null;
  isTransitionVisible: boolean;
  selectedGroupId: string | null;
  selectedGroupName: string | null;
  splitMode: GroupSplitMode;
  balances: GroupBalancesResponse | null;
  membersInfo: GroupMembersResponse | null;
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
  manualPercentInputByUserId: Record<string, string>;
  salaryByUserId: Record<string, number>;
  manualPercentTotal: number;
  isManualConfigValid: boolean;
  currentMonthKey: string;
  canCalculateMonthSplit: boolean;
  monthTotalCents: number;
  monthSplit: MonthSplitItem[];
  historyItems: GroupExpenseListItemDto[];
  deletingExpenseId: string | null;
  recommendedLimitPercent: number;
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
  editingExpense: GroupExpenseListItemDto | null;
  editingExpenseTitle: string;
  editingExpenseAmount: string;
  editingExpenseDate: string;
  editLoading: boolean;
  editError: string | null;
  editSuccess: string | null;
  createGroupOpen: boolean;
  createGroupName: string;
  createGroupLoading: boolean;
  createGroupError: string | null;
  createGroupSuccess: string | null;
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
  tabButton: typeof import("../styles/groups.styles").tabButton;
  onCloseCreateExpenseModal: () => void;
  onSetExpensesTab: (value: "HOUSE" | "QUICK") => void;
  onSetHouseName: (value: string) => void;
  onSetHouseAmountBRL: (value: string) => void;
  onSetHouseDate: (value: string) => void;
  onHandleHouseAmountFocus: () => void;
  onHandleHouseAmountBlur: () => void;
  onCreateHouseExpense: () => void;
  onSetQuickDesc: (value: string) => void;
  onSetQuickAmountBRL: (value: string) => void;
  onSetQuickDate: (value: string) => void;
  onHandleQuickAmountFocus: () => void;
  onHandleQuickAmountBlur: () => void;
  onCreateQuickExpense: () => void;
  onCloseEditExpenseModal: () => void;
  onSetEditingExpenseTitle: (value: string) => void;
  onSetEditingExpenseAmount: (value: string) => void;
  onSetEditingExpenseDate: (value: string) => void;
  onHandleEditAmountFocus: () => void;
  onHandleEditAmountBlur: () => void;
  onSaveEditExpense: () => void;
  onCloseBaseConfigModal: () => void;
  onSplitModeChange: (mode: GroupSplitMode) => void;
  onSalaryChange: (userId: string, value: string) => void;
  onSalaryBlur: (userId: string) => void;
  onManualPercentChange: (userId: string, value: string) => void;
  onManualPercentBlur: (userId: string) => void;
  onResetSalaries: () => void;
  onSplitEqual: () => void;
  onSaveBaseConfig: () => void;
  safeName: (value: string | null | undefined) => string;
  salaryError: string | null;
  salarySuccess: string | null;
  onCloseHeaderActionModal: () => void;
  onToggleAddMember: () => void;
  onSetAddMemberEmail: (value: string) => void;
  onAddMember: () => void;
  onRemoveMember: (memberId: string, role: string) => void;
  onOpenBaseConfigFromHeaderAction: () => void;
  onOpenHouseExpenseFlow: () => void;
  onOpenQuickExpenseFlow: () => void;
  onRefreshSelectedGroupData: () => void;
  onOpenEditExpense: (expense: GroupExpenseListItemDto) => void;
  onDeleteExpenseFromHistory: (expense: GroupExpenseListItemDto) => void;
  onSetCreateGroupName: (value: string) => void;
  onCloseCreateGroup: () => void;
  onCreateGroup: () => Promise<void>;
};

export default function GroupsModalsHub({
  isCreateExpenseModalOpen,
  isEditExpenseModalOpen,
  isBaseConfigModalOpen,
  activeHeaderAction,
  isTransitionVisible,
  selectedGroupId,
  selectedGroupName,
  splitMode,
  balances,
  membersInfo,
  loadingDetails,
  removeMemberError,
  addMemberOpen,
  addMemberEmail,
  submittingMember,
  addMemberError,
  addMemberSuccess,
  removingMemberId,
  salaryFilledCount,
  membersCount,
  salaryTotal,
  manualPercentInputByUserId,
  salaryByUserId,
  manualPercentTotal,
  isManualConfigValid,
  currentMonthKey,
  canCalculateMonthSplit,
  monthTotalCents,
  monthSplit,
  historyItems,
  deletingExpenseId,
  recommendedLimitPercent,
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
  editingExpense,
  editingExpenseTitle,
  editingExpenseAmount,
  editingExpenseDate,
  editLoading,
  editError,
  editSuccess,
  createGroupOpen,
  createGroupName,
  createGroupLoading,
  createGroupError,
  createGroupSuccess,
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
  tabButton,
  onCloseCreateExpenseModal,
  onSetExpensesTab,
  onSetHouseName,
  onSetHouseAmountBRL,
  onSetHouseDate,
  onHandleHouseAmountFocus,
  onHandleHouseAmountBlur,
  onCreateHouseExpense,
  onSetQuickDesc,
  onSetQuickAmountBRL,
  onSetQuickDate,
  onHandleQuickAmountFocus,
  onHandleQuickAmountBlur,
  onCreateQuickExpense,
  onCloseEditExpenseModal,
  onSetEditingExpenseTitle,
  onSetEditingExpenseAmount,
  onSetEditingExpenseDate,
  onHandleEditAmountFocus,
  onHandleEditAmountBlur,
  onSaveEditExpense,
  onCloseBaseConfigModal,
  onSplitModeChange,
  onSalaryChange,
  onSalaryBlur,
  onManualPercentChange,
  onManualPercentBlur,
  onResetSalaries,
  onSplitEqual,
  onSaveBaseConfig,
  safeName,
  salaryError,
  salarySuccess,
  onCloseHeaderActionModal,
  onToggleAddMember,
  onSetAddMemberEmail,
  onAddMember,
  onRemoveMember,
  onOpenBaseConfigFromHeaderAction,
  onOpenHouseExpenseFlow,
  onOpenQuickExpenseFlow,
  onRefreshSelectedGroupData,
  onOpenEditExpense,
  onDeleteExpenseFromHistory,
  onSetCreateGroupName,
  onCloseCreateGroup,
  onCreateGroup,
}: GroupsModalsHubProps) {
  return (
    <>
      <GroupsExpensesModal
        open={isCreateExpenseModalOpen}
        selectedGroupId={selectedGroupId}
        selectedGroupName={selectedGroupName}
        splitMode={splitMode}
        expensesTab={expensesTab}
        houseName={houseName}
        houseAmountBRL={houseAmountBRL}
        houseDate={houseDate}
        houseLoading={houseLoading}
        houseError={houseError}
        houseSuccess={houseSuccess}
        quickDesc={quickDesc}
        quickAmountBRL={quickAmountBRL}
        quickDate={quickDate}
        quickLoading={quickLoading}
        quickError={quickError}
        quickSuccess={quickSuccess}
        onClose={onCloseCreateExpenseModal}
        onChangeTab={onSetExpensesTab}
        onHouseNameChange={onSetHouseName}
        onHouseAmountChange={onSetHouseAmountBRL}
        onHouseDateChange={onSetHouseDate}
        onHouseAmountFocus={onHandleHouseAmountFocus}
        onHouseAmountBlur={onHandleHouseAmountBlur}
        onCreateHouseExpense={onCreateHouseExpense}
        onQuickDescChange={onSetQuickDesc}
        onQuickAmountChange={onSetQuickAmountBRL}
        onQuickDateChange={onSetQuickDate}
        onQuickAmountFocus={onHandleQuickAmountFocus}
        onQuickAmountBlur={onHandleQuickAmountBlur}
        onCreateQuickExpense={onCreateQuickExpense}
        modalOverlay={modalOverlay}
        modalCard={modalCard}
        modalHeader={modalHeader}
        modalBody={modalBody}
        subtleText={subtleText}
        inputStyle={inputStyle}
        softButton={softButton}
        primaryButton={primaryButton}
        tabButton={tabButton}
      />

      <GroupsEditExpenseModal
        open={isEditExpenseModalOpen}
        selectedGroupId={selectedGroupId}
        editingExpense={editingExpense}
        editDesc={editingExpenseTitle}
        editAmountBRL={editingExpenseAmount}
        editDate={editingExpenseDate}
        editLoading={editLoading}
        editError={editError}
        editSuccess={editSuccess}
        onClose={onCloseEditExpenseModal}
        onEditDescChange={onSetEditingExpenseTitle}
        onEditAmountChange={onSetEditingExpenseAmount}
        onEditDateChange={onSetEditingExpenseDate}
        onEditAmountFocus={onHandleEditAmountFocus}
        onEditAmountBlur={onHandleEditAmountBlur}
        onSave={onSaveEditExpense}
        modalOverlay={modalOverlay}
        modalCard={modalCard}
        modalHeader={modalHeader}
        modalBody={modalBody}
        subtleText={subtleText}
        inputStyle={inputStyle}
        softButton={softButton}
        ghostButton={ghostButton}
      />

      <GroupsBaseModal
        open={isBaseConfigModalOpen}
        selectedGroupId={selectedGroupId}
        balances={balances}
        splitMode={splitMode}
        salaryByUserId={salaryByUserId}
        manualPercentInputByUserId={manualPercentInputByUserId}
        manualPercentTotal={manualPercentTotal}
        recommendedLimitPercent={recommendedLimitPercent}
        onClose={onCloseBaseConfigModal}
        onSplitModeChange={onSplitModeChange}
        onSalaryChange={onSalaryChange}
        onSalaryBlur={onSalaryBlur}
        onManualPercentChange={onManualPercentChange}
        onManualPercentBlur={onManualPercentBlur}
        onResetSalaries={onResetSalaries}
        onSplitEqual={onSplitEqual}
        onSave={onSaveBaseConfig}
        safeName={safeName}
        salaryError={salaryError}
        salarySuccess={salarySuccess}
        modalOverlay={modalOverlay}
        modalCard={modalCard}
        modalHeader={modalHeader}
        modalBody={modalBody}
        subtleText={subtleText}
        inputStyle={inputStyle}
        softButton={softButton}
        ghostButton={ghostButton}
        tabButton={tabButton}
      />

      <GroupsHeaderActionModal
        activeHeaderAction={activeHeaderAction}
        selectedGroupId={selectedGroupId}
        selectedGroupName={selectedGroupName}
        splitMode={splitMode}
        membersInfo={membersInfo}
        balances={balances}
        loadingDetails={loadingDetails}
        removeMemberError={removeMemberError}
        addMemberOpen={addMemberOpen}
        addMemberEmail={addMemberEmail}
        submittingMember={submittingMember}
        addMemberError={addMemberError}
        addMemberSuccess={addMemberSuccess}
        removingMemberId={removingMemberId}
        salaryFilledCount={salaryFilledCount}
        membersCount={membersCount}
        salaryTotal={salaryTotal}
        manualPercentTotal={manualPercentTotal}
        isManualConfigValid={isManualConfigValid}
        currentMonthKey={currentMonthKey}
        canCalculateMonthSplit={canCalculateMonthSplit}
        monthTotalCents={monthTotalCents}
        monthSplit={monthSplit}
        historyItems={historyItems}
        deletingExpenseId={deletingExpenseId}
        recommendedLimitPercent={recommendedLimitPercent}
        onClose={onCloseHeaderActionModal}
        onToggleAddMember={onToggleAddMember}
        onAddMemberEmailChange={onSetAddMemberEmail}
        onAddMember={onAddMember}
        onRemoveMember={onRemoveMember}
        onOpenBaseConfigModal={onOpenBaseConfigFromHeaderAction}
        onOpenHouseExpenseFlow={onOpenHouseExpenseFlow}
        onOpenQuickExpenseFlow={onOpenQuickExpenseFlow}
        onRefreshSelectedGroupData={onRefreshSelectedGroupData}
        onOpenEditExpense={onOpenEditExpense}
        onDeleteExpenseFromHistory={onDeleteExpenseFromHistory}
        modalOverlay={modalOverlay}
        modalCard={modalCard}
        modalHeader={modalHeader}
        modalBody={modalBody}
        sectionCard={sectionCard}
        panelTitle={panelTitle}
        subtleText={subtleText}
        softButton={softButton}
        ghostButton={ghostButton}
        primaryButton={primaryButton}
        dangerButtonSmall={dangerButtonSmall}
        inputStyle={inputStyle}
        memberAvatarStyle={memberAvatarStyle}
        timelineCard={timelineCard}
      />

      <GroupsCreateTransitionOverlay
        isVisible={isTransitionVisible}
        subtleText={subtleText}
      />

      <GroupsCreateModal
        open={createGroupOpen}
        value={createGroupName}
        loading={createGroupLoading}
        error={createGroupError}
        success={createGroupSuccess}
        onChange={onSetCreateGroupName}
        onClose={onCloseCreateGroup}
        onCreate={onCreateGroup}
      />
    </>
  );
}
