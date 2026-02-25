export type TransactionType = "income" | "expense"; // Define se é receita ou despesa

export type PaymentType = "pix" | "debit" | "cash" | "credit"; // Método de pagamento (mantendo paymentType)

export type TransactionStatus = "paid" | "pending"; // Status básico (Pago / A pagar)

export type Transaction = {
  id: string; // Identificador único da transação
  userId: string; // Dono da transação (mesmo no mock, já deixa pronto)
  date: string; // Data em ISO (ex: "2026-02-24")
  description: string; // Descrição (ex: "Mercado", "Salário")
  amountCents: number; // Valor em centavos (sempre positivo)
  type: TransactionType; // "income" ou "expense"
  paymentType: PaymentType; // "pix" | "debit" | "cash" | "credit"
  categoryId: string; // Categoria (ex: "food", "salary")
  accountId?: string; // Conta (opcional no V1)
  status: TransactionStatus; // "paid" ou "pending"
};

// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com
// Explicação: este é o modelo V1 mínimo pra separar Receita/Despesa e também "Crédito" via paymentType="credit".
// Regra: amountCents sempre positivo; o que define o sinal/cálculo é o campo type.