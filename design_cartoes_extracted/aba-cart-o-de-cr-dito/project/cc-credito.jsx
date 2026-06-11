// cc-credito.jsx — Feature CARTÃO DE CRÉDITO do Conciliaaí
// Tela de cartões (3 layouts), detalhe do cartão, sheets: novo cartão, pagar fatura, lançar gasto.
// Acento do mundo "crédito" = âmbar (#F59E0B) — distingue do azul (contas) e roxo (grupos).
// Exporta (window): CreditoScreen, CartaoDetail, NovoCartaoSheet, PagarFaturaSheet, GastoCartaoSheet

const CREDIT_ACCENT = '#F59E0B';
const CREDIT_ACCENT_LT = '#FBBF24';

// estilos locais (nomes únicos pra não colidir com cc-sheets)
const cSheetTitle = { fontFamily: 'Space Grotesk, system-ui', fontWeight: 700, fontSize: 21, color: '#F1F5F9', letterSpacing: '-0.01em' };
const cSheetSub = { color: '#94A3B8', fontSize: 13.5, fontWeight: 600, marginTop: 4, lineHeight: 1.4 };
const cField = { display: 'grid', gap: 8 };
const cFieldLabel = { color: '#94A3B8', fontSize: 12.5, fontWeight: 800, letterSpacing: '0.01em' };
const cInput = {
  minHeight: 48, borderRadius: 13, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(11,17,32,0.72)',
  color: '#F1F5F9', padding: '0 14px', fontFamily: 'Manrope', fontSize: 15, fontWeight: 600, outline: 'none', width: '100%', boxSizing: 'border-box',
};
const cPrimaryBtn = {
  width: '100%', minHeight: 52, borderRadius: 16, border: 0, cursor: 'pointer',
  background: 'linear-gradient(135deg,#FBBF24,#F59E0B)', color: '#241803',
  fontFamily: 'Manrope, system-ui', fontWeight: 900, fontSize: 15.5,
  boxShadow: '0 12px 30px rgba(245,158,11,0.36)',
};
const cGhostBtn = {
  width: '100%', minHeight: 48, borderRadius: 14, cursor: 'pointer',
  border: '1px solid rgba(148,163,184,0.2)', background: 'transparent', color: '#94A3B8',
  fontFamily: 'Manrope, system-ui', fontWeight: 800, fontSize: 14,
};

const CREDIT_BANKS = ['nubank', 'itau', 'inter', 'c6', 'bb', 'santander', 'caixa', 'picpay'];
const CREDIT_COLORS = [
  { id: 'auto', label: 'Da marca', face: null },
  { id: 'violet', face: 'linear-gradient(135deg,#9F37E8,#6A02B0)' },
  { id: 'amber', face: 'linear-gradient(135deg,#FBBF24,#D97706)' },
  { id: 'blue', face: 'linear-gradient(135deg,#3B82F6,#1b3fa0)' },
  { id: 'graphite', face: 'linear-gradient(135deg,#334155,#0F172A)' },
];
function creditFace(id) { return brandOf(id).face; }
function creditBankName(id) { return brandOf(id).name; }
function CreditBankLogo({ id, s }) { const L = brandOf(id).Logo; return <L s={s} />; }

// cor da barra de limite conforme uso
function usageColor(pct) { return pct < 0.5 ? '#4ADE80' : pct < 0.82 ? CREDIT_ACCENT : '#F87171'; }

function LimitBar({ used, limit, height = 8 }) {
  const pct = limit > 0 ? Math.min(1, used / limit) : 0;
  const col = usageColor(pct);
  return (
    <div style={{ width: '100%', height, borderRadius: 999, background: 'rgba(148,163,184,0.16)', overflow: 'hidden' }}>
      <div style={{ width: `${Math.max(3, pct * 100)}%`, height: '100%', borderRadius: 999, background: `linear-gradient(90deg, ${col}, ${col}cc)`, transition: 'width 0.5s var(--ease)' }} />
    </div>
  );
}

// ---------- HERO da tela de crédito ----------
function CreditHero() {
  const open = CC.creditOpenTotal();
  const limit = CC.creditLimitTotal();
  const avail = CC.creditAvailableTotal();
  const pct = limit > 0 ? open / limit : 0;
  return (
    <div style={{
      borderRadius: 22, padding: 20, position: 'relative', overflow: 'hidden',
      border: '1px solid rgba(245,158,11,0.30)',
      background: 'radial-gradient(circle at 16% 0%, rgba(245,158,11,0.34), transparent 42%), linear-gradient(135deg, #3a2a10 0%, #271c0c 60%, #1c1407 100%)',
      boxShadow: '0 18px 48px rgba(60,40,5,0.45)',
    }}>
      <div style={{ position: 'absolute', right: -40, top: -30, width: 180, height: 180, borderRadius: 999, background: 'rgba(245,158,11,0.10)' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <span style={{ color: '#fde68a', fontSize: 13.5, fontWeight: 700 }}>Fatura aberta</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 999, background: 'rgba(245,158,11,0.16)', color: '#fde68a', fontSize: 12, fontWeight: 800 }}>
          <Icon name="card" size={14} color="#fde68a" /> {CC.cards.length} cartões
        </span>
      </div>
      <div style={{ fontFamily: 'Space Grotesk, system-ui', fontWeight: 700, fontSize: 40, color: '#fff', letterSpacing: '-0.02em', marginTop: 6, position: 'relative' }}>{fmtBRL(open)}</div>
      <div style={{ marginTop: 14, position: 'relative' }}>
        <LimitBar used={open} limit={limit} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ color: '#fcd34d', fontSize: 12, fontWeight: 700 }}>Limite livre {fmtBRL(avail)}</span>
          <span style={{ color: '#a8a29e', fontSize: 12, fontWeight: 700 }}>{Math.round(pct * 100)}% usado</span>
        </div>
      </div>
    </div>
  );
}

