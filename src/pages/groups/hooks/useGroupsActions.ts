import type {
  CreateGroupExpenseRequest, // Tipo do payload de criação de despesa
  GroupExpenseListItemDto, // Tipo de item de despesa do histórico
  UpdateGroupExpenseRequest, // Tipo do payload de edição de despesa
} from "../types/groups.types"; // Tipos do módulo de grupos

import {
  formatBRLFromCents, // Formata centavos para BRL
  isGuid, // Valida se string é GUID
  monthLabelBR, // Gera rótulo do mês em pt-BR
  toCentsFromBRLInput, // Converte texto BRL em centavos
  toIsoForBackend, // Converte data para ISO aceito pelo backend
} from "../utils/groups.helpers"; // Helpers do módulo

type UseGroupsActionsParams = {
  selectedGroupId: string | null; // Grupo atualmente selecionado
  selectedGroupName: string | null; // Nome do grupo selecionado
  balances: {
    members?: Array<{
      userId: string; // Id do usuário membro
    }>;
  } | null; // Balances do grupo atual

  handleCreateGroup: (payload: { name: string }) => Promise<boolean>; // Função central de criar grupo
  handleDeleteGroup: (groupId: string) => Promise<boolean>; // Função central de deletar grupo
  handleAddMember: (groupId: string, payload: { userId: string }) => Promise<boolean>; // Função central de adicionar membro
  handleRemoveMember: (groupId: string, memberId: string) => Promise<boolean>; // Função central de remover membro
  handleCreateExpense: (payload: CreateGroupExpenseRequest) => Promise<boolean>; // Função central de criar despesa
  handleUpdateExpense: (expenseId: string, payload: UpdateGroupExpenseRequest) => Promise<boolean>; // Função central de editar despesa
  handleDeleteExpense: (expenseId: string) => Promise<boolean>; // Função central de deletar despesa

  setCreateGroupError: React.Dispatch<React.SetStateAction<string | null>>; // Setter do erro de criação de grupo
  setCreateGroupSuccess: React.Dispatch<React.SetStateAction<string | null>>; // Setter do sucesso de criação de grupo

  setAddMemberError: React.Dispatch<React.SetStateAction<string | null>>; // Setter do erro de adicionar membro
  setAddMemberSuccess: React.Dispatch<React.SetStateAction<string | null>>; // Setter do sucesso de adicionar membro
  setRemoveMemberError: React.Dispatch<React.SetStateAction<string | null>>; // Setter do erro de remover membro

  setHouseError: React.Dispatch<React.SetStateAction<string | null>>; // Setter do erro da conta do mês
  setHouseSuccess: React.Dispatch<React.SetStateAction<string | null>>; // Setter do sucesso da conta do mês
  setHouseLoading: React.Dispatch<React.SetStateAction<boolean>>; // Setter do loading da conta do mês

  setQuickError: React.Dispatch<React.SetStateAction<string | null>>; // Setter do erro da despesa avulsa
  setQuickSuccess: React.Dispatch<React.SetStateAction<string | null>>; // Setter do sucesso da despesa avulsa
  setQuickLoading: React.Dispatch<React.SetStateAction<boolean>>; // Setter do loading da despesa avulsa

  setEditError: React.Dispatch<React.SetStateAction<string | null>>; // Setter do erro da edição
  setEditSuccess: React.Dispatch<React.SetStateAction<string | null>>; // Setter do sucesso da edição
  setEditLoading: React.Dispatch<React.SetStateAction<boolean>>; // Setter do loading da edição

  resetGroupForm: () => void; // Reseta formulário de grupo
  closeCreateExpenseModal: () => void; // Fecha modal de criar despesa
  closeBaseConfigModal: () => void; // Fecha modal da base
  closeEditExpenseModal: () => void; // Fecha modal de editar despesa
};

type CreateGroupParams = {
  newGroupName: string; // Nome digitado do novo grupo
}; // Parâmetros da criação de grupo

type AddMemberParams = {
  addMemberUserId: string; // UserId digitado
  onSuccess?: () => void; // Callback opcional para sucesso
}; // Parâmetros de adicionar membro

type RemoveMemberParams = {
  memberId: string; // Id do membro do grupo
  role: string; // Papel do membro no grupo
}; // Parâmetros de remover membro

type CreateHouseExpenseParams = {
  houseName: string; // Nome da conta
  houseAmountBRL: string; // Valor da conta em BRL
  houseDate: string; // Data da conta
  housePaidByUserId: string; // Usuário pagador
}; // Parâmetros da conta do mês

