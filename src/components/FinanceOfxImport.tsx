import { useRef, useState, type ChangeEvent } from "react";

import { financeAdd, financeRefreshFromApi } from "../lib/financeService";
import { parseBankFile, toFinanceItem } from "../lib/ofxImport";
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
    setMessage("Lendo arquivo bancario...");

    try {
      const { kind, items: parsed } = await parseBankFile(file);

      if (parsed.length === 0) {
        setMessage(`Nao encontrei lancamentos validos nesse arquivo ${kind}.`);
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
      setMessage(`Importacao ${kind} iniciada: ${parsed.length} lancamento(s) encontrados. Atualizando o banco...`);

      window.setTimeout(() => {
        void financeRefreshFromApi()
          .then(onImported)
          .catch(() => undefined);
      }, Math.min(1800, Math.max(700, parsed.length * 120)));
    } catch {
      setMessage("Nao foi possivel importar este arquivo. Confira se ele esta em OFX, CSV, XLSX ou PDF.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div className="chart-card finance-panel finance-import-panel">
      <div className="finance-section-heading">
        <div>
          <span className="finance-kicker">Importacao bancaria</span>
          <h3>Importar extrato</h3>
        </div>
      </div>

      <div className="finance-import-content">
        <p>Selecione um extrato OFX, CSV, XLSX ou PDF para lancar automaticamente receitas e despesas.</p>

        <input
          ref={inputRef}
          type="file"
          accept=".ofx,.OFX,.csv,.CSV,.xlsx,.XLSX,.xls,.XLS,.pdf,.PDF,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/octet-stream,text/plain"
          hidden
          onChange={handleFileChange}
        />

        <button className="finance-secondary-action" type="button" disabled={isImporting} onClick={() => inputRef.current?.click()}>
          {isImporting ? "Importando..." : "Escolher arquivo"}
        </button>
      </div>

      {message ? <div className="finance-feedback finance-import-feedback">{message}</div> : null}
    </div>
  );
}
