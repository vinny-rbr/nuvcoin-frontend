// Tipo principal: Receita ou Despesa
export type FinanceType = "RECEITA" | "DESPESA";

// Método de pagamento (necessário para separar Crédito depois)
export type PaymentType = "pix" | "debit" | "cash" | "credit";

// Status (opcional mas já preparado)
export type FinanceStatus = "paid" | "pending";

// Categorias
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

// Modelo principal da transação
export interface FinanceItem {
  id: string; // Identificador único
  type: FinanceType; // RECEITA ou DESPESA
  title: string; // Nome da transação
  category: FinanceCategory; // Categoria
  amountCents: number; // Valor sempre positivo (em centavos)
  dateISO: string; // Data principal da transação
  createdAtISO: string; // Data de criação
  paymentType: PaymentType; // pix | debit | cash | credit
  status: FinanceStatus; // paid | pending
}

// Resumo para o Dashboard
export interface FinanceSummary {
  totalReceitasCents: number; // Soma RECEITA
  totalDespesasCents: number; // Soma DESPESA
  totalCreditoCents: number; // Soma DESPESA com paymentType = credit
  saldoCents: number; // receitas - despesas
}

// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com
// Explicação:
// - amountCents sempre positivo.
// - Quem define se soma ou subtrai é o campo "type".
// - Crédito será: type="DESPESA" AND paymentType="credit".
// - Isso evita refatoração futura.