import { useEffect, useMemo, useState, type CSSProperties } from "react"; // Hooks do React
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js"; // Elementos principais do Chart.js

import GroupsBaseModal from "./groups/components/GroupsBaseModal"; // Modal da base do grupo
import GroupsCreateModal from "./groups/components/GroupsCreateModal"; // Modal profissional de criação de grupo
import GroupsCreateTransitionOverlay from "./groups/components/GroupsCreateTransitionOverlay";
import GroupsDivisionChart from "./groups/components/GroupsDivisionChart"; // Gráfico de divisão
import GroupsEditExpenseModal from "./groups/components/GroupsEditExpenseModal"; // Modal de editar despesa
import GroupsExpensesModal from "./groups/components/GroupsExpensesModal"; // Modal de adicionar despesa
import GroupsGroupsLane from "./groups/components/GroupsGroupsLane";
import GroupsHeaderActionModal from "./groups/components/GroupsHeaderActionModal";
import GroupsHeaderActions from "./groups/components/GroupsHeaderActions";
import GroupsMetrics from "./groups/components/GroupsMetrics"; // Cards de métricas

import useGroupsActions from "./groups/hooks/useGroupsActions"; // Hook de ações do módulo
import useGroupsBaseConfig from "./groups/hooks/useGroupsBaseConfig"; // Hook da base salarial / percentual
import { useGroupsCalculations } from "./groups/hooks/useGroupsCalculations"; // Hook de cálculos do dashboard
import { useGroupsCreateGroup } from "./groups/hooks/useGroupsCreateGroup"; // Hook dedicado à criação de grupo
import useGroupsCreateTransition from "./groups/hooks/useGroupsCreateTransition"; // Hook da transição visual ao criar grupo
import { useGroupsDashboard } from "./groups/hooks/useGroupsDashboard"; // Hook central do dashboard
import useGroupsEditExpense from "./groups/hooks/useGroupsEditExpense"; // Hook da edição de despesa
import useGroupsExpenses from "./groups/hooks/useGroupsExpenses"; // Hook das despesas do módulo
import useGroupsForms from "./groups/hooks/useGroupsForms"; // Hook de formulários do módulo
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
  shellStyle,
  softButton,
  subtleText,
  tabButton,
  timelineCard,
} from "./groups/styles/groups.styles"; // Estilos centralizados do módulo

ChartJS.register(ArcElement, Tooltip, Legend); // Registra componentes do Chart.js

type HeaderQuickActionId =
  | "refresh"
  | "create"
  | "people"
  | "base"
  | "expense"
  | "summary"
  | "history"; // Ações quadradas do topo

