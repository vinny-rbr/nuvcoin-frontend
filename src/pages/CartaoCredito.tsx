import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import type { CreditCard, CreditCardTransaction } from "../types/creditCard";
import type { BankAccount } from "../types/finance";
import {
  listCreditCards,
  createCreditCard,
  updateCreditCard,
  deleteCreditCard,
  listCardTransactions,
  addCardExpense,
  payCardInvoice,
} from "../lib/creditCardService";
import { listBankAccounts } from "../lib/bankAccountsService";
import { brandOf, brandFace, fmtBRL } from "../components/WalletCards";
import "./cartaoCredito.css";

// ─── Constants ────────────────────────────────────────────────────────────────

const CREDIT_ACCENT = "#F59E0B";
const CREDIT_ACCENT_LT = "#FBBF24";

const CREDIT_BANKS = ["nubank", "itau", "inter", "c6", "bb", "santander", "caixa", "picpay"] as const;

const CREDIT_COLORS = [
  { id: "auto",     label: "Da marca",  face: null },
  { id: "violet",   label: "Violeta",   face: "linear-gradient(135deg,#9F37E8,#6A02B0)" },
  { id: "amber",    label: "Âmbar",     face: "linear-gradient(135deg,#FBBF24,#D97706)" },
  { id: "blue",     label: "Azul",      face: "linear-gradient(135deg,#3B82F6,#1b3fa0)" },
  { id: "graphite", label: "Grafite",   face: "linear-gradient(135deg,#334155,#0F172A)" },
];

const EXPENSE_CATS = ["Alimentação", "Transporte", "Compras", "Assinaturas", "Saúde", "Viagem", "Lazer", "Outros"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function usageColor(pct: number) {
  return pct < 0.5 ? "#4ADE80" : pct < 0.82 ? CREDIT_ACCENT : "#F87171";
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function LimitBar({ used, limit, height = 8 }: { used: number; limit: number; height?: number }) {
  const pct = limit > 0 ? Math.min(1, used / limit) : 0;
  const col = usageColor(pct);
  return (
    <div className="cc-limit-bar-track" style={{ height }}>
      <div
        className="cc-limit-bar-fill"
        style={{ width: `${Math.max(3, pct * 100)}%`, background: `linear-gradient(90deg,${col},${col}cc)` }}
      />
    </div>
  );
}

function CreditBankCard({
  card,
  w = 290,
  onClick,
}: {
  card: CreditCard;
  w?: number;
  onClick?: () => void;
}) {
  const b = brandOf(card.brand);
  const face = card.face ?? b.face;
  const glow = b.glow;
  const h = w * 0.625;
  const Logo = b.Logo;
  const Network = b.Network;
  return (
    <div
      onClick={onClick}
      className="wc-card"
      style={{
        width: w, height: h, borderRadius: w * 0.07,
        background: face,
        boxShadow: `0 ${w * 0.06}px ${w * 0.12}px -${w * 0.04}px ${glow}, inset 0 1px 0 rgba(255,255,255,.18)`,
        cursor: onClick ? "pointer" : "default",
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(115deg, rgba(255,255,255,0.14) 0%, transparent 32%, transparent 70%, rgba(0,0,0,0.18) 100%)",
        pointerEvents: "none",
      }} />
      <div style={{ position: "absolute", inset: 0, padding: w * 0.07, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Logo s={w * 0.085} />
          <span style={{ fontFamily: "Manrope, system-ui", fontWeight: 700, fontSize: w * 0.04, opacity: 0.85, letterSpacing: "0.02em", color: "#fff" }}>{b.tier}</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ width: w * 0.11, height: w * 0.082, borderRadius: 5, marginBottom: w * 0.03, background: "linear-gradient(135deg,#F4D58A,#C9A24B)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)" }} />
            <div style={{ fontFamily: "Space Grotesk, system-ui", fontWeight: 500, fontSize: w * 0.05, letterSpacing: "0.12em", opacity: 0.92, color: "#fff" }}>
              •••• {card.last4}
            </div>
          </div>
          <Network size={w * 0.13} />
        </div>
      </div>
    </div>
  );
}

function DateChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="cc-date-chip">
      <span style={{ fontSize: 16 }}>📅</span>
      <span className="cc-date-chip-label">{label}</span>
      <span className="cc-date-chip-value">{value}</span>
    </div>
  );
}

