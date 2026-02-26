import type { FinanceItem } from "../types/finance"; // Tipos do app

import {
  loadFinanceItems, // Lê itens do localStorage
  addFinanceItem as addItemStorage, // Adiciona item no localStorage
  deleteFinanceItem as deleteItemStorage, // Remove item no localStorage
  saveFinanceItems as saveItemsStorage, // Salva lista no localStorage (✅ já dispara evento interno)
  todayISO, // Data ISO padrão
  makeId, // ID seguro
} from "./financeStorage"; // Implementação atual (localStorage)

// =============================
// CONFIG
// =============================

const USE_API = true; // ✅ Agora vamos usar a API real
const API_BASE_URL = "/api/finance"; // ✅ Base da API

// ✅ Freio anti-loop (evita fetch infinito)
const SYNC_MIN_INTERVAL_MS = 3000; // 3s entre syncs automáticos

let syncInFlight = false; // ✅ trava quando já tem sync rolando
let lastSyncAt = 0; // ✅ último sync (timestamp)

// ✅ Controle pra evitar “sync em cascata” causado por evento/storage
let hasHydratedFromApiThisSession = false; // ✅ já sincronizou 1x com a API nesta sessão
let lastWriteFromApiAt = 0; // ✅ quando gravamos no storage vindo da API (para ignorar evento logo depois)

// =============================
// AUTH HELPERS
// =============================

