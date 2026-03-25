import type { CSSProperties } from "react";

import type { GroupDto } from "../types/groups.types";

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
};

export default function GroupsSidebar({
  state,
  newGroupName,
  createGroupLoading,
  createGroupError,
  createGroupSuccess,
  onNewGroupNameChange,
  onCreateGroup,
  sidebarCard,
  panelTitle,
  subtleText,
  inputStyle,
  primaryButton,
}: GroupsSidebarProps) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* 🔥 ÚNICO CARD: criar grupo */}
      <div style={sidebarCard}>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={panelTitle}>Criar grupo</div>
            <div style={subtleText}>
              Use o botão do topo ou crie rapidamente por aqui.
            </div>
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
              <div style={{ ...subtleText }}>
                <strong>Falha:</strong> {createGroupError}
              </div>
            )}

            {createGroupSuccess && (
              <div style={{ ...subtleText }}>
                ✅ {createGroupSuccess}
              </div>
            )}

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

      {/* 🔥 ESPAÇO LIMPO (preparado pra futuro) */}
      {state.groups.length === 0 && (
        <div style={sidebarCard}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={panelTitle}>Sem grupos ainda</div>
            <div style={subtleText}>
              Crie seu primeiro grupo para começar 🚀
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/*
=====================================================
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com
=====================================================

Mudanças feitas:

✔ Removido card duplicado "Novo grupo"
✔ Removido card "Meus grupos" da sidebar
✔ Sidebar ficou limpa e focada
✔ Mantido input como fallback rápido
✔ Preparado layout para futura aba superior de grupos
*/