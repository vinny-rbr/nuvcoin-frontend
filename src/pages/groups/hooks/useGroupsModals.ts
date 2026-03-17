import { useState } from "react"; // Hook do React para controlar estados locais

type UseGroupsModalsReturn = {
  isCreateGroupModalOpen: boolean; // Controla modal de criar grupo
  isMembersModalOpen: boolean; // Controla modal de membros
  isCreateExpenseModalOpen: boolean; // Controla modal de criar despesa
  isEditExpenseModalOpen: boolean; // Controla modal de editar despesa
  isBaseConfigModalOpen: boolean; // Controla modal de base/salários

  selectedExpenseId: string | null; // Guarda a despesa selecionada para ações
  selectedExpenseTitle: string; // Guarda o título da despesa selecionada

  openCreateGroupModal: () => void; // Abre modal de criar grupo
  closeCreateGroupModal: () => void; // Fecha modal de criar grupo

  openMembersModal: () => void; // Abre modal de membros
  closeMembersModal: () => void; // Fecha modal de membros

  openCreateExpenseModal: () => void; // Abre modal de criar despesa
  closeCreateExpenseModal: () => void; // Fecha modal de criar despesa

  openEditExpenseModal: (params: {
    expenseId: string; // Id da despesa que será editada
    title?: string | null; // Título da despesa
  }) => void; // Abre modal de edição e define despesa selecionada
  closeEditExpenseModal: () => void; // Fecha modal de editar despesa

  openBaseConfigModal: () => void; // Abre modal da base
  closeBaseConfigModal: () => void; // Fecha modal da base

  clearSelectedExpense: () => void; // Limpa despesa selecionada
};

export default function useGroupsModals(): UseGroupsModalsReturn {
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false); // Estado do modal de criar grupo
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false); // Estado do modal de membros
  const [isCreateExpenseModalOpen, setIsCreateExpenseModalOpen] = useState(false); // Estado do modal de criar despesa
  const [isEditExpenseModalOpen, setIsEditExpenseModalOpen] = useState(false); // Estado do modal de editar despesa
  const [isBaseConfigModalOpen, setIsBaseConfigModalOpen] = useState(false); // Estado do modal de base

  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null); // Guarda id da despesa selecionada
  const [selectedExpenseTitle, setSelectedExpenseTitle] = useState(""); // Guarda título da despesa selecionada

  function openCreateGroupModal(): void {
    setIsCreateGroupModalOpen(true); // Abre modal de criar grupo
  }

  function closeCreateGroupModal(): void {
    setIsCreateGroupModalOpen(false); // Fecha modal de criar grupo
  }

  function openMembersModal(): void {
    setIsMembersModalOpen(true); // Abre modal de membros
  }

  function closeMembersModal(): void {
    setIsMembersModalOpen(false); // Fecha modal de membros
  }

  function openCreateExpenseModal(): void {
    setIsCreateExpenseModalOpen(true); // Abre modal de criar despesa
  }

  function closeCreateExpenseModal(): void {
    setIsCreateExpenseModalOpen(false); // Fecha modal de criar despesa
  }

  function openEditExpenseModal(params: { expenseId: string; title?: string | null }): void {
    setSelectedExpenseId(params.expenseId); // Define id da despesa selecionada
    setSelectedExpenseTitle(params.title ?? ""); // Define título da despesa selecionada
    setIsEditExpenseModalOpen(true); // Abre modal de edição
  }

  function closeEditExpenseModal(): void {
    setIsEditExpenseModalOpen(false); // Fecha modal de edição
  }

  function openBaseConfigModal(): void {
    setIsBaseConfigModalOpen(true); // Abre modal da base
  }

  function closeBaseConfigModal(): void {
    setIsBaseConfigModalOpen(false); // Fecha modal da base
  }

  function clearSelectedExpense(): void {
    setSelectedExpenseId(null); // Limpa id da despesa selecionada
    setSelectedExpenseTitle(""); // Limpa título da despesa selecionada
  }

  return {
    isCreateGroupModalOpen,
    isMembersModalOpen,
    isCreateExpenseModalOpen,
    isEditExpenseModalOpen,
    isBaseConfigModalOpen,

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

    clearSelectedExpense,
  };
}