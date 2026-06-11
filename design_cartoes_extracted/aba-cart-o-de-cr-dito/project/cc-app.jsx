// cc-app.jsx — App principal do protótipo Conciliaaí (telas + navegação + sheets + tweaks)
// Monta dentro do mock de iPhone. A moldura é só demonstração — no app real é PWA.

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "creditLayout": "deck",
  "nav2": "credito",
  "placement": "inicio",
  "interaction": "deck",
  "chip": true
}/*EDITMODE-END*/;

function useForce() {
  const [, set] = React.useState(0);
  return React.useCallback(() => set(x => x + 1), []);
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const force = useForce();

  const [tab, setTab] = React.useState('home');       // home|credito|carteiras|categorias|grupos|perfil
  const [accDetail, setAccDetail] = React.useState(null);
  const [cardDetail, setCardDetail] = React.useState(null);
  const [sheet, setSheet] = React.useState(null);     // cadastro|ofx|edit|transfer|fab|novocartao|pagar|gasto|editcard
  const [sheetAcc, setSheetAcc] = React.useState(null);
  const [sheetCard, setSheetCard] = React.useState(null);

  React.useEffect(() => { window.__ccChip = t.chip; force(); }, [t.chip]);

  const accounts = CC.accounts;
  const cards = CC.cards;

  // ---- navegação de contas ----
  const openAcc = (a) => setAccDetail(a);
  const openCard = (c) => { setCardDetail(c); };

  // ---- sheets ----
  const openSheet = (type, acc) => { setSheetAcc(acc || null); setSheet(type); };
  const openPay = (card) => { setSheetCard(card); setSheet('pagar'); };
  const openSpend = (card) => { setSheetCard(card); setSheet('gasto'); };
  const closeSheet = () => setSheet(null);

  // ---- mutações de cartão ----
  const doNewCard = (data) => { CC.addCard(data); force(); };
  const doPay = (cardId, fromId, cents) => { CC.payInvoice(cardId, fromId, cents); force(); };
  const doSpend = (cardId, data) => { CC.addCardExpense(cardId, data); force(); };
  const doEditCard = (id, patch) => { CC.updateCard(id, patch); setCardDetail(CC.cards.find(c => c.id === id) || null); force(); };
  const doDeleteCard = (id) => { CC.removeCard(id); setCardDetail(null); force(); };

  // ---- nav inferior ----
  const slot2 = t.nav2 === 'carteiras' ? { id: 'carteiras', label: 'Carteiras', icon: 'wallet' }
    : t.nav2 === 'categorias' ? { id: 'categorias', label: 'Categorias', icon: 'tag' }
      : { id: 'credito', label: 'Crédito', icon: 'card' };
  const navItems = [
    { id: 'home', label: 'Início', icon: 'home' },
    slot2,
    { id: 'grupos', label: 'Grupos', icon: 'users' },
    { id: 'perfil', label: 'Perfil', icon: 'user' },
  ];

  // ---- tela ativa ----
  let screen = null;
  if (tab === 'home') {
    screen = <HomeScreen placement={t.placement} interaction={t.interaction} accounts={accounts}
      onSelect={openAcc} onAdd={() => openSheet('cadastro')} onCredit={() => setTab('credito')} />;
  } else if (tab === 'credito') {
    screen = <CreditoScreen layout={t.creditLayout} cards={cards}
      onOpen={openCard} onPay={openPay} onSpend={openSpend} onAdd={() => setSheet('novocartao')} />;
  } else if (tab === 'carteiras') {
    screen = <CarteirasScreen interaction={t.interaction} accounts={accounts}
      onSelect={openAcc} onAdd={() => openSheet('cadastro')} onImport={() => openSheet('ofx')} />;
  } else if (tab === 'categorias') {
    screen = <CategoriasScreen />;
  } else if (tab === 'grupos') {
    screen = <GruposScreen />;
  } else if (tab === 'perfil') {
    screen = <PerfilScreen />;
  }

  return (
    <IOSDevice dark width={402} height={864}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,#0b1120,#070b16)' }}>
        <div style={{ height: 52, flexShrink: 0 }} />
        <TopBar />
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {screen}
        </div>
        <BottomNav tab={tab} onTab={setTab} onFab={() => setSheet('fab')} items={navItems} />
      </div>

      {/* overlays full-screen */}
      {accDetail && (
        <AccountDetail account={accDetail} onBack={() => setAccDetail(null)}
          onImport={(a) => openSheet('ofx', a)} onEdit={(a) => openSheet('edit', a)} onTransfer={(a) => openSheet('transfer', a)} />
      )}
      {cardDetail && (
        <CartaoDetail card={cardDetail} onBack={() => setCardDetail(null)}
          onPay={openPay} onSpend={openSpend} onEdit={(c) => { setSheetCard(c); setSheet('editcard'); }} />
      )}

      {/* bottom sheets */}
      {sheet === 'fab' && (
        <QuickAddMenu onClose={closeSheet}
          onAdd={() => openSheet('cadastro')} onImport={() => openSheet('ofx')} onTransfer={() => openSheet('transfer')}
          onNewCard={() => setSheet('novocartao')} onCardExpense={() => { setSheetCard(cards[0]); setSheet('gasto'); }} />
      )}
      {sheet === 'cadastro' && <CadastroSheet onClose={closeSheet} onDone={(data) => { CC.addAccount(data); force(); }} />}
      {sheet === 'ofx' && <OfxSheet onClose={closeSheet} defaultAcc={sheetAcc ? sheetAcc.id : undefined} onImport={(accId, items) => { CC.importTx(accId, items); force(); }} />}
      {sheet === 'edit' && sheetAcc && (
        <EditSheet account={sheetAcc} onClose={closeSheet}
          onSave={(patch) => { CC.updateAccount(sheetAcc.id, patch); if (accDetail && accDetail.id === sheetAcc.id) setAccDetail(CC.accounts.find(a => a.id === sheetAcc.id)); force(); }}
          onDelete={() => { CC.removeAccount(sheetAcc.id); setAccDetail(null); force(); }} />
      )}
      {sheet === 'transfer' && (
        <TransferSheet accounts={accounts} defaultFrom={sheetAcc ? sheetAcc.id : undefined} onClose={closeSheet}
          onConfirm={(from, to, cents) => { CC.addTransfer(from, to, cents); force(); }} />
      )}

      {/* sheets de crédito */}
      {sheet === 'novocartao' && <NovoCartaoSheet onClose={closeSheet} onDone={doNewCard} />}
      {sheet === 'pagar' && sheetCard && (
        <PagarFaturaSheet card={CC.cards.find(c => c.id === sheetCard.id) || sheetCard} accounts={accounts} onClose={closeSheet}
          onConfirm={(cardId, fromId, cents) => doPay(cardId, fromId, cents)} />
      )}
      {sheet === 'gasto' && sheetCard && (
        <GastoCartaoSheet card={CC.cards.find(c => c.id === sheetCard.id) || sheetCard} onClose={closeSheet}
          onConfirm={(cardId, data) => doSpend(cardId, data)} />
      )}
      {sheet === 'editcard' && sheetCard && (
        <EditCartaoSheet card={CC.cards.find(c => c.id === sheetCard.id) || sheetCard} onClose={closeSheet}
          onSave={(patch) => doEditCard(sheetCard.id, patch)} onDelete={() => doDeleteCard(sheetCard.id)} />
      )}

      <TweaksPanel>
        <TweakSection label="Cartão de crédito" />
        <TweakRadio label="Layout dos cartões" value={t.creditLayout}
          options={['deck', 'lista', 'carrossel']} onChange={(v) => setTweak('creditLayout', v)} />
        <TweakSelect label="2ª aba do menu" value={t.nav2}
          options={['credito', 'categorias', 'carteiras']} onChange={(v) => setTweak('nav2', v)} />
        <TweakSection label="Carteiras / contas" />
        <TweakRadio label="Cartões na home" value={t.placement}
          options={['inicio', 'aba', 'ambos']} onChange={(v) => setTweak('placement', v)} />
        <TweakRadio label="Interação" value={t.interaction}
          options={['deck', 'carousel']} onChange={(v) => setTweak('interaction', v)} />
        <TweakToggle label="Chip no cartão" value={t.chip} onChange={(v) => setTweak('chip', v)} />
      </TweaksPanel>
    </IOSDevice>
  );
}

function Root() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px 0' }}>
      <App />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
