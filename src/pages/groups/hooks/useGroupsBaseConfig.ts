import { useEffect, useMemo, useState } from "react"; // Hooks do React

import type { GroupSplitMode } from "../types/groups.types"; // Tipo do modo de divisão

import {
  buildDefaultManualPercentBase,
  loadStoredManualPercentBase,
  loadStoredSalaryBase,
  loadStoredSplitMode,
  numberMapToInputMap,
  saveStoredManualPercentBase,
  saveStoredSalaryBase,
  saveStoredSplitMode,
} from "../utils/groups.storage"; // Helpers de persistência local

import {
  normalizePercentInputText,
  percentNumberToInput,
  percentTextToNumber,
} from "../utils/groups.helpers"; // Helpers de normalização e conversão

type UseGroupsBaseConfigParams = {
  selectedGroupId: string | null; // Id do grupo selecionado
  balances: {
    members?: Array<{
      userId: string; // Id do usuário no grupo
    }>;
  } | null; // Balances do grupo atual
}; // Parâmetros do hook

export default function useGroupsBaseConfig({
  selectedGroupId,
  balances,
}: UseGroupsBaseConfigParams) {
  const [salaryError, setSalaryError] = useState<string | null>(null); // Erro do modal da base
  const [salarySuccess, setSalarySuccess] = useState<string | null>(null); // Sucesso do modal da base
  const [splitMode, setSplitMode] = useState<GroupSplitMode>("SALARY"); // Modo atual de divisão
  const [manualPercentInputByUserId, setManualPercentInputByUserId] = useState<Record<string, string>>({}); // Inputs manuais por usuário
  const [salaryByUserId, setSalaryByUserId] = useState<Record<string, number>>({}); // Salários por usuário

  const memberIds = useMemo(() => {
    return (balances?.members ?? []).map((member) => member.userId); // Extrai ids dos membros do grupo atual
  }, [balances]); // Recalcula quando balances mudar

  function getManualPercentNumberMap(ids: string[]) {
    const next: Record<string, number> = {}; // Mapa final numérico

    for (const id of ids) {
      next[id] = percentTextToNumber(manualPercentInputByUserId[id] ?? "0"); // Converte cada input textual para número
    }

    return next; // Retorna mapa convertido
  }

  function loadSplitMode(groupId: string) {
    const mode = loadStoredSplitMode(groupId); // Lê modo salvo do storage
    setSplitMode(mode); // Atualiza estado local
  }

  function saveSplitMode(groupId: string, mode: GroupSplitMode) {
    saveStoredSplitMode(groupId, mode); // Persiste modo no storage
  }

  function loadManualPercentBase(groupId: string, ids: string[]) {
    const inputMap = loadStoredManualPercentBase(groupId, ids); // Lê percentuais manuais salvos
    setManualPercentInputByUserId(inputMap); // Atualiza inputs do estado
  }

  function saveManualPercentBase(groupId: string, map: Record<string, number>) {
    saveStoredManualPercentBase(groupId, map); // Persiste percentuais manuais
  }

  function loadSalaryBase(groupId: string, ids: string[]) {
    const next = loadStoredSalaryBase(groupId, ids); // Lê salários salvos
    setSalaryByUserId(next); // Atualiza estado local
  }

  function saveSalaryBase(groupId: string, map: Record<string, number>) {
    saveStoredSalaryBase(groupId, map); // Persiste salários
  }

  function clearBaseFeedback() {
    setSalaryError(null); // Limpa erro da base
    setSalarySuccess(null); // Limpa sucesso da base
  }

  function onSplitModeChange(mode: GroupSplitMode) {
    setSplitMode(mode); // Atualiza modo selecionado
  }

  function onSalaryChange(userId: string, value: string) {
    const raw = (value ?? "").replace(/\./g, "").replace(",", "."); // Normaliza entrada BR para número JS
    const num = Number(raw); // Converte para número

    setSalaryByUserId((prev) => ({
      ...prev,
      [userId]: Number.isFinite(num) && num >= 0 ? num : 0, // Mantém apenas número válido e não negativo
    })); // Atualiza salário do usuário

    clearBaseFeedback(); // Limpa mensagens antigas ao editar
  }

  function onSalaryBlur(userId: string) {
    const value = Number(salaryByUserId[userId] ?? 0) || 0; // Garante valor final numérico

    setSalaryByUserId((prev) => ({
      ...prev,
      [userId]: value, // Regrava valor já normalizado
    })); // Atualiza estado final

    clearBaseFeedback(); // Limpa mensagens antigas
  }

  function onManualPercentChange(userId: string, value: string) {
    const raw = normalizePercentInputText(value); // Normaliza texto digitado no percentual

    setManualPercentInputByUserId((prev) => ({
      ...prev,
      [userId]: raw, // Atualiza input do usuário
    })); // Salva no estado

    clearBaseFeedback(); // Limpa mensagens antigas ao editar
  }

  function onManualPercentBlur(userId: string) {
    const parsed = percentTextToNumber(manualPercentInputByUserId[userId] ?? "0"); // Converte input para número

    setManualPercentInputByUserId((prev) => ({
      ...prev,
      [userId]: percentNumberToInput(parsed), // Regrava no formato padrão visual
    })); // Atualiza input formatado

    clearBaseFeedback(); // Limpa mensagens antigas
  }

  function onResetSalaries() {
    const next: Record<string, number> = {}; // Objeto para zerar salários

    for (const userId of memberIds) {
      next[userId] = 0; // Zera salário de cada membro
    }

    setSalaryByUserId(next); // Atualiza salários zerados
    clearBaseFeedback(); // Limpa mensagens
  }

  function onSplitEqual() {
    const defaults = buildDefaultManualPercentBase(memberIds); // Gera divisão igual entre todos
    setManualPercentInputByUserId(numberMapToInputMap(defaults)); // Atualiza inputs formatados
    clearBaseFeedback(); // Limpa mensagens
  }

  function onSave(onSuccess?: () => void) {
    try {
      clearBaseFeedback(); // Limpa feedback anterior

      if (!selectedGroupId) {
        setSalaryError("Selecione um grupo."); // Valida grupo
        return; // Interrompe fluxo
      }

      if (splitMode === "SALARY") {
        const total = memberIds.reduce((acc, userId) => {
          return acc + (Number(salaryByUserId[userId] ?? 0) || 0); // Soma salários válidos
        }, 0); // Total de salários

        if (total <= 0) {
          setSalaryError("Informe pelo menos um salário maior que 0."); // Valida base salarial mínima
          return; // Interrompe fluxo
        }

        saveSalaryBase(selectedGroupId, salaryByUserId); // Salva salários
        saveSplitMode(selectedGroupId, "SALARY"); // Salva modo
        setSalarySuccess("Base salarial salva."); // Feedback positivo
        onSuccess?.(); // Executa callback externo
        return; // Finaliza fluxo salary
      }

      const currentManualMap = getManualPercentNumberMap(memberIds); // Lê mapa manual atual
      const currentTotal = Object.values(currentManualMap).reduce((acc, value) => acc + value, 0); // Soma percentuais

      if (currentTotal <= 0 || Math.abs(currentTotal - 100) >= 0.01) {
        setSalaryError("No modo manual, a soma dos percentuais precisa fechar 100%."); // Validação do modo manual
        return; // Interrompe fluxo
      }

      saveManualPercentBase(selectedGroupId, currentManualMap); // Salva base manual
      saveSplitMode(selectedGroupId, "MANUAL"); // Salva modo manual
      setManualPercentInputByUserId(numberMapToInputMap(currentManualMap)); // Regrava valores já formatados
      setSalarySuccess("Base manual salva."); // Feedback positivo
      onSuccess?.(); // Executa callback externo
    } catch {
      setSalaryError("Não foi possível salvar a base do grupo."); // Erro amigável
    }
  }

  useEffect(() => {
    if (!selectedGroupId) return; // Sai se não houver grupo selecionado
    if (memberIds.length === 0) return; // Sai se não houver membros

    loadSalaryBase(selectedGroupId, memberIds); // Carrega salários do grupo
    loadManualPercentBase(selectedGroupId, memberIds); // Carrega base manual do grupo
    loadSplitMode(selectedGroupId); // Carrega modo salvo
  }, [selectedGroupId, memberIds.length]); // Recarrega ao trocar grupo ou quantidade de membros

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
  }; // Retorna tudo que o Groups.tsx e o modal precisam
}

// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com
//
// Hook criado nesta etapa:
// - ✅ extrai toda a lógica de base salarial e percentual manual
// - ✅ centraliza load/save no localStorage
// - ✅ centraliza validação do modo SALARY e MANUAL
// - ✅ centraliza handlers do modal da base
// - ✅ deixa o Groups.tsx mais limpo e focado em UI