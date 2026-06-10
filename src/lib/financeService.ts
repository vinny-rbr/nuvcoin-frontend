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
  loadFinanceItems, // LÃª itens do localStorage
  getFinanceStorageKey,
  isFinanceStorageKey,
  saveFinanceItems as saveItemsStorage, // Salva lista no localStorage (âœ… jÃ¡ dispara evento interno)
  todayISO, // Data ISO padrÃ£o
  makeId, // ID seguro
} from "./financeStorage"; // ImplementaÃ§Ã£o atual (localStorage)

// =============================
// CONFIG
// =============================

const USE_API = true; // âœ… Agora vamos usar a API real
const API_BASE_URL = apiUrl("/api/finance"); // Base da API

// âœ… Freio anti-loop (evita fetch infinito)
const SYNC_MIN_INTERVAL_MS = 3000; // 3s entre syncs automÃ¡ticos

let syncInFlight = false; // âœ… trava quando jÃ¡ tem sync rolando
let lastSyncAt = 0; // âœ… Ãºltimo sync (timestamp)

// âœ… Controle pra evitar â€œsync em cascataâ€ causado por evento/storage
let hasHydratedFromApiThisSession = false; // âœ… jÃ¡ sincronizou 1x com a API nesta sessÃ£o
let lastWriteFromApiAt = 0; // âœ… quando gravamos no storage vindo da API (para ignorar evento logo depois)

// =============================
// AUTH HELPERS
// =============================

// LÃª o token do localStorage
function getAuthToken(): string | null {
  const t1 = localStorage.getItem("conciliaai_token"); // PadrÃ£o 1
  if (t1) return t1; // Retorna se existir

  const t2 = localStorage.getItem("token"); // PadrÃ£o 2 (o seu JWT estÃ¡ aqui)
  if (t2) return t2; // Retorna se existir

  const t3 = localStorage.getItem("auth_token"); // PadrÃ£o 3
  if (t3) return t3; // Retorna se existir

  return null; // Sem token
}

// Monta headers padrÃ£o com Authorization: Bearer
function makeHeaders(): HeadersInit {
  const token = getAuthToken(); // LÃª token

  if (!token) {
    return { "Content-Type": "application/json" }; // Sem Authorization
  }

  return {
    "Content-Type": "application/json", // JSON
    Authorization: `Bearer ${token}`, // Bearer JWT
  };
}

// =============================
// NORMALIZAÃ‡ÃƒO (API -> Front)
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
    raw?.createdAtISO ?? // JÃ¡ veio pronto
    raw?.createdAtUtc ?? // Backend pode mandar createdAtUtc
    raw?.createdAt ?? // Outras variaÃ§Ãµes
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
  } as FinanceItem;
}

function normalizeApiList(rawList: any): FinanceItem[] {
  if (!Array.isArray(rawList)) return []; // Se nÃ£o for array, vazio
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

    return created; // âœ… Sem GET depois
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
    // âœ… Ainda nÃ£o existe bulk no backend.
    // Por enquanto sÃ³ salva local.
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
// CACHE EM MEMÃ“RIA
// =============================

let inMemoryCache: FinanceItem[] | null = null; // Cache em memÃ³ria
let activeCacheStorageKey = getFinanceStorageKey();

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
  const local = loadFinanceItems(); // SenÃ£o, lÃª local
  inMemoryCache = local; // Guarda no cache
  return local; // Retorna
}

