import type { CSSProperties } from "react";

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
  if (groups.length === 0) {
    return null;
  }

  return (
    <div style={sectionCard}>
      <div style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 2 }}>
            <div style={panelTitle}>Meus grupos</div>
            <div style={subtleText}>{groups.length} grupo(s) encontrado(s)</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 14,
            overflowX: "auto",
            padding: "2px 2px 6px",
            scrollbarWidth: "thin",
            animation: isGroupsLaneAnimating ? "conciliaai-groups-lane-reflow 0.62s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
            transformOrigin: "left center",
            willChange: "transform, filter",
          }}
        >
          {groups.map((group) => {
            const active = group.id === selectedGroupId;
            const isHighlight = group.id === highlightGroupId;
            const shouldReactToLane = isGroupsLaneAnimating && !isHighlight;

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => onSelectGroup(group)}
                style={{
                  cursor: "pointer",
                  textAlign: "left",
                  padding: "14px 16px",
                  borderRadius: 20,
                  border: isHighlight
                    ? "1px solid rgba(91,140,255,0.95)"
                    : active
                      ? "1px solid rgba(96,165,250,0.42)"
                      : "1px solid rgba(148,163,184,0.12)",
                  background: isHighlight
                    ? "linear-gradient(180deg, rgba(91,140,255,0.36) 0%, rgba(255,255,255,0.06) 100%)"
                    : active
                      ? "linear-gradient(110deg, rgba(59,130,246,0.24) 0%, rgba(30,41,59,0.72) 42%, rgba(96,165,250,0.18) 50%, rgba(30,41,59,0.72) 58%, rgba(59,130,246,0.24) 100%)"
                      : "linear-gradient(180deg, rgba(30,41,59,0.58) 0%, rgba(15,23,42,0.42) 100%)",
                  backgroundSize: active ? "240% 100%" : undefined,
                  color: "inherit",
                  boxShadow: isHighlight
                    ? "0 0 0 2px rgba(91,140,255,0.35), 0 0 40px rgba(91,140,255,0.55), 0 20px 60px rgba(91,140,255,0.45)"
                    : active
                      ? "0 16px 34px rgba(37,99,235,0.22), inset 0 1px 0 rgba(255,255,255,0.05)"
                      : "inset 0 1px 0 rgba(255,255,255,0.035)",
                  minWidth: "min(250px, calc(100vw - 80px))",
                  maxWidth: "calc(100vw - 80px)",
                  flexShrink: 0,
                  transform: isHighlight
                    ? "translateY(-6px) scale(1.04)"
                    : shouldReactToLane
                      ? "translateX(6px) scale(0.995)"
                      : active
                        ? "scale(1.01)"
                        : "scale(1)",
                  opacity: isHighlight ? 0 : 1,
                  animation: isHighlight
                    ? "conciliaai-group-enter 0.45s ease forwards, conciliaai-group-glow 1.8s ease-in-out infinite"
                    : shouldReactToLane
                      ? "conciliaai-group-shift 0.5s ease"
                      : active
                        ? "conciliaai-groups-card-shine 3s ease-in-out infinite"
                        : "none",
                  transition:
                    "border 0.35s ease, background 0.35s ease, box-shadow 0.45s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                  <div style={memberAvatarStyle}>{getInitials(group.name)}</div>

                  <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
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
                    <div style={subtleText}>
                      {isHighlight
                        ? "Recem-criado"
                        : active
                          ? "Selecionado"
                          : "Clique para abrir"}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

