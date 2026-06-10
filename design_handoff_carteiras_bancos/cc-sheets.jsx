// cc-sheets.jsx — bottom sheets: cadastrar banco, importar OFX, menu do +
// Exporta (window): Sheet, CadastroSheet, OfxSheet, QuickAddMenu

function Sheet({ children, onClose, max = 540 }) {
  return (
    <div onClick={onClose} style={{
      position: 'absolute', inset: 0, zIndex: 80, display: 'flex', alignItems: 'flex-end',
      background: 'rgba(3,6,18,0.66)', backdropFilter: 'blur(6px)', animation: 'ccFade 0.2s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxHeight: max, overflowY: 'auto', overflowX: 'hidden',
        background: '#141d30', borderRadius: '26px 26px 0 0', border: '1px solid rgba(148,163,184,0.14)',
        borderBottom: 0, padding: '12px 20px calc(28px + 18px)', boxShadow: '0 -28px 80px rgba(2,6,23,0.6)',
        animation: 'ccSheetUp 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{ width: 44, height: 4, borderRadius: 999, background: 'rgba(148,163,184,0.35)', margin: '0 auto 18px' }} />
        {children}
      </div>
    </div>
  );
}

const sheetTitle = { fontFamily: 'Space Grotesk, system-ui', fontWeight: 700, fontSize: 21, color: '#F1F5F9', letterSpacing: '-0.01em' };
const sheetSub = { color: '#94A3B8', fontSize: 13.5, fontWeight: 600, marginTop: 4, lineHeight: 1.4 };
const primaryBtn = {
  width: '100%', minHeight: 52, borderRadius: 16, border: 0, cursor: 'pointer',
  background: 'linear-gradient(135deg,#60A5FA,#2563EB)', color: '#fff',
  fontFamily: 'Manrope, system-ui', fontWeight: 900, fontSize: 15.5,
  boxShadow: '0 12px 30px rgba(37,99,235,0.4)',
};
const ghostBtn = {
  width: '100%', minHeight: 48, borderRadius: 14, cursor: 'pointer',
  border: '1px solid rgba(148,163,184,0.2)', background: 'transparent', color: '#94A3B8',
  fontFamily: 'Manrope, system-ui', fontWeight: 800, fontSize: 14,
};

const BANK_LIST = ['nubank', 'bb', 'itau', 'picpay', 'inter', 'c6', 'caixa', 'santander'];
function bankFace(id) { return brandOf(id).face; }
function bankName(id) { return brandOf(id).name; }
function BankFaceLogo({ id, s }) { const L = brandOf(id).Logo; return <L s={s} />; }

const CARD_COLORS = [
  { id: 'auto', label: 'Da marca', face: null },
  { id: 'violet', face: 'linear-gradient(135deg,#9F37E8,#6A02B0)' },
  { id: 'blue', face: 'linear-gradient(135deg,#3B82F6,#1b3fa0)' },
  { id: 'green', face: 'linear-gradient(135deg,#22C55E,#15803D)' },
  { id: 'graphite', face: 'linear-gradient(135deg,#334155,#0F172A)' },
];

function CadastroSheet({ onClose, onDone }) {
  const [step, setStep] = React.useState('bank');
  const [bank, setBank] = React.useState(null);
  const [nick, setNick] = React.useState('');
  const [type, setType] = React.useState('Conta corrente');
  const [color, setColor] = React.useState('auto');

  const previewFace = color === 'auto' ? bankFace(bank) : CARD_COLORS.find(c => c.id === color).face;
  const previewAcc = { brand: bank || 'nubank', last4: '0000', nick: nick || bankName(bank || 'nubank') };

  const finish = () => {
    if (onDone) onDone({
      brand: bank,
      nick: nick || bankName(bank),
      type,
      last4: String(Math.floor(1000 + Math.random() * 9000)),
      balance: 0,
      face: color === 'auto' ? undefined : CARD_COLORS.find(c => c.id === color).face,
    });
    onClose();
  };

  return (
    <Sheet onClose={onClose}>
      {step === 'bank' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <div style={sheetTitle}>Adicionar banco</div>
            <div style={sheetSub}>Escolha a instituição. Você pode cadastrar quantos bancos quiser.</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {BANK_LIST.map(id => (
              <button key={id} onClick={() => { setBank(id); setNick(bankName(id)); setStep('form'); }} style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '12px 13px', borderRadius: 15,
                border: '1px solid rgba(148,163,184,0.14)', background: 'rgba(15,23,42,0.5)', cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ width: 38, height: 38, borderRadius: 11, background: bankFace(id), display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                  <BankFaceLogo id={id} s={13} />
                </span>
                <span style={{ color: '#E2E8F0', fontWeight: 800, fontSize: 13.5, fontFamily: 'Manrope' }}>{bankName(id)}</span>
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
              <div style={sheetTitle}>{bankName(bank)}</div>
              <div style={{ ...sheetSub, marginTop: 1 }}>Como você quer chamar essa conta?</div>
            </div>
          </div>

          {/* preview */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
            <div style={{ width: 230, height: 230 * 0.625, borderRadius: 16, background: previewFace, position: 'relative', overflow: 'hidden', boxShadow: '0 16px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18)' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,0.14) 0%, transparent 40%)' }} />
              <div style={{ position: 'absolute', inset: 0, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <BankFaceLogo id={bank} s={20} />
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: 'Manrope' }}>{nick || bankName(bank)}</div>
              </div>
            </div>
          </div>

          <label style={fieldWrap}>
            <span style={fieldLabel}>Apelido da conta</span>
            <input value={nick} onChange={e => setNick(e.target.value)} placeholder="Ex: Nubank principal" style={inputStyle} />
          </label>

          <div style={fieldWrap}>
            <span style={fieldLabel}>Tipo de conta</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 }}>
              {['Conta corrente', 'Poupança', 'Cartão de crédito'].map(t => (
                <button key={t} onClick={() => setType(t)} style={{
                  minHeight: 44, borderRadius: 12, cursor: 'pointer', padding: '0 4px', lineHeight: 1.2,
                  border: type === t ? '1px solid rgba(96,165,250,0.5)' : '1px solid rgba(148,163,184,0.16)',
                  background: type === t ? 'rgba(59,130,246,0.18)' : 'rgba(15,23,42,0.5)',
                  color: type === t ? '#bfdbfe' : '#94A3B8', fontFamily: 'Manrope', fontWeight: 800, fontSize: 11.5,
                }}>{t}</button>
              ))}
            </div>
          </div>

          <div style={fieldWrap}>
            <span style={fieldLabel}>Cor do cartão</span>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              {CARD_COLORS.map(c => (
                <button key={c.id} onClick={() => setColor(c.id)} style={{
                  width: 42, height: 42, borderRadius: 11, cursor: 'pointer',
                  background: c.id === 'auto' ? 'conic-gradient(from 180deg,#9F37E8,#3B82F6,#22C55E,#EC7000,#9F37E8)' : c.face,
                  border: color === c.id ? '2px solid #fff' : '2px solid transparent',
                  boxShadow: color === c.id ? '0 0 0 2px #2563EB' : 'none',
                }} />
              ))}
            </div>
          </div>

          <button style={primaryBtn} onClick={() => setStep('done')}>Salvar conta</button>
        </div>
      )}

      {step === 'done' && (
        <DoneState
          title="Conta adicionada!"
          sub={`${nick || bankName(bank)} agora aparece no seu saldo em contas e na sua carteira.`}
          onClose={finish}
        />
      )}
    </Sheet>
  );
}

const fieldWrap = { display: 'grid', gap: 8 };
const fieldLabel = { color: '#94A3B8', fontSize: 12.5, fontWeight: 800, letterSpacing: '0.01em' };
const inputStyle = {
  minHeight: 48, borderRadius: 13, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(11,17,32,0.72)',
  color: '#F1F5F9', padding: '0 14px', fontFamily: 'Manrope', fontSize: 15, fontWeight: 600, outline: 'none', width: '100%', boxSizing: 'border-box',
};

function DoneState({ title, sub, onClose, accent = '#22C55E' }) {
  return (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'center', textAlign: 'center', padding: '8px 0' }}>
      <div style={{ width: 72, height: 72, borderRadius: 999, background: 'rgba(34,197,94,0.14)', border: '1px solid rgba(34,197,94,0.3)', display: 'grid', placeItems: 'center', animation: 'ccPop 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
        <Icon name="check" size={34} color={accent} sw={2.6} />
      </div>
      <div>
        <div style={sheetTitle}>{title}</div>
        <div style={{ ...sheetSub, maxWidth: 320, marginInline: 'auto' }}>{sub}</div>
      </div>
      <button style={{ ...primaryBtn, marginTop: 4 }} onClick={onClose}>Concluir</button>
    </div>
  );
}

// ---------- Importação OFX: detecção, banco desconhecido e revisão ----------
const CAT_OPTIONS = ['Alimentação', 'Transporte', 'Moradia', 'Assinaturas', 'Compras', 'Saúde', 'Salário', 'Transferências', 'Outros'];

function OfxSheet({ onClose, defaultAcc, onImport }) {
  const [step, setStep] = React.useState('pick');
  const [scenario, setScenario] = React.useState('known'); // known | unknown
  const [target, setTarget] = React.useState(defaultAcc || 'nubank');
  const detected = 'nubank';

  // monta lançamentos da revisão (com categoria editável e duplicados marcados)
  const base = (CC.tx['nubank'] || []).slice(0, 5);
  const [rows, setRows] = React.useState(() =>
    base.map((tx, i) => ({
      t: tx.t, cents: tx.cents, cat: tx.cat, d: tx.d, type: tx.cents > 0 ? 'in' : 'out',
      dup: i === 2, ignore: i === 2, // 1 duplicado sugerido, já desmarcado
    }))
  );
  const cycleCat = (i) => setRows(rs => rs.map((r, j) => j === i ? { ...r, cat: CAT_OPTIONS[(CAT_OPTIONS.indexOf(r.cat) + 1) % CAT_OPTIONS.length] } : r));
  const toggleIgnore = (i) => setRows(rs => rs.map((r, j) => j === i ? { ...r, ignore: !r.ignore } : r));
  const dupCount = rows.filter(r => r.dup).length;
  const willImport = rows.filter(r => !r.ignore).length;

  const files = [
    { name: 'Nubank_062026.ofx', sub: 'OFX · 23 lançamentos', sc: 'known' },
    { name: 'extrato_05-2026.ofx', sub: 'OFX · banco genérico', sc: 'unknown' },
  ];

  const doImport = () => {
    const items = rows.filter(r => !r.ignore).map(r => ({ t: r.t, cat: r.cat, d: r.d, cents: r.cents, type: r.type }));
    if (onImport) onImport(target, items, willImport);
    setStep('done');
  };

  return (
    <Sheet onClose={onClose}>
      {step === 'pick' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <div style={sheetTitle}>Importar extrato</div>
            <div style={sheetSub}>Envie um arquivo do banco (OFX, CSV, XLSX ou PDF). A gente reconhece o banco e organiza tudo.</div>
          </div>
          <div style={{ display: 'grid', placeItems: 'center', gap: 8, padding: '22px', borderRadius: 18, border: '1.5px dashed rgba(167,139,250,0.4)', background: 'rgba(167,139,250,0.08)' }}>
            <span style={{ width: 52, height: 52, borderRadius: 15, background: 'rgba(167,139,250,0.18)', display: 'grid', placeItems: 'center' }}><Icon name="upload" size={24} color="#c4b5fd" /></span>
            <span style={{ color: '#94A3B8', fontSize: 12.5, fontWeight: 600 }}>arraste aqui ou escolha um arquivo</span>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {files.map(f => (
              <button key={f.name} onClick={() => { setScenario(f.sc); setStep(f.sc === 'known' ? 'detected' : 'unknown'); }} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', borderRadius: 14,
                border: '1px solid rgba(148,163,184,0.14)', background: 'rgba(15,23,42,0.5)', cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(96,165,250,0.14)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="upload" size={17} color="#60A5FA" /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#E2E8F0', fontWeight: 800, fontSize: 13.5 }}>{f.name}</div>
                  <div style={{ color: '#64748B', fontSize: 11.5, fontWeight: 600 }}>{f.sub}</div>
                </div>
                <Icon name="chevR" size={16} color="#475569" />
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'detected' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <div style={sheetTitle}>Banco reconhecido</div>
            <div style={sheetSub}>Lemos o campo do banco no arquivo e identificamos a instituição.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 14, borderRadius: 16, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.1)' }}>
            <span style={{ width: 46, height: 46, borderRadius: 12, background: bankFace(detected), display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)' }}>
              <BankFaceLogo id={detected} s={16} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#bbf7d0', fontSize: 11.5, fontWeight: 800, letterSpacing: '0.06em' }}>DETECTAMOS</div>
              <div style={{ color: '#F1F5F9', fontWeight: 800, fontSize: 16, fontFamily: 'Space Grotesk' }}>{bankName(detected)}</div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#4ADE80', fontWeight: 800, fontSize: 12.5 }}><Icon name="check" size={15} color="#4ADE80" /> 23 itens</span>
          </div>
          <AccountChooser accounts={CC.accounts} target={target} setTarget={setTarget} suggested={detected} label="Jogar os valores nesta conta" />
          <button style={primaryBtn} onClick={() => setStep('review')}>Revisar lançamentos</button>
        </div>
      )}

      {step === 'unknown' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <div style={sheetTitle}>Banco não reconhecido</div>
            <div style={sheetSub}>O arquivo <strong style={{ color: '#cbd5e1' }}>extrato_05-2026.ofx</strong> não tem um identificador de banco que a gente conheça. Escolha pra qual conta enviar — ou crie uma nova.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 13, borderRadius: 14, border: '1px solid rgba(234,179,8,0.3)', background: 'rgba(234,179,8,0.1)' }}>
            <span style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(234,179,8,0.18)', display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 20 }}>⚠️</span>
            <div style={{ color: '#fde68a', fontSize: 12.5, fontWeight: 700, lineHeight: 1.35 }}>23 lançamentos lidos, mas sem banco identificado.</div>
          </div>
          <AccountChooser accounts={CC.accounts} target={target} setTarget={setTarget} label="Enviar para a conta" />
          <button onClick={() => setStep('review')} style={ghostBtn}>+ Criar nova conta pra esse banco</button>
          <button style={primaryBtn} onClick={() => setStep('review')}>Continuar</button>
        </div>
      )}

      {step === 'review' && (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => setStep(scenario === 'known' ? 'detected' : 'unknown')} style={{ border: 0, background: 'rgba(255,255,255,0.06)', borderRadius: 999, width: 34, height: 34, display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Icon name="chevL" size={16} color="#E2E8F0" /></button>
            <div>
              <div style={sheetTitle}>Revisar lançamentos</div>
              <div style={{ ...sheetSub, marginTop: 1 }}>{willImport} de 23 entram em {CC.accounts.find(a => a.id === target).nick} · {dupCount} duplicado(s)</div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {rows.map((r, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 11, alignItems: 'center',
                padding: '11px 12px', borderRadius: 13,
                border: r.dup ? '1px solid rgba(234,179,8,0.3)' : '1px solid rgba(148,163,184,0.12)',
                background: r.ignore ? 'rgba(15,23,42,0.35)' : 'rgba(30,41,59,0.5)',
                opacity: r.ignore ? 0.55 : 1,
              }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: r.type === 'in' ? 'rgba(34,197,94,0.14)' : 'rgba(239,68,68,0.13)', display: 'grid', placeItems: 'center' }}>
                  <Icon name={r.type === 'in' ? 'up' : 'down'} size={15} color={r.type === 'in' ? '#4ADE80' : '#F87171'} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#F1F5F9', fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.t}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <button onClick={() => cycleCat(i)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(96,165,250,0.3)', background: 'rgba(59,130,246,0.14)', color: '#bfdbfe', fontSize: 11, fontWeight: 800, cursor: 'pointer', fontFamily: 'Manrope' }}>
                      {r.cat} <Icon name="chevDown" size={11} color="#bfdbfe" />
                    </button>
                    {r.dup && <span style={{ fontSize: 10, fontWeight: 900, color: '#fde68a', background: 'rgba(234,179,8,0.14)', border: '1px solid rgba(234,179,8,0.3)', padding: '2px 6px', borderRadius: 999 }}>DUPLICADO?</span>}
                  </div>
                </div>
                <div style={{ display: 'grid', justifyItems: 'end', gap: 5 }}>
                  <span style={{ color: r.type === 'in' ? '#4ADE80' : '#F87171', fontWeight: 800, fontSize: 13.5, fontFamily: 'Space Grotesk' }}>{fmtBRL(r.cents, { sign: true })}</span>
                  <button onClick={() => toggleIgnore(i)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: 0, background: 'transparent', cursor: 'pointer', color: r.ignore ? '#64748B' : '#94A3B8', fontSize: 10.5, fontWeight: 800, fontFamily: 'Manrope' }}>
                    <span style={{ width: 15, height: 15, borderRadius: 4, border: `1.5px solid ${r.ignore ? '#475569' : '#60A5FA'}`, background: r.ignore ? 'transparent' : '#60A5FA', display: 'grid', placeItems: 'center' }}>{!r.ignore && <Icon name="check" size={10} color="#fff" sw={3} />}</span>
                    {r.ignore ? 'Ignorado' : 'Importar'}
                  </button>
                </div>
              </div>
            ))}
            <div style={{ color: '#64748B', fontSize: 11.5, fontWeight: 600, textAlign: 'center', marginTop: 2 }}>+ 18 outros lançamentos já categorizados</div>
          </div>

          <button style={primaryBtn} onClick={doImport}>Importar {willImport} lançamentos</button>
        </div>
      )}

      {step === 'done' && (
        <DoneState
          title={`${willImport} lançamentos importados!`}
          sub={`Tudo organizado na conta ${CC.accounts.find(a => a.id === target).nick}, com categorias sugeridas automaticamente.`}
          onClose={onClose}
        />
      )}
    </Sheet>
  );
}

