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
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 2 }}>
            <div style={panelTitle}>Meus grupos</div>
            <div style={subtleText}>{groups.length} grupo(s) encontrado(s)</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            paddingBottom: 4,
            animation: isGroupsLaneAnimating ? "nuvcoin-groups-lane-reflow 0.62s cubic-bezier(0.22, 1, 0.36, 1)" : "none",
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
                  padding: "12px 16px",
                  borderRadius: 18,
                  border: isHighlight
                    ? "1px solid rgba(91,140,255,0.95)"
                    : active
                      ? "1px solid rgba(117,154,255,0.30)"
                      : "1px solid rgba(255,255,255,0.08)",
                  background: isHighlight
                    ? "linear-gradient(180deg, rgba(91,140,255,0.36) 0%, rgba(255,255,255,0.06) 100%)"
                    : active
                      ? "linear-gradient(180deg, rgba(92,132,255,0.16) 0%, rgba(255,255,255,0.03) 100%)"
                      : "rgba(255,255,255,0.02)",
                  color: "inherit",
                  boxShadow: isHighlight
                    ? "0 0 0 2px rgba(91,140,255,0.35), 0 0 40px rgba(91,140,255,0.55), 0 20px 60px rgba(91,140,255,0.45)"
                    : active
                      ? "0 12px 28px rgba(47,84,235,0.12)"
                      : "none",
                  minWidth: 220,
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
                    ? "nuvcoin-group-enter 0.45s ease forwards, nuvcoin-group-glow 1.8s ease-in-out infinite"
                    : shouldReactToLane
                      ? "nuvcoin-group-shift 0.5s ease"
                      : "none",
                  transition:
                    "border 0.35s ease, background 0.35s ease, box-shadow 0.45s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
