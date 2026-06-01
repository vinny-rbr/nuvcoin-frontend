import type {
  GroupDto,
  GroupMembersResponse,
  GroupExpensesListResponse,
  GroupBalancesResponse,
  CreateGroupExpenseRequest,
  CreateGroupExpenseResponse,
  UpdateGroupExpenseRequest
} from "../types/groups.types";

import { apiUrl } from "../../../lib/api";
import { getAuthTokenOrThrow } from "../utils/groups.helpers";

type CreateGroupRequest = {
  name: string;
};

type AddGroupMemberRequest = {
  email?: string;
};

type UpdateGroupMemberSalariesRequest = {
  salaries: Array<{
    userId: string;
    salaryCents: number;
  }>;
};

async function readApiError(response: Response, fallback: string): Promise<string> {
  const text = await response.text();

  if (!text) return fallback;

  if (text.trim().startsWith("<!DOCTYPE") || text.includes("<html")) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(text) as { message?: unknown; error?: unknown };
    const message = parsed.message ?? parsed.error;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  } catch {
    // Mantem o texto abaixo quando nao for JSON.
  }

  return text;
}

function emptyMembers(groupId: string): GroupMembersResponse {
  return {
    groupId,
    groupName: "",
    ownerUserId: "",
    members: [],
  };
}

function emptyExpenses(groupId: string): GroupExpensesListResponse {
  return {
    groupId,
    totalCount: 0,
    items: [],
  };
}

function emptyBalances(groupId: string): GroupBalancesResponse {
  return {
    groupId,
    asOfUtcDate: new Date().toISOString(),
    consideredExpensesCount: 0,
    consideredSettlementsCount: 0,
    consideredGiftsCount: 0,
    members: [],
  };
}


// ==============================
// GET GROUPS
// ==============================

export async function fetchGroups(): Promise<GroupDto[]> {

  const token = getAuthTokenOrThrow();

  const response = await fetch(apiUrl("/api/groups"), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const message = await readApiError(response, "Nao foi possivel carregar os grupos.");
    throw new Error(`Erro ao buscar grupos: ${message}`);
  }

  return response.json();
}


// ==============================
// CREATE GROUP
// ==============================

