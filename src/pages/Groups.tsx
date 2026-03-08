import { useEffect, useMemo, useState } from "react"; // Hooks do React
import { ArcElement, Chart as ChartJS, Legend, Tooltip, type ChartOptions, type TooltipItem } from "chart.js"; // Elementos e tipos do Chart.js

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

import type {
  CreateGroupExpenseRequest,
  GroupBalancesResponse,
  GroupDto,
  GroupExpenseListItemDto,
  GroupExpensesListResponse,
  GroupMembersResponse,
  GroupsApiState,
  GroupSplitMode,
  UpdateGroupExpenseRequest,
} from "./groups/types/groups.types"; // Tipos do módulo

import {
  centsToBRLInput,
  currentMonthKeyUTC,
  formatBRL,
  formatBRLFromCents,
  getAuthTokenOrThrow,
  isGuid,
  isoToDateInput,
  monthKeyFromISO,
  monthLabelBR,
  normalizePercentInputText,
  percentNumberToInput,
  percentTextToNumber,
  safeName,
  toCentsFromBRLInput,
  toIsoForBackend,
} from "./groups/utils/groups.helpers"; // Helpers do módulo

import {
  buildDefaultManualPercentBase,
  loadStoredManualPercentBase,
  loadStoredSalaryBase,
  loadStoredSplitMode,
  numberMapToInputMap,
  saveStoredManualPercentBase,
  saveStoredSalaryBase,
  saveStoredSplitMode,
} from "./groups/utils/groups.storage"; // LocalStorage do módulo

