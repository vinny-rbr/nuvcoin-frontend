import { useCallback, useEffect, useMemo, useState } from "react"; // Hooks do React

import {
  addMember,
  createExpense,
  createGroup,
  deleteExpense,
  deleteGroup,
  fetchBalances,
  fetchExpenses,
  fetchGroups,
  fetchMembers,
  removeMember,
  updateExpense,
} from "../services/groups.api"; // Serviços de API já extraídos

import type {
  CreateGroupExpenseRequest,
  GroupBalancesResponse,
  GroupDto,
  GroupExpensesListResponse,
  GroupMembersResponse,
  GroupSplitMode,
  UpdateGroupExpenseRequest,
} from "../types/groups.types"; // Tipos centralizados do módulo

type CreateGroupRequest = {
  name: string; // Nome do grupo a ser criado
};

type AddGroupMemberRequest = {
  email?: string; // E-mail do membro a ser adicionado
};

type UseGroupsDashboardReturn = {
  groups: GroupDto[]; // Lista de grupos disponíveis
  selectedGroupId: string | null; // Id do grupo atualmente selecionado
  selectedGroup: GroupDto | null; // Objeto completo do grupo selecionado
  members: GroupMembersResponse | null; // Resposta de membros do grupo
  expenses: GroupExpensesListResponse | null; // Resposta completa da lista de despesas
  balances: GroupBalancesResponse | null; // Saldos/resumo calculado do grupo
  loadingGroups: boolean; // Loading da listagem de grupos
  loadingDetails: boolean; // Loading dos dados internos do grupo
  submittingExpense: boolean; // Loading para criar/editar despesa
  deletingExpenseId: string | null; // Guarda qual despesa está sendo excluída
  creatingGroup: boolean; // Loading para criação de grupo
  deletingGroupId: string | null; // Guarda qual grupo está sendo excluído
  submittingMember: boolean; // Loading para adicionar/remover membro
  removingMemberId: string | null; // Guarda qual membro está sendo removido
  error: string | null; // Erro geral do hook
  selectGroup: (groupId: string) => void; // Seleciona grupo ativo
  reloadGroups: () => Promise<void>; // Recarrega lista de grupos
  reloadSelectedGroupData: () => Promise<void>; // Recarrega dados do grupo ativo
  handleCreateGroup: (payload: CreateGroupRequest) => Promise<boolean>; // Cria grupo
  handleDeleteGroup: (groupId: string) => Promise<boolean>; // Exclui grupo
  handleAddMember: (groupId: string, payload: AddGroupMemberRequest) => Promise<boolean>; // Adiciona membro
  handleRemoveMember: (groupId: string, memberId: string) => Promise<boolean>; // Remove membro
  handleCreateExpense: (payload: CreateGroupExpenseRequest) => Promise<boolean>; // Cria despesa
  handleUpdateExpense: (expenseId: string, payload: UpdateGroupExpenseRequest) => Promise<boolean>; // Edita despesa
  handleDeleteExpense: (expenseId: string) => Promise<boolean>; // Exclui despesa
  hasGroups: boolean; // Indica se existe ao menos um grupo
  memberCount: number; // Quantidade de membros do grupo selecionado
  expenseCount: number; // Quantidade de despesas carregadas
  selectedSplitMode: GroupSplitMode | null; // Modo de divisão predominante disponível no balance
};

const GROUPS_STORAGE_KEY = "nuvcoin.groups.selectedGroupId"; // Chave para lembrar grupo selecionado

function getStoredSelectedGroupId(): string | null {
  // Lê do localStorage o grupo salvo anteriormente
  if (typeof window === "undefined") {
    // Evita erro em ambiente sem window
    return null;
  }

  // Retorna o valor salvo ou null
  return window.localStorage.getItem(GROUPS_STORAGE_KEY);
}

function setStoredSelectedGroupId(groupId: string | null) {
  // Salva ou remove o grupo selecionado no localStorage
  if (typeof window === "undefined") {
    // Evita erro em ambiente sem window
    return;
  }

  if (!groupId) {
    // Remove quando não existir grupo selecionado
    window.localStorage.removeItem(GROUPS_STORAGE_KEY);
    return;
  }

  // Persiste o id atual
  window.localStorage.setItem(GROUPS_STORAGE_KEY, groupId);
}

