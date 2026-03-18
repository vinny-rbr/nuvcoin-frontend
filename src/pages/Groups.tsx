import { useEffect, useMemo, useState } from "react"; // Hooks do React
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js"; // Elementos principais do Chart.js

import GroupsBaseCard from "./groups/components/GroupsBaseCard"; // Card da base do grupo
import GroupsBaseModal from "./groups/components/GroupsBaseModal"; // Modal da base do grupo
import GroupsDivisionChart from "./groups/components/GroupsDivisionChart"; // Gráfico de divisão
import GroupsEditExpenseModal from "./groups/components/GroupsEditExpenseModal"; // Modal de editar despesa
import GroupsExpensesModal from "./groups/components/GroupsExpensesModal"; // Modal de adicionar despesa
import GroupsHistoryCard from "./groups/components/GroupsHistoryCard"; // Card de histórico
import GroupsMetrics from "./groups/components/GroupsMetrics"; // Cards de métricas
import GroupsMonthSummary from "./groups/components/GroupsMonthSummary"; // Resumo do mês
import GroupsPeopleCard from "./groups/components/GroupsPeopleCard"; // Card de pessoas
import GroupsSidebar from "./groups/components/GroupsSidebar"; // Sidebar de grupos

import useGroupsActions from "./groups/hooks/useGroupsActions"; // Hook de ações do módulo
import useGroupsBaseConfig from "./groups/hooks/useGroupsBaseConfig"; // Hook da base salarial / percentual
import { useGroupsCalculations } from "./groups/hooks/useGroupsCalculations"; // Hook de cálculos do dashboard
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
  sidebarCard,
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
  }, [groups, loadingGroups, error]); // Mantém compatibilidade com a sidebar atual

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
  }); // Hook que concentra estados de formulário reaproveitáveis

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
  } = useGroupsModals(); // Hook que centraliza abertura e fechamento dos modais

  // ==============================
  // STATE: criar grupo
  // ==============================

  const [createGroupError, setCreateGroupError] = useState<string | null>(null); // Erro ao criar grupo
  const [createGroupSuccess, setCreateGroupSuccess] = useState<string | null>(null); // Sucesso ao criar grupo

  // ==============================
  // STATE: members
  // ==============================

  const [addMemberOpen, setAddMemberOpen] = useState(false); // Form de adicionar membro aberto?
  const [addMemberUserId, setAddMemberUserId] = useState(""); // UserId digitado
  const [addMemberError, setAddMemberError] = useState<string | null>(null); // Erro ao adicionar membro
  const [addMemberSuccess, setAddMemberSuccess] = useState<string | null>(null); // Sucesso ao adicionar membro
  const [removeMemberError, setRemoveMemberError] = useState<string | null>(null); // Erro ao remover membro

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
  }); // Hook que centraliza os estados e handlers das despesas

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
  }); // Hook que centraliza toda a lógica da base do grupo

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
  }); // Hook que centraliza estado e fluxo da edição

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
  }); // Hook que concentra os handlers grandes de CRUD e feedbacks

  // ==============================
  // EFFECT: reset visual ao trocar grupo
  // ==============================

  useEffect(() => {
    closeCreateExpenseModal(); // Fecha modal de despesas
    closeBaseConfigModal(); // Fecha modal da base
    handleCloseEditExpenseModal(); // Fecha modal de edição

    setCreateGroupError(null); // Limpa erro de criação
    setCreateGroupSuccess(null); // Limpa sucesso de criação
    setAddMemberError(null); // Limpa erro de adicionar membro
    setAddMemberSuccess(null); // Limpa sucesso de adicionar membro
    setRemoveMemberError(null); // Limpa erro de remover membro

    clearExpenseFeedback(); // Limpa feedback do modal de despesas
    clearBaseFeedback(); // Limpa feedback do modal da base
    clearEditFeedback(); // Limpa feedback do modal de edição
  }, [selectedGroupId]); // Executa ao trocar grupo

  // ==============================
  // UI data via hook
  // ==============================

  const {
    members,
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
  }); // Hook que centraliza métricas, divisão e gráfico

  function handleSelectGroup(group: GroupDto) {
    selectGroup(group.id); // Seleciona id do grupo no hook

    setCreateGroupSuccess(null); // Limpa sucesso de criação
    setCreateGroupError(null); // Limpa erro de criação

    clearExpenseFeedback(); // Limpa feedback das despesas

    setAddMemberSuccess(null); // Limpa sucesso de membro
    setAddMemberError(null); // Limpa erro de membro
    setRemoveMemberError(null); // Limpa erro de remoção

    setSalaryError(null); // Limpa erro do modal base
    setSalarySuccess(null); // Limpa sucesso do modal base

    clearEditFeedback(); // Limpa feedback da edição

    closeCreateExpenseModal(); // Fecha modal despesas
    closeBaseConfigModal(); // Fecha modal base
    handleCloseEditExpenseModal(); // Fecha modal edição
  }

  return (
    <div style={shellStyle}>
      <div style={pageHeroStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, ...pillStyle, width: "fit-content" }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "#5b8cff", display: "inline-block" }} />
              NUVCOIN Groups
            </div>

            <div style={{ display: "grid", gap: 4 }}>
              <h2 style={{ margin: 0, fontSize: 30, lineHeight: 1.05, letterSpacing: -0.6 }}>Dashboard de grupos</h2>
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
                const el = document.getElementById("novo-grupo-input");
                el?.focus();
              }}
              style={primaryButton}
            >
              + Novo grupo
            </button>
          </div>
        </div>
      </div>

      {state.error && (
        <div style={{ ...sectionCard, border: "1px solid rgba(255,120,120,0.20)", background: "rgba(255,0,0,0.05)" }}>
          <strong>Falha:</strong> {state.error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "340px minmax(0, 1fr)", gap: 20, alignItems: "start" }}>
        <GroupsSidebar
          state={state}
          selectedGroupId={selectedGroupId}
          newGroupName={newGroupName}
          createGroupLoading={creatingGroup}
          createGroupError={createGroupError}
          createGroupSuccess={createGroupSuccess}
          onNewGroupNameChange={setNewGroupName}
          onCreateGroup={() => onCreateGroup({ newGroupName })}
          onRefreshGroups={() => reloadGroups()}
          onSelectGroup={handleSelectGroup}
          sidebarCard={sidebarCard}
          panelTitle={panelTitle}
          subtleText={subtleText}
          inputStyle={inputStyle}
          primaryButton={primaryButton}
          ghostButton={ghostButton}
          memberAvatarStyle={memberAvatarStyle}
        />

        <div style={{ display: "grid", gap: 18 }}>
          <div style={sectionCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 900, fontSize: 26, letterSpacing: -0.5 }}>{selectedGroupName ?? "Selecione um grupo"}</div>

                  {selectedGroupId && (
                    <div style={pillStyle}>
                      <span style={{ width: 8, height: 8, borderRadius: 999, background: "#3ddc84", display: "inline-block" }} />
                      Grupo ativo
                    </div>
                  )}
                </div>

                {selectedGroupId ? (
                  <div style={{ ...subtleText, fontSize: 13 }}>
                    {membersCount} pessoa(s) • mês atual {currentMonthKey} • modo {splitMode === "SALARY" ? "automático por salário" : "manual por percentual"}
                  </div>
                ) : (
                  <div style={{ ...subtleText, fontSize: 13 }}>Escolha um grupo da lateral para abrir o dashboard.</div>
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
                <div style={subtleText}>Crie um grupo na esquerda e clique nele para abrir o dashboard com pessoas, base do grupo, resumo do mês e histórico.</div>
              </div>
            </div>
          )}

          {selectedGroupId && (
            <>
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

              <div style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 18, alignItems: "start" }}>
                <div style={{ display: "grid", gap: 18 }}>
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

                <div style={{ display: "grid", gap: 18 }}>
                  <div style={sectionCard}>
                    <div style={{ display: "grid", gap: 14 }}>
                      <div style={{ display: "grid", gap: 4 }}>
                        <div style={panelTitle}>Lançar nova despesa</div>
                        <div style={subtleText}>Abra o modal para registrar conta do mês ou despesa avulsa com o mesmo fluxo que você já aprovou.</div>
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

                      {splitMode === "SALARY" && salaryTotal <= 0 && <div style={subtleText}>Dica: defina salários primeiro para o resumo do mês ficar certinho.</div>}

                      {splitMode === "MANUAL" && !isManualConfigValid && (
                        <div style={subtleText}>Dica: ajuste os percentuais manuais para 100% antes de conferir o resumo.</div>
                      )}
                    </div>
                  </div>

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
    </div>
  );
}

// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com
//
// Ajuste aplicado nesta etapa:
// - ✅ extraída a lógica do modal de edição para o hook useGroupsEditExpense
// - ✅ removidos do Groups.tsx o estado local de editLoading/editError/editSuccess
// - ✅ removida do Groups.tsx a lógica de open/close/focus/blur da edição
// - ✅ Groups.tsx ficou ainda mais como orquestrador de UI
//
// Próximo passo recomendado:
// - testar compilação
// - se passar, o próximo nível é extrair os estados/feedbacks de grupo e membros
// - aí o Groups.tsx fica quase totalmente declarativo