export async function createGroup(
  payload: CreateGroupRequest
): Promise<GroupDto> {

  const token = getAuthTokenOrThrow();

  const response = await fetch(apiUrl("/api/groups"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await readApiError(response, "Nao foi possivel criar o grupo.");
    throw new Error(`Erro ao criar grupo: ${message}`);
  }

  return response.json();
}


// ==============================
// DELETE GROUP
// ==============================

export async function deleteGroup(groupId: string): Promise<void> {

  const token = getAuthTokenOrThrow();

  let response = await fetch(apiUrl(`/api/groups/${groupId}`), {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    response = await fetch(apiUrl(`/api/groups/${groupId}/archive`), {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  }

  if (!response.ok) {
    const message = await readApiError(response, "Nao foi possivel excluir o grupo.");
    throw new Error(`Erro ao excluir grupo: ${message}`);
  }
}


// ==============================
// GET MEMBERS
// ==============================

export async function fetchMembers(groupId: string): Promise<GroupMembersResponse> {

  const token = getAuthTokenOrThrow();

  const res = await fetch(apiUrl(`/api/groups/${groupId}/members`), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      return emptyMembers(groupId);
    }

    const message = await readApiError(res, "Nao foi possivel carregar os membros.");
    throw new Error(`Erro ao buscar membros: ${message}`);
  }

  return res.json();
}


// ==============================
// ADD MEMBER
// ==============================

export async function addMember(
  groupId: string,
  payload: AddGroupMemberRequest
): Promise<void> {

  const token = getAuthTokenOrThrow();

  const response = await fetch(apiUrl(`/api/groups/${groupId}/members`), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await readApiError(response, "Adicionar membros ainda nao esta disponivel nesta API.");
    throw new Error(`Erro ao adicionar membro: ${message}`);
  }
}

// ==============================
// UPDATE MEMBER SALARIES
// ==============================

export async function updateGroupMemberSalaries(
  groupId: string,
  payload: UpdateGroupMemberSalariesRequest
): Promise<void> {

  const token = getAuthTokenOrThrow();

  const response = await fetch(apiUrl(`/api/groups/${groupId}/members/salaries`), {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await readApiError(response, "Nao foi possivel salvar os salarios do grupo.");
    throw new Error(`Erro ao salvar salarios: ${message}`);
  }
}

// ==============================
// ACCEPT GROUP INVITE
// ==============================

export async function acceptGroupInvite(code: string): Promise<void> {

  const token = getAuthTokenOrThrow();

  const response = await fetch(apiUrl("/api/groups/invites/accept"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const message = await readApiError(response, "Nao foi possivel aceitar o convite.");
    throw new Error(`Erro ao aceitar convite: ${message}`);
  }
}


// ==============================
// REMOVE MEMBER
// ==============================

export async function removeMember(
  groupId: string,
  memberId: string
): Promise<void> {

  const token = getAuthTokenOrThrow();

  const response = await fetch(apiUrl(`/api/groups/${groupId}/members/${memberId}`), {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const message = await readApiError(response, "Remover membros ainda nao esta disponivel nesta API.");
    throw new Error(`Erro ao remover membro: ${message}`);
  }
}


// ==============================
// GET EXPENSES
// ==============================

export async function fetchExpenses(groupId: string): Promise<GroupExpensesListResponse> {

  const token = getAuthTokenOrThrow();

  const res = await fetch(apiUrl(`/api/GroupExpenses/group/${groupId}`), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      return emptyExpenses(groupId);
    }

    const message = await readApiError(res, "Nao foi possivel carregar as despesas do grupo.");
    throw new Error(`Erro ao buscar despesas: ${message}`);
  }

  return res.json();
}


// ==============================
// GET BALANCES
// ==============================

export async function fetchBalances(groupId: string): Promise<GroupBalancesResponse> {

  const token = getAuthTokenOrThrow();

  const res = await fetch(apiUrl(`/api/GroupExpenses/group/${groupId}/balances`), {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      return emptyBalances(groupId);
    }

    const message = await readApiError(res, "Nao foi possivel carregar os dados do grupo.");
    throw new Error(`Erro ao buscar dados do grupo: ${message}`);
  }

  return res.json();
}


// ==============================
// CREATE EXPENSE
// ==============================

export async function createExpense(
  payload: CreateGroupExpenseRequest
): Promise<CreateGroupExpenseResponse> {

  const token = getAuthTokenOrThrow();

  const res = await fetch(apiUrl(`/api/GroupExpenses`), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await readApiError(res, "Lancamento de despesas de grupo ainda nao esta disponivel nesta API.");
    throw new Error(`Erro ao criar despesa: ${message}`);
  }

  return res.json();
}


// ==============================
// UPDATE EXPENSE
// ==============================

export async function updateExpense(
  expenseId: string,
  payload: UpdateGroupExpenseRequest
): Promise<void> {

  const token = getAuthTokenOrThrow();

  const res = await fetch(apiUrl(`/api/GroupExpenses/${expenseId}`), {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await readApiError(res, "Edicao de despesas de grupo ainda nao esta disponivel nesta API.");
    throw new Error(`Erro ao editar despesa: ${message}`);
  }
}


// ==============================
// DELETE EXPENSE
// ==============================

export async function deleteExpense(expenseId: string): Promise<void> {

  const token = getAuthTokenOrThrow();

  const res = await fetch(apiUrl(`/api/GroupExpenses/${expenseId}`), {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const message = await readApiError(res, "Exclusao de despesas de grupo ainda nao esta disponivel nesta API.");
    throw new Error(`Erro ao excluir despesa: ${message}`);
  }
}



// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com
//
// Este arquivo centraliza todas as chamadas de API
// do mÃ³dulo Groups do CONCILIAAÍ.
//
// Novas funÃ§Ãµes adicionadas nesta etapa:
// - createGroup
// - deleteGroup
// - addMember
// - removeMember
//
// ObservaÃ§Ã£o importante:
// - Mantive os payloads de grupo/membro de forma segura e simples.
// - Para addMember, o frontend envia apenas o e-mail.




