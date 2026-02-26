import type { FinanceItem, FinanceSummary } from "../types/finance"; // Tipos do app

const STORAGE_KEY = "nuvcoin_finance_items_v1"; // Chave do localStorage

/* =====================================================
   EVENTO INTERNO PARA ATUALIZAÇÃO EM TEMPO REAL
   ===================================================== */

export function notifyFinanceUpdated(): void {
  // Dispara evento interno na mesma aba
  window.dispatchEvent(new Event("nuvcoin_finance_updated")); // Evento que o Dashboard escuta
}

/* =====================================================
   NORMALIZAÇÃO (garante compatibilidade)
   ===================================================== */

function normalizeItem(raw: any): FinanceItem {
  // Garante ID (se vier faltando)
  const id: string = raw?.id ?? crypto.randomUUID(); // ID seguro

  // Garante type/título básicos
  const type = raw?.type ?? "DESPESA"; // Default seguro
  const title = raw?.title ?? ""; // Default

  // Garante categoria
  const category = raw?.category ?? "Outros"; // Default

  // Garante amount em número
  const amountCents = Number(raw?.amountCents ?? 0); // Default 0

  // Garante datas no padrão do FRONT (dateISO / createdAtISO)
  const dateISO: string =
    raw?.dateISO ??
    raw?.date ?? // caso alguém salve "date"
    todayISO(); // fallback

  const createdAtISO: string =
    raw?.createdAtISO ??
    raw?.createdAtUtc ?? // caso venha do backend
    raw?.createdAt ?? // variações
    new Date().toISOString(); // fallback

  // Garante paymentType/status
  const paymentType = raw?.paymentType ?? "pix"; // Default pix
  const status = raw?.status ?? "paid"; // Default paid

  return {
    id, // id normalizado
    type, // type normalizado
    title, // título normalizado
    category, // categoria normalizada
    amountCents, // valor normalizado
    dateISO, // data principal normalizada
    createdAtISO, // data criação normalizada
    paymentType, // forma pagamento normalizada
    status, // status normalizado
  } as FinanceItem; // Força o tipo final
}

function normalizeList(parsed: any): FinanceItem[] {
  // Se não for array, volta vazio
  if (!Array.isArray(parsed)) return []; // Proteção

  // Normaliza item a item (evita quebrar a UI por dados antigos)
  return parsed.map((x) => normalizeItem(x)); // Normaliza
}

/* =====================================================
   LOAD
   ===================================================== */

export function loadFinanceItems(): FinanceItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY); // Lê do localStorage
    if (!raw) return []; // Se não tiver nada, retorna vazio

    const parsed = JSON.parse(raw); // Converte JSON -> qualquer coisa

    const normalized = normalizeList(parsed); // Normaliza para o formato atual

    return normalized; // Retorna itens normalizados
  } catch {
    return []; // Se der erro, retorna vazio
  }
}

/* =====================================================
   SAVE
   ===================================================== */

export function saveFinanceItems(items: FinanceItem[]): void {
  // Normaliza antes de salvar (evita salvar lixo/forma antiga)
  const normalized = items.map((x) => normalizeItem(x)); // Normaliza lista

  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)); // Salva JSON

  // 🔥 Notifica todas as telas da mesma aba
  notifyFinanceUpdated(); // Dispara evento interno
}

/* =====================================================
   ADD
   ===================================================== */

export function addFinanceItem(newItem: FinanceItem): FinanceItem[] {
  const items = loadFinanceItems(); // Carrega itens atuais

  const normalizedNew = normalizeItem(newItem); // Normaliza o novo item (garante dateISO/createdAtISO)

  const updated = [normalizedNew, ...items]; // Coloca o novo no topo

  saveFinanceItems(updated); // Salva e notifica

  return updated; // Retorna atualizado
}

/* =====================================================
   DELETE
   ===================================================== */

export function deleteFinanceItem(id: string): FinanceItem[] {
  const items = loadFinanceItems(); // Carrega itens atuais

  const updated = items.filter((x) => x.id !== id); // Remove pelo id

  saveFinanceItems(updated); // Salva e notifica

  return updated; // Retorna atualizado
}

/* =====================================================
   SUMMARY
   ===================================================== */

export function calcFinanceSummary(items: FinanceItem[]): FinanceSummary {
  let receitas = 0; // Acumulador receitas
  let despesas = 0; // Acumulador despesas
  let credito = 0; // Acumulador crédito (DESPESA + paymentType=credit)

  for (const item of items) {
    // Soma receitas
    if (item.type === "RECEITA") {
      receitas += item.amountCents; // Soma em centavos
    }

    // Soma despesas e crédito
    if (item.type === "DESPESA") {
      despesas += item.amountCents; // Soma despesas

      // Crédito = DESPESA com paymentType = credit
      if (item.paymentType === "credit") {
        credito += item.amountCents; // Soma crédito
      }
    }
  }

  return {
    totalReceitasCents: receitas, // Total receitas
    totalDespesasCents: despesas, // Total despesas
    totalCreditoCents: credito, // Total crédito
    saldoCents: receitas - despesas, // Saldo
  };
}

/* =====================================================
   UTILITÁRIOS
   ===================================================== */

export function makeId(): string {
  return crypto.randomUUID(); // ID seguro
}

export function todayISO(): string {
  const d = new Date(); // Data atual
  const yyyy = d.getFullYear(); // Ano
  const mm = String(d.getMonth() + 1).padStart(2, "0"); // Mês
  const dd = String(d.getDate()).padStart(2, "0"); // Dia

  return `${yyyy}-${mm}-${dd}`; // "YYYY-MM-DD"
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
✔ Calcula resumo financeiro (inclui crédito)
✔ Gera ID seguro
✔ Retorna data ISO padrão
✔ Normaliza dados antigos (date -> dateISO / createdAtUtc -> createdAtISO)

Crédito:
- totalCreditoCents = soma de DESPESA onde paymentType = "credit"
*/