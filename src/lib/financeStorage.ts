import type { FinanceItem, FinanceSummary } from "../types/finance"; // Tipos do app

const STORAGE_KEY_PREFIX = "conciliaai_finance_items_v1"; // Prefixo do localStorage

function getCurrentFinanceOwnerKey(): string {
  if (typeof window === "undefined") return "anonymous";

  const userId = window.localStorage.getItem("conciliaai_userId");
  if (userId?.trim()) return userId.trim();

  const email = window.localStorage.getItem("conciliaai_email");
  if (email?.trim()) return email.trim().toLowerCase();

  return "anonymous";
}

export function getFinanceStorageKey(): string {
  return `${STORAGE_KEY_PREFIX}:${getCurrentFinanceOwnerKey()}`;
}

export function isFinanceStorageKey(key: string | null): boolean {
  return Boolean(key && key.startsWith(`${STORAGE_KEY_PREFIX}:`));
}

/* =====================================================
   EVENTO INTERNO PARA ATUALIZAÃ‡ÃƒO EM TEMPO REAL
   ===================================================== */

export function notifyFinanceUpdated(): void {
  // Dispara evento interno na mesma aba
  window.dispatchEvent(new Event("conciliaai_finance_updated")); // Evento que o Dashboard escuta
}

/* =====================================================
   NORMALIZAÃ‡ÃƒO (garante compatibilidade)
   ===================================================== */

function normalizeItem(raw: any): FinanceItem {
  // Garante ID (se vier faltando)
  const id: string = raw?.id ?? crypto.randomUUID(); // ID seguro

  // Garante type/tÃ­tulo bÃ¡sicos
  const type = raw?.type ?? "DESPESA"; // Default seguro
  const title = raw?.title ?? ""; // Default

  // Garante categoria
  const category = raw?.category ?? "Outros"; // Default

  // Garante amount em nÃºmero
  const amountCents = Number(raw?.amountCents ?? 0); // Default 0

  // Garante datas no padrÃ£o do FRONT (dateISO / createdAtISO)
  const dateISO: string =
    raw?.dateISO ??
    raw?.date ?? // caso alguÃ©m salve "date"
    todayISO(); // fallback

  const createdAtISO: string =
    raw?.createdAtISO ??
    raw?.createdAtUtc ?? // caso venha do backend
    raw?.createdAt ?? // variaÃ§Ãµes
    new Date().toISOString(); // fallback

  // Garante paymentType/status
  const paymentType = raw?.paymentType ?? "pix"; // Default pix
  const status = raw?.status ?? "paid"; // Default paid

  return {
    id, // id normalizado
    type, // type normalizado
    title, // tÃ­tulo normalizado
    category, // categoria normalizada
    amountCents, // valor normalizado
    dateISO, // data principal normalizada
    createdAtISO, // data criaÃ§Ã£o normalizada
    paymentType, // forma pagamento normalizada
    status, // status normalizado
  } as FinanceItem; // ForÃ§a o tipo final
}

function normalizeList(parsed: any): FinanceItem[] {
  // Se nÃ£o for array, volta vazio
  if (!Array.isArray(parsed)) return []; // ProteÃ§Ã£o

  // Normaliza item a item (evita quebrar a UI por dados antigos)
  return parsed.map((x) => normalizeItem(x)); // Normaliza
}

/* =====================================================
   LOAD
   ===================================================== */

export function loadFinanceItems(): FinanceItem[] {
  try {
    const raw = localStorage.getItem(getFinanceStorageKey()); // LÃª do localStorage do usuario atual
    if (!raw) return []; // Se nÃ£o tiver nada, retorna vazio

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

  localStorage.setItem(getFinanceStorageKey(), JSON.stringify(normalized)); // Salva JSON por usuario

  // ðŸ”¥ Notifica todas as telas da mesma aba
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
  let credito = 0; // Acumulador crÃ©dito (DESPESA + paymentType=credit)

  for (const item of items) {
    // Soma receitas
    if (item.type === "RECEITA") {
      receitas += item.amountCents; // Soma em centavos
    }

    // Soma despesas e crÃ©dito
    if (item.type === "DESPESA") {
      despesas += item.amountCents; // Soma despesas

      // CrÃ©dito = DESPESA com paymentType = credit
      if (item.paymentType === "credit") {
        credito += item.amountCents; // Soma crÃ©dito
      }
    }
  }

  return {
    totalReceitasCents: receitas, // Total receitas
    totalDespesasCents: despesas, // Total despesas
    totalCreditoCents: credito, // Total crÃ©dito
    saldoCents: receitas - despesas, // Saldo
  };
}

/* =====================================================
   UTILITÃRIOS
   ===================================================== */

export function makeId(): string {
  return crypto.randomUUID(); // ID seguro
}

export function todayISO(): string {
  const d = new Date(); // Data atual
  const yyyy = d.getFullYear(); // Ano
  const mm = String(d.getMonth() + 1).padStart(2, "0"); // MÃªs
  const dd = String(d.getDate()).padStart(2, "0"); // Dia

  return `${yyyy}-${mm}-${dd}`; // "YYYY-MM-DD"
}

/*
=====================================================
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com
=====================================================

O que este arquivo faz agora:

âœ” Armazena itens financeiros no localStorage
âœ” Atualiza automaticamente Dashboard/Receitas/Despesas
âœ” Dispara evento interno para atualizaÃ§Ã£o em tempo real
âœ” Calcula resumo financeiro (inclui crÃ©dito)
âœ” Gera ID seguro
âœ” Retorna data ISO padrÃ£o
âœ” Normaliza dados antigos (date -> dateISO / createdAtUtc -> createdAtISO)

CrÃ©dito:
- totalCreditoCents = soma de DESPESA onde paymentType = "credit"
*/
