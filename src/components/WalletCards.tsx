import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { BankAccount } from "../types/finance";
import "./walletCards.css";

// ── network marks (bandeiras) ─────────────────────────────────────────────────

function MastercardMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 54 34" aria-hidden="true">
      <circle cx="20" cy="17" r="15" fill="#EB001B" />
      <circle cx="34" cy="17" r="15" fill="#F79E1B" />
      <path d="M27 5.7a15 15 0 0 0 0 22.6 15 15 0 0 0 0-22.6Z" fill="#FF5F00" />
    </svg>
  );
}

function VisaMark({ color = "#fff", size = 40 }: { color?: string; size?: number }) {
  return (
    <span style={{
      fontFamily: "Space Grotesk, system-ui", fontStyle: "italic", fontWeight: 700,
      fontSize: size * 0.42, letterSpacing: "0.04em", color,
    }}>VISA</span>
  );
}

function EloMark({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.42} viewBox="0 0 60 26" aria-hidden="true">
      <circle cx="13" cy="13" r="10" fill="#FFCB05" />
      <circle cx="30" cy="13" r="10" fill="#00A4E0" />
      <circle cx="47" cy="13" r="10" fill="#EF4123" />
    </svg>
  );
}

// ── bank wordmark logos ───────────────────────────────────────────────────────

function NubankLogo({ s = 30 }: { s?: number }) {
  return (
    <span style={{ fontFamily: "Manrope, system-ui", fontWeight: 800, fontSize: s, color: "#fff", letterSpacing: "-0.06em", lineHeight: 1 }}>
      nu
    </span>
  );
}

function PicPayLogo({ s = 24 }: { s?: number }) {
  return (
    <span style={{ fontFamily: "Space Grotesk, system-ui", fontWeight: 700, fontSize: s, letterSpacing: "-0.02em", lineHeight: 1, display: "inline-flex", alignItems: "baseline" }}>
      <span style={{ color: "#fff" }}>Pic</span><span style={{ color: "#21C25E" }}>Pay</span>
    </span>
  );
}

function BBLogo({ s = 26 }: { s?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span style={{
        width: s * 1.05, height: s * 1.05, borderRadius: 6, background: "#FAE128",
        display: "grid", placeItems: "center", fontFamily: "Space Grotesk, system-ui",
        fontWeight: 700, fontSize: s * 0.62, color: "#0033A0", letterSpacing: "-0.04em",
      }}>BB</span>
    </span>
  );
}

function ItauLogo({ s = 24 }: { s?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span style={{
        width: s * 1.15, height: s * 1.15, borderRadius: 7, background: "#003399",
        display: "grid", placeItems: "center", fontFamily: "Space Grotesk, system-ui",
        fontWeight: 700, fontSize: s * 0.66, color: "#FFD200", letterSpacing: "-0.05em",
      }}>i</span>
      <span style={{ fontFamily: "Manrope, system-ui", fontWeight: 800, fontSize: s, color: "#fff", letterSpacing: "-0.02em" }}>itaú</span>
    </span>
  );
}

function InterLogo({ s = 22 }: { s?: number }) {
  return (
    <span style={{ fontFamily: "Manrope, system-ui", fontWeight: 800, fontSize: s, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>
      Inter
    </span>
  );
}

function C6Logo({ s = 24 }: { s?: number }) {
  return (
    <span style={{ fontFamily: "Space Grotesk, system-ui", fontWeight: 700, fontSize: s, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1 }}>
      C6
    </span>
  );
}

function CaixaLogo({ s = 20 }: { s?: number }) {
  return (
    <span style={{ fontFamily: "Manrope, system-ui", fontWeight: 900, fontSize: s, color: "#fff", letterSpacing: "0.02em", lineHeight: 1 }}>
      CAIXA
    </span>
  );
}

function SantanderLogo({ s = 22 }: { s?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: s * 1.1, height: s * 1.1, borderRadius: 999, background: "#fff", display: "grid", placeItems: "center", fontFamily: "Space Grotesk", fontWeight: 700, fontSize: s * 0.7, color: "#EC0000" }}>S</span>
      <span style={{ fontFamily: "Manrope, system-ui", fontWeight: 800, fontSize: s * 0.82, color: "#fff", letterSpacing: "-0.01em" }}>Santander</span>
    </span>
  );
}

