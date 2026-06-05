import type { CSSProperties } from "react";
import type { GroupDto } from "../types/groups.types";
import { getInitials } from "../utils/groups.helpers";

const AVATAR_COLORS = ["#3B82F6", "#22C55E", "#A78BFA", "#F97316", "#F472B6", "#14B8A6"];

function avatarColor(name: string): string {
  const code = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

type GroupsGroupsLaneProps = {
  groups: GroupDto[];
  selectedGroupId: string | null;
  highlightGroupId: string | null;
  isGroupsLaneAnimating: boolean;
  onSelectGroup: (group: GroupDto) => void;
  onCreateGroup?: () => void;
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
  onCreateGroup,
}: GroupsGroupsLaneProps) {
  if (groups.length === 0) return null;

  return (
    <div className="grp-card grp-lane-card">
      <div className="grp-panel-head">
        <div>
          <h3 className="grp-panel-title">Seus grupos</h3>
          <div className="grp-panel-sub">Selecione para ver as ações</div>
        </div>
      </div>

      <div
        className="grp-lane"
        style={{
          animation: isGroupsLaneAnimating
            ? "conciliaai-groups-lane-reflow 0.62s cubic-bezier(0.22,1,0.36,1)"
            : "none",
        }}
      >
        {groups.map((group) => {
          const isActive = group.id === selectedGroupId;
          const isHighlight = group.id === highlightGroupId;
          const color = avatarColor(group.name);
          const initials = getInitials(group.name);

          return (
            <button
              key={group.id}
              type="button"
              className={`grp-group-card${isActive ? " is-active" : ""}`}
              style={isHighlight ? { boxShadow: "0 0 0 2px rgba(91,140,255,0.38), var(--glow-blue)" } : undefined}
              onClick={() => onSelectGroup(group)}
            >
              <div
                className="grp-gc-emoji"
                style={isActive ? { background: `linear-gradient(135deg,${color}33,${color}22)`, borderColor: `${color}44` } : undefined}
              >
                {initials}
              </div>
              <h4>{group.name}</h4>
              <div className="grp-gc-meta">Grupo compartilhado</div>
              <div className="grp-gc-avatars">
                {[initials].map((av, i) => (
                  <span key={i} className="grp-gc-av" style={{ background: color }}>
                    {av.slice(0, 1)}
                  </span>
                ))}
              </div>
            </button>
          );
        })}

        <button
          type="button"
          className="grp-group-card-new"
          onClick={onCreateGroup}
          aria-label="Criar novo grupo"
        >
          <span className="grp-new-plus">+</span>
          <strong style={{ fontSize: 14, fontWeight: 800 }}>Novo grupo</strong>
        </button>
      </div>
    </div>
  );
}