type CreateQuickExpenseParams = {
  quickDesc: string; // Descrição da despesa avulsa
  quickAmountBRL: string; // Valor da despesa avulsa
  quickDate: string; // Data da despesa avulsa
  quickPaidByUserId: string; // Usuário pagador
}; // Parâmetros da despesa avulsa

type SaveEditExpenseParams = {
  editingExpense: GroupExpenseListItemDto | null; // Despesa em edição
  editingExpenseTitle: string; // Descrição editada
  editingExpenseAmount: string; // Valor editado
  editingExpenseDate: string; // Data editada
}; // Parâmetros da edição

type UseGroupsActionsReturn = {
  onCreateGroup: (params: CreateGroupParams) => Promise<void>; // Cria grupo
  onDeleteGroup: () => Promise<void>; // Exclui grupo
  onAddMember: (params: AddMemberParams) => Promise<void>; // Adiciona membro
  onRemoveMember: (params: RemoveMemberParams) => Promise<void>; // Remove membro
  onCreateHouseExpense: (params: CreateHouseExpenseParams) => Promise<void>; // Cria conta do mês
  onCreateQuickExpense: (params: CreateQuickExpenseParams) => Promise<void>; // Cria despesa avulsa
  onSaveEditExpense: (params: SaveEditExpenseParams) => Promise<void>; // Salva edição da despesa
  onDeleteExpenseFromHistory: (expense: GroupExpenseListItemDto) => Promise<void>; // Exclui despesa do histórico
}; // Retorno do hook

