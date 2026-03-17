import { useMemo, useState } from "react"; // Hook do React para estado e memoização

type ExpenseFormMode = "equal" | "salary" | "manual"; // Modos possíveis de divisão da despesa

type MemberSalaryInputByUserId = Record<string, string>; // Salário digitado por usuário
type ManualPercentInputByUserId = Record<string, string>; // Percentual manual digitado por usuário

type UseGroupsFormsParams = {
  selectedGroupId: string | null; // Grupo atualmente selecionado
};

type UseGroupsFormsReturn = {
  newGroupName: string; // Nome do novo grupo
  setNewGroupName: React.Dispatch<React.SetStateAction<string>>; // Setter do nome do grupo

  newMemberName: string; // Nome do novo membro
  setNewMemberName: React.Dispatch<React.SetStateAction<string>>; // Setter do nome do membro

  newMemberEmail: string; // E-mail do novo membro
  setNewMemberEmail: React.Dispatch<React.SetStateAction<string>>; // Setter do e-mail do membro

  expenseTitle: string; // Título da despesa
  setExpenseTitle: React.Dispatch<React.SetStateAction<string>>; // Setter do título

  expenseAmount: string; // Valor da despesa em texto
  setExpenseAmount: React.Dispatch<React.SetStateAction<string>>; // Setter do valor

  expenseDate: string; // Data da despesa
  setExpenseDate: React.Dispatch<React.SetStateAction<string>>; // Setter da data

  expensePaidByUserId: string; // Usuário pagador da despesa
  setExpensePaidByUserId: React.Dispatch<React.SetStateAction<string>>; // Setter do pagador

  expenseSplitMode: ExpenseFormMode; // Modo de divisão selecionado
  setExpenseSplitMode: React.Dispatch<React.SetStateAction<ExpenseFormMode>>; // Setter do modo de divisão

  memberSalaryInputByUserId: MemberSalaryInputByUserId; // Salários digitados por usuário
  setMemberSalaryInputByUserId: React.Dispatch<React.SetStateAction<MemberSalaryInputByUserId>>; // Setter dos salários

  manualPercentInputByUserId: ManualPercentInputByUserId; // Percentuais manuais digitados por usuário
  setManualPercentInputByUserId: React.Dispatch<React.SetStateAction<ManualPercentInputByUserId>>; // Setter dos percentuais

  editingExpenseTitle: string; // Título da despesa em edição
  setEditingExpenseTitle: React.Dispatch<React.SetStateAction<string>>; // Setter do título em edição

  editingExpenseAmount: string; // Valor da despesa em edição
  setEditingExpenseAmount: React.Dispatch<React.SetStateAction<string>>; // Setter do valor em edição

  editingExpenseDate: string; // Data da despesa em edição
  setEditingExpenseDate: React.Dispatch<React.SetStateAction<string>>; // Setter da data em edição

  editingExpensePaidByUserId: string; // Pagador da despesa em edição
  setEditingExpensePaidByUserId: React.Dispatch<React.SetStateAction<string>>; // Setter do pagador em edição

  editingExpenseSplitMode: ExpenseFormMode; // Modo de divisão da despesa em edição
  setEditingExpenseSplitMode: React.Dispatch<React.SetStateAction<ExpenseFormMode>>; // Setter do modo em edição

  editingManualPercentInputByUserId: ManualPercentInputByUserId; // Percentuais manuais da edição
  setEditingManualPercentInputByUserId: React.Dispatch<React.SetStateAction<ManualPercentInputByUserId>>; // Setter dos percentuais da edição

  isCreateGroupDisabled: boolean; // Indica se o botão de criar grupo deve ficar desabilitado
  isAddMemberDisabled: boolean; // Indica se o botão de adicionar membro deve ficar desabilitado
  isCreateExpenseDisabled: boolean; // Indica se o botão de criar despesa deve ficar desabilitado
  isUpdateExpenseDisabled: boolean; // Indica se o botão de salvar edição deve ficar desabilitado

  resetGroupForm: () => void; // Reseta formulário de grupo
  resetMemberForm: () => void; // Reseta formulário de membro
  resetExpenseForm: () => void; // Reseta formulário de despesa
  resetEditExpenseForm: () => void; // Reseta formulário de edição de despesa

  startEditExpenseForm: (params: {
    title?: string | null; // Título inicial
    amountCents?: number | null; // Valor inicial em centavos
    occurredOn?: string | null; // Data inicial
    paidByUserId?: string | null; // Pagador inicial
    splitMode?: ExpenseFormMode | null; // Modo inicial
    manualPercentByUserId?: ManualPercentInputByUserId | null; // Percentuais iniciais
  }) => void; // Preenche formulário de edição com dados existentes

  updateMemberSalaryInput: (userId: string, value: string) => void; // Atualiza salário de um membro
  updateManualPercentInput: (userId: string, value: string) => void; // Atualiza percentual manual de um membro
  updateEditingManualPercentInput: (userId: string, value: string) => void; // Atualiza percentual manual da edição
  clearManualPercentInputs: () => void; // Limpa percentuais manuais da criação
  clearEditingManualPercentInputs: () => void; // Limpa percentuais manuais da edição
};

