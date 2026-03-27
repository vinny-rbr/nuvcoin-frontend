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

  const finalTimeoutRef = useRef<number | null>(null); // Guarda apenas o timer final da transição
  const isMountedRef = useRef(true); // Evita setState após desmontar

  const ENTER_DELAY_MS = 120; // Pequena pausa para a UI começar a responder visualmente
  const MIN_VISIBLE_MS = 820; // Tempo mínimo da transição ficar visível
  const CLOSE_MODAL_DELAY_MS = 90; // Delay curto para o modal sair mais suave

  const clearFinalTimer = useCallback(() => {
    if (finalTimeoutRef.current !== null) {
      window.clearTimeout(finalTimeoutRef.current);
      finalTimeoutRef.current = null;
    }
  }, []);

  const sleep = useCallback((ms: number) => {
    return new Promise<void>((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }, []);

  const finishCreateTransition = useCallback(() => {
    clearFinalTimer();

    if (!isMountedRef.current) {
      return;
    }

    setIsTransitionVisible(false);
    setIsCreatingWithTransition(false);
  }, [clearFinalTimer]);

  const startCreateTransition = useCallback(
    async (createAction: () => Promise<void>) => {
      if (isCreatingWithTransition) {
        return;
      }

      clearFinalTimer();

      if (!isMountedRef.current) {
        return;
      }

      setIsCreatingWithTransition(true);
      setIsTransitionVisible(true);

      const startAt = Date.now(); // Marca o início real desta execução

      try {
        // Dá um pequeno tempo para a interface reagir antes da criação
        await sleep(ENTER_DELAY_MS);

        // Executa a criação real
        await createAction();

        // Pequeno respiro visual antes de fechar o modal
        await sleep(CLOSE_MODAL_DELAY_MS);

        closeModal();

        // Garante tempo mínimo da transição visível
        const elapsed = Date.now() - startAt;
        const remaining = Math.max(MIN_VISIBLE_MS - elapsed, 0);

        if (remaining > 0) {
          await new Promise<void>((resolve) => {
            finalTimeoutRef.current = window.setTimeout(() => {
              finalTimeoutRef.current = null;
              resolve();
            }, remaining);
          });
        }

        if (!isMountedRef.current) {
          return;
        }

        setIsTransitionVisible(false);
        setIsCreatingWithTransition(false);
        onAfterCreate?.();
      } catch (error) {
        if (isMountedRef.current) {
          setIsTransitionVisible(false);
          setIsCreatingWithTransition(false);
        }

        throw error;
      }
    },
    [
      CLOSE_MODAL_DELAY_MS,
      ENTER_DELAY_MS,
      MIN_VISIBLE_MS,
      clearFinalTimer,
      closeModal,
      isCreatingWithTransition,
      onAfterCreate,
      sleep,
    ],
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      clearFinalTimer();
    };
  }, [clearFinalTimer]);

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

// O que foi ajustado nesta versão:

// 1) Removido o conflito de múltiplos waits usando o mesmo timeoutRef,
// que podia causar comportamento estranho no fluxo da animação.

// 2) Agora apenas o timer final da transição fica controlado por ref,
// deixando o fluxo mais previsível e estável.

// 3) A medição do tempo da animação agora usa uma variável local (startAt),
// evitando inconsistência entre execuções.

// 4) Foi adicionada proteção com isMountedRef,
// evitando setState depois do componente desmontar.

// 5) O fechamento do modal continua suave,
// mas agora acontece em um timing mais seguro.

// 6) A assinatura do hook foi mantida igual,
// sem quebrar a integração com o Groups.tsx.
*/