import { useCallback, useEffect, useRef, useState } from "react"; // Hooks do React

type UseGroupsCreateTransitionParams = {
  closeModal: () => void; // Fecha o modal de criar grupo
  onAfterCreate?: () => void; // Callback opcional depois da criação
};

type UseGroupsCreateTransitionReturn = {
  isTransitionVisible: boolean; // Controla se a camada de transição está visível
  isCreatingWithTransition: boolean; // Evita duplo clique durante a animação
  startCreateTransition: (createAction: () => Promise<void>) => Promise<void>; // Inicia criação + animação
  finishCreateTransition: () => void; // Finaliza e limpa o estado
};

export default function useGroupsCreateTransition({
  closeModal,
  onAfterCreate,
}: UseGroupsCreateTransitionParams): UseGroupsCreateTransitionReturn {
  const [isTransitionVisible, setIsTransitionVisible] = useState(false); // Exibe a transição visual
  const [isCreatingWithTransition, setIsCreatingWithTransition] = useState(false); // Estado que bloqueia repetição

  const startAtRef = useRef<number | null>(null); // Guarda o momento em que a transição começou
  const timeoutRef = useRef<number | null>(null); // Guarda o timer ativo

  const ENTER_DELAY_MS = 120; // Pequena pausa para a UI começar a responder visualmente
  const MIN_VISIBLE_MS = 820; // Tempo mínimo da transição ficar visível
  const CLOSE_MODAL_DELAY_MS = 90; // Delay curto para o modal sair mais suave

  const clearTransitionTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const finishCreateTransition = useCallback(() => {
    clearTransitionTimer();
    startAtRef.current = null;
    setIsTransitionVisible(false);
    setIsCreatingWithTransition(false);
  }, [clearTransitionTimer]);

  const wait = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null;
        resolve();
      }, ms);
    });
  }, []);

  const startCreateTransition = useCallback(
    async (createAction: () => Promise<void>) => {
      if (isCreatingWithTransition) {
        return;
      }

      clearTransitionTimer();
      setIsCreatingWithTransition(true);
      setIsTransitionVisible(true);
      startAtRef.current = Date.now();

      try {
        // Dá um pequeno tempo para a interface reagir antes da criação pesada
        await wait(ENTER_DELAY_MS);

        // Executa a criação real
        await createAction();

        // Pequeno respiro para o modal sair de forma mais elegante
        await wait(CLOSE_MODAL_DELAY_MS);

        closeModal();

        // Garante que a transição fique visível por tempo mínimo
        const elapsed = startAtRef.current ? Date.now() - startAtRef.current : 0;
        const remaining = Math.max(MIN_VISIBLE_MS - elapsed, 0);

        if (remaining > 0) {
          await wait(remaining);
        }

        setIsTransitionVisible(false);
        setIsCreatingWithTransition(false);
        startAtRef.current = null;
        onAfterCreate?.();
      } catch (error) {
        finishCreateTransition();
        throw error;
      }
    },
    [
      ENTER_DELAY_MS,
      MIN_VISIBLE_MS,
      CLOSE_MODAL_DELAY_MS,
      clearTransitionTimer,
      closeModal,
      finishCreateTransition,
      isCreatingWithTransition,
      onAfterCreate,
      wait,
    ],
  );

  useEffect(() => {
    return () => {
      clearTransitionTimer();
    };
  }, [clearTransitionTimer]);

  return {
    isTransitionVisible,
    isCreatingWithTransition,
    startCreateTransition,
    finishCreateTransition,
  };
}

/*
=====================================================
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com
=====================================================

// O que foi melhorado neste hook:

// 1) A transição agora começa ANTES de finalizar toda a criação,
// deixando a resposta visual mais forte e mais "SaaS".

// 2) Foi adicionado um tempo mínimo de exibição da transição,
// evitando aquele efeito muito rápido ou seco demais.

// 3) O modal agora fecha com um pequeno atraso controlado,
// deixando a sensação visual mais suave.

// 4) Continua existindo proteção contra clique duplo,
// para impedir múltiplas criações ao mesmo tempo.

// 5) Foi adicionado cleanup no unmount,
// evitando timer solto na memória.

// 6) A assinatura do hook foi mantida igual,
// então não quebra o restante do fluxo atual.
*/