// ---------- Painel-resumo de UM cartão (usado em deck e carrossel) ----------
function CardSummaryPanel({ card, onPay, onSpend, onOpen }) {
  const limit = card.limit || 1;
  const pct = card.invoice / limit;
  return (
    <div style={{ borderRadius: 20, border: '1px solid rgba(148,163,184,0.12)', background: 'rgba(30,41,59,0.5)', padding: 18, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'grid', gap: 2 }}>
          <span style={{ color: '#94A3B8', fontSize: 12.5, fontWeight: 700 }}>Fatura aberta</span>
          <strong style={{ fontFamily: 'Space Grotesk, system-ui', fontWeight: 700, fontSize: 28, color: CREDIT_ACCENT_LT, letterSpacing: '-0.02em' }}>{fmtBRL(card.invoice)}</strong>
        </div>
        <button onClick={onOpen} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 0, background: 'transparent', color: '#94A3B8', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', fontFamily: 'Manrope', paddingTop: 4 }}>
          Detalhes <Icon name="chevR" size={14} color="#94A3B8" />
        </button>
      </div>

      <div style={{ display: 'grid', gap: 7 }}>
        <LimitBar used={card.invoice} limit={card.limit} />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748B', fontSize: 11.5, fontWeight: 700 }}>Limite {fmtBRL(card.limit)}</span>
          <span style={{ color: '#94A3B8', fontSize: 11.5, fontWeight: 700 }}>Livre {fmtBRL(card.limit - card.invoice)}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <DateChip icon="calendar" label="Vence" value={`dia ${card.dueDay}`} />
        <DateChip icon="receipt" label="Fecha" value={`dia ${card.closingDay}`} />
        <DateChip icon="clock" label="Melhor dia" value={`dia ${card.bestDay}`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button onClick={onPay} style={{ ...cPrimaryBtn, minHeight: 46, fontSize: 14.5 }}>Pagar fatura</button>
        <button onClick={onSpend} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, borderRadius: 13, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(15,23,42,0.55)', color: '#E2E8F0', fontFamily: 'Manrope', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>
          <Icon name="plus" size={15} color="#E2E8F0" /> Lançar gasto
        </button>
      </div>
    </div>
  );
}

function DateChip({ icon, label, value }) {
  return (
    <div style={{ display: 'grid', gap: 4, padding: '10px 8px', borderRadius: 13, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(148,163,184,0.1)', justifyItems: 'center', textAlign: 'center' }}>
      <Icon name={icon} size={16} color={CREDIT_ACCENT} />
      <span style={{ color: '#64748B', fontSize: 10.5, fontWeight: 700 }}>{label}</span>
      <span style={{ color: '#E2E8F0', fontSize: 12.5, fontWeight: 800, fontFamily: 'Manrope', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

// ---------- LAYOUT A: deck empilhado (Google Wallet) ----------
function CreditDeck({ cards, active, setActive, onOpen, onPay, onSpend, onAdd, w = 290 }) {
  const n = cards.length;
  const [expanded, setExpanded] = React.useState(false);
  const ch = w * 0.625;
  const peek = 15;
  const maxBehind = Math.min(n - 1, 3);
  const gap = 16;
  const drag = React.useRef({ x: 0, moved: false });
  const buzz = (ms = 12) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };
  const collapsedH = ch + peek * maxBehind;
  const expandedH = (ch + gap) * n - gap;
  const go = (i) => { if (i !== active) buzz(); setActive(((i % n) + n) % n); };

  const onDown = (e) => { drag.current = { x: (e.touches ? e.touches[0].clientX : e.clientX), moved: false }; };
  const onMove = (e) => { const x = e.touches ? e.touches[0].clientX : e.clientX; if (Math.abs(x - drag.current.x) > 8) drag.current.moved = true; };
  const onUp = (e) => {
    if (expanded) return;
    const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const dx = x - drag.current.x;
    if (dx < -42) go(active + 1); else if (dx > 42) go(active - 1);
  };

  const card = cards[active];
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
        style={{ position: 'relative', width: w, margin: '0 auto', height: expanded ? expandedH : collapsedH, transition: 'height 0.45s cubic-bezier(0.16,1,0.3,1)', touchAction: 'pan-y', userSelect: 'none' }}>
        {cards.map((c, i) => {
          const d = (i - active + n) % n;
          let y, scale, op, z, show = true;
          if (expanded) { y = d * (ch + gap); scale = 1; op = 1; z = n - d; }
          else { const dd = Math.min(d, maxBehind); y = (maxBehind - dd) * peek; scale = 1 - dd * 0.05; op = d > maxBehind ? 0 : 1 - dd * 0.14; z = n - d; show = d <= maxBehind; }
          return (
            <div key={c.id} style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${y}px) scale(${scale})`, transformOrigin: 'top center', opacity: op, zIndex: z, pointerEvents: show ? 'auto' : 'none', transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease' }}>
              <BankCard account={c} w={w} onClick={() => { if (drag.current.moved) return; if (expanded || d === 0) onOpen(c); else go(i); }} />
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
        {cards.map((_, i) => (
          <button key={i} onClick={() => go(i)} style={{ width: i === active ? 22 : 7, height: 7, borderRadius: 999, border: 0, padding: 0, cursor: 'pointer', background: i === active ? `linear-gradient(90deg,${CREDIT_ACCENT_LT},${CREDIT_ACCENT})` : 'rgba(148,163,184,0.3)', transition: 'all 0.3s var(--ease)' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button onClick={() => { buzz(8); setExpanded(e => !e); }} style={creditPill}>{expanded ? 'Recolher' : 'Expandir cartões'}</button>
        <button onClick={onAdd} style={{ ...creditPill, background: 'rgba(245,158,11,0.14)', borderColor: 'rgba(251,191,36,0.35)', color: '#fde68a' }}>+ Novo cartão</button>
      </div>

      <CardSummaryPanel card={card} onPay={() => onPay(card)} onSpend={() => onSpend(card)} onOpen={() => onOpen(card)} />
    </div>
  );
}

const creditPill = {
  minHeight: 38, padding: '0 16px', borderRadius: 999,
  border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(15,23,42,0.55)',
  color: '#E2E8F0', fontFamily: 'Manrope, system-ui', fontWeight: 800, fontSize: 13.5, cursor: 'pointer',
};

// ---------- LAYOUT B: lista detalhada ----------
function CreditList({ cards, onOpen, onPay, onSpend, onAdd }) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {cards.map(c => {
        const b = brandOf(c.brand);
        const free = c.limit - c.invoice;
        return (
          <div key={c.id} style={{ borderRadius: 20, border: '1px solid rgba(148,163,184,0.12)', background: 'rgba(30,41,59,0.5)', padding: 16, display: 'grid', gap: 14 }}>
            <button onClick={() => onOpen(c)} style={{ display: 'flex', alignItems: 'center', gap: 13, border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
              <span style={{ width: 60, height: 38, borderRadius: 9, background: c.face || b.face, display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                <CreditBankLogo id={c.brand} s={13} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#F1F5F9', fontWeight: 800, fontSize: 15, fontFamily: 'Space Grotesk' }}>{c.nick}</div>
                <div style={{ color: '#64748B', fontSize: 12, fontWeight: 600 }}>•••• {c.last4} · vence dia {c.dueDay}</div>
              </div>
              <Icon name="chevR" size={16} color="#475569" />
            </button>

            <div style={{ display: 'grid', gap: 7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ color: '#94A3B8', fontSize: 12.5, fontWeight: 700 }}>Fatura aberta</span>
                <strong style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 19, color: CREDIT_ACCENT_LT }}>{fmtBRL(c.invoice)}</strong>
              </div>
              <LimitBar used={c.invoice} limit={c.limit} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B', fontSize: 11.5, fontWeight: 700 }}>Limite {fmtBRL(c.limit)}</span>
                <span style={{ color: '#94A3B8', fontSize: 11.5, fontWeight: 700 }}>Livre {fmtBRL(free)}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button onClick={() => onPay(c)} style={{ ...cPrimaryBtn, minHeight: 44, fontSize: 14 }}>Pagar fatura</button>
              <button onClick={() => onSpend(c)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, borderRadius: 13, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(15,23,42,0.55)', color: '#E2E8F0', fontFamily: 'Manrope', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>
                <Icon name="plus" size={15} color="#E2E8F0" /> Lançar
              </button>
            </div>
          </div>
        );
      })}
      <AddCreditCta onClick={onAdd} />
    </div>
  );
}

function AddCreditCta({ onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%', minHeight: 54, borderRadius: 16, border: '1.5px dashed rgba(251,191,36,0.4)', background: 'rgba(245,158,11,0.08)', color: '#fde68a', fontFamily: 'Manrope', fontWeight: 800, fontSize: 14.5, cursor: 'pointer' }}>
      <Icon name="plus" size={18} color="#fde68a" /> Adicionar cartão de crédito
    </button>
  );
}

// ---------- LAYOUT C: carrossel ----------
function CreditCarousel({ cards, active, setActive, onOpen, onPay, onSpend, onAdd, w = 286 }) {
  const ref = React.useRef(null);
  const onScroll = () => {
    const el = ref.current; if (!el) return;
    const i = Math.round(el.scrollLeft / (w + 16));
    const clamped = Math.max(0, Math.min(cards.length - 1, i));
    setActive(prev => { if (prev !== clamped) { try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {} } return clamped; });
  };
  const card = cards[active];
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div ref={ref} onScroll={onScroll} style={{ display: 'flex', gap: 16, overflowX: 'auto', scrollSnapType: 'x mandatory', padding: '4px 28px 8px', margin: '0 -20px', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {cards.map((c) => (
          <div key={c.id} style={{ scrollSnapAlign: 'center', flexShrink: 0 }}>
            <BankCard account={c} w={w} onClick={() => onOpen(c)} />
          </div>
        ))}
        <div style={{ scrollSnapAlign: 'center', flexShrink: 0, display: 'grid', placeItems: 'center' }}>
          <button onClick={onAdd} style={{ width: w, height: w * 0.625, borderRadius: w * 0.07, border: '1.5px dashed rgba(251,191,36,0.4)', background: 'rgba(245,158,11,0.08)', color: '#fde68a', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontFamily: 'Manrope', fontWeight: 800, fontSize: 15 }}>
            <span style={{ width: 42, height: 42, borderRadius: 999, background: 'rgba(245,158,11,0.16)', border: '1px solid rgba(251,191,36,0.4)', display: 'grid', placeItems: 'center', fontSize: 24, color: '#fde68a', lineHeight: 1 }}>+</span>
            Novo cartão
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 7, justifyContent: 'center' }}>
        {cards.map((_, i) => (
          <span key={i} style={{ width: i === active ? 22 : 7, height: 7, borderRadius: 999, background: i === active ? `linear-gradient(90deg,${CREDIT_ACCENT_LT},${CREDIT_ACCENT})` : 'rgba(148,163,184,0.3)', transition: 'all 0.3s var(--ease)' }} />
        ))}
      </div>
      <CardSummaryPanel card={card} onPay={() => onPay(card)} onSpend={() => onSpend(card)} onOpen={() => onOpen(card)} />
    </div>
  );
}

// ---------- TELA CRÉDITO ----------
function CreditoScreen({ layout, cards, onOpen, onPay, onSpend, onAdd }) {
  const [active, setActive] = React.useState(0);
  React.useEffect(() => { if (active > cards.length - 1) setActive(Math.max(0, cards.length - 1)); }, [cards.length]);

  return (
    <ScreenScroll>
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'grid', gap: 4, marginTop: 2 }}>
          <span style={{ color: CREDIT_ACCENT, fontSize: 11.5, fontWeight: 800, letterSpacing: '0.14em' }}>CRÉDITO</span>
          <h2 style={{ fontFamily: 'Space Grotesk, system-ui', fontWeight: 700, fontSize: 28, color: '#F1F5F9', letterSpacing: '-0.02em' }}>Seus cartões</h2>
          <p style={{ color: '#94A3B8', fontSize: 13.5, fontWeight: 600 }}>{cards.length} cartões · fatura aberta {fmtBRL(CC.creditOpenTotal())}</p>
        </div>

        <CreditHero />

        {cards.length === 0 ? (
          <AddCreditCta onClick={onAdd} />
        ) : layout === 'lista' ? (
          <CreditList cards={cards} onOpen={onOpen} onPay={onPay} onSpend={onSpend} onAdd={onAdd} />
        ) : layout === 'carrossel' ? (
          <CreditCarousel cards={cards} active={active} setActive={setActive} onOpen={onOpen} onPay={onPay} onSpend={onSpend} onAdd={onAdd} />
        ) : (
          <CreditDeck cards={cards} active={active} setActive={setActive} onOpen={onOpen} onPay={onPay} onSpend={onSpend} onAdd={onAdd} />
        )}
      </div>
    </ScreenScroll>
  );
}

// ---------- DETALHE DO CARTÃO (full screen) ----------
function CartaoDetail({ card, onBack, onPay, onSpend, onEdit }) {
  const b = brandOf(card.brand);
  const list = CC.cardTx[card.id] || [];
  const free = card.limit - card.invoice;
  const pct = card.limit > 0 ? card.invoice / card.limit : 0;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 30, background: '#0A0F1E', display: 'flex', flexDirection: 'column', animation: 'ccSlideIn 0.34s cubic-bezier(0.16,1,0.3,1)' }}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ position: 'relative', padding: '52px 20px 22px', background: `radial-gradient(circle at 20% -10%, ${card.glow || b.glow}, transparent 60%)` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 0, background: 'rgba(255,255,255,0.08)', color: '#E2E8F0', padding: '8px 13px 8px 9px', borderRadius: 999, fontWeight: 800, fontSize: 13.5, cursor: 'pointer', fontFamily: 'Manrope' }}>
              <Icon name="chevL" size={16} color="#E2E8F0" /> Cartões
            </button>
            <button onClick={() => onEdit(card)} style={{ border: 0, background: 'rgba(255,255,255,0.08)', color: '#E2E8F0', padding: '8px 14px', borderRadius: 999, fontWeight: 800, fontSize: 13.5, cursor: 'pointer', fontFamily: 'Manrope' }}>Editar</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}><BankCard account={card} w={254} /></div>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <div style={{ color: '#94A3B8', fontSize: 13, fontWeight: 700 }}>{card.nick} · Cartão de crédito</div>
            <div style={{ color: '#64748B', fontSize: 12, fontWeight: 700, marginTop: 4 }}>Fatura aberta</div>
            <div style={{ fontFamily: 'Space Grotesk, system-ui', fontWeight: 700, fontSize: 34, color: CREDIT_ACCENT_LT, letterSpacing: '-0.02em', marginTop: 2 }}>{fmtBRL(card.invoice)}</div>
          </div>

          <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 16, background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(148,163,184,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
              <span style={{ color: '#94A3B8', fontSize: 12.5, fontWeight: 700 }}>Limite usado</span>
              <span style={{ color: '#E2E8F0', fontSize: 12.5, fontWeight: 800 }}>{Math.round(pct * 100)}%</span>
            </div>
            <LimitBar used={card.invoice} limit={card.limit} height={9} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9 }}>
              <span style={{ color: '#64748B', fontSize: 11.5, fontWeight: 700 }}>Limite {fmtBRL(card.limit)}</span>
              <span style={{ color: '#94A3B8', fontSize: 11.5, fontWeight: 700 }}>Disponível {fmtBRL(free)}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
            <DateChip icon="calendar" label="Vence" value={`dia ${card.dueDay}`} />
            <DateChip icon="receipt" label="Fecha" value={`dia ${card.closingDay}`} />
            <DateChip icon="clock" label="Melhor dia" value={`dia ${card.bestDay}`} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
            <button onClick={() => onPay(card)} style={{ ...cPrimaryBtn, minHeight: 48 }}>Pagar fatura</button>
            <button onClick={() => onSpend(card)} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, borderRadius: 13, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(15,23,42,0.55)', color: '#E2E8F0', fontFamily: 'Manrope', fontWeight: 800, fontSize: 13.5, cursor: 'pointer' }}>
              <Icon name="plus" size={16} color="#E2E8F0" /> Lançar gasto
            </button>
          </div>
        </div>

        <div style={{ padding: '14px 20px 24px' }}>
          <h3 style={{ fontFamily: 'Space Grotesk, system-ui', fontWeight: 700, fontSize: 17, color: '#F1F5F9', margin: '0 2px 8px' }}>Lançamentos da fatura</h3>
          <div style={{ display: 'grid' }}>
            {list.map((tx, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div style={{ height: 1, background: 'rgba(148,163,184,0.08)' }} />}
                <TxRow tx={tx} />
              </React.Fragment>
            ))}
            {list.length === 0 && <div style={{ color: '#64748B', fontSize: 13, fontWeight: 600, textAlign: 'center', padding: '24px 0' }}>Nenhum lançamento nessa fatura ainda.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- componentes de dia (stepper) ----------
function DayStepper({ label, value, onChange }) {
  const clamp = (v) => Math.max(1, Math.min(28, v));
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <span style={{ color: '#94A3B8', fontSize: 11, fontWeight: 800, textAlign: 'center' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '6px 8px', borderRadius: 13, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(11,17,32,0.72)' }}>
        <button onClick={() => onChange(clamp(value - 1))} style={stepBtn}>−</button>
        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: '#F1F5F9', minWidth: 22, textAlign: 'center' }}>{value}</span>
        <button onClick={() => onChange(clamp(value + 1))} style={stepBtn}>+</button>
      </div>
    </div>
  );
}
const stepBtn = { width: 30, height: 30, borderRadius: 9, border: '1px solid rgba(148,163,184,0.2)', background: 'rgba(30,41,59,0.7)', color: '#E2E8F0', fontSize: 18, fontWeight: 800, cursor: 'pointer', lineHeight: 1, display: 'grid', placeItems: 'center', flexShrink: 0 };

// ---------- SHEET: novo cartão ----------
function NovoCartaoSheet({ onClose, onDone }) {
  const [step, setStep] = React.useState('bank');
  const [bank, setBank] = React.useState(null);
  const [nick, setNick] = React.useState('');
  const [limit, setLimit] = React.useState(0);
  const [closingDay, setClosingDay] = React.useState(28);
  const [dueDay, setDueDay] = React.useState(7);
  const [bestDay, setBestDay] = React.useState(1);
  const [color, setColor] = React.useState('auto');

  const previewFace = color === 'auto' ? creditFace(bank) : CREDIT_COLORS.find(c => c.id === color).face;

  const finish = () => {
    if (onDone) onDone({
      brand: bank,
      nick: nick || creditBankName(bank),
      last4: String(Math.floor(1000 + Math.random() * 9000)),
      limit: limit || 100000,
      invoice: 0,
      closingDay, dueDay, bestDay,
      face: color === 'auto' ? undefined : CREDIT_COLORS.find(c => c.id === color).face,
    });
    onClose();
  };

  return (
    <Sheet onClose={onClose}>
      {step === 'bank' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <div style={cSheetTitle}>Novo cartão de crédito</div>
            <div style={cSheetSub}>Escolha a bandeira/banco do cartão. Você pode cadastrar quantos quiser.</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {CREDIT_BANKS.map(id => (
              <button key={id} onClick={() => { setBank(id); setNick(creditBankName(id)); setStep('form'); }} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 13px', borderRadius: 15, border: '1px solid rgba(148,163,184,0.14)', background: 'rgba(15,23,42,0.5)', cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, background: creditFace(id), display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }}><CreditBankLogo id={id} s={13} /></span>
                <span style={{ color: '#E2E8F0', fontWeight: 800, fontSize: 13.5, fontFamily: 'Manrope' }}>{creditBankName(id)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'form' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setStep('bank')} style={{ border: 0, background: 'rgba(255,255,255,0.06)', borderRadius: 999, width: 34, height: 34, display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Icon name="chevL" size={16} color="#E2E8F0" /></button>
            <div>
              <div style={cSheetTitle}>{creditBankName(bank)}</div>
              <div style={{ ...cSheetSub, marginTop: 1 }}>Configure os dados do cartão.</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
            <BankCard account={{ brand: bank, last4: '0000', nick: nick || creditBankName(bank), face: color === 'auto' ? undefined : previewFace }} w={224} />
          </div>

          <label style={cField}>
            <span style={cFieldLabel}>Apelido do cartão</span>
            <input value={nick} onChange={e => setNick(e.target.value)} placeholder="Ex: Nubank do dia a dia" style={cInput} />
          </label>

          <div style={cField}>
            <span style={cFieldLabel}>Limite total</span>
            <MoneyInput cents={limit} onChange={setLimit} />
          </div>

          <div style={cField}>
            <span style={cFieldLabel}>Datas da fatura</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <DayStepper label="Vencimento" value={dueDay} onChange={setDueDay} />
              <DayStepper label="Fechamento" value={closingDay} onChange={setClosingDay} />
              <DayStepper label="Melhor dia" value={bestDay} onChange={setBestDay} />
            </div>
          </div>

          <div style={cField}>
            <span style={cFieldLabel}>Cor do cartão</span>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              {CREDIT_COLORS.map(c => (
                <button key={c.id} onClick={() => setColor(c.id)} style={{ width: 42, height: 42, borderRadius: 11, cursor: 'pointer', background: c.id === 'auto' ? 'conic-gradient(from 180deg,#9F37E8,#3B82F6,#22C55E,#EC7000,#9F37E8)' : c.face, border: color === c.id ? '2px solid #fff' : '2px solid transparent', boxShadow: color === c.id ? '0 0 0 2px #F59E0B' : 'none' }} />
              ))}
            </div>
          </div>

          <button style={cPrimaryBtn} onClick={() => setStep('done')}>Salvar cartão</button>
        </div>
      )}

      {step === 'done' && (
        <DoneState title="Cartão adicionado!" sub={`${nick || creditBankName(bank)} já aparece na sua aba de crédito. Lance gastos e pague a fatura por aqui.`} onClose={finish} accent={CREDIT_ACCENT} />
      )}
    </Sheet>
  );
}

// ---------- SHEET: pagar fatura ----------
function PagarFaturaSheet({ card, accounts, onClose, onConfirm }) {
  // só contas que dão pra debitar (não os próprios cartões)
  const payAccounts = accounts.filter(a => a.type !== 'Cartão de crédito');
  const [from, setFrom] = React.useState(payAccounts[0] ? payAccounts[0].id : accounts[0].id);
  const [cents, setCents] = React.useState(card.invoice);
  const [done, setDone] = React.useState(false);
  const [paid, setPaid] = React.useState(0);

  const fromAcc = accounts.find(a => a.id === from);
  const min = Math.round(card.invoice * 0.15);
  const half = Math.round(card.invoice * 0.5);
  const overInvoice = cents > card.invoice;
  const insufficient = cents > (fromAcc ? fromAcc.balance : 0);
  const valid = cents > 0 && !insufficient;

  const chip = (label, value) => {
    const on = cents === value;
    return (
      <button onClick={() => setCents(value)} style={{ flex: 1, minHeight: 40, borderRadius: 11, cursor: 'pointer', border: on ? '1px solid rgba(251,191,36,0.55)' : '1px solid rgba(148,163,184,0.16)', background: on ? 'rgba(245,158,11,0.16)' : 'rgba(15,23,42,0.5)', color: on ? '#fde68a' : '#94A3B8', fontFamily: 'Manrope', fontWeight: 800, fontSize: 11.5, padding: '4px 6px', lineHeight: 1.2 }}>{label}</button>
    );
  };

  const confirm = () => {
    const p = Math.min(cents, card.invoice);
    onConfirm(card.id, from, cents);
    setPaid(p);
    setDone(true);
  };

  if (done) {
    const restante = card.invoice; // já abatido no store
    return (
      <Sheet onClose={onClose}>
        <DoneState
          title="Fatura paga!"
          sub={`${fmtBRL(paid)} debitado de ${fromAcc.nick}. ${restante > 0 ? `Fatura restante: ${fmtBRL(restante)}.` : 'Fatura quitada! 🎉'}`}
          onClose={onClose} accent={CREDIT_ACCENT}
        />
      </Sheet>
    );
  }

  const b = brandOf(card.brand);
  return (
    <Sheet onClose={onClose}>
      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <div style={cSheetTitle}>Pagar fatura</div>
          <div style={cSheetSub}>O valor é debitado da conta escolhida e some do seu saldo total.</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 13, borderRadius: 16, border: '1px solid rgba(245,158,11,0.26)', background: 'rgba(245,158,11,0.08)' }}>
          <span style={{ width: 56, height: 36, borderRadius: 9, background: card.face || b.face, display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }}><CreditBankLogo id={card.brand} s={12} /></span>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#F1F5F9', fontWeight: 800, fontSize: 14.5, fontFamily: 'Manrope' }}>{card.nick}</div>
            <div style={{ color: '#fcd34d', fontSize: 12, fontWeight: 700 }}>Fatura {fmtBRL(card.invoice)} · vence dia {card.dueDay}</div>
          </div>
        </div>

        <div style={cField}>
          <span style={cFieldLabel}>Quanto pagar</span>
          <MoneyInput cents={cents} onChange={setCents} />
          <div style={{ display: 'flex', gap: 7 }}>
            {chip('Mínimo 15%', min)}
            {chip('Metade', half)}
            {chip('Total', card.invoice)}
          </div>
          {overInvoice && <span style={{ color: '#fcd34d', fontSize: 11.5, fontWeight: 700 }}>Acima da fatura — vamos pagar só {fmtBRL(card.invoice)} e o resto fica de crédito.</span>}
          {cents > 0 && cents < card.invoice && !overInvoice && <span style={{ color: '#94A3B8', fontSize: 11.5, fontWeight: 700 }}>Pagamento parcial — restam {fmtBRL(card.invoice - cents)} na fatura.</span>}
        </div>

        <AccountChooser accounts={payAccounts} target={from} setTarget={setFrom} label="Pagar de qual conta?" />
        <span style={{ color: insufficient ? '#fca5a5' : '#64748B', fontSize: 11.5, fontWeight: 700, marginTop: -6 }}>
          Saldo em {fromAcc.nick}: {fmtBRL(fromAcc.balance)}{insufficient ? ' · saldo insuficiente' : ''}
        </span>

        <button style={{ ...cPrimaryBtn, opacity: valid ? 1 : 0.45, pointerEvents: valid ? 'auto' : 'none' }} onClick={confirm}>
          Pagar {cents > 0 ? fmtBRL(Math.min(cents, card.invoice)) : 'fatura'}
        </button>
      </div>
    </Sheet>
  );
}

// ---------- SHEET: lançar gasto no cartão ----------
const GASTO_CATS = ['Alimentação', 'Transporte', 'Compras', 'Assinaturas', 'Saúde', 'Viagem', 'Lazer', 'Outros'];
function GastoCartaoSheet({ card, onClose, onConfirm }) {
  const [t, setT] = React.useState('');
  const [cat, setCat] = React.useState('Compras');
  const [cents, setCents] = React.useState(0);
  const valid = cents > 0 && t.trim().length > 0;
  const b = brandOf(card.brand);
  return (
    <Sheet onClose={onClose}>
      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <div style={cSheetTitle}>Lançar gasto no cartão</div>
          <div style={cSheetSub}>Entra na fatura aberta de <strong style={{ color: '#cbd5e1' }}>{card.nick}</strong>. Você também pode lançar pela tela de Nova despesa.</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, border: '1px solid rgba(148,163,184,0.14)', background: 'rgba(15,23,42,0.5)' }}>
          <span style={{ width: 50, height: 32, borderRadius: 8, background: card.face || b.face, display: 'grid', placeItems: 'center', flexShrink: 0 }}><CreditBankLogo id={card.brand} s={11} /></span>
          <div style={{ color: '#94A3B8', fontSize: 12.5, fontWeight: 700 }}>Fatura atual <strong style={{ color: CREDIT_ACCENT_LT, fontFamily: 'Space Grotesk' }}>{fmtBRL(card.invoice)}</strong></div>
        </div>

        <label style={cField}>
          <span style={cFieldLabel}>Descrição</span>
          <input value={t} onChange={e => setT(e.target.value)} placeholder="Ex: Mercado, Uber, assinatura…" style={cInput} />
        </label>

        <div style={cField}>
          <span style={cFieldLabel}>Categoria</span>
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', margin: '0 -2px', padding: '0 2px 4px', scrollbarWidth: 'none' }}>
            {GASTO_CATS.map(c => (
              <button key={c} onClick={() => setCat(c)} style={{ flexShrink: 0, padding: '8px 13px', borderRadius: 999, cursor: 'pointer', fontFamily: 'Manrope', fontWeight: 700, fontSize: 12.5, whiteSpace: 'nowrap', border: cat === c ? '1px solid rgba(251,191,36,0.5)' : '1px solid rgba(148,163,184,0.16)', background: cat === c ? 'rgba(245,158,11,0.16)' : 'rgba(15,23,42,0.5)', color: cat === c ? '#fde68a' : '#94A3B8' }}>{c}</button>
            ))}
          </div>
        </div>

        <div style={cField}>
          <span style={cFieldLabel}>Valor</span>
          <MoneyInput cents={cents} onChange={setCents} />
        </div>

        <button style={{ ...cPrimaryBtn, opacity: valid ? 1 : 0.45, pointerEvents: valid ? 'auto' : 'none' }} onClick={() => { onConfirm(card.id, { t: t.trim(), cat, cents }); onClose(); }}>
          Lançar {cents > 0 ? fmtBRL(cents) : 'gasto'}
        </button>
      </div>
    </Sheet>
  );
}

Object.assign(window, { CreditoScreen, CartaoDetail, NovoCartaoSheet, PagarFaturaSheet, GastoCartaoSheet, EditCartaoSheet, LimitBar });

// ---------- SHEET: editar cartão ----------
function EditCartaoSheet({ card, onClose, onSave, onDelete }) {
  const [nick, setNick] = React.useState(card.nick);
  const [limit, setLimit] = React.useState(card.limit);
  const [closingDay, setClosingDay] = React.useState(card.closingDay);
  const [dueDay, setDueDay] = React.useState(card.dueDay);
  const [bestDay, setBestDay] = React.useState(card.bestDay);
  const [color, setColor] = React.useState('keep');
  const [confirmDel, setConfirmDel] = React.useState(false);

  const colors = [{ id: 'keep', label: 'Atual', face: card.face || creditFace(card.brand) }, ...CREDIT_COLORS];
  const previewFace = color === 'keep' ? (card.face || creditFace(card.brand)) : color === 'auto' ? creditFace(card.brand) : CREDIT_COLORS.find(c => c.id === color).face;

  const save = () => {
    const face = color === 'keep' ? card.face : color === 'auto' ? undefined : CREDIT_COLORS.find(c => c.id === color).face;
    onSave({ nick: nick || card.nick, limit: limit || card.limit, closingDay, dueDay, bestDay, face });
    onClose();
  };

  return (
    <Sheet onClose={onClose}>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={cSheetTitle}>Editar cartão</div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
          <BankCard account={{ ...card, face: previewFace, nick }} w={224} />
        </div>
        <label style={cField}>
          <span style={cFieldLabel}>Apelido do cartão</span>
          <input value={nick} onChange={e => setNick(e.target.value)} style={cInput} />
        </label>
        <div style={cField}>
          <span style={cFieldLabel}>Limite total</span>
          <MoneyInput cents={limit} onChange={setLimit} />
        </div>
        <div style={cField}>
          <span style={cFieldLabel}>Datas da fatura</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <DayStepper label="Vencimento" value={dueDay} onChange={setDueDay} />
            <DayStepper label="Fechamento" value={closingDay} onChange={setClosingDay} />
            <DayStepper label="Melhor dia" value={bestDay} onChange={setBestDay} />
          </div>
        </div>
        <div style={cField}>
          <span style={cFieldLabel}>Cor do cartão</span>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            {colors.map(c => (
              <button key={c.id} onClick={() => setColor(c.id)} style={{ width: 42, height: 42, borderRadius: 11, cursor: 'pointer', background: c.id === 'auto' ? 'conic-gradient(from 180deg,#9F37E8,#3B82F6,#22C55E,#EC7000,#9F37E8)' : c.face, border: color === c.id ? '2px solid #fff' : '2px solid transparent', boxShadow: color === c.id ? '0 0 0 2px #F59E0B' : 'none' }} />
            ))}
          </div>
        </div>
        <button style={cPrimaryBtn} onClick={save}>Salvar alterações</button>
        {!confirmDel ? (
          <button style={{ ...cGhostBtn, color: '#fca5a5', borderColor: 'rgba(248,113,113,0.3)' }} onClick={() => setConfirmDel(true)}>Excluir cartão</button>
        ) : (
          <div style={{ display: 'grid', gap: 8, padding: 12, borderRadius: 14, border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(127,29,29,0.18)' }}>
            <span style={{ color: '#fecaca', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>Excluir {card.nick} e seus lançamentos?</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button style={cGhostBtn} onClick={() => setConfirmDel(false)}>Cancelar</button>
              <button style={{ ...cPrimaryBtn, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', color: '#fff', minHeight: 48, boxShadow: 'none' }} onClick={() => { onDelete(); onClose(); }}>Excluir</button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
