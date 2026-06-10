// cc-extra.jsx — telas Grupos, Categorias, Perfil
// Exporta (window): GruposScreen, CategoriasScreen, PerfilScreen

function Avatar({ name, color = 'linear-gradient(135deg,#60A5FA,#a78bfa)', size = 34 }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span style={{ width: size, height: size, borderRadius: 999, background: color, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 900, fontSize: size * 0.34, fontFamily: 'Manrope', flexShrink: 0, border: '1px solid rgba(255,255,255,0.18)' }}>{initials}</span>
  );
}

const GROUPS = [
  { id: 'g1', name: 'Viagem Chapada', emoji: '🏔️', members: ['Você', 'Ana', 'Bruno', 'Carla'], total: 248050, you: -8420, tone: 'owe' },
  { id: 'g2', name: 'República', emoji: '🏠', members: ['Você', 'Diego', 'Eva'], total: 412300, you: 15600, tone: 'get' },
  { id: 'g3', name: 'Churrasco', emoji: '🍖', members: ['Você', 'Felipe', 'Gabi', 'Hugo', 'Ivan'], total: 32000, you: 0, tone: 'even' },
];

function GruposScreen() {
  return (
    <ScreenScroll>
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'grid', gap: 4, marginTop: 2 }}>
          <span style={{ color: '#a78bfa', fontSize: 11.5, fontWeight: 800, letterSpacing: '0.14em' }}>GRUPOS</span>
          <h2 style={{ fontFamily: 'Space Grotesk, system-ui', fontWeight: 700, fontSize: 28, color: '#F1F5F9', letterSpacing: '-0.02em' }}>Despesas divididas</h2>
          <p style={{ color: '#94A3B8', fontSize: 13.5, fontWeight: 600 }}>3 grupos ativos</p>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {GROUPS.map(g => (
            <div key={g.id} style={{ borderRadius: 18, border: '1px solid rgba(148,163,184,0.12)', background: 'radial-gradient(circle at 16% 0%, rgba(167,139,250,0.08), transparent 40%), rgba(30,41,59,0.55)', padding: 16, display: 'grid', gap: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 46, height: 46, borderRadius: 13, background: 'rgba(167,139,250,0.14)', border: '1px solid rgba(167,139,250,0.24)', display: 'grid', placeItems: 'center', fontSize: 24, flexShrink: 0 }}>{g.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#F1F5F9', fontWeight: 800, fontSize: 15.5, fontFamily: 'Space Grotesk' }}>{g.name}</div>
                  <div style={{ color: '#64748B', fontSize: 12, fontWeight: 600 }}>{g.members.length} pessoas · total {fmtBRL(g.total)}</div>
                </div>
                <Icon name="chevR" size={16} color="#475569" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex' }}>
                  {g.members.slice(0, 4).map((m, i) => (
                    <span key={i} style={{ marginLeft: i ? -10 : 0 }}><Avatar name={m} size={30} color={['linear-gradient(135deg,#60A5FA,#2563EB)', 'linear-gradient(135deg,#22C55E,#15803D)', 'linear-gradient(135deg,#a78bfa,#7c3aed)', 'linear-gradient(135deg,#F97316,#c2410c)'][i % 4]} /></span>
                  ))}
                </div>
                <span style={{
                  fontWeight: 800, fontSize: 13, fontFamily: 'Space Grotesk', padding: '6px 12px', borderRadius: 999,
                  color: g.tone === 'get' ? '#4ADE80' : g.tone === 'owe' ? '#F87171' : '#94A3B8',
                  background: g.tone === 'get' ? 'rgba(34,197,94,0.12)' : g.tone === 'owe' ? 'rgba(239,68,68,0.12)' : 'rgba(148,163,184,0.1)',
                  border: `1px solid ${g.tone === 'get' ? 'rgba(34,197,94,0.28)' : g.tone === 'owe' ? 'rgba(239,68,68,0.28)' : 'rgba(148,163,184,0.18)'}`,
                }}>
                  {g.tone === 'get' ? `Te devem ${fmtBRL(g.you)}` : g.tone === 'owe' ? `Você deve ${fmtBRL(g.you)}` : 'Tudo quitado'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%', minHeight: 50, borderRadius: 15, border: '1px solid rgba(167,139,250,0.32)', background: 'rgba(167,139,250,0.12)', color: '#ddd6fe', fontFamily: 'Manrope', fontWeight: 800, fontSize: 14.5, cursor: 'pointer' }}>
          <Icon name="plus" size={18} color="#c4b5fd" /> Criar novo grupo
        </button>
      </div>
    </ScreenScroll>
  );
}

const CATS = {
  Despesas: [
    { e: '🍔', n: 'Alimentação', c: '#F97316', v: 121925, q: 18 },
    { e: '🏠', n: 'Moradia', c: '#60A5FA', v: 219830, q: 6 },
    { e: '🚗', n: 'Transporte', c: '#22C55E', v: 34280, q: 12 },
    { e: '🎬', n: 'Assinaturas', c: '#a78bfa', v: 9970, q: 4 },
    { e: '💊', n: 'Saúde', c: '#F472B6', v: 4720, q: 2 },
    { e: '🛍️', n: 'Compras', c: '#eab308', v: 12900, q: 3 },
  ],
  Receitas: [
    { e: '💰', n: 'Salário', c: '#22C55E', v: 412700, q: 1 },
    { e: '📈', n: 'Investimentos', c: '#60A5FA', v: 505481, q: 4 },
    { e: '🤝', n: 'Freelance', c: '#a78bfa', v: 0, q: 0 },
    { e: '🔄', n: 'Transferências', c: '#2dd4bf', v: 15000, q: 2 },
  ],
};

function CategoriasScreen() {
  const [tab, setTab] = React.useState('Despesas');
  const items = CATS[tab];
  return (
    <ScreenScroll>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gap: 4, marginTop: 2 }}>
          <span style={{ color: '#60A5FA', fontSize: 11.5, fontWeight: 800, letterSpacing: '0.14em' }}>CATEGORIAS</span>
          <h2 style={{ fontFamily: 'Space Grotesk, system-ui', fontWeight: 700, fontSize: 28, color: '#F1F5F9', letterSpacing: '-0.02em' }}>Suas categorias</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4, borderRadius: 13, background: 'rgba(11,17,32,0.6)', border: '1px solid rgba(148,163,184,0.13)' }}>
          {['Despesas', 'Receitas'].map(tp => (
            <button key={tp} onClick={() => setTab(tp)} style={{
              minHeight: 40, border: 0, borderRadius: 9, cursor: 'pointer', fontFamily: 'Manrope', fontWeight: 800, fontSize: 14,
              background: tab === tp ? 'linear-gradient(135deg,#60A5FA,#2563EB)' : 'transparent',
              color: tab === tp ? '#fff' : '#94A3B8',
            }}>{tp}</button>
          ))}
        </div>

        <div style={{ borderRadius: 18, border: '1px solid rgba(148,163,184,0.1)', overflow: 'hidden', background: 'rgba(15,23,42,0.4)' }}>
          {items.map((c, i) => (
            <div key={c.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderTop: i ? '1px solid rgba(148,163,184,0.08)' : 0 }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, background: `${c.c}22`, border: `1px solid ${c.c}44`, display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0 }}>{c.e}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: '#F1F5F9', fontWeight: 800, fontSize: 14.5 }}>{c.n}</div>
                <div style={{ color: '#64748B', fontSize: 12, fontWeight: 600 }}>{c.q} lançamentos</div>
              </div>
              <strong style={{ color: tab === 'Despesas' ? '#F87171' : '#4ADE80', fontWeight: 800, fontSize: 14.5, fontFamily: 'Space Grotesk', whiteSpace: 'nowrap' }}>{fmtBRL(c.v)}</strong>
            </div>
          ))}
        </div>

        <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%', minHeight: 50, borderRadius: 15, border: '1px solid rgba(96,165,250,0.3)', background: 'rgba(59,130,246,0.13)', color: '#bfdbfe', fontFamily: 'Manrope', fontWeight: 800, fontSize: 14.5, cursor: 'pointer' }}>
          <Icon name="plus" size={18} color="#60A5FA" /> Nova categoria
        </button>
      </div>
    </ScreenScroll>
  );
}

