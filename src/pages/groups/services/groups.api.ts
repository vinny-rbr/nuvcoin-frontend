import type {
  GroupDto,
  GroupMembersResponse,
  GroupExpensesListResponse,
  GroupBalancesResponse,
  CreateGroupExpenseRequest,
  CreateGroupExpenseResponse,
  UpdateGroupExpenseRequest
} from "../types/groups.types";

import { getAuthTokenOrThrow } from "../utils/groups.helpers";


// ==============================
// GET GROUPS
// ==============================

export async function fetchGroups(): Promise<GroupDto[]> {

  const token = getAuthTokenOrThrow();

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

  return response.json();
}


// ==============================
// GET MEMBERS
// ==============================

export async function fetchMembers(groupId: string): Promise<GroupMembersResponse> {

  const token = getAuthTokenOrThrow();

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

  return res.json();
}


// ==============================
// GET EXPENSES
// ==============================

export async function fetchExpenses(groupId: string): Promise<GroupExpensesListResponse> {

  const token = getAuthTokenOrThrow();

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

  return res.json();
}


// ==============================
// GET BALANCES
// ==============================

export async function fetchBalances(groupId: string): Promise<GroupBalancesResponse> {

  const token = getAuthTokenOrThrow();

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

  return res.json();
}


// ==============================
// CREATE EXPENSE
// ==============================

export async function createExpense(
  payload: CreateGroupExpenseRequest
): Promise<CreateGroupExpenseResponse> {

  const token = getAuthTokenOrThrow();

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
// DELETE EXPENSE
// ==============================

export async function deleteExpense(expenseId: string): Promise<void> {

  const token = getAuthTokenOrThrow();

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



// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com
//
// Este arquivo centraliza todas as chamadas de API
// do módulo Groups do NUVCOIN.
