// cc-ui.jsx — peças compartilhadas: ícones, TopBar, BottomNav, Hero, TxRow
// Exporta (window): Icon, TopBar, BottomNav, Hero, TxRow, SectionTitle, ScreenScroll

function Icon({ name, size = 20, color = 'currentColor', sw = 2 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /></>,
    tag: <><path d="M3 7v5l9 9 7-7-9-9H4Z" /><circle cx="7.5" cy="7.5" r="1.4" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5" /><path d="M16 6a3 3 0 0 1 0 5.8" /><path d="M21 20c0-2.4-1.3-4-3.5-4.6" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    wallet: <><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18v3" /><path d="M3 7v10.5A2.5 2.5 0 0 0 5.5 20H20a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H5.5" /><circle cx="16.5" cy="13.5" r="1.2" fill={color} stroke="none" /></>,
    up: <><path d="M12 19V5M6 11l6-6 6 6" /></>,
    down: <><path d="M12 5v14M6 13l6 6 6-6" /></>,
    eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="2.5" /></>,
    chevR: <path d="M9 6l6 6-6 6" />,
    chevL: <path d="M15 6l-6 6 6 6" />,
    chevDown: <path d="M6 9l6 6 6-6" />,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 0 1 4.5 1.5c0 1.6-2 2-2 3.5" /><path d="M12 17.5h.01" /></>,
    user: <><circle cx="12" cy="8" r="3.6" /><path d="M5 20c0-3.6 3-5.5 7-5.5s7 1.9 7 5.5" /></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></>,
    check: <path d="M5 12.5l4.5 4.5L19 7" />,
    bank: <><path d="M3 9.5 12 4l9 5.5" /><path d="M5 10v8M10 10v8M14 10v8M19 10v8" /><path d="M3 20h18" /></>,
    card: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M3 10h18" /></>,
    sparkle: <><path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6Z" /></>,
  };
  return <svg {...p} style={{ flexShrink: 0 }}>{paths[name]}</svg>;
}

function TopBar({ onHelp }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 18px 12px', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#60A5FA,#2563EB)',
          display: 'grid', placeItems: 'center', color: '#fff',
          boxShadow: '0 0 0 1px rgba(96,165,250,0.22), 0 10px 24px rgba(37,99,235,0.4)',
        }}>
          <Icon name="sparkle" size={20} color="#fff" />
        </div>
        <div style={{ display: 'grid', gap: 1 }}>
          <strong style={{ fontFamily: 'Space Grotesk, system-ui', fontWeight: 800, fontSize: 17, color: '#F1F5F9', letterSpacing: '-0.02em', lineHeight: 1 }}>Conciliaaí</strong>
          <small style={{ color: '#64748B', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.16em' }}>FINANÇAS</small>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 999,
          border: '1px solid rgba(34,197,94,0.32)', background: 'rgba(34,197,94,0.12)', color: '#bbf7d0',
          fontSize: 12, fontWeight: 800,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: '#22C55E' }} />Vitalício
        </span>
      </div>
    </div>
  );
}

const NAV = [
  { id: 'home', label: 'Início', icon: 'home' },
  { id: 'categorias', label: 'Categorias', icon: 'tag' },
  { id: 'grupos', label: 'Grupos', icon: 'users' },
  { id: 'perfil', label: 'Perfil', icon: 'user' },
];

function BottomNav({ tab, onTab, onFab, hasCarteiras }) {
  const items = hasCarteiras
    ? [{ id: 'home', label: 'Início', icon: 'home' }, { id: 'carteiras', label: 'Carteiras', icon: 'wallet' }, { id: 'grupos', label: 'Grupos', icon: 'users' }, { id: 'perfil', label: 'Perfil', icon: 'user' }]
    : NAV;
  const left = items.slice(0, 2), right = items.slice(2);
  const btn = (it) => {
    const on = tab === it.id;
    return (
      <button key={it.id} onClick={() => onTab(it.id)} style={{
        border: 0, background: 'transparent', cursor: 'pointer',
        display: 'grid', placeItems: 'center', gap: 4,
        color: on ? '#60A5FA' : 'rgba(148,163,184,0.85)',
        fontFamily: 'Manrope, system-ui', fontWeight: 800, fontSize: 10.5, minWidth: 0,
      }}>
        <Icon name={it.icon} size={21} />
        {it.label}
      </button>
    );
  };
  return (
    <div style={{ position: 'relative', flexShrink: 0, height: 86, paddingBottom: 18 }}>
      <div style={{
        position: 'absolute', inset: 0, top: 6,
        background: 'rgba(13,19,33,0.96)', borderTop: '1px solid rgba(148,163,184,0.13)',
        backdropFilter: 'blur(16px)', boxShadow: '0 -14px 36px rgba(2,6,23,0.5)',
      }} />
      <div style={{
        position: 'relative', height: '100%',
        display: 'grid', gridTemplateColumns: '1fr 1fr 76px 1fr 1fr', alignItems: 'center', padding: '0 6px',
      }}>
        {left.map(btn)}
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <button onClick={onFab} style={{
            width: 58, height: 58, borderRadius: '50%', border: 0, cursor: 'pointer', color: '#fff',
            background: 'linear-gradient(135deg,#60A5FA,#2563EB)', transform: 'translateY(-22px)',
            boxShadow: '0 18px 40px rgba(37,99,235,0.55), 0 0 0 7px rgba(96,165,250,0.08)',
            display: 'grid', placeItems: 'center',
          }}>
            <Icon name="plus" size={26} color="#fff" sw={2.6} />
          </button>
        </div>
        {right.map(btn)}
      </div>
    </div>
  );
}

