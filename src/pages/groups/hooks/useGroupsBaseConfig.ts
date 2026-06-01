import { useEffect, useMemo, useState } from "react";

import { updateGroupMemberSalaries } from "../services/groups.api";
import type { GroupMembersResponse, GroupSplitMode } from "../types/groups.types";
import {
  buildDefaultManualPercentBase,
  loadStoredManualPercentBase,
  loadStoredSalaryBase,
  loadStoredSplitMode,
  numberMapToInputMap,
  saveStoredManualPercentBase,
  saveStoredSalaryBase,
  saveStoredSplitMode,
} from "../utils/groups.storage";
import {
  normalizePercentInputText,
  percentNumberToInput,
  percentTextToNumber,
} from "../utils/groups.helpers";

type UseGroupsBaseConfigParams = {
  selectedGroupId: string | null;
  balances: {
    members?: Array<{
      userId: string;
    }>;
  } | null;
  membersInfo?: GroupMembersResponse | null;
  onAfterSave?: () => Promise<void> | void;
};

export default function useGroupsBaseConfig({
  selectedGroupId,
  balances,
  membersInfo,
  onAfterSave,
}: UseGroupsBaseConfigParams) {
  const [salaryError, setSalaryError] = useState<string | null>(null);
  const [salarySuccess, setSalarySuccess] = useState<string | null>(null);
  const [splitMode, setSplitMode] = useState<GroupSplitMode>("SALARY");
  const [manualPercentInputByUserId, setManualPercentInputByUserId] = useState<Record<string, string>>({});
  const [salaryByUserId, setSalaryByUserId] = useState<Record<string, number>>({});

  const memberIds = useMemo(() => {
    const idsFromMembers = (membersInfo?.members ?? []).map((member) => member.userId);
    if (idsFromMembers.length > 0) return idsFromMembers;

    return (balances?.members ?? []).map((member) => member.userId);
  }, [balances, membersInfo]);

  function getManualPercentNumberMap(ids: string[]) {
    const next: Record<string, number> = {};

    for (const id of ids) {
      next[id] = percentTextToNumber(manualPercentInputByUserId[id] ?? "0");
    }

    return next;
  }

  function loadSplitMode(groupId: string) {
    setSplitMode(loadStoredSplitMode(groupId));
  }

  function saveSplitMode(groupId: string, mode: GroupSplitMode) {
    saveStoredSplitMode(groupId, mode);
  }

  function loadManualPercentBase(groupId: string, ids: string[]) {
    setManualPercentInputByUserId(loadStoredManualPercentBase(groupId, ids));
  }

  function saveManualPercentBase(groupId: string, map: Record<string, number>) {
    saveStoredManualPercentBase(groupId, map);
  }

  function loadSalaryBase(groupId: string, ids: string[]) {
    const stored = loadStoredSalaryBase(groupId, ids);
    const membersById = new Map((membersInfo?.members ?? []).map((member) => [member.userId, member]));
    const next: Record<string, number> = {};

    for (const id of ids) {
      const salaryCents = Number(membersById.get(id)?.salaryCents ?? 0);
      next[id] = salaryCents > 0 ? salaryCents / 100 : stored[id] ?? 0;
    }

    setSalaryByUserId(next);
  }

  function saveSalaryBase(groupId: string, map: Record<string, number>) {
    saveStoredSalaryBase(groupId, map);
  }

  function clearBaseFeedback() {
    setSalaryError(null);
    setSalarySuccess(null);
  }

  function onSplitModeChange(mode: GroupSplitMode) {
    setSplitMode(mode);
  }

  function onSalaryChange(userId: string, value: string) {
    const raw = (value ?? "").replace(/\./g, "").replace(",", ".");
    const num = Number(raw);

    setSalaryByUserId((prev) => ({
      ...prev,
      [userId]: Number.isFinite(num) && num >= 0 ? num : 0,
    }));

    clearBaseFeedback();
  }

  function onSalaryBlur(userId: string) {
    const value = Number(salaryByUserId[userId] ?? 0) || 0;

    setSalaryByUserId((prev) => ({
      ...prev,
      [userId]: value,
    }));

    clearBaseFeedback();
  }

  function onManualPercentChange(userId: string, value: string) {
    setManualPercentInputByUserId((prev) => ({
      ...prev,
      [userId]: normalizePercentInputText(value),
    }));

    clearBaseFeedback();
  }

  function onManualPercentBlur(userId: string) {
    const parsed = percentTextToNumber(manualPercentInputByUserId[userId] ?? "0");

    setManualPercentInputByUserId((prev) => ({
      ...prev,
      [userId]: percentNumberToInput(parsed),
    }));

    clearBaseFeedback();
  }

  function onResetSalaries() {
    const next: Record<string, number> = {};

    for (const userId of memberIds) {
      next[userId] = 0;
    }

    setSalaryByUserId(next);
    clearBaseFeedback();
  }

  function onSplitEqual() {
    const defaults = buildDefaultManualPercentBase(memberIds);
    setManualPercentInputByUserId(numberMapToInputMap(defaults));
    clearBaseFeedback();
  }

  async function onSave(onSuccess?: () => void) {
    try {
      clearBaseFeedback();

      if (!selectedGroupId) {
        setSalaryError("Selecione um grupo.");
        return;
      }

      if (splitMode === "SALARY") {
        const total = memberIds.reduce((acc, userId) => {
          return acc + (Number(salaryByUserId[userId] ?? 0) || 0);
        }, 0);

        if (total <= 0) {
          setSalaryError("Informe pelo menos um salario maior que 0.");
          return;
        }

        const salaries = memberIds.map((userId) => ({
          userId,
          salaryCents: Math.round((Number(salaryByUserId[userId] ?? 0) || 0) * 100),
        }));

        await updateGroupMemberSalaries(selectedGroupId, { salaries });
        saveSalaryBase(selectedGroupId, salaryByUserId);
        saveSplitMode(selectedGroupId, "SALARY");
        await onAfterSave?.();
        setSalarySuccess("Base salarial salva.");
        onSuccess?.();
        return;
      }

      const currentManualMap = getManualPercentNumberMap(memberIds);
      const currentTotal = Object.values(currentManualMap).reduce((acc, value) => acc + value, 0);

      if (currentTotal <= 0 || Math.abs(currentTotal - 100) >= 0.01) {
        setSalaryError("No modo manual, a soma dos percentuais precisa fechar 100%.");
        return;
      }

      saveManualPercentBase(selectedGroupId, currentManualMap);
      saveSplitMode(selectedGroupId, "MANUAL");
      setManualPercentInputByUserId(numberMapToInputMap(currentManualMap));
      setSalarySuccess("Base manual salva.");
      onSuccess?.();
    } catch {
      setSalaryError("Nao foi possivel salvar a base do grupo.");
    }
  }

  useEffect(() => {
    if (!selectedGroupId) return;
    if (memberIds.length === 0) return;

    loadSalaryBase(selectedGroupId, memberIds);
    loadManualPercentBase(selectedGroupId, memberIds);
    loadSplitMode(selectedGroupId);
  }, [selectedGroupId, memberIds.length, membersInfo]);

  return {
    salaryError,
    salarySuccess,
    splitMode,
    manualPercentInputByUserId,
    salaryByUserId,
    setSalaryError,
    setSalarySuccess,
    setSplitMode,
    setManualPercentInputByUserId,
    setSalaryByUserId,
    clearBaseFeedback,
    onSplitModeChange,
    onSalaryChange,
    onSalaryBlur,
    onManualPercentChange,
    onManualPercentBlur,
    onResetSalaries,
    onSplitEqual,
    onSave,
  };
}
