import { useEffect, useMemo, useState } from "react"; // Hooks do React

// ==============================
// TYPES (grupos)
// ==============================

type GroupDto = {
  id: string; // Id do grupo (GUID)
  name: string; // Nome do grupo
  ownerUserId?: string; // (se vier do backend)
  createdAtUtc?: string; // (se vier do backend)
  isArchived?: boolean; // (se vier do backend)
};

type GroupsApiState = {
  groups: GroupDto[]; // Lista de grupos
  loading: boolean; // Carregando?
  error: string | null; // Erro (se tiver)
};

// ==============================
// TYPES (members - GET /api/groups/{groupId}/members)
// ==============================

type GroupMemberItemDto = {
  id: string; // Id do GroupMember (GUID)
  groupId: string; // Id do grupo
  userId: string; // Id do usuário
  role: string; // "Admin" | "Member"
  defaultSharePercent?: number | null; // Pode vir null
  accessStartUtc?: string | null; // Pode vir null
  accessEndUtc?: string | null; // Pode vir null
  createdAtUtc?: string; // Pode vir
};

type GroupMembersResponse = {
  groupId: string; // Id do grupo
  groupName: string; // Nome do grupo
  ownerUserId: string; // Owner
  members: GroupMemberItemDto[]; // Lista
};

// ==============================
// TYPES (expenses - GET /api/GroupExpenses/group/{groupId})
// ==============================

type GroupExpenseParticipantDto = {
  userId: string; // Id do usuário
  name: string; // Nome
  email: string; // Email
  shareCents: number; // Parcela em centavos
  isExcluded: boolean; // Excluído?
};

type GroupExpenseListItemDto = {
  id: string; // Id da despesa
  groupId: string; // Id do grupo
  description: string; // Descrição
  amountCents: number; // Total em centavos
  date: string; // Data ISO
  paidByUserId: string; // Quem pagou (Id)
  paidByName: string; // Quem pagou (nome)
  paidByEmail: string; // Quem pagou (email)
  createdByUserId: string; // Quem criou
  createdAtUtc: string; // Criado em
  participants: GroupExpenseParticipantDto[]; // Participantes
};

type GroupExpensesListResponse = {
  groupId: string; // Grupo
  totalCount: number; // Total
  items: GroupExpenseListItemDto[]; // Itens
};

// ==============================
// TYPES (balances - usamos só pra pegar NOME/EMAIL)
// ==============================

type GroupMemberBalanceDto = {
  userId: string; // Id do usuário
  name: string; // Nome
  email: string; // Email
  totalPaidCents: number; // Quanto pagou
  totalOwesCents: number; // Quanto deve
  settlementsSentCents: number; // Quitações enviadas
  settlementsReceivedCents: number; // Quitações recebidas
  giftsSentCents: number; // Gifts enviados (info)
  giftsReceivedCents: number; // Gifts recebidos (info)
  balanceCents: number; // Saldo líquido
};

type GroupBalancesResponse = {
  groupId: string; // Grupo
  asOfUtcDate: string; // Data corte
  consideredExpensesCount: number; // Despesas consideradas
  consideredSettlementsCount: number; // Settlements considerados
  consideredGiftsCount: number; // Gifts considerados
  members: GroupMemberBalanceDto[]; // "Members"
};

// ==============================
// TYPES (POST expense)
// ==============================

type CreateGroupExpenseRequest = {
  groupId: string; // Grupo
  description: string; // Descrição
  amountCents: number; // Total
  date: string; // DateTime ISO
  paidByUserId: string; // Quem pagou (API exige)
};

type CreateGroupExpenseResponse = {
  groupExpenseId: string; // Id criado
  groupId: string; // Grupo
  description: string; // Descrição
  amountCents: number; // Total
  date: string; // Data
  paidByUserId: string; // Quem pagou
  participantsCount: number; // Quantos participantes
  splitMode: "EQUAL" | "PERCENT"; // Modo
};

// ==============================
// TYPES (PUT expense - editar)
// ==============================

type UpdateGroupExpenseRequest = {
  description: string; // Descrição
  amountCents: number; // Total
  date: string; // DateTime ISO
  paidByUserId: string; // Quem pagou (mantemos o mesmo pra não quebrar API)
};

// ==============================
// TYPES (modo de divisão)
// ==============================

type GroupSplitMode = "SALARY" | "MANUAL"; // Automático por salário ou manual por percentual

// ==============================
// HELPERS
// ==============================

function getTokenFromStorage(): string | null {
  const candidates = ["token", "accessToken", "jwt", "authToken"]; // Possíveis chaves
  for (const key of candidates) {
    const value = localStorage.getItem(key); // Lê o valor
    if (value && value.trim().length > 0) return value; // Retorna se tiver
  }
  return null; // Não achou token
}

function getAuthTokenOrThrow(): string {
  const t = getTokenFromStorage(); // Lê do localStorage na hora (sempre atualizado)
  if (!t) throw new Error("Token não encontrado no localStorage. Faça login novamente."); // Sem token
  return t; // OK
}

function formatBRLFromCents(valueCents: number): string {
  const value = (valueCents ?? 0) / 100; // Centavos -> reais
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); // BRL
}

function formatBRL(value: number): string {
  const v = Number.isFinite(value) ? value : 0; // Segurança
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); // BRL
}

function toCentsFromBRLInput(value: string): number {
  const clean = (value ?? "")
    .replace(/[R$\s]/g, "") // Remove R$ e espaços
    .replace(/\./g, "") // Remove separador milhar
    .replace(",", "."); // Troca vírgula por ponto

  const number = Number(clean); // Converte
  if (!Number.isFinite(number) || number <= 0) return 0; // inválido
  return Math.round(number * 100); // Reais -> centavos
}

function toIsoForBackend(dateYYYYMMDD: string): string {
  if (!dateYYYYMMDD) return ""; // Se vier vazio, retorna vazio
  return `${dateYYYYMMDD}T00:00:00.000Z`; // ISO meia-noite UTC
}

function monthLabelBR(dateYYYYMMDD: string): string {
  const d = new Date(`${dateYYYYMMDD}T00:00:00.000Z`); // Data
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }); // Mês/Ano
}

function isGuid(value: string): boolean {
  const v = (value ?? "").trim(); // Trim
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v); // Regex GUID
}

function shortGuid(value: string): string {
  const v = (value ?? "").trim(); // Trim
  if (v.length < 8) return v; // Curto
  return `${v.slice(0, 8)}…`; // Exibe curto
}

function safeName(name?: string, email?: string, userId?: string): string {
  const n = (name ?? "").trim(); // Nome
  if (n) return n; // Se tiver nome, usa
  const e = (email ?? "").trim(); // Email
  if (e) return e; // Se tiver email, usa
  return shortGuid(userId ?? ""); // Fallback: Guid curto
}

