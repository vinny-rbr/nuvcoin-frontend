/* Mock data + inline SVG icon set for the Importar Extrato prototype */
(function () {
  // ---- Icons (return SVG markup strings; React renders via dangerouslySetInnerHTML) ----
  const I = {
    back: '<path d="M15 18l-6-6 6-6" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18" fill="none" stroke-width="2" stroke-linecap="round"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    cloud: '<path d="M7 18a4 4 0 010-8 5 5 0 019.6-1.6A3.5 3.5 0 0117 18H7z" fill="none" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 13v5M9.5 15.5L12 13l2.5 2.5" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    check: '<path d="M20 6L9 17l-5-5" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    wallet: '<path d="M3 7h15a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" fill="none" stroke-width="1.8"/><path d="M3 7l2.5-3h9L17 7M16 13h2" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    clock: '<circle cx="12" cy="12" r="8.5" fill="none" stroke-width="1.8"/><path d="M12 7.5V12l3 2" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    arrowDown: '<path d="M12 5v14M6 13l6 6 6-6" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    arrowUp: '<path d="M12 19V5M6 11l6-6 6 6" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    warn: '<path d="M12 3l9.5 16.5H2.5L12 3z" fill="none" stroke-width="1.8" stroke-linejoin="round"/><path d="M12 9.5v4M12 16.5h.01" fill="none" stroke-width="1.9" stroke-linecap="round"/>',
    skip: '<path d="M5 5v14M19 5v14M8 12h9M13 8l4 4-4 4" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    refresh: '<path d="M3.5 12a8.5 8.5 0 0114.8-5.7M20.5 12a8.5 8.5 0 01-14.8 5.7" fill="none" stroke-width="1.8" stroke-linecap="round"/><path d="M18 3v3.6h-3.6M6 21v-3.6h3.6" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2" fill="none" stroke-width="1.8"/><path d="M8 10V7a4 4 0 018 0v3" fill="none" stroke-width="1.8"/>',
    home: '<path d="M4 11l8-7 8 7v8a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1v-8z" fill="none" stroke-width="1.8" stroke-linejoin="round"/>',
    tag: '<path d="M3 12V5a2 2 0 012-2h7l9 9-9 9-9-9z" fill="none" stroke-width="1.8" stroke-linejoin="round"/><circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none"/>',
    groups: '<circle cx="9" cy="8" r="3.2" fill="none" stroke-width="1.8"/><path d="M3.5 19a5.5 5.5 0 0111 0M16 6.2a3 3 0 010 5.6M20.5 19a5 5 0 00-3-4.6" fill="none" stroke-width="1.8" stroke-linecap="round"/>',
    plus: '<path d="M12 5v14M5 12h14" fill="none" stroke-linecap="round"/>',
    close: '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke-width="2" stroke-linecap="round"/>',
    camera: '<path d="M4 8a2 2 0 012-2h1.5l1.2-1.8A1 1 0 0110.5 4h3a1 1 0 01.8.4L15.5 6H18a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" fill="none" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.2" fill="none" stroke-width="1.7"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5" fill="none" stroke-width="1.7"/><circle cx="8.5" cy="9.5" r="1.6" fill="none" stroke-width="1.6"/><path d="M5 17l4.5-4.5L13 16l3-3 3 3" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    scan: '<path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2" fill="none" stroke-width="1.8" stroke-linecap="round"/><path d="M4 12h16" fill="none" stroke-width="1.8" stroke-linecap="round"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" fill="none" stroke-width="1.6" stroke-linejoin="round"/>',
    edit: '<path d="M4 20h4L18.5 9.5a2 2 0 00-2.8-2.8L5 17.2 4 20z" fill="none" stroke-width="1.7" stroke-linejoin="round"/>',
    store: '<path d="M4 9l1-4h14l1 4M5 9v10h14V9M4 9h16M9 19v-5h6v5" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke-width="1.7"/><path d="M4 9h16M9 3v4M15 3v4" fill="none" stroke-width="1.7" stroke-linecap="round"/>',
    card: '<rect x="3" y="6" width="18" height="12" rx="2.5" fill="none" stroke-width="1.7"/><path d="M3 10h18M7 15h4" fill="none" stroke-width="1.7" stroke-linecap="round"/>',
    pix: '<path d="M12 4l3 3-3 3-3-3 3-3zM4 12l3-3 3 3-3 3-3-3zM20 12l-3-3-3 3 3 3 3-3zM12 14l3 3-3 3-3-3 3-3z" fill="none" stroke-width="1.5" stroke-linejoin="round"/>',
    cash: '<rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke-width="1.7"/><circle cx="12" cy="12" r="2.6" fill="none" stroke-width="1.7"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M20 20H3" fill="none" stroke-width="1.8" stroke-linecap="round"/>',
    chevR: '<path d="M9 6l6 6-6 6" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    chevD: '<path d="M6 9l6 6 6-6" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  };

  function svg(name, cls) {
    return '<svg viewBox="0 0 24 24" class="' + (cls || '') + '" stroke="currentColor">' + (I[name] || '') + '</svg>';
  }

  // ---- File presets (what "reading" simulates) ----
  const FILE = {
    bank: 'Nubank',
    bankInitial: 'N',
    account: 'Conta corrente • final 4821',
    fileName: 'extrato_06-2026.ofx',
    period: '01 — 05 jun 2026',
  };

  // ---- New transactions found in the file ----
  const NEW_ITEMS = [
    { id: 'n1', type: 'DESPESA', title: 'Aluguel apartamento', cat: 'Moradia', amount: 180000, date: '01 jun' },
    { id: 'n2', type: 'DESPESA', title: 'Mercado Extra', cat: 'Alimentação', amount: 28790, date: '02 jun' },
    { id: 'n3', type: 'RECEITA', title: 'Salário — Folha', cat: 'Salário', amount: 450000, date: '04 jun' },
    { id: 'n4', type: 'DESPESA', title: 'Uber viagem', cat: 'Transporte', amount: 2340, date: '03 jun' },
    { id: 'n5', type: 'DESPESA', title: 'iFood pedido', cat: 'Alimentação', amount: 5490, date: '03 jun' },
    { id: 'n6', type: 'DESPESA', title: 'Netflix assinatura', cat: 'Lazer', amount: 3990, date: '04 jun' },
    { id: 'n7', type: 'DESPESA', title: 'Farmácia São Paulo', cat: 'Saúde', amount: 8630, date: '05 jun' },
    { id: 'n8', type: 'DESPESA', title: 'Posto Shell combustível', cat: 'Transporte', amount: 20000, date: '05 jun' },
  ];

  // ---- Duplicates: same date + amount + similar description already in the app ----
  // app = what's stored today, file = what the extract brings (richer)
  const DUP_ITEMS = [
    {
      id: 'd1', type: 'RECEITA', amount: 125000, date: '02 jun',
      title: 'PIX recebido — João Silva',
      app:  { title: 'Pix recebido', cat: 'Outros',  status: 'pending' },
      file: { title: 'PIX recebido — João Silva', cat: 'Vendas', status: 'paid' },
      changes: ['cat', 'status', 'title'],
    },
    {
      id: 'd2', type: 'DESPESA', amount: 19840, date: '01 jun',
      title: 'Energia CEMIG',
      app:  { title: 'Conta de luz', cat: 'Outros', status: 'pending' },
      file: { title: 'Energia CEMIG', cat: 'Moradia', status: 'paid' },
      changes: ['cat', 'status', 'title'],
    },
    {
      id: 'd3', type: 'DESPESA', amount: 2190, date: '03 jun',
      title: 'Spotify',
      app:  { title: 'Spotify', cat: 'Lazer', status: 'paid' },
      file: { title: 'Spotify Premium', cat: 'Lazer', status: 'paid' },
      changes: [],
    },
    {
      id: 'd4', type: 'DESPESA', amount: 15000, date: '05 jun',
      title: 'Posto Ipiranga',
      app:  { title: 'Posto Ipiranga', cat: 'Transporte', status: 'pending' },
      file: { title: 'Posto Ipiranga combustível', cat: 'Transporte', status: 'paid' },
      changes: ['status'],
    },
  ];

  const READ_STEPS = [
    'Lendo o arquivo OFX…',
    'Identificando o banco…',
    'Extraindo lançamentos…',
    'Comparando com o que já existe…',
  ];

  window.IMPORT_DATA = { FILE, NEW_ITEMS, DUP_ITEMS, READ_STEPS };
  window.IMPORT_ICONS = { svg, raw: I };

  // ---- Photo / receipt capture flow ----
  const RECEIPT = {
    image: 'receipt.png',
    type: 'DESPESA',
    store: 'A R Filho e Cia',
    fullStore: 'A R FILHO E CIA LTDA',
    title: 'A R Filho e Cia',
    amount: 1503,            // R$ 15,03
    date: '05 jun 2026',
    time: '11:48',
    payment: 'debit',        // Cartão Débito
    cat: 'Alimentação',
    cnpj: '04.842.563/0305-01',
    fields: [
      { key: 'store',   label: 'Estabelecimento', value: 'A R Filho e Cia', conf: 'alta' },
      { key: 'amount',  label: 'Valor',           value: 'R$ 15,03',        conf: 'alta' },
      { key: 'date',    label: 'Data',            value: '05/06/2026 11:48', conf: 'alta' },
      { key: 'payment', label: 'Pagamento',       value: 'Cartão Débito',   conf: 'média' },
    ],
  };

  const PHOTO_STEPS = [
    'Enviando a imagem…',
    'Lendo o comprovante…',
    'Identificando valor e data…',
    'Sugerindo categoria…',
  ];

  const PAYMENTS = [
    { key: 'pix',    label: 'Pix',      icon: 'pix' },
    { key: 'debit',  label: 'Débito',   icon: 'card' },
    { key: 'credit', label: 'Crédito',  icon: 'card' },
    { key: 'cash',   label: 'Dinheiro', icon: 'cash' },
  ];

  const CATEGORIES = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Educação', 'Vendas', 'Salário', 'Outros'];

  // Hierarchical category tree — mirrors the normal launch picker (Nível 1 → subcategorias)
  const CATEGORY_TREE = [
    { name: 'PESSOA FISICA', children: [
      { name: 'CASA', children: [
        { name: 'ÁGUA' }, { name: 'ALUGUEL' }, { name: 'ENERGIA' }, { name: 'INTERNET' },
      ] },
      { name: 'ROUPAS', children: [
        { name: 'CALÇA' }, { name: 'CAMISAS' }, { name: 'SANDÁLIA' }, { name: 'SHORTS' },
      ] },
      { name: 'ALIMENTAÇÃO', children: [
        { name: 'MERCADO' }, { name: 'RESTAURANTE' }, { name: 'LANCHE' },
      ] },
      { name: 'INVESTIMENTOS' },
      { name: 'RAÍZES TECNOLOGIA' },
      { name: 'Outros' },
    ] },
    { name: 'PESSOA JURÍDICA', children: [
      { name: 'Comissão', children: [ { name: 'Lucas' } ] },
      { name: 'Fornecedores' },
    ] },
    { name: 'Roupa', children: [
      { name: 'Camisa' }, { name: 'Short' },
    ] },
  ];

  window.IMPORT_DATA.RECEIPT = RECEIPT;
  window.IMPORT_DATA.PHOTO_STEPS = PHOTO_STEPS;
  window.IMPORT_DATA.PAYMENTS = PAYMENTS;
  window.IMPORT_DATA.CATEGORIES = CATEGORIES;
  window.IMPORT_DATA.CATEGORY_TREE = CATEGORY_TREE;
})();
