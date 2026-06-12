import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { financeAdd, financeFlushRecent, financeList, financeRefreshFromApi, financeSubscribe, financeUpdate, makeId } from "../lib/financeService";
import { categoriesForType, DEFAULT_CATEGORIES, listFinanceCategories } from "../lib/financeCategoriesService";
import { parseBankFile, toFinanceItem, type OfxParsedItem, type LedgerBal, type PdfProgress } from "../lib/ofxImport";
import BankAccountChips from "../components/BankAccountChips";
import type { BankAccount, FinanceItem, FinanceStatus } from "../types/finance";

import "./import-extrato.css";

// ── Types ────────────────────────────────────────────────────────────

type WizardStep = "select" | "reading" | "review" | "adjust" | "done";

type ReviewNewItem = {
  parsedItem: OfxParsedItem;
  cat: string;
  catSource: "auto" | "learned" | "none";
  merchantKey: string;
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

// ── Category memory ──────────────────────────────────────────────────

const CAT_MEM_KEY = "nuv_ofx_cat_memory_v1";

function loadCatMemory(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(CAT_MEM_KEY) || "null") || {}; }
  catch { return {}; }
}

function saveCatMemory(m: Record<string, string>): void {
  try { localStorage.setItem(CAT_MEM_KEY, JSON.stringify(m)); } catch {}
}

function extractMerchantKey(title: string): string {
  return title
    .toUpperCase()
    .replace(/COMPRA NO (D[ÉE]BITO|CR[ÉE]DITO)\s*[-–—]\s*/i, "")
    .replace(/TRANSFER[ÊE]NCIA (ENVIADA|RECEBIDA) PELO PIX\s*[-–—]\s*/i, "")
    .replace(/PAGAMENTO\s+DE\s+/i, "")
    .replace(/MP \*/i, "")
    .replace(/\d{2}\/\d{2}/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

const CAT_PALETTE = [
  "#FB7185","#38BDF8","#FBBF24","#A78BFA","#34D399",
  "#C084FC","#F472B6","#94A3B8","#60A5FA","#F97316","#2DD4BF",
];
function catDotColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return CAT_PALETTE[h % CAT_PALETTE.length]!;
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

function TagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5V5a2 2 0 012-2h6.5a2 2 0 011.4.6l7.5 7.5a2 2 0 010 2.8l-6.5 6.5a2 2 0 01-2.8 0L3.6 12.9A2 2 0 013 11.5z" />
      <circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.8 4.8L18.5 9l-4.7 1.2L12 15l-1.8-4.8L5.5 9l4.7-1.2L12 3z" />
    </svg>
  );
}

function PencilSmIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}

// ── CatChip ───────────────────────────────────────────────────────────

function CatChip({ item }: { item: ReviewNewItem }) {
  if (item.catSource === "none") {
    return <span className="cat-chip none"><TagIcon />Escolher categoria</span>;
  }
  if (item.catSource === "learned") {
    return (
      <span className="cat-chip learned">
        <span className="cdot" style={{ background: catDotColor(item.cat) }} />
        {item.cat}
        <SparkIcon />
      </span>
    );
  }
  return (
    <span className="cat-chip auto">
      <span className="cdot" style={{ background: catDotColor(item.cat) }} />
      {item.cat}
      <PencilSmIcon />
    </span>
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
  selectedAccount,
  onAccountChange,
  onPick,
  onDemo,
}: {
  defaultStatus: FinanceStatus;
  setDefaultStatus: (v: FinanceStatus) => void;
  selectedAccount: BankAccount | null;
  onAccountChange: (a: BankAccount | null) => void;
  onPick: (files: File[]) => void;
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
          const files = Array.from(e.dataTransfer.files ?? []);
          if (files.length > 0) onPick(files);
        }}
      >
        <div className="ix-drop-icon"><CloudUpIcon /></div>
        <div className="ix-drop-title">Arraste os extratos aqui</div>
        <div className="ix-drop-sub">ou toque para escolher — pode selecionar vários de uma vez</div>
        <div className="ix-formats">
          {["OFX", "CSV", "XLSX", "PDF"].map((f) => (
            <span key={f} className="ix-format">{f}</span>
          ))}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".ofx,.OFX,.csv,.CSV,.xlsx,.XLSX,.xls,.XLS,.pdf,.PDF"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            e.target.value = "";
            if (files.length > 0) onPick(files);
          }}
        />
      </div>

      <button type="button" className="ix-example" onClick={onDemo}>
        Ver com um extrato de exemplo →
      </button>

      <div className="ix-card" style={{ marginTop: 22 }}>
        <div className="ix-field-label" style={{ marginBottom: 8 }}>
          Jogar os lançamentos em qual conta?
          <span className="ix-hint">opcional — vincula ao saldo do banco</span>
        </div>
        <BankAccountChips selectedId={selectedAccount?.id ?? null} onChange={onAccountChange} />
      </div>

      <div className="ix-card" style={{ marginTop: 14 }}>
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

