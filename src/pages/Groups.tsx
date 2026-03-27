import { useEffect, useMemo, useState, type CSSProperties } from "react"; // Hooks do React
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js"; // Elementos principais do Chart.js

import GroupsBaseCard from "./groups/components/GroupsBaseCard"; // Card da base do grupo
import GroupsBaseModal from "./groups/components/GroupsBaseModal"; // Modal da base do grupo
import GroupsCreateModal from "./groups/components/GroupsCreateModal"; // Modal profissional de criação de grupo
import GroupsDivisionChart from "./groups/components/GroupsDivisionChart"; // Gráfico de divisão
import GroupsEditExpenseModal from "./groups/components/GroupsEditExpenseModal"; // Modal de editar despesa
import GroupsExpensesModal from "./groups/components/GroupsExpensesModal"; // Modal de adicionar despesa
import GroupsHistoryCard from "./groups/components/GroupsHistoryCard"; // Card de histórico
import GroupsMetrics from "./groups/components/GroupsMetrics"; // Cards de métricas
import GroupsMonthSummary from "./groups/components/GroupsMonthSummary"; // Resumo do mês
import GroupsPeopleCard from "./groups/components/GroupsPeopleCard"; // Card de pessoas

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

import { getInitials, safeName } from "./groups/utils/groups.helpers"; // Helpers do módulo

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
    selectedExpenseId,
    openCreateExpenseModal,
    closeCreateExpenseModal,
    openEditExpenseModal,
    closeEditExpenseModal: closeEditExpenseModalState,
    openBaseConfigModal,
    closeBaseConfigModal,
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

    const timeoutId = window.setTimeout(() => {
      setHighlightGroupId((currentId) =>
        currentId === matchedGroup.id ? null : currentId,
      );
    }, 2200);

    return () => {
      window.clearTimeout(timeoutId);
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
    salaryWeights,
    manualPercentNumberByUserId,
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

  function handleSelectGroup(group: GroupDto) {
    selectGroup(group.id);

    createGroup.close();
    clearExpenseFeedback();

    setAddMemberSuccess(null);
    setAddMemberError(null);
    setRemoveMemberError(null);
    setHighlightGroupId(null);
    setPendingCreatedGroupName(null);

    setSalaryError(null);
    setSalarySuccess(null);

    clearEditFeedback();

    closeCreateExpenseModal();
    closeBaseConfigModal();
    handleCloseEditExpenseModal();
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
        <div style={pageHeroStyle}>
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
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  ...pillStyle,
                  width: "fit-content",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: "#5b8cff",
                    display: "inline-block",
                  }}
                />
                NUVCOIN Groups
              </div>

              <div style={{ display: "grid", gap: 4 }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 30,
                    lineHeight: 1.05,
                    letterSpacing: -0.6,
                  }}
                >
                  Dashboard de grupos
                </h2>
                <div style={{ ...subtleText, fontSize: 13 }}>
                  Crie grupos, adicione pessoas, defina salários ou percentuais e acompanhe tudo com um visual mais de produto SaaS.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => reloadGroups()}
                disabled={state.loading || isCreatingWithTransition}
                style={{
                  ...ghostButton,
                  cursor: state.loading || isCreatingWithTransition ? "not-allowed" : "pointer",
                  opacity: state.loading || isCreatingWithTransition ? 0.7 : 1,
                }}
              >
                {state.loading ? "Atualizando..." : "Atualizar grupos"}
              </button>

              <button
                type="button"
                onClick={createGroup.open}
                disabled={createGroup.loading || creatingGroup || isCreatingWithTransition}
                style={{
                  ...primaryButton,
                  cursor:
                    createGroup.loading || creatingGroup || isCreatingWithTransition
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    createGroup.loading || creatingGroup || isCreatingWithTransition ? 0.7 : 1,
                }}
              >
                {createGroup.loading || creatingGroup || isCreatingWithTransition
                  ? "Criando..."
                  : "+ Novo grupo"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {state.groups.length > 0 && (
        <div style={getClockEntryStyle(1)}>
          <div style={sectionCard}>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "grid", gap: 2 }}>
                  <div style={panelTitle}>Meus grupos</div>
                  <div style={subtleText}>{state.groups.length} grupo(s) encontrado(s)</div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  overflowX: "auto",
                  paddingBottom: 4,
                }}
              >
                {state.groups.map((g) => {
                  const active = g.id === selectedGroupId;
                  const isHighlight = g.id === highlightGroupId;

                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => handleSelectGroup(g)}
                      style={{
                        cursor: "pointer",
                        textAlign: "left",
                        padding: "12px 16px",
                        borderRadius: 18,
                        border: isHighlight
                          ? "1px solid rgba(91,140,255,0.95)"
                          : active
                          ? "1px solid rgba(117,154,255,0.30)"
                          : "1px solid rgba(255,255,255,0.08)",
                        background: isHighlight
                          ? "linear-gradient(180deg, rgba(91,140,255,0.36) 0%, rgba(255,255,255,0.06) 100%)"
                          : active
                          ? "linear-gradient(180deg, rgba(92,132,255,0.16) 0%, rgba(255,255,255,0.03) 100%)"
                          : "rgba(255,255,255,0.02)",
                        color: "inherit",
                        boxShadow: isHighlight
                          ? "0 0 0 2px rgba(91,140,255,0.35), 0 0 40px rgba(91,140,255,0.55), 0 20px 60px rgba(91,140,255,0.45)"
                          : active
                          ? "0 12px 28px rgba(47,84,235,0.12)"
                          : "none",
                        minWidth: 220,
                        flexShrink: 0,
                        transform: isHighlight
                          ? "scale(1.04)"
                          : active
                          ? "scale(1.01)"
                          : "scale(1)",
                        animation: isHighlight
                          ? "nuvcoin-group-pop 0.6s ease, nuvcoin-group-glow 1.8s ease-in-out infinite"
                          : "none",
                        transition:
                          "border 0.35s ease, background 0.35s ease, box-shadow 0.45s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={memberAvatarStyle}>{getInitials(g.name)}</div>

                        <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 900,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {g.name}
                          </div>
                          <div style={subtleText}>
                            {isHighlight
                              ? "Recém-criado"
                              : active
                              ? "Selecionado"
                              : "Clique para abrir"}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
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
        <div style={{ display: "grid", gap: 18 }}>
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
                    onClick={() => {
                      prepareHouseExpenseFlow();
                      openCreateExpenseModal();
                    }}
                    style={primaryButton}
                  >
                    + Adicionar despesa
                  </button>

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
                    ? 'Use o botão “+ Novo grupo” no topo para criar seu primeiro grupo.'
                    : "Selecione um grupo na barra superior para abrir o dashboard com pessoas, base do grupo, resumo do mês e histórico."}
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

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.05fr 0.95fr",
                  gap: 18,
                  alignItems: "start",
                }}
              >
                <div style={{ display: "grid", gap: 18 }}>
                  <div style={getClockEntryStyle(6)}>
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
                      onToggleAddMember={() => setAddMemberOpen((v) => !v)}
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
                      sectionCard={sectionCard}
                      panelTitle={panelTitle}
                      subtleText={subtleText}
                      softButton={softButton}
                      ghostButton={ghostButton}
                      primaryButton={primaryButton}
                      inputStyle={inputStyle}
                      memberAvatarStyle={memberAvatarStyle}
                    />
                  </div>

                  <div style={getClockEntryStyle(7)}>
                    <GroupsBaseCard
                      balances={balances}
                      splitMode={splitMode}
                      salaryFilledCount={salaryFilledCount}
                      salaryTotal={salaryTotal}
                      manualPercentTotal={manualPercentTotal}
                      isManualConfigValid={isManualConfigValid}
                      salaryByUserId={salaryByUserId}
                      salaryWeights={salaryWeights}
                      manualPercentNumberByUserId={manualPercentNumberByUserId}
                      selectedGroupId={selectedGroupId}
                      onOpenBaseModal={() => {
                        clearBaseFeedback();
                        openBaseConfigModal();
                      }}
                      sectionCard={sectionCard}
                      panelTitle={panelTitle}
                      subtleText={subtleText}
                      softButton={softButton}
                      memberAvatarStyle={memberAvatarStyle}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gap: 18 }}>
                  <div style={getClockEntryStyle(8)}>
                    <div style={sectionCard}>
                      <div style={{ display: "grid", gap: 14 }}>
                        <div style={{ display: "grid", gap: 4 }}>
                          <div style={panelTitle}>Lançar nova despesa</div>
                          <div style={subtleText}>
                            Abra o modal para registrar conta do mês ou despesa avulsa com o mesmo fluxo que você já aprovou.
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => {
                              prepareHouseExpenseFlow();
                              openCreateExpenseModal();
                            }}
                            disabled={!selectedGroupId}
                            style={{
                              ...primaryButton,
                              cursor: !selectedGroupId ? "not-allowed" : "pointer",
                              opacity: !selectedGroupId ? 0.7 : 1,
                            }}
                          >
                            Abrir modal
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              prepareQuickExpenseFlow();
                              openCreateExpenseModal();
                            }}
                            disabled={!selectedGroupId}
                            style={{
                              ...ghostButton,
                              cursor: !selectedGroupId ? "not-allowed" : "pointer",
                              opacity: !selectedGroupId ? 0.7 : 1,
                            }}
                          >
                            Despesa avulsa
                          </button>
                        </div>

                        {splitMode === "SALARY" && salaryTotal <= 0 && (
                          <div style={subtleText}>
                            Dica: defina salários primeiro para o resumo do mês ficar certinho.
                          </div>
                        )}

                        {splitMode === "MANUAL" && !isManualConfigValid && (
                          <div style={subtleText}>
                            Dica: ajuste os percentuais manuais para 100% antes de conferir o resumo.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={getClockEntryStyle(9)}>
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
                      onRefreshExpenses={() => reloadSelectedGroupData()}
                      recommendedLimitPercent={RECOMMENDED_LIMIT_PERCENT}
                      sectionCard={sectionCard}
                      panelTitle={panelTitle}
                      subtleText={subtleText}
                      ghostButton={ghostButton}
                    />
                  </div>
                </div>
              </div>

              <div style={getClockEntryStyle(10)}>
                <GroupsHistoryCard
                  selectedGroupId={selectedGroupId}
                  expensesLoading={loadingDetails}
                  expensesError={null}
                  historyItems={historyItems}
                  deleteExpenseLoadingId={deletingExpenseId}
                  balancesLoading={loadingDetails}
                  onRefreshExpenses={() => reloadSelectedGroupData()}
                  onOpenEditExpense={handleOpenEditExpenseModal}
                  onDeleteExpenseFromHistory={onDeleteExpenseFromHistory}
                  sectionCard={sectionCard}
                  panelTitle={panelTitle}
                  subtleText={subtleText}
                  ghostButton={ghostButton}
                  dangerButtonSmall={dangerButtonSmall}
                  timelineCard={timelineCard}
                  memberAvatarStyle={memberAvatarStyle}
                />
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

      {isTransitionVisible && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1200,
            background: "rgba(2,6,23,0.14)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            opacity: 1,
            transition: "opacity 0.25s ease, background 0.25s ease, backdrop-filter 0.25s ease",
          }}
        >
          <div
            style={{
              minWidth: 280,
              maxWidth: 340,
              borderRadius: 24,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "linear-gradient(180deg, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.78) 100%)",
              boxShadow: "0 18px 52px rgba(0,0,0,0.26), 0 0 0 1px rgba(91,140,255,0.08)",
              padding: "24px 22px",
              display: "grid",
              gap: 16,
              justifyItems: "center",
              textAlign: "center",
            }}
          >
            <div
              style={{
                position: "relative",
                width: 72,
                height: 72,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: "4px solid rgba(255,255,255,0.08)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  borderTop: "4px solid #5b8cff",
                  borderRight: "4px solid transparent",
                  borderBottom: "4px solid transparent",
                  borderLeft: "4px solid transparent",
                  animation: "nuvcoin-groups-spin 0.9s linear infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 12,
                  borderRadius: "50%",
                  border: "3px solid rgba(91,140,255,0.14)",
                  animation: "nuvcoin-groups-pulse 1.2s ease-in-out infinite",
                }}
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: -0.3,
                }}
              >
                Criando grupo
              </div>
              <div style={{ ...subtleText, fontSize: 13 }}>
                Organizando os dados e atualizando seu dashboard...
              </div>
            </div>

            <div
              style={{
                width: "100%",
                height: 6,
                borderRadius: 999,
                overflow: "hidden",
                background: "rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  width: "42%",
                  height: "100%",
                  borderRadius: 999,
                  background: "linear-gradient(90deg, rgba(91,140,255,0.38) 0%, rgba(91,140,255,0.92) 100%)",
                  animation: "nuvcoin-groups-bar 1s ease-in-out infinite",
                }}
              />
            </div>
          </div>
        </div>
      )}

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

              setAnimate(false);

              window.setTimeout(() => {
                setAnimationKey((prev) => prev + 1);
                setAnimate(true);
              }, 60);
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

✔ Mantido o overlay leve na criação do grupo
✔ Melhorado o destaque do grupo recém-criado
✔ Adicionado glow animado no card recém-criado
✔ Ajustado o scale do highlight para ficar mais premium
✔ Mantido o restante do fluxo sem quebrar nada
*/