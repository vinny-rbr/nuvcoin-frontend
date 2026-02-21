import type { FinanceItem, FinanceSummary } from "../types/finance";

const STORAGE_KEY = "nuvcoin_finance_items_v1";

/* =====================================================
   EVENTO INTERNO PARA ATUALIZAÇÃO EM TEMPO REAL
   ===================================================== */

export function notifyFinanceUpdated(): void {
  // Dispara evento interno na mesma aba
  window.dispatchEvent(new Event("nuvcoin_finance_updated"));
}

/* =====================================================
   LOAD
   ===================================================== */

export function loadFinanceItems(): FinanceItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as FinanceItem[];

    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch {
    return [];
  }
}

/* =====================================================
   SAVE
   ===================================================== */

export function saveFinanceItems(items: FinanceItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

  // 🔥 Notifica todas as telas da mesma aba
  notifyFinanceUpdated();
}

/* =====================================================
   ADD
   ===================================================== */

export function addFinanceItem(newItem: FinanceItem): FinanceItem[] {
  const items = loadFinanceItems();

  const updated = [newItem, ...items];

  saveFinanceItems(updated);

  return updated;
}

/* =====================================================
   DELETE
   ===================================================== */

export function deleteFinanceItem(id: string): FinanceItem[] {
  const items = loadFinanceItems();

  const updated = items.filter((x) => x.id !== id);

  saveFinanceItems(updated);

  return updated;
}

/* =====================================================
   SUMMARY
   ===================================================== */

export function calcFinanceSummary(items: FinanceItem[]): FinanceSummary {
  let receitas = 0;
  let despesas = 0;

  for (const item of items) {
    if (item.type === "RECEITA") receitas += item.amountCents;
    if (item.type === "DESPESA") despesas += item.amountCents;
  }

  return {
    totalReceitasCents: receitas,
    totalDespesasCents: despesas,
    saldoCents: receitas - despesas,
  };
}

/* =====================================================
   UTILITÁRIOS
   ===================================================== */

export function makeId(): string {
  return crypto.randomUUID();
}

export function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

/*
=====================================================
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com
=====================================================

O que este arquivo faz agora:

✔ Armazena itens financeiros no localStorage
✔ Atualiza automaticamente Dashboard/Receitas/Despesas
✔ Dispara evento interno para atualização em tempo real
✔ Calcula resumo financeiro
✔ Gera ID seguro
✔ Retorna data ISO padrão

Pronto para MVP SaaS.
*/