function monthKeyFromISO(iso: string): string {
  // Retorna "YYYY-MM" usando UTC (pra não variar por fuso)
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function currentMonthKeyUTC(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function salaryStorageKey(groupId: string): string {
  return `nuvcoin:group:${groupId}:salaryBase`; // Chave fixa para salários
}

function splitModeStorageKey(groupId: string): string {
  return `nuvcoin:group:${groupId}:splitMode`; // Chave fixa para modo de divisão
}

function manualPercentStorageKey(groupId: string): string {
  return `nuvcoin:group:${groupId}:manualPercentBase`; // Chave fixa para percentuais manuais
}

function isoToDateInput(iso: string): string {
  // Converte "2026-03-05T00:00:00Z" -> "2026-03-05"
  if (!iso) return "";
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function centsToBRLInput(amountCents: number): string {
  // Converte 95000 -> "950,00" (pra input)
  const value = (amountCents ?? 0) / 100;
  const s = value.toFixed(2);
  return s.replace(".", ",");
}

function normalizePercentInputText(value: string): string {
  return (value ?? "")
    .replace(/[^\d,.\-]/g, "") // Mantém só números e separadores
    .replace(/\./g, ","); // Padroniza visual com vírgula
}

function percentTextToNumber(value: string): number {
  const normalized = (value ?? "").replace(/\s/g, "").replace(/\./g, "").replace(",", "."); // Normaliza
  const parsed = Number(normalized); // Converte
  if (!Number.isFinite(parsed) || parsed < 0) return 0; // Segurança
  return parsed; // Retorna número
}

function percentNumberToInput(value: number): string {
  const safe = Number.isFinite(value) && value >= 0 ? value : 0; // Segurança
  return safe.toFixed(2).replace(".", ","); // Ex: 60,00
}

// ==============================
// COMPONENT
// ==============================

export default function Groups() {
  // ✅ NÃO memorizamos token! (ele muda quando você loga de novo)
  // - Vamos ler do localStorage dentro de cada request com getAuthTokenOrThrow()

  // ==============================
  // STATE: groups
  // ==============================

  const [state, setState] = useState<GroupsApiState>({
    groups: [],
    loading: true,
    error: null,
  });

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null); // Grupo selecionado
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null); // Nome selecionado

  // ==============================
  // STATE: criar grupo (CLEAN)
  // ==============================

  const [newGroupName, setNewGroupName] = useState(""); // Nome do grupo
  const [createGroupLoading, setCreateGroupLoading] = useState(false); // Carregando
  const [createGroupError, setCreateGroupError] = useState<string | null>(null); // Erro
  const [createGroupSuccess, setCreateGroupSuccess] = useState<string | null>(null); // Sucesso

  // ==============================
  // STATE: members
  // ==============================

  const [membersInfo, setMembersInfo] = useState<GroupMembersResponse | null>(null); // Resposta members
  const [membersLoading, setMembersLoading] = useState(false); // Loading
  const [membersError, setMembersError] = useState<string | null>(null); // Error

  const [addMemberOpen, setAddMemberOpen] = useState(false); // Form add member aberto?
  const [addMemberUserId, setAddMemberUserId] = useState(""); // GUID
  const [addMemberLoading, setAddMemberLoading] = useState(false); // Loading
  const [addMemberError, setAddMemberError] = useState<string | null>(null); // Error
  const [addMemberSuccess, setAddMemberSuccess] = useState<string | null>(null); // Success

  const [removeMemberLoadingId, setRemoveMemberLoadingId] = useState<string | null>(null); // Qual member removendo
  const [removeMemberError, setRemoveMemberError] = useState<string | null>(null); // Error remover

  // ==============================
  // STATE: expenses list (histórico simples)
  // ==============================

  const [expenses, setExpenses] = useState<GroupExpensesListResponse | null>(null); // Lista
  const [expensesLoading, setExpensesLoading] = useState(false); // Loading
  const [expensesError, setExpensesError] = useState<string | null>(null); // Error

  // ==============================
  // STATE: balances (oculto) - usamos pra pegar nomes/emails
  // ==============================

  const [balances, setBalances] = useState<GroupBalancesResponse | null>(null); // Balances
  const [balancesLoading, setBalancesLoading] = useState(false); // Loading
  const [balancesError, setBalancesError] = useState<string | null>(null); // Error

  // ==============================
  // STATE: MODAL "Adicionar despesas"
  // ==============================

  const [expensesModalOpen, setExpensesModalOpen] = useState(false); // Modal aberto?
  const [expensesTab, setExpensesTab] = useState<"HOUSE" | "QUICK">("HOUSE"); // Aba ativa

  // ==============================
  // STATE: Conta do mês (dentro do MODAL)
  // ==============================

  const [houseName, setHouseName] = useState(""); // Nome (vazio)
  const [houseAmountBRL, setHouseAmountBRL] = useState("0,00"); // Valor (0,00)
  const [houseDate, setHouseDate] = useState<string>(""); // Data (vazia)

  // API exige paidByUserId, mas não mostramos no UX (vai automático)
  const [housePaidByUserId, setHousePaidByUserId] = useState<string>(""); // oculto

  const [houseLoading, setHouseLoading] = useState(false); // Loading
  const [houseError, setHouseError] = useState<string | null>(null); // Error
  const [houseSuccess, setHouseSuccess] = useState<string | null>(null); // Success

  // ==============================
  // STATE: despesa avulsa (dentro do MODAL)
  // ==============================

  const [quickDesc, setQuickDesc] = useState(""); // Desc
  const [quickAmountBRL, setQuickAmountBRL] = useState("0,00"); // Valor (0,00)
  const [quickDate, setQuickDate] = useState<string>(""); // Data (vazia)

  // API exige paidByUserId, mas não mostramos no UX (vai automático)
  const [quickPaidByUserId, setQuickPaidByUserId] = useState<string>(""); // oculto

  const [quickLoading, setQuickLoading] = useState(false); // Loading
  const [quickError, setQuickError] = useState<string | null>(null); // Error
  const [quickSuccess, setQuickSuccess] = useState<string | null>(null); // Success

  // ==============================
  // STATE: MODAL Base Salarial / Percentual
  // ==============================

  const [salaryModalOpen, setSalaryModalOpen] = useState(false); // Modal aberto?
  const [salaryError, setSalaryError] = useState<string | null>(null); // Erro do modal
  const [salarySuccess, setSalarySuccess] = useState<string | null>(null); // Sucesso do modal

  const [splitMode, setSplitMode] = useState<GroupSplitMode>("SALARY"); // Modo atual do grupo
  const [manualPercentInputByUserId, setManualPercentInputByUserId] = useState<Record<string, string>>({}); // Texto digitado no percentual manual

  // Mapa userId -> salário em BRL (number)
  const [salaryByUserId, setSalaryByUserId] = useState<Record<string, number>>({}); // Base salarial

  // ==============================
  // STATE: MODAL Editar despesa
  // ==============================

  const [editModalOpen, setEditModalOpen] = useState(false); // Modal editar aberto?
  const [editingExpense, setEditingExpense] = useState<GroupExpenseListItemDto | null>(null); // Qual despesa editando?
  const [editDesc, setEditDesc] = useState(""); // Descrição edit
  const [editAmountBRL, setEditAmountBRL] = useState("0,00"); // Valor edit
  const [editDate, setEditDate] = useState<string>(""); // Data edit
  const [editLoading, setEditLoading] = useState(false); // Loading edit
  const [editError, setEditError] = useState<string | null>(null); // Erro edit
  const [editSuccess, setEditSuccess] = useState<string | null>(null); // Sucesso edit

  // ==============================
  // STATE: Excluir despesa (loading por item)
  // ==============================

  const [deleteExpenseLoadingId, setDeleteExpenseLoadingId] = useState<string | null>(null); // Qual expense deletando?

  // Limite recomendado (apenas aviso)
  const RECOMMENDED_LIMIT_PERCENT = 30; // 30%

  // ==============================
  // RESET (abrir modal sempre limpa tudo)
  // - paidBy oculto = PRIMEIRO membro (balances)
  // ==============================

  function resetExpenseForms() {
    setHouseError(null);
    setHouseSuccess(null);
    setQuickError(null);
    setQuickSuccess(null);

    const defaultPaidBy = (balances?.members ?? [])[0]?.userId ?? "";

    setHouseName("");
    setHouseAmountBRL("0,00");
    setHouseDate("");
    setHousePaidByUserId(defaultPaidBy);

    setQuickDesc("");
    setQuickAmountBRL("0,00");
    setQuickDate("");
    setQuickPaidByUserId(defaultPaidBy);
  }

  // ==============================
  // RESET: modal editar
  // ==============================

  function openEditExpenseModal(expense: GroupExpenseListItemDto) {
    setEditError(null); // Limpa erro
    setEditSuccess(null); // Limpa sucesso
    setEditingExpense(expense); // Seta despesa
    setEditDesc(expense.description ?? ""); // Preenche desc
    setEditAmountBRL(centsToBRLInput(expense.amountCents ?? 0)); // Preenche valor
    setEditDate(isoToDateInput(expense.date)); // Preenche data
    setEditModalOpen(true); // Abre modal
  }

  function closeEditExpenseModal() {
    setEditModalOpen(false); // Fecha modal
    setEditingExpense(null); // Limpa alvo
    setEditError(null); // Limpa erro
    setEditSuccess(null); // Limpa sucesso
  }

  // ==============================
  // Base manual / modo: load & save
  // ==============================

  function buildDefaultManualPercentBase(memberIds: string[]) {
    const next: Record<string, number> = {}; // Novo mapa
    if (memberIds.length === 0) return next; // Sem membros

    const equalValue = 100 / memberIds.length; // Divisão igual base
    let accumulated = 0; // Soma acumulada

    memberIds.forEach((id, index) => {
      if (index === memberIds.length - 1) {
        next[id] = Number((100 - accumulated).toFixed(2)); // Último recebe ajuste fino
      } else {
        const rounded = Number(equalValue.toFixed(2)); // Arredonda 2 casas
        next[id] = rounded; // Define percentual
        accumulated += rounded; // Soma
      }
    });

    return next; // Retorna base padrão
  }

  function numberMapToInputMap(map: Record<string, number>) {
    const next: Record<string, string> = {}; // Novo mapa texto
    for (const [key, value] of Object.entries(map)) {
      next[key] = percentNumberToInput(value); // Converte número para texto do input
    }
    return next; // Retorna mapa texto
  }

  function getManualPercentNumberMap(memberIds: string[]) {
    const next: Record<string, number> = {}; // Novo mapa numérico
    for (const id of memberIds) {
      next[id] = percentTextToNumber(manualPercentInputByUserId[id] ?? "0"); // Converte texto atual para número
    }
    return next; // Retorna percentuais numéricos
  }

  function loadSplitMode(groupId: string) {
    try {
      const raw = localStorage.getItem(splitModeStorageKey(groupId)); // Lê modo salvo
      if (raw === "MANUAL" || raw === "SALARY") {
        setSplitMode(raw); // Usa valor salvo
        return;
      }
      setSplitMode("SALARY"); // Padrão
    } catch {
      setSplitMode("SALARY"); // Segurança
    }
  }

  function saveSplitMode(groupId: string, mode: GroupSplitMode) {
    localStorage.setItem(splitModeStorageKey(groupId), mode); // Salva modo
  }

  function loadManualPercentBase(groupId: string, memberIds: string[]) {
    try {
      const raw = localStorage.getItem(manualPercentStorageKey(groupId)); // Lê base salva
      const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {}; // Parse
      const next: Record<string, number> = {}; // Novo mapa

      for (const id of memberIds) {
        const value = Number(parsed?.[id] ?? 0); // Lê percentual
        next[id] = Number.isFinite(value) && value >= 0 ? value : 0; // Sanitiza
      }

      const total = Object.values(next).reduce((acc, v) => acc + v, 0); // Soma total

      if (total <= 0) {
        const defaults = buildDefaultManualPercentBase(memberIds); // Gera base igual
        setManualPercentInputByUserId(numberMapToInputMap(defaults)); // Joga no input
        return;
      }

      setManualPercentInputByUserId(numberMapToInputMap(next)); // Usa base carregada
    } catch {
      const defaults = buildDefaultManualPercentBase(memberIds); // Fallback
      setManualPercentInputByUserId(numberMapToInputMap(defaults)); // Joga no input
    }
  }

  function saveManualPercentBase(groupId: string, map: Record<string, number>) {
    localStorage.setItem(manualPercentStorageKey(groupId), JSON.stringify(map)); // Salva mapa manual
  }

  // ==============================
  // LOAD GROUPS
  // ==============================

  async function refreshGroups(selectGroupId?: string) {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const token = getAuthTokenOrThrow(); // ✅ pega token atualizado

      const response = await fetch("/api/groups", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro ao buscar grupos: HTTP ${response.status} - ${text || "sem detalhes"}`);
      }

      const data = (await response.json()) as GroupDto[];
      setState({ groups: data, loading: false, error: null });

      if (data.length === 0) {
        setSelectedGroupId(null);
        setSelectedGroupName(null);
        return;
      }

      const targetId = selectGroupId && data.some((g) => g.id === selectGroupId) ? selectGroupId : data[0].id;
      const target = data.find((g) => g.id === targetId) ?? data[0];

      setSelectedGroupId(target.id);
      setSelectedGroupName(target.name);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setState({ groups: [], loading: false, error: message });
    }
  }

  useEffect(() => {
    refreshGroups(); // ✅ roda sempre que montar o componente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==============================
  // MEMBERS / EXPENSES / BALANCES
  // ==============================

  async function refreshMembers(groupId: string) {
    try {
      setMembersLoading(true);
      setMembersError(null);

      const token = getAuthTokenOrThrow(); // ✅ pega token atualizado

      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro ao buscar membros: HTTP ${res.status} - ${text || "sem detalhes"}`);
      }

      const data = (await res.json()) as GroupMembersResponse;
      setMembersInfo(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setMembersError(message);
      setMembersInfo(null);
    } finally {
      setMembersLoading(false);
    }
  }

  async function refreshExpenses(groupId: string) {
    try {
      setExpensesLoading(true);
      setExpensesError(null);

      const token = getAuthTokenOrThrow(); // ✅ pega token atualizado

      const res = await fetch(`/api/GroupExpenses/group/${groupId}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro ao buscar despesas: HTTP ${res.status} - ${text || "sem detalhes"}`);
      }

      const data = (await res.json()) as GroupExpensesListResponse;
      setExpenses(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setExpensesError(message);
      setExpenses(null);
    } finally {
      setExpensesLoading(false);
    }
  }

  async function refreshBalances(groupId: string) {
    try {
      setBalancesLoading(true);
      setBalancesError(null);

      const token = getAuthTokenOrThrow(); // ✅ pega token atualizado

      const res = await fetch(`/api/GroupExpenses/group/${groupId}/balances`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro ao buscar dados do grupo: HTTP ${res.status} - ${text || "sem detalhes"}`);
      }

      const data = (await res.json()) as GroupBalancesResponse;
      setBalances(data);

      // paidBy oculto (somente se ainda estiver vazio)
      setHousePaidByUserId((prev) => {
        if (prev) return prev;
        if (data.members?.length) return data.members[0].userId;
        return prev;
      });

      setQuickPaidByUserId((prev) => {
        if (prev) return prev;
        if (data.members?.length) return data.members[0].userId;
        return prev;
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setBalancesError(message);
      setBalances(null);
    } finally {
      setBalancesLoading(false);
    }
  }

  // ==============================
  // Base Salarial: carregar do localStorage quando mudar grupo
  // ==============================

  function loadSalaryBase(groupId: string, memberIds: string[]) {
    try {
      const key = salaryStorageKey(groupId);
      const raw = localStorage.getItem(key);

      const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      const next: Record<string, number> = {};

      // Mantém somente membros do grupo e garante default 0
      for (const id of memberIds) {
        const v = Number(parsed?.[id] ?? 0);
        next[id] = Number.isFinite(v) && v >= 0 ? v : 0;
      }

      setSalaryByUserId(next);
    } catch {
      // Se der erro de parse, zera
      const next: Record<string, number> = {};
      for (const id of memberIds) next[id] = 0;
      setSalaryByUserId(next);
    }
  }

  function saveSalaryBase(groupId: string, map: Record<string, number>) {
    const key = salaryStorageKey(groupId);
    localStorage.setItem(key, JSON.stringify(map));
  }

  useEffect(() => {
    async function loadDetails() {
      if (!selectedGroupId) return;

      setExpensesModalOpen(false);
      setExpensesTab("HOUSE");
      setSalaryModalOpen(false);

      closeEditExpenseModal(); // ✅ Fecha modal de edição ao trocar grupo

      setCreateGroupError(null);
      setCreateGroupSuccess(null);
      setAddMemberError(null);
      setAddMemberSuccess(null);
      setRemoveMemberError(null);

      setHouseError(null);
      setHouseSuccess(null);
      setQuickError(null);
      setQuickSuccess(null);

      setSalaryError(null);
      setSalarySuccess(null);

      await refreshMembers(selectedGroupId);
      await refreshExpenses(selectedGroupId);
      await refreshBalances(selectedGroupId);
    }

    loadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupId]);

  // Quando balances chegar/atualizar, carrega base salarial do grupo + modo manual
  useEffect(() => {
    if (!selectedGroupId) return;
    const ids = (balances?.members ?? []).map((m) => m.userId);
    if (ids.length === 0) return;

    loadSalaryBase(selectedGroupId, ids);
    loadManualPercentBase(selectedGroupId, ids);
    loadSplitMode(selectedGroupId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupId, balances?.members?.length]);

  // ==============================
  // GROUP: create
  // ==============================

  async function onCreateGroup() {
    try {
      setCreateGroupError(null);
      setCreateGroupSuccess(null);

      const token = getAuthTokenOrThrow(); // ✅ pega token atualizado

      const name = newGroupName.trim();
      if (!name) {
        setCreateGroupError("Digite um nome para o grupo.");
        return;
      }

      setCreateGroupLoading(true);

      const res = await fetch("/api/groups", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro ao criar grupo: HTTP ${res.status} - ${text || "sem detalhes"}`);
      }

      const created = (await res.json()) as GroupDto;

      setCreateGroupSuccess(`Grupo criado: ${created.name}`);
      setNewGroupName("");

      await refreshGroups(created.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setCreateGroupError(message);
    } finally {
      setCreateGroupLoading(false);
    }
  }

  // ==============================
  // GROUP: delete (soft delete)
  // ==============================

  async function onDeleteGroup() {
    try {
      if (!selectedGroupId) return;

      const token = getAuthTokenOrThrow(); // ✅ pega token atualizado

      const confirmDelete = window.confirm(`Excluir o grupo "${selectedGroupName ?? ""}"?\n\nIsso arquiva o grupo (soft delete).`);

      if (!confirmDelete) return;

      const res = await fetch(`/api/groups/${selectedGroupId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro ao excluir grupo: HTTP ${res.status} - ${text || "sem detalhes"}`);
      }

      setSelectedGroupId(null);
      setSelectedGroupName(null);

      setMembersInfo(null);
      setExpenses(null);
      setBalances(null);

      setExpensesModalOpen(false);
      setSalaryModalOpen(false);

      closeEditExpenseModal(); // ✅ Fecha modal de edição

      await refreshGroups();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      alert(message);
    }
  }

  // ==============================
  // MEMBERS: add / remove
  // ==============================

  async function onAddMember() {
    try {
      setAddMemberError(null);
      setAddMemberSuccess(null);

      if (!selectedGroupId) {
        setAddMemberError("Selecione um grupo antes de adicionar membros.");
        return;
      }

      const token = getAuthTokenOrThrow(); // ✅ pega token atualizado

      const userId = addMemberUserId.trim();
      if (!isGuid(userId)) {
        setAddMemberError("Cole um UserId válido (GUID).");
        return;
      }

      setAddMemberLoading(true);

      const res = await fetch(`/api/groups/${selectedGroupId}/members`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro ao adicionar membro: HTTP ${res.status} - ${text || "sem detalhes"}`);
      }

      setAddMemberSuccess("Membro adicionado.");
      setAddMemberUserId("");
      setAddMemberOpen(false);

      await refreshMembers(selectedGroupId);
      await refreshBalances(selectedGroupId);
      await refreshExpenses(selectedGroupId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setAddMemberError(message);
    } finally {
      setAddMemberLoading(false);
    }
  }

  async function onRemoveMember(memberId: string, role: string) {
    try {
      setRemoveMemberError(null);

      if (!selectedGroupId) {
        setRemoveMemberError("Selecione um grupo antes de remover membros.");
        return;
      }

      const token = getAuthTokenOrThrow(); // ✅ pega token atualizado

      if (role === "Admin") {
        setRemoveMemberError("Não é possível remover o Admin do grupo.");
        return;
      }

      const confirmRemove = window.confirm("Remover este membro do grupo?");
      if (!confirmRemove) return;

      setRemoveMemberLoadingId(memberId);

      const res = await fetch(`/api/groups/${selectedGroupId}/members/${memberId}`, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erro ao remover membro: HTTP ${res.status} - ${text || "sem detalhes"}`);
      }

      await refreshMembers(selectedGroupId);
      await refreshBalances(selectedGroupId);
      await refreshExpenses(selectedGroupId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setRemoveMemberError(message);
    } finally {
      setRemoveMemberLoadingId(null);
    }
  }

  // ==============================
  // POST helper
  // ==============================

  async function postExpense(payload: CreateGroupExpenseRequest): Promise<CreateGroupExpenseResponse> {
    const token = getAuthTokenOrThrow(); // ✅ pega token atualizado

    const res = await fetch(`/api/GroupExpenses`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Erro ao criar despesa: HTTP ${res.status} - ${text || "sem detalhes"}`);
    }

    const data = (await res.json()) as CreateGroupExpenseResponse;
    return data;
  }

  // ==============================
  // PUT helper (editar despesa)
  // ==============================

  async function putExpense(expenseId: string, payload: UpdateGroupExpenseRequest): Promise<void> {
    const token = getAuthTokenOrThrow(); // ✅ pega token atualizado

    const res = await fetch(`/api/GroupExpenses/${expenseId}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Erro ao editar despesa: HTTP ${res.status} - ${text || "sem detalhes"}`);
    }
  }

  // ==============================
  // DELETE helper (excluir despesa)
  // ==============================

  async function deleteExpense(expenseId: string): Promise<void> {
    const token = getAuthTokenOrThrow(); // ✅ pega token atualizado

    const res = await fetch(`/api/GroupExpenses/${expenseId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Erro ao excluir despesa: HTTP ${res.status} - ${text || "sem detalhes"}`);
    }
  }

  // ==============================
  // EDIT: confirmar edição
  // ==============================

  async function onSaveEditExpense() {
    try {
      setEditError(null);
      setEditSuccess(null);

      if (!selectedGroupId) {
        setEditError("Selecione um grupo.");
        return;
      }

      if (!editingExpense) {
        setEditError("Nenhuma despesa selecionada.");
        return;
      }

      const desc = editDesc.trim();
      if (!desc) {
        setEditError("Digite a descrição.");
        return;
      }

      const amountCents = toCentsFromBRLInput(editAmountBRL);
      if (amountCents <= 0) {
        setEditError("Digite um valor válido. Ex: 10,50");
        return;
      }

      if (!editDate) {
        setEditError("Selecione a data.");
        return;
      }

      // Mantemos paidByUserId original (API pode exigir)
      const paidBy = editingExpense.paidByUserId || (balances?.members ?? [])[0]?.userId || "";
      if (!paidBy) {
        setEditError("Não foi possível identificar quem pagou (paidByUserId).");
        return;
      }

      const payload: UpdateGroupExpenseRequest = {
        description: desc,
        amountCents: amountCents,
        date: toIsoForBackend(editDate),
        paidByUserId: paidBy,
      };

      setEditLoading(true);

      await putExpense(editingExpense.id, payload);
      setEditSuccess("Despesa atualizada.");

      await refreshExpenses(selectedGroupId);
      await refreshBalances(selectedGroupId);

      closeEditExpenseModal(); // ✅ fecha ao salvar
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setEditError(message);
    } finally {
      setEditLoading(false);
    }
  }

  // ==============================
  // DELETE: excluir item do histórico
  // ==============================

  async function onDeleteExpenseFromHistory(expense: GroupExpenseListItemDto) {
    try {
      if (!selectedGroupId) return;

      const confirmDelete = window.confirm(`Excluir esta despesa?\n\n"${expense.description}"\n${formatBRLFromCents(expense.amountCents)}`);
      if (!confirmDelete) return;

      setDeleteExpenseLoadingId(expense.id);

      await deleteExpense(expense.id);

      await refreshExpenses(selectedGroupId);
      await refreshBalances(selectedGroupId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      alert(message);
    } finally {
      setDeleteExpenseLoadingId(null);
    }
  }

  // ==============================
  // CREATE: Conta do mês
  // ==============================

  async function onCreateHouseExpense() {
    try {
      setHouseError(null);
      setHouseSuccess(null);
      setQuickError(null);
      setQuickSuccess(null);

      if (!selectedGroupId) {
        setHouseError("Selecione um grupo antes de criar despesa.");
        return;
      }

      if (!houseName.trim()) {
        setHouseError("Digite o nome da conta. Ex: Aluguel");
        return;
      }

      const amountCents = toCentsFromBRLInput(houseAmountBRL);
      if (amountCents <= 0) {
        setHouseError("Digite um valor válido. Ex: 900,00");
        return;
      }

      if (!houseDate) {
        setHouseError("Selecione a data.");
        return;
      }

      // paidBy automático (API exige)
      const paidBy = housePaidByUserId || (balances?.members ?? [])[0]?.userId || "";
      if (!paidBy) {
        setHouseError("Adicione pessoas no grupo antes de lançar despesas.");
        return;
      }

      const payload: CreateGroupExpenseRequest = {
        groupId: selectedGroupId,
        description: `${houseName.trim()} — ${monthLabelBR(houseDate)}`,
        amountCents: amountCents,
        date: toIsoForBackend(houseDate),
        paidByUserId: paidBy,
      };

      setHouseLoading(true);

      const data = await postExpense(payload);
      setHouseSuccess(`Conta criada — ${formatBRLFromCents(data.amountCents)}`);

      await refreshExpenses(selectedGroupId);
      await refreshBalances(selectedGroupId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setHouseError(message);
    } finally {
      setHouseLoading(false);
    }
  }

  // ==============================
  // CREATE: despesa avulsa
  // ==============================

  async function onCreateQuickExpense() {
    try {
      setQuickError(null);
      setQuickSuccess(null);
      setHouseError(null);
      setHouseSuccess(null);

      if (!selectedGroupId) {
        setQuickError("Selecione um grupo antes de criar despesa.");
        return;
      }

      if (!quickDesc.trim()) {
        setQuickError("Digite uma descrição. Ex: Mercado");
        return;
      }

      const amountCents = toCentsFromBRLInput(quickAmountBRL);
      if (amountCents <= 0) {
        setQuickError("Digite um valor válido. Ex: 10,50");
        return;
      }

      if (!quickDate) {
        setQuickError("Selecione a data.");
        return;
      }

      // paidBy automático (API exige)
      const paidBy = quickPaidByUserId || (balances?.members ?? [])[0]?.userId || "";
      if (!paidBy) {
        setQuickError("Adicione pessoas no grupo antes de lançar despesas.");
        return;
      }

      const payload: CreateGroupExpenseRequest = {
        groupId: selectedGroupId,
        description: quickDesc.trim(),
        amountCents: amountCents,
        date: toIsoForBackend(quickDate),
        paidByUserId: paidBy,
      };

      setQuickLoading(true);

      const data = await postExpense(payload);
      setQuickSuccess(`Despesa criada — ${formatBRLFromCents(data.amountCents)}`);

      await refreshExpenses(selectedGroupId);
      await refreshBalances(selectedGroupId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setQuickError(message);
    } finally {
      setQuickLoading(false);
    }
  }

  // ==============================
  // UI data
  // ==============================

  const members = balances?.members ?? []; // Preferimos nomes/emails do balances

  const membersCount = useMemo(() => {
    const c = membersInfo?.members?.length ?? 0;
    return c;
  }, [membersInfo?.members?.length]);

  const currentMonthKey = useMemo(() => currentMonthKeyUTC(), []);

  const monthExpenses = useMemo(() => {
    const items = expenses?.items ?? [];
    return items.filter((e) => monthKeyFromISO(e.date) === currentMonthKey);
  }, [expenses?.items, currentMonthKey]);

  const monthTotalCents = useMemo(() => {
    return (monthExpenses ?? []).reduce((acc, e) => acc + (e.amountCents ?? 0), 0);
  }, [monthExpenses]);

  const salaryTotal = useMemo(() => {
    return members.reduce((acc, m) => acc + (Number(salaryByUserId[m.userId] ?? 0) || 0), 0);
  }, [members, salaryByUserId]);

  const salaryWeights = useMemo(() => {
    // weight_i = salario / somaSalarios
    const total = salaryTotal;
    const map: Record<string, number> = {};

    if (total <= 0) {
      for (const m of members) map[m.userId] = 0;
      return map;
    }

    for (const m of members) {
      const s = Number(salaryByUserId[m.userId] ?? 0) || 0;
      map[m.userId] = s > 0 ? s / total : 0;
    }

    return map;
  }, [members, salaryByUserId, salaryTotal]);

  const manualPercentNumberByUserId = useMemo(() => {
    return getManualPercentNumberMap(members.map((m) => m.userId)); // Converte os textos atuais para número
  }, [members, manualPercentInputByUserId]);

  const manualPercentTotal = useMemo(() => {
    return members.reduce((acc, m) => acc + (Number(manualPercentNumberByUserId[m.userId] ?? 0) || 0), 0);
  }, [members, manualPercentNumberByUserId]);

  const manualWeights = useMemo(() => {
    // weight_i = percentual / 100
    const map: Record<string, number> = {};

    for (const m of members) {
      const percent = Number(manualPercentNumberByUserId[m.userId] ?? 0) || 0;
      map[m.userId] = percent > 0 ? percent / 100 : 0;
    }

    return map;
  }, [members, manualPercentNumberByUserId]);

  const isManualConfigValid = useMemo(() => {
    if (members.length === 0) return false; // Sem membros
    if (manualPercentTotal <= 0) return false; // Soma zerada
    return Math.abs(manualPercentTotal - 100) < 0.01; // Precisa fechar em 100
  }, [members.length, manualPercentTotal]);

  const activeWeights = useMemo(() => {
    return splitMode === "MANUAL" ? manualWeights : salaryWeights; // Escolhe o mapa certo
  }, [splitMode, manualWeights, salaryWeights]);

  const canCalculateMonthSplit = useMemo(() => {
    if (splitMode === "MANUAL") return isManualConfigValid; // Manual precisa dar 100
    return salaryTotal > 0; // Salário precisa ter base maior que 0
  }, [splitMode, isManualConfigValid, salaryTotal]);

  const monthSplit = useMemo(() => {
    // P_i = totalMes * weight_i
    const total = monthTotalCents / 100;
    const rows = members.map((m) => {
      const salary = Number(salaryByUserId[m.userId] ?? 0) || 0;
      const weight = Number(activeWeights[m.userId] ?? 0) || 0;
      const shouldPay = total * weight;
      const percentOfSalary = salary > 0 ? (shouldPay / salary) * 100 : 0;

      return {
        userId: m.userId,
        label: safeName(m.name, m.email, m.userId),
        salary,
        weightPercent: weight * 100,
        shouldPay,
        percentOfSalary,
        manualPercent: Number(manualPercentNumberByUserId[m.userId] ?? 0) || 0,
      };
    });

    // Ordena por quem paga mais (desc)
    rows.sort((a, b) => b.shouldPay - a.shouldPay);

    return rows;
  }, [members, monthTotalCents, salaryByUserId, activeWeights, manualPercentNumberByUserId]);

  const historyItems = useMemo(() => {
    const items = expenses?.items ?? [];
    return items.slice(0, 12);
  }, [expenses?.items]);

  const salaryFilledCount = useMemo(() => {
    const ids = members.map((m) => m.userId);
    const filled = ids.filter((id) => (Number(salaryByUserId[id] ?? 0) || 0) > 0).length;
    return filled;
  }, [members, salaryByUserId]);

  // ==============================
  // UI styles
  // ==============================

  const cardStyle: React.CSSProperties = {
    padding: 14,
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.03)",
  };

  const subtleText: React.CSSProperties = {
    opacity: 0.75,
    fontSize: 12,
  };

  const primaryButton: React.CSSProperties = {
    cursor: "pointer",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "12px 14px",
    background: "rgba(255,255,255,0.08)",
    color: "inherit",
    fontWeight: 900,
  };

  const ghostButton: React.CSSProperties = {
    cursor: "pointer",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "8px 12px",
    background: "transparent",
    color: "inherit",
    fontWeight: 800,
  };

  const smallButton: React.CSSProperties = {
    cursor: "pointer",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "8px 14px",
    background: "rgba(255,255,255,0.03)",
    color: "inherit",
    fontWeight: 900,
  };

  const dangerButtonSmall: React.CSSProperties = {
    cursor: "pointer",
    borderRadius: 12,
    border: "1px solid rgba(255,120,120,0.35)",
    padding: "8px 12px",
    background: "rgba(255,0,0,0.06)",
    color: "#ffb4b4",
    fontWeight: 900,
  };

  const inputStyle: React.CSSProperties = {
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "inherit",
    outline: "none",
  };

  const modalOverlay: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.60)",
    display: "grid",
    placeItems: "center",
    zIndex: 50,
    padding: 16,
  };

  const modalCard: React.CSSProperties = {
    width: "min(980px, 96vw)",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(12,16,25,0.94)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
    overflow: "hidden",
  };

  const modalHeader: React.CSSProperties = {
    padding: 16,
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  };

  const modalBody: React.CSSProperties = {
    padding: 16,
    display: "grid",
    gap: 12,
  };

  const tabButton = (active: boolean): React.CSSProperties => ({
    ...ghostButton,
    border: active ? "1px solid rgba(255,255,255,0.30)" : "1px solid rgba(255,255,255,0.12)",
    background: active ? "rgba(255,255,255,0.06)" : "transparent",
  });

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* HEADER */}
      <div style={{ display: "grid", gap: 6 }}>
        <h2 style={{ margin: 0 }}>Grupos</h2>
        <div style={{ marginTop: 2, ...subtleText }}>
          Fluxo: crie o grupo → adicione pessoas → defina salários ou percentuais → lance despesas.
        </div>
      </div>

      {state.error && (
        <div style={cardStyle}>
          <strong>Falha:</strong> {state.error}
        </div>
      )}

      {/* LAYOUT (2 colunas) */}
      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 14, alignItems: "start" }}>
        {/* COLUNA ESQUERDA */}
        <div style={{ display: "grid", gap: 12 }}>
          {/* NOVO GRUPO */}
          <div style={cardStyle}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Novo grupo</div>

            <div style={{ display: "grid", gap: 10 }}>
              <input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Ex: Casa 2026, Apê, Viagem…" style={inputStyle} />

              {createGroupError && (
                <div style={{ ...subtleText, opacity: 0.9 }}>
                  <strong>Falha:</strong> {createGroupError}
                </div>
              )}

              {createGroupSuccess && <div style={{ ...subtleText, opacity: 0.9 }}>✅ {createGroupSuccess}</div>}

              <button
                type="button"
                onClick={onCreateGroup}
                disabled={createGroupLoading}
                style={{
                  ...primaryButton,
                  cursor: createGroupLoading ? "not-allowed" : "pointer",
                  opacity: createGroupLoading ? 0.7 : 1,
                }}
              >
                {createGroupLoading ? "Criando..." : "Criar grupo"}
              </button>
            </div>
          </div>

          {/* LISTA DE GRUPOS */}
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 900 }}>Meus grupos</div>
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
                {state.loading ? "…" : "Atualizar"}
              </button>
            </div>

            {state.loading && <div style={subtleText}>Carregando…</div>}

            {!state.loading && !state.error && state.groups.length === 0 && <div style={subtleText}>Você ainda não tem grupos. Crie o primeiro 🙂</div>}

            {!state.loading &&
              !state.error &&
              state.groups.map((g) => {
                const active = g.id === selectedGroupId;

                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(g.id);
                      setSelectedGroupName(g.name);

                      setCreateGroupSuccess(null);
                      setCreateGroupError(null);

                      setHouseSuccess(null);
                      setHouseError(null);
                      setQuickSuccess(null);
                      setQuickError(null);

                      setAddMemberSuccess(null);
                      setAddMemberError(null);
                      setRemoveMemberError(null);

                      setSalaryError(null);
                      setSalarySuccess(null);

                      setExpensesModalOpen(false);
                      setSalaryModalOpen(false);

                      closeEditExpenseModal(); // ✅ fecha modal de edição se estiver aberto
                    }}
                    style={{
                      cursor: "pointer",
                      textAlign: "left",
                      padding: 14,
                      borderRadius: 16,
                      border: active ? "1px solid rgba(255,255,255,0.30)" : "1px solid rgba(255,255,255,0.12)",
                      background: active ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                      color: "inherit",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>{g.name}</div>
                    <div style={subtleText}>{active ? "Selecionado" : "Abrir"}</div>
                  </button>
                );
              })}
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div style={{ display: "grid", gap: 12 }}>
          {/* HEADER DO GRUPO */}
          <div style={{ ...cardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ display: "grid", gap: 2 }}>
              <div style={{ fontWeight: 900 }}>{selectedGroupName ?? "Selecione um grupo"}</div>
              {selectedGroupId ? <div style={subtleText}>{membersCount} pessoa(s)</div> : <div style={subtleText}>—</div>}
            </div>

            {selectedGroupId && (
              <button
                type="button"
                onClick={onDeleteGroup}
                style={{
                  cursor: "pointer",
                  borderRadius: 12,
                  border: "1px solid rgba(255,100,100,0.35)",
                  padding: "8px 12px",
                  background: "rgba(255,0,0,0.06)",
                  color: "#ffb4b4",
                  fontWeight: 900,
                }}
              >
                Excluir
              </button>
            )}
          </div>

          {!selectedGroupId && (
            <div style={cardStyle}>
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Comece por um grupo</div>
              <div style={subtleText}>Crie um grupo na esquerda e clique nele para abrir.</div>
            </div>
          )}

          {selectedGroupId && (
            <>
              {/* MEMBROS */}
              <div style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "grid" }}>
                    <div style={{ fontWeight: 900 }}>Pessoas</div>
                    <div style={subtleText}>Quem participa do grupo.</div>
                  </div>

                  <button type="button" onClick={() => setAddMemberOpen((v) => !v)} style={ghostButton}>
                    {addMemberOpen ? "Fechar" : "Adicionar"}
                  </button>
                </div>

                {(membersLoading || balancesLoading) && <div style={{ ...subtleText, marginTop: 10 }}>Carregando…</div>}

                {membersError && (
                  <div style={{ ...subtleText, marginTop: 10 }}>
                    <strong>Falha:</strong> {membersError}
                  </div>
                )}

                {balancesError && (
                  <div style={{ ...subtleText, marginTop: 10 }}>
                    <strong>Falha:</strong> {balancesError}
                  </div>
                )}

                {removeMemberError && (
                  <div style={{ ...subtleText, marginTop: 10 }}>
                    <strong>Falha:</strong> {removeMemberError}
                  </div>
                )}

                {!membersLoading && !membersError && membersInfo?.members?.length ? (
                  <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                    {membersInfo.members.map((m) => {
                      const rich = members.find((x) => x.userId === m.userId);
                      const display = safeName(rich?.name, rich?.email, m.userId);

                      return (
                        <div
                          key={m.id}
                          style={{
                            padding: 12,
                            borderRadius: 14,
                            border: "1px solid rgba(255,255,255,0.10)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                            background: "rgba(255,255,255,0.02)",
                          }}
                        >
                          <div style={{ display: "grid", gap: 2 }}>
                            <div style={{ fontWeight: 900 }}>
                              {display} <span style={{ opacity: 0.8, fontWeight: 800 }}>{m.role === "Admin" ? "• Admin" : ""}</span>
                            </div>
                            <div style={subtleText}>{m.role === "Admin" ? "Dono do grupo" : "Membro"}</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onRemoveMember(m.id, m.role)}
                            disabled={removeMemberLoadingId === m.id || m.role === "Admin"}
                            style={{
                              ...ghostButton,
                              cursor: removeMemberLoadingId === m.id || m.role === "Admin" ? "not-allowed" : "pointer",
                              opacity: m.role === "Admin" ? 0.5 : 1,
                            }}
                          >
                            {removeMemberLoadingId === m.id ? "Removendo…" : "Remover"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  !membersLoading && !membersError && <div style={{ ...subtleText, marginTop: 10 }}>Sem pessoas no grupo.</div>
                )}

                {addMemberOpen && (
                  <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ fontWeight: 800, opacity: 0.95 }}>Adicionar pessoa</div>
                      <div style={subtleText}>Por enquanto: cole o UserId (GUID). Depois vamos trocar por e-mail.</div>
                      <input value={addMemberUserId} onChange={(e) => setAddMemberUserId(e.target.value)} placeholder="UserId (GUID)" style={inputStyle} />
                    </div>

                    {addMemberError && (
                      <div style={subtleText}>
                        <strong>Falha:</strong> {addMemberError}
                      </div>
                    )}

                    {addMemberSuccess && <div style={subtleText}>✅ {addMemberSuccess}</div>}

                    <button
                      type="button"
                      onClick={onAddMember}
                      disabled={addMemberLoading}
                      style={{
                        ...primaryButton,
                        cursor: addMemberLoading ? "not-allowed" : "pointer",
                        opacity: addMemberLoading ? 0.7 : 1,
                      }}
                    >
                      {addMemberLoading ? "Adicionando…" : "Adicionar"}
                    </button>
                  </div>
                )}
              </div>

              {/* CARD: Base Salarial / Percentual */}
              <div style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "grid", gap: 2 }}>
                    <div style={{ fontWeight: 900 }}>Base do grupo ({splitMode === "SALARY" ? "salários" : "percentual manual"})</div>
                    <div style={subtleText}>
                      {splitMode === "SALARY"
                        ? `${salaryFilledCount}/${members.length} salários preenchidos. A divisão do mês usa isso.`
                        : `Percentual manual total: ${manualPercentTotal.toFixed(2)}%. A soma precisa fechar 100%.`}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSalaryError(null);
                      setSalarySuccess(null);
                      setSalaryModalOpen(true);
                    }}
                    disabled={!selectedGroupId || members.length === 0}
                    style={{
                      ...smallButton,
                      cursor: !selectedGroupId || members.length === 0 ? "not-allowed" : "pointer",
                      opacity: !selectedGroupId || members.length === 0 ? 0.7 : 1,
                    }}
                  >
                    Definir
                  </button>
                </div>

                {splitMode === "SALARY" && salaryTotal <= 0 && (
                  <div style={{ ...subtleText, marginTop: 10 }}>⚠️ Defina salários para o sistema calcular quanto cada um paga no mês.</div>
                )}

                {splitMode === "MANUAL" && !isManualConfigValid && (
                  <div style={{ ...subtleText, marginTop: 10 }}>⚠️ Ajuste os percentuais para a soma fechar exatamente em 100%.</div>
                )}

                {((splitMode === "SALARY" && salaryTotal > 0) || (splitMode === "MANUAL" && members.length > 0)) && (
                  <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                    {members.map((m) => {
                      const salary = Number(salaryByUserId[m.userId] ?? 0) || 0;
                      const salaryWeight = (Number(salaryWeights[m.userId] ?? 0) || 0) * 100;
                      const manualPercent = Number(manualPercentNumberByUserId[m.userId] ?? 0) || 0;

                      return (
                        <div
                          key={m.userId}
                          style={{
                            padding: 10,
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.10)",
                            background: "rgba(255,255,255,0.02)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div style={{ fontWeight: 900 }}>{safeName(m.name, m.email, m.userId)}</div>

                          {splitMode === "SALARY" ? (
                            <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap", justifyContent: "flex-end" }}>
                              <span style={subtleText}>Salário: {salary > 0 ? formatBRL(salary) : "—"}</span>
                              <span style={{ ...subtleText, opacity: 0.95 }}>Peso: {salaryWeight.toFixed(0)}%</span>
                            </div>
                          ) : (
                            <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap", justifyContent: "flex-end" }}>
                              <span style={subtleText}>Percentual manual</span>
                              <span style={{ ...subtleText, opacity: 0.95 }}>{manualPercent.toFixed(2)}%</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* CARD ÚNICO: "Adicionar despesas" */}
              <div style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "grid", gap: 2 }}>
                    <div style={{ fontWeight: 900 }}>Adicionar despesas</div>
                    <div style={subtleText}>Conta do mês ou despesa avulsa. Clique para abrir.</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      resetExpenseForms();
                      setExpensesTab("HOUSE");
                      setExpensesModalOpen(true);
                    }}
                    disabled={!selectedGroupId}
                    style={{
                      ...smallButton,
                      cursor: !selectedGroupId ? "not-allowed" : "pointer",
                      opacity: !selectedGroupId ? 0.7 : 1,
                    }}
                  >
                    Abrir
                  </button>
                </div>

                {splitMode === "SALARY" && salaryTotal <= 0 && <div style={{ ...subtleText, marginTop: 10 }}>Dica: defina salários primeiro para o resumo do mês ficar certinho.</div>}

                {splitMode === "MANUAL" && !isManualConfigValid && (
                  <div style={{ ...subtleText, marginTop: 10 }}>Dica: ajuste os percentuais manuais para 100% antes de conferir o resumo.</div>
                )}
              </div>

              {/* RESUMO DO MÊS */}
              <div style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "grid", gap: 2 }}>
                    <div style={{ fontWeight: 900 }}>Resumo do mês</div>
                    <div style={subtleText}>
                      Mês atual (UTC): {currentMonthKey} • Modo: {splitMode === "SALARY" ? "Automático por salário" : "Manual por percentual"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => selectedGroupId && refreshExpenses(selectedGroupId)}
                    disabled={!selectedGroupId || expensesLoading}
                    style={{
                      ...ghostButton,
                      cursor: !selectedGroupId || expensesLoading ? "not-allowed" : "pointer",
                      opacity: !selectedGroupId || expensesLoading ? 0.7 : 1,
                    }}
                  >
                    {expensesLoading ? "…" : "Atualizar"}
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  <div style={{ display: "grid", gap: 2 }}>
                    <div style={subtleText}>Total do mês</div>
                    <div style={{ fontWeight: 900, fontSize: 20 }}>{formatBRLFromCents(monthTotalCents)}</div>
                  </div>

                  <div style={{ display: "grid", gap: 2, textAlign: "right" }}>
                    <div style={subtleText}>Despesas no mês</div>
                    <div style={{ fontWeight: 900, fontSize: 20 }}>{monthExpenses.length}</div>
                  </div>
                </div>

                {splitMode === "SALARY" && salaryTotal <= 0 && (
                  <div style={{ ...subtleText, marginTop: 12 }}>
                    ⚠️ Para calcular “quanto cada um paga”, defina salários em <strong>Base do grupo</strong>.
                  </div>
                )}

                {splitMode === "MANUAL" && !isManualConfigValid && (
                  <div style={{ ...subtleText, marginTop: 12 }}>
                    ⚠️ Para calcular “quanto cada um paga”, ajuste o modo <strong>Manual por percentual</strong> para somar 100%.
                  </div>
                )}

                {canCalculateMonthSplit && monthTotalCents > 0 && (
                  <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                    {monthSplit.map((r) => {
                      const warn = r.salary > 0 ? r.percentOfSalary > RECOMMENDED_LIMIT_PERCENT : false;

                      return (
                        <div
                          key={r.userId}
                          style={{
                            padding: 12,
                            borderRadius: 14,
                            border: warn ? "1px solid rgba(255,140,140,0.35)" : "1px solid rgba(255,255,255,0.10)",
                            background: warn ? "rgba(255,0,0,0.05)" : "rgba(255,255,255,0.02)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 10,
                            flexWrap: "wrap",
                          }}
                        >
                          <div style={{ display: "grid", gap: 2 }}>
                            <div style={{ fontWeight: 900 }}>{r.label}</div>
                            <div style={subtleText}>
                              {splitMode === "SALARY"
                                ? `Peso: ${r.weightPercent.toFixed(0)}% • Salário: ${r.salary > 0 ? formatBRL(r.salary) : "—"}`
                                : `Percentual manual: ${r.manualPercent.toFixed(2)}% • Salário: ${r.salary > 0 ? formatBRL(r.salary) : "—"}`}
                            </div>
                          </div>

                          <div style={{ display: "grid", gap: 2, textAlign: "right" }}>
                            <div style={{ fontWeight: 900 }}>{formatBRL(r.shouldPay)}</div>
                            <div style={{ ...subtleText, opacity: 0.9 }}>
                              {r.salary > 0 ? `${r.percentOfSalary.toFixed(1)}% do salário` : "Salário não informado"}
                              {warn ? ` • ⚠️ acima de ${RECOMMENDED_LIMIT_PERCENT}%` : ""}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {canCalculateMonthSplit && monthTotalCents === 0 && <div style={{ ...subtleText, marginTop: 12 }}>Sem despesas no mês atual ainda.</div>}
              </div>

              {/* HISTÓRICO */}
              <div style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "grid", gap: 2 }}>
                    <div style={{ fontWeight: 900 }}>Histórico</div>
                    <div style={subtleText}>Últimas movimentações do grupo.</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => selectedGroupId && refreshExpenses(selectedGroupId)}
                    disabled={!selectedGroupId || expensesLoading}
                    style={{
                      ...ghostButton,
                      cursor: !selectedGroupId || expensesLoading ? "not-allowed" : "pointer",
                      opacity: !selectedGroupId || expensesLoading ? 0.7 : 1,
                    }}
                  >
                    {expensesLoading ? "…" : "Atualizar"}
                  </button>
                </div>

                {expensesLoading && <div style={{ ...subtleText, marginTop: 10 }}>Carregando…</div>}

                {expensesError && (
                  <div style={{ ...subtleText, marginTop: 10 }}>
                    <strong>Falha:</strong> {expensesError}
                  </div>
                )}

                {!expensesLoading && !expensesError && historyItems.length === 0 && <div style={{ ...subtleText, marginTop: 10 }}>Sem despesas ainda.</div>}

                {!expensesLoading && !expensesError && historyItems.length > 0 && (
                  <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
                    {historyItems.map((e) => {
                      const deleting = deleteExpenseLoadingId === e.id;

                      return (
                        <div
                          key={e.id}
                          style={{
                            padding: 12,
                            borderRadius: 14,
                            border: "1px solid rgba(255,255,255,0.10)",
                            background: "rgba(255,255,255,0.02)",
                            display: "grid",
                            gap: 6,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                            <div style={{ display: "grid", gap: 2 }}>
                              <div style={{ fontWeight: 900 }}>{e.description}</div>
                              <div style={{ ...subtleText, display: "flex", gap: 12, flexWrap: "wrap" }}>
                                <span>{new Date(e.date).toLocaleDateString("pt-BR")}</span>
                                <span>Mês: {monthKeyFromISO(e.date)}</span>
                              </div>
                            </div>

                            <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
                              <div style={{ fontWeight: 900 }}>{formatBRLFromCents(e.amountCents)}</div>

                              {/* ✅ AÇÕES: editar / excluir */}
                              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                <button
                                  type="button"
                                  onClick={() => openEditExpenseModal(e)}
                                  disabled={deleting}
                                  style={{
                                    ...ghostButton,
                                    padding: "8px 10px",
                                    cursor: deleting ? "not-allowed" : "pointer",
                                    opacity: deleting ? 0.6 : 1,
                                  }}
                                >
                                  Editar
                                </button>

                                <button
                                  type="button"
                                  onClick={() => onDeleteExpenseFromHistory(e)}
                                  disabled={deleting}
                                  style={{
                                    ...dangerButtonSmall,
                                    padding: "8px 10px",
                                    cursor: deleting ? "not-allowed" : "pointer",
                                    opacity: deleting ? 0.7 : 1,
                                  }}
                                >
                                  {deleting ? "Excluindo…" : "Excluir"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={subtleText}>{balancesLoading ? "Atualizando dados do grupo…" : ""}</div>
            </>
          )}
        </div>
      </div>

      {/* ==============================
          MODAL: Adicionar despesas
         ============================== */}
      {expensesModalOpen && selectedGroupId && (
        <div
          style={modalOverlay}
          onClick={() => {
            setExpensesModalOpen(false);
          }}
        >
          <div
            style={modalCard}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div style={modalHeader}>
              <div style={{ display: "grid", gap: 2 }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>Adicionar despesas</div>
                <div style={subtleText}>
                  Grupo: {selectedGroupName ?? ""} • Modo atual: {splitMode === "SALARY" ? "Automático por salário" : "Manual por percentual"}
                </div>
              </div>

              <button type="button" onClick={() => setExpensesModalOpen(false)} style={smallButton}>
                Fechar
              </button>
            </div>

            <div style={modalBody}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="button" onClick={() => setExpensesTab("HOUSE")} style={tabButton(expensesTab === "HOUSE")}>
                  Conta do mês
                </button>
                <button type="button" onClick={() => setExpensesTab("QUICK")} style={tabButton(expensesTab === "QUICK")}>
                  Despesa avulsa
                </button>
              </div>

              {expensesTab === "HOUSE" && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontWeight: 900 }}>Conta do mês</div>
                    <div style={subtleText}>
                      Ex: aluguel, internet, luz. (Divisão atual: {splitMode === "SALARY" ? "automática pelo salário" : "manual por percentual"}.)
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontWeight: 800, opacity: 0.95 }}>Nome</div>
                    <input value={houseName} onChange={(e) => setHouseName(e.target.value)} placeholder="Ex: Aluguel" style={inputStyle} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ fontWeight: 800, opacity: 0.95 }}>Valor</div>
                      <input
                        value={houseAmountBRL}
                        onChange={(e) => setHouseAmountBRL(e.target.value)}
                        onFocus={() => {
                          if ((houseAmountBRL ?? "").trim() === "0,00") setHouseAmountBRL("");
                        }}
                        onBlur={() => {
                          if (!(houseAmountBRL ?? "").trim()) setHouseAmountBRL("0,00");
                        }}
                        placeholder="0,00"
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ fontWeight: 800, opacity: 0.95 }}>Data</div>
                      <input type="date" value={houseDate} onChange={(e) => setHouseDate(e.target.value)} style={inputStyle} />
                    </div>
                  </div>

                  {houseError && (
                    <div style={subtleText}>
                      <strong>Falha:</strong> {houseError}
                    </div>
                  )}
                  {houseSuccess && <div style={subtleText}>✅ {houseSuccess}</div>}

                  <button
                    type="button"
                    onClick={onCreateHouseExpense}
                    disabled={houseLoading}
                    style={{
                      ...primaryButton,
                      cursor: houseLoading ? "not-allowed" : "pointer",
                      opacity: houseLoading ? 0.7 : 1,
                    }}
                  >
                    {houseLoading ? "Gerando…" : "Gerar conta do mês"}
                  </button>
                </div>
              )}

              {expensesTab === "QUICK" && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontWeight: 900 }}>Despesa avulsa</div>
                    <div style={subtleText}>
                      Ex: mercado, pizza, compras. (Divisão atual: {splitMode === "SALARY" ? "automática pelo salário" : "manual por percentual"}.)
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontWeight: 800, opacity: 0.95 }}>Descrição</div>
                    <input value={quickDesc} onChange={(e) => setQuickDesc(e.target.value)} placeholder="Ex: Mercado" style={inputStyle} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ fontWeight: 800, opacity: 0.95 }}>Valor</div>
                      <input
                        value={quickAmountBRL}
                        onChange={(e) => setQuickAmountBRL(e.target.value)}
                        onFocus={() => {
                          if ((quickAmountBRL ?? "").trim() === "0,00") setQuickAmountBRL("");
                        }}
                        onBlur={() => {
                          if (!(quickAmountBRL ?? "").trim()) setQuickAmountBRL("0,00");
                        }}
                        placeholder="0,00"
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: "grid", gap: 6 }}>
                      <div style={{ fontWeight: 800, opacity: 0.95 }}>Data</div>
                      <input type="date" value={quickDate} onChange={(e) => setQuickDate(e.target.value)} style={inputStyle} />
                    </div>
                  </div>

                  {quickError && (
                    <div style={subtleText}>
                      <strong>Falha:</strong> {quickError}
                    </div>
                  )}
                  {quickSuccess && <div style={subtleText}>✅ {quickSuccess}</div>}

                  <button
                    type="button"
                    onClick={onCreateQuickExpense}
                    disabled={quickLoading}
                    style={{
                      ...primaryButton,
                      cursor: quickLoading ? "not-allowed" : "pointer",
                      opacity: quickLoading ? 0.7 : 1,
                    }}
                  >
                    {quickLoading ? "Salvando…" : "Salvar despesa"}
                  </button>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 4 }}>
                <div style={subtleText}>Você pode fechar e continuar quando quiser.</div>

                <button type="button" onClick={() => setExpensesModalOpen(false)} style={smallButton}>
                  Concluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================
          MODAL: Editar despesa
         ============================== */}
      {editModalOpen && selectedGroupId && editingExpense && (
        <div
          style={modalOverlay}
          onClick={() => {
            closeEditExpenseModal();
          }}
        >
          <div
            style={modalCard}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div style={modalHeader}>
              <div style={{ display: "grid", gap: 2 }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>Editar despesa</div>
                <div style={subtleText}>Ajuste descrição, valor e data.</div>
              </div>

              <button type="button" onClick={() => closeEditExpenseModal()} style={smallButton}>
                Fechar
              </button>
            </div>

            <div style={modalBody}>
              {editError && (
                <div style={subtleText}>
                  <strong>Falha:</strong> {editError}
                </div>
              )}
              {editSuccess && <div style={subtleText}>✅ {editSuccess}</div>}

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontWeight: 800, opacity: 0.95 }}>Descrição</div>
                <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Ex: Mercado" style={inputStyle} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 800, opacity: 0.95 }}>Valor</div>
                  <input
                    value={editAmountBRL}
                    onChange={(e) => setEditAmountBRL(e.target.value)}
                    onFocus={() => {
                      if ((editAmountBRL ?? "").trim() === "0,00") setEditAmountBRL("");
                    }}
                    onBlur={() => {
                      if (!(editAmountBRL ?? "").trim()) setEditAmountBRL("0,00");
                    }}
                    placeholder="0,00"
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontWeight: 800, opacity: 0.95 }}>Data</div>
                  <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => closeEditExpenseModal()}
                  disabled={editLoading}
                  style={{
                    ...ghostButton,
                    cursor: editLoading ? "not-allowed" : "pointer",
                    opacity: editLoading ? 0.7 : 1,
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={onSaveEditExpense}
                  disabled={editLoading}
                  style={{
                    ...smallButton,
                    cursor: editLoading ? "not-allowed" : "pointer",
                    opacity: editLoading ? 0.7 : 1,
                  }}
                >
                  {editLoading ? "Salvando…" : "Salvar alterações"}
                </button>
              </div>

              <div style={subtleText}>Obs: manteremos “Quem pagou” igual ao original (requisito do backend).</div>
            </div>
          </div>
        </div>
      )}

      {/* ==============================
          MODAL: Base Salarial / Percentual Manual
         ============================== */}
      {salaryModalOpen && selectedGroupId && (
        <div
          style={modalOverlay}
          onClick={() => {
            setSalaryModalOpen(false);
          }}
        >
          <div
            style={modalCard}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <div style={modalHeader}>
              <div style={{ display: "grid", gap: 2 }}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>Base do grupo</div>
                <div style={subtleText}>Escolha entre divisão automática por salário ou manual por percentual.</div>
              </div>

              <button type="button" onClick={() => setSalaryModalOpen(false)} style={smallButton}>
                Fechar
              </button>
            </div>

            <div style={modalBody}>
              {salaryError && (
                <div style={subtleText}>
                  <strong>Falha:</strong> {salaryError}
                </div>
              )}
              {salarySuccess && <div style={subtleText}>✅ {salarySuccess}</div>}

              {/* ESCOLHA DO MODO */}
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 900 }}>Modo de divisão</div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => setSplitMode("SALARY")} style={tabButton(splitMode === "SALARY")}>
                    Automático por salário
                  </button>

                  <button type="button" onClick={() => setSplitMode("MANUAL")} style={tabButton(splitMode === "MANUAL")}>
                    Manual por percentual
                  </button>
                </div>

                <div style={subtleText}>
                  {splitMode === "SALARY"
                    ? "Cada pessoa informa o salário e o sistema calcula o peso automaticamente."
                    : "Você define exatamente quanto % cada pessoa paga. A soma precisa fechar 100%."}
                </div>
              </div>

              {/* BLOCO SALÁRIO */}
              {splitMode === "SALARY" && (
                <div style={{ display: "grid", gap: 10 }}>
                  {members.map((m) => {
                    const label = safeName(m.name, m.email, m.userId);
                    const current = Number(salaryByUserId[m.userId] ?? 0) || 0;

                    return (
                      <div
                        key={m.userId}
                        style={{
                          padding: 12,
                          borderRadius: 14,
                          border: "1px solid rgba(255,255,255,0.10)",
                          background: "rgba(255,255,255,0.02)",
                          display: "grid",
                          gridTemplateColumns: "1fr 220px",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <div style={{ display: "grid", gap: 2 }}>
                          <div style={{ fontWeight: 900 }}>{label}</div>
                          <div style={subtleText}>Peso na divisão é proporcional ao salário.</div>
                        </div>

                        <input
                          value={current ? String(current).replace(".", ",") : ""}
                          onChange={(e) => {
                            const raw = (e.target.value ?? "").replace(/\./g, "").replace(",", ".");
                            const num = Number(raw);
                            setSalaryByUserId((prev) => ({
                              ...prev,
                              [m.userId]: Number.isFinite(num) && num >= 0 ? num : 0,
                            }));
                          }}
                          onBlur={() => {
                            const v = Number(salaryByUserId[m.userId] ?? 0) || 0;
                            setSalaryByUserId((prev) => ({ ...prev, [m.userId]: v }));
                          }}
                          placeholder="Salário (ex: 2500,00)"
                          style={inputStyle}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* BLOCO MANUAL */}
              {splitMode === "MANUAL" && (
                <div style={{ display: "grid", gap: 10 }}>
                  {members.map((m) => {
                    const label = safeName(m.name, m.email, m.userId);
                    const currentText = manualPercentInputByUserId[m.userId] ?? "";

                    return (
                      <div
                        key={m.userId}
                        style={{
                          padding: 12,
                          borderRadius: 14,
                          border: "1px solid rgba(255,255,255,0.10)",
                          background: "rgba(255,255,255,0.02)",
                          display: "grid",
                          gridTemplateColumns: "1fr 220px",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <div style={{ display: "grid", gap: 2 }}>
                          <div style={{ fontWeight: 900 }}>{label}</div>
                          <div style={subtleText}>Exemplo: 60,00 para 60%.</div>
                        </div>

                        <input
                          value={currentText}
                          onChange={(e) => {
                            const raw = normalizePercentInputText(e.target.value); // Mantém como texto enquanto digita
                            setManualPercentInputByUserId((prev) => ({
                              ...prev,
                              [m.userId]: raw,
                            }));
                          }}
                          onBlur={() => {
                            const parsed = percentTextToNumber(manualPercentInputByUserId[m.userId] ?? "0"); // Só converte ao sair do campo
                            setManualPercentInputByUserId((prev) => ({
                              ...prev,
                              [m.userId]: percentNumberToInput(parsed),
                            }));
                          }}
                          placeholder="Percentual (ex: 50,00)"
                          style={inputStyle}
                        />
                      </div>
                    );
                  })}

                  <div
                    style={{
                      padding: 12,
                      borderRadius: 14,
                      border: Math.abs(manualPercentTotal - 100) < 0.01 ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(255,140,140,0.35)",
                      background: Math.abs(manualPercentTotal - 100) < 0.01 ? "rgba(255,255,255,0.02)" : "rgba(255,0,0,0.05)",
                    }}
                  >
                    <div style={{ fontWeight: 900 }}>Total manual: {manualPercentTotal.toFixed(2)}%</div>
                    <div style={subtleText}>{Math.abs(manualPercentTotal - 100) < 0.01 ? "Perfeito. A soma fechou em 100%." : "Ajuste os percentuais até fechar 100%."}</div>
                  </div>
                </div>
              )}

              <div style={{ ...subtleText, marginTop: 4 }}>
                Limite recomendado: <strong>{RECOMMENDED_LIMIT_PERCENT}%</strong> do salário (apenas aviso no resumo).
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => {
                      const next: Record<string, number> = {};
                      for (const m of members) next[m.userId] = 0;
                      setSalaryByUserId(next);
                      setSalarySuccess(null);
                      setSalaryError(null);
                    }}
                    style={ghostButton}
                  >
                    Zerar salários
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const defaults = buildDefaultManualPercentBase(members.map((m) => m.userId));
                      setManualPercentInputByUserId(numberMapToInputMap(defaults));
                      setSalarySuccess(null);
                      setSalaryError(null);
                    }}
                    style={ghostButton}
                  >
                    Repartir % igual
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    try {
                      setSalaryError(null);
                      setSalarySuccess(null);

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
                  style={smallButton}
                >
                  Salvar
                </button>
              </div>

              <div style={{ ...subtleText, marginTop: 2 }}>Você pode fechar e ajustar depois. O resumo do mês usa a última base salva.</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com
//
// O que foi corrigido neste Groups.tsx:
// - ✅ Corrigido o travamento do input no modo "Manual por percentual"
// - ✅ Agora o campo manual guarda TEXTO enquanto o usuário digita
// - ✅ A conversão para número acontece no cálculo e no onBlur
// - ✅ Isso permite digitar normal: 4 / 40 / 40,5 / 60,00
// - ✅ Mantido salvamento no localStorage por grupo
// - ✅ Mantidos os dois modos: Automático por salário e Manual por percentual
// - ✅ Mantido o resumo do mês usando o modo salvo