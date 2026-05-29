import type { FinanceItem } from "../types/finance"; // Tipos do app
import { persistSubscriptionState } from "./auth";

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
const API_BASE_URL = "/api/finance"; // âœ… Base da API

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
    id: raw?.id ?? makeId(), // Id
    type: raw?.type, // Tipo
    title: raw?.title ?? "", // TÃ­tulo
    category: raw?.category ?? "Outros", // Categoria
    amountCents: Number(raw?.amountCents ?? 0), // Valor
    dateISO: dateISO, // Data ISO
    createdAtISO: createdAtISO, // Criado ISO
    paymentType: raw?.paymentType ?? "pix", // Forma
    status: raw?.status ?? "paid", // Status
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
      type: item.type, // Tipo
      title: item.title, // TÃ­tulo
      category: item.category ?? "Outros", // Categoria
      amountCents: item.amountCents, // Valor
      date: item.dateISO, // âœ… Backend espera "date"
      paymentType: item.paymentType ?? "pix", // Forma
      status: item.status ?? "paid", // Status
    };

    const res = await fetch(`${API_BASE_URL}`, {
      method: "POST", // POST
      headers: makeHeaders(), // Headers
      body: JSON.stringify(payload), // Body
    });

    if (res.status === 403) {
      financeDebugLog("API POST /finance 403");
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

  void fetch("/api/client-logs", {
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
  } catch {
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

function mergePendingLocalItems(fromApi: FinanceItem[]): FinanceItem[] {
  if (pendingLocalItemIds.size === 0) return fromApi;

  const current = getCache();
  const apiIds = new Set(fromApi.map((item) => item.id));
  const pending = current.filter((item) => pendingLocalItemIds.has(item.id) && !apiIds.has(item.id));

  return [...pending, ...fromApi];
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
      const fromApi = mergePendingLocalItems(await activeProvider.list()); // Busca na API

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

  if (USE_API) {
    const tempId = tempItem.id; // Guarda id temporÃ¡rio (pra substituir depois)
    pendingLocalItemIds.add(tempId);

    void safe(
      async () => {
        const created = await activeProvider.add(tempItem); // POST e pega item criado (sem GET)
        pendingLocalItemIds.delete(tempId);

        // âœ… Substitui o item temporÃ¡rio pelo item real do backend
        const current = getCache(); // Cache atual
        const withoutTemp = removeById(current, tempId); // Remove temporÃ¡rio
        const next = upsertById(withoutTemp, created); // Insere o real

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
    );
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

