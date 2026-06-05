import type { CSSProperties } from "react";
import type { GroupBalancesResponse } from "../types/groups.types";
import type { HeaderQuickAction, HeaderQuickActionId } from "../hooks/useGroupsHeaderActions";
import { getInitials } from "../utils/groups.helpers";

const AVATAR_COLORS = ["#3B82F6", "#22C55E", "#A78BFA", "#F97316", "#F472B6", "#14B8A6"];

function avatarColor(name: string): string {
  const code = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type GroupsContextCardProps = {
  groupName: string;
  membersCount: number;
  monthTotalCents: number;
  averagePerPersonCents: number;
  balances: GroupBalancesResponse | null;
  actions: HeaderQuickAction[];
  onClose: () => void;
  isMobile: boolean;
};

const ACTION_ORDER: Array<{ id: HeaderQuickActionId; label: string; icon: string; primary?: boolean }> = [
  { id: "expense", label: "Lançar despesa", icon: "R$", primary: true },
  { id: "people",  label: "Pessoas",        icon: "👥" },
  { id: "summary", label: "Resumo do mês",  icon: "Σ"  },
  { id: "base",    label: "Base do grupo",  icon: "%"  },
  { id: "history", label: "Histórico",      icon: "⏱" },
  { id: "refresh", label: "Atualizar",      icon: "↻" },
];

export default function GroupsContextCard({
  groupName,
  membersCount,
  monthTotalCents,
  averagePerPersonCents,
  actions,
  onClose,
  isMobile,
}: GroupsContextCardProps) {
  const color = avatarColor(groupName);
  const initials = getInitials(groupName);

  const actionMap = new Map(actions.map((a) => [a.id, a]));

  const closeStyle: CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: 11,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(15,23,42,0.55)",
    color: "var(--text-2)",
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    fontSize: 15,
    fontWeight: 700,
    transition: "color 0.18s, border-color 0.18s",
  };

  return (
    <div className="grp-ctx-card">
      {/* Header */}
      <div className="grp-ctx-head">
        <div
          className="grp-ctx-emoji"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}
        >
          {initials}
        </div>
        <div className="grp-ctx-info">
          <strong>{groupName}</strong>
          <span>Grupo compartilhado · {membersCount} {membersCount === 1 ? "pessoa" : "pessoas"}</span>
        </div>
        <button
          type="button"
          aria-label="Fechar contexto do grupo"
          onClick={onClose}
          style={closeStyle}
        >
          ✕
        </button>
      </div>

      {/* Actions grid */}
      <div className="grp-ctx-lbl">Ações do grupo</div>
      <div className={`grp-ctx-actions${isMobile ? " grp-ctx-actions-mobile" : ""}`}>
        {ACTION_ORDER.map(({ id, label, icon, primary }) => {
          const action = actionMap.get(id);
          if (!action) return null;
          return (
            <button
              key={id}
              type="button"
              className={`grp-ctx-action${primary ? " is-primary" : ""}`}
              disabled={action.disabled}
              onClick={action.onClick}
              title={label}
            >
              <span className="grp-ctx-ai">{icon}</span>
              <span className="grp-ctx-al">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Metrics */}
      <div className="grp-ctx-metrics">
        <div className="grp-ctx-metric">
          <small>Total do mês</small>
          <strong>{brl(monthTotalCents)}</strong>
          <span>{membersCount} {membersCount === 1 ? "pessoa" : "pessoas"} dividindo</span>
        </div>
        <div className="grp-ctx-metric">
          <small>Média / pessoa</small>
          <strong>{brl(averagePerPersonCents)}</strong>
          <span>divisão igual</span>
        </div>
      </div>
    </div>
  );
}
