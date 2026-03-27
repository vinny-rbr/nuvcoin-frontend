import { useState } from "react";

export type GroupsHeaderActionId =
  | "people"
  | "base"
  | "expense"
  | "summary"
  | "history";

type UseGroupsModalsReturn = {
  isCreateGroupModalOpen: boolean;
  isMembersModalOpen: boolean;
  isCreateExpenseModalOpen: boolean;
  isEditExpenseModalOpen: boolean;
  isBaseConfigModalOpen: boolean;
  activeHeaderAction: GroupsHeaderActionId | null;
  selectedExpenseId: string | null;
  selectedExpenseTitle: string;
  openCreateGroupModal: () => void;
  closeCreateGroupModal: () => void;
  openMembersModal: () => void;
  closeMembersModal: () => void;
  openCreateExpenseModal: () => void;
  closeCreateExpenseModal: () => void;
  openEditExpenseModal: (params: { expenseId: string; title?: string | null }) => void;
  closeEditExpenseModal: () => void;
  openBaseConfigModal: () => void;
  closeBaseConfigModal: () => void;
  openHeaderActionModal: (actionId: GroupsHeaderActionId) => void;
  closeHeaderActionModal: () => void;
  clearSelectedExpense: () => void;
};

export default function useGroupsModals(): UseGroupsModalsReturn {
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isCreateExpenseModalOpen, setIsCreateExpenseModalOpen] = useState(false);
  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false);
  const [isBaseConfigModalOpen, setIsBaseConfigModalOpen] = useState(false);
  const [activeHeaderAction, setActiveHeaderAction] = useState<GroupsHeaderActionId | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [selectedExpenseTitle, setSelectedExpenseTitle] = useState("");

  function openCreateGroupModal(): void {
    setIsCreateGroupModalOpen(true);
  }

  function closeCreateGroupModal(): void {
    setIsCreateGroupModalOpen(false);
  }

  function openMembersModal(): void {
    setIsMembersModalOpen(true);
  }

  function closeMembersModal(): void {
    setIsMembersModalOpen(false);
  }

  function openCreateExpenseModal(): void {
    setIsCreateExpenseModalOpen(true);
  }

  function closeCreateExpenseModal(): void {
    setIsCreateExpenseModalOpen(false);
  }

  function openEditExpenseModal(params: { expenseId: string; title?: string | null }): void {
    setSelectedExpenseId(params.expenseId);
    setSelectedExpenseTitle(params.title ?? "");
    setIsEditExpenseModalOpen(true);
  }

  function closeEditExpenseModal(): void {
    setIsEditExpenseModalOpen(false);
  }

  function openBaseConfigModal(): void {
    setIsBaseConfigModalOpen(true);
  }

  function closeBaseConfigModal(): void {
    setIsBaseConfigModalOpen(false);
  }

  function openHeaderActionModal(actionId: GroupsHeaderActionId): void {
    setActiveHeaderAction(actionId);
  }

  function closeHeaderActionModal(): void {
    setActiveHeaderAction(null);
  }

  function clearSelectedExpense(): void {
    setSelectedExpenseId(null);
    setSelectedExpenseTitle("");
  }

  return {
    isCreateGroupModalOpen,
    isMembersModalOpen,
    isCreateExpenseModalOpen,
    isEditExpenseModalOpen,
    isBaseConfigModalOpen,
    activeHeaderAction,
    selectedExpenseId,
    selectedExpenseTitle,
    openCreateGroupModal,
    closeCreateGroupModal,
    openMembersModal,
    closeMembersModal,
    openCreateExpenseModal,
    closeCreateExpenseModal,
    openEditExpenseModal,
    closeEditExpenseModal,
    openBaseConfigModal,
    closeBaseConfigModal,
    openHeaderActionModal,
    closeHeaderActionModal,
    clearSelectedExpense,
  };
}
