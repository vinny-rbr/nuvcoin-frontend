import { useEffect, useState, type CSSProperties, type KeyboardEvent } from "react";

type Props = {
  open: boolean;
  value: string;
  loading: boolean;
  error: string | null;
  success: string | null;
  onChange: (v: string) => void;
  onClose: () => void;
  onCreate: () => void;
};

export default function GroupsCreateModal({
  open,
  value,
  loading,
  error,
  success,
  onChange,
  onClose,
  onCreate,
}: Props) {
  const [visible, setVisible] = useState(false); // Controla animação de entrada

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setVisible(true);
    }, 20);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      // Fecha no ESC apenas se não estiver carregando
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, loading, onClose]);

  const handleCreate = () => {
    // Evita múltiplos cliques durante o loading
    if (loading) return;

    // Evita criar grupo com nome vazio
    if (!value.trim()) return;

    onCreate();
  };

  const handleOverlayClick = () => {
    // Não fecha enquanto estiver criando
    if (loading) return;

    onClose();
  };

  const handleKeyDownInput = (event: KeyboardEvent<HTMLInputElement>) => {
    // Enter cria grupo
    if (event.key === "Enter") {
      event.preventDefault();
      handleCreate();
    }
  };

  if (!open) return null;

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        ...overlay,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.25s ease",
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          ...modal,
          opacity: visible ? 1 : 0,
          transform: visible
            ? "translateY(0px) scale(1)"
            : "translateY(14px) scale(0.98)",
          transition: "opacity 0.28s ease, transform 0.28s ease",
        }}
      >
        {/* Header */}
        <div style={header}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>
            Criar novo grupo
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            style={{
              ...closeBtn,
              opacity: loading ? 0.45 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ display: "grid", gap: 12 }}>
          <div style={subText}>
            Dê um nome para seu grupo (ex: Casa, Viagem, Apê…)
          </div>

          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDownInput}
            placeholder="Nome do grupo"
            style={{
              ...input,
              border: error
                ? "1px solid rgba(255,107,107,0.55)"
                : "1px solid rgba(255,255,255,0.1)",
              opacity: loading ? 0.7 : 1,
            }}
            autoFocus
            disabled={loading}
          />

          {error && (
            <div style={{ color: "#ff6b6b", fontSize: 13 }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ color: "#4ade80", fontSize: 13 }}>
              {success}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={footer}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              ...cancelBtn,
              opacity: loading ? 0.45 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Cancelar
          </button>

          <button
            onClick={handleCreate}
            disabled={loading || !value.trim()}
            style={{
              ...primaryBtn,
              opacity: loading || !value.trim() ? 0.7 : 1,
              cursor: loading || !value.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <span style={loadingContent}>
                <span style={spinner} />
                Criando...
              </span>
            ) : (
              "Criar grupo"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   STYLES
========================= */

const overlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.55)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 999,
  padding: 12,
};

const modal: CSSProperties = {
  width: 420,
  maxWidth: "calc(100vw - 24px)",
  borderRadius: 20,
  padding: 20,
  background: "linear-gradient(180deg, #0f172a, #020617)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
  display: "grid",
  gap: 16,
};

const header: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const footer: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const subText: CSSProperties = {
  fontSize: 13,
  color: "#94a3b8",
};

const input: CSSProperties = {
  padding: 12,
  borderRadius: 12,
  background: "rgba(255,255,255,0.04)",
  color: "white",
  outline: "none",
};

const primaryBtn: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
  color: "white",
  fontWeight: 700,
  minWidth: 132,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const cancelBtn: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "transparent",
  color: "white",
};

const closeBtn: CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#94a3b8",
  fontSize: 18,
};

const loadingContent: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
};

const spinner: CSSProperties = {
  width: 14,
  height: 14,
  borderRadius: "50%",
  border: "2px solid rgba(255,255,255,0.35)",
  borderTop: "2px solid white",
  animation: "spin 0.8s linear infinite",
};

/*
=====================================================
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com
=====================================================

Mudanças feitas neste passo:

✔ Enter cria o grupo
✔ ESC fecha o modal
✔ Clique no fundo fecha o modal
✔ Clique dentro do card não fecha o modal
✔ Bloqueio de fechamento enquanto loading estiver ativo
✔ Botão de criar com spinner visual melhor
✔ Impede criação com nome vazio
✔ Input desabilitado durante criação

Observação:
✔ O style "animation: spin..." depende de keyframes globais
✔ Se não girar visualmente, no próximo passo eu ajusto isso no arquivo pai ou no estilo global
*/