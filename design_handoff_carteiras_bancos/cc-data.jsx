// cc-data.jsx — Conciliaaí: dados das contas, transações, e cartões realistas dos bancos
// Exporta (window): CC, BankCard, brandOf, fmtBRL, MastercardMark, VisaMark, EloMark

// ---- helpers ----
function fmtBRL(cents, { sign = false } = {}) {
  const v = Math.abs(cents) / 100;
  const s = v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pref = sign ? (cents < 0 ? '- ' : '+ ') : '';
  return `${pref}R$ ${s}`;
}

// ---- marcas de bandeira ----
function MastercardMark({ size = 34 }) {
  const r = size * 0.34;
  return (
    <svg width={size} height={size * 0.62} viewBox="0 0 54 34" aria-hidden="true">
      <circle cx="20" cy="17" r="15" fill="#EB001B" />
      <circle cx="34" cy="17" r="15" fill="#F79E1B" />
      <path d="M27 5.7a15 15 0 0 0 0 22.6 15 15 0 0 0 0-22.6Z" fill="#FF5F00" />
    </svg>
  );
}
function VisaMark({ color = '#fff', size = 40 }) {
  return (
    <span style={{
      fontFamily: 'Space Grotesk, system-ui', fontStyle: 'italic', fontWeight: 700,
      fontSize: size * 0.42, letterSpacing: '0.04em', color,
    }}>VISA</span>
  );
}
function EloMark({ size = 38 }) {
  return (
    <svg width={size} height={size * 0.42} viewBox="0 0 60 26" aria-hidden="true">
      <circle cx="13" cy="13" r="10" fill="#FFCB05" />
      <circle cx="30" cy="13" r="10" fill="#00A4E0" />
      <circle cx="47" cy="13" r="10" fill="#EF4123" />
    </svg>
  );
}

// ---- wordmarks dos bancos ----
function NubankLogo({ c = '#fff', s = 30 }) {
  return <span style={{ fontFamily: 'Manrope, system-ui', fontWeight: 800, fontSize: s, color: c, letterSpacing: '-0.06em', lineHeight: 1 }}>nu</span>;
}
function PicPayLogo({ s = 24 }) {
  return (
    <span style={{ fontFamily: 'Space Grotesk, system-ui', fontWeight: 700, fontSize: s, letterSpacing: '-0.02em', lineHeight: 1, display: 'inline-flex', alignItems: 'baseline' }}>
      <span style={{ color: '#fff' }}>Pic</span><span style={{ color: '#21C25E' }}>Pay</span>
    </span>
  );
}
function BBLogo({ s = 26 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <span style={{
        width: s * 1.05, height: s * 1.05, borderRadius: 6, background: '#FAE128',
        display: 'grid', placeItems: 'center', fontFamily: 'Space Grotesk, system-ui',
        fontWeight: 700, fontSize: s * 0.62, color: '#0033A0', letterSpacing: '-0.04em',
      }}>BB</span>
    </span>
  );
}
function ItauLogo({ s = 24 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
      <span style={{
        width: s * 1.15, height: s * 1.15, borderRadius: 7, background: '#003399',
        display: 'grid', placeItems: 'center', fontFamily: 'Space Grotesk, system-ui',
        fontWeight: 700, fontSize: s * 0.66, color: '#FFD200', letterSpacing: '-0.05em',
      }}>i</span>
      <span style={{ fontFamily: 'Manrope, system-ui', fontWeight: 800, fontSize: s, color: '#fff', letterSpacing: '-0.02em' }}>itaú</span>
    </span>
  );
}
function InterLogo({ c = '#fff', s = 22 }) {
  return <span style={{ fontFamily: 'Manrope, system-ui', fontWeight: 800, fontSize: s, color: c, letterSpacing: '-0.03em', lineHeight: 1 }}>Inter</span>;
}
function C6Logo({ s = 24 }) {
  return <span style={{ fontFamily: 'Space Grotesk, system-ui', fontWeight: 700, fontSize: s, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>C6</span>;
}
function CaixaLogo({ s = 20 }) {
  return <span style={{ fontFamily: 'Manrope, system-ui', fontWeight: 900, fontSize: s, color: '#fff', letterSpacing: '0.02em', lineHeight: 1 }}>CAIXA</span>;
}
function SantanderLogo({ s = 22 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: s * 1.1, height: s * 1.1, borderRadius: 999, background: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: s * 0.7, color: '#EC0000' }}>S</span>
      <span style={{ fontFamily: 'Manrope, system-ui', fontWeight: 800, fontSize: s * 0.82, color: '#fff', letterSpacing: '-0.01em' }}>Santander</span>
    </span>
  );
}

