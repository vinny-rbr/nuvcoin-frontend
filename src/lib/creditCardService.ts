import type { CreditCard, CreateCreditCard, UpdateCreditCard, CreditCardTransaction, AddExpenseData, PayInvoiceResult } from "../types/creditCard";
import { apiUrl } from "./api";

const BASE = apiUrl("/api/credit-cards");

function getToken(): string | null {
  return (
    localStorage.getItem("conciliaai_token") ??
    localStorage.getItem("auth_token") ??
    localStorage.getItem("token")
  );
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

export async function listCreditCards(): Promise<CreditCard[]> {
  const res = await fetch(BASE, { headers: authHeaders() });
  if (!res.ok) throw new Error("Erro ao carregar cartões.");
  return res.json();
}

export async function createCreditCard(data: CreateCreditCard): Promise<CreditCard> {
  const res = await fetch(BASE, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao criar cartão.");
  return res.json();
}

export async function updateCreditCard(id: string, data: UpdateCreditCard): Promise<CreditCard> {
  const res = await fetch(`${BASE}/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao atualizar cartão.");
  return res.json();
}

export async function deleteCreditCard(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: "DELETE", headers: authHeaders() });
  if (!res.ok) throw new Error("Erro ao excluir cartão.");
}

export async function listCardTransactions(cardId: string): Promise<CreditCardTransaction[]> {
  const res = await fetch(`${BASE}/${cardId}/transactions`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Erro ao carregar lançamentos.");
  return res.json();
}

export async function addCardExpense(cardId: string, data: AddExpenseData): Promise<CreditCardTransaction> {
  const res = await fetch(`${BASE}/${cardId}/expense`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erro ao lançar gasto.");
  return res.json();
}

export async function payCardInvoice(
  cardId: string,
  fromAccountId: string,
  amountCents: number,
): Promise<PayInvoiceResult> {
  const res = await fetch(`${BASE}/${cardId}/pay`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ fromAccountId, amountCents }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Erro no pagamento.");
  }
  return res.json();
}
