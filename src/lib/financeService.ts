import type { FinanceItem } from "../types/finance"; // Tipos do app
import { apiUrl } from "./api";
import { persistSubscriptionState } from "./auth";

export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

import {
  loadFinanceItems, // Lê itens do localStorage
  getFinanceStorageKey,
  isFinanceStorageKey,
  saveFinanceItems as saveItemsStorage, // Salva lista no localStorage (✅ já dispara evento interno)
  todayISO, // Data ISO padrão
  makeId, // ID seguro
} from "./financeStorage"; // Implementação atual (localStorage)

// =============================
// CONFIG
// =============================

const USE_API = true; // ✅ Agora vamos usar a API real
const API_BASE_URL = apiUrl("/api/finance"); // Base da API

// ✅ Freio anti-loop (evita fetch infinito)
const SYNC_MIN_INTERVAL_MS = 3000; // 3s entre syncs automáticos

let syncInFlight = false; // ✅ trava quando já tem sync rolando
let lastSyncAt = 0; // ✅ último sync (timestamp)

// ✅ Controle pra evitar "sync em cascata" causado por evento/storage
let hasHydratedFromApiThisSession = false; // ✅ já sincronizou 1x com a API nesta sessão
let lastWriteFromApiAt = 0; // ✅ quando gravamos no storage vindo da API (para ignorar evento logo depois)

// =============================
// AUTH HELPERS
// =============================

// Lê o token do localStorage
function getAuthToken(): string | null {
  const t1 = localStorage.getItem("conciliaai_token"); // Padrão 1
  if (t1) return t1; // Retorna se existir

  const t2 = localStorage.getItem("token"); // Padrão 2 (o seu JWT está aqui)
  if (t2) return t2; // Retorna se existir

  const t3 = localStorage.getItem("auth_token"); // Padrão 3
  if (t3) return t3; // Retorna se existir

  return null; // Sem token
}

// Monta headers padrão com Authorization: Bearer
function makeHeaders(): HeadersInit {
  const token = getAuthToken(); // Lê token

  if (!token) {
    return { "Content-Type": "application/json" }; // Sem Authorization
  }

  return {
    "Content-Type": "application/json", // JSON
    Authorization: `Bearer ${token}`, // Bearer JWT
  };
}

// =============================
// NORMALIZAÇÃƒO (API -> Front)
// =============================

function normalizeApiItem(raw: any): FinanceItem {
  const rawDate =
    raw?.dateISO ?? // Ja veio pronto
    raw?.date ?? // Backend pode mandar "date"
    raw?.dateUtc ?? // Outras variacoes
    raw?.dateTime; // Outras variacoes

  const dateISO: string =
    typeof rawDate === "string" && rawDate.length >= 10
      ? rawDate.slice(0, 10)
      : todayISO();

  const createdAtISO: string =
    raw?.createdAtISO ?? // Já veio pronto
    raw?.createdAtUtc ?? // Backend pode mandar createdAtUtc
    raw?.createdAt ?? // Outras variações
    new Date().toISOString(); // Fallback

  return {
    id: raw?.id ?? makeId(),
    type: raw?.type,
    title: raw?.title ?? "",
    category: raw?.category ?? "Outros",
    amountCents: Number(raw?.amountCents ?? 0),
    dateISO: dateISO,
    createdAtISO: createdAtISO,
    paymentType: raw?.paymentType ?? "pix",
    status: raw?.status ?? "paid",
    ...(raw?.accountId ? { accountId: raw.accountId } : {}),
    ...(raw?.recurringGroupId ? {
      recurringGroupId: raw.recurringGroupId,
      recurringKind: raw.recurringKind ?? undefined,
      recurringTotal: raw.recurringTotal ? Number(raw.recurringTotal) : undefined,
    } : {}),
    ...(raw?.note != null ? { note: raw.note } : {}),
    ...(raw?.tags != null ? { tags: raw.tags } : {}),
    ...(raw?.ignoreInReports != null ? { ignoreInReports: Boolean(raw.ignoreInReports) } : {}),
  } as FinanceItem;
}

function normalizeApiList(rawList: any): FinanceItem[] {
  if (!Array.isArray(rawList)) return []; // Se não for array, vazio
  return rawList.map((x) => normalizeApiItem(x)); // Normaliza cada item
}