// Garante item no cache sem duplicar por id
function upsertById(list: FinanceItem[], item: FinanceItem): FinanceItem[] {
  const idx = list.findIndex((x) => x.id === item.id); // Procura id
  if (idx === -1) return [...list, item]; // Se nÃ£o existe, adiciona
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

// âœ… Lista rÃ¡pida via cache/local + 1 â€œhidrataÃ§Ã£oâ€ da API por sessÃ£o (sem cascata de eventos)
export function financeList(): FinanceItem[] {
  ensureUserScopedCache();
  const cached = getCache(); // Retorna cache imediato (UX rÃ¡pida)

  if (!USE_API) return cached; // Se nÃ£o usa API, retorna

  const now = Date.now(); // Agora

  // âœ… Se jÃ¡ hidrataram 1x nesta sessÃ£o, nÃ£o fica re-sincronizando a cada render/evento
  if (hasHydratedFromApiThisSession) return cached;

  // âœ… Se jÃ¡ estÃ¡ sincronizando, nÃ£o comeÃ§a outro
  if (syncInFlight) return cached;

  // âœ… Se sincronizou hÃ¡ pouco, nÃ£o sincroniza de novo
  if (now - lastSyncAt < SYNC_MIN_INTERVAL_MS) return cached;

  // âœ… Marca sync ativo
  syncInFlight = true;

  // âœ… Faz 1 sync em background (sem travar UI)
  void safe(
    async () => {
      const fromApi = mergeAccountIds(mergePendingLocalItems(await activeProvider.list()), getCache()); // Busca na API, preserva accountId local

      // âœ… SÃ³ grava se mudou (evita evento Ã  toa)
      const a = JSON.stringify(fromApi); // API
      const b = JSON.stringify(cached); // Cache

      if (a !== b) {
        lastWriteFromApiAt = Date.now(); // Marca que a gravaÃ§Ã£o veio da API
        saveItemsStorage(fromApi); // Salva local (dispara evento interno)
        setCache(fromApi); // Atualiza cache
      }

      hasHydratedFromApiThisSession = true; // âœ… Pronto: nÃ£o hidrata de novo atÃ© recarregar
      return fromApi; // Retorna
    },
    async () => {
      return cached; // Fallback
    }
  ).finally(() => {
    lastSyncAt = Date.now(); // Atualiza timestamp
    syncInFlight = false; // Libera trava
  });

  return cached; // Sempre retorna rÃ¡pido
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

  // âœ… Garantimos que o item tem um id temporÃ¡rio para o modo otimista
  const tempItem: FinanceItem = {
    ...item, // Copia campos
    id: item.id ?? makeId(), // Garante id
    createdAtISO: item.createdAtISO ?? new Date().toISOString(), // Garante createdAt
  };

  const updatedLocal = [tempItem, ...getCache()]; // Atualiza primeiro em memoria
  setCache(updatedLocal); // Garante que o evento abaixo ja leia a lista nova
  saveItemsStorage(updatedLocal); // Salva no local e notifica telas
  recentlyAddedIds.add(tempItem.id); // Pina imediatamente no topo até flush explícito

  if (USE_API) {
    const tempId = tempItem.id; // Guarda id temporÃ¡rio (pra substituir depois)
    pendingLocalItemIds.add(tempId);

    safe(
      async () => {
        const created = await activeProvider.add(tempItem); // POST e pega item criado (sem GET)
        pendingLocalItemIds.delete(tempId);
        recentlyAddedIds.delete(tempId);
        recentlyAddedIds.add(created.id); // troca tempId pelo id real

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

        // âœ… Como houve mudanÃ§a real via API, marcamos que a sessÃ£o jÃ¡ hidratou
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
        return tempItem; // Fallback: mantÃ©m o otimista
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

export function financeRemove(id: string): FinanceItem[] {
  ensureUserScopedCache();
  const updatedLocal = removeById(getCache(), id); // Remove primeiro em memoria
  setCache(updatedLocal); // Garante que o evento abaixo ja leia a lista nova
  saveItemsStorage(updatedLocal); // Salva no local e notifica telas

  if (USE_API) {
    void safe(
      async () => {
        await activeProvider.remove(id); // DELETE no backend (sem GET depois)

        // âœ… Como houve mudanÃ§a real via API, marcamos que a sessÃ£o jÃ¡ hidratou
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
        await activeProvider.saveAll(items); // Por enquanto sÃ³ local
        return;
      },
      async () => {
        return;
      }
    );
  }
}

// =============================
// EVENTOS (mantÃ©m atualizaÃ§Ã£o em tempo real)
// =============================

export function financeSubscribe(onChange: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (isFinanceStorageKey(e.key)) {
      ensureUserScopedCache();

      if (e.key !== getFinanceStorageKey()) return;

      // âœ… Se o prÃ³prio service acabou de gravar vindo da API, ignora o â€œreboteâ€
      if (Date.now() - lastWriteFromApiAt < 500) return;

      setCache(loadFinanceItems()); // Atualiza cache
      onChange(); // Atualiza tela
    }
  };

  const onUpdated = () => {
    ensureUserScopedCache();

    // âœ… Se o prÃ³prio service acabou de gravar vindo da API, ignora o â€œreboteâ€
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

âœ” Evitado â€œcascataâ€ de GET: financeList() hidrata da API apenas 1x por sessÃ£o
âœ” Mantido freio anti-loop (inFlight + intervalo mÃ­nimo)
âœ” Ignorado â€œreboteâ€ do evento/storage quando a gravaÃ§Ã£o veio da API (500ms)
âœ” Mantido sem GET apÃ³s POST/DELETE (usa retorno do backend e confirma DELETE)
âœ” Mantido cache hÃ­brido (API + localStorage) e eventos
*/


