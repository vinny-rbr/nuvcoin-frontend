import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mobileMenuPosition, setMobileMenuPosition] = useState({
    top: 0,
    right: 16,
    width: 320,
  });
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;

    return window.innerWidth < 768;
  });
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement | null>(null);

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

  useEffect(() => {
    if (!isMobile) {
      setIsMenuOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile || !isMenuOpen) {
      document.body.style.overflow = "";
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!mobileMenuRef.current) return;
      if (mobileMenuRef.current.contains(event.target as Node)) return;
      if (hamburgerButtonRef.current?.contains(event.target as Node)) return;

      setIsMenuOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  useLayoutEffect(() => {
    if (!isMobile || !isMenuOpen || !hamburgerButtonRef.current || typeof window === "undefined") {
      return undefined;
    }

    function updateMobileMenuPosition() {
      if (!hamburgerButtonRef.current) return;

      const rect = hamburgerButtonRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const width = Math.min(320, viewportWidth - 32);
      const right = Math.max(16, viewportWidth - rect.right);
      const top = rect.bottom + 14;

      setMobileMenuPosition({
        top,
        right,
        width,
      });
    }

    updateMobileMenuPosition();
    window.addEventListener("resize", updateMobileMenuPosition);
    window.addEventListener("scroll", updateMobileMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMobileMenuPosition);
      window.removeEventListener("scroll", updateMobileMenuPosition, true);
    };
  }, [isMobile, isMenuOpen]);

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

  function getHamburgerButtonStyle(): CSSProperties {
    return {
      position: "relative",
      width: 52,
      height: 52,
      padding: 0,
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.12)",
      background: "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.03) 100%)",
      color: "#f8fafc",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: isMenuOpen
        ? "0 18px 38px rgba(15,23,42,0.26), 0 10px 20px rgba(15,23,42,0.16), inset 0 1px 0 rgba(255,255,255,0.12)"
        : "0 12px 24px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
      transform: isMenuOpen ? "translateY(-1px) scale(1.02)" : "translateY(0) scale(1)",
      transition:
        "transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), background 0.22s ease, border 0.22s ease, box-shadow 0.22s ease",
      cursor: "pointer",
      overflow: "hidden",
      outline: "none",
      flexShrink: 0,
      zIndex: 61,
    };
  }

  function getHamburgerLineStyle(index: number): CSSProperties {
    return {
      width: 18,
      height: 2,
      borderRadius: 999,
      background: "#f8fafc",
      transform:
        isMenuOpen && index === 0
          ? "translateY(6px) rotate(45deg)"
          : isMenuOpen && index === 1
            ? "scaleX(0)"
            : isMenuOpen && index === 2
              ? "translateY(-6px) rotate(-45deg)"
              : "none",
      opacity: isMenuOpen && index === 1 ? 0 : 1,
      transition: "transform 0.24s ease, opacity 0.18s ease",
      transformOrigin: "center",
    };
  }

  function getMobileMenuStyle(): CSSProperties {
    return {
      position: "fixed",
      top: mobileMenuPosition.top,
      right: mobileMenuPosition.right,
      width: mobileMenuPosition.width,
      maxWidth: "calc(100vw - 32px)",
      padding: 12,
      borderRadius: 22,
      border: "1px solid rgba(255,255,255,0.12)",
      background: "#0f172a",
      boxShadow:
        "0 28px 80px rgba(2,6,23,0.55), 0 14px 28px rgba(2,6,23,0.22), inset 0 1px 0 rgba(255,255,255,0.06)",
      display: "grid",
      gap: 8,
      opacity: isMenuOpen ? 1 : 0,
      transform: isMenuOpen ? "translateY(0) scale(1)" : "translateY(-10px) scale(0.98)",
      transformOrigin: "top right",
      pointerEvents: isMenuOpen ? "auto" : "none",
      transition:
        "opacity 0.2s ease, transform 0.24s cubic-bezier(0.22, 1, 0.36, 1), visibility 0.2s ease",
      visibility: isMenuOpen ? "visible" : "hidden",
      zIndex: 81,
      overflow: "hidden",
    };
  }

  function getMobileOverlayStyle(): CSSProperties {
    return {
      position: "fixed",
      inset: 0,
      background: "rgba(2, 6, 23, 0.55)",
      backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      opacity: isMenuOpen ? 1 : 0,
      pointerEvents: isMenuOpen ? "auto" : "none",
      transition: "opacity 0.2s ease",
      zIndex: 80,
    };
  }

  function getMobileMenuItemStyle(action: GroupsHeaderQuickAction): CSSProperties {
    const isDisabled = Boolean(action.disabled);
    const isCreateAction = action.id === "create";

    return {
      width: "100%",
      borderRadius: 16,
      border: isCreateAction
        ? "1px solid rgba(118,154,255,0.34)"
        : "1px solid rgba(255,255,255,0.08)",
      background: isCreateAction ? "#3157c7" : "#172033",
      color: "#f8fafc",
      padding: "12px 14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      fontSize: 14,
      fontWeight: 800,
      letterSpacing: -0.2,
      cursor: isDisabled ? "not-allowed" : "pointer",
      opacity: isDisabled ? 0.48 : 1,
      boxShadow: "none",
      transition: "transform 0.2s ease, border 0.2s ease, background 0.2s ease, opacity 0.2s ease",
      outline: "none",
    };
  }

  function handleActionClick(action: GroupsHeaderQuickAction) {
    if (action.disabled) return;

    action.onClick();
    setIsMenuOpen(false);
  }

  function handleOverlayClick() {
    setIsMenuOpen(false);
  }

  function renderDesktopAction(action: GroupsHeaderQuickAction) {
    return (
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
    );
  }

  function renderMobileAction(action: GroupsHeaderQuickAction) {
    return (
      <button
        key={action.id}
        type="button"
        disabled={action.disabled}
        onClick={() => handleActionClick(action)}
        style={getMobileMenuItemStyle(action)}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            minWidth: 0,
          }}
        >
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.10)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: action.id === "expense" ? 15 : 18,
              flexShrink: 0,
              animation: action.loading ? "nuvcoin-groups-spin 0.9s linear infinite" : "none",
            }}
          >
            {action.icon}
          </span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {action.label}
          </span>
        </span>

        <span
          style={{
            fontSize: 12,
            color: action.disabled ? "rgba(248,250,252,0.48)" : "rgba(248,250,252,0.72)",
            flexShrink: 0,
          }}
        >
          {action.loading ? "Carregando..." : "Abrir"}
        </span>
      </button>
    );
  }

  function handleHamburgerClick(event: ReactMouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    setIsMenuOpen((current) => !current);
  }

  return (
    <>
      <div
        style={{
          ...pageHeroStyle,
          position: "relative",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "flex-start",
          flexDirection: isMobile ? "column" : "row",
          gap: 16,
          flexWrap: isMobile ? "nowrap" : "wrap",
          position: "relative",
          zIndex: 60,
          width: "100%",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 8,
            width: "100%",
            minWidth: 0,
          }}
        >
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
                fontSize: isMobile ? 26 : 30,
                lineHeight: 1.05,
                letterSpacing: -0.6,
              }}
            >
              Dashboard de grupos
            </h2>
            <div
              style={{
                ...subtleText,
                fontSize: 13,
              }}
            >
              Crie grupos, adicione pessoas, defina salarios ou percentuais e acompanhe tudo com um visual mais de produto SaaS.
            </div>
          </div>
        </div>

        {isMobile ? (
          <div
            style={{
              position: "relative",
              display: "flex",
              justifyContent: "flex-end",
              width: "100%",
              minWidth: 0,
              alignSelf: "stretch",
              zIndex: 61,
            }}
          >
            <button
              type="button"
              aria-label={isMenuOpen ? "Fechar menu de acoes" : "Abrir menu de acoes"}
              aria-expanded={isMenuOpen}
              onClick={handleHamburgerClick}
              ref={hamburgerButtonRef}
              style={getHamburgerButtonStyle()}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "grid",
                  gap: 4,
                }}
              >
                <span style={getHamburgerLineStyle(0)} />
                <span style={getHamburgerLineStyle(1)} />
                <span style={getHamburgerLineStyle(2)} />
              </span>
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "flex-end",
            }}
          >
            {actions.map(renderDesktopAction)}
          </div>
        )}
      </div>
      </div>

      {isMobile && typeof document !== "undefined"
        ? createPortal(
            <>
              <div
                aria-hidden="true"
                onClick={handleOverlayClick}
                style={getMobileOverlayStyle()}
              />
              <div ref={mobileMenuRef} style={getMobileMenuStyle()}>
                {actions.map(renderMobileAction)}
              </div>
            </>,
            document.body
          )
        : null}
    </>
  );
}