export function useGroupsDashboard(): UseGroupsDashboardReturn {
  // Lista de grupos
  const [groups, setGroups] = useState<GroupDto[]>([]);

  // Id do grupo selecionado
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => getStoredSelectedGroupId());

  // Resposta de membros
  const [members, setMembers] = useState<GroupMembersResponse | null>(null);

  // Resposta completa da lista de despesas
  const [expenses, setExpenses] = useState<GroupExpensesListResponse | null>(null);

  // Resposta de saldos
  const [balances, setBalances] = useState<GroupBalancesResponse | null>(null);

  // Loading da lista de grupos
  const [loadingGroups, setLoadingGroups] = useState<boolean>(true);

  // Loading dos dados do grupo
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Loading para create/update de despesa
  const [submittingExpense, setSubmittingExpense] = useState<boolean>(false);

  // Id da despesa em exclusão
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  // Loading para criação de grupo
  const [creatingGroup, setCreatingGroup] = useState<boolean>(false);

  // Id do grupo em exclusão
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  // Loading para adicionar/remover membro
  const [submittingMember, setSubmittingMember] = useState<boolean>(false);

  // Id do membro em remoção
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  // Erro geral
  const [error, setError] = useState<string | null>(null);

  const selectedGroup = useMemo(() => {
    // Encontra o objeto completo do grupo selecionado
    return groups.find((group) => group.id === selectedGroupId) ?? null;
  }, [groups, selectedGroupId]);

  const selectedSplitMode = useMemo<GroupSplitMode | null>(() => {
    // Tenta descobrir o modo de divisão a partir do balance se existir
    if (!balances) {
      // Sem balance ainda
      return null;
    }

    // Cast defensivo para não quebrar caso o tipo ainda não exponha isso oficialmente
    const maybeMode = (balances as unknown as { splitMode?: GroupSplitMode | null }).splitMode;

    // Retorna o modo encontrado ou null
    return maybeMode ?? null;
  }, [balances]);

  const loadGroups = useCallback(async () => {
    // Inicia loading da lista principal
    setLoadingGroups(true);
    setError(null);

    try {
      // Busca grupos na API
      const response = await fetchGroups();

      // Normaliza para array
      const nextGroups = Array.isArray(response) ? response : [];

      // Atualiza estado
      setGroups(nextGroups);

      // Se não existir grupos, limpa seleção e dados dependentes
      if (nextGroups.length === 0) {
        setSelectedGroupId(null);
        setStoredSelectedGroupId(null);
        setMembers(null);
        setExpenses(null);
        setBalances(null);
        return;
      }

      // Verifica se o grupo salvo ainda existe
      const storedGroupId = getStoredSelectedGroupId();
      const hasStoredGroup = !!storedGroupId && nextGroups.some((group) => group.id === storedGroupId);

      // Verifica se a seleção atual ainda existe
      const hasSelectedGroup = !!selectedGroupId && nextGroups.some((group) => group.id === selectedGroupId);

      if (hasSelectedGroup) {
        // Mantém a seleção atual se ainda existir
        return;
      }

      if (hasStoredGroup && storedGroupId) {
        // Restaura seleção salva anteriormente
        setSelectedGroupId(storedGroupId);
        return;
      }

      // Se nada existir, seleciona o primeiro grupo
      setSelectedGroupId(nextGroups[0].id);
    } catch (err) {
      // Guarda erro amigável
      setError(err instanceof Error ? err.message : "Erro ao carregar grupos.");
    } finally {
      // Finaliza loading
      setLoadingGroups(false);
    }
  }, [selectedGroupId]);

  const loadSelectedGroupData = useCallback(async () => {
    // Se não houver grupo selecionado, limpa dados derivados
    if (!selectedGroupId) {
      setMembers(null);
      setExpenses(null);
      setBalances(null);
      return;
    }

    // Inicia loading dos detalhes internos
    setLoadingDetails(true);
    setError(null);

    try {
      // Dispara chamadas em paralelo para ganhar desempenho
      const [membersResponse, expensesResponse, balancesResponse] = await Promise.all([
        fetchMembers(selectedGroupId),
        fetchExpenses(selectedGroupId),
        fetchBalances(selectedGroupId),
      ]);

      // Atualiza membros
      setMembers(membersResponse ?? null);

      // Atualiza despesas mantendo o formato original da API
      setExpenses(expensesResponse ?? null);

      // Atualiza balances
      setBalances(balancesResponse ?? null);

      // Salva grupo atual no localStorage
      setStoredSelectedGroupId(selectedGroupId);
    } catch (err) {
      // Guarda erro amigável
      setError(err instanceof Error ? err.message : "Erro ao carregar dados do grupo.");
      setMembers(null);
      setExpenses(null);
      setBalances(null);
    } finally {
      // Finaliza loading dos detalhes
      setLoadingDetails(false);
    }
  }, [selectedGroupId]);

  const selectGroup = useCallback((groupId: string) => {
    // Atualiza grupo ativo
    setSelectedGroupId(groupId);

    // Persiste imediatamente
    setStoredSelectedGroupId(groupId);
  }, []);

  const reloadGroups = useCallback(async () => {
    // Recarrega a lista de grupos
    await loadGroups();
  }, [loadGroups]);

  const reloadSelectedGroupData = useCallback(async () => {
    // Recarrega tudo do grupo ativo
    await loadSelectedGroupData();
  }, [loadSelectedGroupData]);

  const handleCreateGroup = useCallback(
    async (payload: CreateGroupRequest) => {
      // Inicia loading da criação do grupo
      setCreatingGroup(true);
      setError(null);

      try {
        // Cria grupo na API
        const createdGroup = await createGroup(payload);

        // Recarrega grupos para sincronizar com backend
        await loadGroups();

        // Seleciona o grupo criado, se vier id
        if (createdGroup?.id) {
          setSelectedGroupId(createdGroup.id);
          setStoredSelectedGroupId(createdGroup.id);
        }

        // Sucesso
        return true;
      } catch (err) {
        // Guarda erro amigável
        setError(err instanceof Error ? err.message : "Erro ao criar grupo.");
        return false;
      } finally {
        // Finaliza loading
        setCreatingGroup(false);
      }
    },
    [loadGroups]
  );

  const handleDeleteGroup = useCallback(
    async (groupId: string) => {
      // Marca grupo em exclusão
      setDeletingGroupId(groupId);
      setError(null);

      try {
        // Exclui grupo na API
        await deleteGroup(groupId);

        // Recarrega lista de grupos
        const nextGroups = await fetchGroups();
        const normalizedGroups = Array.isArray(nextGroups) ? nextGroups : [];

        // Atualiza grupos manualmente para controlar a próxima seleção
        setGroups(normalizedGroups);

        // Se não sobrou grupo, limpa tudo
        if (normalizedGroups.length === 0) {
          setSelectedGroupId(null);
          setStoredSelectedGroupId(null);
          setMembers(null);
          setExpenses(null);
          setBalances(null);
          return true;
        }

        // Se o grupo apagado era o selecionado, troca para o primeiro disponível
        if (selectedGroupId === groupId) {
          const nextSelectedGroupId = normalizedGroups[0].id;
          setSelectedGroupId(nextSelectedGroupId);
          setStoredSelectedGroupId(nextSelectedGroupId);
        }

        // Sucesso
        return true;
      } catch (err) {
        // Guarda erro amigável
        setError(err instanceof Error ? err.message : "Erro ao excluir grupo.");
        return false;
      } finally {
        // Limpa marcação
        setDeletingGroupId(null);
      }
    },
    [selectedGroupId]
  );

  const handleAddMember = useCallback(
    async (groupId: string, payload: AddGroupMemberRequest) => {
      // Inicia loading da ação de membro
      setSubmittingMember(true);
      setError(null);

      try {
        // Adiciona membro na API
        await addMember(groupId, payload);

        // Se estiver mexendo no grupo atualmente selecionado, recarrega os detalhes
        if (groupId === selectedGroupId) {
          await loadSelectedGroupData();
        }

        // Sucesso
        return true;
      } catch (err) {
        // Guarda erro amigável
        setError(err instanceof Error ? err.message : "Erro ao adicionar membro.");
        return false;
      } finally {
        // Finaliza loading
        setSubmittingMember(false);
      }
    },
    [loadSelectedGroupData, selectedGroupId]
  );

  const handleRemoveMember = useCallback(
    async (groupId: string, memberId: string) => {
      // Inicia loading da ação de membro
      setSubmittingMember(true);
      setRemovingMemberId(memberId);
      setError(null);

      try {
        // Remove membro na API
        await removeMember(groupId, memberId);

        // Se estiver mexendo no grupo atualmente selecionado, recarrega os detalhes
        if (groupId === selectedGroupId) {
          await loadSelectedGroupData();
        }

        // Sucesso
        return true;
      } catch (err) {
        // Guarda erro amigável
        setError(err instanceof Error ? err.message : "Erro ao remover membro.");
        return false;
      } finally {
        // Finaliza loading
        setSubmittingMember(false);
        setRemovingMemberId(null);
      }
    },
    [loadSelectedGroupData, selectedGroupId]
  );

  const handleCreateExpense = useCallback(
    async (payload: CreateGroupExpenseRequest) => {
      // Inicia loading do submit
      setSubmittingExpense(true);
      setError(null);

      try {
        // Cria nova despesa na API
        await createExpense(payload);

        // Recarrega os dados do grupo para refletir no histórico, gráfico e balances
        await loadSelectedGroupData();

        // Sucesso
        return true;
      } catch (err) {
        // Guarda erro amigável
        setError(err instanceof Error ? err.message : "Erro ao criar despesa.");
        return false;
      } finally {
        // Finaliza loading
        setSubmittingExpense(false);
      }
    },
    [loadSelectedGroupData]
  );

  const handleUpdateExpense = useCallback(
    async (expenseId: string, payload: UpdateGroupExpenseRequest) => {
      // Inicia loading do submit
      setSubmittingExpense(true);
      setError(null);

      try {
        // Atualiza despesa existente
        await updateExpense(expenseId, payload);

        // Recarrega dados do grupo
        await loadSelectedGroupData();

        // Sucesso
        return true;
      } catch (err) {
        // Guarda erro amigável
        setError(err instanceof Error ? err.message : "Erro ao atualizar despesa.");
        return false;
      } finally {
        // Finaliza loading
        setSubmittingExpense(false);
      }
    },
    [loadSelectedGroupData]
  );

  const handleDeleteExpense = useCallback(
    async (expenseId: string) => {
      // Marca item em exclusão
      setDeletingExpenseId(expenseId);
      setError(null);

      try {
        // Remove despesa na API
        await deleteExpense(expenseId);

        // Recarrega dados do grupo
        await loadSelectedGroupData();

        // Sucesso
        return true;
      } catch (err) {
        // Guarda erro amigável
        setError(err instanceof Error ? err.message : "Erro ao excluir despesa.");
        return false;
      } finally {
        // Limpa marcação do item
        setDeletingExpenseId(null);
      }
    },
    [loadSelectedGroupData]
  );

  useEffect(() => {
    // Carrega grupos quando o hook inicia
    void loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    // Quando trocar o grupo selecionado, busca membros, despesas e balances
    void loadSelectedGroupData();
  }, [loadSelectedGroupData]);

  return {
    groups,
    selectedGroupId,
    selectedGroup,
    members,
    expenses,
    balances,
    loadingGroups,
    loadingDetails,
    submittingExpense,
    deletingExpenseId,
    creatingGroup,
    deletingGroupId,
    submittingMember,
    removingMemberId,
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
    hasGroups: groups.length > 0,
    memberCount: members?.members?.length ?? 0,
    expenseCount: expenses?.items?.length ?? 0,
    selectedSplitMode,
  };
}

// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com
//
// Este hook centraliza o estado e os handlers principais
// do dashboard de Groups.
//
// Nesta etapa ele passou a assumir também:
// - createGroup
// - deleteGroup
// - addMember
// - removeMember
//
// Assim, o Groups.tsx fica cada vez mais focado em UI,
// modais, formulários e cálculos visuais.