function OutroLogo({ s = 22 }: { s?: number }) {
  return (
    <span style={{ fontFamily: "Manrope, system-ui", fontWeight: 800, fontSize: s, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>
      Banco
    </span>
  );
}

// ── brand definitions ─────────────────────────────────────────────────────────

type BrandDef = {
  name: string;
  face: string;
  glow: string;
  tier: string;
  Logo: (props: { s?: number }) => React.ReactElement;
  Network: (props: { size?: number }) => React.ReactElement;
};

export const BRANDS: Record<string, BrandDef> = {
  nubank:    { name: "Nubank",          face: "linear-gradient(135deg,#9F37E8 0%,#820AD1 58%,#6A02B0 100%)", glow: "rgba(130,10,209,.55)", tier: "Ultravioleta", Logo: NubankLogo,    Network: MastercardMark },
  picpay:    { name: "PicPay",          face: "linear-gradient(135deg,#20242B 0%,#0C0E12 70%)",               glow: "rgba(33,194,94,.30)",  tier: "Conta",         Logo: PicPayLogo,    Network: MastercardMark },
  bb:        { name: "Banco do Brasil", face: "linear-gradient(135deg,#0A47B8 0%,#0533A0 55%,#04246E 100%)", glow: "rgba(10,71,184,.5)",   tier: "Ourocard",      Logo: BBLogo,        Network: EloMark        },
  itau:      { name: "Itaú",            face: "linear-gradient(135deg,#FF8A1E 0%,#EC7000 50%,#C85400 100%)", glow: "rgba(236,112,0,.5)",   tier: "Personnalité",  Logo: ItauLogo,      Network: MastercardMark },
  inter:     { name: "Inter",           face: "linear-gradient(135deg,#FF9D4D 0%,#FF7A00 55%,#E86A00 100%)", glow: "rgba(255,122,0,.5)",   tier: "Black",         Logo: InterLogo,     Network: MastercardMark },
  c6:        { name: "C6 Bank",         face: "linear-gradient(135deg,#2C2C2E 0%,#161618 60%,#0A0A0B 100%)", glow: "rgba(40,40,42,.6)",    tier: "Carbon",        Logo: C6Logo,        Network: MastercardMark },
  caixa:     { name: "Caixa",           face: "linear-gradient(135deg,#2A7FD4 0%,#1565B0 55%,#0E4A85 100%)", glow: "rgba(21,101,176,.5)",  tier: "Ourocard",      Logo: CaixaLogo,     Network: EloMark        },
  santander: { name: "Santander",       face: "linear-gradient(135deg,#F33 0%,#EC0000 50%,#B30000 100%)",    glow: "rgba(236,0,0,.5)",     tier: "Unique",        Logo: SantanderLogo, Network: VisaMark       },
  outro:     { name: "Outro",           face: "linear-gradient(135deg,#334155 0%,#0F172A 100%)",              glow: "rgba(51,65,85,.5)",    tier: "Conta",         Logo: OutroLogo,     Network: MastercardMark },
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
      {/* diagonal shine */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(115deg, rgba(255,255,255,0.14) 0%, transparent 32%, transparent 70%, rgba(0,0,0,0.18) 100%)",
        pointerEvents: "none",
      }} />
      <div className="wc-card-body" style={{ position: "absolute", inset: 0, padding: w * 0.07, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div className="wc-card-top" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Logo s={w * 0.085} />
          <span style={{ fontFamily: "Manrope, system-ui", fontWeight: 700, fontSize: w * 0.04, opacity: 0.85, letterSpacing: "0.02em", color: "#fff" }}>{b.tier}</span>
        </div>
        <div className="wc-card-bottom" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{
              width: w * 0.11, height: w * 0.082, borderRadius: 5, marginBottom: w * 0.03,
              background: "linear-gradient(135deg, #F4D58A, #C9A24B)",
              boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
            }} />
            <div style={{ fontFamily: "Space Grotesk, system-ui", fontWeight: 500, fontSize: w * 0.05, letterSpacing: "0.12em", opacity: 0.92, color: "#fff" }}>
              •••• {account.last4}
            </div>
          </div>
          <Network size={w * 0.13} />
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
