import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

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
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 767px)");

    function handleMediaChange(event: MediaQueryListEvent) {
      setIsMobile(event.matches);
    }

    setIsMobile(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleMediaChange);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  return (
    <div
      style={{
        ...modalOverlay,
        zIndex: 1150,
        padding: isMobile ? 10 : 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...modalCard,
          width: "min(980px, 100%)",
          maxHeight: isMobile ? "92vh" : "88vh",
          borderRadius: isMobile ? 18 : modalCard.borderRadius,
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
            flexWrap: isMobile ? "wrap" : "nowrap",
            gap: 12,
            padding: isMobile ? 14 : modalHeader.padding,
          }}
        >
          <div style={{ display: "grid", gap: 4, minWidth: 0, flex: "1 1 220px" }}>
            <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 900, letterSpacing: -0.3 }}>{title}</div>
            <div style={{ ...subtleText, fontSize: 13 }}>{selectedGroupName} - acesso rapido pelo topo</div>
          </div>

          <button type="button" onClick={onClose} style={{ ...ghostButton, flexShrink: 0 }}>
            Fechar
          </button>
        </div>

        <div
          style={{
            ...modalBody,
            overflowY: "auto",
            padding: isMobile ? 14 : modalBody.padding,
            paddingTop: isMobile ? 14 : 18,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