function StepReading({ progress, stepIdx, fileName, pdfMsg }: { progress: number; stepIdx: number; fileName: string; pdfMsg?: string }) {
  return (
    <div className="ix-fade">
      <div className="ix-card ix-reading">
        <div className="ix-reading-ic"><CloudUpIcon /></div>
        <h3>Lendo o extrato</h3>
        <p>{fileName}</p>
        <div className="ix-progress">
          <div className="ix-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="ix-reading-step">
          {pdfMsg ?? READ_STEPS[Math.min(stepIdx, READ_STEPS.length - 1)]}
        </div>
        {pdfMsg && (
          <div className="ix-reading-hint">PDFs de imagem levam mais tempo — o app está lendo cada página</div>
        )}
      </div>
    </div>
  );
}

// ── TxnRow (new item) ─────────────────────────────────────────────────

function TxnRow({
  item,
  onOpen,
  onToggle,
}: {
  item: ReviewNewItem;
  onOpen: (item: ReviewNewItem) => void;
  onToggle: (id: string) => void;
}) {
  const isIn = item.parsedItem.type === "RECEITA";
  return (
    <div className={`ix-txn-wrap${item.included ? "" : " is-excluded"}`}>
      <button
        type="button"
        className={`ix-txn-check${item.included ? " on" : ""}`}
        onClick={() => onToggle(item.parsedItem.id)}
        aria-label={item.included ? "Desmarcar" : "Incluir na importação"}
      >
        {item.included && (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        )}
      </button>
      <button
        type="button"
        className="ix-txn"
        onClick={() => onOpen(item)}
      >
        <div className={`ix-txn-ic ${isIn ? "in" : "out"}`}>
          {isIn ? <ArrowUpIcon /> : <ArrowDownIcon />}
        </div>
        <div className="ix-txn-main">
          <div className="ix-txn-title">{item.parsedItem.title}</div>
          <div className="ix-txn-meta">
            <span className="ix-txn-date">{item.dateLabel}</span>
            <CatChip item={item} />
          </div>
        </div>
        <div className="ix-txn-right">
          <div className={`ix-txn-amount ${isIn ? "in" : "out"}`}>
            {isIn ? "+" : "−"}{brl(item.parsedItem.amountCents)}
          </div>
          <span className={`ix-status-pill ${item.status}`}>
            <span className="pdot" />
            {item.status === "paid" ? "no saldo" : "na data"}
          </span>
        </div>
      </button>
    </div>
  );
}

// ── CategorySheet ─────────────────────────────────────────────────────

