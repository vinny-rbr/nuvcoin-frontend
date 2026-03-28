import type { CSSProperties, ReactNode } from "react";

type GroupsHeaderActionModalShellProps = {
  title: string;
  selectedGroupName: string | null;
  onClose: () => void;
  modalOverlay: CSSProperties;
  modalCard: CSSProperties;
  modalHeader: CSSProperties;
  modalBody: CSSProperties;
  subtleText: CSSProperties;
  ghostButton: CSSProperties;
  children: ReactNode;
};

export default function GroupsHeaderActionModalShell({
  title,
  selectedGroupName,
  onClose,
  modalOverlay,
  modalCard,
  modalHeader,
  modalBody,
  subtleText,
  ghostButton,
  children,
}: GroupsHeaderActionModalShellProps) {
  return (
    <div
      style={{
        ...modalOverlay,
        zIndex: 1150,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...modalCard,
          width: "min(980px, 100%)",
          maxHeight: "88vh",
          overflow: "hidden",
          display: "grid",
          gridTemplateRows: "auto 1fr",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            ...modalHeader,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: -0.3 }}>{title}</div>
            <div style={{ ...subtleText, fontSize: 13 }}>{selectedGroupName} - acesso rapido pelo topo</div>
          </div>

          <button type="button" onClick={onClose} style={ghostButton}>
            Fechar
          </button>
        </div>

        <div
          style={{
            ...modalBody,
            overflowY: "auto",
            paddingTop: 18,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
