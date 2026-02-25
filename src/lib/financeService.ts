import type { FinanceItem } from "../types/finance"; // Tipos do app

import {
  loadFinanceItems, // Lê itens do localStorage
  addFinanceItem as addItemStorage, // Adiciona item no localStorage
  deleteFinanceItem as deleteItemStorage, // Remove item no localStorage
  saveFinanceItems as saveItemsStorage, // Salva lista no localStorage
  todayISO, // Data ISO padrão
  makeId, // ID seguro
} from "./financeStorage"; // Implementação atual (localStorage)

// =============================
// CONFIG
// =============================

const USE_API = false; // ✅ Quando o backend estiver pronto, muda pra true
const API_BASE_URL = "/api/finance"; // ✅ Base da API (ajusta quando criar o controller)

// =============================
// PROVIDER (fonte de dados)
// =============================

type FinanceProvider = {
  list: () => Promise<FinanceItem[]>;
  add: (item: FinanceItem) => Promise<FinanceItem[]>;
  remove: (id: string) => Promise<FinanceItem[]>;
  saveAll: (items: FinanceItem[]) => Promise<void>;
};

// Provider atual: localStorage
const localStorageProvider: FinanceProvider = {
  list: async () => loadFinanceItems(), // Lista vindo do storage
  add: async (item) => addItemStorage(item), // Add via storage
  remove: async (id) => deleteItemStorage(id), // Delete via storage
  saveAll: async (items) => saveItemsStorage(items), // Save via storage
};

// Provider futuro: API
const apiProvider: FinanceProvider = {
  list: async () => {
    const res = await fetch(`${API_BASE_URL}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error(`API list failed: ${res.status}`);
    return (await res.json()) as FinanceItem[];
  },

  add: async (item) => {
    const res = await fetch(`${API_BASE_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });

    if (!res.ok) throw new Error(`API add failed: ${res.status}`);
    return (await res.json()) as FinanceItem[];
  },

  remove: async (id) => {
    const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error(`API remove failed: ${res.status}`);
    return (await res.json()) as FinanceItem[];
  },

  saveAll: async (items) => {
    const res = await fetch(`${API_BASE_URL}/bulk`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    });

    if (!res.ok) throw new Error(`API saveAll failed: ${res.status}`);
  },
};

// Provider ativo
const activeProvider: FinanceProvider = USE_API ? apiProvider : localStorageProvider;

// =============================
// HELPERS INTERNOS (fallback)
// =============================

async function safe<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    return await fallback();
  }
}

// =============================
// API DO SERVICE (usada pelas telas)
// =============================
// ✅ Mantive as assinaturas SINCRONAS iguais pra não quebrar o app agora.
// ✅ Por baixo, quando USE_API=true, usamos cache local e tentamos sincronizar com API.

let inMemoryCache: FinanceItem[] | null = null; // Cache em memória (para não travar UI)

function setCache(items: FinanceItem[]): void {
  inMemoryCache = items;
}

function getCache(): FinanceItem[] {
  if (inMemoryCache) return inMemoryCache;
  const local = loadFinanceItems();
  inMemoryCache = local;
  return local;
}

export function financeList(): FinanceItem[] {
  // Retorna cache (rápido)
  return getCache();
}

export function financeAdd(item: FinanceItem): FinanceItem[] {
  // Primeiro aplica local (rápido e garante UX)
  const updatedLocal = addItemStorage(item);
  setCache(updatedLocal);

  // Se estiver usando API, tenta sincronizar sem quebrar o app
  if (USE_API) {
    void safe(
      async () => {
        const updatedFromApi = await activeProvider.add(item);
        saveItemsStorage(updatedFromApi);
        setCache(updatedFromApi);
        return updatedFromApi;
      },
      async () => {
        return updatedLocal;
      }
    );
  }

  return updatedLocal;
}

export function financeRemove(id: string): FinanceItem[] {
  // Primeiro aplica local (rápido)
  const updatedLocal = deleteItemStorage(id);
  setCache(updatedLocal);

  // Se estiver usando API, tenta sincronizar
  if (USE_API) {
    void safe(
      async () => {
        const updatedFromApi = await activeProvider.remove(id);
        saveItemsStorage(updatedFromApi);
        setCache(updatedFromApi);
        return updatedFromApi;
      },
      async () => {
        return updatedLocal;
      }
    );
  }

  return updatedLocal;
}

export function financeSaveAll(items: FinanceItem[]): void {
  // Salva local (rápido)
  saveItemsStorage(items);
  setCache(items);

  // Se estiver usando API, tenta sincronizar
  if (USE_API) {
    void safe(
      async () => {
        await activeProvider.saveAll(items);
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
      // Atualiza cache quando mudar em outra aba
      setCache(loadFinanceItems());
      onChange();
    }
  };

  const onUpdated = () => {
    // Atualiza cache quando mudar na mesma aba
    setCache(loadFinanceItems());
    onChange();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener("nuvcoin_finance_updated", onUpdated as EventListener);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("nuvcoin_finance_updated", onUpdated as EventListener);
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

O que este arquivo faz:

✔ Cria financeService com provider localStorage + provider API
✔ USE_API=false (default) mantém tudo como está
✔ Quando USE_API=true:
   - UI continua rápida (usa local/cache)
   - tenta sincronizar com API em background
   - se API falhar, mantém fallback localStorage
✔ Mantém financeSubscribe para atualização em tempo real
*/