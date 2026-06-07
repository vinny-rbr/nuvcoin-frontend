import { useEffect, useRef, useState } from "react";

import { financeAdd, financeFlushRecent, financeList, financeRefreshFromApi, financeSubscribe, financeUpdate } from "../lib/financeService";
import { categoriesForType, DEFAULT_CATEGORIES, listFinanceCategories } from "../lib/financeCategoriesService";
import { parseBankFile, toFinanceItem, type OfxParsedItem } from "../lib/ofxImport";
import type { FinanceItem, FinanceStatus } from "../types/finance";

import "./import-extrato.css";

// ── Types ────────────────────────────────────────────────────────────

type WizardStep = "select" | "reading" | "review" | "done";

type ReviewNewItem = {
  parsedItem: OfxParsedItem;
  cat: string;
  dateLabel: string;
  status: FinanceStatus;
  included: boolean;
};

type ReviewDupItem = {
  parsedItem: OfxParsedItem;
  existingId: string;
  type: "RECEITA" | "DESPESA";
  amountCents: number;
  dateLabel: string;
  title: string;
  app: { title: string; cat: string; status: string };
  file: { title: string; cat: string; status: string };
  changes: string[];
  action: "skip" | "keep" | "update";
};

type FileInfo = {
  bank: string;
  bankInitial: string;
  account: string;
  fileName: string;
  period: string;
};

type ImportResult = { added: number; updated: number; skipped: number };

// ── Constants ────────────────────────────────────────────────────────

const READ_STEPS = [
  "Lendo o arquivo…",
  "Identificando o banco…",
  "Extraindo lançamentos…",
  "Comparando com o existente…",
];

const DEMO_PARSED: OfxParsedItem[] = [
  { id: "demo1", type: "DESPESA", title: "Aluguel apartamento", amountCents: 180000, dateISO: "2026-06-01" },
  { id: "demo2", type: "DESPESA", title: "Mercado Extra", amountCents: 28790, dateISO: "2026-06-02" },
  { id: "demo3", type: "RECEITA", title: "Salário — Folha", amountCents: 450000, dateISO: "2026-06-04" },
  { id: "demo4", type: "DESPESA", title: "iFood pedido", amountCents: 5490, dateISO: "2026-06-03" },
  { id: "demo5", type: "DESPESA", title: "Netflix assinatura", amountCents: 3990, dateISO: "2026-06-04" },
  { id: "demo6", type: "DESPESA", title: "Posto Shell combustível", amountCents: 20000, dateISO: "2026-06-05" },
];

// ── Helpers ──────────────────────────────────────────────────────────

function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string): string {
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const [y, m, d] = iso.split("-");
  return `${Number(d)} ${months[Number(m) - 1]} ${y}`;
}

function buildPeriod(items: OfxParsedItem[]): string {
  if (items.length === 0) return "";
  const dates = items.map((i) => i.dateISO).sort();
  const first = dates[0]!;
  const last = dates[dates.length - 1]!;
  return first === last ? fmtDate(first) : `${fmtDate(first)} — ${fmtDate(last)}`;
}

function extractBankInfo(text: string): { bank: string; account: string } {
  const org = text.match(/<ORG>([^\r\n<]+)/i)?.[1]?.trim();
  const acctId = text.match(/<ACCTID>([^\r\n<]+)/i)?.[1]?.trim();
  return {
    bank: org ?? "Extrato",
    account: acctId ? `Conta • final ${acctId.slice(-4)}` : "Conta bancária",
  };
}

function isSimilar(a: string, b: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9 ]/g, "")
      .trim();
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  const shorter = na.length < nb.length ? na : nb;
  const longer = na.length < nb.length ? nb : na;
  return longer.includes(shorter.slice(0, Math.min(shorter.length, 8)));
}

function findExistingMatch(parsed: OfxParsedItem, existing: FinanceItem[]): FinanceItem | null {
  return (
    existing.find(
      (e) =>
        e.dateISO === parsed.dateISO &&
        e.amountCents === parsed.amountCents &&
        e.type === parsed.type &&
        isSimilar(e.title, parsed.title),
    ) ?? null
  );
}

function statusLabel(s: FinanceStatus | string): string {
  return s === "paid" ? "No saldo" : "Na data";
}