function AccountChooser({ accounts, target, setTarget, suggested, label }) {
  return (
    <div style={fieldWrap}>
      <span style={fieldLabel}>{label}</span>
      <div style={{ display: 'grid', gap: 8 }}>
        {accounts.map(acc => {
          const on = target === acc.id;
          const rec = acc.id === suggested;
          return (
            <button key={acc.id} onClick={() => setTarget(acc.id)} style={{
              display: 'flex', alignItems: 'center', gap: 11, padding: '11px 12px', borderRadius: 13, cursor: 'pointer', textAlign: 'left',
              border: on ? '1px solid rgba(96,165,250,0.5)' : '1px solid rgba(148,163,184,0.14)',
              background: on ? 'rgba(59,130,246,0.16)' : 'rgba(15,23,42,0.5)',
            }}>
              <span style={{ width: 34, height: 34, borderRadius: 10, background: acc.face || bankFace(acc.brand), display: 'grid', placeItems: 'center', flexShrink: 0 }}><BankFaceLogo id={acc.brand} s={12} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#E2E8F0', fontWeight: 800, fontSize: 13.5 }}>{acc.nick}</div>
                <div style={{ color: '#64748B', fontSize: 11.5, fontWeight: 600 }}>{acc.type} · ••{acc.last4}</div>
              </div>
              {rec && <span style={{ fontSize: 10.5, fontWeight: 900, color: '#4ADE80', background: 'rgba(34,197,94,0.14)', border: '1px solid rgba(34,197,94,0.3)', padding: '3px 7px', borderRadius: 999 }}>SUGERIDA</span>}
              {on && <Icon name="check" size={18} color="#60A5FA" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Editar / remover banco ----------
function EditSheet({ account, onClose, onSave, onDelete }) {
  const [nick, setNick] = React.useState(account.nick);
  const [type, setType] = React.useState(account.type);
  const [color, setColor] = React.useState('keep');
  const [confirmDel, setConfirmDel] = React.useState(false);

  const colors = [{ id: 'keep', label: 'Atual', face: account.face || bankFace(account.brand) }, ...CARD_COLORS];
  const previewFace = color === 'keep' ? (account.face || bankFace(account.brand))
    : color === 'auto' ? bankFace(account.brand)
      : CARD_COLORS.find(c => c.id === color).face;

  const save = () => {
    const face = color === 'keep' ? account.face : color === 'auto' ? null : CARD_COLORS.find(c => c.id === color).face;
    onSave({ nick: nick || account.nick, type, face });
    onClose();
  };

  return (
    <Sheet onClose={onClose}>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={sheetTitle}>Editar conta</div>

        <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0' }}>
          <BankCard account={{ ...account, face: previewFace, nick }} w={224} />
        </div>

        <label style={fieldWrap}>
          <span style={fieldLabel}>Apelido da conta</span>
          <input value={nick} onChange={e => setNick(e.target.value)} style={inputStyle} />
        </label>

        <div style={fieldWrap}>
          <span style={fieldLabel}>Tipo de conta</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 }}>
            {['Conta corrente', 'Poupança', 'Cartão de crédito'].map(tp => (
              <button key={tp} onClick={() => setType(tp)} style={{
                minHeight: 44, borderRadius: 12, cursor: 'pointer', padding: '0 4px', lineHeight: 1.2,
                border: type === tp ? '1px solid rgba(96,165,250,0.5)' : '1px solid rgba(148,163,184,0.16)',
                background: type === tp ? 'rgba(59,130,246,0.18)' : 'rgba(15,23,42,0.5)',
                color: type === tp ? '#bfdbfe' : '#94A3B8', fontFamily: 'Manrope', fontWeight: 800, fontSize: 11.5,
              }}>{tp}</button>
            ))}
          </div>
        </div>

        <div style={fieldWrap}>
          <span style={fieldLabel}>Cor do cartão</span>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            {colors.map(c => (
              <button key={c.id} onClick={() => setColor(c.id)} style={{
                width: 42, height: 42, borderRadius: 11, cursor: 'pointer',
                background: c.id === 'auto' ? 'conic-gradient(from 180deg,#9F37E8,#3B82F6,#22C55E,#EC7000,#9F37E8)' : c.face,
                border: color === c.id ? '2px solid #fff' : '2px solid transparent',
                boxShadow: color === c.id ? '0 0 0 2px #2563EB' : 'none',
              }} />
            ))}
          </div>
        </div>

        <button style={primaryBtn} onClick={save}>Salvar alterações</button>

        {!confirmDel ? (
          <button style={{ ...ghostBtn, color: '#fca5a5', borderColor: 'rgba(248,113,113,0.3)' }} onClick={() => setConfirmDel(true)}>Excluir conta</button>
        ) : (
          <div style={{ display: 'grid', gap: 8, padding: 12, borderRadius: 14, border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(127,29,29,0.18)' }}>
            <span style={{ color: '#fecaca', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>Excluir {account.nick} e todos os seus lançamentos?</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button style={ghostBtn} onClick={() => setConfirmDel(false)}>Cancelar</button>
              <button style={{ ...primaryBtn, background: 'linear-gradient(135deg,#ef4444,#b91c1c)', minHeight: 48, boxShadow: 'none' }} onClick={() => { onDelete(); onClose(); }}>Excluir</button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

// ---------- Transferência entre contas ----------
function MoneyInput({ cents, onChange }) {
  const set = (e) => {
    const digits = (e.target.value.match(/\d/g) || []).join('');
    onChange(parseInt(digits || '0', 10));
  };
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#64748B', fontWeight: 800, fontSize: 18, fontFamily: 'Space Grotesk' }}>R$</span>
      <input value={(cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} onChange={set} inputMode="numeric"
        style={{ ...inputStyle, paddingLeft: 46, minHeight: 58, fontSize: 24, fontWeight: 800, fontFamily: 'Space Grotesk', color: '#F1F5F9' }} />
    </div>
  );
}

function TransferSheet({ accounts, defaultFrom, onClose, onConfirm }) {
  const [from, setFrom] = React.useState(defaultFrom || accounts[0].id);
  const [to, setTo] = React.useState(accounts.find(a => a.id !== (defaultFrom || accounts[0].id)).id);
  const [cents, setCents] = React.useState(0);
  const [done, setDone] = React.useState(false);

  const fromAcc = accounts.find(a => a.id === from);
  const toAcc = accounts.find(a => a.id === to);
  const valid = cents > 0 && from !== to && cents <= fromAcc.balance;

  const picker = (value, setValue, exclude) => (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 0', margin: '0 -2px', scrollbarWidth: 'none' }}>
      {accounts.filter(a => a.id !== exclude).map(a => {
        const on = value === a.id;
        return (
          <button key={a.id} onClick={() => setValue(a.id)} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 8px 8px', borderRadius: 999, cursor: 'pointer', flexShrink: 0,
            border: on ? '1px solid rgba(96,165,250,0.5)' : '1px solid rgba(148,163,184,0.16)',
            background: on ? 'rgba(59,130,246,0.16)' : 'rgba(15,23,42,0.5)',
          }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: a.face || bankFace(a.brand), display: 'grid', placeItems: 'center', flexShrink: 0 }}><BankFaceLogo id={a.brand} s={10} /></span>
            <span style={{ color: on ? '#bfdbfe' : '#cbd5e1', fontWeight: 800, fontSize: 12.5, fontFamily: 'Manrope', whiteSpace: 'nowrap' }}>{a.nick}</span>
          </button>
        );
      })}
    </div>
  );

  if (done) {
    return <Sheet onClose={onClose}><DoneState title="Transferência registrada!" sub={`${fmtBRL(cents)} de ${fromAcc.nick} para ${toAcc.nick}. Não conta como receita nem despesa.`} onClose={onClose} accent="#60A5FA" /></Sheet>;
  }

  return (
    <Sheet onClose={onClose}>
      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <div style={sheetTitle}>Transferência entre contas</div>
          <div style={sheetSub}>Mova dinheiro entre seus bancos sem virar despesa ou receita.</div>
        </div>

        <div style={fieldWrap}><span style={fieldLabel}>De</span>{picker(from, (id) => { setFrom(id); if (id === to) setTo(accounts.find(a => a.id !== id).id); }, null)}</div>
        <div style={{ display: 'grid', placeItems: 'center', margin: '-6px 0' }}>
          <span style={{ width: 34, height: 34, borderRadius: 999, background: 'rgba(59,130,246,0.14)', border: '1px solid rgba(96,165,250,0.3)', display: 'grid', placeItems: 'center' }}><Icon name="down" size={16} color="#60A5FA" /></span>
        </div>
        <div style={fieldWrap}><span style={fieldLabel}>Para</span>{picker(to, setTo, from)}</div>

        <div style={fieldWrap}>
          <span style={fieldLabel}>Valor</span>
          <MoneyInput cents={cents} onChange={setCents} />
          <span style={{ color: cents > fromAcc.balance ? '#fca5a5' : '#64748B', fontSize: 11.5, fontWeight: 600 }}>
            Saldo em {fromAcc.nick}: {fmtBRL(fromAcc.balance)}{cents > fromAcc.balance ? ' · saldo insuficiente' : ''}
          </span>
        </div>

        <button style={{ ...primaryBtn, opacity: valid ? 1 : 0.45, pointerEvents: valid ? 'auto' : 'none' }} onClick={() => { onConfirm(from, to, cents); setDone(true); }}>
          Transferir {cents > 0 ? fmtBRL(cents) : ''}
        </button>
      </div>
    </Sheet>
  );
}

// ---------- Menu do botão + ----------
function QuickAddMenu({ onClose, onAdd, onImport, onTransfer }) {
  const item = (icon, color, label, sub, onClick) => (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 13, width: '100%', padding: '13px 14px', borderRadius: 15,
      border: '1px solid rgba(148,163,184,0.12)', background: 'rgba(30,41,59,0.6)', cursor: 'pointer', textAlign: 'left',
    }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, background: `${color}22`, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={icon} size={19} color={color} /></span>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#F1F5F9', fontWeight: 800, fontSize: 14.5, fontFamily: 'Manrope' }}>{label}</div>
        <div style={{ color: '#64748B', fontSize: 12, fontWeight: 600 }}>{sub}</div>
      </div>
      <Icon name="chevR" size={16} color="#475569" />
    </button>
  );
  return (
    <Sheet onClose={onClose} max={420}>
      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ ...sheetTitle, marginBottom: 4 }}>Adicionar</div>
        {item('bank', '#60A5FA', 'Novo banco', 'Cadastrar conta ou cartão', () => { onClose(); onAdd(); })}
        {item('upload', '#a78bfa', 'Importar extrato', 'OFX, CSV, XLSX ou PDF', () => { onClose(); onImport(); })}
        {item('wallet', '#2dd4bf', 'Transferência', 'Mover entre suas contas', () => { onClose(); onTransfer(); })}
        {item('up', '#22C55E', 'Nova receita', 'Lançar entrada manual', onClose)}
        {item('down', '#EF4444', 'Nova despesa', 'Lançar saída manual', onClose)}
      </div>
    </Sheet>
  );
}

Object.assign(window, { Sheet, CadastroSheet, OfxSheet, EditSheet, TransferSheet, AccountChooser, MoneyInput, QuickAddMenu, DoneState });
