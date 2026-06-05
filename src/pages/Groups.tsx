import { useEffect, useMemo, useState, type CSSProperties } from "react"; // Hooks do React
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js"; // Elementos principais do Chart.js

import GroupsContextCard from "./groups/components/GroupsContextCard";
import GroupsDashboardContent from "./groups/components/GroupsDashboardContent";
import GroupsGroupsLane from "./groups/components/GroupsGroupsLane";
import GroupsModalsHub from "./groups/components/GroupsModalsHub";
import { acceptGroupInvite } from "./groups/services/groups.api";

import useGroupsActions from "./groups/hooks/useGroupsActions"; // Hook de aÃ§Ãµes do mÃ³dulo
import useGroupsBaseConfig from "./groups/hooks/useGroupsBaseConfig"; // Hook da base salarial / percentual
import { useGroupsCalculations } from "./groups/hooks/useGroupsCalculations"; // Hook de cÃ¡lculos do dashboard
import { useGroupsCreateGroup } from "./groups/hooks/useGroupsCreateGroup"; // Hook dedicado Ã  criaÃ§Ã£o de grupo
import useGroupsCreateTransition from "./groups/hooks/useGroupsCreateTransition"; // Hook da transiÃ§Ã£o visual ao criar grupo
import { useGroupsDashboard } from "./groups/hooks/useGroupsDashboard"; // Hook central do dashboard
import useGroupsEditExpense from "./groups/hooks/useGroupsEditExpense"; // Hook da ediÃ§Ã£o de despesa
import useGroupsExpenses from "./groups/hooks/useGroupsExpenses"; // Hook das despesas do mÃ³dulo
import useGroupsForms from "./groups/hooks/useGroupsForms"; // Hook de formulÃ¡rios do mÃ³dulo
import useGroupsHeaderActions from "./groups/hooks/useGroupsHeaderActions";
import useGroupsModals from "./groups/hooks/useGroupsModals"; // Hook de modais do mÃ³dulo

import type {
  GroupDto,
  GroupsApiState,
} from "./groups/types/groups.types"; // Tipos do mÃ³dulo

import { safeName } from "./groups/utils/groups.helpers"; // Helpers do mÃ³dulo

import {
  dangerButtonSmall,
  ghostButton,
  inputStyle,
  memberAvatarStyle,
  metricCard,
  modalBody,
  modalCard,
  modalHeader,
  modalOverlay,
  panelTitle,
  pillStyle,
  primaryButton,
  sectionCard,
  softButton,
  subtleText,
  tabButton,
  timelineCard,
} from "./groups/styles/groups.styles"; // Estilos centralizados do mÃ³dulo
import "./groups/styles/groups.css"; // Premium redesign CSS

ChartJS.register(ArcElement, Tooltip, Legend); // Registra componentes do Chart.js

