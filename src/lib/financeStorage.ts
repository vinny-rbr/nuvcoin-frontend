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
   EVENTO INTERNO PARA ATUALIZAÇÃƒO EM TEMPO REAL
   ===================================================== */

export function notifyFinanceUpdated(): void {
  // Dispara evento interno na mesma aba
  window.dispatchEvent(new Event("conciliaai_finance_updated")); // Evento que o Dashboard escuta
}

/* =====================================================
   NORMALIZAÇÃƒO (garante compatibilidade)
   ===================================================== */

function normalizeItem(raw: any): FinanceItem {
  // Garante ID (se vier faltando)
  const id: string = raw?.id ?? makeId(); // ID seguro

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

  const recurringGroupId: string | undefined = raw?.recurringGroupId ?? undefined;
  const recurringKind: "fixo" | "parcelado" | undefined = raw?.recurringKind ?? undefined;
  const recurringTotal: number | undefined = raw?.recurringTotal !== undefined ? Number(raw.recurringTotal) : undefined;

  return {
    id, type, title, category, amountCents, dateISO, createdAtISO, paymentType, status,
    ...(recurringGroupId ? { recurringGroupId, recurringKind, recurringTotal } : {}),
  } as FinanceItem;
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
    const raw = localStorage.getItem(getFinanceStorageKey()); // Lê do localStorage do usuario atual
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
  let receitas = 0;
  let despesasPagas = 0;
  let despesasPendentes = 0;
  let credito = 0;

  for (const item of items) {
    if (item.type === "RECEITA" && item.status === "paid") {
      receitas += item.amountCents;
    }

    if (item.type === "DESPESA") {
      if (item.status === "paid") {
        despesasPagas += item.amountCents;
        if (item.paymentType === "credit") credito += item.amountCents;
      } else {
        despesasPendentes += item.amountCents;
      }
    }
  }

  return {
    totalReceitasCents: receitas,
    totalDespesasCents: despesasPagas,
    totalPendingDespesasCents: despesasPendentes,
    totalCreditoCents: credito,
    saldoCents: receitas - despesasPagas,
  };
}

/* =====================================================
   UTILITÃRIOS
   ===================================================== */

export function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function"
      ? Array.from(crypto.getRandomValues(new Uint32Array(2)))
          .map((value) => value.toString(36))
          .join("")
      : Math.random().toString(36).slice(2);

  return `local-${Date.now().toString(36)}-${randomPart}`;
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

âœ” Armazena itens financeiros no localStorage
âœ” Atualiza automaticamente Dashboard/Receitas/Despesas
âœ” Dispara evento interno para atualização em tempo real
âœ” Calcula resumo financeiro (inclui crédito)
âœ” Gera ID seguro
âœ” Retorna data ISO padrão
âœ” Normaliza dados antigos (date -> dateISO / createdAtUtc -> createdAtISO)

Crédito:
- totalCreditoCents = soma de DESPESA onde paymentType = "credit"
*/
