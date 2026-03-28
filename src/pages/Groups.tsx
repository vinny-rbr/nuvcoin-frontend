import { useEffect, useMemo, useState, type CSSProperties } from "react"; // Hooks do React
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js"; // Elementos principais do Chart.js

import GroupsDashboardContent from "./groups/components/GroupsDashboardContent";
import GroupsGroupsLane from "./groups/components/GroupsGroupsLane";
import GroupsHeaderActions from "./groups/components/GroupsHeaderActions";
import GroupsModalsHub from "./groups/components/GroupsModalsHub";

import useGroupsActions from "./groups/hooks/useGroupsActions"; // Hook de ações do módulo
import useGroupsBaseConfig from "./groups/hooks/useGroupsBaseConfig"; // Hook da base salarial / percentual
import { useGroupsCalculations } from "./groups/hooks/useGroupsCalculations"; // Hook de cálculos do dashboard
import { useGroupsCreateGroup } from "./groups/hooks/useGroupsCreateGroup"; // Hook dedicado à criação de grupo
import useGroupsCreateTransition from "./groups/hooks/useGroupsCreateTransition"; // Hook da transição visual ao criar grupo
import { useGroupsDashboard } from "./groups/hooks/useGroupsDashboard"; // Hook central do dashboard
import useGroupsEditExpense from "./groups/hooks/useGroupsEditExpense"; // Hook da edição de despesa
import useGroupsExpenses from "./groups/hooks/useGroupsExpenses"; // Hook das despesas do módulo
import useGroupsForms from "./groups/hooks/useGroupsForms"; // Hook de formulários do módulo
import useGroupsHeaderActions from "./groups/hooks/useGroupsHeaderActions";
import useGroupsModals from "./groups/hooks/useGroupsModals"; // Hook de modais do módulo

import type {
  GroupDto,
  GroupsApiState,
} from "./groups/types/groups.types"; // Tipos do módulo