// ---- definição visual de cada banco ----
const BRANDS = {
  nubank: {
    name: 'Nubank',
    face: 'linear-gradient(135deg, #9F37E8 0%, #820AD1 58%, #6A02B0 100%)',
    glow: 'rgba(130,10,209,0.55)',
    fg: '#fff',
    Logo: NubankLogo, Network: MastercardMark,
    tier: 'Ultravioleta',
  },
  picpay: {
    name: 'PicPay',
    face: 'linear-gradient(135deg, #20242B 0%, #0C0E12 70%)',
    glow: 'rgba(33,194,94,0.30)',
    fg: '#fff',
    Logo: PicPayLogo, Network: MastercardMark,
    tier: 'Conta',
  },
  bb: {
    name: 'Banco do Brasil',
    face: 'linear-gradient(135deg, #0A47B8 0%, #0533A0 55%, #04246E 100%)',
    glow: 'rgba(10,71,184,0.5)',
    fg: '#fff',
    Logo: BBLogo, Network: EloMark,
    tier: 'Ourocard',
  },
  itau: {
    name: 'Itaú',
    face: 'linear-gradient(135deg, #FF8A1E 0%, #EC7000 50%, #C85400 100%)',
    glow: 'rgba(236,112,0,0.5)',
    fg: '#fff',
    Logo: ItauLogo, Network: MastercardMark,
    tier: 'Personnalité',
  },
  inter: {
    name: 'Inter',
    face: 'linear-gradient(135deg, #FF9D4D 0%, #FF7A00 55%, #E86A00 100%)',
    glow: 'rgba(255,122,0,0.5)',
    fg: '#fff',
    Logo: InterLogo, Network: MastercardMark,
    tier: 'Black',
  },
  c6: {
    name: 'C6 Bank',
    face: 'linear-gradient(135deg, #2C2C2E 0%, #161618 60%, #0A0A0B 100%)',
    glow: 'rgba(40,40,42,0.6)',
    fg: '#fff',
    Logo: C6Logo, Network: MastercardMark,
    tier: 'Carbon',
  },
  caixa: {
    name: 'Caixa',
    face: 'linear-gradient(135deg, #2A7FD4 0%, #1565B0 55%, #0E4A85 100%)',
    glow: 'rgba(21,101,176,0.5)',
    fg: '#fff',
    Logo: CaixaLogo, Network: EloMark,
    tier: 'Ourocard',
  },
  santander: {
    name: 'Santander',
    face: 'linear-gradient(135deg, #F33 0%, #EC0000 50%, #B30000 100%)',
    glow: 'rgba(236,0,0,0.5)',
    fg: '#fff',
    Logo: SantanderLogo, Network: VisaMark,
    tier: 'Unique',
  },
};
function brandOf(id) { return BRANDS[id] || BRANDS.nubank; }

// ---- contas do usuário ----
const ACCOUNTS = [
  { id: 'nubank', brand: 'nubank', nick: 'Nubank', type: 'Conta corrente', last4: '5887', balance: 348219 },
  { id: 'bb',     brand: 'bb',     nick: 'Banco do Brasil', type: 'Conta corrente', last4: '2041', balance: 891705 },
  { id: 'itau',   brand: 'itau',   nick: 'Itaú', type: 'Poupança', last4: '7730', balance: 120476 },
  { id: 'picpay', brand: 'picpay', nick: 'PicPay', type: 'Cartão de crédito', last4: '3037', balance: 15640 },
];

// ---- transações por conta (receitas +, despesas -) ----
const TX = {
  nubank: [
    { t: 'Salário — Mensal', cat: 'Salário', d: '05 jun', cents: 412700, type: 'in' },
    { t: 'iFood', cat: 'Alimentação', d: '08 jun', cents: -8490, type: 'out' },
    { t: 'Uber', cat: 'Transporte', d: '07 jun', cents: -2340, type: 'out' },
    { t: 'Spotify', cat: 'Assinaturas', d: '06 jun', cents: -2190, type: 'out' },
    { t: 'Pix recebido — Ana', cat: 'Transferências', d: '04 jun', cents: 15000, type: 'in' },
    { t: 'Mercado Pão de Açúcar', cat: 'Alimentação', d: '03 jun', cents: -23715, type: 'out' },
  ],
  bb: [
    { t: 'Transferência recebida', cat: 'Investimentos', d: '02 jun', cents: 500000, type: 'in' },
    { t: 'Aluguel', cat: 'Moradia', d: '05 jun', cents: -180000, type: 'out' },
    { t: 'Energia CEMIG', cat: 'Moradia', d: '09 jun', cents: -19840, type: 'out' },
    { t: 'Internet Vivo', cat: 'Moradia', d: '08 jun', cents: -9990, type: 'out' },
    { t: 'Rendimento poupança', cat: 'Investimentos', d: '01 jun', cents: 4205, type: 'in' },
  ],
  itau: [
    { t: 'Aplicação automática', cat: 'Investimentos', d: '01 jun', cents: 80000, type: 'in' },
    { t: 'Resgate', cat: 'Investimentos', d: '06 jun', cents: -30000, type: 'out' },
    { t: 'Rendimento', cat: 'Investimentos', d: '01 jun', cents: 1276, type: 'in' },
  ],
  picpay: [
    { t: 'Netflix', cat: 'Assinaturas', d: '07 jun', cents: -5590, type: 'out' },
    { t: 'Amazon', cat: 'Compras', d: '05 jun', cents: -12900, type: 'out' },
    { t: 'Cashback PicPay', cat: 'Outros', d: '06 jun', cents: 850, type: 'in' },
    { t: 'Farmácia', cat: 'Saúde', d: '03 jun', cents: -4720, type: 'out' },
  ],
};

