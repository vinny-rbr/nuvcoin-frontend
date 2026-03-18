import { useMemo, useState } from "react"; // Hooks do React

import type { GroupExpenseListItemDto } from "../types/groups.types"; // Tipo real da despesa

type ExpenseFormMode = "equal" | "salary" | "manual"; // Modos possíveis do formulário

type UseGroupsEditExpenseParams = {
  expenses: readonly GroupExpenseListItemDto[]; // Lista de despesas do grupo
  selectedExpenseId: string | null; // Id da despesa selecionada para edição
  openEditExpenseModal: (params: { expenseId: string; title?: string | null }) => void; // Função para abrir modal
  closeEditExpenseModalState: () => void; // Função para fechar modal no hook de modais
  clearSelectedExpense: () => void; // Limpa despesa selecionada
  resetEditExpenseForm: () => void; // Reseta formulário de edição
  startEditExpenseForm: (params: {
    title?: string | null;
    amountCents?: number | null;
    occurredOn?: string | null;
    paidByUserId?: string | null;
    splitMode?: ExpenseFormMode | null;
    manualPercentByUserId?: Record<string, string> | null;
  }) => void; // Inicializa formulário de edição
}; // Parâmetros do hook

export default function useGroupsEditExpense({
  expenses,
  selectedExpenseId,
  openEditExpenseModal,
  closeEditExpenseModalState,
  clearSelectedExpense,
  resetEditExpenseForm,
  startEditExpenseForm,
}: UseGroupsEditExpenseParams) {
  // ==============================
  // STATE: feedback da edição
  // ==============================

  const [editLoading, setEditLoading] = useState(false); // Loading da edição
  const [editError, setEditError] = useState<string | null>(null); // Erro da edição
  const [editSuccess, setEditSuccess] = useState<string | null>(null); // Sucesso da edição

  // ==============================
  // MEMO: despesa em edição
  // ==============================

  const editingExpense = useMemo<GroupExpenseListItemDto | null>(() => {
    if (!selectedExpenseId) return null; // Sai se não houver despesa selecionada
    return expenses.find((expense) => expense.id === selectedExpenseId) ?? null; // Busca despesa atual
  }, [expenses, selectedExpenseId]); // Recalcula quando despesas ou id mudarem

  // ==============================
  // HELPERS
  // ==============================

  function clearEditFeedback() {
    setEditError(null); // Limpa erro da edição
    setEditSuccess(null); // Limpa sucesso da edição
  }

  function handleOpenEditExpenseModal(expense: GroupExpenseListItemDto) {
    clearEditFeedback(); // Limpa feedback antes de abrir

    openEditExpenseModal({
      expenseId: expense.id,
      title: expense.description,
    }); // Abre modal e salva despesa selecionada

    startEditExpenseForm({
      title: expense.description ?? "",
      amountCents: expense.amountCents ?? 0,
      occurredOn: expense.date ?? "",
      paidByUserId: expense.paidByUserId ?? "",
      splitMode: "equal",
      manualPercentByUserId: {},
    }); // Preenche formulário de edição
  }

  function handleCloseEditExpenseModal() {
    closeEditExpenseModalState(); // Fecha modal
    clearSelectedExpense(); // Limpa despesa selecionada
    resetEditExpenseForm(); // Reseta formulário
    clearEditFeedback(); // Limpa feedback
    setEditLoading(false); // Garante loading desligado
  }

  function handleEditAmountFocus(currentValue: string, setValue: (value: string) => void) {
    if ((currentValue ?? "").trim() === "0,00") {
      setValue(""); // Limpa valor padrão ao focar
    }
  }

  function handleEditAmountBlur(currentValue: string, setValue: (value: string) => void) {
    if (!(currentValue ?? "").trim()) {
      setValue("0,00"); // Restaura valor padrão se vazio
    }
  }

  return {
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
  }; // Expõe estado e handlers da edição
}

// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com
//
// Ajuste aplicado nesta etapa:
// - ✅ alinhado o contrato do hook useGroupsEditExpense com o useGroupsForms
// - ✅ corrigido startEditExpenseForm para aceitar os mesmos tipos reais do formulário
// - ✅ mantido editingExpense com o tipo real GroupExpenseListItemDto
// - ✅ ampliado expenses para readonly array, evitando conflito de tipagem