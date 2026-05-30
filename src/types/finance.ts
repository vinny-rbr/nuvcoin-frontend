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
}

// Resumo para o Dashboard.
export interface FinanceSummary {
  totalReceitasCents: number;
  totalDespesasCents: number;
  totalCreditoCents: number;
  saldoCents: number;
}
