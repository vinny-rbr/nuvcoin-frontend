import { useEffect, useState } from "react"; // Hooks do React

type ExpenseMemberBalance = {
  userId?: string | null; // Id do usuário no balance
}; // Tipo mínimo para pegar o pagador padrão

type ExpenseBalancesLike = {
  members?: ExpenseMemberBalance[]; // Lista mínima de membros do balance
} | null; // Pode ser null

type UseGroupsExpensesParams = {
  selectedGroupId?: string | null; // Grupo atualmente selecionado
  balances?: ExpenseBalancesLike; // Balances do grupo atual
}; // Parâmetros do hook

export default function useGroupsExpenses({ selectedGroupId, balances }: UseGroupsExpensesParams) {
  // ==============================
  // STATE: aba do modal
  // ==============================

  const [expensesTab, setExpensesTab] = useState<"HOUSE" | "QUICK">("HOUSE"); // Aba ativa do modal

  // ==============================
  // STATE: conta do mês
  // ==============================

  const [houseName, setHouseName] = useState(""); // Nome da conta do mês
  const [houseAmountBRL, setHouseAmountBRL] = useState("0,00"); // Valor da conta em BRL
  const [houseDate, setHouseDate] = useState<string>(""); // Data da conta
  const [housePaidByUserId, setHousePaidByUserId] = useState<string>(""); // Quem pagou a conta
  const [houseLoading, setHouseLoading] = useState(false); // Loading ao criar conta do mês
  const [houseError, setHouseError] = useState<string | null>(null); // Erro da conta do mês
  const [houseSuccess, setHouseSuccess] = useState<string | null>(null); // Sucesso da conta do mês

  // ==============================
  // STATE: despesa avulsa
  // ==============================

  const [quickDesc, setQuickDesc] = useState(""); // Descrição da despesa avulsa
  const [quickAmountBRL, setQuickAmountBRL] = useState("0,00"); // Valor da despesa avulsa em BRL
  const [quickDate, setQuickDate] = useState<string>(""); // Data da despesa avulsa
  const [quickPaidByUserId, setQuickPaidByUserId] = useState<string>(""); // Quem pagou a despesa avulsa
  const [quickLoading, setQuickLoading] = useState(false); // Loading ao criar despesa avulsa
  const [quickError, setQuickError] = useState<string | null>(null); // Erro da despesa avulsa
  const [quickSuccess, setQuickSuccess] = useState<string | null>(null); // Sucesso da despesa avulsa

  // ==============================
  // HELPERS
  // ==============================

  function getDefaultPaidByUserId() {
    return (balances?.members ?? [])[0]?.userId ?? ""; // Retorna o primeiro membro como pagador padrão
  }

  // ==============================
  // RESET: feedbacks
  // ==============================

  function clearExpenseFeedback() {
    setHouseError(null); // Limpa erro da conta do mês
    setHouseSuccess(null); // Limpa sucesso da conta do mês
    setQuickError(null); // Limpa erro da despesa avulsa
    setQuickSuccess(null); // Limpa sucesso da despesa avulsa
  }

  // ==============================
  // RESET: formulários completos
  // ==============================

  function resetExpenseForms() {
    const defaultPaidBy = getDefaultPaidByUserId(); // Busca pagador padrão

    clearExpenseFeedback(); // Limpa feedbacks visuais

    setHouseName(""); // Reseta nome da conta
    setHouseAmountBRL("0,00"); // Reseta valor da conta
    setHouseDate(""); // Reseta data da conta
    setHousePaidByUserId(defaultPaidBy); // Reseta pagador da conta

    setQuickDesc(""); // Reseta descrição da despesa avulsa
    setQuickAmountBRL("0,00"); // Reseta valor da despesa avulsa
    setQuickDate(""); // Reseta data da despesa avulsa
    setQuickPaidByUserId(defaultPaidBy); // Reseta pagador da despesa avulsa
  }

  // ==============================
  // OPENERS
  // ==============================

  function prepareHouseExpenseFlow() {
    resetExpenseForms(); // Reseta os formulários antes de abrir
    setExpensesTab("HOUSE"); // Define a aba da conta do mês
  }

  function prepareQuickExpenseFlow() {
    resetExpenseForms(); // Reseta os formulários antes de abrir
    setExpensesTab("QUICK"); // Define a aba da despesa avulsa
  }

  // ==============================
  // INPUT BEHAVIOR: valores BRL
  // ==============================

  function handleHouseAmountFocus() {
    if ((houseAmountBRL ?? "").trim() === "0,00") setHouseAmountBRL(""); // Limpa zero padrão ao focar
  }

  function handleHouseAmountBlur() {
    if (!(houseAmountBRL ?? "").trim()) setHouseAmountBRL("0,00"); // Restaura zero padrão ao sair vazio
  }

  function handleQuickAmountFocus() {
    if ((quickAmountBRL ?? "").trim() === "0,00") setQuickAmountBRL(""); // Limpa zero padrão ao focar
  }

  function handleQuickAmountBlur() {
    if (!(quickAmountBRL ?? "").trim()) setQuickAmountBRL("0,00"); // Restaura zero padrão ao sair vazio
  }

  // ==============================
  // EFFECT: pagador padrão ao carregar balances
  // ==============================

  useEffect(() => {
    const firstUserId = getDefaultPaidByUserId(); // Primeiro userId disponível

    setHousePaidByUserId((prev) => {
      if (prev) return prev; // Mantém o valor atual se já existir
      return firstUserId; // Usa o primeiro membro como padrão
    });

    setQuickPaidByUserId((prev) => {
      if (prev) return prev; // Mantém o valor atual se já existir
      return firstUserId; // Usa o primeiro membro como padrão
    });
  }, [balances]); // Executa quando balances mudar

  // ==============================
  // EFFECT: reset ao trocar grupo
  // ==============================

  useEffect(() => {
    setExpensesTab("HOUSE"); // Volta para a aba padrão
    resetExpenseForms(); // Reseta os formulários ao trocar de grupo
    setHouseLoading(false); // Garante que loading não fique preso
    setQuickLoading(false); // Garante que loading não fique preso
  }, [selectedGroupId]); // Executa ao trocar grupo

  return {
    expensesTab,
    setExpensesTab,

    houseName,
    setHouseName,
    houseAmountBRL,
    setHouseAmountBRL,
    houseDate,
    setHouseDate,
    housePaidByUserId,
    setHousePaidByUserId,
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
    setQuickPaidByUserId,
    quickLoading,
    setQuickLoading,
    quickError,
    setQuickError,
    quickSuccess,
    setQuickSuccess,

    clearExpenseFeedback,
    resetExpenseForms,
    prepareHouseExpenseFlow,
    prepareQuickExpenseFlow,
    handleHouseAmountFocus,
    handleHouseAmountBlur,
    handleQuickAmountFocus,
    handleQuickAmountBlur,
  }; // Expõe estado e handlers da área de despesas
}

// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com
//
// Ajuste aplicado nesta etapa:
// - ✅ criado o hook useGroupsExpenses
// - ✅ centralizados os estados de despesas HOUSE e QUICK
// - ✅ centralizados resets, feedbacks, aba ativa e pagador padrão
// - ✅ centralizados handlers de focus/blur dos campos de valor
//
// Objetivo:
// - deixar o Groups.tsx ainda mais limpo
// - concentrar toda a regra local do modal de despesas em um hook próprio