function CategorySheet({
  item,
  categories,
  memory,
  onClose,
  onSave,
  sameMerchantCount,
}: {
  item: ReviewNewItem;
  categories: string[];
  memory: Record<string, string>;
  onClose: () => void;
  onSave: (cat: string, applyToAll: boolean, remember: boolean) => void;
  sameMerchantCount: number;
}) {
  const [sel, setSel] = useState<string>(item.cat || "");
  const [remember, setRemember] = useState(true);
  const [prefix, setPrefix] = useState<string[]>([]);
  const isIn = item.parsedItem.type === "RECEITA";
  const mKey = item.merchantKey;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  function splitPath(v: string) {
    return v.split(">").map((p) => p.trim()).filter(Boolean);
  }

  const normalizedOptions = useMemo(
    () =>
      Array.from(new Set(categories))
        .map((v) => ({ value: v, parts: splitPath(v) }))
        .filter((o) => o.parts.length > 0)
        .sort((a, b) => a.value.localeCompare(b.value)),
    [categories],
  );

  const visibleOptions = useMemo(() => {
    const nextLevel = prefix.length + 1;
    return normalizedOptions.filter((o) => {
      if (o.parts.length !== nextLevel) return false;
      return prefix.every((p, i) => o.parts[i] === p);
    });
  }, [normalizedOptions, prefix]);

  function hasChildren(parts: string[]): boolean {
    return normalizedOptions.some((o) => {
      if (o.parts.length <= parts.length) return false;
      return parts.every((p, i) => o.parts[i] === p);
    });
  }

  const selLeaf = sel ? splitPath(sel).at(-1) ?? sel : "";

  return createPortal(
    <div className="import-sheet-scrim" onClick={onClose}>
      <div className="import-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="import-sheet-handle" />

        <div className="import-sheet-head">
          <div className={`h-ic ${isIn ? "in" : "out"}`}>
            {isIn ? <ArrowUpIcon /> : <ArrowDownIcon />}
          </div>
          <div className="h-info">
            <span className="kick">{item.dateLabel}</span>
            <strong>{item.parsedItem.title}</strong>
          </div>
          <span className={`h-amt ${isIn ? "in" : "out"}`}>
            {isIn ? "+" : "−"}{brl(item.parsedItem.amountCents)}
          </span>
        </div>

        <div className="import-sheet-section-label" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 18 }}>
          <span>{prefix.length > 0 ? `Dentro de ${prefix.at(-1)}` : "Categoria deste lançamento"}</span>
          {prefix.length > 0 && (
            <button
              type="button"
              className="import-sheet-back"
              onClick={() => setPrefix((p) => p.slice(0, -1))}
            >
              ← Voltar
            </button>
          )}
        </div>

        <div className="import-catlist">
          {visibleOptions.map((opt) => {
            const leaf = !hasChildren(opt.parts);
            const name = opt.parts.at(-1) ?? opt.value;
            const selected = sel === opt.value;
            const isLearned = memory[mKey] === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`import-catrow${selected ? " is-selected" : ""}`}
                onClick={() => {
                  if (!leaf) { setPrefix(opt.parts); return; }
                  setSel(opt.value);
                }}
              >
                <div className="cr-dot" style={{ background: catDotColor(name) + "22" }}>
                  <i style={{ background: catDotColor(name) }} />
                </div>
                <div className="cr-name">
                  <strong>{name}</strong>
                  {!leaf && <span style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>Toque para ver subcategorias</span>}
                </div>
                {isLearned && leaf && <span className="cr-badge">memorizado</span>}
                {leaf
                  ? <div className="cr-pick"><CheckIcon /></div>
                  : <span className="cr-chevron">›</span>
                }
              </button>
            );
          })}
        </div>

        <div
          className="import-remember"
          onClick={() => setRemember((r) => !r)}
        >
          <div className="rm-ic"><SparkIcon /></div>
          <div className="rm-txt">
            <strong>Lembrar dessa escolha</strong>
            <span>
              Toda compra em <b>{mKey || item.parsedItem.title.slice(0, 20)}</b> vira{" "}
              <b>{selLeaf || "…"}</b> automaticamente nos próximos meses.
            </span>
          </div>
          <div className={`import-switch${remember ? " on" : ""}`}><i /></div>
        </div>

        <div className="import-sheet-foot">
          {sameMerchantCount > 1 ? (
            <div style={{ display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12, color: "var(--text-2)", textAlign: "center", padding: "0 4px" }}>
                Existem <strong>{sameMerchantCount}</strong> transações com <strong>&ldquo;{mKey}&rdquo;</strong> neste extrato
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button
                  type="button"
                  className="ix-btn-secondary"
                  disabled={!sel}
                  style={{ opacity: sel ? 1 : 0.5 }}
                  onClick={() => onSave(sel, false, remember)}
                >
                  Só este
                </button>
                <button
                  type="button"
                  className="ix-btn-primary"
                  disabled={!sel}
                  style={{ opacity: sel ? 1 : 0.5 }}
                  onClick={() => onSave(sel, true, remember)}
                >
                  Aplicar aos {sameMerchantCount}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="ix-btn-primary"
              disabled={!sel}
              style={{ opacity: sel ? 1 : 0.5 }}
              onClick={() => onSave(sel, false, remember)}
            >
              <CheckIcon />
              Salvar categoria
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
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
  dupAction,
  filterFrom,
  filterTo,
  rangeFrom,
  rangeTo,
  setFilterFrom,
  setFilterTo,
  incomeCategories,
  expenseCategories,
  memory,
  onSetCat,
  onToggle,
}: {
  fileInfo: FileInfo;
  newItems: ReviewNewItem[];
  dupItems: ReviewDupItem[];
  defaultStatus: FinanceStatus;
  applyAll: (status: FinanceStatus) => void;
  dupAction: (id: string, action: "skip" | "keep" | "update") => void;
  filterFrom: string;
  filterTo: string;
  rangeFrom: string;
  rangeTo: string;
  setFilterFrom: (v: string) => void;
  setFilterTo: (v: string) => void;
  incomeCategories: string[];
  expenseCategories: string[];
  memory: Record<string, string>;
  onSetCat: (id: string, cat: string, mKey: string, applyToAll: boolean, remember: boolean) => void;
  onToggle: (id: string) => void;
}) {
  const [editing, setEditing] = useState<ReviewNewItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flash(msg: string) {
    setToast(msg);
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 3200);
  }

  function handleSave(cat: string, applyToAll: boolean, remember: boolean) {
    if (!editing) return;
    onSetCat(editing.parsedItem.id, cat, editing.merchantKey, applyToAll, remember);
    setEditing(null);
    const n = newItems.filter((i) => i.merchantKey === editing.merchantKey).length;
    if (applyToAll && n > 1) {
      flash(`"${cat}" aplicada a ${n} transações de "${editing.merchantKey}"${remember ? " — memorizada p/ os próximos meses" : ""}.`);
    } else if (remember) {
      flash(`"${cat}" definida e memorizada p/ os próximos meses.`);
    } else {
      flash(`Categoria "${cat}" definida neste lançamento.`);
    }
  }

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
        <div className="ix-bankbar-top">
          <div className="ix-bank-ic">{fileInfo.bankInitial}</div>
          <div className="ix-bank-info">
            <strong>{fileInfo.bank}</strong>
            <span>{fileInfo.account}</span>
          </div>
          {fileInfo.period && <span className="ix-bank-period">{fileInfo.period}</span>}
        </div>
        <div className="ix-bank-file-row">
          <DocIcon />
          <span>{fileInfo.fileName}</span>
        </div>
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
        <span className="ix-chip learned">
          <span className="dot" />{newItems.filter(i => i.catSource === "learned").length} memorizados
        </span>
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
              <TxnRow
                key={i.parsedItem.id}
                item={i}
                onOpen={setEditing}
                onToggle={onToggle}
              />
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

      {editing && (
        <CategorySheet
          item={editing}
          categories={editing.parsedItem.type === "RECEITA" ? incomeCategories : expenseCategories}
          memory={memory}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          sameMerchantCount={newItems.filter((i) => i.merchantKey === editing.merchantKey).length}
        />
      )}

      {toast && createPortal(
        <div className="import-toast">
          <div className="t-ic"><CheckIcon /></div>
          <div className="t-txt">{toast}</div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ── Step 3b — Adjust ─────────────────────────────────────────────────

function StepAdjust({
  info,
  onApply,
  onSkip,
}: {
  info: { bankCents: number; appCents: number; dateISO: string };
  onApply: () => void;
  onSkip: () => void;
}) {
  const diff = info.bankCents - info.appCents;
  const absDiff = Math.abs(diff);
  const months = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  const [y, m, d] = info.dateISO.split("-");
  const dateLabel = `${Number(d)} ${months[Number(m) - 1]} ${y}`;

  return (
    <div className="ix-fade">
      <div className="ix-card" style={{ textAlign: "center", padding: "28px 20px 24px" }}>
        <div style={{
          width: 52, height: 52, borderRadius: 16, margin: "0 auto 16px",
          background: "rgba(245,158,11,.15)", border: "1px solid rgba(245,158,11,.3)",
          display: "grid", placeItems: "center", color: "#fbbf24",
        }}>
          <WarnIcon />
        </div>
        <h3 style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 700, margin: "0 0 10px" }}>
          Diferença de saldo detectada
        </h3>
        <p style={{ color: "var(--text-2)", fontSize: 13, lineHeight: 1.55, margin: "0 0 20px" }}>
          O banco informa saldo de <strong style={{ color: "#f1f5f9" }}>{brl(info.bankCents)}</strong> em {dateLabel}.
          O app calculou <strong style={{ color: "#f1f5f9" }}>{brl(info.appCents)}</strong>.
        </p>

        <div style={{
          padding: "14px 16px", borderRadius: 14, marginBottom: 20,
          background: diff > 0 ? "rgba(34,197,94,.1)" : "rgba(239,68,68,.1)",
          border: `1px solid ${diff > 0 ? "rgba(74,222,128,.25)" : "rgba(248,113,113,.25)"}`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".04em", color: "var(--text-2)", marginBottom: 4 }}>
            LANÇAMENTO DE AJUSTE
          </div>
          <div style={{ fontFamily: "var(--display)", fontSize: 22, fontWeight: 700, color: diff > 0 ? "#4ade80" : "#f87171" }}>
            {diff > 0 ? "+" : "−"}{brl(absDiff)}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>
            "{diff > 0 ? "Receita" : "Despesa"}" · Saldo inicial — ajuste de importação · {dateLabel}
          </div>
        </div>

        <button type="button" className="ix-btn-primary" onClick={onApply} style={{ marginBottom: 10 }}>
          <CheckIcon />
          Criar ajuste e finalizar
        </button>
        <button type="button" className="ix-btn-ghost" onClick={onSkip}>
          Pular — não criar ajuste
        </button>
      </div>
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
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<FinanceStatus>("paid");
  const [readProgress, setReadProgress] = useState(0);
  const [readStepIdx, setReadStepIdx] = useState(0);
  const [pdfMsg, setPdfMsg] = useState<string | undefined>(undefined);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [newItems, setNewItems] = useState<ReviewNewItem[]>([]);
  const [dupItems, setDupItems] = useState<ReviewDupItem[]>([]);
  const [importResult, setImportResult] = useState<ImportResult>({ added: 0, updated: 0, skipped: 0 });
  const [ledgerBal, setLedgerBal] = useState<LedgerBal | null>(null);
  const [adjustInfo, setAdjustInfo] = useState<{ bankCents: number; appCents: number; dateISO: string } | null>(null);
  const [catMemory, setCatMemory] = useState<Record<string, string>>(loadCatMemory);

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
    let tickStopped = false;
    const tick = setInterval(() => {
      if (tickStopped) return;
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
        } else if (pendingFiles.length > 0) {
          let bank = "Extrato";
          let account = "Conta bancária";
          const totalFiles = pendingFiles.length;

          for (let fi = 0; fi < totalFiles; fi++) {
            if (cancelled) break;
            const file = pendingFiles[fi];
            if (totalFiles > 1) {
              setPdfMsg(`Arquivo ${fi + 1} de ${totalFiles} — lendo…`);
            }

            const fileOnPdfProgress = (pr: PdfProgress) => {
              tickStopped = true;
              const fileBase = fi / totalFiles;
              const fileShare = 1 / totalFiles;
              const overall = Math.round((fileBase + fileShare * (pr.percent / 100)) * 100);
              setReadProgress(overall);
              const prefix = totalFiles > 1 ? `Arquivo ${fi + 1} de ${totalFiles} — ` : "";
              if (pr.phase === "loading") {
                setPdfMsg(`${prefix}Preparando leitura do PDF…`);
              } else {
                setPdfMsg(`${prefix}Página ${pr.page} de ${pr.totalPages} ${pr.page < pr.totalPages ? `lida, lendo ${pr.page + 1}…` : "— finalizando…"}`);
              }
            };

            const ext = file.name.split(".").pop()?.toLowerCase();
            let rawText: string | undefined;
            if (ext === "ofx" || ext === "csv") rawText = await file.text();

            const { items, ledgerBal: lb } = await parseBankFile(file, { onPdfProgress: fileOnPdfProgress });
            parsed = [...parsed, ...items];
            if (lb) setLedgerBal(lb);

            if (rawText && bank === "Extrato") {
              const extracted = extractBankInfo(rawText);
              bank = extracted.bank;
              account = extracted.account;
            }
          }

          const fileNames = pendingFiles.map((f) => f.name);
          info = {
            bank,
            bankInitial: bank.charAt(0).toUpperCase(),
            account,
            fileName: fileNames.length === 1 ? fileNames[0] : `${fileNames[0]} +${fileNames.length - 1}`,
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
          const mKey = extractMerchantKey(p.title);
          const mem = loadCatMemory();
          const memorized = mem[mKey];
          const catSource: "auto" | "learned" | "none" = memorized
            ? "learned"
            : fi.category && fi.category !== "Outros"
              ? "auto"
              : "none";
          const cat = memorized ?? (catSource === "auto" ? fi.category : "");
          newList.push({
            parsedItem: p,
            cat,
            catSource,
            merchantKey: mKey,
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

  function pickFiles(files: File[]) {
    if (files.length === 0) return;
    setPendingFiles(files);
    setIsDemo(false);
    setReadProgress(0);
    setReadStepIdx(0);
    setPdfMsg(undefined);
    setStep("reading");
  }

  function startDemo() {
    setPendingFiles([]);
    setIsDemo(true);
    setReadProgress(0);
    setReadStepIdx(0);
    setStep("reading");
  }



  function applyAll(status: FinanceStatus) {
    setDefaultStatus(status);
    setNewItems((arr) => arr.map((i) => ({ ...i, status })));
  }

  function setDupAction(id: string, action: "skip" | "keep" | "update") {
    setDupItems((arr) => arr.map((d) => (d.parsedItem.id === id ? { ...d, action } : d)));
  }

  function handleSetCat(id: string, cat: string, mKey: string, applyToAll: boolean, remember: boolean) {
    setNewItems((arr) =>
      arr.map((i) => {
        if (i.parsedItem.id === id) return { ...i, cat, catSource: remember ? "learned" as const : "auto" as const };
        if ((applyToAll || remember) && i.merchantKey === mKey) return { ...i, cat, catSource: remember ? "learned" as const : "auto" as const };
        return i;
      }),
    );
    if (remember) {
      const next = { ...catMemory, [mKey]: cat };
      setCatMemory(next);
      saveCatMemory(next);
    }
  }

  function toggleItem(id: string) {
    setNewItems((arr) => arr.map((i) => i.parsedItem.id === id ? { ...i, included: !i.included } : i));
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
      const fi = toFinanceItem(item.parsedItem, categories);
      const finalCat = item.cat || fi.category;
      financeAdd({
        ...fi,
        category: finalCat,
        status: item.status,
        ...(selectedAccount ? { accountId: selectedAccount.id } : {}),
      });
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

    // Offer balance adjustment only when ledgerBal is a real non-zero value.
    // BB and some banks export BALAMT=0.00 which is invalid — skip in that case.
    if (ledgerBal && ledgerBal.balanceCents > 0) {
      const cutoff = ledgerBal.dateISO;
      const allAfterImport = financeList();
      let cumRec = 0, cumDes = 0;
      for (const item of allAfterImport) {
        if (item.dateISO > cutoff) continue;
        if (item.type === "RECEITA") cumRec += item.amountCents;
        if (item.type === "DESPESA") cumDes += item.amountCents;
      }
      const appCents = cumRec - cumDes;
      const diff = Math.abs(ledgerBal.balanceCents - appCents);
      if (diff > 0) {
        setAdjustInfo({ bankCents: ledgerBal.balanceCents, appCents, dateISO: cutoff });
        setStep("adjust");
        return;
      }
    }

    setStep("done");
  }

  function applyAdjustment() {
    if (!adjustInfo) { setStep("done"); return; }
    const diff = adjustInfo.bankCents - adjustInfo.appCents;
    const adj: FinanceItem = {
      id: makeId(),
      type: diff > 0 ? "RECEITA" : "DESPESA",
      title: "Saldo inicial — ajuste de importação",
      category: diff > 0 ? (incomeCategories[0] ?? "Outros") : (expenseCategories[0] ?? "Outros"),
      amountCents: Math.abs(diff),
      dateISO: adjustInfo.dateISO,
      createdAtISO: new Date().toISOString(),
      paymentType: "debit",
      status: "paid",
    };
    financeAdd(adj);
    setStep("done");
  }

  function restart() {
    financeFlushRecent();
    setPendingFiles([]);
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
    setLedgerBal(null);
    setAdjustInfo(null);
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
          selectedAccount={selectedAccount}
          onAccountChange={setSelectedAccount}
          onPick={pickFiles}
          onDemo={startDemo}
        />
      )}

      {step === "reading" && (
        <StepReading
          progress={readProgress}
          stepIdx={readStepIdx}
          fileName={isDemo ? "extrato_demo.ofx" : pendingFiles.length === 1 ? (pendingFiles[0]?.name ?? "…") : `${pendingFiles.length} arquivos`}
          pdfMsg={pdfMsg}
        />
      )}

      {step === "review" && fileInfo && (
        <StepReview
          fileInfo={fileInfo}
          newItems={filteredNew}
          dupItems={filteredDup}
          defaultStatus={defaultStatus}
          applyAll={applyAll}
          dupAction={setDupAction}
          filterFrom={filterFrom}
          filterTo={filterTo}
          rangeFrom={rangeFrom}
          rangeTo={rangeTo}
          setFilterFrom={setFilterFrom}
          setFilterTo={setFilterTo}
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
          memory={catMemory}
          onSetCat={handleSetCat}
          onToggle={toggleItem}
        />
      )}

      {step === "adjust" && adjustInfo && (
        <StepAdjust
          info={adjustInfo}
          onApply={applyAdjustment}
          onSkip={() => setStep("done")}
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
