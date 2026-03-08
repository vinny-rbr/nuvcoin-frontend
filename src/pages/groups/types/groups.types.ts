export type GroupDto = {
  id: string; // Id do grupo (GUID)
  name: string; // Nome do grupo
  ownerUserId?: string; // (se vier do backend)
  createdAtUtc?: string; // (se vier do backend)
  isArchived?: boolean; // (se vier do backend)
};

export type GroupsApiState = {
  groups: GroupDto[]; // Lista de grupos
  loading: boolean; // Carregando?
  error: string | null; // Erro (se tiver)
};

export type GroupMemberItemDto = {
  id: string; // Id do GroupMember (GUID)
  groupId: string; // Id do grupo
  userId: string; // Id do usuário
  role: string; // "Admin" | "Member"
  defaultSharePercent?: number | null; // Pode vir null
  accessStartUtc?: string | null; // Pode vir null
  accessEndUtc?: string | null; // Pode vir null
  createdAtUtc?: string; // Pode vir
};

export type GroupMembersResponse = {
  groupId: string; // Id do grupo
  groupName: string; // Nome do grupo
  ownerUserId: string; // Owner
  members: GroupMemberItemDto[]; // Lista
};

export type GroupExpenseParticipantDto = {
  userId: string; // Id do usuário
  name: string; // Nome
  email: string; // Email
  shareCents: number; // Parcela em centavos
  isExcluded: boolean; // Excluído?
};

export type GroupExpenseListItemDto = {
  id: string; // Id da despesa
  groupId: string; // Id do grupo
  description: string; // Descrição
  amountCents: number; // Total em centavos
  date: string; // Data ISO
  paidByUserId: string; // Quem pagou (Id)
  paidByName: string; // Quem pagou (nome)
  paidByEmail: string; // Quem pagou (email)
  createdByUserId: string; // Quem criou
  createdAtUtc: string; // Criado em
  participants: GroupExpenseParticipantDto[]; // Participantes
};

export type GroupExpensesListResponse = {
  groupId: string; // Grupo
  totalCount: number; // Total
  items: GroupExpenseListItemDto[]; // Itens
};

export type GroupMemberBalanceDto = {
  userId: string; // Id do usuário
  name: string; // Nome
  email: string; // Email
  totalPaidCents: number; // Quanto pagou
  totalOwesCents: number; // Quanto deve
  settlementsSentCents: number; // Quitações enviadas
  settlementsReceivedCents: number; // Quitações recebidas
  giftsSentCents: number; // Gifts enviados (info)
  giftsReceivedCents: number; // Gifts recebidos (info)
  balanceCents: number; // Saldo líquido
};

export type GroupBalancesResponse = {
  groupId: string; // Grupo
  asOfUtcDate: string; // Data corte
  consideredExpensesCount: number; // Despesas consideradas
  consideredSettlementsCount: number; // Settlements considerados
  consideredGiftsCount: number; // Gifts considerados
  members: GroupMemberBalanceDto[]; // "Members"
};

export type CreateGroupExpenseRequest = {
  groupId: string; // Grupo
  description: string; // Descrição
  amountCents: number; // Total
  date: string; // DateTime ISO
  paidByUserId: string; // Quem pagou (API exige)
};

export type CreateGroupExpenseResponse = {
  groupExpenseId: string; // Id criado
  groupId: string; // Grupo
  description: string; // Descrição
  amountCents: number; // Total
  date: string; // Data
  paidByUserId: string; // Quem pagou
  participantsCount: number; // Quantos participantes
  splitMode: "EQUAL" | "PERCENT"; // Modo
};

export type UpdateGroupExpenseRequest = {
  description: string; // Descrição
  amountCents: number; // Total
  date: string; // DateTime ISO
  paidByUserId: string; // Quem pagou (mantemos o mesmo pra não quebrar API)
};

export type GroupSplitMode = "SALARY" | "MANUAL"; // Automático por salário ou manual por percentual