function TxRow({ tx }: { tx: CreditCardTransaction }) {
  const isOut = tx.type === "out";
  return (
    <div className="cc-tx-row">
      <div className={`cc-tx-icon ${tx.type}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isOut ? "#F87171" : "#4ADE80"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {isOut ? <><path d="M12 5v14" /><path d="m18 13-6 6-6-6" /></> : <><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></>}
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="cc-tx-title">{tx.title}</div>
        <div className="cc-tx-sub">{tx.category} · {tx.dateISO.slice(8, 10)}/{tx.dateISO.slice(5, 7)}</div>
      </div>
      <div className={`cc-tx-amount ${tx.type}`}>
        {isOut ? "- " : "+ "}{fmtBRL(Math.abs(tx.amountCents))}
      </div>
    </div>
  );
}

// ─── MoneyInput ────────────────────────────────────────────────────────────────

function MoneyInput({ cents, onChange }: { cents: number; onChange: (c: number) => void }) {
  const display = (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") { onChange(Math.floor(cents / 10)); return; }
    const d = parseInt(e.key, 10);
    if (!isNaN(d)) onChange(cents * 10 + d);
  }
  return (
    <div className="cc-money-wrap">
      <span className="cc-money-prefix">R$</span>
      <input
        className="cc-money-input"
        readOnly
        value={display}
        onKeyDown={handleKey}
        inputMode="numeric"
        style={{ caretColor: "transparent" }}
      />
    </div>
  );
}

// ─── DayStepper ───────────────────────────────────────────────────────────────

function DayStepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const clamp = (v: number) => Math.max(1, Math.min(28, v));
  return (
    <div className="cc-stepper">
      <span className="cc-stepper-label">{label}</span>
      <div className="cc-stepper-ctrl">
        <button type="button" className="cc-stepper-btn" onClick={() => onChange(clamp(value - 1))}>−</button>
        <span className="cc-stepper-value">{value}</span>
        <button type="button" className="cc-stepper-btn" onClick={() => onChange(clamp(value + 1))}>+</button>
      </div>
    </div>
  );
}

// ─── Sheet wrapper ─────────────────────────────────────────────────────────────

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return createPortal(
    <div className="cc-sheet-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cc-sheet">
        <div className="cc-sheet-handle" />
        {children}
      </div>
    </div>,
    document.body,
  );
}

// ─── DoneState ────────────────────────────────────────────────────────────────

function DoneState({
  title, sub, onClose, accent = CREDIT_ACCENT,
}: { title: string; sub: string; onClose: () => void; accent?: string }) {
  return (
    <div className="cc-done-state">
      <div className="cc-done-icon" style={{ background: `${accent}22`, border: `2px solid ${accent}44` }}>✓</div>
      <div>
        <div className="cc-done-title">{title}</div>
        <div className="cc-done-sub">{sub}</div>
      </div>
      <button type="button" className="cc-primary-btn" style={{ marginTop: 8 }} onClick={onClose}>Concluir</button>
    </div>
  );
}

// ─── AccountChooser ────────────────────────────────────────────────────────────

function AccountChooser({
  accounts, target, setTarget, label,
}: { accounts: BankAccount[]; target: string; setTarget: (id: string) => void; label: string }) {
  return (
    <div className="cc-field">
      <span className="cc-field-label">{label}</span>
      <div className="cc-account-chips">
        {accounts.map(a => {
          const b = brandOf(a.bank);
          const face = brandFace(a.bank, a.face);
          return (
            <button
              key={a.id}
              type="button"
              className={`cc-account-chip${target === a.id ? " active" : ""}`}
              onClick={() => setTarget(a.id)}
            >
              <span className="cc-account-chip-dot" style={{ background: face }} />
              {a.nick || b.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── CreditHero ────────────────────────────────────────────────────────────────

function CreditHero({ cards }: { cards: CreditCard[] }) {
  const open = cards.reduce((s, c) => s + c.invoiceCents, 0);
  const limit = cards.reduce((s, c) => s + c.limitCents, 0);
  const avail = limit - open;
  const pct = limit > 0 ? open / limit : 0;
  return (
    <div className="cc-hero">
      <div className="cc-hero-bg-orb" />
      <div className="cc-hero-top">
        <span className="cc-hero-label">Fatura aberta</span>
        <span className="cc-hero-pill">💳 {cards.length} cartões</span>
      </div>
      <div className="cc-hero-amount">{fmtBRL(open)}</div>
      <div className="cc-hero-bar-row">
        <LimitBar used={open} limit={limit} />
        <div className="cc-hero-bar-meta">
          <span className="cc-hero-bar-free">Limite livre {fmtBRL(avail)}</span>
          <span className="cc-hero-bar-pct">{Math.round(pct * 100)}% usado</span>
        </div>
      </div>
    </div>
  );
}

// ─── CardSummaryPanel ──────────────────────────────────────────────────────────

function CardSummaryPanel({
  card, onPay, onSpend, onOpen,
}: { card: CreditCard; onPay: () => void; onSpend: () => void; onOpen: () => void }) {
  const free = card.limitCents - card.invoiceCents;
  return (
    <div className="cc-summary">
      <div className="cc-summary-top">
        <div>
          <div className="cc-summary-invoice-label">Fatura aberta</div>
          <strong className="cc-summary-invoice-amount">{fmtBRL(card.invoiceCents)}</strong>
        </div>
        <button type="button" className="cc-summary-details-btn" onClick={onOpen}>
          Detalhes ›
        </button>
      </div>
      <div>
        <LimitBar used={card.invoiceCents} limit={card.limitCents} />
        <div className="cc-summary-bar-meta">
          <span className="cc-summary-bar-label">Limite {fmtBRL(card.limitCents)}</span>
          <span className="cc-summary-bar-free">Livre {fmtBRL(free)}</span>
        </div>
      </div>
      <div className="cc-date-chips">
        <DateChip label="Vence" value={`dia ${card.dueDay}`} />
        <DateChip label="Fecha" value={`dia ${card.closingDay}`} />
        <DateChip label="Melhor dia" value={`dia ${card.bestDay}`} />
      </div>
      <div className="cc-action-row">
        <button type="button" className="cc-btn-amber" onClick={onPay}>Pagar fatura</button>
        <button type="button" className="cc-btn-ghost" onClick={onSpend}>+ Lançar gasto</button>
      </div>
    </div>
  );
}

// ─── CreditDeck ────────────────────────────────────────────────────────────────

function CreditDeck({
  cards, onOpen, onPay, onSpend, onAdd, w = 290,
}: {
  cards: CreditCard[];
  onOpen: (c: CreditCard) => void;
  onPay: (c: CreditCard) => void;
  onSpend: (c: CreditCard) => void;
  onAdd: () => void;
  w?: number;
}) {
  const n = cards.length;
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const ch = w * 0.625;
  const peek = 15;
  const maxBehind = Math.min(n - 1, 3);
  const gap = 16;
  const drag = useRef({ x: 0, moved: false });
  const buzz = (ms = 12) => { try { navigator.vibrate?.(ms); } catch { /* noop */ } };
  const collapsedH = ch + peek * maxBehind;
  const expandedH = (ch + gap) * n - gap;
  const go = (i: number) => { if (i !== active) buzz(); setActive(((i % n) + n) % n); };

  useEffect(() => { if (active >= n) setActive(Math.max(0, n - 1)); }, [n]);

  function onDown(e: React.PointerEvent) { drag.current = { x: e.clientX, moved: false }; }
  function onMove(e: React.PointerEvent) { if (Math.abs(e.clientX - drag.current.x) > 8) drag.current.moved = true; }
  function onUp(e: React.PointerEvent) {
    if (expanded) return;
    const dx = e.clientX - drag.current.x;
    if (dx < -42) go(active + 1); else if (dx > 42) go(active - 1);
  }

  const card = cards[active];

  return (
    <div className="cc-deck-wrap">
      <div
        className="cc-deck-area"
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
        style={{ width: w, height: expanded ? expandedH : collapsedH }}
      >
        {cards.map((c, i) => {
          const d = (i - active + n) % n;
          let y = 0, scale = 1, op = 1, z = 0;
          if (expanded) { y = d * (ch + gap); scale = 1; op = 1; z = n - d; }
          else {
            const dd = Math.min(d, maxBehind);
            y = (maxBehind - dd) * peek;
            scale = 1 - dd * 0.05;
            op = d > maxBehind ? 0 : 1 - dd * 0.14;
            z = n - d;
          }
          return (
            <div
              key={c.id}
              className="cc-deck-card-slot"
              style={{
                transform: `translateY(${y}px) scale(${scale})`,
                transformOrigin: "top center",
                opacity: op, zIndex: z,
                pointerEvents: d <= maxBehind || expanded ? "auto" : "none",
              }}
            >
              <CreditBankCard
                card={c}
                w={w}
                onClick={() => {
                  if (drag.current.moved) return;
                  if (expanded || d === 0) onOpen(c);
                  else go(i);
                }}
              />
            </div>
          );
        })}
      </div>

      <div className="cc-dots">
        {cards.map((_, i) => (
          <button key={i} type="button" className={`cc-dot${i === active ? " is-active" : ""}`} onClick={() => go(i)} />
        ))}
      </div>

      <div className="cc-deck-controls">
        <button type="button" className="cc-pill-btn" onClick={() => { buzz(8); setExpanded(e => !e); }}>
          {expanded ? "Recolher" : "Expandir cartões"}
        </button>
        <button type="button" className="cc-pill-btn amber" onClick={onAdd}>+ Novo cartão</button>
      </div>

      <CardSummaryPanel card={card} onPay={() => onPay(card)} onSpend={() => onSpend(card)} onOpen={() => onOpen(card)} />
    </div>
  );
}

// ─── CreditList ────────────────────────────────────────────────────────────────

function CreditList({
  cards, onOpen, onPay, onSpend, onAdd,
}: {
  cards: CreditCard[];
  onOpen: (c: CreditCard) => void;
  onPay: (c: CreditCard) => void;
  onSpend: (c: CreditCard) => void;
  onAdd: () => void;
}) {
  return (
    <div className="cc-list">
      {cards.map(c => {
        const b = brandOf(c.brand);
        const face = c.face ?? b.face;
        return (
          <div key={c.id} className="cc-list-item">
            <button type="button" className="cc-list-item-header" onClick={() => onOpen(c)}>
              <span className="cc-list-mini-card" style={{ background: face }}>
                <b.Logo s={13} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="cc-list-nick">{c.nick}</div>
                <div className="cc-list-meta">•••• {c.last4} · vence dia {c.dueDay}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
                <span style={{ color: "#94A3B8", fontSize: 12.5, fontWeight: 700 }}>Fatura aberta</span>
                <strong style={{ fontFamily: "Space Grotesk, system-ui", fontWeight: 700, fontSize: 19, color: CREDIT_ACCENT_LT }}>{fmtBRL(c.invoiceCents)}</strong>
              </div>
              <LimitBar used={c.invoiceCents} limit={c.limitCents} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7 }}>
                <span style={{ color: "#64748B", fontSize: 11.5, fontWeight: 700 }}>Limite {fmtBRL(c.limitCents)}</span>
                <span style={{ color: "#94A3B8", fontSize: 11.5, fontWeight: 700 }}>Livre {fmtBRL(c.limitCents - c.invoiceCents)}</span>
              </div>
            </div>
            <div className="cc-action-row">
              <button type="button" className="cc-btn-amber" onClick={() => onPay(c)}>Pagar fatura</button>
              <button type="button" className="cc-btn-ghost" onClick={() => onSpend(c)}>+ Lançar</button>
            </div>
          </div>
        );
      })}
      <button type="button" className="cc-add-cta" onClick={onAdd}>+ Adicionar cartão de crédito</button>
    </div>
  );
}

// ─── CartaoDetail ──────────────────────────────────────────────────────────────

function CartaoDetail({
  card, transactions, onBack, onPay, onSpend, onEdit,
}: {
  card: CreditCard;
  transactions: CreditCardTransaction[];
  onBack: () => void;
  onPay: () => void;
  onSpend: () => void;
  onEdit: () => void;
}) {
  const b = brandOf(card.brand);
  const pct = card.limitCents > 0 ? card.invoiceCents / card.limitCents : 0;
  return (
    <div className="cc-detail-overlay">
      <div className="cc-detail-scroll">
        <div className="cc-detail-hero-area" style={{ background: `radial-gradient(circle at 20% -10%, ${b.glow}, transparent 60%)` }}>
          <div className="cc-detail-nav">
            <button type="button" className="cc-detail-back-btn" onClick={onBack}>‹ Cartões</button>
            <button type="button" className="cc-detail-edit-btn" onClick={onEdit}>Editar</button>
          </div>
          <div className="cc-detail-card-wrap">
            <CreditBankCard card={card} w={254} />
          </div>
          <div className="cc-detail-meta">
            <div className="cc-detail-nick">{card.nick} · Cartão de crédito</div>
            <div className="cc-detail-invoice-label">Fatura aberta</div>
            <div className="cc-detail-invoice-amount">{fmtBRL(card.invoiceCents)}</div>
          </div>
          <div className="cc-detail-limit-box">
            <div className="cc-detail-limit-row">
              <span className="cc-detail-limit-used-label">Limite usado</span>
              <span className="cc-detail-limit-pct">{Math.round(pct * 100)}%</span>
            </div>
            <LimitBar used={card.invoiceCents} limit={card.limitCents} height={9} />
            <div className="cc-detail-limit-footer">
              <span style={{ color: "#64748B", fontSize: 11.5, fontWeight: 700 }}>Limite {fmtBRL(card.limitCents)}</span>
              <span style={{ color: "#94A3B8", fontSize: 11.5, fontWeight: 700 }}>Disponível {fmtBRL(card.limitCents - card.invoiceCents)}</span>
            </div>
          </div>
          <div className="cc-date-chips" style={{ marginTop: 12 }}>
            <DateChip label="Vence" value={`dia ${card.dueDay}`} />
            <DateChip label="Fecha" value={`dia ${card.closingDay}`} />
            <DateChip label="Melhor dia" value={`dia ${card.bestDay}`} />
          </div>
          <div className="cc-action-row" style={{ marginTop: 12 }}>
            <button type="button" className="cc-btn-amber" style={{ minHeight: 48 }} onClick={onPay}>Pagar fatura</button>
            <button type="button" className="cc-btn-ghost" style={{ minHeight: 48 }} onClick={onSpend}>+ Lançar gasto</button>
          </div>
        </div>
        <div className="cc-detail-transactions">
          <h3 className="cc-detail-tx-title">Lançamentos da fatura</h3>
          {transactions.map((tx, i) => (
            <div key={tx.id}>
              {i > 0 && <div className="cc-tx-divider" />}
              <TxRow tx={tx} />
            </div>
          ))}
          {transactions.length === 0 && <div className="cc-tx-empty">Nenhum lançamento nessa fatura ainda.</div>}
        </div>
      </div>
    </div>
  );
}

// ─── NovoCartaoSheet ───────────────────────────────────────────────────────────

function NovoCartaoSheet({
  onClose, onDone,
}: { onClose: () => void; onDone: (card: CreditCard) => void }) {
  const [step, setStep] = useState<"bank" | "form" | "done">("bank");
  const [bank, setBank] = useState("");
  const [nick, setNick] = useState("");
  const [limitCents, setLimitCents] = useState(0);
  const [closingDay, setClosingDay] = useState(28);
  const [dueDay, setDueDay] = useState(7);
  const [bestDay, setBestDay] = useState(1);
  const [color, setColor] = useState("auto");
  const [saving, setSaving] = useState(false);
  const [createdCard, setCreatedCard] = useState<CreditCard | null>(null);

  const previewFace = color === "auto"
    ? (bank ? brandOf(bank).face : undefined)
    : (CREDIT_COLORS.find(c => c.id === color)?.face ?? undefined);

  async function finish() {
    if (!bank) return;
    setSaving(true);
    try {
      const face = color === "auto" ? null : (CREDIT_COLORS.find(c => c.id === color)?.face ?? null);
      const card = await createCreditCard({
        brand: bank as CreditCard["brand"],
        nick: nick || brandOf(bank).name,
        last4: String(Math.floor(1000 + Math.random() * 9000)),
        limitCents: limitCents || 100000,
        closingDay, dueDay, bestDay,
        face,
      });
      setCreatedCard(card);
      setStep("done");
    } catch {
      alert("Erro ao salvar cartão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet onClose={onClose}>
      {step === "bank" && (
        <div className="cc-sheet-form">
          <div>
            <div className="cc-sheet-title">Novo cartão de crédito</div>
            <div className="cc-sheet-sub">Escolha o banco do cartão. Você pode cadastrar quantos quiser.</div>
          </div>
          <div className="cc-bank-grid">
            {CREDIT_BANKS.map(id => {
              const b = brandOf(id);
              return (
                <button
                  key={id}
                  type="button"
                  className="cc-bank-item"
                  onClick={() => { setBank(id); setNick(b.name); setStep("form"); }}
                >
                  <span className="cc-bank-mini-card" style={{ background: b.face }}><b.Logo s={13} /></span>
                  <span className="cc-bank-name">{b.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === "form" && bank && (
        <div className="cc-sheet-form">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => setStep("bank")}
              style={{ border: "none", background: "rgba(255,255,255,0.06)", borderRadius: 999, width: 34, height: 34, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}
            >‹</button>
            <div>
              <div className="cc-sheet-title">{brandOf(bank).name}</div>
              <div className="cc-sheet-sub" style={{ marginTop: 1 }}>Configure os dados do cartão.</div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <CreditBankCard
              card={{ id: "preview", userId: "", brand: bank as CreditCard["brand"], nick: nick || brandOf(bank).name, last4: "0000", limitCents: 0, invoiceCents: 0, closingDay, dueDay, bestDay, face: previewFace, createdAtUtc: "" }}
              w={224}
            />
          </div>

          <label className="cc-field">
            <span className="cc-field-label">Apelido do cartão</span>
            <input className="cc-input" value={nick} onChange={e => setNick(e.target.value)} placeholder={`Ex: ${brandOf(bank).name} do dia a dia`} />
          </label>

          <div className="cc-field">
            <span className="cc-field-label">Limite total</span>
            <MoneyInput cents={limitCents} onChange={setLimitCents} />
          </div>

          <div className="cc-field">
            <span className="cc-field-label">Datas da fatura</span>
            <div className="cc-stepper-row">
              <DayStepper label="Vencimento" value={dueDay} onChange={setDueDay} />
              <DayStepper label="Fechamento" value={closingDay} onChange={setClosingDay} />
              <DayStepper label="Melhor dia" value={bestDay} onChange={setBestDay} />
            </div>
          </div>

          <div className="cc-field">
            <span className="cc-field-label">Cor do cartão</span>
            <div className="cc-color-swatches">
              {CREDIT_COLORS.map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`cc-swatch${color === c.id ? " selected" : ""}`}
                  onClick={() => setColor(c.id)}
                  style={{ background: c.id === "auto" ? "conic-gradient(from 180deg,#9F37E8,#3B82F6,#22C55E,#EC7000,#9F37E8)" : (c.face ?? "") }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <button type="button" className="cc-primary-btn" onClick={finish} disabled={saving}>
            {saving ? "Salvando…" : "Salvar cartão"}
          </button>
        </div>
      )}

      {step === "done" && createdCard && (
        <DoneState
          title="Cartão adicionado!"
          sub={`${createdCard.nick} já aparece na sua aba de crédito. Lance gastos e pague a fatura por aqui.`}
          onClose={() => { onDone(createdCard); onClose(); }}
        />
      )}
    </Sheet>
  );
}

// ─── PagarFaturaSheet ──────────────────────────────────────────────────────────

function PagarFaturaSheet({
  card, bankAccounts, onClose, onPaid,
}: {
  card: CreditCard;
  bankAccounts: BankAccount[];
  onClose: () => void;
  onPaid: (amountPaid: number, remainingInvoice: number) => void;
}) {
  const payAccounts = bankAccounts.filter(a => a.accountType !== "Cartão de crédito");
  const [from, setFrom] = useState(payAccounts[0]?.id ?? "");
  const [cents, setCents] = useState(card.invoiceCents);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [paidResult, setPaidResult] = useState({ paid: 0, remaining: 0 });

  const fromAcc = bankAccounts.find(a => a.id === from);
  const min15 = Math.round(card.invoiceCents * 0.15);
  const half = Math.round(card.invoiceCents * 0.5);
  const overInvoice = cents > card.invoiceCents;
  const insufficient = fromAcc ? cents > fromAcc.balanceCents : false;
  const valid = cents > 0 && !insufficient && !!from;

  async function confirm() {
    if (!valid) return;
    setPaying(true);
    try {
      const result = await payCardInvoice(card.id, from, cents);
      setPaidResult({ paid: result.paid, remaining: result.remainingInvoice });
      setDone(true);
      onPaid(result.paid, result.remainingInvoice);
    } catch (err) {
      alert((err as Error).message ?? "Erro no pagamento.");
    } finally {
      setPaying(false);
    }
  }

  if (done) {
    return (
      <Sheet onClose={onClose}>
        <DoneState
          title="Fatura paga!"
          sub={`${fmtBRL(paidResult.paid)} debitado de ${fromAcc?.nick ?? "conta"}. ${paidResult.remaining > 0 ? `Fatura restante: ${fmtBRL(paidResult.remaining)}.` : "Fatura quitada! 🎉"}`}
          onClose={onClose}
        />
      </Sheet>
    );
  }

  const b = brandOf(card.brand);
  return (
    <Sheet onClose={onClose}>
      <div className="cc-sheet-form">
        <div>
          <div className="cc-sheet-title">Pagar fatura</div>
          <div className="cc-sheet-sub">O valor é debitado da conta escolhida e some do seu saldo total.</div>
        </div>

        <div className="cc-pay-card-display">
          <span className="cc-pay-mini-card" style={{ background: card.face ?? b.face }}><b.Logo s={12} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#F1F5F9", fontWeight: 800, fontSize: 14.5, fontFamily: "Manrope" }}>{card.nick}</div>
            <div style={{ color: "#fcd34d", fontSize: 12, fontWeight: 700 }}>Fatura {fmtBRL(card.invoiceCents)} · vence dia {card.dueDay}</div>
          </div>
        </div>

        <div className="cc-field">
          <span className="cc-field-label">Quanto pagar</span>
          <MoneyInput cents={cents} onChange={setCents} />
          <div className="cc-pay-chips">
            {[["Mínimo 15%", min15], ["Metade", half], ["Total", card.invoiceCents]].map(([label, value]) => (
              <button key={label as string} type="button" className={`cc-pay-chip${cents === value ? " active" : ""}`} onClick={() => setCents(value as number)}>
                {label}
              </button>
            ))}
          </div>
          {overInvoice && <span style={{ color: "#fcd34d", fontSize: 11.5, fontWeight: 700 }}>Acima da fatura — pagaremos só {fmtBRL(card.invoiceCents)}.</span>}
          {cents > 0 && cents < card.invoiceCents && !overInvoice && (
            <span style={{ color: "#94A3B8", fontSize: 11.5, fontWeight: 700 }}>Pagamento parcial — restam {fmtBRL(card.invoiceCents - cents)}.</span>
          )}
        </div>

        {payAccounts.length > 0 && (
          <AccountChooser accounts={payAccounts} target={from} setTarget={setFrom} label="Pagar de qual conta?" />
        )}
        {fromAcc && (
          <span style={{ color: insufficient ? "#fca5a5" : "#64748B", fontSize: 11.5, fontWeight: 700, marginTop: -6 }}>
            Saldo em {fromAcc.nick}: {fmtBRL(fromAcc.balanceCents)}{insufficient ? " · saldo insuficiente" : ""}
          </span>
        )}

        <button type="button" className="cc-primary-btn" disabled={!valid || paying} onClick={confirm}>
          {paying ? "Processando…" : `Pagar ${cents > 0 ? fmtBRL(Math.min(cents, card.invoiceCents)) : "fatura"}`}
        </button>
      </div>
    </Sheet>
  );
}

// ─── GastoCartaoSheet ──────────────────────────────────────────────────────────

function GastoCartaoSheet({
  card, onClose, onAdded,
}: { card: CreditCard; onClose: () => void; onAdded: (tx: CreditCardTransaction) => void }) {
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState("Compras");
  const [cents, setCents] = useState(0);
  const [saving, setSaving] = useState(false);
  const valid = cents > 0 && title.trim().length > 0;
  const b = brandOf(card.brand);

  async function confirm() {
    if (!valid) return;
    setSaving(true);
    try {
      const tx = await addCardExpense(card.id, { title: title.trim(), category: cat, amountCents: cents });
      onAdded(tx);
      onClose();
    } catch {
      alert("Erro ao lançar gasto.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet onClose={onClose}>
      <div className="cc-sheet-form">
        <div>
          <div className="cc-sheet-title">Lançar gasto no cartão</div>
          <div className="cc-sheet-sub">Entra na fatura aberta de <strong style={{ color: "#cbd5e1" }}>{card.nick}</strong>.</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, border: "1px solid rgba(148,163,184,0.14)", background: "rgba(15,23,42,0.5)" }}>
          <span style={{ width: 50, height: 32, borderRadius: 8, background: card.face ?? b.face, display: "grid", placeItems: "center", flexShrink: 0 }}><b.Logo s={11} /></span>
          <div style={{ color: "#94A3B8", fontSize: 12.5, fontWeight: 700 }}>Fatura atual <strong style={{ color: CREDIT_ACCENT_LT, fontFamily: "Space Grotesk" }}>{fmtBRL(card.invoiceCents)}</strong></div>
        </div>

        <label className="cc-field">
          <span className="cc-field-label">Descrição</span>
          <input className="cc-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Mercado, Uber, assinatura…" />
        </label>

        <div className="cc-field">
          <span className="cc-field-label">Categoria</span>
          <div className="cc-cat-chips">
            {EXPENSE_CATS.map(c => (
              <button key={c} type="button" className={`cc-cat-chip${cat === c ? " active" : ""}`} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
        </div>

        <div className="cc-field">
          <span className="cc-field-label">Valor</span>
          <MoneyInput cents={cents} onChange={setCents} />
        </div>

        <button type="button" className="cc-primary-btn" disabled={!valid || saving} onClick={confirm}>
          {saving ? "Salvando…" : `Lançar ${cents > 0 ? fmtBRL(cents) : "gasto"}`}
        </button>
      </div>
    </Sheet>
  );
}

// ─── EditCartaoSheet ───────────────────────────────────────────────────────────

function EditCartaoSheet({
  card, onClose, onSaved, onDeleted,
}: { card: CreditCard; onClose: () => void; onSaved: (c: CreditCard) => void; onDeleted: () => void }) {
  const [nick, setNick] = useState(card.nick);
  const [limitCents, setLimitCents] = useState(card.limitCents);
  const [closingDay, setClosingDay] = useState(card.closingDay);
  const [dueDay, setDueDay] = useState(card.dueDay);
  const [bestDay, setBestDay] = useState(card.bestDay);
  const [color, setColor] = useState("keep");
  const [confirmDel, setConfirmDel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const colors = [
    { id: "keep", label: "Atual", face: card.face ?? brandOf(card.brand).face },
    ...CREDIT_COLORS,
  ];

  const previewFace = color === "keep"
    ? (card.face ?? brandOf(card.brand).face)
    : color === "auto"
      ? brandOf(card.brand).face
      : (CREDIT_COLORS.find(c => c.id === color)?.face ?? brandOf(card.brand).face);

  async function save() {
    setSaving(true);
    try {
      const face = color === "keep" ? card.face : color === "auto" ? null : (CREDIT_COLORS.find(c => c.id === color)?.face ?? null);
      const updated = await updateCreditCard(card.id, { nick: nick || card.nick, limitCents: limitCents || card.limitCents, closingDay, dueDay, bestDay, face });
      onSaved(updated);
      onClose();
    } catch {
      alert("Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    setDeleting(true);
    try {
      await deleteCreditCard(card.id);
      onDeleted();
      onClose();
    } catch {
      alert("Erro ao excluir cartão.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Sheet onClose={onClose}>
      <div className="cc-sheet-form">
        <div className="cc-sheet-title">Editar cartão</div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <CreditBankCard card={{ ...card, face: previewFace, nick }} w={224} />
        </div>

        <label className="cc-field">
          <span className="cc-field-label">Apelido do cartão</span>
          <input className="cc-input" value={nick} onChange={e => setNick(e.target.value)} />
        </label>

        <div className="cc-field">
          <span className="cc-field-label">Limite total</span>
          <MoneyInput cents={limitCents} onChange={setLimitCents} />
        </div>

        <div className="cc-field">
          <span className="cc-field-label">Datas da fatura</span>
          <div className="cc-stepper-row">
            <DayStepper label="Vencimento" value={dueDay} onChange={setDueDay} />
            <DayStepper label="Fechamento" value={closingDay} onChange={setClosingDay} />
            <DayStepper label="Melhor dia" value={bestDay} onChange={setBestDay} />
          </div>
        </div>

        <div className="cc-field">
          <span className="cc-field-label">Cor do cartão</span>
          <div className="cc-color-swatches">
            {colors.map(c => (
              <button
                key={c.id}
                type="button"
                className={`cc-swatch${color === c.id ? " selected" : ""}`}
                onClick={() => setColor(c.id)}
                style={{ background: c.id === "auto" ? "conic-gradient(from 180deg,#9F37E8,#3B82F6,#22C55E,#EC7000,#9F37E8)" : (c.face ?? "") }}
                title={c.id === "keep" ? "Manter atual" : c.id}
              />
            ))}
          </div>
        </div>

        <button type="button" className="cc-primary-btn" disabled={saving} onClick={save}>
          {saving ? "Salvando…" : "Salvar alterações"}
        </button>

        {!confirmDel ? (
          <button type="button" className="cc-ghost-btn cc-danger-btn" onClick={() => setConfirmDel(true)}>Excluir cartão</button>
        ) : (
          <div className="cc-confirm-del">
            <span className="cc-confirm-del-text">Excluir {card.nick} e seus lançamentos?</span>
            <div className="cc-confirm-del-btns">
              <button type="button" className="cc-ghost-btn" onClick={() => setConfirmDel(false)}>Cancelar</button>
              <button type="button" className="cc-delete-btn" disabled={deleting} onClick={doDelete}>
                {deleting ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type Sheet = "add" | "pay" | "spend" | "edit" | null;

export default function CartaoCredito() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layout, setLayout] = useState<"deck" | "list">(() => {
    return (localStorage.getItem("conciliaai_cc_layout") as "deck" | "list") ?? "deck";
  });

  const [detail, setDetail] = useState<CreditCard | null>(null);
  const [detailTxs, setDetailTxs] = useState<CreditCardTransaction[]>([]);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [activeCard, setActiveCard] = useState<CreditCard | null>(null);

  const load = useCallback(async () => {
    try {
      const [fetchedCards, fetchedAccounts] = await Promise.all([listCreditCards(), listBankAccounts()]);
      setCards(fetchedCards);
      setBankAccounts(fetchedAccounts);
      setError(null);
    } catch {
      setError("Não foi possível carregar os cartões. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function openDetail(card: CreditCard) {
    setDetail(card);
    try {
      const txs = await listCardTransactions(card.id);
      setDetailTxs(txs);
    } catch {
      setDetailTxs([]);
    }
  }

  function openSheet(s: Sheet, card?: CreditCard) {
    setActiveCard(card ?? null);
    setSheet(s);
  }

  function closeSheet() { setSheet(null); setActiveCard(null); }

  function onCardAdded(card: CreditCard) {
    setCards(prev => [...prev, { ...card, invoiceCents: 0 }]);
  }

  function onCardSaved(updated: CreditCard) {
    setCards(prev => prev.map(c => c.id === updated.id ? updated : c));
    if (detail?.id === updated.id) setDetail(updated);
  }

  function onCardDeleted(id: string) {
    setCards(prev => prev.filter(c => c.id !== id));
    if (detail?.id === id) setDetail(null);
  }

  function onPaid(_amountPaid: number, remainingInvoice: number) {
    if (!activeCard) return;
    const newInvoice = remainingInvoice;
    setCards(prev => prev.map(c => c.id === activeCard.id ? { ...c, invoiceCents: newInvoice } : c));
    if (detail?.id === activeCard.id) setDetail(prev => prev ? { ...prev, invoiceCents: newInvoice } : null);
  }

  function onExpenseAdded(tx: CreditCardTransaction) {
    if (!activeCard) return;
    setCards(prev => prev.map(c => c.id === activeCard.id ? { ...c, invoiceCents: c.invoiceCents + tx.amountCents } : c));
    if (detail?.id === activeCard.id) {
      setDetail(prev => prev ? { ...prev, invoiceCents: prev.invoiceCents + tx.amountCents } : null);
      setDetailTxs(prev => [tx, ...prev]);
    }
  }

  if (loading) {
    return <div className="cc-loading"><span>💳</span><span>Carregando cartões…</span></div>;
  }

  if (error) {
    return (
      <div className="cc-loading">
        <span>⚠️</span>
        <span>{error}</span>
        <button type="button" className="cc-primary-btn" style={{ maxWidth: 200 }} onClick={() => { setLoading(true); void load(); }}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <>
      <div className="cc-page">
        <div className="cc-page-header">
          <span className="cc-page-eyebrow">CRÉDITO</span>
          <h1 className="cc-page-title">Seus cartões</h1>
          <p className="cc-page-subtitle">
            {cards.length > 0
              ? `${cards.length} cartão${cards.length > 1 ? "s" : ""} · fatura aberta ${fmtBRL(cards.reduce((s, c) => s + c.invoiceCents, 0))}`
              : "Adicione seu primeiro cartão de crédito"}
          </p>
        </div>

        {cards.length > 0 && <CreditHero cards={cards} />}

        {cards.length > 0 && (
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {(["deck", "list"] as const).map(l => (
              <button
                key={l}
                type="button"
                onClick={() => { setLayout(l); localStorage.setItem("conciliaai_cc_layout", l); }}
                style={{
                  padding: "5px 13px", borderRadius: 999, border: "1px solid",
                  fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "Manrope, system-ui",
                  borderColor: layout === l ? "rgba(251,191,36,0.5)" : "rgba(148,163,184,0.2)",
                  background: layout === l ? "rgba(245,158,11,0.14)" : "transparent",
                  color: layout === l ? "#fde68a" : "#64748B",
                }}
              >
                {l === "deck" ? "Deck" : "Lista"}
              </button>
            ))}
          </div>
        )}

        {cards.length === 0 ? (
          <div className="cc-empty">
            <div style={{ fontSize: 48 }}>💳</div>
            <div className="cc-empty-title">Nenhum cartão ainda</div>
            <div className="cc-empty-sub">Adicione seus cartões de crédito para controlar faturas e gastos.</div>
            <button type="button" className="cc-add-cta" style={{ maxWidth: 280 }} onClick={() => openSheet("add")}>
              + Adicionar cartão de crédito
            </button>
          </div>
        ) : layout === "list" ? (
          <CreditList
            cards={cards}
            onOpen={openDetail}
            onPay={card => openSheet("pay", card)}
            onSpend={card => openSheet("spend", card)}
            onAdd={() => openSheet("add")}
          />
        ) : (
          <CreditDeck
            cards={cards}
            onOpen={openDetail}
            onPay={card => openSheet("pay", card)}
            onSpend={card => openSheet("spend", card)}
            onAdd={() => openSheet("add")}
          />
        )}
      </div>

      {/* Detail overlay */}
      {detail && (
        <CartaoDetail
          card={detail}
          transactions={detailTxs}
          onBack={() => setDetail(null)}
          onPay={() => openSheet("pay", detail)}
          onSpend={() => openSheet("spend", detail)}
          onEdit={() => openSheet("edit", detail)}
        />
      )}

      {/* Sheets */}
      {sheet === "add" && (
        <NovoCartaoSheet onClose={closeSheet} onDone={onCardAdded} />
      )}
      {sheet === "pay" && activeCard && (
        <PagarFaturaSheet
          card={activeCard}
          bankAccounts={bankAccounts}
          onClose={closeSheet}
          onPaid={onPaid}
        />
      )}
      {sheet === "spend" && activeCard && (
        <GastoCartaoSheet card={activeCard} onClose={closeSheet} onAdded={onExpenseAdded} />
      )}
      {sheet === "edit" && activeCard && (
        <EditCartaoSheet
          card={activeCard}
          onClose={closeSheet}
          onSaved={onCardSaved}
          onDeleted={() => onCardDeleted(activeCard.id)}
        />
      )}
    </>
  );
}
