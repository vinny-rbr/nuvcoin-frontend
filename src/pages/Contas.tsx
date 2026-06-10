import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import type { BankAccount } from "../types/finance";
import {
  listBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  transferBetweenAccounts,
} from "../lib/bankAccountsService";
import "./contas.css";

// ── bank brand definitions ────────────────────────────────────────────────────

const BRANDS: Record<string, { name: string; face: string; glow: string; tier: string }> = {
  nubank:    { name: "Nubank",         face: "linear-gradient(135deg,#9F37E8 0%,#820AD1 58%,#6A02B0 100%)", glow: "rgba(130,10,209,.55)", tier: "Conta" },
  picpay:    { name: "PicPay",         face: "linear-gradient(135deg,#20242B 0%,#0C0E12 70%)",               glow: "rgba(33,194,94,.30)",  tier: "Conta" },
  bb:        { name: "Banco do Brasil",face: "linear-gradient(135deg,#0A47B8 0%,#0533A0 55%,#04246E 100%)", glow: "rgba(10,71,184,.5)",   tier: "Ourocard" },
  itau:      { name: "Itaú",           face: "linear-gradient(135deg,#FF8A1E 0%,#EC7000 50%,#C85400 100%)", glow: "rgba(236,112,0,.5)",   tier: "Personnalité" },
  inter:     { name: "Inter",          face: "linear-gradient(135deg,#FF9D4D 0%,#FF7A00 55%,#E86A00 100%)", glow: "rgba(255,122,0,.5)",   tier: "Conta" },
  c6:        { name: "C6 Bank",        face: "linear-gradient(135deg,#2C2C2E 0%,#161618 60%,#0A0A0B 100%)", glow: "rgba(40,40,42,.6)",    tier: "Carbon" },
  caixa:     { name: "Caixa",          face: "linear-gradient(135deg,#2A7FD4 0%,#1565B0 55%,#0E4A85 100%)", glow: "rgba(21,101,176,.5)",  tier: "Conta" },
  santander: { name: "Santander",      face: "linear-gradient(135deg,#F33 0%,#EC0000 50%,#B30000 100%)",    glow: "rgba(236,0,0,.5)",     tier: "Unique" },
  outro:     { name: "Outro",          face: "linear-gradient(135deg,#334155 0%,#0F172A 100%)",              glow: "rgba(51,65,85,.5)",    tier: "Conta" },
};

const BANK_LIST = ["nubank", "bb", "itau", "picpay", "inter", "c6", "caixa", "santander", "outro"];

const CARD_COLORS = [
  { id: "auto",     label: "Da marca",  face: null },
  { id: "violet",   label: "Violeta",   face: "linear-gradient(135deg,#9F37E8,#6A02B0)" },
  { id: "blue",     label: "Azul",      face: "linear-gradient(135deg,#3B82F6,#1b3fa0)" },
  { id: "green",    label: "Verde",     face: "linear-gradient(135deg,#22C55E,#15803D)" },
  { id: "graphite", label: "Grafite",   face: "linear-gradient(135deg,#334155,#0F172A)" },
];

function brandOf(bank: string) { return BRANDS[bank] ?? BRANDS.outro; }
function brandFace(bank: string, face?: string | null) { return face ?? brandOf(bank).face; }

