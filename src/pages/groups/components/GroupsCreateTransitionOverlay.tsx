import type { CSSProperties } from "react";

type GroupsCreateTransitionOverlayProps = {
  isVisible: boolean;
  subtleText: CSSProperties;
};

export default function GroupsCreateTransitionOverlay({
  isVisible,
  subtleText,
}: GroupsCreateTransitionOverlayProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "rgba(2,6,23,0.14)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        opacity: 1,
        transition: "opacity 0.25s ease, background 0.25s ease, backdrop-filter 0.25s ease",
      }}
    >
      <div
        style={{
          minWidth: 280,
          maxWidth: 340,
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "linear-gradient(180deg, rgba(15,23,42,0.88) 0%, rgba(15,23,42,0.78) 100%)",
          boxShadow: "0 18px 52px rgba(0,0,0,0.26), 0 0 0 1px rgba(91,140,255,0.08)",
          padding: "24px 22px",
          display: "grid",
          gap: 16,
          justifyItems: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 72,
            height: 72,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "4px solid rgba(255,255,255,0.08)",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              borderTop: "4px solid #5b8cff",
              borderRight: "4px solid transparent",
              borderBottom: "4px solid transparent",
              borderLeft: "4px solid transparent",
              animation: "nuvcoin-groups-spin 0.9s linear infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 12,
              borderRadius: "50%",
              border: "3px solid rgba(91,140,255,0.14)",
              animation: "nuvcoin-groups-pulse 1.2s ease-in-out infinite",
            }}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              letterSpacing: -0.3,
            }}
          >
            Criando grupo
          </div>
          <div style={{ ...subtleText, fontSize: 13 }}>
            Organizando os dados e atualizando seu dashboard...
          </div>
        </div>

        <div
          style={{
            width: "100%",
            height: 6,
            borderRadius: 999,
            overflow: "hidden",
            background: "rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              width: "42%",
              height: "100%",
              borderRadius: 999,
              background: "linear-gradient(90deg, rgba(91,140,255,0.38) 0%, rgba(91,140,255,0.92) 100%)",
              animation: "nuvcoin-groups-bar 1s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}
