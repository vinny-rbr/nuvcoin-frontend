import { useRef, useState, type ChangeEvent } from "react";

import { financeAdd, financeRefreshFromApi } from "../lib/financeService";
import { parseOfx, toFinanceItem } from "../lib/ofxImport";
import type { FinanceItem } from "../types/finance";

type FinanceOfxImportProps = {
  incomeCategory: string;
  expenseCategory: string;
  onImported: (items: FinanceItem[]) => void;
};

export default function FinanceOfxImport({ incomeCategory, expenseCategory, onImported }: FinanceOfxImportProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setIsImporting(true);
    setMessage("Lendo arquivo OFX...");

    try {
      const text = await file.text();
      const parsed = parseOfx(text);

      if (parsed.length === 0) {
        setMessage("Nao encontrei lancamentos validos nesse OFX.");
        return;
      }

      let updated = [] as FinanceItem[];

      for (const parsedItem of parsed) {
        updated = financeAdd(
          toFinanceItem(parsedItem, {
            income: incomeCategory || "Outros",
            expense: expenseCategory || "Outros",
          }),
        );
      }

      onImported(updated);
      setMessage(`Importacao iniciada: ${parsed.length} lancamento(s) encontrados. Atualizando o banco...`);

      window.setTimeout(() => {
        void financeRefreshFromApi()
          .then(onImported)
          .catch(() => undefined);
      }, Math.min(1800, Math.max(700, parsed.length * 120)));
    } catch {
      setMessage("Nao foi possivel importar este arquivo. Confira se ele esta no formato OFX.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="chart-card finance-panel finance-import-panel">
      <div className="finance-section-heading">
        <div>
          <span className="finance-kicker">Importacao bancaria</span>
          <h3>Importar OFX</h3>
        </div>
      </div>

      <div className="finance-import-content">
        <p>Selecione o arquivo OFX exportado pelo banco para lancar automaticamente receitas e despesas.</p>

        <input ref={inputRef} type="file" accept=".ofx,.OFX,application/octet-stream,text/plain" hidden onChange={handleFileChange} />

        <button className="finance-secondary-action" type="button" disabled={isImporting} onClick={() => inputRef.current?.click()}>
          {isImporting ? "Importando..." : "Escolher arquivo OFX"}
        </button>
      </div>

      {message ? <div className="finance-feedback finance-import-feedback">{message}</div> : null}
    </div>
  );
}
