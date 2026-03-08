import type { CSSProperties } from "react";

import type { GroupDto } from "../types/groups.types";
import { getInitials } from "../utils/groups.helpers";

type GroupsSidebarProps = {
  state: {
    groups: GroupDto[];
    loading: boolean;
    error: string | null;
  };
  selectedGroupId: string | null;
  newGroupName: string;
  createGroupLoading: boolean;
  createGroupError: string | null;
  createGroupSuccess: string | null;
  onNewGroupNameChange: (value: string) => void;
  onCreateGroup: () => void;
  onRefreshGroups: () => void;
  onSelectGroup: (group: GroupDto) => void;
  sidebarCard: CSSProperties;
  panelTitle: CSSProperties;
  subtleText: CSSProperties;
  inputStyle: CSSProperties;
  primaryButton: CSSProperties;
  ghostButton: CSSProperties;
  memberAvatarStyle: CSSProperties;
};

export default function GroupsSidebar({
  state,
  selectedGroupId,
  newGroupName,
  createGroupLoading,
  createGroupError,
  createGroupSuccess,
  onNewGroupNameChange,
  onCreateGroup,
  onRefreshGroups,
  onSelectGroup,
  sidebarCard,
  panelTitle,
  subtleText,
  inputStyle,
  primaryButton,
  ghostButton,
  memberAvatarStyle,
}: GroupsSidebarProps) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={sidebarCard}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={panelTitle}>Novo grupo</div>
            <div style={subtleText}>Crie um grupo para começar a dividir despesas, organizar pessoas e montar o resumo mensal.</div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <input
              id="novo-grupo-input"
              value={newGroupName}
              onChange={(e) => onNewGroupNameChange(e.target.value)}
              placeholder="Ex: Casa 2026, Apê, Viagem…"
              style={inputStyle}
            />

            {createGroupError && (
              <div style={{ ...subtleText, opacity: 0.95 }}>
                <strong>Falha:</strong> {createGroupError}
              </div>
            )}

            {createGroupSuccess && <div style={{ ...subtleText, opacity: 0.95 }}>✅ {createGroupSuccess}</div>}

            <button
              type="button"
              onClick={onCreateGroup}
              disabled={createGroupLoading}
              style={{
                ...primaryButton,
                cursor: createGroupLoading ? "not-allowed" : "pointer",
                opacity: createGroupLoading ? 0.7 : 1,
              }}
            >
              {createGroupLoading ? "Criando..." : "Criar grupo"}
            </button>
          </div>
        </div>
      </div>

      <div style={sidebarCard}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ display: "grid", gap: 2 }}>
              <div style={panelTitle}>Meus grupos</div>
              <div style={subtleText}>{state.groups.length} grupo(s) encontrado(s)</div>
            </div>

            <button
              type="button"
              onClick={onRefreshGroups}
              disabled={state.loading}
              style={{
                ...ghostButton,
                cursor: state.loading ? "not-allowed" : "pointer",
                opacity: state.loading ? 0.7 : 1,
              }}
            >
              {state.loading ? "…" : "Atualizar"}
            </button>
          </div>

          {state.loading && <div style={subtleText}>Carregando…</div>}

          {!state.loading && !state.error && state.groups.length === 0 && <div style={subtleText}>Você ainda não tem grupos. Crie o primeiro 🙂</div>}

          {!state.loading &&
            !state.error &&
            state.groups.map((g) => {
              const active = g.id === selectedGroupId;

              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onSelectGroup(g)}
                  style={{
                    cursor: "pointer",
                    textAlign: "left",
                    padding: 14,
                    borderRadius: 18,
                    border: active ? "1px solid rgba(117,154,255,0.30)" : "1px solid rgba(255,255,255,0.08)",
                    background: active
                      ? "linear-gradient(180deg, rgba(92,132,255,0.16) 0%, rgba(255,255,255,0.03) 100%)"
                      : "rgba(255,255,255,0.02)",
                    color: "inherit",
                    boxShadow: active ? "0 12px 28px rgba(47,84,235,0.12)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={memberAvatarStyle}>{getInitials(g.name)}</div>

                    <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
                      <div style={{ fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{g.name}</div>
                      <div style={subtleText}>{active ? "Selecionado" : "Clique para abrir"}</div>
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

// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com
//
// Componente extraído do Groups.tsx:
// - Card de criação de grupo
// - Lista de grupos da sidebar
// - Seleção de grupo
// - Atualização da lista