export default function useGroupsActions({
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
  closeEditExpenseModal,
}: UseGroupsActionsParams): UseGroupsActionsReturn {
  async function onCreateGroup({ newGroupName }: CreateGroupParams): Promise<void> {
    try {
      setCreateGroupError(null); // Limpa erro anterior
      setCreateGroupSuccess(null); // Limpa sucesso anterior

      const name = newGroupName.trim(); // Remove espaços desnecessários

      if (!name) {
        setCreateGroupError("Digite um nome para o grupo."); // Valida nome vazio
        return; // Interrompe fluxo
      }

      const ok = await handleCreateGroup({ name }); // Chama criação no hook central

      if (!ok) {
        setCreateGroupError("Não foi possível criar o grupo."); // Retorna erro amigável
        return; // Interrompe fluxo
      }

      setCreateGroupSuccess(`Grupo criado: ${name}`); // Define mensagem de sucesso
      resetGroupForm(); // Limpa formulário após sucesso
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"; // Extrai mensagem de erro
      setCreateGroupError(message); // Salva erro no estado
    }
  }

  async function onDeleteGroup(): Promise<void> {
    try {
      if (!selectedGroupId) return; // Sai se não houver grupo selecionado

      const confirmDelete = window.confirm(`Excluir o grupo "${selectedGroupName ?? ""}"?\n\nIsso arquiva o grupo (soft delete).`); // Confirma exclusão com o usuário
      if (!confirmDelete) return; // Cancela se usuário negar

      const ok = await handleDeleteGroup(selectedGroupId); // Executa exclusão pelo hook central

      if (!ok) {
        alert("Não foi possível excluir o grupo."); // Mostra erro amigável
        return; // Interrompe fluxo
      }

      closeCreateExpenseModal(); // Fecha modal de despesas
      closeBaseConfigModal(); // Fecha modal da base
      closeEditExpenseModal(); // Fecha modal de edição
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"; // Extrai mensagem de erro
      alert(message); // Exibe erro
    }
  }

  async function onAddMember({ addMemberUserId, onSuccess }: AddMemberParams): Promise<void> {
    try {
      setAddMemberError(null); // Limpa erro anterior
      setAddMemberSuccess(null); // Limpa sucesso anterior

      if (!selectedGroupId) {
        setAddMemberError("Selecione um grupo antes de adicionar membros."); // Valida grupo
        return; // Interrompe fluxo
      }

      const userId = addMemberUserId.trim(); // Limpa input

      if (!isGuid(userId)) {
        setAddMemberError("Cole um UserId válido (GUID)."); // Valida GUID
        return; // Interrompe fluxo
      }

      const ok = await handleAddMember(selectedGroupId, { userId }); // Executa inclusão do membro

      if (!ok) {
        setAddMemberError("Não foi possível adicionar o membro."); // Erro amigável
        return; // Interrompe fluxo
      }

      setAddMemberSuccess("Membro adicionado."); // Define sucesso
      onSuccess?.(); // Executa callback opcional
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"; // Extrai mensagem de erro
      setAddMemberError(message); // Salva erro
    }
  }

  async function onRemoveMember({ memberId, role }: RemoveMemberParams): Promise<void> {
    try {
      setRemoveMemberError(null); // Limpa erro anterior

      if (!selectedGroupId) {
        setRemoveMemberError("Selecione um grupo antes de remover membros."); // Valida grupo
        return; // Interrompe fluxo
      }

      if (role === "Admin") {
        setRemoveMemberError("Não é possível remover o Admin do grupo."); // Impede remoção do admin
        return; // Interrompe fluxo
      }

      const confirmRemove = window.confirm("Remover este membro do grupo?"); // Confirma remoção
      if (!confirmRemove) return; // Sai se usuário cancelar

      const ok = await handleRemoveMember(selectedGroupId, memberId); // Executa remoção

      if (!ok) {
        setRemoveMemberError("Não foi possível remover o membro."); // Erro amigável
        return; // Interrompe fluxo
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"; // Extrai mensagem de erro
      setRemoveMemberError(message); // Salva erro
    }
  }

  async function onCreateHouseExpense({
    houseName,
    houseAmountBRL,
    houseDate,
    housePaidByUserId,
  }: CreateHouseExpenseParams): Promise<void> {
    try {
      setHouseError(null); // Limpa erro anterior
      setHouseSuccess(null); // Limpa sucesso anterior
      setQuickError(null); // Limpa erro da aba rápida
      setQuickSuccess(null); // Limpa sucesso da aba rápida

      if (!selectedGroupId) {
        setHouseError("Selecione um grupo antes de criar despesa."); // Valida grupo
        return; // Interrompe fluxo
      }

      if (!houseName.trim()) {
        setHouseError("Digite o nome da conta. Ex: Aluguel"); // Valida nome da conta
        return; // Interrompe fluxo
      }

      const amountCents = toCentsFromBRLInput(houseAmountBRL); // Converte BRL para centavos
      if (amountCents <= 0) {
        setHouseError("Digite um valor válido. Ex: 900,00"); // Valida valor
        return; // Interrompe fluxo
      }

      if (!houseDate) {
        setHouseError("Selecione a data."); // Valida data
        return; // Interrompe fluxo
      }

      const paidBy = housePaidByUserId || (balances?.members ?? [])[0]?.userId || ""; // Define pagador padrão
      if (!paidBy) {
        setHouseError("Adicione pessoas no grupo antes de lançar despesas."); // Valida existência de membros
        return; // Interrompe fluxo
      }

      const payload: CreateGroupExpenseRequest = {
        groupId: selectedGroupId, // Grupo da despesa
        description: `${houseName.trim()} — ${monthLabelBR(houseDate)}`, // Descrição formatada
        amountCents: amountCents, // Valor em centavos
        date: toIsoForBackend(houseDate), // Data em ISO
        paidByUserId: paidBy, // Usuário pagador
      }; // Payload final

      setHouseLoading(true); // Liga loading

      const ok = await handleCreateExpense(payload); // Executa criação

      if (!ok) {
        setHouseError("Não foi possível criar a conta."); // Erro amigável
        return; // Interrompe fluxo
      }

      setHouseSuccess(`Conta criada — ${formatBRLFromCents(amountCents)}`); // Define sucesso
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"; // Extrai mensagem de erro
      setHouseError(message); // Salva erro
    } finally {
      setHouseLoading(false); // Desliga loading
    }
  }

  async function onCreateQuickExpense({
    quickDesc,
    quickAmountBRL,
    quickDate,
    quickPaidByUserId,
  }: CreateQuickExpenseParams): Promise<void> {
    try {
      setQuickError(null); // Limpa erro anterior
      setQuickSuccess(null); // Limpa sucesso anterior
      setHouseError(null); // Limpa erro da aba house
      setHouseSuccess(null); // Limpa sucesso da aba house

      if (!selectedGroupId) {
        setQuickError("Selecione um grupo antes de criar despesa."); // Valida grupo
        return; // Interrompe fluxo
      }

      if (!quickDesc.trim()) {
        setQuickError("Digite uma descrição. Ex: Mercado"); // Valida descrição
        return; // Interrompe fluxo
      }

      const amountCents = toCentsFromBRLInput(quickAmountBRL); // Converte BRL para centavos
      if (amountCents <= 0) {
        setQuickError("Digite um valor válido. Ex: 10,50"); // Valida valor
        return; // Interrompe fluxo
      }

      if (!quickDate) {
        setQuickError("Selecione a data."); // Valida data
        return; // Interrompe fluxo
      }

      const paidBy = quickPaidByUserId || (balances?.members ?? [])[0]?.userId || ""; // Define pagador padrão
      if (!paidBy) {
        setQuickError("Adicione pessoas no grupo antes de lançar despesas."); // Valida membros
        return; // Interrompe fluxo
      }

      const payload: CreateGroupExpenseRequest = {
        groupId: selectedGroupId, // Grupo da despesa
        description: quickDesc.trim(), // Descrição final
        amountCents: amountCents, // Valor em centavos
        date: toIsoForBackend(quickDate), // Data em ISO
        paidByUserId: paidBy, // Usuário pagador
      }; // Payload final

      setQuickLoading(true); // Liga loading

      const ok = await handleCreateExpense(payload); // Executa criação

      if (!ok) {
        setQuickError("Não foi possível criar a despesa."); // Erro amigável
        return; // Interrompe fluxo
      }

      setQuickSuccess(`Despesa criada — ${formatBRLFromCents(amountCents)}`); // Define sucesso
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"; // Extrai mensagem de erro
      setQuickError(message); // Salva erro
    } finally {
      setQuickLoading(false); // Desliga loading
    }
  }

  async function onSaveEditExpense({
    editingExpense,
    editingExpenseTitle,
    editingExpenseAmount,
    editingExpenseDate,
  }: SaveEditExpenseParams): Promise<void> {
    try {
      setEditError(null); // Limpa erro anterior
      setEditSuccess(null); // Limpa sucesso anterior

      if (!selectedGroupId) {
        setEditError("Selecione um grupo."); // Valida grupo
        return; // Interrompe fluxo
      }

      if (!editingExpense) {
        setEditError("Nenhuma despesa selecionada."); // Valida despesa
        return; // Interrompe fluxo
      }

      const desc = editingExpenseTitle.trim(); // Limpa descrição
      if (!desc) {
        setEditError("Digite a descrição."); // Valida descrição
        return; // Interrompe fluxo
      }

      const amountCents = toCentsFromBRLInput(editingExpenseAmount); // Converte valor
      if (amountCents <= 0) {
        setEditError("Digite um valor válido. Ex: 10,50"); // Valida valor
        return; // Interrompe fluxo
      }

      if (!editingExpenseDate) {
        setEditError("Selecione a data."); // Valida data
        return; // Interrompe fluxo
      }

      const paidBy = editingExpense.paidByUserId || (balances?.members ?? [])[0]?.userId || ""; // Define pagador
      if (!paidBy) {
        setEditError("Não foi possível identificar quem pagou (paidByUserId)."); // Valida pagador
        return; // Interrompe fluxo
      }

      const payload: UpdateGroupExpenseRequest = {
        description: desc, // Descrição final
        amountCents: amountCents, // Valor final
        date: toIsoForBackend(editingExpenseDate), // Data final
        paidByUserId: paidBy, // Pagador final
      }; // Payload final

      setEditLoading(true); // Liga loading

      const ok = await handleUpdateExpense(editingExpense.id, payload); // Executa atualização

      if (!ok) {
        setEditError("Não foi possível atualizar a despesa."); // Erro amigável
        return; // Interrompe fluxo
      }

      setEditSuccess("Despesa atualizada."); // Define sucesso
      closeEditExpenseModal(); // Fecha modal
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"; // Extrai mensagem de erro
      setEditError(message); // Salva erro
    } finally {
      setEditLoading(false); // Desliga loading
    }
  }

  async function onDeleteExpenseFromHistory(expense: GroupExpenseListItemDto): Promise<void> {
    try {
      if (!selectedGroupId) return; // Sai se não houver grupo

      const confirmDelete = window.confirm(`Excluir esta despesa?\n\n"${expense.description}"\n${formatBRLFromCents(expense.amountCents)}`); // Confirma exclusão
      if (!confirmDelete) return; // Sai se usuário cancelar

      const ok = await handleDeleteExpense(expense.id); // Executa exclusão

      if (!ok) {
        alert("Não foi possível excluir a despesa."); // Mostra erro amigável
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido"; // Extrai mensagem de erro
      alert(message); // Exibe erro
    }
  }

  return {
    onCreateGroup, // Expõe ação de criar grupo
    onDeleteGroup, // Expõe ação de deletar grupo
    onAddMember, // Expõe ação de adicionar membro
    onRemoveMember, // Expõe ação de remover membro
    onCreateHouseExpense, // Expõe ação de criar conta do mês
    onCreateQuickExpense, // Expõe ação de criar despesa avulsa
    onSaveEditExpense, // Expõe ação de salvar edição
    onDeleteExpenseFromHistory, // Expõe ação de excluir do histórico
  }; // Retorno final do hook
}