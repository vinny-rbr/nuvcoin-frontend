import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import type { GroupDto } from "../types/groups.types";
import { getInitials } from "../utils/groups.helpers";

type GroupsGroupsLaneProps = {
  groups: GroupDto[];
  selectedGroupId: string | null;
  highlightGroupId: string | null;
  isGroupsLaneAnimating: boolean;
  onSelectGroup: (group: GroupDto) => void;
  sectionCard: CSSProperties;
  panelTitle: CSSProperties;
  subtleText: CSSProperties;
  memberAvatarStyle: CSSProperties;
};

export default function GroupsGroupsLane({
  groups,
  selectedGroupId,
  highlightGroupId,
  isGroupsLaneAnimating,
  onSelectGroup,
  sectionCard,
  panelTitle,
  subtleText,
  memberAvatarStyle,
}: GroupsGroupsLaneProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return undefined;

    function handlePointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const selectedGroup = useMemo(() => {
    return groups.find((group) => group.id === selectedGroupId) ?? groups[0] ?? null;
  }, [groups, selectedGroupId]);

  if (groups.length === 0 || !selectedGroup) {
    return null;
  }

  return (
    <div
      ref={ref}
      style={{
        ...sectionCard,
        padding: 16,
        position: "relative",
        border: "1px solid rgba(96,165,250,0.16)",
        background:
          "radial-gradient(circle at 0% 0%, rgba(91,140,255,0.12), rgba(91,140,255,0) 34%), linear-gradient(180deg, rgba(30,41,59,0.76), rgba(15,23,42,0.64))",
        animation: isGroupsLaneAnimating ? "conciliaai-groups-lane-reflow 0.62s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
      }}
    >
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
            <div style={{ ...panelTitle, fontSize: 16 }}>Meus grupos</div>
            <div style={subtleText}>{groups.length} grupo(s) disponivel(is)</div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              border: "1px solid rgba(148,163,184,0.16)",
              background: isOpen ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.035)",
              color: "inherit",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              fontWeight: 900,
              fontSize: 18,
            }}
          >
            {isOpen ? "x" : "v"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          style={{
            cursor: "pointer",
            textAlign: "left",
            padding: 12,
            borderRadius: 18,
            border: "1px solid rgba(96,165,250,0.28)",
            background:
              "linear-gradient(110deg, rgba(59,130,246,0.24), rgba(30,41,59,0.72), rgba(96,165,250,0.12))",
            color: "inherit",
            boxShadow: "0 16px 34px rgba(37,99,235,0.18), inset 0 1px 0 rgba(255,255,255,0.05)",
            minWidth: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div
              style={{
                ...memberAvatarStyle,
                width: 46,
                height: 46,
                borderRadius: 16,
              }}
            >
              {getInitials(selectedGroup.name)}
            </div>

            <div style={{ display: "grid", gap: 2, minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: 900,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {selectedGroup.name}
              </div>
              <div style={subtleText}>Selecionado para divisao do mes</div>
            </div>
          </div>
        </button>

        {isOpen && (
          <div
            style={{
              position: "absolute",
              left: 16,
              right: 16,
              top: "calc(100% - 6px)",
              zIndex: 24,
              padding: 8,
              borderRadius: 18,
              border: "1px solid rgba(148,163,184,0.16)",
              background: "rgba(12,16,25,0.98)",
              boxShadow: "0 24px 70px rgba(0,0,0,0.48)",
              display: "grid",
              gap: 6,
              maxHeight: 280,
              overflowY: "auto",
            }}
          >
            {groups.map((group) => {
              const active = group.id === selectedGroupId;
              const isHighlight = group.id === highlightGroupId;

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => {
                    onSelectGroup(group);
                    setIsOpen(false);
                  }}
                  style={{
                    cursor: "pointer",
                    textAlign: "left",
                    padding: 10,
                    borderRadius: 14,
                    border: active ? "1px solid rgba(96,165,250,0.38)" : "1px solid rgba(148,163,184,0.10)",
                    background: active ? "rgba(59,130,246,0.16)" : "rgba(255,255,255,0.025)",
                    color: "inherit",
                    boxShadow: isHighlight ? "0 0 0 2px rgba(91,140,255,0.28)" : "none",
                    transition: "background 0.2s ease, border 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <div
                      style={{
                        ...memberAvatarStyle,
                        width: 38,
                        height: 38,
                        borderRadius: 13,
                        fontSize: 12,
                      }}
                    >
                      {getInitials(group.name)}
                    </div>
                    <div style={{ display: "grid", gap: 2, minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 900,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {group.name}
                      </div>
                      <div style={subtleText}>{active ? "Selecionado" : "Abrir grupo"}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