// =============================
// PROVIDER (fonte de dados)
// =============================

type FinanceProvider = {
  list: () => Promise<FinanceItem[]>; // Lista
  add: (item: FinanceItem) => Promise<FinanceItem>; // Add (retorna item criado)
  update: (id: string, patch: Partial<FinanceItem>) => Promise<FinanceItem>; // Atualiza
  remove: (id: string) => Promise<void>; // Remove
  saveAll: (items: FinanceItem[]) => Promise<void>; // Bulk (ainda local)
};

// Provider: localStorage
const localStorageProvider: FinanceProvider = {
  list: async () => loadFinanceItems(), // Lista do storage

  add: async (item) => {
    saveItemsStorage([item, ...loadFinanceItems()]); // Salva no local
    return item; // Retorna item
  },

  update: async (id, patch) => {
    const updated = loadFinanceItems().map((item) => (item.id === id ? { ...item, ...patch } : item));
    saveItemsStorage(updated);
    return updated.find((item) => item.id === id) as FinanceItem;
  },

  remove: async (id) => {
    saveItemsStorage(loadFinanceItems().filter((item) => item.id !== id)); // Remove do storage
  },

  saveAll: async (items) => saveItemsStorage(items), // Salva lista (dispara evento interno)
};

// Provider: API real
const apiProvider: FinanceProvider = {
  list: async () => {
    const res = await fetch(`${API_BASE_URL}`, {
      method: "GET", // GET
      headers: makeHeaders(), // Headers com Bearer
    });

    if (res.status === 403) {
      persistSubscriptionState(false); // Marca conta como inativa
      throw new Error("Finance access forbidden: 403");
    }

    if (!res.ok) throw new Error(`API list failed: ${res.status}`); // Erro

    const raw = await res.json(); // JSON
    return normalizeApiList(raw); // Normaliza
  },

  add: async (item) => {
    financeDebugLog("API POST /finance inicio", {
      type: item.type,
      title: item.title,
      amountCents: item.amountCents,
      dateISO: item.dateISO,
    });

    const payload = {
      type: item.type,
      title: item.title,
      category: item.category ?? "Outros",
      amountCents: item.amountCents,
      date: item.dateISO,
      paymentType: item.paymentType ?? "pix",
      status: item.status ?? "paid",
      recurringGroupId: item.recurringGroupId ?? null,
      recurringKind: item.recurringKind ?? null,
      recurringTotal: item.recurringTotal ?? null,
    };

    const res = await fetch(`${API_BASE_URL}`, {
      method: "POST", // POST
      headers: makeHeaders(), // Headers
      body: JSON.stringify(payload), // Body
    });

    if (res.status === 403) {
      financeDebugLog("API POST /finance 403");
      const body = await res.json().catch(() => ({})) as { code?: string; message?: string };
      if (body.code === "PLAN_TRANSACTION_LIMIT_REACHED") {
        throw new PlanLimitError(body.message ?? "Limite de lancamentos do plano atingido.");
      }
      persistSubscriptionState(false); // Marca conta como inativa
      throw new Error("Finance access forbidden: 403");
    }

    if (!res.ok) {
      financeDebugLog("API POST /finance erro", { status: res.status });
      throw new Error(`API add failed: ${res.status}`);
    }

    const rawCreated = await res.json(); // Retorno do backend
    const created = normalizeApiItem(rawCreated); // Normaliza item criado
    financeDebugLog("API POST /finance sucesso", created);

    return created; // ✅ Sem GET depois
  },

  update: async (id, patch) => {
    const payload: Record<string, unknown> = {};

    if (patch.type) payload.type = patch.type;
    if (patch.title !== undefined) payload.title = patch.title;
    if (patch.category !== undefined) payload.category = patch.category;
    if (patch.amountCents !== undefined) payload.amountCents = patch.amountCents;
    if (patch.dateISO !== undefined) payload.date = patch.dateISO;
    if (patch.paymentType !== undefined) payload.paymentType = patch.paymentType;
    if (patch.status !== undefined) payload.status = patch.status;
    if (patch.note !== undefined) payload.note = patch.note ?? null;
    if (patch.tags !== undefined) payload.tags = patch.tags ?? null;
    if (patch.ignoreInReports !== undefined) payload.ignoreInReports = patch.ignoreInReports;

    const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: makeHeaders(),
      body: JSON.stringify(payload),
    });

    if (res.status === 403) {
      persistSubscriptionState(false);
      throw new Error("Finance access forbidden: 403");
    }

    if (!res.ok) throw new Error(`API update failed: ${res.status}`);

    return normalizeApiItem(await res.json());
  },

  remove: async (id) => {
    const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(id)}`, {
      method: "DELETE", // DELETE
      headers: makeHeaders(), // Headers
    });

    if (res.status === 403) {
      persistSubscriptionState(false); // Marca conta como inativa
      throw new Error("Finance access forbidden: 403");
    }

    if (!res.ok) throw new Error(`API remove failed: ${res.status}`); // Erro

    return; // 204 NoContent
  },

  saveAll: async (items) => {
    // ✅ Ainda não existe bulk no backend.
    // Por enquanto só salva local.
    saveItemsStorage(items); // Salva local e dispara evento interno
  },
};

// Provider ativo
const activeProvider: FinanceProvider = USE_API ? apiProvider : localStorageProvider;
const pendingLocalItemIds = new Set<string>();
// IDs que devem ficar pinados no topo até o usuário confirmar (ex: após lançar por foto/OFX)
const recentlyAddedIds = new Set<string>();

export function financeFlushRecent(): void {
  recentlyAddedIds.clear();
}

export function financeDebugLog(message: string, data?: unknown): void {
  if (typeof window === "undefined") return;

  const userId = window.localStorage.getItem("conciliaai_userId") ?? window.localStorage.getItem("userId");
  const email = window.localStorage.getItem("conciliaai_email") ?? window.localStorage.getItem("email");
  const name = window.localStorage.getItem("conciliaai_name") ?? window.localStorage.getItem("name");
  const hasToken = Boolean(getAuthToken());

  const payload = {
    at: new Date().toISOString(),
    message,
    data,
    url: window.location.href,
    userAgent: window.navigator.userAgent,
    user: {
      id: userId || null,
      email: email || null,
      name: name || null,
      hasToken,
    },
  };

  console.log("[finance-debug]", message, data ?? "");

  void fetch(apiUrl("/api/client-logs"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);
}

// =============================
// HELPERS INTERNOS (fallback)
// =============================

async function safe<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await fn(); // Tenta
  } catch (error) {
    if (error instanceof PlanLimitError) throw error; // Limite de plano: não faz fallback
    return await fallback(); // Fallback
  }
}

// =============================
// CACHE EM MEMÓRIA
// =============================

let inMemoryCache: FinanceItem[] | null = null; // Cache em memória
let activeCacheStorageKey = getFinanceStorageKey();
// =============================
// PERSISTENT ACCOUNT-ID MAP
// Maps financeItem.id -> bankAccount.id, survives API refreshes and sessions
// =============================

function getAcctMapKey(): string {
  return `conciliaai_acct_ids_v1:${getFinanceStorageKey()}`;
}

function loadAcctMap(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(getAcctMapKey()) ?? "{}") as Record<string, string>; }
  catch { return {}; }
}

function saveAcctMap(map: Record<string, string>): void {
  localStorage.setItem(getAcctMapKey(), JSON.stringify(map));
}

function acctMapSet(itemId: string, accountId: string): void {
  const m = loadAcctMap(); m[itemId] = accountId; saveAcctMap(m);
}

function acctMapReplace(oldId: string, newId: string): void {
  const m = loadAcctMap();
  if (m[oldId]) { m[newId] = m[oldId]; delete m[oldId]; saveAcctMap(m); }
}

function acctMapRemove(itemId: string): void {
  const m = loadAcctMap(); delete m[itemId]; saveAcctMap(m);
}

// Remove all mappings pointing to a given bankAccountId and strips accountId from those finance items
export function loadAcctMapPublic(): Record<string, string> {
  return loadAcctMap();
}

export function acctMapClearByAccountId(bankAccountId: string): void {
  const m = loadAcctMap();
  const idsToRemove = Object.keys(m).filter(k => m[k] === bankAccountId);
  if (idsToRemove.length === 0) return;
  for (const id of idsToRemove) delete m[id];
  saveAcctMap(m);
  // Also strip accountId from cached finance items
  const updated = getCache().map(i => i.accountId === bankAccountId ? { ...i, accountId: undefined } : i);
  setCache(updated);
  saveItemsStorage(updated);
}

function ensureUserScopedCache(): void {
  const currentStorageKey = getFinanceStorageKey();

  if (currentStorageKey === activeCacheStorageKey) return;

  activeCacheStorageKey = currentStorageKey;
  inMemoryCache = null;
  hasHydratedFromApiThisSession = false;
  syncInFlight = false;
  lastSyncAt = 0;
  lastWriteFromApiAt = 0;
}

function setCache(items: FinanceItem[]): void {
  ensureUserScopedCache();
  inMemoryCache = items; // Atualiza cache
}

function getCache(): FinanceItem[] {
  ensureUserScopedCache();
  if (inMemoryCache) return inMemoryCache; // Se existe, usa
  const local = loadFinanceItems(); // Senão, lê local
  inMemoryCache = local; // Guarda no cache
  return local; // Retorna
}

// Garante item no cache sem duplicar por id
function upsertById(list: FinanceItem[], item: FinanceItem): FinanceItem[] {
  const idx = list.findIndex((x) => x.id === item.id); // Procura id
  if (idx === -1) return [...list, item]; // Se não existe, adiciona
  const copy = [...list]; // Copia
  copy[idx] = item; // Substitui
  return copy; // Retorna
}

// Remove por id
function removeById(list: FinanceItem[], id: string): FinanceItem[] {
  return list.filter((x) => x.id !== id); // Remove id
}

function mergeAccountIds(fromApi: FinanceItem[], local: FinanceItem[]): FinanceItem[] {
  const map = new Map(local.filter(i => i.accountId).map(i => [i.id, i.accountId!]));
  if (map.size === 0) return fromApi;
  return fromApi.map(i => map.has(i.id) ? { ...i, accountId: map.get(i.id) } : i);
}

function mergePendingLocalItems(fromApi: FinanceItem[]): FinanceItem[] {
  const hasPending = pendingLocalItemIds.size > 0;
  const hasRecent = recentlyAddedIds.size > 0;
  if (!hasPending && !hasRecent) return fromApi;

  const current = getCache();
  const apiIds = new Set(fromApi.map((item) => item.id));

  // Itens pendentes que ainda não chegaram na API — mantém no topo
  const stillPending = current.filter((item) => pendingLocalItemIds.has(item.id) && !apiIds.has(item.id));

  // Itens recém-adicionados que JÁ estão na API — pina no topo em vez de deixar na posição por data
  const pinnedFromApi = fromApi.filter((item) => recentlyAddedIds.has(item.id));
  const restFromApi = fromApi.filter(
    (item) => !recentlyAddedIds.has(item.id) && !stillPending.some((p) => p.id === item.id)
  );

  return [...stillPending, ...pinnedFromApi, ...restFromApi];
}

// =============================
// API DO SERVICE (usada pelas telas)
// =============================

// ✅ Lista rápida via cache/local + 1 "hidratação" da API por sessão (sem cascata de eventos)
export function financeList(): FinanceItem[] {
  ensureUserScopedCache();
  const cached = getCache(); // Retorna cache imediato (UX rápida)

  if (!USE_API) return cached; // Se não usa API, retorna

  const now = Date.now(); // Agora

  // ✅ Se já hidrataram 1x nesta sessão, não fica re-sincronizando a cada render/evento
  if (hasHydratedFromApiThisSession) return cached;

  // ✅ Se já está sincronizando, não começa outro
  if (syncInFlight) return cached;

  // ✅ Se sincronizou há pouco, não sincroniza de novo
  if (now - lastSyncAt < SYNC_MIN_INTERVAL_MS) return cached;

  // ✅ Marca sync ativo
  syncInFlight = true;

  // ✅ Faz 1 sync em background (sem travar UI)
  void safe(
    async () => {
      const fromApi = mergeAccountIds(mergePendingLocalItems(await activeProvider.list()), getCache()); // Busca na API, preserva accountId local

      // ✅ Só grava se mudou (evita evento Ã  toa)
      const a = JSON.stringify(fromApi); // API
      const b = JSON.stringify(cached); // Cache

      if (a !== b) {
        lastWriteFromApiAt = Date.now(); // Marca que a gravação veio da API
        saveItemsStorage(fromApi); // Salva local (dispara evento interno)
        setCache(fromApi); // Atualiza cache
      }

      hasHydratedFromApiThisSession = true; // ✅ Pronto: não hidrata de novo até recarregar
      return fromApi; // Retorna
    },
    async () => {
      return cached; // Fallback
    }
  ).finally(() => {
    lastSyncAt = Date.now(); // Atualiza timestamp
    syncInFlight = false; // Libera trava
  });

  return cached; // Sempre retorna rápido
}

export async function financeRefreshFromApi(): Promise<FinanceItem[]> {
  ensureUserScopedCache();

  if (!USE_API) {
    return getCache();
  }

  if (syncInFlight) {
    return getCache();
  }

  syncInFlight = true;

  try {
    const fromApi = mergePendingLocalItems(await activeProvider.list());

    setCache(fromApi);
    saveItemsStorage(fromApi);
    hasHydratedFromApiThisSession = true;
    lastSyncAt = Date.now();

    return fromApi;
  } finally {
    syncInFlight = false;
  }
}

export function financeAdd(item: FinanceItem): FinanceItem[] {
  ensureUserScopedCache();
  financeDebugLog("financeAdd chamado", {
    type: item.type,
    title: item.title,
    amountCents: item.amountCents,
    dateISO: item.dateISO,
  });

  // ✅ Garantimos que o item tem um id temporário para o modo otimista
  const tempItem: FinanceItem = {
    ...item, // Copia campos
    id: item.id ?? makeId(), // Garante id
    createdAtISO: item.createdAtISO ?? new Date().toISOString(), // Garante createdAt
  };

  const updatedLocal = [tempItem, ...getCache()]; // Atualiza primeiro em memoria
  setCache(updatedLocal); // Garante que o evento abaixo ja leia a lista nova
  saveItemsStorage(updatedLocal); // Salva no local e notifica telas
  if (tempItem.accountId) acctMapSet(tempItem.id, tempItem.accountId);
  recentlyAddedIds.add(tempItem.id); // Pina imediatamente no topo até flush explícito

  if (USE_API) {
    const tempId = tempItem.id; // Guarda id temporário (pra substituir depois)
    pendingLocalItemIds.add(tempId);

    safe(
      async () => {
        const created = await activeProvider.add(tempItem); // POST e pega item criado (sem GET)
        pendingLocalItemIds.delete(tempId);
        recentlyAddedIds.delete(tempId);
        recentlyAddedIds.add(created.id); // troca tempId pelo id real
        acctMapReplace(tempId, created.id);

        // Substitui o item temporário pelo item real do backend
        const current = getCache(); // Cache atual
        const withoutTemp = removeById(current, tempId); // Remove temporário
        // O backend sempre gera um UUID próprio, então created.id !== tempId.
        // upsertById adicionaria no final se não encontrar — colocamos na frente
        // para manter a posição original (novo lançamento sempre aparece no topo).
        const createdWithAccount = tempItem.accountId
          ? { ...created, accountId: tempItem.accountId }
          : created;
        const next = createdWithAccount.id === tempId
          ? upsertById(withoutTemp, createdWithAccount)
          : [createdWithAccount, ...withoutTemp];

        saveItemsStorage(next); // Sincroniza local (dispara evento interno)
        setCache(next); // Atualiza cache

        // ✅ Como houve mudança real via API, marcamos que a sessão já hidratou
        hasHydratedFromApiThisSession = true;

        return created; // Retorna item criado
      },
      async () => {
        window.dispatchEvent(
          new CustomEvent("conciliaai_finance_error", {
            detail: "Nao foi possivel sincronizar com a API. O lancamento ficou salvo neste aparelho.",
          })
        );
        financeDebugLog("financeAdd fallback local", tempItem);
        return tempItem; // Fallback: mantém o otimista
      }
    ).catch((error) => {
      if (error instanceof PlanLimitError) {
        pendingLocalItemIds.delete(tempId);
        recentlyAddedIds.delete(tempId);
        const without = removeById(getCache(), tempId);
        setCache(without);
        saveItemsStorage(without);
        window.dispatchEvent(
          new CustomEvent("conciliaai_finance_error", { detail: error.message })
        );
      }
    });
  }

  return updatedLocal; // Retorna local
}

export function financeRemoveMany(ids: string[]): FinanceItem[] {
  if (ids.length === 0) return getCache();
  ensureUserScopedCache();
  const idSet = new Set(ids);
  const updatedLocal = getCache().filter((x) => !idSet.has(x.id));
  setCache(updatedLocal);
  saveItemsStorage(updatedLocal);
  const m = loadAcctMap();
  for (const id of ids) delete m[id];
  saveAcctMap(m);

  if (USE_API) {
    for (const id of ids) {
      void safe(
        async () => { await activeProvider.remove(id); },
        async () => {},
      );
    }
  }

  return updatedLocal;
}

export function financeRemove(id: string): FinanceItem[] {
  ensureUserScopedCache();
  const updatedLocal = removeById(getCache(), id); // Remove primeiro em memoria
  setCache(updatedLocal); // Garante que o evento abaixo ja leia a lista nova
  saveItemsStorage(updatedLocal); // Salva no local e notifica telas
  acctMapRemove(id);

  if (USE_API) {
    void safe(
      async () => {
        await activeProvider.remove(id); // DELETE no backend (sem GET depois)

        // ✅ Como houve mudança real via API, marcamos que a sessão já hidratou
        hasHydratedFromApiThisSession = true;

        return;
      },
      async () => {
        return;
      }
    );
  }

  return updatedLocal; // Retorna local
}

export function financeUpdate(id: string, patch: Partial<FinanceItem>): FinanceItem[] {
  ensureUserScopedCache();
  const previous = getCache();
  const updatedLocal = previous.map((item) => (item.id === id ? { ...item, ...patch } : item));
  setCache(updatedLocal);
  saveItemsStorage(updatedLocal);

  if (USE_API) {
    void safe(
      async () => {
        const updated = await activeProvider.update(id, patch);
        const next = upsertById(getCache(), updated);
        saveItemsStorage(next);
        setCache(next);
        hasHydratedFromApiThisSession = true;
        return updated;
      },
      async () => {
        window.dispatchEvent(
          new CustomEvent("conciliaai_finance_error", {
            detail: "Nao foi possivel sincronizar a alteracao agora. Tente novamente em alguns segundos.",
          })
        );
        return previous.find((item) => item.id === id) ?? updatedLocal[0];
      }
    );
  }

  return updatedLocal;
}

export function financeSaveAll(items: FinanceItem[]): void {
  ensureUserScopedCache();
  saveItemsStorage(items); // Salva local
  setCache(items); // Atualiza cache

  if (USE_API) {
    void safe(
      async () => {
        await activeProvider.saveAll(items); // Por enquanto só local
        return;
      },
      async () => {
        return;
      }
    );
  }
}

// =============================
// EVENTOS (mantém atualização em tempo real)
// =============================

export function financeSubscribe(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (isFinanceStorageKey(e.key)) {
      ensureUserScopedCache();

      if (e.key !== getFinanceStorageKey()) return;

      // ✅ Se o próprio service acabou de gravar vindo da API, ignora o "rebote"
      if (Date.now() - lastWriteFromApiAt < 500) return;

      setCache(loadFinanceItems()); // Atualiza cache
      onChange(); // Atualiza tela
    }
  };

  const onUpdated = () => {
    ensureUserScopedCache();

    // ✅ Se o próprio service acabou de gravar vindo da API, ignora o "rebote"
    if (Date.now() - lastWriteFromApiAt < 500) return;

    setCache(loadFinanceItems()); // Atualiza cache
    onChange(); // Atualiza tela
  };

  window.addEventListener("storage", onStorage); // Outra aba
  window.addEventListener("conciliaai_finance_updated", onUpdated as EventListener); // Mesma aba

  return () => {
    window.removeEventListener("storage", onStorage); // Remove listener
    window.removeEventListener("conciliaai_finance_updated", onUpdated as EventListener); // Remove listener
  };
}

// =============================
// HELPERS (reexport)
// =============================

export { todayISO, makeId };

/*
=====================================================
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com
=====================================================

O que foi corrigido agora:

âœ” Evitado "cascata" de GET: financeList() hidrata da API apenas 1x por sessão
âœ” Mantido freio anti-loop (inFlight + intervalo mínimo)
âœ” Ignorado "rebote" do evento/storage quando a gravação veio da API (500ms)
âœ” Mantido sem GET após POST/DELETE (usa retorno do backend e confirma DELETE)
âœ” Mantido cache híbrido (API + localStorage) e eventos
*/