export default function Groups() {
  // ==============================
  // HOOK CENTRAL
  // ==============================

  const {
    groups,
    selectedGroupId,
    selectedGroup,
    members: membersInfo,
    expenses,
    balances,
    loadingGroups,
    loadingDetails,
    creatingGroup,
    deletingGroupId,
    submittingMember,
    removingMemberId,
    deletingExpenseId,
    error,
    selectGroup,
    reloadGroups,
    reloadSelectedGroupData,
    handleCreateGroup,
    handleDeleteGroup,
    handleAddMember,
    handleRemoveMember,
    handleCreateExpense,
    handleUpdateExpense,
    handleDeleteExpense,
  } = useGroupsDashboard(); // Hook central com grupos + detalhes + CRUD principal

  const state = useMemo<GroupsApiState>(() => {
    return {
      groups,
      loading: loadingGroups,
      error,
    };
  }, [groups, loadingGroups, error]);

  const selectedGroupName = selectedGroup?.name ?? null; // Nome do grupo selecionado

  // ==============================
  // HOOKS: forms / modals
  // ==============================

  const {
    editingExpenseTitle,
    setEditingExpenseTitle,
    editingExpenseAmount,
    setEditingExpenseAmount,
    editingExpenseDate,
    setEditingExpenseDate,
    resetGroupForm,
    resetEditExpenseForm,
    startEditExpenseForm,
  } = useGroupsForms({
    selectedGroupId,
  });

  const {
    isCreateExpenseModalOpen,
    isEditExpenseModalOpen,
    isBaseConfigModalOpen,
    activeHeaderAction,
    selectedExpenseId,
    openCreateExpenseModal,
    closeCreateExpenseModal,
    openEditExpenseModal,
    closeEditExpenseModal: closeEditExpenseModalState,
    openBaseConfigModal,
    closeBaseConfigModal,
    openHeaderActionModal,
    closeHeaderActionModal,
    clearSelectedExpense,
  } = useGroupsModals();

  // ==============================
  // STATE: members
  // ==============================

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMemberEmail, setAddMemberEmail] = useState("");
  const [addMemberDisplayName, setAddMemberDisplayName] = useState("");
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [addMemberSuccess, setAddMemberSuccess] = useState<string | null>(null);
  const [removeMemberError, setRemoveMemberError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteCodeError, setInviteCodeError] = useState<string | null>(null);
  const [inviteCodeSuccess, setInviteCodeSuccess] = useState<string | null>(null);
  const [inviteCodeLoading, setInviteCodeLoading] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [pageReady, setPageReady] = useState(false);
  const [animationKey, setAnimationKey] = useState(0); // forÃ§a nova execuÃ§Ã£o visual
  const [highlightGroupId, setHighlightGroupId] = useState<string | null>(null); // Destaca visualmente o grupo recÃ©m-criado
  const [pendingCreatedGroupName, setPendingCreatedGroupName] = useState<string | null>(null); // Guarda o nome do grupo recÃ©m-criado atÃ© a lista atualizar
  const [isGroupsLaneAnimating, setIsGroupsLaneAnimating] = useState(false); // Faz a faixa dos grupos reagir quando um novo grupo entra
  const [isSwitchingGroup, setIsSwitchingGroup] = useState(false); // Faz a troca entre grupos ficar suave
  const [isDeleteGroupConfirmOpen, setIsDeleteGroupConfirmOpen] = useState(false); // Controla o modal customizado de exclusÃ£o
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });
  // ==============================
  // HOOK: despesas
  // ==============================

  const {
    expensesTab,
    setExpensesTab,
    houseName,
    setHouseName,
    houseAmountBRL,
    setHouseAmountBRL,
    houseDate,
    setHouseDate,
    housePaidByUserId,
    houseLoading,
    setHouseLoading,
    houseError,
    setHouseError,
    houseSuccess,
    setHouseSuccess,
    quickDesc,
    setQuickDesc,
    quickAmountBRL,
    setQuickAmountBRL,
    quickDate,
    setQuickDate,
    quickPaidByUserId,
    quickLoading,
    setQuickLoading,
    quickError,
    setQuickError,
    quickSuccess,
    setQuickSuccess,
    clearExpenseFeedback,
    prepareHouseExpenseFlow,
    prepareQuickExpenseFlow,
    handleHouseAmountFocus,
    handleHouseAmountBlur,
    handleQuickAmountFocus,
    handleQuickAmountBlur,
  } = useGroupsExpenses({
    selectedGroupId,
    balances,
  });

  // ==============================
  // HOOK: base salarial / percentual
  // ==============================

  const {
    salaryError,
    salarySuccess,
    splitMode,
    manualPercentInputByUserId,
    salaryByUserId,
    currentUserId,
    canManageAllSalaries,
    setSalaryError,
    setSalarySuccess,
    clearBaseFeedback,
    onSplitModeChange,
    onSalaryChange,
    onSalaryBlur,
    onManualPercentChange,
    onManualPercentBlur,
    onResetSalaries,
    onSplitEqual,
    onSave: onSaveBaseConfig,
  } = useGroupsBaseConfig({
    selectedGroupId,
    balances,
    membersInfo,
    onAfterSave: reloadSelectedGroupData,
  });

  // ==============================
  // HOOK: ediÃ§Ã£o de despesa
  // ==============================

  const {
    editingExpense,
    editLoading,
    setEditLoading,
    editError,
    setEditError,
    editSuccess,
    setEditSuccess,
    clearEditFeedback,
    handleOpenEditExpenseModal,
    handleCloseEditExpenseModal,
    handleEditAmountFocus,
    handleEditAmountBlur,
  } = useGroupsEditExpense({
    expenses: expenses?.items ?? [],
    selectedExpenseId,
    openEditExpenseModal,
    closeEditExpenseModalState,
    clearSelectedExpense,
    resetEditExpenseForm,
    startEditExpenseForm,
  });

  const RECOMMENDED_LIMIT_PERCENT = 30; // Limite recomendado de comprometimento

  // ==============================
  // HOOK: actions
  // ==============================

  const {
    onCreateGroup,
    onDeleteGroup,
    onAddMember,
    onRemoveMember,
    onCreateHouseExpense,
    onCreateQuickExpense,
    onSaveEditExpense,
    onDeleteExpenseFromHistory,
  } = useGroupsActions({
    selectedGroupId,
    balances,
    handleCreateGroup,
    handleDeleteGroup,
    handleAddMember,
    handleRemoveMember,
    handleCreateExpense,
    handleUpdateExpense,
    handleDeleteExpense,
    setCreateGroupError: () => {},
    setCreateGroupSuccess: () => {},
    setAddMemberError,
    setAddMemberSuccess,
    setRemoveMemberError,
    setHouseError,
    setHouseSuccess,
    setHouseLoading,
    setQuickError,
    setQuickSuccess,
    setQuickLoading,
    setEditError,
    setEditSuccess,
    setEditLoading,
    resetGroupForm,
    closeCreateExpenseModal,
    closeBaseConfigModal,
    closeEditExpenseModal: handleCloseEditExpenseModal,
  });

  // ==============================
  // HOOK: criar grupo
  // ==============================

  const createGroup = useGroupsCreateGroup({
    createGroupRequest: async (name) => {
      await Promise.resolve(
        onCreateGroup({
          newGroupName: name,
        }),
      );
    },
    reloadGroups,
  });

  const {
    isTransitionVisible,
    isCreatingWithTransition,
    startCreateTransition,
  } = useGroupsCreateTransition({
    closeModal: () => {
      createGroup.close(); // Fecha o modal depois do sucesso e limpa estado
    },
  });

  // ==============================
  // EFFECT: reset visual ao trocar grupo
  // ==============================

  useEffect(() => {
    setPageReady(false);

    const timeoutId = window.setTimeout(() => {
      setPageReady(true);
    }, 60);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 767px)");

    function handleMediaChange(event: MediaQueryListEvent) {
      setIsMobileViewport(event.matches);
    }

    setIsMobileViewport(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  useEffect(() => {
    closeCreateExpenseModal();
    closeBaseConfigModal();
    handleCloseEditExpenseModal();

    createGroup.close();
    setAddMemberError(null);
    setAddMemberSuccess(null);
    setAddMemberDisplayName("");
    setRemoveMemberError(null);
    closeHeaderActionModal();

    clearExpenseFeedback();
    clearBaseFeedback();
    clearEditFeedback();
    setIsDeleteGroupConfirmOpen(false);
  }, [selectedGroupId]);

  useEffect(() => {
    function handleOpenGroupExpense() {
      closeHeaderActionModal();
      prepareQuickExpenseFlow();
      openCreateExpenseModal();
    }

    window.addEventListener("conciliaai:open-group-expense", handleOpenGroupExpense);

    return () => {
      window.removeEventListener("conciliaai:open-group-expense", handleOpenGroupExpense);
    };
  }, [closeHeaderActionModal, openCreateExpenseModal, prepareQuickExpenseFlow]);

  // ==============================
  // EFFECT: animaÃ§Ã£o ao entrar/trocar grupo
  // ==============================

  useEffect(() => {
    setAnimate(false);

    const timeoutId = window.setTimeout(() => {
      setAnimate(true);
      setAnimationKey((prev) => prev + 1);
    }, 40);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [selectedGroupId]);

  // ==============================
  // EFFECT: encontra e destaca o grupo recÃ©m-criado
  // ==============================

  useEffect(() => {
    if (!pendingCreatedGroupName || groups.length === 0) return;

    const matchedGroup = [...groups]
      .reverse()
      .find(
        (group) =>
          group.name.trim().toLowerCase() ===
          pendingCreatedGroupName.trim().toLowerCase(),
      );

    if (!matchedGroup) return;

    selectGroup(matchedGroup.id);
    setHighlightGroupId(matchedGroup.id);
    setPendingCreatedGroupName(null);
    setIsGroupsLaneAnimating(true);

    const clearHighlightTimeoutId = window.setTimeout(() => {
      setHighlightGroupId((currentId) =>
        currentId === matchedGroup.id ? null : currentId,
      );
    }, 2200);

    const clearLaneTimeoutId = window.setTimeout(() => {
      setIsGroupsLaneAnimating(false);
    }, 650);

    return () => {
      window.clearTimeout(clearHighlightTimeoutId);
      window.clearTimeout(clearLaneTimeoutId);
    };
  }, [groups, pendingCreatedGroupName, selectGroup]);

  // ==============================
  // UI data via hook
  // ==============================

  const {
    membersCount,
    currentMonthKey,
    monthExpenses,
    monthTotalCents,
    salaryTotal,
    manualPercentTotal,
    isManualConfigValid,
    canCalculateMonthSplit,
    monthSplit,
    historyItems,
    salaryFilledCount,
    averagePerPersonCents,
    highestBurden,
    monthSplitChartColors,
    monthSplitChartData,
    monthSplitChartOptions,
  } = useGroupsCalculations({
    balances,
    membersInfo,
    expenses,
    splitMode,
    salaryByUserId,
    manualPercentInputByUserId,
  });

  const headerQuickActions = useGroupsHeaderActions({
    isGroupsLoading: state.loading,
    isCreateGroupLoading: createGroup.loading,
    isCreatingGroup: creatingGroup,
    isCreatingWithTransition,
    selectedGroupId,
    onReloadGroups: reloadGroups,
    onOpenCreateGroup: createGroup.open,
    onOpenHeaderActionModal: openHeaderActionModal,
    onResetMemberFeedback: () => {
      setAddMemberError(null);
      setAddMemberSuccess(null);
    },
    onClearBaseFeedback: clearBaseFeedback,
  });


  const responsiveSectionCard: CSSProperties = {
    ...sectionCard,
    padding: isMobileViewport ? 14 : sectionCard.padding,
    borderRadius: isMobileViewport ? 18 : sectionCard.borderRadius,
  };

  const responsivePanelTitle: CSSProperties = {
    ...panelTitle,
    fontSize: isMobileViewport ? 16 : panelTitle.fontSize,
  };

  const responsivePillStyle: CSSProperties = {
    ...pillStyle,
    fontSize: isMobileViewport ? 11 : pillStyle.fontSize,
    padding: isMobileViewport ? "5px 8px" : pillStyle.padding,
  };


  function handleSelectGroup(group: GroupDto) {
    if (group.id === selectedGroupId) return;

    setIsSwitchingGroup(true);

    window.setTimeout(() => {
      selectGroup(group.id);

      createGroup.close();
      clearExpenseFeedback();

      setAddMemberSuccess(null);
      setAddMemberError(null);
      setRemoveMemberError(null);
      setHighlightGroupId(null);
      setPendingCreatedGroupName(null);
      setIsGroupsLaneAnimating(false);
      closeHeaderActionModal();

      setSalaryError(null);
      setSalarySuccess(null);

      clearEditFeedback();

      closeCreateExpenseModal();
      closeBaseConfigModal();
      handleCloseEditExpenseModal();

      setIsSwitchingGroup(false);
    }, 120);
  }

  function getClockEntryStyle(order: number): CSSProperties {
    const delay = 140 + order * 130;

    // On mobile: simple translateY so content stays within screen bounds.
    // The 3D perspective + rotateX/rotateZ with transformOrigin:"top left"
    // pushes elements off to the right on small screens.
    if (isMobileViewport) {
      return {
        opacity: animate ? 1 : 0,
        transform: animate ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 0.55s ease ${delay}ms, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: "opacity, transform",
      };
    }

    return {
      opacity: animate ? 1 : 0,
      transform: animate
        ? "perspective(1200px) rotateX(0deg) rotateZ(0deg) translateY(0px) scale(1)"
        : "perspective(1200px) rotateX(18deg) rotateZ(-4deg) translateY(42px) scale(0.94)",
      transformOrigin: "top left",
      filter: animate ? "blur(0px)" : "blur(12px)",
      transition: `opacity 0.72s ease ${delay}ms, transform 0.92s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, filter 0.72s ease ${delay}ms`,
      animation: animate
        ? `conciliaai-groups-section-breathe 5.4s ease-in-out ${delay + 1100}ms infinite`
        : "none",
      willChange: "opacity, transform, filter",
    };
  }

  function handleRequestDeleteGroup() {
    if (!selectedGroupId || deletingGroupId === selectedGroupId) return;

    setIsDeleteGroupConfirmOpen(true);
  }

  async function handleConfirmDeleteGroup() {
    const deleted = await onDeleteGroup();

    if (deleted) {
      setIsDeleteGroupConfirmOpen(false);
    }
  }

  async function handleAcceptInviteCode() {
    const code = inviteCode.trim();
    setInviteCodeError(null);
    setInviteCodeSuccess(null);

    if (!code) {
      setInviteCodeError("Digite o codigo recebido no e-mail.");
      return;
    }

    try {
      setInviteCodeLoading(true);
      await acceptGroupInvite(code);
      setInviteCode("");
      setInviteCodeSuccess("Convite aceito. O grupo compartilhado ja esta disponivel.");
      await reloadGroups();
      await reloadSelectedGroupData();
    } catch (err) {
      setInviteCodeError(err instanceof Error ? err.message : "Nao foi possivel aceitar o convite.");
    } finally {
      setInviteCodeLoading(false);
    }
  }

  return (
    <div
      className="grp-page"
      style={{
        opacity: pageReady ? 1 : 0,
        transform: pageReady ? "translateY(0px) scale(1)" : "translateY(22px) scale(0.985)",
        filter: pageReady ? "blur(0px)" : "blur(10px)",
        transition:
          "opacity 0.58s ease, transform 0.72s cubic-bezier(0.16, 1, 0.3, 1), filter 0.58s ease",
        willChange: "opacity, transform, filter",
      }}
    >
      <div
        key={animationKey}
        style={{ display: "grid", gap: isMobileViewport ? 14 : 18, width: "100%" }}
      >
        {/* Slim header */}
        <div style={getClockEntryStyle(0)} className="grp-slim-head">
          <span className="grp-hero-kicker">Contas compartilhadas</span>
          <h2 style={{ fontFamily: "var(--display)", fontSize: isMobileViewport ? 26 : 30, fontWeight: 700, letterSpacing: "-0.02em", margin: "8px 0 6px" }}>
            Grupos
          </h2>
          <p style={{ color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.45, maxWidth: 480, margin: 0 }}>
            Divida aluguel, viagens e contas da casa de forma justa.
          </p>
        </div>

        {state.groups.length > 0 && (
          <div style={getClockEntryStyle(1)}>
            <GroupsGroupsLane
              groups={state.groups}
              selectedGroupId={selectedGroupId}
              highlightGroupId={highlightGroupId}
              isGroupsLaneAnimating={isGroupsLaneAnimating}
              onSelectGroup={handleSelectGroup}
              onCreateGroup={createGroup.open}
              sectionCard={responsiveSectionCard}
              panelTitle={responsivePanelTitle}
              subtleText={subtleText}
              memberAvatarStyle={memberAvatarStyle}
            />
            {!selectedGroup && (
              <div className="grp-hint-row">
                <span className="grp-hint-pulse" />
                Toque num grupo para abrir as ações dele
              </div>
            )}
          </div>
        )}

        {/* Group context card — appears when a group is selected */}
        {selectedGroup && (
          <div style={getClockEntryStyle(state.groups.length > 0 ? 2 : 1)}>
            <GroupsContextCard
              groupName={selectedGroup.name}
              membersCount={membersCount}
              monthTotalCents={monthTotalCents}
              averagePerPersonCents={averagePerPersonCents}
              balances={balances}
              actions={headerQuickActions}
              onClose={() => selectGroup(null)}
              isMobile={isMobileViewport}
            />
          </div>
        )}

        {state.error && (
          <div style={getClockEntryStyle(2)}>
            <div
              style={{
                ...responsiveSectionCard,
                display: "flex",
                alignItems: isMobileViewport ? "flex-start" : "center",
                gap: 12,
                border: "1px solid rgba(248,113,113,0.20)",
                background:
                  "linear-gradient(135deg, rgba(127,29,29,0.22), rgba(15,23,42,0.62))",
                color: "#fecaca",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 14,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(248,113,113,0.12)",
                  border: "1px solid rgba(248,113,113,0.20)",
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                !
              </div>
              <div style={{ display: "grid", gap: 3, minWidth: 0 }}>
                <strong>Alguns dados do grupo ainda nao carregaram.</strong>
                <span style={{ ...subtleText, fontSize: 13, color: "#fecaca", opacity: 0.82 }}>
                  A tela continua funcionando com os dados disponiveis. Tente atualizar em alguns segundos.
                </span>
              </div>
            </div>
          </div>
        )}

        {!selectedGroup && (
          <div style={getClockEntryStyle(state.groups.length > 0 ? 3 : 1)}>
            <div className="grp-invite-card">
              <span className="grp-hero-kicker">Entrar em grupo</span>
              <h3 style={{ fontFamily: "var(--display)", fontSize: 17, margin: "6px 0 2px" }}>
                Recebeu um convite?
              </h3>
              <div style={{ color: "var(--text-2)", fontSize: 13 }}>
                Informe o código recebido por e-mail para liberar somente esse grupo.
              </div>
              <div className="grp-invite-row">
                <input
                  value={inviteCode}
                  onChange={(event) => setInviteCode(event.target.value)}
                  placeholder="Código do convite"
                  inputMode="numeric"
                />
                <button
                  type="button"
                  className="grp-btn"
                  onClick={handleAcceptInviteCode}
                  disabled={inviteCodeLoading}
                >
                  {inviteCodeLoading ? "Validando..." : "Entrar no grupo"}
                </button>
              </div>
              {inviteCodeError && <div style={{ color: "#fecaca", fontSize: 13 }}>{inviteCodeError}</div>}
              {inviteCodeSuccess && <div style={{ color: "#86efac", fontSize: 13 }}>{inviteCodeSuccess}</div>}
            </div>
          </div>
        )}

        <GroupsDashboardContent
          selectedGroupId={selectedGroupId}
          selectedGroupName={selectedGroupName}
          groupsCount={state.groups.length}
          isSwitchingGroup={isSwitchingGroup}
          membersCount={membersCount}
          currentMonthKey={currentMonthKey}
          splitMode={splitMode}
          deletingGroupId={deletingGroupId}
          monthTotalCents={monthTotalCents}
          monthExpensesCount={monthExpenses.length}
          averagePerPersonCents={averagePerPersonCents}
          highestBurden={highestBurden}
          recommendedLimitPercent={RECOMMENDED_LIMIT_PERCENT}
          canCalculateMonthSplit={canCalculateMonthSplit}
          monthSplit={monthSplit}
          monthSplitChartColors={monthSplitChartColors}
          monthSplitChartData={monthSplitChartData}
          monthSplitChartOptions={monthSplitChartOptions}
          historyItemsCount={historyItems.length}
          onDeleteGroup={handleRequestDeleteGroup}
          getClockEntryStyle={getClockEntryStyle}
          sectionCard={responsiveSectionCard}
          panelTitle={responsivePanelTitle}
          subtleText={subtleText}
          pillStyle={responsivePillStyle}
          dangerButtonSmall={dangerButtonSmall}
          metricCard={metricCard}
        />


        <GroupsModalsHub
          isCreateExpenseModalOpen={isCreateExpenseModalOpen}
          isEditExpenseModalOpen={isEditExpenseModalOpen}
          isBaseConfigModalOpen={isBaseConfigModalOpen}
          activeHeaderAction={activeHeaderAction}
          isTransitionVisible={isTransitionVisible}
          selectedGroupId={selectedGroupId}
          selectedGroupName={selectedGroupName}
          splitMode={splitMode}
          balances={balances}
          membersInfo={membersInfo}
          loadingDetails={loadingDetails}
          removeMemberError={removeMemberError}
          addMemberOpen={addMemberOpen}
          addMemberEmail={addMemberEmail}
          addMemberDisplayName={addMemberDisplayName}
          submittingMember={submittingMember}
          addMemberError={addMemberError}
          addMemberSuccess={addMemberSuccess}
          removingMemberId={removingMemberId}
          salaryFilledCount={salaryFilledCount}
          membersCount={membersCount}
          salaryTotal={salaryTotal}
          manualPercentInputByUserId={manualPercentInputByUserId}
          salaryByUserId={salaryByUserId}
          currentUserId={currentUserId}
          canManageAllSalaries={canManageAllSalaries}
          manualPercentTotal={manualPercentTotal}
          isManualConfigValid={isManualConfigValid}
          currentMonthKey={currentMonthKey}
          canCalculateMonthSplit={canCalculateMonthSplit}
          monthTotalCents={monthTotalCents}
          monthSplit={monthSplit}
          historyItems={historyItems}
          deletingExpenseId={deletingExpenseId}
          recommendedLimitPercent={RECOMMENDED_LIMIT_PERCENT}
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
          editingExpense={editingExpense}
          editingExpenseTitle={editingExpenseTitle}
          editingExpenseAmount={editingExpenseAmount}
          editingExpenseDate={editingExpenseDate}
          editLoading={editLoading}
          editError={editError}
          editSuccess={editSuccess}
          createGroupOpen={createGroup.isOpen}
          createGroupName={createGroup.name}
          createGroupLoading={createGroup.loading || isCreatingWithTransition || creatingGroup}
          createGroupError={createGroup.error}
          createGroupSuccess={createGroup.success}
          deleteGroupConfirmOpen={isDeleteGroupConfirmOpen}
          deleteGroupLoading={deletingGroupId === selectedGroupId}
          modalOverlay={modalOverlay}
          modalCard={modalCard}
          modalHeader={modalHeader}
          modalBody={modalBody}
          sectionCard={responsiveSectionCard}
          panelTitle={responsivePanelTitle}
          subtleText={subtleText}
          softButton={softButton}
          ghostButton={ghostButton}
          primaryButton={primaryButton}
          dangerButtonSmall={dangerButtonSmall}
          inputStyle={inputStyle}
          memberAvatarStyle={memberAvatarStyle}
          timelineCard={timelineCard}
          tabButton={tabButton}
          onCloseCreateExpenseModal={closeCreateExpenseModal}
          onSetExpensesTab={setExpensesTab}
          onSetHouseName={setHouseName}
          onSetHouseAmountBRL={setHouseAmountBRL}
          onSetHouseDate={setHouseDate}
          onHandleHouseAmountFocus={handleHouseAmountFocus}
          onHandleHouseAmountBlur={handleHouseAmountBlur}
          onCreateHouseExpense={() =>
            onCreateHouseExpense({
              houseName,
              houseAmountBRL,
              houseDate,
              housePaidByUserId,
            })
          }
          onSetQuickDesc={setQuickDesc}
          onSetQuickAmountBRL={setQuickAmountBRL}
          onSetQuickDate={setQuickDate}
          onHandleQuickAmountFocus={handleQuickAmountFocus}
          onHandleQuickAmountBlur={handleQuickAmountBlur}
          onCreateQuickExpense={() =>
            onCreateQuickExpense({
              quickDesc,
              quickAmountBRL,
              quickDate,
              quickPaidByUserId,
            })
          }
          onCloseEditExpenseModal={handleCloseEditExpenseModal}
          onSetEditingExpenseTitle={setEditingExpenseTitle}
          onSetEditingExpenseAmount={setEditingExpenseAmount}
          onSetEditingExpenseDate={setEditingExpenseDate}
          onHandleEditAmountFocus={() => handleEditAmountFocus(editingExpenseAmount, setEditingExpenseAmount)}
          onHandleEditAmountBlur={() => handleEditAmountBlur(editingExpenseAmount, setEditingExpenseAmount)}
          onSaveEditExpense={() =>
            onSaveEditExpense({
              editingExpense,
              editingExpenseTitle,
              editingExpenseAmount,
              editingExpenseDate,
            })
          }
          onCloseBaseConfigModal={closeBaseConfigModal}
          onSplitModeChange={onSplitModeChange}
          onSalaryChange={onSalaryChange}
          onSalaryBlur={onSalaryBlur}
          onManualPercentChange={onManualPercentChange}
          onManualPercentBlur={onManualPercentBlur}
          onResetSalaries={onResetSalaries}
          onSplitEqual={onSplitEqual}
          onSaveBaseConfig={() =>
            onSaveBaseConfig(() => {
              closeBaseConfigModal();
            })
          }
          safeName={safeName}
          salaryError={salaryError}
          salarySuccess={salarySuccess}
          onCloseHeaderActionModal={closeHeaderActionModal}
          onToggleAddMember={() => setAddMemberOpen((value) => !value)}
          onSetAddMemberEmail={setAddMemberEmail}
          onSetAddMemberDisplayName={setAddMemberDisplayName}
          onAddMember={() =>
            onAddMember({
              addMemberEmail,
              addMemberDisplayName,
              onSuccess: () => {
                setAddMemberEmail("");
                setAddMemberDisplayName("");
                setAddMemberOpen(false);
              },
            })
          }
          onRemoveMember={(memberId, role) => onRemoveMember({ memberId, role })}
          onOpenBaseConfigFromHeaderAction={() => {
            closeHeaderActionModal();
            window.setTimeout(() => {
              openBaseConfigModal();
            }, 0);
          }}
          onOpenHouseExpenseFlow={() => {
            closeHeaderActionModal();
            prepareHouseExpenseFlow();
            openCreateExpenseModal();
          }}
          onOpenQuickExpenseFlow={() => {
            closeHeaderActionModal();
            prepareQuickExpenseFlow();
            openCreateExpenseModal();
          }}
          onRefreshSelectedGroupData={() => {
            reloadSelectedGroupData();
          }}
          onOpenEditExpense={handleOpenEditExpenseModal}
          onDeleteExpenseFromHistory={onDeleteExpenseFromHistory}
          onSetCreateGroupName={createGroup.setName}
          onCloseCreateGroup={createGroup.close}
          onCreateGroup={async () => {
            if (isCreatingWithTransition) return; // Evita duplo clique

            const createdGroupName = createGroup.name.trim(); // Guarda o nome antes do hook limpar o input

            await startCreateTransition(async () => {
              try {
                await createGroup.create();

                if (createdGroupName) {
                  setPendingCreatedGroupName(createdGroupName);
                }
              } catch (err) {
                console.error("Erro ao criar grupo:", err);
              }
            });
          }}
          onCloseDeleteGroupConfirm={() => setIsDeleteGroupConfirmOpen(false)}
          onConfirmDeleteGroup={() => {
            void handleConfirmDeleteGroup();
          }}
        />


        <style>
          {`
          @keyframes conciliaai-groups-spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes conciliaai-groups-pulse {
            0% {
              transform: scale(0.92);
              opacity: 0.45;
            }
            50% {
              transform: scale(1.02);
              opacity: 1;
            }
            100% {
              transform: scale(0.92);
              opacity: 0.45;
            }
          }

          @keyframes conciliaai-groups-bar {
            0% {
              transform: translateX(-120%);
            }
            100% {
              transform: translateX(320%);
            }
          }

          @keyframes conciliaai-groups-lane-reflow {
            0% {
              transform: translateX(-8px) scale(0.995);
              filter: saturate(0.96);
            }
            45% {
              transform: translateX(6px) scale(1.003);
              filter: saturate(1.02);
            }
            100% {
              transform: translateX(0px) scale(1);
              filter: saturate(1);
            }
          }

          @keyframes conciliaai-group-enter {
            0% {
              opacity: 0;
              transform: translateY(14px) scale(0.96);
            }
            60% {
              opacity: 1;
              transform: translateY(-4px) scale(1.05);
            }
            100% {
              opacity: 1;
              transform: translateY(-6px) scale(1.04);
            }
          }

          @keyframes conciliaai-group-shift {
            0% {
              transform: translateX(-4px) scale(0.992);
            }
            50% {
              transform: translateX(6px) scale(1);
            }
            100% {
              transform: translateX(0px) scale(1);
            }
          }

          @keyframes conciliaai-group-pop {
            0% {
              transform: scale(0.92);
              opacity: 0.4;
            }
            50% {
              transform: scale(1.08);
              opacity: 1;
            }
            100% {
              transform: scale(1.04);
              opacity: 1;
            }
          }

          @keyframes conciliaai-group-glow {
            0% {
              box-shadow: 0 0 0 2px rgba(91,140,255,0.25), 0 0 10px rgba(91,140,255,0.2);
            }
            50% {
              box-shadow: 0 0 0 2px rgba(91,140,255,0.45), 0 0 40px rgba(91,140,255,0.6);
            }
            100% {
              box-shadow: 0 0 0 2px rgba(91,140,255,0.25), 0 0 10px rgba(91,140,255,0.2);
            }
          }

          @keyframes conciliaai-groups-hero-aura {
            0% {
              background-position: 0% 50%;
              box-shadow: 0 24px 58px rgba(2,6,23,0.32), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 rgba(59,130,246,0);
            }
            50% {
              background-position: 100% 50%;
              box-shadow: 0 28px 70px rgba(2,6,23,0.38), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 42px rgba(59,130,246,0.16);
            }
            100% {
              background-position: 0% 50%;
              box-shadow: 0 24px 58px rgba(2,6,23,0.32), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 rgba(59,130,246,0);
            }
          }

          @keyframes conciliaai-groups-section-breathe {
            0%,
            100% {
              filter: saturate(1);
            }
            50% {
              filter: saturate(1.08);
            }
          }

          @keyframes conciliaai-groups-action-idle {
            0%,
            100% {
              transform: translateY(0) scale(1);
            }
            50% {
              transform: translateY(-4px) scale(1.025);
            }
          }

          @keyframes conciliaai-groups-create-pulse {
            0%,
            100% {
              box-shadow: 0 12px 28px rgba(46,78,166,0.22), 0 8px 18px rgba(15,23,42,0.16), inset 0 1px 0 rgba(255,255,255,0.14);
            }
            50% {
              box-shadow: 0 18px 44px rgba(59,130,246,0.36), 0 10px 24px rgba(15,23,42,0.22), inset 0 1px 0 rgba(255,255,255,0.18);
            }
          }

          @keyframes conciliaai-groups-card-shine {
            0% {
              background-position: -120% 0;
            }
            100% {
              background-position: 220% 0;
            }
          }
        `}
        </style>
      </div>
    </div>
  );
}

/*
=====================================================
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com
=====================================================

MudanÃ§a feita nesta etapa:

âœ” Subi os atalhos principais para o topo em formato quadrado
âœ” Adicionei hover com o nome de cada aÃ§Ã£o
âœ” Adicionei clique abrindo uma janela com as informaÃ§Ãµes
âœ” Removi da Ã¡rea fixa de baixo os blocos de Pessoas, Base, LanÃ§ar despesa, Resumo e HistÃ³rico
âœ” No lugar deixei a Ã¡rea inferior mais limpa e focada no dashboard
âœ” Mantive os modais jÃ¡ existentes do projeto sem quebrar o fluxo
âœ” Mantive criaÃ§Ã£o de grupo, atualizaÃ§Ã£o e seleÃ§Ã£o funcionando
*/