// Hero "Saldo em contas"
function Hero({ accountsCount }) {
  const total = CC.totalBalance();
  return (
    <div style={{
      borderRadius: 22, padding: 20, position: 'relative', overflow: 'hidden',
      border: '1px solid rgba(96,165,250,0.28)',
      background: 'radial-gradient(circle at 18% 0%, rgba(59,130,246,0.45), transparent 40%), linear-gradient(135deg, #2f6df0 0%, #2152c9 55%, #1b3fa0 100%)',
      boxShadow: '0 18px 48px rgba(20,40,120,0.45)',
    }}>
      <div style={{ position: 'absolute', right: -40, top: -30, width: 180, height: 180, borderRadius: 999, background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
        <span style={{ color: '#dbeafe', fontSize: 13.5, fontWeight: 700 }}>Saldo em contas</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.16)', color: '#fff', fontSize: 12.5, fontWeight: 800, whiteSpace: 'nowrap' }}>
          <Icon name="chevL" size={13} color="#fff" /> Junho 2026 <Icon name="chevR" size={13} color="#fff" />
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, position: 'relative' }}>
        <span style={{ fontFamily: 'Space Grotesk, system-ui', fontWeight: 700, fontSize: 40, color: '#fff', letterSpacing: '-0.02em' }}>{fmtBRL(total)}</span>
        <Icon name="eye" size={18} color="rgba(255,255,255,0.7)" />
      </div>
      <div style={{ color: '#bfdbfe', fontSize: 12, fontWeight: 600, marginTop: 2, position: 'relative' }}>
        somando {accountsCount} contas
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.12)' }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(34,197,94,0.3)', display: 'grid', placeItems: 'center' }}><Icon name="up" size={16} color="#bbf7d0" /></span>
          <div style={{ display: 'grid', gap: 1 }}>
            <small style={{ color: '#dbeafe', fontSize: 11, fontWeight: 600 }}>Receitas</small>
            <strong style={{ color: '#fff', fontSize: 14.5, fontWeight: 800, whiteSpace: 'nowrap' }}>{fmtBRL(CC.monthIncome)}</strong>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.12)' }}>
          <span style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(239,68,68,0.3)', display: 'grid', placeItems: 'center' }}><Icon name="down" size={16} color="#fecaca" /></span>
          <div style={{ display: 'grid', gap: 1 }}>
            <small style={{ color: '#dbeafe', fontSize: 11, fontWeight: 600 }}>Despesas</small>
            <strong style={{ color: '#fff', fontSize: 14.5, fontWeight: 800, whiteSpace: 'nowrap' }}>{fmtBRL(CC.monthExpense)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 2px' }}>
      <h3 style={{ fontFamily: 'Space Grotesk, system-ui', fontWeight: 700, fontSize: 18, color: '#F1F5F9', letterSpacing: '-0.01em' }}>{children}</h3>
      {action && <button onClick={onAction} style={{ border: 0, background: 'transparent', color: '#60A5FA', fontWeight: 800, fontSize: 13, fontFamily: 'Manrope, system-ui', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 3 }}>{action}<Icon name="chevR" size={14} color="#60A5FA" /></button>}
    </div>
  );
}

function TxRow({ tx }) {
  const inc = tx.cents > 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px' }}>
      <span style={{
        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
        background: inc ? 'rgba(34,197,94,0.14)' : 'rgba(239,68,68,0.13)',
        display: 'grid', placeItems: 'center',
      }}>
        <Icon name={inc ? 'up' : 'down'} size={17} color={inc ? '#4ADE80' : '#F87171'} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 14.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.t}</div>
        <div style={{ color: '#64748B', fontSize: 12, fontWeight: 600 }}>{tx.cat} · {tx.d}</div>
      </div>
      <strong style={{ color: inc ? '#4ADE80' : '#F87171', fontWeight: 800, fontSize: 14.5, fontFamily: 'Space Grotesk, system-ui' }}>
        {fmtBRL(tx.cents, { sign: true })}
      </strong>
    </div>
  );
}

function ScreenScroll({ children, pb = 24 }) {
  return <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: `4px 20px ${pb}px`, WebkitOverflowScrolling: 'touch' }}>{children}</div>;
}

Object.assign(window, { Icon, TopBar, BottomNav, Hero, TxRow, SectionTitle, ScreenScroll });