// ── SVG Icons ────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function CloudUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 18a4 4 0 010-8 5 5 0 019.6-1.6A3.5 3.5 0 0117 18H7z" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 13v5M9.5 15.5L12 13l2.5 2.5" strokeWidth="1.8" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h15a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" strokeWidth="1.8" />
      <path d="M3 7l2.5-3h9L17 7M16 13h2" strokeWidth="1.8" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" strokeWidth="1.8" />
      <path d="M12 7.5V12l3 2" strokeWidth="1.8" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  );
}

function WarnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l9.5 16.5H2.5L12 3z" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 9.5v4M12 16.5h.01" strokeWidth="1.9" />
    </svg>
  );
}

function SkipIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 5v14M19 5v14M8 12h9M13 8l4 4-4 4" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 12a8.5 8.5 0 0114.8-5.7M20.5 12a8.5 8.5 0 01-14.8 5.7" />
      <path d="M18 3v3.6h-3.6M6 21v-3.6h3.6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 018 0v3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2.5" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  );
}

// ── Stepper ──────────────────────────────────────────────────────────

function Stepper({ step }: { step: WizardStep }) {
  const order: WizardStep[] = ["select", "review", "done"];
  const labels = ["Arquivo", "Revisar", "Pronto"];
  const idx = step === "reading" ? 0 : order.indexOf(step);

  return (
    <div className="ix-stepper">
      {labels.map((label, i) => (
        <div key={label} style={{ display: "contents" }}>
          {i > 0 && (
            <div className={`ix-step-line${i <= idx ? " is-filled" : ""}`}>
              <span />
            </div>
          )}
          <div className={`ix-step${i === idx ? " is-active" : ""}${i < idx ? " is-done" : ""}`}>
            <div className="ix-step-dot">
              {i < idx ? <CheckIcon /> : i + 1}
            </div>
            <div className="ix-step-label">{label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── StatusChoice ─────────────────────────────────────────────────────

function StatusChoice({ value, onChange }: { value: FinanceStatus; onChange: (v: FinanceStatus) => void }) {
  return (
    <div className="ix-seg">
      <button
        type="button"
        className={`ix-seg-opt paid${value === "paid" ? " is-active" : ""}`}
        onClick={() => onChange("paid")}
      >
        <div className="ix-seg-ic"><WalletIcon /></div>
        <strong>Conta no saldo agora</strong>
        <span>Já recebido / pago — entra no saldo atual</span>
        <div className="ix-seg-check"><CheckIcon /></div>
      </button>
      <button
        type="button"
        className={`ix-seg-opt pending${value === "pending" ? " is-active" : ""}`}
        onClick={() => onChange("pending")}
      >
        <div className="ix-seg-ic"><ClockIcon /></div>
        <strong>Só na data prevista</strong>
        <span>A receber / a pagar — conta só no dia</span>
        <div className="ix-seg-check"><CheckIcon /></div>
      </button>
    </div>
  );
}

// ── Step 1 — Select ──────────────────────────────────────────────────

function StepSelect({
  defaultStatus,
  setDefaultStatus,
  onPick,
  onDemo,
}: {
  defaultStatus: FinanceStatus;
  setDefaultStatus: (v: FinanceStatus) => void;
  onPick: (file: File) => void;
  onDemo: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  return (
    <div className="ix-fade">
      <div style={{ marginBottom: 4 }}>
        <span className="ix-kicker">Arquivo bancário</span>
        <h1 className="ix-hero-title">Importar extrato</h1>
        <p className="ix-hero-sub">
          Envie OFX, CSV, XLSX ou PDF do banco. O Conciliaaí lê cada movimento e
          mostra uma prévia antes de lançar.
        </p>
      </div>

      <div
        className={`ix-drop${drag ? " is-drag" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const file = e.dataTransfer.files?.[0];
          if (file) onPick(file);
        }}
      >
        <div className="ix-drop-icon"><CloudUpIcon /></div>
        <div className="ix-drop-title">Arraste o extrato aqui</div>
        <div className="ix-drop-sub">ou toque para escolher do aparelho</div>
        <div className="ix-formats">
          {["OFX", "CSV", "XLSX", "PDF"].map((f) => (
            <span key={f} className="ix-format">{f}</span>
          ))}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".ofx,.OFX,.csv,.CSV,.xlsx,.XLSX,.xls,.XLS,.pdf,.PDF"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onPick(file);
          }}
        />
      </div>

      <button type="button" className="ix-example" onClick={onDemo}>
        Ver com um extrato de exemplo →
      </button>

      <div className="ix-card" style={{ marginTop: 22 }}>
        <div className="ix-field-label">
          Como lançar este extrato?
          <span className="ix-hint">padrão — dá pra ajustar item a item depois</span>
        </div>
        <StatusChoice value={defaultStatus} onChange={setDefaultStatus} />
      </div>
    </div>
  );
}

// ── Step 2 — Reading ─────────────────────────────────────────────────

function StepReading({ progress, stepIdx, fileName }: { progress: number; stepIdx: number; fileName: string }) {
  return (
    <div className="ix-fade">
      <div className="ix-card ix-reading">
        <div className="ix-reading-ic"><CloudUpIcon /></div>
        <h3>Lendo o extrato</h3>
        <p>{fileName}</p>
        <div className="ix-progress">
          <div className="ix-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="ix-reading-step">{READ_STEPS[Math.min(stepIdx, READ_STEPS.length - 1)]}</div>
      </div>
    </div>
  );
}

// ── TxnRow (new item) ─────────────────────────────────────────────────

function TxnRow({
  item,
  onToggleStatus,
}: {
  item: ReviewNewItem;
  onToggleStatus: (id: string) => void;
}) {
  const isIn = item.parsedItem.type === "RECEITA";
  return (
    <div className={`ix-txn${item.included ? "" : " is-excluded"}`}>
      <div className={`ix-txn-ic ${isIn ? "in" : "out"}`}>
        {isIn ? <ArrowUpIcon /> : <ArrowDownIcon />}
      </div>
      <div className="ix-txn-main">
        <div className="ix-txn-title">{item.parsedItem.title}</div>
        <div className="ix-txn-meta">
          <span className="ix-txn-date">{item.dateLabel}</span>
          <span className="ix-badge cat">{item.cat}</span>
        </div>
      </div>
      <div className="ix-txn-right">
        <div className={`ix-txn-amount ${isIn ? "in" : "out"}`}>
          {isIn ? "+" : "−"}{brl(item.parsedItem.amountCents)}
        </div>
        <button
          type="button"
          className={`ix-status-pill ${item.status}`}
          onClick={() => onToggleStatus(item.parsedItem.id)}
          title="Tocar para alternar"
        >
          <span className="pdot" />
          {item.status === "paid" ? "no saldo" : "na data"}
        </button>
      </div>
    </div>
  );
}

// ── DupCard ───────────────────────────────────────────────────────────

function DupCard({
  item,
  onAction,
}: {
  item: ReviewDupItem;
  onAction: (id: string, action: "skip" | "keep" | "update") => void;
}) {
  const isIn = item.type === "RECEITA";
  const rows: { key: "title" | "cat" | "status"; label: string }[] = [
    { key: "title", label: "Nome" },
    { key: "cat", label: "Categoria" },
    { key: "status", label: "Status" },
  ];

  const cell = (side: { title: string; cat: string; status: string }, key: "title" | "cat" | "status") =>
    key === "status" ? statusLabel(side.status) : side[key];

  return (
    <div className="ix-dup">
      <div className="ix-dup-head">
        <div className="ix-dup-warn"><WarnIcon /></div>
        <strong>{item.title}</strong>
        <span className={`ix-dup-amt ${isIn ? "in" : "out"}`}>
          {isIn ? "+" : "−"}{brl(item.amountCents)} · {item.dateLabel}
        </span>
      </div>

      <div className="ix-dup-cols">
        <div className="ix-dup-col app">
          <div className="ix-dup-col-label">
            <span className="ix-tag" />
            No app hoje
          </div>
          {rows.map((r) => (
            <div key={r.key} className="ix-dup-row">
              <span className="k">{r.label}</span>
              <span className="v">{cell(item.app, r.key)}</span>
            </div>
          ))}
        </div>
        <div className="ix-dup-col file">
          <div className="ix-dup-col-label">
            <span className="ix-tag" />
            No arquivo
          </div>
          {rows.map((r) => {
            const changed = item.changes.includes(r.key);
            return (
              <div key={r.key} className={`ix-dup-row${changed ? " changed" : ""}`}>
                <span className="k">{r.label}</span>
                <span className="v">{cell(item.file, r.key)}</span>
                {changed && <span className="ix-diff-flag">novo</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="ix-dup-actions">
        <button
          type="button"
          className={`ix-act skip${item.action === "skip" ? " is-active" : ""}`}
          onClick={() => onAction(item.parsedItem.id, "skip")}
        >
          <SkipIcon /><span>Pular</span>
        </button>
        <button
          type="button"
          className={`ix-act keep${item.action === "keep" ? " is-active" : ""}`}
          onClick={() => onAction(item.parsedItem.id, "keep")}
        >
          <LockIcon /><span>Manter</span>
        </button>
        <button
          type="button"
          className={`ix-act update${item.action === "update" ? " is-active" : ""}`}
          onClick={() => onAction(item.parsedItem.id, "update")}
        >
          <RefreshIcon /><span>Atualizar</span>
        </button>
      </div>
    </div>
  );
}

// ── Step 3 — Review ──────────────────────────────────────────────────

function StepReview({
  fileInfo,
  newItems,
  dupItems,
  defaultStatus,
  applyAll,
  toggleStatus,
  dupAction,
  filterFrom,
  filterTo,
  rangeFrom,
  rangeTo,
  setFilterFrom,
  setFilterTo,
}: {
  fileInfo: FileInfo;
  newItems: ReviewNewItem[];
  dupItems: ReviewDupItem[];
  defaultStatus: FinanceStatus;
  applyAll: (status: FinanceStatus) => void;
  toggleStatus: (id: string) => void;
  dupAction: (id: string, action: "skip" | "keep" | "update") => void;
  filterFrom: string;
  filterTo: string;
  rangeFrom: string;
  rangeTo: string;
  setFilterFrom: (v: string) => void;
  setFilterTo: (v: string) => void;
}) {
  const included = newItems.filter((i) => i.included).length;
  const toUpdate = dupItems.filter((d) => d.action === "update").length;
  const isFiltered = filterFrom !== rangeFrom || filterTo !== rangeTo;

  return (
    <div className="ix-fade">
      <div style={{ marginBottom: 14 }}>
        <span className="ix-kicker">Prévia da importação</span>
        <h1 className="ix-hero-title">Revise antes de lançar</h1>
      </div>

      <div className="ix-bankbar">
        <div className="ix-bank-ic">{fileInfo.bankInitial}</div>
        <div className="ix-bank-info">
          <strong>{fileInfo.bank}</strong>
          <span>{fileInfo.account}{fileInfo.period ? ` · ${fileInfo.period}` : ""}</span>
        </div>
        <span className="ix-bank-file">{fileInfo.fileName}</span>
      </div>

      <div className="ix-datefilter">
        <div className="ix-datefilter-label">
          <CalendarIcon />
          Período a importar
          {isFiltered && (
            <button
              type="button"
              className="ix-datefilter-reset"
              onClick={() => { setFilterFrom(rangeFrom); setFilterTo(rangeTo); }}
            >
              Todos os dias
            </button>
          )}
        </div>
        <div className="ix-datefilter-inputs">
          <div className="ix-datefilter-field">
            <label>De</label>
            <input
              type="date"
              value={filterFrom}
              min={rangeFrom}
              max={filterTo || rangeTo}
              onChange={(e) => setFilterFrom(e.target.value)}
            />
          </div>
          <div className="ix-datefilter-arrow">→</div>
          <div className="ix-datefilter-field">
            <label>Até</label>
            <input
              type="date"
              value={filterTo}
              min={filterFrom || rangeFrom}
              max={rangeTo}
              onChange={(e) => setFilterTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="ix-summary-chips">
        <span className="ix-chip read">
          <span className="dot" />{newItems.length + dupItems.length} lidos
        </span>
        <span className="ix-chip new">
          <span className="dot" />{newItems.length} novos
        </span>
        {dupItems.length > 0 && (
          <span className="ix-chip dup">
            <span className="dot" />{dupItems.length} já existem
          </span>
        )}
      </div>

      {newItems.length > 0 && (
        <div className="ix-applyall">
          <span className="ix-applyall-label">Aplicar a todos os novos:</span>
          <div className="ix-mini-seg">
            <button
              type="button"
              className={`ix-mini-opt paid${defaultStatus === "paid" ? " is-active" : ""}`}
              onClick={() => applyAll("paid")}
            >
              No saldo
            </button>
            <button
              type="button"
              className={`ix-mini-opt pending${defaultStatus === "pending" ? " is-active" : ""}`}
              onClick={() => applyAll("pending")}
            >
              Na data
            </button>
          </div>
        </div>
      )}

      {newItems.length > 0 && (
        <>
          <div className="ix-list-head new">
            <ArrowDownIcon />
            <h4>Novos lançamentos</h4>
            <span className="count">{included}/{newItems.length}</span>
          </div>
          <div className="ix-stagger">
            {newItems.map((i) => (
              <TxnRow key={i.parsedItem.id} item={i} onToggleStatus={toggleStatus} />
            ))}
          </div>
        </>
      )}

      {dupItems.length > 0 && (
        <>
          <div className="ix-list-head dup">
            <WarnIcon />
            <h4>Já existem no app</h4>
            <span className="count">{toUpdate} p/ atualizar</span>
          </div>
          <p style={{ color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.45, margin: "0 2px 12px" }}>
            Mesma data, valor e descrição parecida. Escolha o que fazer com cada um.
          </p>
          <div className="ix-stagger">
            {dupItems.map((d) => (
              <DupCard key={d.parsedItem.id} item={d} onAction={dupAction} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Step 4 — Done ─────────────────────────────────────────────────────

function StepDone({ result, onRestart }: { result: ImportResult; onRestart: () => void }) {
  return (
    <div className="ix-fade ix-done">
      <div className="ix-done-ring"><CheckIcon /></div>
      <h2>Extrato importado!</h2>
      <p>Seus lançamentos já estão no Conciliaaí e o saldo foi atualizado.</p>
      <div className="ix-done-stats">
        <div className="ix-done-stat new">
          <div className="num">{result.added}</div>
          <div className="lbl">NOVOS</div>
        </div>
        <div className="ix-done-stat upd">
          <div className="num">{result.updated}</div>
          <div className="lbl">ATUALIZADOS</div>
        </div>
        <div className="ix-done-stat skip">
          <div className="num">{result.skipped}</div>
          <div className="lbl">PULADOS</div>
        </div>
      </div>
      <button type="button" className="ix-btn-primary" onClick={onRestart}>
        <CloudUpIcon />
        Importar outro extrato
      </button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export default function ImportOfx() {
  const [step, setStep] = useState<WizardStep>("select");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<FinanceStatus>("paid");
  const [readProgress, setReadProgress] = useState(0);
  const [readStepIdx, setReadStepIdx] = useState(0);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [newItems, setNewItems] = useState<ReviewNewItem[]>([]);
  const [dupItems, setDupItems] = useState<ReviewDupItem[]>([]);
  const [importResult, setImportResult] = useState<ImportResult>({ added: 0, updated: 0, skipped: 0 });

  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [rangeFrom, setRangeFrom] = useState("");
  const [rangeTo, setRangeTo] = useState("");

  const [incomeCategories, setIncomeCategories] = useState<string[]>(DEFAULT_CATEGORIES.RECEITA);
  const [expenseCategories, setExpenseCategories] = useState<string[]>(DEFAULT_CATEGORIES.DESPESA);
  const [existingItems, setExistingItems] = useState<FinanceItem[]>([]);

  // Load existing items + categories once
  useEffect(() => {
    setExistingItems(financeList());
    void financeRefreshFromApi().then(setExistingItems).catch(() => undefined);
    const unsub = financeSubscribe(() => setExistingItems(financeList()));
    return unsub;
  }, []);

  useEffect(() => {
    let active = true;
    void listFinanceCategories()
      .then((cats) => {
        if (!active) return;
        setIncomeCategories(categoriesForType(cats, "RECEITA"));
        setExpenseCategories(categoriesForType(cats, "DESPESA"));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  // Reading step: animate progress + parse file
  useEffect(() => {
    if (step !== "reading") return;

    let cancelled = false;
    let p = 0;
    const tick = setInterval(() => {
      p += 3 + Math.random() * 5;
      const clamped = Math.min(95, p); // cap at 95 until parse done
      setReadProgress(clamped);
      setReadStepIdx(Math.min(READ_STEPS.length - 1, Math.floor((clamped / 100) * READ_STEPS.length)));
    }, 110);

    const categories = {
      income: incomeCategories.length > 0 ? incomeCategories : ["Outros"],
      expense: expenseCategories.length > 0 ? expenseCategories : ["Outros"],
    };

    async function doparse() {
      let parsed: OfxParsedItem[] = [];
      let info: FileInfo = {
        bank: "Extrato",
        bankInitial: "E",
        account: "Conta bancária",
        fileName: "exemplo.ofx",
        period: "",
      };

      try {
        if (isDemo) {
          parsed = DEMO_PARSED;
          info = {
            bank: "Banco Demo",
            bankInitial: "D",
            account: "Conta corrente • final 0000",
            fileName: "extrato_demo.ofx",
            period: buildPeriod(parsed),
          };
          await new Promise((r) => setTimeout(r, 1200)); // let animation run
        } else if (pendingFile) {
          const ext = pendingFile.name.split(".").pop()?.toLowerCase();
          let rawText: string | undefined;
          if (ext === "ofx" || ext === "csv") {
            rawText = await pendingFile.text();
          }
          const { items } = await parseBankFile(pendingFile);
          parsed = items;

          let bank = "Extrato";
          let account = "Conta bancária";
          if (rawText) {
            const extracted = extractBankInfo(rawText);
            bank = extracted.bank;
            account = extracted.account;
          }
          info = {
            bank,
            bankInitial: bank.charAt(0).toUpperCase(),
            account,
            fileName: pendingFile.name,
            period: buildPeriod(parsed),
          };
        }
      } catch {
        // parse error — still proceed to review with empty list
      }

      if (cancelled) return;

      clearInterval(tick);
      setReadProgress(100);
      setReadStepIdx(READ_STEPS.length - 1);

      // Separate new vs duplicate
      const newList: ReviewNewItem[] = [];
      const dupList: ReviewDupItem[] = [];

      for (const p of parsed) {
        const match = findExistingMatch(p, existingItems);
        if (match) {
          const fileItem = toFinanceItem(p, categories);
          const appCat = match.category;
          const fileCat = fileItem.category;
          const appStatus = match.status;
          const fileStatus = defaultStatus;
          const changes: string[] = [];
          if (appCat !== fileCat) changes.push("cat");
          if (appStatus !== fileStatus) changes.push("status");
          if (match.title.trim().toLowerCase() !== p.title.trim().toLowerCase()) changes.push("title");
          dupList.push({
            parsedItem: p,
            existingId: match.id,
            type: p.type,
            amountCents: p.amountCents,
            dateLabel: fmtDate(p.dateISO),
            title: p.title,
            app: { title: match.title, cat: appCat, status: appStatus },
            file: { title: p.title, cat: fileCat, status: fileStatus },
            changes,
            action: changes.length > 0 ? "update" : "keep",
          });
        } else {
          const fi = toFinanceItem(p, categories);
          newList.push({
            parsedItem: p,
            cat: fi.category,
            dateLabel: fmtDate(p.dateISO),
            status: defaultStatus,
            included: true,
          });
        }
      }

      const allDates = [...newList, ...dupList].map((i) => i.parsedItem.dateISO).sort();
      const minDate = allDates[0] ?? "";
      const maxDate = allDates[allDates.length - 1] ?? "";
      setRangeFrom(minDate);
      setRangeTo(maxDate);
      setFilterFrom(minDate);
      setFilterTo(maxDate);

      setFileInfo(info);
      setNewItems(newList);
      setDupItems(dupList);

      setTimeout(() => {
        if (!cancelled) setStep("review");
      }, 300);
    }

    void doparse();
    return () => { cancelled = true; clearInterval(tick); };
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ────────────────────────────────

  function pickFile(file: File) {
    setPendingFile(file);
    setIsDemo(false);
    setReadProgress(0);
    setReadStepIdx(0);
    setStep("reading");
  }

  function startDemo() {
    setPendingFile(null);
    setIsDemo(true);
    setReadProgress(0);
    setReadStepIdx(0);
    setStep("reading");
  }

  function toggleStatus(id: string) {
    setNewItems((arr) =>
      arr.map((i) =>
        i.parsedItem.id === id
          ? { ...i, status: i.status === "paid" ? "pending" : "paid" }
          : i,
      ),
    );
  }

  function applyAll(status: FinanceStatus) {
    setDefaultStatus(status);
    setNewItems((arr) => arr.map((i) => ({ ...i, status })));
  }

  function setDupAction(id: string, action: "skip" | "keep" | "update") {
    setDupItems((arr) => arr.map((d) => (d.parsedItem.id === id ? { ...d, action } : d)));
  }

  function confirmImport() {
    if (isDemo) {
      const added = filteredNew.filter((i) => i.included).length;
      const updated = filteredDup.filter((d) => d.action === "update").length;
      const skipped = filteredDup.filter((d) => d.action === "skip").length;
      setImportResult({ added, updated, skipped });
      setStep("done");
      return;
    }

    const categories = {
      income: incomeCategories.length > 0 ? incomeCategories : ["Outros"],
      expense: expenseCategories.length > 0 ? expenseCategories : ["Outros"],
    };

    for (const item of filteredNew) {
      if (!item.included) continue;
      const fi = { ...toFinanceItem(item.parsedItem, categories), status: item.status };
      financeAdd(fi);
    }

    for (const dup of filteredDup) {
      if (dup.action !== "update") continue;
      const fi = toFinanceItem(dup.parsedItem, categories);
      financeUpdate(dup.existingId, {
        title: fi.title,
        category: fi.category,
        status: dup.file.status as FinanceStatus,
      });
    }

    const added = filteredNew.filter((i) => i.included).length;
    const updated = filteredDup.filter((d) => d.action === "update").length;
    const skipped = filteredDup.filter((d) => d.action === "skip").length;
    setImportResult({ added, updated, skipped });
    setStep("done");
  }

  function restart() {
    financeFlushRecent();
    setPendingFile(null);
    setIsDemo(false);
    setReadProgress(0);
    setReadStepIdx(0);
    setFileInfo(null);
    setNewItems([]);
    setDupItems([]);
    setFilterFrom("");
    setFilterTo("");
    setRangeFrom("");
    setRangeTo("");
    setStep("select");
  }

  const filteredNew = newItems.filter(
    (i) =>
      (!filterFrom || i.parsedItem.dateISO >= filterFrom) &&
      (!filterTo || i.parsedItem.dateISO <= filterTo),
  );
  const filteredDup = dupItems.filter(
    (d) =>
      (!filterFrom || d.parsedItem.dateISO >= filterFrom) &&
      (!filterTo || d.parsedItem.dateISO <= filterTo),
  );

  const addedCount = filteredNew.filter((i) => i.included).length;
  const updCount = filteredDup.filter((d) => d.action === "update").length;

  return (
    <div className="ix-wrap">
      <Stepper step={step} />

      {step === "select" && (
        <StepSelect
          defaultStatus={defaultStatus}
          setDefaultStatus={setDefaultStatus}
          onPick={pickFile}
          onDemo={startDemo}
        />
      )}

      {step === "reading" && (
        <StepReading
          progress={readProgress}
          stepIdx={readStepIdx}
          fileName={isDemo ? "extrato_demo.ofx" : (pendingFile?.name ?? "…")}
        />
      )}

      {step === "review" && fileInfo && (
        <StepReview
          fileInfo={fileInfo}
          newItems={filteredNew}
          dupItems={filteredDup}
          defaultStatus={defaultStatus}
          applyAll={applyAll}
          toggleStatus={toggleStatus}
          dupAction={setDupAction}
          filterFrom={filterFrom}
          filterTo={filterTo}
          rangeFrom={rangeFrom}
          rangeTo={rangeTo}
          setFilterFrom={setFilterFrom}
          setFilterTo={setFilterTo}
        />
      )}

      {step === "done" && (
        <StepDone result={importResult} onRestart={restart} />
      )}

      {step === "review" && (
        <div className="ix-footer">
          <div className="ix-footer-inner">
            <button
              type="button"
              className="ix-btn-primary"
              onClick={confirmImport}
              disabled={addedCount + updCount === 0}
            >
              <CheckIcon />
              {addedCount + updCount === 0
                ? "Nada para lançar"
                : `Lançar ${addedCount} ${addedCount === 1 ? "novo" : "novos"}${updCount > 0 ? ` · atualizar ${updCount}` : ""}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