import {
  createExpense,
  deleteExpense,
  fetchBalances,
  fetchExpenses,
  fetchGroups,
  fetchMembers,
  updateExpense,
} from "./groups/services/groups.api"; // Serviços de API do módulo

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
  // STATE: groups
  // ==============================

  const [state, setState] = useState<GroupsApiState>({
    groups: [],
    loading: true,
    error: null,
  }); // Estado principal dos grupos

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null); // Grupo selecionado
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null); // Nome do grupo selecionado

  // ==============================
  // STATE: criar grupo
  // ==============================

  const [newGroupName, setNewGroupName] = useState(""); // Nome digitado do novo grupo
  const [createGroupLoading, setCreateGroupLoading] = useState(false); // Loading ao criar grupo
  const [createGroupError, setCreateGroupError] = useState<string | null>(null); // Erro ao criar grupo
  const [createGroupSuccess, setCreateGroupSuccess] = useState<string | null>(null); // Sucesso ao criar grupo

  // ==============================
  // STATE: members
  // ==============================

  const [membersInfo, setMembersInfo] = useState<GroupMembersResponse | null>(null); // Resposta de membros
  const [membersLoading, setMembersLoading] = useState(false); // Loading de membros
  const [membersError, setMembersError] = useState<string | null>(null); // Erro de membros

  const [addMemberOpen, setAddMemberOpen] = useState(false); // Form de adicionar membro aberto?
  const [addMemberUserId, setAddMemberUserId] = useState(""); // UserId digitado
  const [addMemberLoading, setAddMemberLoading] = useState(false); // Loading ao adicionar membro
  const [addMemberError, setAddMemberError] = useState<string | null>(null); // Erro ao adicionar membro
  const [addMemberSuccess, setAddMemberSuccess] = useState<string | null>(null); // Sucesso ao adicionar membro

  const [removeMemberLoadingId, setRemoveMemberLoadingId] = useState<string | null>(null); // Id do membro removendo
  const [removeMemberError, setRemoveMemberError] = useState<string | null>(null); // Erro ao remover membro

  // ==============================
  // STATE: expenses list
  // ==============================

  const [expenses, setExpenses] = useState<GroupExpensesListResponse | null>(null); // Lista de despesas
  const [expensesLoading, setExpensesLoading] = useState(false); // Loading de despesas
  const [expensesError, setExpensesError] = useState<string | null>(null); // Erro de despesas

  // ==============================
  // STATE: balances
  // ==============================

  const [balances, setBalances] = useState<GroupBalancesResponse | null>(null); // Balances do grupo
  const [balancesLoading, setBalancesLoading] = useState(false); // Loading de balances
  const [balancesError, setBalancesError] = useState<string | null>(null); // Erro de balances

  // ==============================
  // STATE: modal adicionar despesas
  // ==============================

  const [expensesModalOpen, setExpensesModalOpen] = useState(false); // Modal de despesa aberto?
  const [expensesTab, setExpensesTab] = useState<"HOUSE" | "QUICK">("HOUSE"); // Aba ativa do modal

  // ==============================
  // STATE: conta do mês
  // ==============================

  const [houseName, setHouseName] = useState(""); // Nome da conta do mês
  const [houseAmountBRL, setHouseAmountBRL] = useState("0,00"); // Valor em BRL
  const [houseDate, setHouseDate] = useState<string>(""); // Data da conta
  const [housePaidByUserId, setHousePaidByUserId] = useState<string>(""); // Quem pagou
  const [houseLoading, setHouseLoading] = useState(false); // Loading ao criar conta do mês
  const [houseError, setHouseError] = useState<string | null>(null); // Erro da conta do mês
  const [houseSuccess, setHouseSuccess] = useState<string | null>(null); // Sucesso da conta do mês

  // ==============================
  // STATE: despesa avulsa
  // ==============================

  const [quickDesc, setQuickDesc] = useState(""); // Descrição da despesa avulsa
  const [quickAmountBRL, setQuickAmountBRL] = useState("0,00"); // Valor da despesa avulsa
  const [quickDate, setQuickDate] = useState<string>(""); // Data da despesa avulsa
  const [quickPaidByUserId, setQuickPaidByUserId] = useState<string>(""); // Quem pagou
  const [quickLoading, setQuickLoading] = useState(false); // Loading da despesa avulsa
  const [quickError, setQuickError] = useState<string | null>(null); // Erro da despesa avulsa
  const [quickSuccess, setQuickSuccess] = useState<string | null>(null); // Sucesso da despesa avulsa

  // ==============================
  // STATE: modal base salarial / percentual
  // ==============================

  const [salaryModalOpen, setSalaryModalOpen] = useState(false); // Modal da base aberto?
  const [salaryError, setSalaryError] = useState<string | null>(null); // Erro do modal da base
  const [salarySuccess, setSalarySuccess] = useState<string | null>(null); // Sucesso do modal da base
  const [splitMode, setSplitMode] = useState<GroupSplitMode>("SALARY"); // Modo atual de divisão
  const [manualPercentInputByUserId, setManualPercentInputByUserId] = useState<Record<string, string>>({}); // Inputs manuais de percentual
  const [salaryByUserId, setSalaryByUserId] = useState<Record<string, number>>({}); // Base salarial por userId

  // ==============================
  // STATE: modal editar despesa
  // ==============================

  const [editModalOpen, setEditModalOpen] = useState(false); // Modal de edição aberto?
  const [editingExpense, setEditingExpense] = useState<GroupExpenseListItemDto | null>(null); // Despesa em edição
  const [editDesc, setEditDesc] = useState(""); // Descrição editada
  const [editAmountBRL, setEditAmountBRL] = useState("0,00"); // Valor editado
  const [editDate, setEditDate] = useState<string>(""); // Data editada
  const [editLoading, setEditLoading] = useState(false); // Loading da edição
  const [editError, setEditError] = useState<string | null>(null); // Erro da edição
  const [editSuccess, setEditSuccess] = useState<string | null>(null); // Sucesso da edição

  // ==============================
  // STATE: excluir despesa
  // ==============================

  const [deleteExpenseLoadingId, setDeleteExpenseLoadingId] = useState<string | null>(null); // Id da despesa deletando

  const RECOMMENDED_LIMIT_PERCENT = 30; // Limite recomendado de comprometimento

  // ==============================
  // RESET: modal despesas
  // ==============================

  function resetExpenseForms() {
    setHouseError(null); // Limpa erro da conta do mês
    setHouseSuccess(null); // Limpa sucesso da conta do mês
    setQuickError(null); // Limpa erro da despesa avulsa
    setQuickSuccess(null); // Limpa sucesso da despesa avulsa

    const defaultPaidBy = (balances?.members ?? [])[0]?.userId ?? ""; // Primeiro membro como padrão

    setHouseName(""); // Reseta nome da conta
    setHouseAmountBRL("0,00"); // Reseta valor da conta
    setHouseDate(""); // Reseta data da conta
    setHousePaidByUserId(defaultPaidBy); // Reseta quem pagou

    setQuickDesc(""); // Reseta descrição da despesa avulsa
    setQuickAmountBRL("0,00"); // Reseta valor da despesa avulsa
    setQuickDate(""); // Reseta data da despesa avulsa
    setQuickPaidByUserId(defaultPaidBy); // Reseta quem pagou
  }

  // ==============================
  // RESET: modal editar
  // ==============================

  function openEditExpenseModal(expense: GroupExpenseListItemDto) {
    setEditError(null); // Limpa erro da edição
    setEditSuccess(null); // Limpa sucesso da edição
    setEditingExpense(expense); // Define despesa em edição
    setEditDesc(expense.description ?? ""); // Preenche descrição
    setEditAmountBRL(centsToBRLInput(expense.amountCents ?? 0)); // Preenche valor
    setEditDate(isoToDateInput(expense.date)); // Preenche data
    setEditModalOpen(true); // Abre modal
  }

  function closeEditExpenseModal() {
    setEditModalOpen(false); // Fecha modal
    setEditingExpense(null); // Limpa despesa em edição
    setEditError(null); // Limpa erro
    setEditSuccess(null); // Limpa sucesso
  }

  // ==============================
  // BASE manual / modo
  // ==============================

  function getManualPercentNumberMap(memberIds: string[]) {
    const next: Record<string, number> = {}; // Mapa numérico final

    for (const id of memberIds) {
      next[id] = percentTextToNumber(manualPercentInputByUserId[id] ?? "0"); // Converte texto para número
    }

    return next; // Retorna mapa numérico
  }

  function loadSplitMode(groupId: string) {
    const mode = loadStoredSplitMode(groupId); // Lê modo salvo
    setSplitMode(mode); // Atualiza estado
  }

  function saveSplitMode(groupId: string, mode: GroupSplitMode) {
    saveStoredSplitMode(groupId, mode); // Salva modo no localStorage
  }

  function loadManualPercentBase(groupId: string, memberIds: string[]) {
    const inputMap = loadStoredManualPercentBase(groupId, memberIds); // Lê base manual salva
    setManualPercentInputByUserId(inputMap); // Atualiza inputs
  }

  function saveManualPercentBase(groupId: string, map: Record<string, number>) {
    saveStoredManualPercentBase(groupId, map); // Salva base manual
  }

  // ==============================
  // LOAD GROUPS
  // ==============================

  async function refreshGroups(selectGroupId?: string) {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null })); // Ativa loading

      const data = await fetchGroups(); // Busca grupos na API
      setState({ groups: data, loading: false, error: null }); // Atualiza estado

      if (data.length === 0) {
        setSelectedGroupId(null); // Limpa grupo selecionado
        setSelectedGroupName(null); // Limpa nome selecionado
        return;
      }

      const targetId = selectGroupId && data.some((g) => g.id === selectGroupId) ? selectGroupId : data[0].id; // Decide grupo alvo
      const target = data.find((g) => g.id === targetId) ?? data[0]; // Encontra grupo alvo

      setSelectedGroupId(target.id); // Define id selecionado
      setSelectedGroupName(target.name); // Define nome selecionado
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"; // Extrai mensagem de erro
      setState({ groups: [], loading: false, error: message }); // Salva erro
    }
  }

  useEffect(() => {
    refreshGroups(); // Carrega grupos ao abrir página
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==============================
  // MEMBERS / EXPENSES / BALANCES
  // ==============================

  async function refreshMembers(groupId: string) {
    try {
      setMembersLoading(true); // Ativa loading
      setMembersError(null); // Limpa erro

      const data = await fetchMembers(groupId); // Busca membros
      setMembersInfo(data); // Atualiza resposta
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"; // Extrai erro
      setMembersError(message); // Salva erro
      setMembersInfo(null); // Limpa dados
    } finally {
      setMembersLoading(false); // Desliga loading
    }
  }

  async function refreshExpenses(groupId: string) {
    try {
      setExpensesLoading(true); // Ativa loading
      setExpensesError(null); // Limpa erro

      const data = await fetchExpenses(groupId); // Busca despesas
      setExpenses(data); // Atualiza despesas
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"; // Extrai erro
      setExpensesError(message); // Salva erro
      setExpenses(null); // Limpa dados
    } finally {
      setExpensesLoading(false); // Desliga loading
    }
  }

  async function refreshBalances(groupId: string) {
    try {
      setBalancesLoading(true); // Ativa loading
      setBalancesError(null); // Limpa erro

      const data = await fetchBalances(groupId); // Busca balances
      setBalances(data); // Atualiza balances

      setHousePaidByUserId((prev) => {
        if (prev) return prev; // Mantém valor atual se já existir
        if (data.members?.length) return data.members[0].userId; // Usa primeiro membro
        return prev; // Mantém valor anterior
      });

      setQuickPaidByUserId((prev) => {
        if (prev) return prev; // Mantém valor atual se já existir
        if (data.members?.length) return data.members[0].userId; // Usa primeiro membro
        return prev; // Mantém valor anterior
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"; // Extrai erro
      setBalancesError(message); // Salva erro
      setBalances(null); // Limpa balances
    } finally {
      setBalancesLoading(false); // Desliga loading
    }
  }

  // ==============================
  // BASE salarial
  // ==============================

  function loadSalaryBase(groupId: string, memberIds: string[]) {
    const next = loadStoredSalaryBase(groupId, memberIds); // Lê base salarial salva
    setSalaryByUserId(next); // Atualiza estado
  }

  function saveSalaryBase(groupId: string, map: Record<string, number>) {
    saveStoredSalaryBase(groupId, map); // Salva base salarial
  }

  useEffect(() => {
    async function loadDetails() {
      if (!selectedGroupId) return; // Sai se não houver grupo

      setExpensesModalOpen(false); // Fecha modal de despesas
      setExpensesTab("HOUSE"); // Volta aba padrão
      setSalaryModalOpen(false); // Fecha modal da base

      closeEditExpenseModal(); // Fecha modal de edição

      setCreateGroupError(null); // Limpa erro de criação
      setCreateGroupSuccess(null); // Limpa sucesso de criação
      setAddMemberError(null); // Limpa erro de adicionar membro
      setAddMemberSuccess(null); // Limpa sucesso de adicionar membro
      setRemoveMemberError(null); // Limpa erro de remover membro

      setHouseError(null); // Limpa erro da conta do mês
      setHouseSuccess(null); // Limpa sucesso da conta do mês
      setQuickError(null); // Limpa erro da despesa avulsa
      setQuickSuccess(null); // Limpa sucesso da despesa avulsa

      setSalaryError(null); // Limpa erro do modal da base
      setSalarySuccess(null); // Limpa sucesso do modal da base

      await refreshMembers(selectedGroupId); // Recarrega membros
      await refreshExpenses(selectedGroupId); // Recarrega despesas
      await refreshBalances(selectedGroupId); // Recarrega balances
    }

    loadDetails(); // Executa carregamento ao trocar grupo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupId]);

  useEffect(() => {
    if (!selectedGroupId) return; // Sai se não houver grupo

    const ids = (balances?.members ?? []).map((m) => m.userId); // Lista de userIds
    if (ids.length === 0) return; // Sai se não houver membros

    loadSalaryBase(selectedGroupId, ids); // Carrega base salarial
    loadManualPercentBase(selectedGroupId, ids); // Carrega base manual
    loadSplitMode(selectedGroupId); // Carrega modo salvo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupId, balances?.members?.length]);

  // ==============================
  // GROUP: create
  // ==============================

  async function onCreateGroup() {
    try {
      setCreateGroupError(null); // Limpa erro
      setCreateGroupSuccess(null); // Limpa sucesso

      const token = getAuthTokenOrThrow(); // Busca token
      const name = newGroupName.trim(); // Limpa nome

      if (!name) {
        setCreateGroupError("Digite um nome para o grupo."); // Validação
        return;
      }

      setCreateGroupLoading(true); // Ativa loading

      const res = await fetch("/api/groups", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      }); // Cria grupo

      if (!res.ok) {
        const text = await res.text(); // Lê erro textual
        throw new Error(`Erro ao criar grupo: HTTP ${res.status} - ${text || "sem detalhes"}`); // Lança erro
      }

      const created = (await res.json()) as GroupDto; // Lê grupo criado

      setCreateGroupSuccess(`Grupo criado: ${created.name}`); // Mostra sucesso
      setNewGroupName(""); // Limpa input

      await refreshGroups(created.id); // Recarrega grupos e seleciona o criado
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"; // Extrai erro
      setCreateGroupError(message); // Salva erro
    } finally {
      setCreateGroupLoading(false); // Desliga loading
    }
  }

  // ==============================
  // GROUP: delete
  // ==============================

  async function onDeleteGroup() {
    try {
      if (!selectedGroupId) return; // Sai se não houver grupo

      const token = getAuthTokenOrThrow(); // Busca token

      const confirmDelete = window.confirm(`Excluir o grupo "${selectedGroupName ?? ""}"?\n\nIsso arquiva o grupo (soft delete).`); // Confirma exclusão
      if (!confirmDelete) return; // Cancela se usuário negar

      const res = await fetch(`/api/groups/${selectedGroupId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }); // Exclui grupo

      if (!res.ok) {
        const text = await res.text(); // Lê detalhe do erro
        throw new Error(`Erro ao excluir grupo: HTTP ${res.status} - ${text || "sem detalhes"}`); // Lança erro
      }

      setSelectedGroupId(null); // Limpa grupo selecionado
      setSelectedGroupName(null); // Limpa nome selecionado
      setMembersInfo(null); // Limpa membros
      setExpenses(null); // Limpa despesas
      setBalances(null); // Limpa balances
      setExpensesModalOpen(false); // Fecha modal despesas
      setSalaryModalOpen(false); // Fecha modal base
      closeEditExpenseModal(); // Fecha modal edição

      await refreshGroups(); // Recarrega grupos
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"; // Extrai erro
      alert(message); // Mostra erro
    }
  }

  // ==============================
  // MEMBERS: add / remove
  // ==============================

  async function onAddMember() {
    try {
      setAddMemberError(null); // Limpa erro
      setAddMemberSuccess(null); // Limpa sucesso

      if (!selectedGroupId) {
        setAddMemberError("Selecione um grupo antes de adicionar membros."); // Validação
        return;
      }

      const token = getAuthTokenOrThrow(); // Busca token
      const userId = addMemberUserId.trim(); // Limpa userId

      if (!isGuid(userId)) {
        setAddMemberError("Cole um UserId válido (GUID)."); // Validação
        return;
      }

      setAddMemberLoading(true); // Ativa loading

      const res = await fetch(`/api/groups/${selectedGroupId}/members`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      }); // Adiciona membro

      if (!res.ok) {
        const text = await res.text(); // Lê erro
        throw new Error(`Erro ao adicionar membro: HTTP ${res.status} - ${text || "sem detalhes"}`); // Lança erro
      }

      setAddMemberSuccess("Membro adicionado."); // Mostra sucesso
      setAddMemberUserId(""); // Limpa input
      setAddMemberOpen(false); // Fecha form

      await refreshMembers(selectedGroupId); // Recarrega membros
      await refreshBalances(selectedGroupId); // Recarrega balances
      await refreshExpenses(selectedGroupId); // Recarrega despesas
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"; // Extrai erro
      setAddMemberError(message); // Salva erro
    } finally {
      setAddMemberLoading(false); // Desliga loading
    }
  }

  async function onRemoveMember(memberId: string, role: string) {
    try {
      setRemoveMemberError(null); // Limpa erro

      if (!selectedGroupId) {
        setRemoveMemberError("Selecione um grupo antes de remover membros."); // Validação
        return;
      }

      const token = getAuthTokenOrThrow(); // Busca token

      if (role === "Admin") {
        setRemoveMemberError("Não é possível remover o Admin do grupo."); // Bloqueia remoção do admin
        return;
      }

      const confirmRemove = window.confirm("Remover este membro do grupo?"); // Confirma remoção
      if (!confirmRemove) return; // Cancela se usuário negar

      setRemoveMemberLoadingId(memberId); // Marca loading do membro

      const res = await fetch(`/api/groups/${selectedGroupId}/members/${memberId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }); // Remove membro

      if (!res.ok) {
        const text = await res.text(); // Lê erro
        throw new Error(`Erro ao remover membro: HTTP ${res.status} - ${text || "sem detalhes"}`); // Lança erro
      }

      await refreshMembers(selectedGroupId); // Recarrega membros
      await refreshBalances(selectedGroupId); // Recarrega balances
      await refreshExpenses(selectedGroupId); // Recarrega despesas
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"; // Extrai erro
      setRemoveMemberError(message); // Salva erro
    } finally {
      setRemoveMemberLoadingId(null); // Limpa loading
    }
  }

  // ==============================
  // EDIT: confirmar edição
  // ==============================

  async function onSaveEditExpense() {
    try {
      setEditError(null); // Limpa erro
      setEditSuccess(null); // Limpa sucesso

      if (!selectedGroupId) {
        setEditError("Selecione um grupo."); // Validação
        return;
      }

      if (!editingExpense) {
        setEditError("Nenhuma despesa selecionada."); // Validação
        return;
      }

      const desc = editDesc.trim(); // Limpa descrição
      if (!desc) {
        setEditError("Digite a descrição."); // Validação
        return;
      }

      const amountCents = toCentsFromBRLInput(editAmountBRL); // Converte valor
      if (amountCents <= 0) {
        setEditError("Digite um valor válido. Ex: 10,50"); // Validação
        return;
      }

      if (!editDate) {
        setEditError("Selecione a data."); // Validação
        return;
      }

      const paidBy = editingExpense.paidByUserId || (balances?.members ?? [])[0]?.userId || ""; // Define pagador
      if (!paidBy) {
        setEditError("Não foi possível identificar quem pagou (paidByUserId)."); // Validação
        return;
      }

      const payload: UpdateGroupExpenseRequest = {
        description: desc,
        amountCents: amountCents,
        date: toIsoForBackend(editDate),
        paidByUserId: paidBy,
      }; // Monta payload

      setEditLoading(true); // Ativa loading

      await updateExpense(editingExpense.id, payload); // Atualiza via service
      setEditSuccess("Despesa atualizada."); // Mostra sucesso

      await refreshExpenses(selectedGroupId); // Recarrega despesas
      await refreshBalances(selectedGroupId); // Recarrega balances

      closeEditExpenseModal(); // Fecha modal
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"; // Extrai erro
      setEditError(message); // Salva erro
    } finally {
      setEditLoading(false); // Desliga loading
    }
  }

  // ==============================
  // DELETE: excluir item do histórico
  // ==============================

  async function onDeleteExpenseFromHistory(expense: GroupExpenseListItemDto) {
    try {
      if (!selectedGroupId) return; // Sai se não houver grupo

      const confirmDelete = window.confirm(`Excluir esta despesa?\n\n"${expense.description}"\n${formatBRLFromCents(expense.amountCents)}`); // Confirma exclusão
      if (!confirmDelete) return; // Cancela se usuário negar

      setDeleteExpenseLoadingId(expense.id); // Ativa loading do item

      await deleteExpense(expense.id); // Exclui via service

      await refreshExpenses(selectedGroupId); // Recarrega despesas
      await refreshBalances(selectedGroupId); // Recarrega balances
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"; // Extrai erro
      alert(message); // Mostra erro
    } finally {
      setDeleteExpenseLoadingId(null); // Desliga loading
    }
  }

  // ==============================
  // CREATE: conta do mês
  // ==============================

  async function onCreateHouseExpense() {
    try {
      setHouseError(null); // Limpa erro
      setHouseSuccess(null); // Limpa sucesso
      setQuickError(null); // Limpa erro da outra aba
      setQuickSuccess(null); // Limpa sucesso da outra aba

      if (!selectedGroupId) {
        setHouseError("Selecione um grupo antes de criar despesa."); // Validação
        return;
      }

      if (!houseName.trim()) {
        setHouseError("Digite o nome da conta. Ex: Aluguel"); // Validação
        return;
      }

      const amountCents = toCentsFromBRLInput(houseAmountBRL); // Converte valor
      if (amountCents <= 0) {
        setHouseError("Digite um valor válido. Ex: 900,00"); // Validação
        return;
      }

      if (!houseDate) {
        setHouseError("Selecione a data."); // Validação
        return;
      }

      const paidBy = housePaidByUserId || (balances?.members ?? [])[0]?.userId || ""; // Define pagador
      if (!paidBy) {
        setHouseError("Adicione pessoas no grupo antes de lançar despesas."); // Validação
        return;
      }

      const payload: CreateGroupExpenseRequest = {
        groupId: selectedGroupId,
        description: `${houseName.trim()} — ${monthLabelBR(houseDate)}`,
        amountCents: amountCents,
        date: toIsoForBackend(houseDate),
        paidByUserId: paidBy,
      }; // Monta payload

      setHouseLoading(true); // Ativa loading

      const data = await createExpense(payload); // Cria via service
      setHouseSuccess(`Conta criada — ${formatBRLFromCents(data.amountCents)}`); // Mostra sucesso

      await refreshExpenses(selectedGroupId); // Recarrega despesas
      await refreshBalances(selectedGroupId); // Recarrega balances
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"; // Extrai erro
      setHouseError(message); // Salva erro
    } finally {
      setHouseLoading(false); // Desliga loading
    }
  }

  // ==============================
  // CREATE: despesa avulsa
  // ==============================

  async function onCreateQuickExpense() {
    try {
      setQuickError(null); // Limpa erro
      setQuickSuccess(null); // Limpa sucesso
      setHouseError(null); // Limpa erro da outra aba
      setHouseSuccess(null); // Limpa sucesso da outra aba

      if (!selectedGroupId) {
        setQuickError("Selecione um grupo antes de criar despesa."); // Validação
        return;
      }

      if (!quickDesc.trim()) {
        setQuickError("Digite uma descrição. Ex: Mercado"); // Validação
        return;
      }

      const amountCents = toCentsFromBRLInput(quickAmountBRL); // Converte valor
      if (amountCents <= 0) {
        setQuickError("Digite um valor válido. Ex: 10,50"); // Validação
        return;
      }

      if (!quickDate) {
        setQuickError("Selecione a data."); // Validação
        return;
      }

      const paidBy = quickPaidByUserId || (balances?.members ?? [])[0]?.userId || ""; // Define pagador
      if (!paidBy) {
        setQuickError("Adicione pessoas no grupo antes de lançar despesas."); // Validação
        return;
      }

      const payload: CreateGroupExpenseRequest = {
        groupId: selectedGroupId,
        description: quickDesc.trim(),
        amountCents: amountCents,
        date: toIsoForBackend(quickDate),
        paidByUserId: paidBy,
      }; // Monta payload

      setQuickLoading(true); // Ativa loading

      const data = await createExpense(payload); // Cria via service
      setQuickSuccess(`Despesa criada — ${formatBRLFromCents(data.amountCents)}`); // Mostra sucesso

      await refreshExpenses(selectedGroupId); // Recarrega despesas
      await refreshBalances(selectedGroupId); // Recarrega balances
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"; // Extrai erro
      setQuickError(message); // Salva erro
    } finally {
      setQuickLoading(false); // Desliga loading
    }
  }

  // ==============================
  // UI data
  // ==============================

  const members = balances?.members ?? []; // Lista de membros a partir dos balances

  const membersCount = useMemo(() => {
    const c = membersInfo?.members?.length ?? 0; // Conta membros
    return c; // Retorna contagem
  }, [membersInfo?.members?.length]);

  const currentMonthKey = useMemo(() => currentMonthKeyUTC(), []); // Chave do mês atual

  const monthExpenses = useMemo(() => {
    const items = expenses?.items ?? []; // Lista de despesas
    return items.filter((e) => monthKeyFromISO(e.date) === currentMonthKey); // Filtra apenas mês atual
  }, [expenses?.items, currentMonthKey]);

  const monthTotalCents = useMemo(() => {
    return (monthExpenses ?? []).reduce((acc, e) => acc + (e.amountCents ?? 0), 0); // Soma total do mês
  }, [monthExpenses]);

  const salaryTotal = useMemo(() => {
    return members.reduce((acc, m) => acc + (Number(salaryByUserId[m.userId] ?? 0) || 0), 0); // Soma salários
  }, [members, salaryByUserId]);

  const salaryWeights = useMemo(() => {
    const total = salaryTotal; // Total salarial
    const map: Record<string, number> = {}; // Mapa final

    if (total <= 0) {
      for (const m of members) map[m.userId] = 0; // Zera pesos sem salário total
      return map; // Retorna mapa
    }

    for (const m of members) {
      const s = Number(salaryByUserId[m.userId] ?? 0) || 0; // Salário do membro
      map[m.userId] = s > 0 ? s / total : 0; // Calcula peso
    }

    return map; // Retorna pesos
  }, [members, salaryByUserId, salaryTotal]);

  const manualPercentNumberByUserId = useMemo(() => {
    return getManualPercentNumberMap(members.map((m) => m.userId)); // Converte inputs manuais em números
  }, [members, manualPercentInputByUserId]);

  const manualPercentTotal = useMemo(() => {
    return members.reduce((acc, m) => acc + (Number(manualPercentNumberByUserId[m.userId] ?? 0) || 0), 0); // Soma percentuais manuais
  }, [members, manualPercentNumberByUserId]);

  const manualWeights = useMemo(() => {
    const map: Record<string, number> = {}; // Mapa final

    for (const m of members) {
      const percent = Number(manualPercentNumberByUserId[m.userId] ?? 0) || 0; // Percentual do membro
      map[m.userId] = percent > 0 ? percent / 100 : 0; // Converte percentual em peso
    }

    return map; // Retorna pesos
  }, [members, manualPercentNumberByUserId]);

  const isManualConfigValid = useMemo(() => {
    if (members.length === 0) return false; // Sem membros, inválido
    if (manualPercentTotal <= 0) return false; // Soma zerada, inválido
    return Math.abs(manualPercentTotal - 100) < 0.01; // Soma deve fechar 100
  }, [members.length, manualPercentTotal]);

  const activeWeights = useMemo(() => {
    return splitMode === "MANUAL" ? manualWeights : salaryWeights; // Escolhe pesos ativos
  }, [splitMode, manualWeights, salaryWeights]);

  const canCalculateMonthSplit = useMemo(() => {
    if (splitMode === "MANUAL") return isManualConfigValid; // Manual exige 100%
    return salaryTotal > 0; // Salary exige base > 0
  }, [splitMode, isManualConfigValid, salaryTotal]);

  const monthSplit = useMemo(() => {
    const total = monthTotalCents / 100; // Total em reais

    const rows = members.map((m) => {
      const salary = Number(salaryByUserId[m.userId] ?? 0) || 0; // Salário do membro
      const weight = Number(activeWeights[m.userId] ?? 0) || 0; // Peso do membro
      const shouldPay = total * weight; // Quanto deveria pagar
      const percentOfSalary = salary > 0 ? (shouldPay / salary) * 100 : 0; // % do salário

      return {
        userId: m.userId,
        label: safeName(m.name, m.email, m.userId),
        salary,
        weightPercent: weight * 100,
        shouldPay,
        percentOfSalary,
        manualPercent: Number(manualPercentNumberByUserId[m.userId] ?? 0) || 0,
      }; // Linha final
    });

    rows.sort((a, b) => b.shouldPay - a.shouldPay); // Ordena por maior impacto
    return rows; // Retorna linhas
  }, [members, monthTotalCents, salaryByUserId, activeWeights, manualPercentNumberByUserId]);

  const historyItems = useMemo(() => {
    const items = expenses?.items ?? []; // Lista de despesas
    return items.slice(0, 12); // Últimos 12 itens
  }, [expenses?.items]);

  const salaryFilledCount = useMemo(() => {
    const ids = members.map((m) => m.userId); // Lista de ids
    const filled = ids.filter((id) => (Number(salaryByUserId[id] ?? 0) || 0) > 0).length; // Quantos salários preenchidos
    return filled; // Retorna total preenchido
  }, [members, salaryByUserId]);

  const averagePerPersonCents = useMemo(() => {
    if (membersCount <= 0) return 0; // Evita divisão por zero
    return Math.round(monthTotalCents / membersCount); // Média por pessoa
  }, [monthTotalCents, membersCount]);

  const highestBurden = useMemo(() => {
    if (monthSplit.length === 0) return 0; // Sem linhas, retorna zero
    return Math.max(...monthSplit.map((x) => x.percentOfSalary || 0)); // Maior comprometimento
  }, [monthSplit]);

  const chartPalette = useMemo(() => {
    return ["#5B8CFF", "#8B5CF6", "#22C55E", "#F59E0B", "#EF4444", "#06B6D4", "#EC4899", "#A3E635", "#F97316", "#14B8A6"]; // Paleta do gráfico
  }, []);

  const monthSplitChartColors = useMemo(() => {
    return monthSplit.map((_, index) => chartPalette[index % chartPalette.length]); // Gera cores por item
  }, [monthSplit, chartPalette]);

  const monthSplitChartData = useMemo(() => {
    return {
      labels: monthSplit.map((item) => item.label),
      datasets: [
        {
          data: monthSplit.map((item) => Number(item.shouldPay.toFixed(2))),
          backgroundColor: monthSplitChartColors,
          borderColor: "rgba(9,13,22,0.92)",
          borderWidth: 3,
          hoverOffset: 8,
        },
      ],
    }; // Dados do doughnut
  }, [monthSplit, monthSplitChartColors]);

  const monthSplitChartOptions = useMemo<ChartOptions<"doughnut">>(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "rgba(12,16,25,0.96)",
          borderColor: "rgba(255,255,255,0.10)",
          borderWidth: 1,
          padding: 12,
          titleColor: "#ffffff",
          bodyColor: "rgba(255,255,255,0.86)",
          callbacks: {
            label: (context: TooltipItem<"doughnut">) => {
              const total = monthSplit.reduce((acc, item) => acc + item.shouldPay, 0); // Soma total do gráfico
              const raw = Number(context.raw ?? 0); // Valor bruto do item
              const percent = total > 0 ? (raw / total) * 100 : 0; // Percentual do item
              return `${context.label ?? ""}: ${formatBRL(raw)} • ${percent.toFixed(1)}%`; // Texto do tooltip
            },
          },
        },
      },
    }; // Opções do gráfico
  }, [monthSplit]);

  function handleSelectGroup(group: GroupDto) {
    setSelectedGroupId(group.id); // Seleciona id do grupo
    setSelectedGroupName(group.name); // Seleciona nome do grupo

    setCreateGroupSuccess(null); // Limpa sucesso de criação
    setCreateGroupError(null); // Limpa erro de criação

    setHouseSuccess(null); // Limpa sucesso da conta do mês
    setHouseError(null); // Limpa erro da conta do mês
    setQuickSuccess(null); // Limpa sucesso da despesa avulsa
    setQuickError(null); // Limpa erro da despesa avulsa

    setAddMemberSuccess(null); // Limpa sucesso de membro
    setAddMemberError(null); // Limpa erro de membro
    setRemoveMemberError(null); // Limpa erro de remoção

    setSalaryError(null); // Limpa erro do modal base
    setSalarySuccess(null); // Limpa sucesso do modal base

    setExpensesModalOpen(false); // Fecha modal despesas
    setSalaryModalOpen(false); // Fecha modal base

    closeEditExpenseModal(); // Fecha modal edição
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
              onClick={() => refreshGroups(selectedGroupId ?? undefined)}
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
          createGroupLoading={createGroupLoading}
          createGroupError={createGroupError}
          createGroupSuccess={createGroupSuccess}
          onNewGroupNameChange={setNewGroupName}
          onCreateGroup={onCreateGroup}
          onRefreshGroups={() => refreshGroups(selectedGroupId ?? undefined)}
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
                      resetExpenseForms();
                      setExpensesTab("HOUSE");
                      setExpensesModalOpen(true);
                    }}
                    style={primaryButton}
                  >
                    + Adicionar despesa
                  </button>

                  <button type="button" onClick={onDeleteGroup} style={dangerButtonSmall}>
                    Excluir grupo
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
                    membersLoading={membersLoading}
                    balancesLoading={balancesLoading}
                    membersError={membersError}
                    balancesError={balancesError}
                    removeMemberError={removeMemberError}
                    addMemberOpen={addMemberOpen}
                    addMemberUserId={addMemberUserId}
                    addMemberLoading={addMemberLoading}
                    addMemberError={addMemberError}
                    addMemberSuccess={addMemberSuccess}
                    removeMemberLoadingId={removeMemberLoadingId}
                    onToggleAddMember={() => setAddMemberOpen((v) => !v)}
                    onAddMemberUserIdChange={setAddMemberUserId}
                    onAddMember={onAddMember}
                    onRemoveMember={onRemoveMember}
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
                      setSalaryError(null);
                      setSalarySuccess(null);
                      setSalaryModalOpen(true);
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
                            resetExpenseForms();
                            setExpensesTab("HOUSE");
                            setExpensesModalOpen(true);
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
                            setExpensesTab("QUICK");
                            resetExpenseForms();
                            setExpensesModalOpen(true);
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
                    expensesLoading={expensesLoading}
                    onRefreshExpenses={() => selectedGroupId && refreshExpenses(selectedGroupId)}
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
                expensesLoading={expensesLoading}
                expensesError={expensesError}
                historyItems={historyItems}
                deleteExpenseLoadingId={deleteExpenseLoadingId}
                balancesLoading={balancesLoading}
                onRefreshExpenses={() => selectedGroupId && refreshExpenses(selectedGroupId)}
                onOpenEditExpense={openEditExpenseModal}
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
        open={expensesModalOpen}
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
        onClose={() => setExpensesModalOpen(false)}
        onChangeTab={setExpensesTab}
        onHouseNameChange={setHouseName}
        onHouseAmountChange={setHouseAmountBRL}
        onHouseDateChange={setHouseDate}
        onHouseAmountFocus={() => {
          if ((houseAmountBRL ?? "").trim() === "0,00") setHouseAmountBRL("");
        }}
        onHouseAmountBlur={() => {
          if (!(houseAmountBRL ?? "").trim()) setHouseAmountBRL("0,00");
        }}
        onCreateHouseExpense={onCreateHouseExpense}
        onQuickDescChange={setQuickDesc}
        onQuickAmountChange={setQuickAmountBRL}
        onQuickDateChange={setQuickDate}
        onQuickAmountFocus={() => {
          if ((quickAmountBRL ?? "").trim() === "0,00") setQuickAmountBRL("");
        }}
        onQuickAmountBlur={() => {
          if (!(quickAmountBRL ?? "").trim()) setQuickAmountBRL("0,00");
        }}
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
        open={editModalOpen}
        selectedGroupId={selectedGroupId}
        editingExpense={editingExpense}
        editDesc={editDesc}
        editAmountBRL={editAmountBRL}
        editDate={editDate}
        editLoading={editLoading}
        editError={editError}
        editSuccess={editSuccess}
        onClose={closeEditExpenseModal}
        onEditDescChange={setEditDesc}
        onEditAmountChange={setEditAmountBRL}
        onEditDateChange={setEditDate}
        onEditAmountFocus={() => {
          if ((editAmountBRL ?? "").trim() === "0,00") setEditAmountBRL("");
        }}
        onEditAmountBlur={() => {
          if (!(editAmountBRL ?? "").trim()) setEditAmountBRL("0,00");
        }}
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
        open={salaryModalOpen}
        selectedGroupId={selectedGroupId}
        balances={balances}
        splitMode={splitMode}
        salaryByUserId={salaryByUserId}
        manualPercentInputByUserId={manualPercentInputByUserId}
        manualPercentTotal={manualPercentTotal}
        recommendedLimitPercent={RECOMMENDED_LIMIT_PERCENT}
        onClose={() => setSalaryModalOpen(false)}
        onSplitModeChange={setSplitMode}
        onSalaryChange={(userId, value) => {
          const raw = (value ?? "").replace(/\./g, "").replace(",", ".");
          const num = Number(raw);
          setSalaryByUserId((prev) => ({
            ...prev,
            [userId]: Number.isFinite(num) && num >= 0 ? num : 0,
          }));
        }}
        onSalaryBlur={(userId) => {
          const v = Number(salaryByUserId[userId] ?? 0) || 0;
          setSalaryByUserId((prev) => ({ ...prev, [userId]: v }));
        }}
        onManualPercentChange={(userId, value) => {
          const raw = normalizePercentInputText(value);
          setManualPercentInputByUserId((prev) => ({
            ...prev,
            [userId]: raw,
          }));
        }}
        onManualPercentBlur={(userId) => {
          const parsed = percentTextToNumber(manualPercentInputByUserId[userId] ?? "0");
          setManualPercentInputByUserId((prev) => ({
            ...prev,
            [userId]: percentNumberToInput(parsed),
          }));
        }}
        onResetSalaries={() => {
          const next: Record<string, number> = {};
          for (const m of members) next[m.userId] = 0;
          setSalaryByUserId(next);
          setSalarySuccess(null);
          setSalaryError(null);
        }}
        onSplitEqual={() => {
          const defaults = buildDefaultManualPercentBase(members.map((m) => m.userId));
          setManualPercentInputByUserId(numberMapToInputMap(defaults));
          setSalarySuccess(null);
          setSalaryError(null);
        }}
        onSave={() => {
          try {
            setSalaryError(null);
            setSalarySuccess(null);

            if (!selectedGroupId) {
              setSalaryError("Selecione um grupo.");
              return;
            }

            if (splitMode === "SALARY") {
              const total = members.reduce((acc, m) => acc + (Number(salaryByUserId[m.userId] ?? 0) || 0), 0);

              if (total <= 0) {
                setSalaryError("Informe pelo menos um salário maior que 0.");
                return;
              }

              saveSalaryBase(selectedGroupId, salaryByUserId);
              saveSplitMode(selectedGroupId, "SALARY");
              setSalarySuccess("Base salarial salva.");
              setSalaryModalOpen(false);
              return;
            }

            const currentManualMap = getManualPercentNumberMap(members.map((m) => m.userId));
            const currentTotal = Object.values(currentManualMap).reduce((acc, v) => acc + v, 0);

            if (currentTotal <= 0 || Math.abs(currentTotal - 100) >= 0.01) {
              setSalaryError("No modo manual, a soma dos percentuais precisa fechar 100%.");
              return;
            }

            saveManualPercentBase(selectedGroupId, currentManualMap);
            saveSplitMode(selectedGroupId, "MANUAL");
            setManualPercentInputByUserId(numberMapToInputMap(currentManualMap));
            setSalarySuccess("Base manual salva.");
            setSalaryModalOpen(false);
          } catch {
            setSalaryError("Não foi possível salvar a base do grupo.");
          }
        }}
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
// O que foi ajustado neste Groups.tsx:
// - ✅ Removidas as funções locais postExpense, putExpense e deleteExpense
// - ✅ Removidas as chamadas GET internas de grupos, membros, despesas e balances
// - ✅ Integrado com o arquivo services/groups.api.ts
// - ✅ Mantida toda a lógica visual e de negócio já aprovada
// - ✅ Groups.tsx agora ficou mais limpo e mais preparado para próxima refatoração
//
// Próximo passo recomendado:
// - extrair createGroup / deleteGroup / addMember / removeMember para groups.api.ts
// - depois extrair handlers para um hook, tipo useGroupsDashboard