function fmtBRL(cents: number) {
  return "R$ " + (Math.abs(cents) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

// ── BankCard ──────────────────────────────────────────────────────────────────

function BankCard({ account, w = 290, faded = false, onClick }: { account: BankAccount; w?: number; faded?: boolean; onClick?: () => void }) {
  const b = brandOf(account.bank);
  const face = brandFace(account.bank, account.face);
  const glow = b.glow;
  const h = w * 0.625;
  return (
    <div
      onClick={onClick}
      className="cc-card"
      style={{
        width: w, height: h, borderRadius: w * 0.07,
        background: face,
        boxShadow: `0 ${w * 0.06}px ${w * 0.12}px -${w * 0.04}px ${glow}, inset 0 1px 0 rgba(255,255,255,.18)`,
        filter: faded ? "saturate(0.8)" : "none",
        cursor: onClick ? "pointer" : "default",
        flexShrink: 0,
      }}
    >
      <div className="cc-card-shine" />
      <div className="cc-card-body" style={{ padding: w * 0.07 }}>
        <div className="cc-card-top">
          <span className="cc-card-bankname" style={{ fontSize: w * 0.07 }}>{b.name}</span>
          <span className="cc-card-tier" style={{ fontSize: w * 0.036 }}>{b.tier}</span>
        </div>
        <div className="cc-card-bottom">
          <div>
            <div className="cc-chip" style={{ width: w * 0.11, height: w * 0.082, marginBottom: w * 0.03, borderRadius: 5 }} />
            <div className="cc-card-last4" style={{ fontSize: w * 0.05 }}>•••• {account.last4}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CardDeck (stacked, swipe to rotate) ──────────────────────────────────────

function CardDeck({ accounts, onSelect, onAdd, w = 290 }: { accounts: BankAccount[]; onSelect: (a: BankAccount) => void; onAdd: () => void; w?: number }) {
  const n = accounts.length;
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const ch = w * 0.625;
  const peek = 14;
  const maxBehind = Math.min(n - 1, 3);
  const gap = 16;
  const drag = useRef({ x: 0, moved: false });

  const buzz = () => { try { navigator.vibrate?.(12); } catch { /* noop */ } };
  const next = () => { buzz(); setActive(a => (a + 1) % n); };
  const prev = () => { buzz(); setActive(a => (a - 1 + n) % n); };
  const goTo = (i: number) => { if (i !== active) buzz(); setActive(i); };

  const collapsedH = ch + peek * maxBehind;
  const expandedH = (ch + gap) * n - gap;

  function onDown(e: React.PointerEvent | React.TouchEvent) {
    const x = "touches" in e ? e.touches[0].clientX : (e as React.PointerEvent).clientX;
    drag.current = { x, moved: false };
  }
  function onMove(e: React.PointerEvent | React.TouchEvent) {
    const x = "touches" in e ? e.touches[0].clientX : (e as React.PointerEvent).clientX;
    if (Math.abs(x - drag.current.x) > 8) drag.current.moved = true;
  }
  function onUp(e: React.PointerEvent | React.TouchEvent) {
    if (expanded) return;
    const x = "changedTouches" in e ? e.changedTouches[0].clientX : (e as React.PointerEvent).clientX;
    const dx = x - drag.current.x;
    if (dx < -42) next(); else if (dx > 42) prev();
  }

  if (n === 0) {
    return (
      <div className="cc-deck-empty">
        <button type="button" className="cc-add-cta" style={{ width: w, height: Math.round(w * 0.625) }} onClick={onAdd}>
          <span className="cc-add-icon">+</span>
          Adicionar banco
        </button>
      </div>
    );
  }

  return (
    <div className="cc-deck-wrap">
      <div
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
        onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
        style={{
          position: "relative", width: w, margin: "0 auto",
          height: expanded ? expandedH : collapsedH,
          transition: "height .45s cubic-bezier(.16,1,.3,1)",
          touchAction: "pan-y", userSelect: "none",
        }}
      >
        {accounts.map((acc, i) => {
          const d = (i - active + n) % n;
          let y = 0, scale = 1, op = 1, z = 0;
          if (expanded) {
            y = d * (ch + gap); scale = 1; op = 1; z = n - d;
          } else {
            const dd = Math.min(d, maxBehind);
            y = (maxBehind - dd) * peek;
            scale = 1 - dd * 0.05;
            op = d > maxBehind ? 0 : 1 - dd * 0.14;
            z = n - d;
          }
          return (
            <div key={acc.id} style={{
              position: "absolute", top: 0, left: 0, width: "100%",
              transform: `translateY(${y}px) scale(${scale})`,
              transformOrigin: "top center",
              opacity: op, zIndex: z,
              pointerEvents: d <= maxBehind || expanded ? "auto" : "none",
              transition: "transform .5s cubic-bezier(.16,1,.3,1), opacity .4s ease",
            }}>
              <BankCard account={acc} w={w} onClick={() => {
                if (drag.current.moved) return;
                if (expanded || d === 0) onSelect(acc);
                else goTo(i);
              }} />
            </div>
          );
        })}
      </div>

      <div className="cc-deck-dots">
        {accounts.map((_, i) => (
          <button key={i} type="button" onClick={() => goTo(i)} className={`cc-dot${i === active ? " is-active" : ""}`} />
        ))}
      </div>
      <div className="cc-deck-actions">
        <button type="button" className="cc-pill-btn" onClick={() => setExpanded(e => !e)}>
          {expanded ? "Recolher" : "Expandir cartões"}
        </button>
        <button type="button" className="cc-pill-btn cc-pill-btn-blue" onClick={onAdd}>
          + Novo banco
        </button>
      </div>
      <p className="cc-deck-hint">Deslize pra trocar · toque pra abrir a conta</p>
    </div>
  );
}

// ── AccountDetail slide-in ────────────────────────────────────────────────────

function AccountDetail({ account, onBack, onEdit, onTransfer }: {
  account: BankAccount;
  onBack: () => void;
  onEdit: (a: BankAccount) => void;
  onTransfer: (a: BankAccount) => void;
}) {
  const b = brandOf(account.bank);
  const face = brandFace(account.bank, account.face);

  return (
    <div className="cc-detail">
      <div className="cc-detail-scroll">
        <div className="cc-detail-hero" style={{ background: `radial-gradient(circle at 20% -10%, ${b.glow}, transparent 60%)` }}>
          <div className="cc-detail-topbar">
            <button type="button" className="cc-back-btn" onClick={onBack}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width={16} height={16}>
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              Contas
            </button>
            <button type="button" className="cc-edit-pill" onClick={() => onEdit(account)}>Editar</button>
          </div>
          <div className="cc-detail-card-wrap">
            <BankCard account={{ ...account, face }} w={254} />
          </div>
          <div className="cc-detail-balance-wrap">
            <div className="cc-detail-account-label">{account.nick} · {account.accountType}</div>
            <div className="cc-detail-balance">{fmtBRL(account.balanceCents)}</div>
          </div>
          <div className="cc-detail-actions-row">
            <button type="button" className="cc-detail-action-btn" onClick={() => onTransfer(account)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={16} height={16} aria-hidden="true">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
              Transferir
            </button>
            <button type="button" className="cc-detail-action-btn" onClick={() => onBack()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={16} height={16} aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Importar OFX
            </button>
          </div>
        </div>

        <div className="cc-detail-info-section">
          <div className="cc-detail-info-card">
            <div className="cc-info-row">
              <span className="cc-info-label">Banco</span>
              <span className="cc-info-value">{b.name}</span>
            </div>
            <div className="cc-info-divider" />
            <div className="cc-info-row">
              <span className="cc-info-label">Tipo</span>
              <span className="cc-info-value">{account.accountType}</span>
            </div>
            <div className="cc-info-divider" />
            <div className="cc-info-row">
              <span className="cc-info-label">Final</span>
              <span className="cc-info-value">•••• {account.last4}</span>
            </div>
          </div>
        </div>

        <div className="cc-detail-empty-txn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={32} height={32} className="cc-detail-empty-icon" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
          </svg>
          <p>Importe um extrato OFX para ver as movimentações desta conta.</p>
        </div>
      </div>
    </div>
  );
}

// ── Sheet wrapper ─────────────────────────────────────────────────────────────

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return createPortal(
    <div className="cc-sheet-backdrop" onClick={onClose}>
      <div className="cc-sheet" onClick={e => e.stopPropagation()}>
        <div className="cc-sheet-handle" />
        {children}
      </div>
    </div>,
    document.body,
  );
}

// ── CadastroSheet ─────────────────────────────────────────────────────────────

function CadastroSheet({ onClose, onDone }: { onClose: () => void; onDone: (data: Omit<BankAccount, "id" | "userId" | "createdAtUtc" | "updatedAtUtc">) => void }) {
  const [step, setStep] = useState<"bank" | "form" | "done">("bank");
  const [bank, setBank] = useState("nubank");
  const [nick, setNick] = useState("");
  const [accountType, setAccountType] = useState("Conta corrente");
  const [color, setColor] = useState("auto");

  const previewFace = color === "auto" ? brandOf(bank).face : (CARD_COLORS.find(c => c.id === color)?.face ?? brandOf(bank).face);
  const previewAcc = { id: "", userId: "", nick: nick || brandOf(bank).name, bank, accountType, last4: "0000", balanceCents: 0, face: previewFace, createdAtUtc: "" };

  function finish() {
    const face = color === "auto" ? null : CARD_COLORS.find(c => c.id === color)?.face ?? null;
    onDone({ nick: nick || brandOf(bank).name, bank, accountType, last4: String(Math.floor(1000 + Math.random() * 9000)), balanceCents: 0, face });
    onClose();
  }

  return (
    <Sheet onClose={onClose}>
      {step === "bank" && (
        <div className="cc-sheet-content">
          <div className="cc-sheet-title">Adicionar banco</div>
          <div className="cc-sheet-sub">Escolha a instituição. Você pode cadastrar quantos bancos quiser.</div>
          <div className="cc-bank-grid">
            {BANK_LIST.map(id => (
              <button key={id} type="button" className="cc-bank-pick" onClick={() => { setBank(id); setNick(brandOf(id).name); setStep("form"); }}>
                <span className="cc-bank-icon" style={{ background: brandOf(id).face }} />
                <span className="cc-bank-pick-label">{brandOf(id).name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "form" && (
        <div className="cc-sheet-content">
          <div className="cc-sheet-back-row">
            <button type="button" className="cc-back-circle" onClick={() => setStep("bank")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width={16} height={16}><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div>
              <div className="cc-sheet-title">{brandOf(bank).name}</div>
              <div className="cc-sheet-sub" style={{ marginTop: 1 }}>Como você quer chamar essa conta?</div>
            </div>
          </div>

          <div className="cc-preview-wrap">
            <BankCard account={previewAcc} w={230} />
          </div>

          <label className="cc-field">
            <span className="cc-field-label">Apelido da conta</span>
            <input className="cc-input" value={nick} onChange={e => setNick(e.target.value)} placeholder={`Ex: ${brandOf(bank).name} principal`} />
          </label>

          <div className="cc-field">
            <span className="cc-field-label">Tipo de conta</span>
            <div className="cc-type-grid">
              {["Conta corrente", "Poupança", "Cartão de crédito"].map(t => (
                <button key={t} type="button" className={`cc-type-btn${accountType === t ? " is-active" : ""}`} onClick={() => setAccountType(t)}>{t}</button>
              ))}
            </div>
          </div>

          <div className="cc-field">
            <span className="cc-field-label">Cor do cartão</span>
            <div className="cc-color-row">
              {CARD_COLORS.map(c => (
                <button key={c.id} type="button" className={`cc-color-swatch${color === c.id ? " is-active" : ""}`}
                  style={{ background: c.id === "auto" ? "conic-gradient(from 180deg,#9F37E8,#3B82F6,#22C55E,#EC7000,#9F37E8)" : (c.face ?? "") }}
                  onClick={() => setColor(c.id)} />
              ))}
            </div>
          </div>

          <button type="button" className="cc-primary-btn" onClick={() => setStep("done")}>Salvar conta</button>
        </div>
      )}

      {step === "done" && (
        <div className="cc-sheet-content cc-done-state">
          <div className="cc-done-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" width={34} height={34} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div className="cc-sheet-title">Conta adicionada!</div>
          <div className="cc-sheet-sub">{nick || brandOf(bank).name} agora aparece no seu saldo em contas.</div>
          <button type="button" className="cc-primary-btn" onClick={finish} style={{ marginTop: 8 }}>Concluir</button>
        </div>
      )}
    </Sheet>
  );
}

// ── EditSheet ─────────────────────────────────────────────────────────────────

function EditSheet({ account, onClose, onSave, onDelete }: {
  account: BankAccount;
  onClose: () => void;
  onSave: (patch: { nick: string; accountType: string; face?: string | null }) => void;
  onDelete: () => void;
}) {
  const [nick, setNick] = useState(account.nick);
  const [accountType, setAccountType] = useState(account.accountType);
  const [color, setColor] = useState("keep");
  const [confirmDel, setConfirmDel] = useState(false);

  const colors = [{ id: "keep", label: "Atual", face: brandFace(account.bank, account.face) }, ...CARD_COLORS];
  const previewFace =
    color === "keep" ? brandFace(account.bank, account.face)
    : color === "auto" ? brandOf(account.bank).face
    : CARD_COLORS.find(c => c.id === color)?.face ?? brandOf(account.bank).face;

  const previewAcc = { ...account, face: previewFace, nick };

  function save() {
    const face = color === "keep" ? account.face : color === "auto" ? null : CARD_COLORS.find(c => c.id === color)?.face ?? null;
    onSave({ nick: nick || account.nick, accountType, face });
    onClose();
  }

  return (
    <Sheet onClose={onClose}>
      <div className="cc-sheet-content">
        <div className="cc-sheet-title">Editar conta</div>

        <div className="cc-preview-wrap">
          <BankCard account={previewAcc} w={224} />
        </div>

        <label className="cc-field">
          <span className="cc-field-label">Apelido da conta</span>
          <input className="cc-input" value={nick} onChange={e => setNick(e.target.value)} />
        </label>

        <div className="cc-field">
          <span className="cc-field-label">Tipo de conta</span>
          <div className="cc-type-grid">
            {["Conta corrente", "Poupança", "Cartão de crédito"].map(t => (
              <button key={t} type="button" className={`cc-type-btn${accountType === t ? " is-active" : ""}`} onClick={() => setAccountType(t)}>{t}</button>
            ))}
          </div>
        </div>

        <div className="cc-field">
          <span className="cc-field-label">Cor do cartão</span>
          <div className="cc-color-row">
            {colors.map(c => (
              <button key={c.id} type="button" className={`cc-color-swatch${color === c.id ? " is-active" : ""}`}
                style={{ background: c.id === "auto" ? "conic-gradient(from 180deg,#9F37E8,#3B82F6,#22C55E,#EC7000,#9F37E8)" : (c.face ?? "") }}
                onClick={() => setColor(c.id)} />
            ))}
          </div>
        </div>

        <button type="button" className="cc-primary-btn" onClick={save}>Salvar alterações</button>

        {!confirmDel ? (
          <button type="button" className="cc-ghost-btn cc-ghost-btn-danger" onClick={() => setConfirmDel(true)}>Excluir conta</button>
        ) : (
          <div className="cc-confirm-delete">
            <span className="cc-confirm-delete-text">Excluir {account.nick} permanentemente?</span>
            <div className="cc-confirm-delete-btns">
              <button type="button" className="cc-ghost-btn" onClick={() => setConfirmDel(false)}>Cancelar</button>
              <button type="button" className="cc-danger-btn" onClick={() => { onDelete(); onClose(); }}>Excluir</button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

// ── TransferSheet ─────────────────────────────────────────────────────────────

function TransferSheet({ accounts, defaultFrom, onClose, onConfirm }: {
  accounts: BankAccount[];
  defaultFrom?: string;
  onClose: () => void;
  onConfirm: (fromId: string, toId: string, cents: number) => void;
}) {
  const [from, setFrom] = useState(defaultFrom ?? accounts[0]?.id ?? "");
  const [to, setTo] = useState(accounts.find(a => a.id !== (defaultFrom ?? accounts[0]?.id))?.id ?? "");
  const [cents, setCents] = useState(0);
  const [done, setDone] = useState(false);

  const fromAcc = accounts.find(a => a.id === from);
  const toAcc = accounts.find(a => a.id === to);
  const valid = cents > 0 && from !== to && fromAcc != null && cents <= fromAcc.balanceCents;

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = (e.target.value.match(/\d/g) ?? []).join("");
    setCents(parseInt(digits || "0", 10));
  }

  function picker(value: string, setValue: (id: string) => void, exclude: string) {
    return (
      <div className="cc-transfer-chips">
        {accounts.filter(a => a.id !== exclude).map(a => {
          const on = value === a.id;
          return (
            <button key={a.id} type="button" className={`cc-transfer-chip${on ? " is-active" : ""}`} onClick={() => setValue(a.id)}>
              <span className="cc-chip-icon" style={{ background: brandFace(a.bank, a.face) }} />
              {a.nick}
            </button>
          );
        })}
      </div>
    );
  }

  if (done) {
    return (
      <Sheet onClose={onClose}>
        <div className="cc-sheet-content cc-done-state">
          <div className="cc-done-icon cc-done-icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" width={34} height={34} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div className="cc-sheet-title">Transferência registrada!</div>
          <div className="cc-sheet-sub">{fmtBRL(cents)} de {fromAcc?.nick} para {toAcc?.nick}. Não conta como receita nem despesa.</div>
          <button type="button" className="cc-primary-btn" onClick={onClose} style={{ marginTop: 8 }}>Concluir</button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet onClose={onClose}>
      <div className="cc-sheet-content">
        <div className="cc-sheet-title">Transferência entre contas</div>
        <div className="cc-sheet-sub">Mova dinheiro entre seus bancos sem virar despesa ou receita.</div>

        <div className="cc-field">
          <span className="cc-field-label">De</span>
          {picker(from, (id) => { setFrom(id); if (id === to) setTo(accounts.find(a => a.id !== id)?.id ?? ""); }, "")}
        </div>

        <div className="cc-transfer-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={16} height={16} aria-hidden="true"><path d="M12 5v14"/><path d="m6 13 6 6 6-6"/></svg>
        </div>

        <div className="cc-field">
          <span className="cc-field-label">Para</span>
          {picker(to, setTo, from)}
        </div>

        <div className="cc-field">
          <span className="cc-field-label">Valor</span>
          <div className="cc-money-wrap">
            <span className="cc-money-prefix">R$</span>
            <input
              className="cc-money-input"
              inputMode="numeric"
              value={(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              onChange={handleAmountChange}
            />
          </div>
          {fromAcc && (
            <span className={`cc-balance-hint${cents > fromAcc.balanceCents ? " is-error" : ""}`}>
              Saldo em {fromAcc.nick}: {fmtBRL(fromAcc.balanceCents)}{cents > fromAcc.balanceCents ? " · saldo insuficiente" : ""}
            </span>
          )}
        </div>

        <button
          type="button"
          className="cc-primary-btn"
          style={{ opacity: valid ? 1 : 0.4, pointerEvents: valid ? "auto" : "none" }}
          onClick={() => { onConfirm(from, to, cents); setDone(true); }}
        >
          Transferir {cents > 0 ? fmtBRL(cents) : ""}
        </button>
      </div>
    </Sheet>
  );
}

// ── Main Contas page ──────────────────────────────────────────────────────────

type Sheet = "add" | "edit" | "transfer" | null;

export default function Contas() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<BankAccount | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [transferFrom, setTransferFrom] = useState<string | undefined>();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listBankAccounts();
      setAccounts(data);
      setError(null);
    } catch {
      setError("Não foi possível carregar suas contas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const totalBalance = accounts.reduce((s, a) => s + a.balanceCents, 0);

  async function handleAdd(data: Omit<BankAccount, "id" | "userId" | "createdAtUtc" | "updatedAtUtc">) {
    try {
      const created = await createBankAccount(data);
      setAccounts(prev => [created, ...prev]);
    } catch {
      window.alert("Erro ao cadastrar conta.");
    }
  }

  async function handleSave(patch: { nick: string; accountType: string; face?: string | null }) {
    if (!editing) return;
    try {
      const updated = await updateBankAccount(editing.id, patch);
      setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
      if (detail?.id === updated.id) setDetail(updated);
    } catch {
      window.alert("Erro ao salvar alterações.");
    }
  }

  async function handleDelete() {
    if (!editing) return;
    try {
      await deleteBankAccount(editing.id);
      setAccounts(prev => prev.filter(a => a.id !== editing.id));
      if (detail?.id === editing.id) setDetail(null);
    } catch {
      window.alert("Erro ao excluir conta.");
    }
  }

  async function handleTransfer(fromId: string, toId: string, cents: number) {
    try {
      const result = await transferBetweenAccounts(fromId, toId, cents);
      setAccounts(prev => prev.map(a => {
        if (a.id === fromId) return { ...a, balanceCents: result.fromBalance };
        if (a.id === toId) return { ...a, balanceCents: result.toBalance };
        return a;
      }));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Erro na transferência.");
    }
  }

  return (
    <div className="cc-page">
      {detail ? (
        <AccountDetail
          account={detail}
          onBack={() => setDetail(null)}
          onEdit={(a) => { setEditing(a); setSheet("edit"); }}
          onTransfer={(a) => { setTransferFrom(a.id); setSheet("transfer"); }}
        />
      ) : (
        <>
          <div className="cc-page-header">
            <span className="cc-page-eyebrow">CARTEIRAS</span>
            <h1 className="cc-page-title">Suas contas</h1>
            <p className="cc-page-sub">
              {accounts.length} {accounts.length === 1 ? "banco" : "bancos"} · saldo total{" "}
              <strong className="cc-total-balance">{fmtBRL(totalBalance)}</strong>
            </p>
          </div>

          {loading ? (
            <div className="cc-loading">
              <div className="cc-spinner" />
            </div>
          ) : error ? (
            <div className="cc-error">
              {error}
              <button type="button" onClick={load} className="cc-retry-btn">Tentar novamente</button>
            </div>
          ) : (
            <>
              <div className="cc-deck-section">
                <CardDeck
                  accounts={accounts}
                  onSelect={(a) => setDetail(a)}
                  onAdd={() => setSheet("add")}
                  w={Math.min(290, window.innerWidth - 48)}
                />
              </div>

              {accounts.length > 0 && (
                <div className="cc-list-section">
                  <div className="cc-section-title">Lista de contas</div>
                  <div className="cc-account-list">
                    {accounts.map((acc, i) => {
                      const face = brandFace(acc.bank, acc.face);
                      return (
                        <button key={acc.id} type="button" className="cc-account-row" onClick={() => setDetail(acc)}
                          style={{ borderTop: i > 0 ? "1px solid rgba(148,163,184,.08)" : "none" }}>
                          <span className="cc-row-icon" style={{ background: face }} />
                          <div className="cc-row-info">
                            <div className="cc-row-nick">{acc.nick}</div>
                            <div className="cc-row-sub">{acc.accountType} · ••{acc.last4}</div>
                          </div>
                          <div className="cc-row-right">
                            <div className="cc-row-balance">{fmtBRL(acc.balanceCents)}</div>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={15} height={15} aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {accounts.length > 1 && (
                <button type="button" className="cc-transfer-banner" onClick={() => { setTransferFrom(undefined); setSheet("transfer"); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={18} height={18} aria-hidden="true">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                  </svg>
                  Transferência entre contas
                </button>
              )}
            </>
          )}
        </>
      )}

      {sheet === "add" && (
        <CadastroSheet onClose={() => setSheet(null)} onDone={handleAdd} />
      )}
      {sheet === "edit" && editing && (
        <EditSheet account={editing} onClose={() => { setSheet(null); setEditing(null); }} onSave={handleSave} onDelete={handleDelete} />
      )}
      {sheet === "transfer" && accounts.length >= 2 && (
        <TransferSheet accounts={accounts} defaultFrom={transferFrom} onClose={() => setSheet(null)} onConfirm={handleTransfer} />
      )}
    </div>
  );
}