// Lê o token do localStorage
function getAuthToken(): string | null {
  const t1 = localStorage.getItem("nuvcoin_token"); // Padrão 1
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
// NORMALIZAÇÃO (API -> Front)
// =============================

function normalizeApiItem(raw: any): FinanceItem {
  const dateISO: string =
    raw?.dateISO ?? // Já veio pronto
    raw?.date ?? // Backend pode mandar "date"
    raw?.dateUtc ?? // Outras variações
    raw?.dateTime ?? // Outras variações
    todayISO(); // Fallback

  const createdAtISO: string =
    raw?.createdAtISO ?? // Já veio pronto
    raw?.createdAtUtc ?? // Backend pode mandar createdAtUtc
    raw?.createdAt ?? // Outras variações
    new Date().toISOString(); // Fallback

  return {
    id: raw?.id ?? makeId(), // Id
    type: raw?.type, // Tipo
    title: raw?.title ?? "", // Título
    category: raw?.category ?? "Outros", // Categoria
    amountCents: Number(raw?.amountCents ?? 0), // Valor
    dateISO: dateISO, // Data ISO
    createdAtISO: createdAtISO, // Criado ISO
    paymentType: raw?.paymentType ?? "pix", // Forma
    status: raw?.status ?? "paid", // Status
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
  remove: (id: string) => Promise<void>; // Remove
  saveAll: (items: FinanceItem[]) => Promise<void>; // Bulk (ainda local)
};

// Provider: localStorage
const localStorageProvider: FinanceProvider = {
  list: async () => loadFinanceItems(), // Lista do storage

  add: async (item) => {
    addItemStorage(item); // Salva no local
    return item; // Retorna item
  },

  remove: async (id) => {
    deleteItemStorage(id); // Remove do storage
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

    if (!res.ok) throw new Error(`API list failed: ${res.status}`); // Erro

    const raw = await res.json(); // JSON
    return normalizeApiList(raw); // Normaliza
  },

  add: async (item) => {
    const payload = {
      type: item.type, // Tipo
      title: item.title, // Título
      category: item.category ?? "Outros", // Categoria
      amountCents: item.amountCents, // Valor
      date: item.dateISO, // ✅ Backend espera "date"
      paymentType: item.paymentType ?? "pix", // Forma
      status: item.status ?? "paid", // Status
    };

    const res = await fetch(`${API_BASE_URL}`, {
      method: "POST", // POST
      headers: makeHeaders(), // Headers
      body: JSON.stringify(payload), // Body
    });

    if (!res.ok) throw new Error(`API add failed: ${res.status}`); // Erro

    const rawCreated = await res.json(); // Retorno do backend
    const created = normalizeApiItem(rawCreated); // Normaliza item criado

    return created; // ✅ Sem GET depois
  },

  remove: async (id) => {
    const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(id)}`, {
      method: "DELETE", // DELETE
      headers: makeHeaders(), // Headers
    });

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
// CACHE EM MEMÓRIA
// =============================

let inMemoryCache: FinanceItem[] | null = null; // Cache em memória

function setCache(items: FinanceItem[]): void {
  inMemoryCache = items; // Atualiza cache
}

function getCache(): FinanceItem[] {
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

// =============================
// API DO SERVICE (usada pelas telas)
// =============================

// ✅ Lista rápida via cache/local + 1 “hidratação” da API por sessão (sem cascata de eventos)
export function financeList(): FinanceItem[] {
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
      const fromApi = await activeProvider.list(); // Busca na API

      // ✅ Só grava se mudou (evita evento à toa)
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

export function financeAdd(item: FinanceItem): FinanceItem[] {
  // ✅ Garantimos que o item tem um id temporário para o modo otimista
  const tempItem: FinanceItem = {
    ...item, // Copia campos
    id: item.id ?? makeId(), // Garante id
    createdAtISO: item.createdAtISO ?? new Date().toISOString(), // Garante createdAt
  };

  // ✅ Add otimista local (rápido)
  const updatedLocal = addItemStorage(tempItem); // Salva no local (dispara evento interno)
  setCache(updatedLocal); // Atualiza cache

  if (USE_API) {
    const tempId = tempItem.id; // Guarda id temporário (pra substituir depois)

    void safe(
      async () => {
        const created = await activeProvider.add(tempItem); // POST e pega item criado (sem GET)

        // ✅ Substitui o item temporário pelo item real do backend
        const current = getCache(); // Cache atual
        const withoutTemp = removeById(current, tempId); // Remove temporário
        const next = upsertById(withoutTemp, created); // Insere o real

        saveItemsStorage(next); // Sincroniza local (dispara evento interno)
        setCache(next); // Atualiza cache

        // ✅ Como houve mudança real via API, marcamos que a sessão já hidratou
        hasHydratedFromApiThisSession = true;

        return created; // Retorna item criado
      },
      async () => {
        return tempItem; // Fallback: mantém o otimista
      }
    );
  }

  return updatedLocal; // Retorna local
}

export function financeRemove(id: string): FinanceItem[] {
  const updatedLocal = deleteItemStorage(id); // Remove local
  setCache(updatedLocal); // Atualiza cache

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

export function financeSaveAll(items: FinanceItem[]): void {
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
    if (e.key === "nuvcoin_finance_items_v1") {
      // ✅ Se o próprio service acabou de gravar vindo da API, ignora o “rebote”
      if (Date.now() - lastWriteFromApiAt < 500) return;

      setCache(loadFinanceItems()); // Atualiza cache
      onChange(); // Atualiza tela
    }
  };

  const onUpdated = () => {
    // ✅ Se o próprio service acabou de gravar vindo da API, ignora o “rebote”
    if (Date.now() - lastWriteFromApiAt < 500) return;

    setCache(loadFinanceItems()); // Atualiza cache
    onChange(); // Atualiza tela
  };

  window.addEventListener("storage", onStorage); // Outra aba
  window.addEventListener("nuvcoin_finance_updated", onUpdated as EventListener); // Mesma aba

  return () => {
    window.removeEventListener("storage", onStorage); // Remove listener
    window.removeEventListener("nuvcoin_finance_updated", onUpdated as EventListener); // Remove listener
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

✔ Evitado “cascata” de GET: financeList() hidrata da API apenas 1x por sessão
✔ Mantido freio anti-loop (inFlight + intervalo mínimo)
✔ Ignorado “rebote” do evento/storage quando a gravação veio da API (500ms)
✔ Mantido sem GET após POST/DELETE (usa retorno do backend e confirma DELETE)
✔ Mantido cache híbrido (API + localStorage) e eventos
*/