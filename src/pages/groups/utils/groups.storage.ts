import { percentNumberToInput } from "./groups.helpers";
import type { GroupSplitMode } from "../types/groups.types";

export function salaryStorageKey(groupId: string): string {
  return `nuvcoin:group:${groupId}:salaryBase`; // Chave fixa para salários
}

export function splitModeStorageKey(groupId: string): string {
  return `nuvcoin:group:${groupId}:splitMode`; // Chave fixa para modo de divisão
}

export function manualPercentStorageKey(groupId: string): string {
  return `nuvcoin:group:${groupId}:manualPercentBase`; // Chave fixa para percentuais manuais
}

export function buildDefaultManualPercentBase(memberIds: string[]) {
  const next: Record<string, number> = {};

  if (memberIds.length === 0) return next;

  const equalValue = 100 / memberIds.length;
  let accumulated = 0;

  memberIds.forEach((id, index) => {
    if (index === memberIds.length - 1) {
      next[id] = Number((100 - accumulated).toFixed(2));
    } else {
      const rounded = Number(equalValue.toFixed(2));
      next[id] = rounded;
      accumulated += rounded;
    }
  });

  return next;
}

export function numberMapToInputMap(map: Record<string, number>) {
  const next: Record<string, string> = {};

  for (const [key, value] of Object.entries(map)) {
    next[key] = percentNumberToInput(value);
  }

  return next;
}

export function loadStoredSplitMode(groupId: string): GroupSplitMode {
  try {
    const raw = localStorage.getItem(splitModeStorageKey(groupId));

    if (raw === "MANUAL" || raw === "SALARY") {
      return raw;
    }

    return "SALARY";
  } catch {
    return "SALARY";
  }
}

export function saveStoredSplitMode(groupId: string, mode: GroupSplitMode) {
  localStorage.setItem(splitModeStorageKey(groupId), mode);
}

export function loadStoredSalaryBase(groupId: string, memberIds: string[]) {
  try {
    const key = salaryStorageKey(groupId);
    const raw = localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    const next: Record<string, number> = {};

    for (const id of memberIds) {
      const v = Number(parsed?.[id] ?? 0);
      next[id] = Number.isFinite(v) && v >= 0 ? v : 0;
    }

    return next;
  } catch {
    const next: Record<string, number> = {};

    for (const id of memberIds) {
      next[id] = 0;
    }

    return next;
  }
}

export function saveStoredSalaryBase(groupId: string, map: Record<string, number>) {
  const key = salaryStorageKey(groupId);
  localStorage.setItem(key, JSON.stringify(map));
}

export function loadStoredManualPercentBase(groupId: string, memberIds: string[]) {
  try {
    const raw = localStorage.getItem(manualPercentStorageKey(groupId));
    const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    const next: Record<string, number> = {};

    for (const id of memberIds) {
      const value = Number(parsed?.[id] ?? 0);
      next[id] = Number.isFinite(value) && value >= 0 ? value : 0;
    }

    const total = Object.values(next).reduce((acc, v) => acc + v, 0);

    if (total <= 0) {
      const defaults = buildDefaultManualPercentBase(memberIds);
      return numberMapToInputMap(defaults);
    }

    return numberMapToInputMap(next);
  } catch {
    const defaults = buildDefaultManualPercentBase(memberIds);
    return numberMapToInputMap(defaults);
  }
}

export function saveStoredManualPercentBase(groupId: string, map: Record<string, number>) {
  localStorage.setItem(manualPercentStorageKey(groupId), JSON.stringify(map));
}