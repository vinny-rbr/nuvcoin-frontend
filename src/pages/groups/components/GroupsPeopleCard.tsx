import type { CSSProperties } from "react";

import type { GroupBalancesResponse, GroupMembersResponse } from "../types/groups.types";
import { getInitials, safeName } from "../utils/groups.helpers";

type GroupsPeopleCardProps = {
  membersInfo: GroupMembersResponse | null;
  balances: GroupBalancesResponse | null;
  membersLoading: boolean;
  balancesLoading: boolean;
  membersError: string | null;
  balancesError: string | null;
  removeMemberError: string | null;
  addMemberOpen: boolean;
  addMemberUserId: string;
  addMemberLoading: boolean;
  addMemberError: string | null;
  addMemberSuccess: string | null;
  removeMemberLoadingId: string | null;
  onToggleAddMember: () => void;
  onAddMemberUserIdChange: (value: string) => void;
  onAddMember: () => void;
  onRemoveMember: (memberId: string, role: string) => void;
  sectionCard: CSSProperties;
  panelTitle: CSSProperties;
  subtleText: CSSProperties;
  softButton: CSSProperties;
  ghostButton: CSSProperties;
  primaryButton: CSSProperties;
  inputStyle: CSSProperties;
  memberAvatarStyle: CSSProperties;
};

export default function GroupsPeopleCard({
  membersInfo,
  balances,
  membersLoading,
  balancesLoading,
  membersError,
  balancesError,
  removeMemberError,
  addMemberOpen,
  addMemberUserId,
  addMemberLoading,
  addMemberError,
  addMemberSuccess,
  removeMemberLoadingId,
  onToggleAddMember,
  onAddMemberUserIdChange,
  onAddMember,
  onRemoveMember,
  sectionCard,
  panelTitle,
  subtleText,
  softButton,
  ghostButton,
  primaryButton,
  inputStyle,
  memberAvatarStyle,
}: GroupsPeopleCardProps) {
  const members = balances?.members ?? [];

  return (
    <div style={sectionCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "grid", gap: 2 }}>
          <div style={panelTitle}>Pessoas</div>
          <div style={subtleText}>Quem participa do grupo e quem é o administrador.</div>
        </div>

        <button type="button" onClick={onToggleAddMember} style={softButton}>
          {addMemberOpen ? "Fechar" : "Adicionar pessoa"}
        </button>
      </div>

      {(membersLoading || balancesLoading) && <div style={{ ...subtleText, marginTop: 12 }}>Carregando…</div>}

      {membersError && (
        <div style={{ ...subtleText, marginTop: 12 }}>
          <strong>Falha:</strong> {membersError}
        </div>
      )}

      {balancesError && (
        <div style={{ ...subtleText, marginTop: 12 }}>
          <strong>Falha:</strong> {balancesError}
        </div>
      )}

      {removeMemberError && (
        <div style={{ ...subtleText, marginTop: 12 }}>
          <strong>Falha:</strong> {removeMemberError}
        </div>
      )}

      {!membersLoading && !membersError && membersInfo?.members?.length ? (
        <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
          {membersInfo.members.map((m) => {
            const rich = members.find((x) => x.userId === m.userId);
            const display = safeName(rich?.name, rich?.email, m.userId);

            return (
              <div
                key={m.id}
                style={{
                  padding: 14,
                  borderRadius: 18,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div style={memberAvatarStyle}>{getInitials(display)}</div>

                  <div style={{ display: "grid", gap: 3 }}>
                    <div style={{ fontWeight: 900 }}>
                      {display} {m.role === "Admin" ? <span style={{ opacity: 0.78, fontWeight: 800 }}>• Admin</span> : null}
                    </div>
                    <div style={subtleText}>{m.role === "Admin" ? "Dono do grupo" : "Membro participante"}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveMember(m.id, m.role)}
                  disabled={removeMemberLoadingId === m.id || m.role === "Admin"}
                  style={{
                    ...ghostButton,
                    cursor: removeMemberLoadingId === m.id || m.role === "Admin" ? "not-allowed" : "pointer",
                    opacity: m.role === "Admin" ? 0.45 : 1,
                  }}
                >
                  {removeMemberLoadingId === m.id ? "Removendo…" : "Remover"}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        !membersLoading && !membersError && <div style={{ ...subtleText, marginTop: 12 }}>Sem pessoas no grupo.</div>
      )}

      {addMemberOpen && (
        <div style={{ display: "grid", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 800, opacity: 0.95 }}>Adicionar pessoa</div>
            <div style={subtleText}>Por enquanto: cole o UserId (GUID). Depois vamos trocar por e-mail.</div>
            <input value={addMemberUserId} onChange={(e) => onAddMemberUserIdChange(e.target.value)} placeholder="UserId (GUID)" style={inputStyle} />
          </div>

          {addMemberError && (
            <div style={subtleText}>
              <strong>Falha:</strong> {addMemberError}
            </div>
          )}

          {addMemberSuccess && <div style={subtleText}>✅ {addMemberSuccess}</div>}

          <button
            type="button"
            onClick={onAddMember}
            disabled={addMemberLoading}
            style={{
              ...primaryButton,
              cursor: addMemberLoading ? "not-allowed" : "pointer",
              opacity: addMemberLoading ? 0.7 : 1,
            }}
          >
            {addMemberLoading ? "Adicionando…" : "Adicionar"}
          </button>
        </div>
      )}
    </div>
  );
}

// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com
//
// Componente extraído do Groups.tsx:
// - Card de pessoas
// - Lista de membros
// - Adicionar pessoa
// - Remover pessoa