import { useCallback, useEffect, useRef, useState } from "react";

type CreateGroupFn = (name: string) => Promise<void>;

type Props = {
  createGroupRequest: CreateGroupFn; // função que chama a API
  reloadGroups: () => Promise<void>; // função pra recarregar lista
};

export function useGroupsCreateGroup({
  createGroupRequest,
  reloadGroups,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const closeTimeoutRef = useRef<number | null>(null);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const resetForm = useCallback(() => {
    setName("");
    setError(null);
    setSuccess(null);
  }, []);

  const open = useCallback(() => {
    clearCloseTimeout();
    setError(null);
    setSuccess(null);
    setIsOpen(true);
  }, [clearCloseTimeout]);

  const close = useCallback(() => {
    if (loading) return;

    clearCloseTimeout();
    setIsOpen(false);
    resetForm();
  }, [clearCloseTimeout, loading, resetForm]);

  const onChangeName = useCallback((value: string) => {
    setName(value);

    if (error) {
      setError(null);
    }

    if (success) {
      setSuccess(null);
    }
  }, [error, success]);

  const create = useCallback(async () => {
    if (loading) return;

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Informe um nome para o grupo");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await createGroupRequest(trimmedName);
      await reloadGroups();

      setSuccess("Grupo criado com sucesso");

      clearCloseTimeout();

      closeTimeoutRef.current = window.setTimeout(() => {
        setIsOpen(false);
        resetForm();
      }, 600);
    } catch {
      setError("Erro ao criar grupo");
    } finally {
      setLoading(false);
    }
  }, [
    clearCloseTimeout,
    createGroupRequest,
    loading,
    name,
    reloadGroups,
    resetForm,
  ]);

  useEffect(() => {
    return () => {
      clearCloseTimeout();
    };
  }, [clearCloseTimeout]);

  return {
    // state
    isOpen,
    name,
    loading,
    error,
    success,

    // actions
    setName: onChangeName,
    open,
    close,
    create,
  };
}

/*
=====================================================
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com
=====================================================

// O que foi ajustado neste hook:

// 1) Adicionado useCallback para deixar as funções mais estáveis
// e evitar recriações desnecessárias a cada render.

// 2) Adicionado useRef para controlar o setTimeout de fechamento,
// evitando timer solto na memória.

// 3) Criada função clearCloseTimeout para limpar qualquer timeout
// anterior antes de abrir/fechar/criar novamente.

// 4) Criada função resetForm para centralizar a limpeza do formulário,
// evitando repetição de código.

// 5) A validação agora usa name.trim() em uma variável própria,
// garantindo que não seja enviado nome com espaços vazios.

// 6) Ao digitar no input, o erro e o sucesso são limpos automaticamente,
// melhorando a experiência do usuário.

// 7) O modal continua fechando com pequeno delay após sucesso,
// mas agora de forma mais segura.

// 8) Adicionado cleanup no useEffect para limpar timeout ao desmontar
// o componente e evitar comportamento estranho.
*/