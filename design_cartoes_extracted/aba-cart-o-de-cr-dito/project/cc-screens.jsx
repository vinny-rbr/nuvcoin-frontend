// cc-screens.jsx — telas: Home, CarteirasTab, AccountDetail
// Exporta (window): HomeScreen, CarteirasScreen, AccountDetail, MiniStat

function MiniStat({ label, value, tone, icon, sub, onClick }) {
  const col = tone === 'in' ? '#4ADE80' : tone === 'out' ? '#F87171' : tone === 'credit' ? '#FBBF24' : '#60A5FA';
  const badgeBg = tone === 'in' ? 'rgba(34,197,94,0.14)' : tone === 'out' ? 'rgba(239,68,68,0.13)' : tone === 'credit' ? 'rgba(245,158,11,0.16)' : 'rgba(59,130,246,0.14)';
  return (
    <div onClick={onClick} style={{
      borderRadius: 18, padding: 16, border: '1px solid rgba(148,163,184,0.12)',
      background: 'radial-gradient(circle at 16% 0%, rgba(96,165,250,0.08), transparent 40%), rgba(30,41,59,0.55)',
      display: 'grid', gap: 10, cursor: onClick ? 'pointer' : 'default',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#94A3B8', fontSize: 13, fontWeight: 700 }}>{label}</span>
        <span style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: badgeBg }}>
          <Icon name={icon} size={16} color={col} />
        </span>
      </div>
      <strong style={{ fontFamily: 'Space Grotesk, system-ui', fontWeight: 700, fontSize: 24, color: col, letterSpacing: '-0.02em' }}>{value}</strong>
      <span style={{ color: '#64748B', fontSize: 11.5, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>{sub}{onClick && <Icon name="chevR" size={12} color="#64748B" />}</span>
    </div>
  );
}

function HomeScreen({ placement, interaction, accounts, onSelect, onAdd, onCredit, cardW = 288 }) {
  const showWallet = placement === 'inicio' || placement === 'ambos';
  return (
    <ScreenScroll>
      <div style={{ display: 'grid', gap: 18 }}>
        <Hero accountsCount={accounts.length} />

        {showWallet && (
          <div style={{ display: 'grid', gap: 14 }}>
            <SectionTitle action={placement === 'ambos' ? 'Ver carteiras' : 'Gerenciar'} onAction={onAdd}>Meus cartões</SectionTitle>
            <WalletSection mode={interaction} accounts={accounts} onSelect={onSelect} onAdd={onAdd} w={cardW} />
          </div>
        )}

        <div style={{ display: 'grid', gap: 12 }}>
          <SectionTitle>Análise do mês</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <MiniStat label="Receitas" value={fmtBRL(CC.monthIncome)} tone="in" icon="up" sub="vs. maio ↓ 8,6%" />
            <MiniStat label="Despesas" value={fmtBRL(CC.monthExpense)} tone="out" icon="down" sub="vs. maio ↑ 12,1%" />
            <MiniStat label="Crédito" value={fmtBRL(CC.creditOpenTotal())} tone="credit" icon="card" sub="abrir cartões" onClick={onCredit} />
            <MiniStat label="Saldo livre" value={fmtBRL(CC.totalBalance())} tone="neutral" icon="bank" sub="4 contas ativas" />
          </div>
        </div>
      </div>
    </ScreenScroll>
  );
}

function CarteirasScreen({ interaction, accounts, onSelect, onAdd, onImport, cardW = 290 }) {
  const total = CC.totalBalance();
  return (
    <ScreenScroll>
      <div style={{ display: 'grid', gap: 18 }}>
        <div style={{ display: 'grid', gap: 4, marginTop: 2 }}>
          <span style={{ color: '#60A5FA', fontSize: 11.5, fontWeight: 800, letterSpacing: '0.14em' }}>CARTEIRAS</span>
          <h2 style={{ fontFamily: 'Space Grotesk, system-ui', fontWeight: 700, fontSize: 28, color: '#F1F5F9', letterSpacing: '-0.02em' }}>Suas contas</h2>
          <p style={{ color: '#94A3B8', fontSize: 13.5, fontWeight: 600 }}>{accounts.length} bancos · saldo total {fmtBRL(total)}</p>
        </div>

        <WalletSection mode={interaction} accounts={accounts} onSelect={onSelect} onAdd={onAdd} w={cardW} />

        <div style={{ display: 'grid', gap: 8 }}>
          <SectionTitle>Lista de contas</SectionTitle>
          <div style={{ borderRadius: 18, border: '1px solid rgba(148,163,184,0.1)', overflow: 'hidden', background: 'rgba(15,23,42,0.4)' }}>
            {accounts.map((acc, i) => {
              const b = brandOf(acc.brand);
              return (
                <button key={acc.id} onClick={() => onSelect(acc)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
                  border: 0, borderTop: i ? '1px solid rgba(148,163,184,0.08)' : 0, background: 'transparent', cursor: 'pointer', textAlign: 'left',
                }}>
                  <span style={{ width: 42, height: 42, borderRadius: 12, background: b.face, display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                    <b.Logo s={15} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#F1F5F9', fontWeight: 800, fontSize: 14.5 }}>{acc.nick}</div>
                    <div style={{ color: '#64748B', fontSize: 12, fontWeight: 600 }}>{acc.type} · ••{acc.last4}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#F1F5F9', fontWeight: 800, fontSize: 14.5, fontFamily: 'Space Grotesk, system-ui' }}>{fmtBRL(acc.balance)}</div>
                    <Icon name="chevR" size={15} color="#475569" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={onImport} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%',
          minHeight: 50, borderRadius: 15, border: '1px solid rgba(167,139,250,0.32)',
          background: 'rgba(167,139,250,0.12)', color: '#ddd6fe', fontFamily: 'Manrope, system-ui', fontWeight: 800, fontSize: 14.5, cursor: 'pointer',
        }}>
          <Icon name="upload" size={18} color="#c4b5fd" /> Importar extrato (OFX)
        </button>
      </div>
    </ScreenScroll>
  );
}

function AccountDetail({ account, onBack, onImport, onEdit, onTransfer }) {
  const b = brandOf(account.brand);
  const { inc, exp } = CC.accountTotals(account.id);
  const list = CC.tx[account.id] || [];
  const [filter, setFilter] = React.useState('Tudo');
  const [reconciled, setReconciled] = React.useState(false);

  const cats = ['Tudo', ...Array.from(new Set(list.map(t => t.cat)))];
  const shown = filter === 'Tudo' ? list : list.filter(t => t.cat === filter);

  const weeks = [{ in: 0, out: 0 }, { in: 0, out: 0 }, { in: 0, out: 0 }, { in: 0, out: 0 }];
  list.forEach((tx, i) => { const w = i % 4; if (tx.cents > 0) weeks[w].in += tx.cents; else weeks[w].out += Math.abs(tx.cents); });
  const maxV = Math.max(1, ...weeks.map(w => Math.max(w.in, w.out)));

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 30, background: '#0A0F1E', display: 'flex', flexDirection: 'column', animation: 'ccSlideIn 0.34s cubic-bezier(0.16,1,0.3,1)' }}>
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ position: 'relative', padding: '52px 20px 22px', background: `radial-gradient(circle at 20% -10%, ${account.glow || b.glow}, transparent 60%)` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 0, background: 'rgba(255,255,255,0.08)', color: '#E2E8F0', padding: '8px 13px 8px 9px', borderRadius: 999, fontWeight: 800, fontSize: 13.5, cursor: 'pointer', fontFamily: 'Manrope, system-ui' }}>
              <Icon name="chevL" size={16} color="#E2E8F0" /> Contas
            </button>
            <button onClick={() => onEdit(account)} style={{ border: 0, background: 'rgba(255,255,255,0.08)', color: '#E2E8F0', padding: '8px 14px', borderRadius: 999, fontWeight: 800, fontSize: 13.5, cursor: 'pointer', fontFamily: 'Manrope, system-ui' }}>
              Editar
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <BankCard account={account} w={254} />
          </div>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <div style={{ color: '#94A3B8', fontSize: 13, fontWeight: 700 }}>{account.nick} · {account.type}</div>
            <div style={{ fontFamily: 'Space Grotesk, system-ui', fontWeight: 700, fontSize: 34, color: '#fff', letterSpacing: '-0.02em', marginTop: 4 }}>{fmtBRL(account.balance)}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 14, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <Icon name="up" size={17} color="#4ADE80" />
              <div style={{ display: 'grid', gap: 1 }}>
                <small style={{ color: '#86efac', fontSize: 11, fontWeight: 700 }}>Receitas</small>
                <strong style={{ color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: 'Space Grotesk, system-ui', whiteSpace: 'nowrap' }}>{fmtBRL(inc)}</strong>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Icon name="down" size={17} color="#F87171" />
              <div style={{ display: 'grid', gap: 1 }}>
                <small style={{ color: '#fca5a5', fontSize: 11, fontWeight: 700 }}>Despesas</small>
                <strong style={{ color: '#fff', fontSize: 15, fontWeight: 800, fontFamily: 'Space Grotesk, system-ui', whiteSpace: 'nowrap' }}>{fmtBRL(exp)}</strong>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
            <button onClick={() => onTransfer(account)} style={detailAction}><Icon name="wallet" size={16} color="#7dd3fc" /> Transferir</button>
            <button onClick={() => onImport(account)} style={detailAction}><Icon name="upload" size={16} color="#c4b5fd" /> Importar OFX</button>
          </div>
        </div>

        <div style={{ padding: '6px 20px 0' }}>
          <div style={{ borderRadius: 18, border: '1px solid rgba(148,163,184,0.1)', background: 'rgba(30,41,59,0.5)', padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ color: '#F1F5F9', fontWeight: 800, fontSize: 14, fontFamily: 'Manrope' }}>Movimento de junho</span>
              <div style={{ display: 'flex', gap: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#94A3B8', fontSize: 11, fontWeight: 700 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: '#22C55E' }} />Entr.</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#94A3B8', fontSize: 11, fontWeight: 700 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: '#EF4444' }} />Saíd.</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: 96, gap: 14 }}>
              {weeks.map((w, i) => (
                <div key={i} style={{ display: 'grid', justifyItems: 'center', gap: 6, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 76 }}>
                    <div style={{ width: 13, height: Math.max(4, (w.in / maxV) * 76), borderRadius: '4px 4px 0 0', background: 'linear-gradient(180deg,#4ADE80,#16A34A)' }} />
                    <div style={{ width: 13, height: Math.max(4, (w.out / maxV) * 76), borderRadius: '4px 4px 0 0', background: 'linear-gradient(180deg,#F87171,#DC2626)' }} />
                  </div>
                  <span style={{ color: '#64748B', fontSize: 10.5, fontWeight: 700 }}>S{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 2px 10px' }}>
            <h3 style={{ fontFamily: 'Space Grotesk, system-ui', fontWeight: 700, fontSize: 17, color: '#F1F5F9' }}>Movimentações</h3>
            <button onClick={() => setReconciled(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, border: reconciled ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(96,165,250,0.3)', background: reconciled ? 'rgba(34,197,94,0.14)' : 'rgba(59,130,246,0.14)', color: reconciled ? '#4ADE80' : '#bfdbfe', fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'Manrope', padding: '6px 11px', borderRadius: 999 }}>
              <Icon name="check" size={13} color={reconciled ? '#4ADE80' : '#bfdbfe'} /> {reconciled ? 'Conciliado' : 'Conciliar'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', margin: '0 -2px 6px', padding: '0 2px 6px', scrollbarWidth: 'none' }}>
            {cats.map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{
                flexShrink: 0, padding: '7px 13px', borderRadius: 999, cursor: 'pointer', fontFamily: 'Manrope', fontWeight: 700, fontSize: 12.5, whiteSpace: 'nowrap',
                border: filter === c ? '1px solid rgba(96,165,250,0.4)' : '1px solid rgba(148,163,184,0.16)',
                background: filter === c ? 'rgba(59,130,246,0.16)' : 'rgba(15,23,42,0.5)',
                color: filter === c ? '#bfdbfe' : '#94A3B8',
              }}>{c}</button>
            ))}
          </div>
          <div style={{ display: 'grid' }}>
            {shown.map((tx, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div style={{ height: 1, background: 'rgba(148,163,184,0.08)' }} />}
                <TxRow tx={tx} />
              </React.Fragment>
            ))}
            {shown.length === 0 && <div style={{ color: '#64748B', fontSize: 13, fontWeight: 600, textAlign: 'center', padding: '24px 0' }}>Nenhuma movimentação nessa categoria.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

const detailAction = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  minHeight: 44, borderRadius: 13, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(15,23,42,0.55)',
  color: '#E2E8F0', fontFamily: 'Manrope, system-ui', fontWeight: 800, fontSize: 13.5, cursor: 'pointer',
};

Object.assign(window, { HomeScreen, CarteirasScreen, AccountDetail, MiniStat });
