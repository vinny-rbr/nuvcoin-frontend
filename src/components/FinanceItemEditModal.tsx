import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { financeUpdate } from "../lib/financeService";
import type { FinanceItem, FinanceStatus, PaymentType } from "../types/finance";
import CategoryPicker from "./CategoryPicker";

type FinanceItemEditModalProps = {
  item: FinanceItem;
  categoryOptions: string[];
  onClose: () => void;
  onSaved: (items: FinanceItem[]) => void;
  onDelete?: (id: string) => void;
};

function formatCentsForInput(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseBRLToCents(input: string): number {
  const normalized = input.trim().replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
  const value = Number(normalized || "0");
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * 100);
}

export default function FinanceItemEditModal({ item, categoryOptions, onClose, onSaved, onDelete }: FinanceItemEditModalProps) {
  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState(item.category);
  const [amount, setAmount] = useState(formatCentsForInput(item.amountCents));
  const [dateISO, setDateISO] = useState(item.dateISO);
  const [paymentType, setPaymentType] = useState<PaymentType>(item.paymentType ?? "pix");
  const [status, setStatus] = useState<FinanceStatus>(item.status ?? "paid");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSave() {
    const amountCents = parseBRLToCents(amount);

    if (!title.trim()) {
      setError("Informe um titulo.");
      return;
    }

    if (amountCents <= 0) {
      setError("Informe um valor valido.");
      return;
    }

    setError(null);
    const updated = financeUpdate(item.id, {
      title: title.trim(),
      category,
      amountCents,
      dateISO,
      paymentType,
      status,
    });

    onSaved(updated);
    onClose();
  }

  return createPortal(
    <div className="finance-edit-backdrop" role="presentation" onClick={onClose}>
      <div className="finance-edit-sheet" role="dialog" aria-modal="true" aria-label="Editar lancamento" onClick={(event) => event.stopPropagation()}>
        <div className="categories-composer-head">
          <div>
            <span className="finance-kicker">Lancamento</span>
            <h3>Editar {item.type === "RECEITA" ? "receita" : "despesa"}</h3>
          </div>
          <button type="button" aria-label="Fechar edicao" onClick={onClose}>
            x
          </button>
        </div>

        {error ? <div className="finance-feedback">{error}</div> : null}

        <div className="finance-edit-grid">
          <label className="finance-field">
            <span>Titulo</span>
            <input className="finance-control" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>

          <CategoryPicker label="Categoria" value={category} options={categoryOptions} onChange={setCategory} />

          <label className="finance-field">
            <span>Valor</span>
            <input className="finance-control" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </label>

          <label className="finance-field">
            <span>Data</span>
            <input className="finance-control" type="date" value={dateISO} onChange={(event) => setDateISO(event.target.value)} />
          </label>

          {item.type === "DESPESA" ? (
            <>
              <label className="finance-field">
                <span>Pagamento</span>
                <select className="finance-control" value={paymentType} onChange={(event) => setPaymentType(event.target.value as PaymentType)}>
                  <option value="pix">Pix</option>
                  <option value="debit">Debito</option>
                  <option value="cash">Dinheiro</option>
                  <option value="credit">Credito</option>
                </select>
              </label>

              <label className="finance-field">
                <span>Status</span>
                <select className="finance-control" value={status} onChange={(event) => setStatus(event.target.value as FinanceStatus)}>
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                </select>
              </label>
            </>
          ) : null}
        </div>

        <div className="finance-edit-actions">
          {onDelete ? (
            <button className="finance-danger-button" type="button" onClick={() => onDelete(item.id)}>
              Remover
            </button>
          ) : null}
          <button className="categories-secondary-button" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="finance-primary-button" type="button" onClick={handleSave}>
            Salvar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
