// Tipo principal: Receita ou Despesa
export type FinanceType = "RECEITA" | "DESPESA";

// Metodo de pagamento, usado para separar credito no dashboard.
export type PaymentType = "pix" | "debit" | "cash" | "credit";

// Status do lancamento.
export type FinanceStatus = "paid" | "pending";

// Categoria cadastrada pelo usuario.
export type FinanceCategory = string;

export interface FinanceCategoryOption {
  id: string;
  type: FinanceType;
  name: string;
  icon?: string;
  color?: string;
  parentId?: string | null;
  level?: number;
  fullPath?: string;
  createdAtUtc?: string;
  updatedAtUtc?: string | null;
}

// Modelo principal da transacao.
export interface FinanceItem {
  id: string;
  type: FinanceType;
  title: string;
  category: FinanceCategory;
  amountCents: number;
  dateISO: string;
  createdAtISO: string;
  paymentType: PaymentType;
  status: FinanceStatus;
  recurringGroupId?: string;
  recurringKind?: "fixo" | "parcelado";
  recurringTotal?: number;
  recurringIndex?: number;
  accountId?: string;
  note?: string | null;
  tags?: string | null;
  ignoreInReports?: boolean;
}

// Conta bancária
export interface BankAccount {
  id: string;
  userId: string;
  nick: string;
  bank: string;
  accountType: string;
  last4: string;
  balanceCents: number;
  face?: string | null;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
}

// Resumo para o Dashboard.
export interface FinanceSummary {
  totalReceitasCents: number;
  totalDespesasCents: number;
  totalPendingDespesasCents: number;
  totalCreditoCents: number;
  saldoCents: number;
}