import { safeName } from "./groups/utils/groups.helpers"; // Helpers do módulo

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
  pageHeroStyle,
  panelTitle,
  pillStyle,
  primaryButton,
  sectionCard,
  shellOuterStyle,
  shellStyle,
  softButton,
  subtleText,
  tabButton,
  timelineCard,
} from "./groups/styles/groups.styles"; // Estilos centralizados do módulo

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
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [addMemberSuccess, setAddMemberSuccess] = useState<string | null>(null);
  const [removeMemberError, setRemoveMemberError] = useState<string | null>(null);
  const [animate, setAnimate] = useState(false);
  const [animationKey, setAnimationKey] = useState(0); // força nova execução visual
  const [highlightGroupId, setHighlightGroupId] = useState<string | null>(null); // Destaca visualmente o grupo recém-criado
  const [pendingCreatedGroupName, setPendingCreatedGroupName] = useState<string | null>(null); // Guarda o nome do grupo recém-criado até a lista atualizar
  const [isGroupsLaneAnimating, setIsGroupsLaneAnimating] = useState(false); // Faz a faixa dos grupos reagir quando um novo grupo entra
  const [isSwitchingGroup, setIsSwitchingGroup] = useState(false); // Faz a troca entre grupos ficar suave
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
  });

  // ==============================
  // HOOK: edição de despesa
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
    selectedGroupName,
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
    closeCreateExpenseModal();
    closeBaseConfigModal();
    handleCloseEditExpenseModal();

    createGroup.close();
    setAddMemberError(null);
    setAddMemberSuccess(null);
    setRemoveMemberError(null);
    closeHeaderActionModal();

    clearExpenseFeedback();
    clearBaseFeedback();
    clearEditFeedback();
  }, [selectedGroupId]);

  // ==============================
  // EFFECT: animação ao entrar/trocar grupo
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
  // EFFECT: encontra e destaca o grupo recém-criado
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
    const delay = order * 90;

    return {
      opacity: animate ? 1 : 0,
      transform: animate
        ? "perspective(1200px) rotateX(0deg) rotateZ(0deg) translateY(0px) scale(1)"
        : "perspective(1200px) rotateX(14deg) rotateZ(-5deg) translateY(28px) scale(0.96)",
      transformOrigin: "top left",
      filter: animate ? "blur(0px)" : "blur(8px)",
      transition: `opacity 0.55s ease ${delay}ms, transform 0.78s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, filter 0.6s ease ${delay}ms`,
      willChange: "opacity, transform, filter",
    };
  }

  return (
    <div style={shellOuterStyle}>
      <div
        key={animationKey}
        style={{
          ...shellStyle,
        }}
      >
        <div style={getClockEntryStyle(0)}>
          <GroupsHeaderActions
            actions={headerQuickActions}
            pageHeroStyle={pageHeroStyle}
            pillStyle={pillStyle}
            subtleText={subtleText}
          />
        </div>
        {state.groups.length > 0 && (
          <div style={getClockEntryStyle(1)}>
            <GroupsGroupsLane
              groups={state.groups}
              selectedGroupId={selectedGroupId}
              highlightGroupId={highlightGroupId}
              isGroupsLaneAnimating={isGroupsLaneAnimating}
              onSelectGroup={handleSelectGroup}
              sectionCard={sectionCard}
              panelTitle={panelTitle}
              subtleText={subtleText}
              memberAvatarStyle={memberAvatarStyle}
            />
          </div>
        )}
        {state.error && (
          <div style={getClockEntryStyle(2)}>
            <div
              style={{
                ...sectionCard,
                border: "1px solid rgba(255,120,120,0.20)",
                background: "rgba(255,0,0,0.05)",
              }}
            >
              <strong>Falha:</strong> {state.error}
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
          onDeleteGroup={onDeleteGroup}
          getClockEntryStyle={getClockEntryStyle}
          sectionCard={sectionCard}
          panelTitle={panelTitle}
          subtleText={subtleText}
          pillStyle={pillStyle}
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
          submittingMember={submittingMember}
          addMemberError={addMemberError}
          addMemberSuccess={addMemberSuccess}
          removingMemberId={removingMemberId}
          salaryFilledCount={salaryFilledCount}
          membersCount={membersCount}
          salaryTotal={salaryTotal}
          manualPercentInputByUserId={manualPercentInputByUserId}
          salaryByUserId={salaryByUserId}
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
          onAddMember={() =>
            onAddMember({
              addMemberEmail,
              onSuccess: () => {
                setAddMemberEmail("");
                setAddMemberOpen(false);
              },
            })
          }
          onRemoveMember={(memberId, role) => onRemoveMember({ memberId, role })}
          onOpenBaseConfigFromHeaderAction={() => {
            closeHeaderActionModal();
            openBaseConfigModal();
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
        />


        <style>
          {`
          @keyframes nuvcoin-groups-spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          @keyframes nuvcoin-groups-pulse {
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

          @keyframes nuvcoin-groups-bar {
            0% {
              transform: translateX(-120%);
            }
            100% {
              transform: translateX(320%);
            }
          }

          @keyframes nuvcoin-groups-lane-reflow {
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

          @keyframes nuvcoin-group-enter {
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

          @keyframes nuvcoin-group-shift {
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

          @keyframes nuvcoin-group-pop {
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

          @keyframes nuvcoin-group-glow {
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

Mudança feita nesta etapa:

✔ Subi os atalhos principais para o topo em formato quadrado
✔ Adicionei hover com o nome de cada ação
✔ Adicionei clique abrindo uma janela com as informações
✔ Removi da área fixa de baixo os blocos de Pessoas, Base, Lançar despesa, Resumo e Histórico
✔ No lugar deixei a área inferior mais limpa e focada no dashboard
✔ Mantive os modais já existentes do projeto sem quebrar o fluxo
✔ Mantive criação de grupo, atualização e seleção funcionando
*/













