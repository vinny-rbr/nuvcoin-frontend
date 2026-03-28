import { useMemo } from "react";

export type HeaderQuickActionId =
  | "refresh"
  | "create"
  | "people"
  | "base"
  | "expense"
  | "summary"
  | "history";

export type HeaderQuickAction = {
  id: HeaderQuickActionId;
  icon: string;
  label: string;
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
};

type HeaderActionModalId = Exclude<HeaderQuickActionId, "refresh" | "create">;

type UseGroupsHeaderActionsParams = {
  isGroupsLoading: boolean;
  isCreateGroupLoading: boolean;
  isCreatingGroup: boolean;
  isCreatingWithTransition: boolean;
  selectedGroupId: string | null;
  onReloadGroups: () => void;
  onOpenCreateGroup: () => void;
  onOpenHeaderActionModal: (action: HeaderActionModalId) => void;
  onResetMemberFeedback: () => void;
  onClearBaseFeedback: () => void;
};

export default function useGroupsHeaderActions({
  isGroupsLoading,
  isCreateGroupLoading,
  isCreatingGroup,
  isCreatingWithTransition,
  selectedGroupId,
  onReloadGroups,
  onOpenCreateGroup,
  onOpenHeaderActionModal,
  onResetMemberFeedback,
  onClearBaseFeedback,
}: UseGroupsHeaderActionsParams): HeaderQuickAction[] {
  return useMemo(() => {
    const isCreateLoading =
      isCreateGroupLoading || isCreatingGroup || isCreatingWithTransition;

    return [
      {
        id: "refresh",
        icon: "\u21bb",
        label: isGroupsLoading ? "Atualizando grupos..." : "Atualizar grupos",
        disabled: isGroupsLoading || isCreatingWithTransition,
        loading: isGroupsLoading,
        onClick: () => {
          onReloadGroups();
        },
      },
      {
        id: "create",
        icon: "+",
        label: isCreateLoading ? "Criando grupo..." : "Novo grupo",
        disabled: isCreateLoading,
        loading: isCreateLoading,
        onClick: () => {
          onOpenCreateGroup();
        },
      },
      {
        id: "people",
        icon: "\u{1F465}",
        label: "Pessoas",
        disabled: !selectedGroupId,
        onClick: () => {
          onOpenHeaderActionModal("people");
          onResetMemberFeedback();
        },
      },
      {
        id: "base",
        icon: "%",
        label: "Base do grupo",
        disabled: !selectedGroupId,
        onClick: () => {
          onOpenHeaderActionModal("base");
          onClearBaseFeedback();
        },
      },
      {
        id: "expense",
        icon: "R$",
        label: "Lan\u00e7ar despesa",
        disabled: !selectedGroupId,
        onClick: () => {
          onOpenHeaderActionModal("expense");
        },
      },
      {
        id: "summary",
        icon: "\u03a3",
        label: "Resumo do m\u00eas",
        disabled: !selectedGroupId,
        onClick: () => {
          onOpenHeaderActionModal("summary");
        },
      },
      {
        id: "history",
        icon: "\u23f1",
        label: "Hist\u00f3rico",
        disabled: !selectedGroupId,
        onClick: () => {
          onOpenHeaderActionModal("history");
        },
      },
    ];
  }, [
    isCreateGroupLoading,
    isCreatingGroup,
    isCreatingWithTransition,
    isGroupsLoading,
    onClearBaseFeedback,
    onOpenCreateGroup,
    onOpenHeaderActionModal,
    onReloadGroups,
    onResetMemberFeedback,
    selectedGroupId,
  ]);
}
