// cc-cards.jsx — pilha (Google Wallet) e carrossel de cartões
// Exporta (window): CardStack, CardCarousel, WalletSection, AddCardCta

function AddCardCta({ onClick, w = 300 }) {
  return (
    <button onClick={onClick} style={{
      width: w, height: w * 0.625, borderRadius: w * 0.07,
      border: '1.5px dashed rgba(148,163,184,0.4)', background: 'rgba(15,23,42,0.4)',
      color: '#94A3B8', display: 'flex', flexDirection: 'column', gap: 8,
      alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
      fontFamily: 'Manrope, system-ui', fontWeight: 800, fontSize: 15,
    }}>
      <span style={{ width: 42, height: 42, borderRadius: 999, background: 'rgba(59,130,246,0.16)', border: '1px solid rgba(96,165,250,0.4)', display: 'grid', placeItems: 'center', fontSize: 24, color: '#60A5FA', lineHeight: 1 }}>+</span>
      Adicionar banco
    </button>
  );
}

// ---------- DECK: cartão compacto, swipe pra trocar + expandir ----------
function CardDeck({ accounts, onSelect, onAdd, w = 290 }) {
  const n = accounts.length;
  const [active, setActive] = React.useState(0);
  const [expanded, setExpanded] = React.useState(false);
  const ch = w * 0.625;
  const peek = 15;          // o quanto cada cartão de trás aparece
  const maxBehind = Math.min(n - 1, 3);
  const gap = 16;
  const drag = React.useRef({ x: 0, moved: false });

  const buzz = (ms = 12) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };

  const collapsedH = ch + peek * maxBehind;
  const expandedH = (ch + gap) * n - gap;

  const next = () => { buzz(); setActive(a => (a + 1) % n); };
  const prev = () => { buzz(); setActive(a => (a - 1 + n) % n); };
  const goTo = (i) => { if (i !== active) buzz(); setActive(i); };

  const onDown = (e) => { drag.current = { x: (e.touches ? e.touches[0].clientX : e.clientX), moved: false }; };
  const onMove = (e) => {
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    if (Math.abs(x - drag.current.x) > 8) drag.current.moved = true;
  };
  const onUp = (e) => {
    if (expanded) return;
    const x = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const dx = x - drag.current.x;
    if (dx < -42) next(); else if (dx > 42) prev();
  };

  return (
    <div>
      <div
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
        onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
        style={{
          position: 'relative', width: w, margin: '0 auto',
          height: expanded ? expandedH : collapsedH,
          transition: 'height 0.45s cubic-bezier(0.16,1,0.3,1)',
          touchAction: 'pan-y', userSelect: 'none',
        }}
      >
        {accounts.map((acc, i) => {
          const d = (i - active + n) % n;          // 0 = frente
          let y, scale, op, z, show = true;
          if (expanded) {
            y = d * (ch + gap); scale = 1; op = 1; z = n - d;
          } else {
            const dd = Math.min(d, maxBehind);
            y = (maxBehind - dd) * peek;            // frente embaixo, traseiros acima
            scale = 1 - dd * 0.05;
            op = d > maxBehind ? 0 : 1 - dd * 0.14;
            z = n - d;
            show = d <= maxBehind;
          }
          return (
            <div key={acc.id} style={{
              position: 'absolute', top: 0, left: 0, width: '100%',
              transform: `translateY(${y}px) scale(${scale})`, transformOrigin: 'top center',
              opacity: op, zIndex: z, pointerEvents: show ? 'auto' : 'none',
              transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease',
            }}>
              <BankCard account={acc} w={w} onClick={() => {
                if (drag.current.moved) return;        // ignora se foi swipe
                if (expanded || d === 0) onSelect(acc); // frente abre; expandido qualquer um
                else goTo(i);                            // traseiro vem pra frente
              }} />
            </div>
          );
        })}
      </div>

      {/* controles */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 16 }}>
        {accounts.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} style={{
            width: i === active ? 22 : 7, height: 7, borderRadius: 999, border: 0, padding: 0, cursor: 'pointer',
            background: i === active ? 'linear-gradient(90deg,#60A5FA,#2563EB)' : 'rgba(148,163,184,0.3)',
            transition: 'all 0.3s var(--ease)',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'center' }}>
        <button onClick={() => { buzz(8); setExpanded(e => !e); }} style={pillBtn}>
          {expanded ? 'Recolher' : 'Expandir cartões'}
        </button>
        <button onClick={onAdd} style={{ ...pillBtn, background: 'rgba(59,130,246,0.16)', borderColor: 'rgba(96,165,250,0.35)', color: '#bfdbfe' }}>
          + Novo banco
        </button>
      </div>
      <p style={{ textAlign: 'center', color: '#64748B', fontSize: 12.5, marginTop: 10, fontWeight: 600 }}>
        Deslize pra trocar · toque pra abrir a conta
      </p>
    </div>
  );
}

const pillBtn = {
  minHeight: 38, padding: '0 16px', borderRadius: 999,
  border: '1px solid rgba(148,163,184,0.22)', background: 'rgba(15,23,42,0.55)',
  color: '#E2E8F0', fontFamily: 'Manrope, system-ui', fontWeight: 800, fontSize: 13.5,
  cursor: 'pointer',
};

// ---------- CARROSSEL ----------
function CardCarousel({ accounts, onSelect, onAdd, w = 290 }) {
  const [active, setActive] = React.useState(0);
  const ref = React.useRef(null);

  const onScroll = () => {
    const el = ref.current; if (!el) return;
    const i = Math.round(el.scrollLeft / (w + 16));
    const clamped = Math.max(0, Math.min(accounts.length - 1, i));
    setActive(prev => {
      if (prev !== clamped) { try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {} }
      return clamped;
    });
  };

  return (
    <div>
      <div
        ref={ref}
        onScroll={onScroll}
        style={{
          display: 'flex', gap: 16, overflowX: 'auto', scrollSnapType: 'x mandatory',
          padding: '4px 28px 8px', margin: '0 -20px', scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {accounts.map((acc) => (
          <div key={acc.id} style={{ scrollSnapAlign: 'center', flexShrink: 0 }}>
            <BankCard account={acc} w={w} onClick={() => onSelect(acc)} />
          </div>
        ))}
        <div style={{ scrollSnapAlign: 'center', flexShrink: 0 }}>
          <AddCardCta onClick={onAdd} w={w} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 7, justifyContent: 'center', marginTop: 14 }}>
        {accounts.map((_, i) => (
          <span key={i} style={{
            width: i === active ? 22 : 7, height: 7, borderRadius: 999,
            background: i === active ? 'linear-gradient(90deg,#60A5FA,#2563EB)' : 'rgba(148,163,184,0.3)',
            transition: 'all 0.3s var(--ease)',
          }} />
        ))}
      </div>
      <p style={{ textAlign: 'center', color: '#64748B', fontSize: 12.5, marginTop: 12, fontWeight: 600 }}>
        Deslize para o lado · toque para abrir a conta
      </p>
    </div>
  );
}

// ---------- Seção que escolhe pilha ou carrossel ----------
function WalletSection({ mode, accounts, onSelect, onAdd, w = 290 }) {
  return mode === 'carousel'
    ? <CardCarousel accounts={accounts} onSelect={onSelect} onAdd={onAdd} w={w} />
    : <CardDeck accounts={accounts} onSelect={onSelect} onAdd={onAdd} w={w} />;
}

Object.assign(window, { CardDeck, CardCarousel, WalletSection, AddCardCta });
