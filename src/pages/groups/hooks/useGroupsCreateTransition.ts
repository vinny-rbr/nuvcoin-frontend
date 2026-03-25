import { useCallback, useRef, useState } from "react"; // Hooks do React

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
  const [isCreatingWithTransition, setIsCreatingWithTransition] = useState(false); // Estado de proteção contra repetição
  const timeoutRef = useRef<number | null>(null); // Guarda o timer para limpeza segura

  const clearTransitionTimer = useCallback(() => {
    // Limpa timer anterior se existir
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const finishCreateTransition = useCallback(() => {
    // Limpa qualquer timer pendente
    clearTransitionTimer();

    // Esconde a transição
    setIsTransitionVisible(false);

    // Libera o estado de loading/transição
    setIsCreatingWithTransition(false);
  }, [clearTransitionTimer]);

  const startCreateTransition = useCallback(
    async (createAction: () => Promise<void>) => {
      // Impede múltiplos cliques enquanto já estiver criando
      if (isCreatingWithTransition) {
        return;
      }

      // Marca início do fluxo
      setIsCreatingWithTransition(true);

      try {
        // Executa a criação real do grupo
        await createAction();

        // Fecha o modal primeiro
        closeModal();

        // Mostra a camada de transição visual
        setIsTransitionVisible(true);

        // Espera a animação acontecer antes de limpar
        timeoutRef.current = window.setTimeout(() => {
          // Esconde a transição após a animação
          setIsTransitionVisible(false);

          // Libera o estado
          setIsCreatingWithTransition(false);

          // Dispara callback opcional no final
          onAfterCreate?.();

          // Limpa a referência do timer
          timeoutRef.current = null;
        }, 900);
      } catch (error) {
        // Em caso de erro, garante limpeza do estado
        clearTransitionTimer();
        setIsTransitionVisible(false);
        setIsCreatingWithTransition(false);

        // Relança o erro para manter o fluxo atual do app
        throw error;
      }
    },
    [clearTransitionTimer, closeModal, isCreatingWithTransition, onAfterCreate],
  );

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

O que esse hook faz:

// Controla a lógica da transição de criação de grupo
// Fecha o modal depois que o grupo é criado com sucesso
// Exibe a camada visual da animação por alguns milissegundos
// Evita clique duplo no botão "Criar grupo"
// Mantém a lógica fora do Groups.tsx, como combinado
*/