function PerfilScreen() {
  const rows = [
    { ic: 'card', label: 'Minha conta', sub: 'Dados e e-mail' },
    { ic: 'wallet', label: 'Bancos e cartões', sub: '4 contas conectadas' },
    { ic: 'tag', label: 'Categorias', sub: 'Personalizar' },
    { ic: 'help', label: 'Notificações', sub: 'Lembretes e alertas' },
    { ic: 'upload', label: 'Exportar dados', sub: 'OFX, CSV, PDF' },
  ];
  return (
    <ScreenScroll>
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
          <Avatar name="Você" size={64} color="linear-gradient(135deg,#3B82F6,#a78bfa)" />
          <div style={{ display: 'grid', gap: 4 }}>
            <strong style={{ fontFamily: 'Space Grotesk, system-ui', fontWeight: 700, fontSize: 22, color: '#F1F5F9' }}>Você</strong>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content', padding: '5px 11px', borderRadius: 999, border: '1px solid rgba(34,197,94,0.32)', background: 'rgba(34,197,94,0.12)', color: '#bbf7d0', fontSize: 12, fontWeight: 800 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: '#22C55E' }} /> Plano Vitalício
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ borderRadius: 16, border: '1px solid rgba(148,163,184,0.12)', background: 'rgba(30,41,59,0.5)', padding: 14, display: 'grid', gap: 4 }}>
            <span style={{ color: '#94A3B8', fontSize: 12, fontWeight: 700 }}>Patrimônio</span>
            <strong style={{ color: '#F1F5F9', fontSize: 21, fontWeight: 700, fontFamily: 'Space Grotesk', whiteSpace: 'nowrap' }}>{fmtBRL(CC.totalBalance())}</strong>
          </div>
          <div style={{ borderRadius: 16, border: '1px solid rgba(148,163,184,0.12)', background: 'rgba(30,41,59,0.5)', padding: 14, display: 'grid', gap: 4 }}>
            <span style={{ color: '#94A3B8', fontSize: 12, fontWeight: 700 }}>Contas</span>
            <strong style={{ color: '#F1F5F9', fontSize: 21, fontWeight: 700, fontFamily: 'Space Grotesk' }}>{CC.accounts.length} bancos</strong>
          </div>
        </div>

        <div style={{ borderRadius: 18, border: '1px solid rgba(148,163,184,0.1)', overflow: 'hidden', background: 'rgba(15,23,42,0.4)' }}>
          {rows.map((r, i) => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', borderTop: i ? '1px solid rgba(148,163,184,0.08)' : 0 }}>
              <span style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(59,130,246,0.12)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={r.ic} size={17} color="#60A5FA" /></span>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#F1F5F9', fontWeight: 800, fontSize: 14.5 }}>{r.label}</div>
                <div style={{ color: '#64748B', fontSize: 12, fontWeight: 600 }}>{r.sub}</div>
              </div>
              <Icon name="chevR" size={16} color="#475569" />
            </div>
          ))}
        </div>

        <button style={{ width: '100%', minHeight: 48, borderRadius: 14, border: '1px solid rgba(248,113,113,0.24)', background: 'rgba(127,29,29,0.18)', color: '#fecaca', fontFamily: 'Manrope', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Sair da conta</button>
        <div style={{ textAlign: 'center', color: '#475569', fontSize: 11.5, fontWeight: 700 }}>Conciliaaí · v2.4.0</div>
      </div>
    </ScreenScroll>
  );
}

Object.assign(window, { GruposScreen, CategoriasScreen, PerfilScreen, Avatar });