function accountTotals(id) {
  const list = TX[id] || [];
  const inc = list.filter(x => x.cents > 0).reduce((a, b) => a + b.cents, 0);
  const exp = list.filter(x => x.cents < 0).reduce((a, b) => a + Math.abs(b.cents), 0);
  return { inc, exp };
}

const CC = {
  accounts: ACCOUNTS,
  tx: TX,
  accountTotals,
  totalBalance: () => CC.accounts.reduce((a, b) => a + b.balance, 0),
  monthIncome: 132725 + 0, // exibido no hero
  monthExpense: 214578,
  _seq: 100,
  newId() { CC._seq += 1; return 'acc' + CC._seq; },
  today() {
    const d = new Date();
    const m = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][d.getMonth()];
    return `${String(d.getDate()).padStart(2, '0')} ${m}`;
  },
  addAccount(data) {
    const id = CC.newId();
    CC.accounts.push({ id, ...data });
    CC.tx[id] = [];
    return id;
  },
  updateAccount(id, patch) {
    const a = CC.accounts.find(x => x.id === id);
    if (a) Object.assign(a, patch);
  },
  removeAccount(id) {
    const i = CC.accounts.findIndex(x => x.id === id);
    if (i >= 0) CC.accounts.splice(i, 1);
    delete CC.tx[id];
  },
  addTransfer(fromId, toId, cents) {
    const from = CC.accounts.find(x => x.id === fromId);
    const to = CC.accounts.find(x => x.id === toId);
    if (!from || !to || cents <= 0) return;
    from.balance -= cents; to.balance += cents;
    CC.tx[fromId] = CC.tx[fromId] || []; CC.tx[toId] = CC.tx[toId] || [];
    CC.tx[fromId].unshift({ t: `Transferência → ${to.nick}`, cat: 'Transferências', d: CC.today(), cents: -cents, type: 'out', transfer: true });
    CC.tx[toId].unshift({ t: `Transferência ← ${from.nick}`, cat: 'Transferências', d: CC.today(), cents: cents, type: 'in', transfer: true });
  },
  importTx(accId, items) {
    CC.tx[accId] = CC.tx[accId] || [];
    let delta = 0;
    items.forEach(it => { CC.tx[accId].unshift(it); delta += it.cents; });
    const a = CC.accounts.find(x => x.id === accId);
    if (a) a.balance += delta;
  },
};

// ---- componente do cartão realista ----
function BankCard({ account, w = 320, faded = false, chip, style = {}, onClick }) {
  if (chip === undefined) chip = (typeof window !== 'undefined' && window.__ccChip !== undefined) ? window.__ccChip : true;
  const b = brandOf(account.brand);
  const face = account.face || b.face;
  const glow = account.glow || b.glow;
  const tier = account.tier || b.tier;
  const h = w * 0.625;
  const Logo = b.Logo;
  const Network = b.Network;
  return (
    <div
      onClick={onClick}
      style={{
        width: w, height: h, borderRadius: w * 0.07, position: 'relative',
        background: face, color: b.fg, overflow: 'hidden', flexShrink: 0,
        boxShadow: `0 ${w * 0.06}px ${w * 0.12}px -${w * 0.04}px ${glow}, inset 0 1px 0 rgba(255,255,255,0.18)`,
        cursor: onClick ? 'pointer' : 'default',
        filter: faded ? 'saturate(0.85)' : 'none',
        ...style,
      }}
    >
      {/* brilho diagonal */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(115deg, rgba(255,255,255,0.14) 0%, transparent 32%, transparent 70%, rgba(0,0,0,0.18) 100%)',
        pointerEvents: 'none',
      }} />
      {/* conteúdo */}
      <div style={{ position: 'absolute', inset: 0, padding: w * 0.06, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Logo s={w * 0.085} />
          <span style={{ fontFamily: 'Manrope, system-ui', fontWeight: 700, fontSize: w * 0.04, opacity: 0.85, letterSpacing: '0.02em' }}>{tier}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            {chip && (
              <div style={{
                width: w * 0.11, height: w * 0.082, borderRadius: 5, marginBottom: w * 0.03,
                background: 'linear-gradient(135deg, #F4D58A, #C9A24B)',
                boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.15)',
              }} />
            )}
            <div style={{ fontFamily: 'Space Grotesk, system-ui', fontWeight: 500, fontSize: w * 0.05, letterSpacing: '0.12em', opacity: 0.92 }}>
              •••• {account.last4}
            </div>
          </div>
          <Network size={w * 0.13} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CC, BankCard, brandOf, fmtBRL, MastercardMark, VisaMark, EloMark });
