export type FinanceType = "RECEITA" | "DESPESA";

export type FinanceCategory =
  | "Salário"
  | "Freelance"
  | "Vendas"
  | "Alimentação"
  | "Transporte"
  | "Moradia"
  | "Saúde"
  | "Lazer"
  | "Outros";

export interface FinanceItem {
  id: string;
  type: FinanceType;
  title: string;
  category: FinanceCategory;
  amountCents: number;
  dateISO: string;
  createdAtISO: string;
}

export interface FinanceSummary {
  totalReceitasCents: number;
  totalDespesasCents: number;
  saldoCents: number;
}