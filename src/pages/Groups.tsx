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
    newGroupName,
    setNewGroupName,
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
  // STATE: criar grupo
  // ==============================

  const [createGroupError, setCreateGroupError] = useState<string | null>(null);
  const [createGroupSuccess, setCreateGroupSuccess] = useState<string | null>(null);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false); // Modal de criação de grupo

  const {
    isTransitionVisible,
    startCreateTransition,
  } = useGroupsCreateTransition({
    closeModal: () => {
      setIsCreateGroupModalOpen(false); // Fecha o modal depois do sucesso
      setCreateGroupError(null); // Limpa erro da criação
      setCreateGroupSuccess(null); // Limpa feedback de sucesso do modal
      setNewGroupName(""); // Limpa nome para próxima criação
    },
  });

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
    setCreateGroupError,
    setCreateGroupSuccess,
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
  // EFFECT: reset visual ao trocar grupo
  // ==============================

  useEffect(() => {
    closeCreateExpenseModal();
    closeBaseConfigModal();
    handleCloseEditExpenseModal();

    setCreateGroupError(null);
    setCreateGroupSuccess(null);
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
  // EFFECT: fecha modal ao criar grupo com sucesso
  // ==============================

  useEffect(() => {
    if (!createGroupSuccess) return;

    setIsCreateGroupModalOpen(false); // Fecha o modal ao criar com sucesso
    setNewGroupName(""); // Limpa o campo para próxima criação
  }, [createGroupSuccess, setNewGroupName]);

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

    setCreateGroupSuccess(null);
    setCreateGroupError(null);

    clearExpenseFeedback();

    setAddMemberSuccess(null);
    setAddMemberError(null);
    setRemoveMemberError(null);

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
                disabled={state.loading}
                style={{
                  ...ghostButton,
                  cursor: state.loading ? "not-allowed" : "pointer",
                  opacity: state.loading ? 0.7 : 1,
                }}
              >
                {state.loading ? "Atualizando..." : "Atualizar grupos"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreateGroupError(null);
                  setCreateGroupSuccess(null);
                  setNewGroupName("");
                  setIsCreateGroupModalOpen(true);
                }}
                disabled={creatingGroup}
                style={{
                  ...primaryButton,
                  cursor: creatingGroup ? "not-allowed" : "pointer",
                  opacity: creatingGroup ? 0.7 : 1,
                }}
              >
                {creatingGroup ? "Criando..." : "+ Novo grupo"}
              </button>
            </div>
          </div>

          {(createGroupError || createGroupSuccess) && (
            <div style={{ display: "grid", gap: 6, marginTop: 14 }}>
              {createGroupError && (
                <div style={{ ...subtleText, opacity: 0.95 }}>
                  <strong>Falha:</strong> {createGroupError}
                </div>
              )}

              {createGroupSuccess && (
                <div style={{ ...subtleText, opacity: 0.95 }}>
                  ✅ {createGroupSuccess}
                </div>
              )}
            </div>
          )}
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
                        border: active
                          ? "1px solid rgba(117,154,255,0.30)"
                          : "1px solid rgba(255,255,255,0.08)",
                        background: active
                          ? "linear-gradient(180deg, rgba(92,132,255,0.16) 0%, rgba(255,255,255,0.03) 100%)"
                          : "rgba(255,255,255,0.02)",
                        color: "inherit",
                        boxShadow: active ? "0 12px 28px rgba(47,84,235,0.12)" : "none",
                        minWidth: 220,
                        flexShrink: 0,
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
                          <div style={subtleText}>{active ? "Selecionado" : "Clique para abrir"}</div>
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
                      ? "Crie seu primeiro grupo no botão do topo para começar."
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
                    ? "Use o botão “+ Novo grupo” no topo para criar seu primeiro grupo."
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
            background: "rgba(2,6,23,0.10)",
            backdropFilter: "blur(2px)",
            pointerEvents: "none",
            opacity: 1,
            transition: "opacity 0.25s ease",
          }}
        />
      )}

      <GroupsCreateModal
        open={isCreateGroupModalOpen}
        value={newGroupName}
        loading={creatingGroup}
        error={createGroupError}
        success={createGroupSuccess}
        onChange={setNewGroupName}
        onClose={() => {
          setIsCreateGroupModalOpen(false);
          setCreateGroupError(null);
          setCreateGroupSuccess(null);
          setNewGroupName("");
        }}
        onCreate={async () => {
          await startCreateTransition(async () => {
            await Promise.resolve(
              onCreateGroup({
                newGroupName,
              }),
            );

            setAnimate(false);

            window.setTimeout(() => {
              setAnimationKey((prev) => prev + 1);
              setAnimate(true);
            }, 60);
          });
        }}
      />
    </div>
  );
}

/*
=====================================================
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com
=====================================================

Mudança feita nesta etapa:

✔ Removido o loader central anterior
✔ Criada animação real por blocos
✔ Hero, lista de grupos, métricas e cards entram em cascata
✔ Efeito com rotação leve, blur saindo e subida
✔ Reforçada a animação após criar grupo
✔ Mantido o Groups.tsx sem lógica pesada nova
*/