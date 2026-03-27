import { useState, type CSSProperties } from "react";

type GroupsHeaderQuickActionId =
  | "refresh"
  | "create"
  | "people"
  | "base"
  | "expense"
  | "summary"
  | "history";

export type GroupsHeaderQuickAction = {
  id: GroupsHeaderQuickActionId;
  icon: string;
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
};

type GroupsHeaderActionsProps = {
  actions: GroupsHeaderQuickAction[];
  pageHeroStyle: CSSProperties;
  pillStyle: CSSProperties;
  subtleText: CSSProperties;
};

export default function GroupsHeaderActions({
  actions,
  pageHeroStyle,
  pillStyle,
  subtleText,
}: GroupsHeaderActionsProps) {
  const [hoveredAction, setHoveredAction] = useState<GroupsHeaderQuickActionId | null>(null);
  const [pressedAction, setPressedAction] = useState<GroupsHeaderQuickActionId | null>(null);

  function getHeaderSquareStyle(action: GroupsHeaderQuickAction): CSSProperties {
    const isHovered = hoveredAction === action.id;
    const isPressed = pressedAction === action.id;
    const isDisabled = Boolean(action.disabled);
    const isCreateAction = action.id === "create";
    const border = isCreateAction
      ? "1px solid rgba(118,154,255,0.48)"
      : isHovered
        ? "1px solid rgba(255,255,255,0.18)"
        : "1px solid rgba(255,255,255,0.10)";
    const background = isCreateAction
      ? isHovered
        ? "linear-gradient(180deg, rgba(108,150,255,0.34) 0%, rgba(69,112,228,0.18) 56%, rgba(255,255,255,0.10) 100%)"
        : "linear-gradient(180deg, rgba(91,140,255,0.26) 0%, rgba(59,94,191,0.14) 58%, rgba(255,255,255,0.07) 100%)"
      : isHovered
        ? "linear-gradient(180deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.06) 58%, rgba(255,255,255,0.03) 100%)"
        : "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)";
    const boxShadow = isDisabled
      ? "0 8px 18px rgba(15,23,42,0.12)"
      : isPressed
        ? isCreateAction
          ? "inset 0 1px 0 rgba(255,255,255,0.16), 0 8px 18px rgba(37,61,122,0.28)"
          : "inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 18px rgba(15,23,42,0.20)"
        : isHovered
          ? isCreateAction
            ? "0 18px 38px rgba(46,78,166,0.34), 0 10px 20px rgba(15,23,42,0.22), inset 0 1px 0 rgba(255,255,255,0.18)"
            : "0 18px 34px rgba(15,23,42,0.26), 0 10px 20px rgba(15,23,42,0.16), inset 0 1px 0 rgba(255,255,255,0.12)"
          : isCreateAction
            ? "0 12px 28px rgba(46,78,166,0.22), 0 8px 18px rgba(15,23,42,0.16), inset 0 1px 0 rgba(255,255,255,0.14)"
            : "0 12px 24px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.08)";
    const transform = isDisabled
      ? "translateY(0) scale(1)"
      : isPressed
        ? "translateY(1px) scale(0.965)"
        : isHovered
          ? "translateY(-2px) scale(1.035)"
          : "translateY(0) scale(1)";

    return {
      position: "relative",
      width: 52,
      height: 52,
      padding: 0,
      borderRadius: 18,
      border,
      background,
      color: "#f8fafc",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontWeight: 900,
      fontSize: action.id === "expense" ? 16 : 20,
      letterSpacing: -0.3,
      boxShadow,
      transform,
      transition:
        "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), background 0.22s ease, border 0.22s ease, box-shadow 0.22s ease, opacity 0.22s ease, filter 0.22s ease",
      cursor: isDisabled ? "not-allowed" : "pointer",
      opacity: isDisabled ? 0.48 : 1,
      filter: isDisabled ? "saturate(0.7)" : "none",
      flexShrink: 0,
      overflow: "hidden",
      outline: "none",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
    };
  }

  function getActionOverlayStyle(action: GroupsHeaderQuickAction): CSSProperties {
    return {
      position: "absolute",
      inset: 1,
      borderRadius: 17,
      background:
        action.id === "create"
          ? "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 26%, rgba(255,255,255,0) 54%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 28%, rgba(255,255,255,0) 54%)",
      opacity: action.disabled ? 0.4 : 1,
      pointerEvents: "none",
    };
  }

  function getTooltipStyle(action: GroupsHeaderQuickAction): CSSProperties {
    const isHovered = hoveredAction === action.id;

    return {
      position: "absolute",
      top: "calc(100% + 12px)",
      left: "50%",
      transform: isHovered
        ? "translateX(-50%) translateY(0)"
        : "translateX(-50%) translateY(-6px)",
      padding: "10px 12px",
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.10)",
      background: "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.94) 100%)",
      boxShadow:
        "0 18px 36px rgba(2,6,23,0.34), 0 8px 18px rgba(2,6,23,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
      color: "#f8fafc",
      fontSize: 12,
      lineHeight: 1,
      fontWeight: 700,
      letterSpacing: -0.1,
      whiteSpace: "nowrap",
      zIndex: 20,
      pointerEvents: "none",
      opacity: isHovered ? 1 : 0,
      visibility: isHovered ? "visible" : "hidden",
      transition:
        "opacity 0.18s ease, transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), visibility 0.18s ease",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
    };
  }

  return (
    <div style={pageHeroStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: 8 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              ...pillStyle,
              width: "fit-content",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: "#5b8cff",
                display: "inline-block",
              }}
            />
            NUVCOIN Groups
          </div>

          <div style={{ display: "grid", gap: 4 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 30,
                lineHeight: 1.05,
                letterSpacing: -0.6,
              }}
            >
              Dashboard de grupos
            </h2>
            <div style={{ ...subtleText, fontSize: 13 }}>
              Crie grupos, adicione pessoas, defina salarios ou percentuais e acompanhe tudo com um visual mais de produto SaaS.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          {actions.map((action) => (
            <div
              key={action.id}
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onMouseEnter={() => setHoveredAction(action.id)}
              onMouseLeave={() =>
                setHoveredAction((current) => (current === action.id ? null : current))
              }
            >
              <button
                type="button"
                title={action.label}
                disabled={action.disabled}
                onClick={action.onClick}
                onMouseDown={() => {
                  if (!action.disabled) {
                    setPressedAction(action.id);
                  }
                }}
                onMouseUp={() =>
                  setPressedAction((current) => (current === action.id ? null : current))
                }
                onMouseLeave={() => {
                  setHoveredAction((current) => (current === action.id ? null : current));
                  setPressedAction((current) => (current === action.id ? null : current));
                }}
                onBlur={() =>
                  setPressedAction((current) => (current === action.id ? null : current))
                }
                style={getHeaderSquareStyle(action)}
              >
                <span aria-hidden="true" style={getActionOverlayStyle(action)} />
                <span
                  style={{
                    position: "relative",
                    zIndex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                    textShadow:
                      action.id === "create"
                        ? "0 1px 10px rgba(109,156,255,0.34)"
                        : "0 1px 8px rgba(15,23,42,0.16)",
                    animation: action.loading ? "nuvcoin-groups-spin 0.9s linear infinite" : "none",
                  }}
                >
                  {action.icon}
                </span>
              </button>

              <div style={getTooltipStyle(action)}>
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    top: -5,
                    left: "50%",
                    width: 10,
                    height: 10,
                    background: "rgba(15,23,42,0.96)",
                    borderTop: "1px solid rgba(255,255,255,0.10)",
                    borderLeft: "1px solid rgba(255,255,255,0.10)",
                    transform: "translateX(-50%) rotate(45deg)",
                  }}
                />
                <span style={{ position: "relative", zIndex: 1 }}>{action.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
