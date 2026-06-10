import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { BankAccount } from "../types/finance";
import "./walletCards.css";

// ── brand definitions ─────────────────────────────────────────────────────────

export const BRANDS: Record<string, { name: string; face: string; glow: string; tier: string }> = {
  nubank:    { name: "Nubank",          face: "linear-gradient(135deg,#9F37E8 0%,#820AD1 58%,#6A02B0 100%)", glow: "rgba(130,10,209,.55)", tier: "Conta" },
  picpay:    { name: "PicPay",          face: "linear-gradient(135deg,#20242B 0%,#0C0E12 70%)",               glow: "rgba(33,194,94,.30)",  tier: "Conta" },
  bb:        { name: "Banco do Brasil", face: "linear-gradient(135deg,#0A47B8 0%,#0533A0 55%,#04246E 100%)", glow: "rgba(10,71,184,.5)",   tier: "Ourocard" },
  itau:      { name: "Itaú",            face: "linear-gradient(135deg,#FF8A1E 0%,#EC7000 50%,#C85400 100%)", glow: "rgba(236,112,0,.5)",   tier: "Personnalité" },
  inter:     { name: "Inter",           face: "linear-gradient(135deg,#FF9D4D 0%,#FF7A00 55%,#E86A00 100%)", glow: "rgba(255,122,0,.5)",   tier: "Conta" },
  c6:        { name: "C6 Bank",         face: "linear-gradient(135deg,#2C2C2E 0%,#161618 60%,#0A0A0B 100%)", glow: "rgba(40,40,42,.6)",    tier: "Carbon" },
  caixa:     { name: "Caixa",           face: "linear-gradient(135deg,#2A7FD4 0%,#1565B0 55%,#0E4A85 100%)", glow: "rgba(21,101,176,.5)",  tier: "Conta" },
  santander: { name: "Santander",       face: "linear-gradient(135deg,#F33 0%,#EC0000 50%,#B30000 100%)",    glow: "rgba(236,0,0,.5)",     tier: "Unique" },
  outro:     { name: "Outro",           face: "linear-gradient(135deg,#334155 0%,#0F172A 100%)",              glow: "rgba(51,65,85,.5)",    tier: "Conta" },
};

export const CARD_COLORS = [
  { id: "auto",     face: null },
  { id: "violet",   face: "linear-gradient(135deg,#9F37E8,#6A02B0)" },
  { id: "blue",     face: "linear-gradient(135deg,#3B82F6,#1b3fa0)" },
  { id: "green",    face: "linear-gradient(135deg,#22C55E,#15803D)" },
  { id: "graphite", face: "linear-gradient(135deg,#334155,#0F172A)" },
];

export function brandOf(bank: string) { return BRANDS[bank] ?? BRANDS.outro; }
export function brandFace(bank: string, face?: string | null) { return face ?? brandOf(bank).face; }
export function fmtBRL(cents: number) {
  return "R$ " + (Math.abs(cents) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

// ── BankCard ──────────────────────────────────────────────────────────────────

export function BankCard({ account, w = 290, onClick }: { account: BankAccount; w?: number; onClick?: () => void }) {
  const b = brandOf(account.bank);
  const face = brandFace(account.bank, account.face);
  const glow = b.glow;
  const h = w * 0.625;
  return (
    <div
      onClick={onClick}
      className="wc-card"
      style={{
        width: w, height: h, borderRadius: w * 0.07,
        background: face,
        boxShadow: `0 ${w * 0.06}px ${w * 0.12}px -${w * 0.04}px ${glow}, inset 0 1px 0 rgba(255,255,255,.18)`,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div className="wc-card-shine" />
      <div className="wc-card-body" style={{ padding: w * 0.07 }}>
        <div className="wc-card-top">
          <span className="wc-card-bankname" style={{ fontSize: w * 0.07 }}>{b.name}</span>
          <span className="wc-card-tier" style={{ fontSize: w * 0.036 }}>{b.tier}</span>
        </div>
        <div className="wc-card-bottom">
          <div>
            <div className="wc-chip" style={{ width: w * 0.11, height: w * 0.082, marginBottom: w * 0.03, borderRadius: 5 }} />
            <div className="wc-card-last4" style={{ fontSize: w * 0.05 }}>•••• {account.last4}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CardDeck (stacked, swipe to rotate) ──────────────────────────────────────

export function CardDeck({ accounts, onSelect, onAdd, w = 290 }: {
  accounts: BankAccount[];
  onSelect: (a: BankAccount) => void;
  onAdd: () => void;
  w?: number;
}) {
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
      <button type="button" className="wc-add-cta" style={{ width: w, height: Math.round(w * 0.625) }} onClick={onAdd}>
        <span className="wc-add-icon">+</span>
        Adicionar banco
      </button>
    );
  }

  return (
    <div className="wc-deck-wrap">
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

      <div className="wc-deck-dots">
        {accounts.map((_, i) => (
          <button key={i} type="button" onClick={() => goTo(i)} className={`wc-dot${i === active ? " is-active" : ""}`} />
        ))}
      </div>
      <div className="wc-deck-actions">
        <button type="button" className="wc-pill-btn" onClick={() => { buzz(); setExpanded(e => !e); }}>
          {expanded ? "Recolher" : "Expandir cartões"}
        </button>
        <button type="button" className="wc-pill-btn wc-pill-btn-blue" onClick={onAdd}>
          + Novo banco
        </button>
      </div>
      <p className="wc-deck-hint">Deslize pra trocar · toque pra abrir a conta</p>
    </div>
  );
}

// ── DashboardWalletSection ────────────────────────────────────────────────────

export function DashboardWalletSection({ accounts, loading }: { accounts: BankAccount[]; loading: boolean }) {
  const navigate = useNavigate();

  if (loading) return null;

  return (
    <div className="wc-dash-section">
      <div className="wc-dash-header">
        <h3 className="wc-dash-title">Meus cartões</h3>
        <button type="button" className="wc-dash-manage" onClick={() => navigate("/contas")}>
          Gerenciar
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width={14} height={14} aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
        </button>
      </div>
      <CardDeck
        accounts={accounts}
        onSelect={() => navigate("/contas")}
        onAdd={() => navigate("/contas")}
        w={Math.min(290, (typeof window !== "undefined" ? window.innerWidth : 390) - 48)}
      />
    </div>
  );
}