function centsToCurrencyInput(valueCents?: number | null): string {
  if (!valueCents || valueCents <= 0) return ""; // Se não existir valor, devolve vazio

  return (valueCents / 100).toFixed(2).replace(".", ","); // Converte centavos para formato brasileiro simples
}

function normalizeDateInput(value?: string | null): string {
  if (!value) return ""; // Se a data não existir, devolve vazio

  return value.slice(0, 10); // Mantém apenas YYYY-MM-DD para input type="date"
}

export default function useGroupsForms({
  selectedGroupId,
}: UseGroupsFormsParams): UseGroupsFormsReturn {
  const [newGroupName, setNewGroupName] = useState(""); // Estado do nome do novo grupo
  const [newMemberName, setNewMemberName] = useState(""); // Estado do nome do novo membro
  const [newMemberEmail, setNewMemberEmail] = useState(""); // Estado do e-mail do novo membro

  const [expenseTitle, setExpenseTitle] = useState(""); // Estado do título da despesa
  const [expenseAmount, setExpenseAmount] = useState(""); // Estado do valor da despesa
  const [expenseDate, setExpenseDate] = useState(""); // Estado da data da despesa
  const [expensePaidByUserId, setExpensePaidByUserId] = useState(""); // Estado do usuário que pagou
  const [expenseSplitMode, setExpenseSplitMode] = useState<ExpenseFormMode>("equal"); // Estado do modo de divisão

  const [memberSalaryInputByUserId, setMemberSalaryInputByUserId] = useState<MemberSalaryInputByUserId>({}); // Estado dos salários por usuário
  const [manualPercentInputByUserId, setManualPercentInputByUserId] = useState<ManualPercentInputByUserId>({}); // Estado dos percentuais manuais por usuário

  const [editingExpenseTitle, setEditingExpenseTitle] = useState(""); // Estado do título da despesa em edição
  const [editingExpenseAmount, setEditingExpenseAmount] = useState(""); // Estado do valor da despesa em edição
  const [editingExpenseDate, setEditingExpenseDate] = useState(""); // Estado da data da despesa em edição
  const [editingExpensePaidByUserId, setEditingExpensePaidByUserId] = useState(""); // Estado do usuário pagador na edição
  const [editingExpenseSplitMode, setEditingExpenseSplitMode] = useState<ExpenseFormMode>("equal"); // Estado do modo de divisão na edição
  const [editingManualPercentInputByUserId, setEditingManualPercentInputByUserId] = useState<ManualPercentInputByUserId>({}); // Estado dos percentuais manuais da edição

  const isCreateGroupDisabled = useMemo(() => {
    return newGroupName.trim().length === 0; // Desabilita se o nome do grupo estiver vazio
  }, [newGroupName]);

  const isAddMemberDisabled = useMemo(() => {
    return selectedGroupId === null || newMemberName.trim().length === 0; // Desabilita se não houver grupo selecionado ou nome do membro
  }, [newMemberName, selectedGroupId]);

  const isCreateExpenseDisabled = useMemo(() => {
    return (
      selectedGroupId === null || // Exige grupo selecionado
      expenseTitle.trim().length === 0 || // Exige título
      expenseAmount.trim().length === 0 || // Exige valor
      expenseDate.trim().length === 0 || // Exige data
      expensePaidByUserId.trim().length === 0 // Exige pagador
    );
  }, [expenseAmount, expenseDate, expensePaidByUserId, expenseTitle, selectedGroupId]);

  const isUpdateExpenseDisabled = useMemo(() => {
    return (
      editingExpenseTitle.trim().length === 0 || // Exige título na edição
      editingExpenseAmount.trim().length === 0 || // Exige valor na edição
      editingExpenseDate.trim().length === 0 || // Exige data na edição
      editingExpensePaidByUserId.trim().length === 0 // Exige pagador na edição
    );
  }, [editingExpenseAmount, editingExpenseDate, editingExpensePaidByUserId, editingExpenseTitle]);

  function resetGroupForm(): void {
    setNewGroupName(""); // Limpa o nome do grupo
  }

  function resetMemberForm(): void {
    setNewMemberName(""); // Limpa o nome do membro
    setNewMemberEmail(""); // Limpa o e-mail do membro
  }

  function resetExpenseForm(): void {
    setExpenseTitle(""); // Limpa o título da despesa
    setExpenseAmount(""); // Limpa o valor da despesa
    setExpenseDate(""); // Limpa a data da despesa
    setExpensePaidByUserId(""); // Limpa o pagador da despesa
    setExpenseSplitMode("equal"); // Restaura o modo padrão de divisão
    setManualPercentInputByUserId({}); // Limpa percentuais manuais
  }

  function resetEditExpenseForm(): void {
    setEditingExpenseTitle(""); // Limpa o título da edição
    setEditingExpenseAmount(""); // Limpa o valor da edição
    setEditingExpenseDate(""); // Limpa a data da edição
    setEditingExpensePaidByUserId(""); // Limpa o pagador da edição
    setEditingExpenseSplitMode("equal"); // Restaura o modo padrão da edição
    setEditingManualPercentInputByUserId({}); // Limpa percentuais manuais da edição
  }

  function startEditExpenseForm(params: {
    title?: string | null;
    amountCents?: number | null;
    occurredOn?: string | null;
    paidByUserId?: string | null;
    splitMode?: ExpenseFormMode | null;
    manualPercentByUserId?: ManualPercentInputByUserId | null;
  }): void {
    setEditingExpenseTitle(params.title ?? ""); // Preenche título da edição
    setEditingExpenseAmount(centsToCurrencyInput(params.amountCents)); // Preenche valor da edição
    setEditingExpenseDate(normalizeDateInput(params.occurredOn)); // Preenche data da edição
    setEditingExpensePaidByUserId(params.paidByUserId ?? ""); // Preenche pagador da edição
    setEditingExpenseSplitMode(params.splitMode ?? "equal"); // Preenche modo da edição
    setEditingManualPercentInputByUserId(params.manualPercentByUserId ?? {}); // Preenche percentuais da edição
  }

  function updateMemberSalaryInput(userId: string, value: string): void {
    setMemberSalaryInputByUserId((currentState) => ({
      ...currentState, // Mantém os valores anteriores
      [userId]: value, // Atualiza apenas o usuário informado
    }));
  }

  function updateManualPercentInput(userId: string, value: string): void {
    setManualPercentInputByUserId((currentState) => ({
      ...currentState, // Mantém os valores anteriores
      [userId]: value, // Atualiza apenas o usuário informado
    }));
  }

  function updateEditingManualPercentInput(userId: string, value: string): void {
    setEditingManualPercentInputByUserId((currentState) => ({
      ...currentState, // Mantém os valores anteriores
      [userId]: value, // Atualiza apenas o usuário informado
    }));
  }

  function clearManualPercentInputs(): void {
    setManualPercentInputByUserId({}); // Limpa percentuais manuais da criação
  }

  function clearEditingManualPercentInputs(): void {
    setEditingManualPercentInputByUserId({}); // Limpa percentuais manuais da edição
  }

  return {
    newGroupName,
    setNewGroupName,

    newMemberName,
    setNewMemberName,

    newMemberEmail,
    setNewMemberEmail,

    expenseTitle,
    setExpenseTitle,

    expenseAmount,
    setExpenseAmount,

    expenseDate,
    setExpenseDate,

    expensePaidByUserId,
    setExpensePaidByUserId,

    expenseSplitMode,
    setExpenseSplitMode,

    memberSalaryInputByUserId,
    setMemberSalaryInputByUserId,

    manualPercentInputByUserId,
    setManualPercentInputByUserId,

    editingExpenseTitle,
    setEditingExpenseTitle,

    editingExpenseAmount,
    setEditingExpenseAmount,

    editingExpenseDate,
    setEditingExpenseDate,

    editingExpensePaidByUserId,
    setEditingExpensePaidByUserId,

    editingExpenseSplitMode,
    setEditingExpenseSplitMode,

    editingManualPercentInputByUserId,
    setEditingManualPercentInputByUserId,

    isCreateGroupDisabled,
    isAddMemberDisabled,
    isCreateExpenseDisabled,
    isUpdateExpenseDisabled,

    resetGroupForm,
    resetMemberForm,
    resetExpenseForm,
    resetEditExpenseForm,

    startEditExpenseForm,

    updateMemberSalaryInput,
    updateManualPercentInput,
    updateEditingManualPercentInput,
    clearManualPercentInputs,
    clearEditingManualPercentInputs,
  };
}