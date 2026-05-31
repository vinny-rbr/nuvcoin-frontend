import type { FinanceCategoryOption, FinanceType } from "../types/finance";
import { apiUrl } from "./api";

export const DEFAULT_CATEGORIES: Record<FinanceType, string[]> = {
  RECEITA: ["Salário", "Freelance", "Vendas", "Outros"],
  DESPESA: ["Alimentação", "Transporte", "Moradia", "Saúde", "Lazer", "Outros"],
};

function getAuthToken(): string | null {
  return (
    localStorage.getItem("conciliaai_token") ??
    localStorage.getItem("token") ??
    localStorage.getItem("auth_token")
  );
}

function makeHeaders(): HeadersInit {
  const token = getAuthToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizeCategory(raw: any): FinanceCategoryOption {
  return {
    id: String(raw?.id ?? ""),
    type: raw?.type === "RECEITA" ? "RECEITA" : "DESPESA",
    name: String(raw?.name ?? "").trim(),
    icon: String(raw?.icon ?? "💼").trim() || "💼",
    color: /^#[0-9a-fA-F]{6}$/.test(String(raw?.color ?? "")) ? String(raw?.color) : "#60a5fa",
    parentId: raw?.parentId ?? null,
    level: Number(raw?.level ?? 1),
    createdAtUtc: raw?.createdAtUtc,
    updatedAtUtc: raw?.updatedAtUtc ?? null,
  };
}

function withFullPaths(categories: FinanceCategoryOption[]): FinanceCategoryOption[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const pathCache = new Map<string, string>();

  const pathFor = (category: FinanceCategoryOption): string => {
    const cached = pathCache.get(category.id);
    if (cached) return cached;

    const parent = category.parentId ? byId.get(category.parentId) : null;
    const path = parent ? `${pathFor(parent)} > ${category.name}` : category.name;
    pathCache.set(category.id, path);
    return path;
  };

  return categories.map((category) => ({
    ...category,
    fullPath: pathFor(category),
  }));
}

export async function listFinanceCategories(): Promise<FinanceCategoryOption[]> {
  const response = await fetch(apiUrl("/api/finance-categories"), {
    method: "GET",
    headers: makeHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Could not load categories: ${response.status}`);
  }

  const raw = await response.json();
  const normalized = Array.isArray(raw) ? raw.map(normalizeCategory).filter((category) => category.id && category.name) : [];
  return withFullPaths(normalized);
}

export async function createFinanceCategory(
  type: FinanceType,
  name: string,
  parentId?: string | null,
  icon?: string,
  color?: string,
): Promise<FinanceCategoryOption> {
  const response = await fetch(apiUrl("/api/finance-categories"), {
    method: "POST",
    headers: makeHeaders(),
    body: JSON.stringify({ type, name, parentId: parentId ?? null, icon, color }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message ?? `Could not create category: ${response.status}`);
  }

  return normalizeCategory(await response.json());
}

export async function updateFinanceCategory(
  id: string,
  name: string,
  icon?: string,
  color?: string,
): Promise<FinanceCategoryOption> {
  const response = await fetch(apiUrl(`/api/finance-categories/${encodeURIComponent(id)}`), {
    method: "PUT",
    headers: makeHeaders(),
    body: JSON.stringify({ name, icon, color }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message ?? `Could not update category: ${response.status}`);
  }

  return normalizeCategory(await response.json());
}

export async function deleteFinanceCategory(id: string): Promise<void> {
  const response = await fetch(apiUrl(`/api/finance-categories/${encodeURIComponent(id)}`), {
    method: "DELETE",
    headers: makeHeaders(),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message ?? `Could not delete category: ${response.status}`);
  }
}

export function categoriesForType(categories: FinanceCategoryOption[], type: FinanceType): string[] {
  const names = categories
    .filter((category) => category.type === type)
    .map((category) => category.fullPath ?? category.name)
    .filter(Boolean);

  return names.length > 0 ? names : DEFAULT_CATEGORIES[type];
}
