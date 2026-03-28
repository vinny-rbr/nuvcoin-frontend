import { useEffect } from "react";
import type { CSSProperties } from "react";

type GroupsDeleteGroupModalProps = {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  modalOverlay: CSSProperties;
  modalCard: CSSProperties;
  modalHeader: CSSProperties;
  modalBody: CSSProperties;
  subtleText: CSSProperties;
  softButton: CSSProperties;
  dangerButtonSmall: CSSProperties;
};

export default function GroupsDeleteGroupModal({
  open,
  loading,
  onClose,
  onConfirm,
  modalOverlay,
  modalCard,
  modalHeader,
  modalBody,
  subtleText,
  softButton,
  dangerButtonSmall,
}: GroupsDeleteGroupModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div
      style={modalOverlay}
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div
        style={{
          ...modalCard,
          width: "min(520px, 96vw)",
        }}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div style={modalHeader}>
          <div style={{ display: "grid", gap: 2 }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>Excluir grupo?</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              ...softButton,
              opacity: loading ? 0.55 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            Fechar
          </button>
        </div>

        <div style={modalBody}>
          <div style={{ ...subtleText, fontSize: 14, lineHeight: 1.6 }}>
            <div>Tem certeza que deseja excluir este grupo?</div>
            <div>
              Ao confirmar, o grupo será arquivado e você poderá perder o acesso às
              informações vinculadas a ele.
            </div>
            <div>Essa ação deve ser usada com cuidado.</div>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 16,
              border: "1px solid rgba(255,120,120,0.22)",
              background: "rgba(255,0,0,0.06)",
              color: "#ffd0d0",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            Excluir o grupo pode remover seu acesso e causar perda de dados ou histórico
            visível no app.
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                ...softButton,
                opacity: loading ? 0.55 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              style={{
                ...dangerButtonSmall,
                minWidth: 138,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Excluindo..." : "Excluir grupo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
