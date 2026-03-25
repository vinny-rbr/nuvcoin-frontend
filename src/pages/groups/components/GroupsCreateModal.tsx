import { useEffect, useState, type CSSProperties } from "react";

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

  if (!open) return null;

  return (
    <div
      style={{
        ...overlay,
        opacity: visible ? 1 : 0,
        transition: "opacity 0.25s ease",
      }}
    >
      <div
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

          <button onClick={onClose} style={closeBtn}>
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
            placeholder="Nome do grupo"
            style={input}
            autoFocus
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
          <button onClick={onClose} style={cancelBtn}>
            Cancelar
          </button>

          <button
            onClick={onCreate}
            disabled={loading}
            style={{
              ...primaryBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Criando..." : "Criar grupo"}
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
  border: "1px solid rgba(255,255,255,0.1)",
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
};

const cancelBtn: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.15)",
  background: "transparent",
  color: "white",
  cursor: "pointer",
};

const closeBtn: CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#94a3b8",
  cursor: "pointer",
  fontSize: 18,
};

/*
=====================================================
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com
=====================================================

Mudança feita:

✔ Adicionada animação de entrada no modal
✔ Fade no overlay
✔ Fade + slide + scale no card
✔ AutoFocus no input
✔ Sem mexer no Groups.tsx
*/