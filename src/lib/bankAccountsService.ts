import type { BankAccount } from "../types/finance";
import { apiUrl } from "./api";

const BASE = apiUrl("/api/bank-accounts");

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export async function listBankAccounts(): Promise<BankAccount[]> {
  const res = await fetch(BASE, { headers: authHeaders() });
  if (!res.ok) throw new Error("Erro ao carregar contas.");
  return res.json();
}

export async function createBankAccount(data: Omit<BankAccount, "id" | "userId" | "createdAtUtc" | "updatedAtUtc">): Promise<BankAccount> {
  const res = await fetch(BASE, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Erro ao criar conta.");
  return res.json();
}

export async function updateBankAccount(id: string, data: Partial<Omit<BankAccount, "id" | "userId" | "createdAtUtc" | "updatedAtUtc">>): Promise<BankAccount> {
  const res = await fetch(`${BASE}/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(data) });
  if (!res.ok) throw new Error("Erro ao atualizar conta.");
  return res.json();
}

export async function deleteBankAccount(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("Erro ao excluir conta.");
}

export async function transferBetweenAccounts(fromId: string, toId: string, amountCents: number): Promise<{ fromBalance: number; toBalance: number }> {
  const res = await fetch(`${BASE}/transfer`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ fromId, toId, amountCents }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Erro na transferência.");
  }
  return res.json();
}