type HeaderQuickAction = {
  id: HeaderQuickActionId; // Identificador da ação
  icon: string; // Símbolo visual dentro do quadrado
  label: string; // Nome que aparece no hover
  disabled?: boolean; // Controla bloqueio quando necessário
  loading?: boolean; // Controla estado visual de carregamento
  onClick: () => void; // Clique da ação
};

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
  const [addMemberUserId, setAddMemberUserId] = useState("");
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

  const headerQuickActions: HeaderQuickAction[] = [
    {
      id: "refresh",
      icon: "↻",
      label: state.loading ? "Atualizando grupos..." : "Atualizar grupos",
      disabled: state.loading || isCreatingWithTransition,
      loading: state.loading,
      onClick: () => {
        reloadGroups();
      },
    },
    {
      id: "create",
      icon: "+",
      label:
        createGroup.loading || creatingGroup || isCreatingWithTransition
          ? "Criando grupo..."
          : "Novo grupo",
      disabled: createGroup.loading || creatingGroup || isCreatingWithTransition,
      loading: createGroup.loading || creatingGroup || isCreatingWithTransition,
      onClick: () => {
        createGroup.open();
      },
    },
    {
      id: "people",
      icon: "👥",
      label: "Pessoas",
      disabled: !selectedGroupId,
      onClick: () => {
        openHeaderActionModal("people");
        setAddMemberError(null);
        setAddMemberSuccess(null);
      },
    },
    {
      id: "base",
      icon: "%",
      label: "Base do grupo",
      disabled: !selectedGroupId,
      onClick: () => {
        openHeaderActionModal("base");
        clearBaseFeedback();
      },
    },
    {
      id: "expense",
      icon: "R$",
      label: "Lançar despesa",
      disabled: !selectedGroupId,
      onClick: () => {
        openHeaderActionModal("expense");
      },
    },
    {
      id: "summary",
      icon: "Σ",
      label: "Resumo do mês",
      disabled: !selectedGroupId,
      onClick: () => {
        openHeaderActionModal("summary");
      },
    },
    {
      id: "history",
      icon: "⏱",
      label: "Histórico",
      disabled: !selectedGroupId,
      onClick: () => {
        openHeaderActionModal("history");
      },
    },
  ]; // Quadrados do topo que substituem os cards inferiores

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

      <div style={getClockEntryStyle(3)}>
        <div
          style={{
            display: "grid",
            gap: 18,
            opacity: isSwitchingGroup ? 0 : 1,
            transform: isSwitchingGroup ? "translateY(6px)" : "translateY(0px)",
            transition: "opacity 0.25s ease, transform 0.25s ease",
          }}
        >
          <div style={sectionCard}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 900, fontSize: 26, letterSpacing: -0.5 }}>
                    {selectedGroupName ?? "Selecione um grupo"}
                  </div>

                  {selectedGroupId && (
                    <div style={pillStyle}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 999,
                          background: "#3ddc84",
                          display: "inline-block",
                        }}
                      />
                      Grupo ativo
                    </div>
                  )}
                </div>

                {selectedGroupId ? (
                  <div style={{ ...subtleText, fontSize: 13 }}>
                    {membersCount} pessoa(s) • mês atual {currentMonthKey} • modo{" "}
                    {splitMode === "SALARY" ? "automático por salário" : "manual por percentual"}
                  </div>
                ) : (
                  <div style={{ ...subtleText, fontSize: 13 }}>
                    {state.groups.length === 0
                      ? 'Crie seu primeiro grupo no botão do topo para começar.'
                      : "Escolha um grupo na barra superior para abrir o dashboard."}
                  </div>
                )}
              </div>

              {selectedGroupId && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={onDeleteGroup}
                    disabled={deletingGroupId === selectedGroupId}
                    style={{
                      ...dangerButtonSmall,
                      cursor: deletingGroupId === selectedGroupId ? "not-allowed" : "pointer",
                      opacity: deletingGroupId === selectedGroupId ? 0.7 : 1,
                    }}
                  >
                    {deletingGroupId === selectedGroupId ? "Excluindo..." : "Excluir grupo"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {!selectedGroupId && (
            <div style={sectionCard}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={panelTitle}>Comece por um grupo</div>
                <div style={subtleText}>
                  {state.groups.length === 0
                    ? 'Use o botão quadrado “+” no topo para criar seu primeiro grupo.'
                    : "Selecione um grupo na barra superior para abrir o dashboard."}
                </div>
              </div>
            </div>
          )}

          {selectedGroupId && (
            <>
              <div style={getClockEntryStyle(4)}>
                <GroupsMetrics
                  monthTotalCents={monthTotalCents}
                  monthExpensesCount={monthExpenses.length}
                  membersCount={membersCount}
                  averagePerPersonCents={averagePerPersonCents}
                  highestBurden={highestBurden}
                  recommendedLimitPercent={RECOMMENDED_LIMIT_PERCENT}
                  subtleText={subtleText}
                  metricCard={metricCard}
                />
              </div>

              <div style={getClockEntryStyle(5)}>
                <GroupsDivisionChart
                  splitMode={splitMode}
                  canCalculateMonthSplit={canCalculateMonthSplit}
                  monthTotalCents={monthTotalCents}
                  monthSplit={monthSplit}
                  monthSplitChartColors={monthSplitChartColors}
                  monthSplitChartData={monthSplitChartData}
                  monthSplitChartOptions={monthSplitChartOptions}
                  sectionCard={sectionCard}
                  panelTitle={panelTitle}
                  subtleText={subtleText}
                />
              </div>

              <div style={getClockEntryStyle(6)}>
                <div style={sectionCard}>
                  <div style={{ display: "grid", gap: 14 }}>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={panelTitle}>Dashboard</div>
                      <div style={subtleText}>
                        Os atalhos de pessoas, base, despesas, resumo e histórico agora ficam no topo em formato quadrado.
                      </div>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          padding: 16,
                          borderRadius: 18,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.02)",
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: 15 }}>Grupo</div>
                        <div style={subtleText}>{selectedGroupName ?? "Sem grupo selecionado"}</div>
                      </div>

                      <div
                        style={{
                          padding: 16,
                          borderRadius: 18,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.02)",
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: 15 }}>Membros</div>
                        <div style={subtleText}>{membersCount} pessoa(s)</div>
                      </div>

                      <div
                        style={{
                          padding: 16,
                          borderRadius: 18,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.02)",
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: 15 }}>Modo</div>
                        <div style={subtleText}>
                          {splitMode === "SALARY" ? "Automático por salário" : "Manual por percentual"}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: 16,
                          borderRadius: 18,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.02)",
                          display: "grid",
                          gap: 6,
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: 15 }}>Últimas despesas</div>
                        <div style={subtleText}>{historyItems.length} item(ns) no histórico</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

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
        onClose={closeCreateExpenseModal}
        onChangeTab={setExpensesTab}
        onHouseNameChange={setHouseName}
        onHouseAmountChange={setHouseAmountBRL}
        onHouseDateChange={setHouseDate}
        onHouseAmountFocus={handleHouseAmountFocus}
        onHouseAmountBlur={handleHouseAmountBlur}
        onCreateHouseExpense={() =>
          onCreateHouseExpense({
            houseName,
            houseAmountBRL,
            houseDate,
            housePaidByUserId,
          })
        }
        onQuickDescChange={setQuickDesc}
        onQuickAmountChange={setQuickAmountBRL}
        onQuickDateChange={setQuickDate}
        onQuickAmountFocus={handleQuickAmountFocus}
        onQuickAmountBlur={handleQuickAmountBlur}
        onCreateQuickExpense={() =>
          onCreateQuickExpense({
            quickDesc,
            quickAmountBRL,
            quickDate,
            quickPaidByUserId,
          })
        }
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
        onClose={handleCloseEditExpenseModal}
        onEditDescChange={setEditingExpenseTitle}
        onEditAmountChange={setEditingExpenseAmount}
        onEditDateChange={setEditingExpenseDate}
        onEditAmountFocus={() => handleEditAmountFocus(editingExpenseAmount, setEditingExpenseAmount)}
        onEditAmountBlur={() => handleEditAmountBlur(editingExpenseAmount, setEditingExpenseAmount)}
        onSave={() =>
          onSaveEditExpense({
            editingExpense,
            editingExpenseTitle,
            editingExpenseAmount,
            editingExpenseDate,
          })
        }
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
        recommendedLimitPercent={RECOMMENDED_LIMIT_PERCENT}
        onClose={closeBaseConfigModal}
        onSplitModeChange={onSplitModeChange}
        onSalaryChange={onSalaryChange}
        onSalaryBlur={onSalaryBlur}
        onManualPercentChange={onManualPercentChange}
        onManualPercentBlur={onManualPercentBlur}
        onResetSalaries={onResetSalaries}
        onSplitEqual={onSplitEqual}
        onSave={() =>
          onSaveBaseConfig(() => {
            closeBaseConfigModal();
          })
        }
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
        addMemberUserId={addMemberUserId}
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
        recommendedLimitPercent={RECOMMENDED_LIMIT_PERCENT}
        onClose={closeHeaderActionModal}
        onToggleAddMember={() => setAddMemberOpen((value) => !value)}
        onAddMemberUserIdChange={setAddMemberUserId}
        onAddMember={() =>
          onAddMember({
            addMemberUserId,
            onSuccess: () => {
              setAddMemberUserId("");
              setAddMemberOpen(false);
            },
          })
        }
        onRemoveMember={(memberId, role) => onRemoveMember({ memberId, role })}
        onOpenBaseConfigModal={() => {
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
        open={createGroup.isOpen}
        value={createGroup.name}
        loading={createGroup.loading || isCreatingWithTransition || creatingGroup}
        error={createGroup.error}
        success={createGroup.success}
        onChange={createGroup.setName}
        onClose={createGroup.close}
        onCreate={async () => {
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











