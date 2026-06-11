# Handoff: Carteiras / Múltiplas Contas Bancárias — Conciliaaí

## Visão geral
Nova funcionalidade para o app de finanças **Conciliaaí**: permitir que o usuário cadastre **vários bancos/contas** (Nubank, Banco do Brasil, Itaú, PicPay, Inter, C6, Caixa, Santander), veja um **saldo consolidado** ("Saldo em contas") somando todas, e visualize seus **cartões empilhados estilo Google Wallet** logo abaixo. Ao tocar num cartão, abre o **detalhe daquela conta** com saldo, gráfico do mês e apenas as receitas/despesas daquela conta. A importação de extrato **OFX** reconhece automaticamente o banco e joga os lançamentos na conta certa.

Inclui ainda: **transferência entre contas próprias**, **editar/excluir banco**, e as telas **Grupos**, **Categorias** e **Perfil**.

## Sobre os arquivos deste bundle
Os arquivos `.html`/`.jsx` aqui são **referências de design feitas em HTML + React (Babel no browser)** — protótipos que mostram o visual e o comportamento pretendidos, **não código de produção pra copiar e colar**. A tarefa é **recriar estes designs no ambiente do codebase de destino** (o `nuvcoin-frontend` é React + TypeScript + Vite), usando os padrões, componentes e estilos que já existem lá (ex.: as classes em `src/index.css`, `src/styles/redesign.css`, `src/components/layout.css`, e os serviços em `src/lib/`).

Importante: o protótipo foi renderizado dentro de um **mock de iPhone** só para demonstração. No app real, isto é uma **PWA mobile** — ignore a moldura do aparelho; o que importa é o conteúdo das telas.

## Fidelidade
**Alta fidelidade (hifi).** Cores, tipografia, espaçamentos e interações estão finais e devem ser reproduzidos fielmente, reaproveitando os tokens/estilos já existentes no `nuvcoin-frontend`. Onde o protótipo usa um valor literal, ele bate com os tokens do app (abaixo).

---

## Design tokens (já existem no app, em `src/index.css`)
Use os tokens do app — **não invente cores novas**.

| Token | Valor | Uso |
|---|---|---|
| `--bg-deep` | `#0A0F1E` | fundo mais escuro / telas full |
| `--bg-main` | `#0F172A` | fundo |
| `--bg-card` | `#1E293B` | cartões/inputs |
| `--bg-card-solid` | `#18233B` | sheets sólidos |
| `--primary` | `#3B82F6` | azul primário |
| `--primary-2` | `#2563EB` | azul escuro (gradiente) |
| `--primary-lt` | `#60A5FA` | azul claro / ativo |
| `--success` / `--success-lt` | `#22C55E` / `#4ADE80` | receitas / positivo |
| `--danger` / `--danger-lt` | `#EF4444` / `#F87171` | despesas / negativo |
| `--text-main` | `#F1F5F9` | texto principal |
| `--text-secondary` / `--text-2` | `#94A3B8` | texto secundário |
| `--text-3` | `#64748B` | texto terciário/labels |
| `--violet` | `#A78BFA` | importação / grupos (acento roxo) |
| `--teal` | `#14B8A6` (usei `#2DD4BF`) | transferência (acento) |
| `--stroke` | `rgba(148,163,184,0.13)` | bordas |
| `--grad-primary` | `linear-gradient(135deg,#60A5FA,#2563EB)` | botões primários, FAB |
| `--shadow-card` | `0 18px 48px rgba(2,6,23,0.45)` | sombra de card |
| `--font` | `"Manrope", system-ui` | corpo (400–900) |
| `--display` | `"Space Grotesk", "Manrope"` | títulos e **valores em R$** |
| `--ease` | `cubic-bezier(0.16, 1, 0.3, 1)` | easing padrão |

**Raios:** cards `20–22px`, sheets `26px 26px 0 0`, botões `13–16px`, pílulas/chips `999px`, ícone-badge `10–13px`.
**Tipografia:** valores monetários sempre em **Space Grotesk 700**, `letter-spacing: -0.02em`. Títulos de tela em Space Grotesk 700. Corpo/labels em Manrope 600–900.

### Registro dos bancos (visual de cada cartão)
Cada banco tem: `name`, `face` (gradiente do cartão), `glow` (cor da sombra), `Logo` (wordmark), `Network` (bandeira), `tier` (texto pequeno no topo direito).

| id | name | face (gradiente 135°) | bandeira | tier |
|---|---|---|---|---|
| `nubank` | Nubank | `#9F37E8 → #820AD1 → #6A02B0` | Mastercard | Ultravioleta |
| `bb` | Banco do Brasil | `#0A47B8 → #0533A0 → #04246E` | Elo | Ourocard |
| `itau` | Itaú | `#FF8A1E → #EC7000 → #C85400` | Mastercard | Personnalité |
| `picpay` | PicPay | `#20242B → #0C0E12` | Mastercard | Conta |
| `inter` | Inter | `#FF9D4D → #FF7A00 → #E86A00` | Mastercard | Black |
| `c6` | C6 Bank | `#2C2C2E → #161618 → #0A0A0B` | Mastercard | Carbon |
| `caixa` | Caixa | `#2A7FD4 → #1565B0 → #0E4A85` | Elo | Ourocard |
| `santander` | Santander | `#F33 → #EC0000 → #B30000` | Visa | Unique |

Wordmarks são aproximações em CSS/texto (Nubank = "nu" minúsculo bold; PicPay = "Pic" branco + "Pay" verde `#21C25E`; BB = quadrado amarelo `#FAE128` com "BB" azul; Itaú = quadrado azul `#003399` com "i" amarelo + "itaú"). **No app real, prefira os logos oficiais/SVG dos bancos se disponíveis.**

**Card layout (proporção cartão de crédito 1.6:1):** topo = logo (esq.) + tier (dir.); base = chip dourado opcional + `•••• {últimos 4}` (esq.) + bandeira (dir.). Brilho diagonal por cima (`linear-gradient(115deg, rgba(255,255,255,0.14), transparent 32%, ... rgba(0,0,0,0.18))`). Sombra colorida usando o `glow` do banco.

---

## Modelo de dados

```ts
type Account = {
  id: string;
  brand: 'nubank'|'bb'|'itau'|'picpay'|'inter'|'c6'|'caixa'|'santander';
  nick: string;            // apelido ("Nubank principal")
  type: 'Conta corrente'|'Poupança'|'Cartão de crédito';
  last4: string;           // "5887"
  balance: number;         // em CENTAVOS
  face?: string;           // override de cor (gradiente) — se o usuário escolheu cor custom
  glow?: string;           // sombra custom (opcional)
};

type Tx = {
  t: string;               // título ("iFood")
  cat: string;             // categoria ("Alimentação")
  d: string;               // data exibida ("08 jun")
  cents: number;           // POSITIVO = receita, NEGATIVO = despesa
  type: 'in'|'out';
  transfer?: boolean;      // true se veio de transferência entre contas
};
```
Transações ficam num mapa `txByAccountId: Record<string, Tx[]>`.

**Regras importantes:**
- `Saldo em contas` (hero) = **soma de `balance` de todas as contas**.
- No detalhe da conta, Receitas = soma dos `cents > 0`; Despesas = soma dos `|cents| < 0`.
- **Valores sempre em centavos** internamente; formatar com `Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 })` e prefixo `R$`.

---

## Telas / Views

### 1. Início (Home)
- **Topbar** (fixa): logo quadrado com gradiente primário + "Conciliaaí" (Space Grotesk 800) / "FINANÇAS" (Manrope 800, 9.5px, tracking 0.16em); à direita pílula verde "● Vitalício".
- **Hero "Saldo em contas"**: card gradiente azul (`radial 18% 0% rgba(59,130,246,0.45) + linear 135° #2f6df0→#2152c9→#1b3fa0`), raio 22, borda `rgba(96,165,250,0.28)`. Conteúdo: label "Saldo em contas" + pílula "‹ Junho 2026 ›"; valor grande (Space Grotesk 700, 40px); "somando N contas"; dois mini-cards translúcidos lado a lado: **Receitas** (ícone seta-cima verde) e **Despesas** (ícone seta-baixo vermelho), valores em R$.
- **Seção "Meus cartões"** (a parte nova — ver "Deck de cartões" abaixo): título + link "Gerenciar ›".
- **Análise do mês**: grid 2×2 de mini-stats (Receitas, Despesas, Crédito, Saldo livre) — cards `rgba(30,41,59,0.55)`, raio 18, valor colorido por tom.
- **Bottom nav curva** (fixa): Início, Categorias, Grupos, Perfil + **FAB azul "+"** central elevado (`translateY(-22px)`, gradiente primário, sombra forte).

> **Posicionamento configurável (Tweak `placement`):** os cartões podem ficar (a) só no **Início** abaixo do saldo, (b) numa **aba "Carteiras"** dedicada, ou (c) **ambos**. No modo aba, a bottom nav troca "Categorias" por "Carteiras" (ícone wallet). Padrão recomendado: **Início**.

### 2. Deck de cartões (componente central — "estilo Google Wallet")
Aparece como **um cartão compacto** com os outros espiando atrás. Dois modos (Tweak `interaction`), **Empilhado é o padrão**:

**Empilhado (CardDeck):**
- O cartão da frente (índice ativo) aparece **inteiro embaixo**; os de trás ficam **acima, levemente menores e mais escuros** (peek ~15px cada, máx 3 atrás): `translateY((maxBehind-depth)*15) scale(1-depth*0.05)`, `opacity 1-depth*0.14`, `zIndex n-depth`.
- **Deslizar pro lado (swipe horizontal)** troca qual cartão fica na frente — cicla o índice ativo. Detectar via pointer/touch: `dx < -42` → próximo; `dx > 42` → anterior.
- **Tocar no cartão da frente** → abre o **detalhe da conta**. Tocar num cartão de trás → traz ele pra frente. Tocar nos **dots** também navega.
- **"Expandir cartões"** → leque vertical (cada cartão em `translateY(depth*(altura+16))`), `scale 1`. Botão vira "Recolher".
- **Vibração háptica** a cada troca de cartão: `navigator.vibrate(12)` (e `8` ao expandir). Só funciona em Android; no iOS é ignorado silenciosamente.
- Controles abaixo: **dots** (ativo vira pílula 22px azul), botões "Expandir cartões" e "+ Novo banco", e a legenda "Deslize pra trocar · toque pra abrir a conta".
- Transições: `transform 0.5s cubic-bezier(0.16,1,0.3,1)`, altura `0.45s`.

**Carrossel (CardCarousel):** scroll horizontal com `scroll-snap`, cada cartão largura cheia + um card "Adicionar banco" tracejado no fim; dots embaixo; vibra ao mudar o snap.

### 3. Detalhe da conta (full screen, entra deslizando da direita)
- Topo com gradiente do `glow` da marca. Linha: botão **"‹ Contas"** (volta) e botão **"Editar"** (abre sheet de edição).
- **Cartão grande** centralizado (w≈254).
- "{apelido} · {tipo}" + **saldo** grande (Space Grotesk 700, 34px).
- Dois cards: **Receitas** (verde) e **Despesas** (vermelho) — somatórios **apenas desta conta**.
- Dois botões de ação: **Transferir** (abre sheet de transferência com esta conta pré-selecionada) e **Importar OFX**.
- **Gráfico "Movimento de junho"**: card com 4 barras semanais (S1–S4), cada uma com uma barra verde (entradas) e uma vermelha (saídas), altura proporcional ao máximo. Legenda Entr./Saíd.
- **Movimentações**: header + botão **"Conciliar"** (vira "✓ Conciliado" verde ao tocar). **Chips de filtro por categoria** (scroll horizontal: "Tudo" + categorias da conta). Lista de transações (ícone seta colorida, título, "categoria · data", valor com sinal). Empty state quando filtro não tem itens.

### 4. Cadastrar banco (bottom sheet — FLUXO DE 3 ETAPAS) ⚠️ crítico
Sheet que sobe de baixo (raio 26 no topo, handle cinza). **Tem 3 passos (`step`): `bank` → `form` → `done`.**

**Passo 1 — `bank` (escolher instituição):**
- Título "Adicionar banco" + sub "Escolha a instituição. Você pode cadastrar quantos bancos quiser."
- **Grid 2 colunas** com os 8 bancos: cada item = quadradinho com o `face` do banco + logo + nome. Tocar seleciona o banco e vai pro passo `form` (já preenche o apelido com o nome do banco).

**Passo 2 — `form` (configurar a conta):**
- Header: botão voltar (‹) + nome do banco + "Como você quer chamar essa conta?"
- **Prévia ao vivo** do cartão (atualiza com apelido e cor escolhidos).
- Campo **Apelido da conta** (input texto, placeholder "Ex: Nubank principal").
- **Tipo de conta** — 3 botões segmentados: "Conta corrente" | "Poupança" | "Cartão de crédito" (ativo = azul).
- **Cor do cartão** — swatches: "Da marca" (swatch cônico multicolor) + Violeta + Azul + Verde + Grafite. Se escolher uma cor, ela vira o `face` da conta; "Da marca" usa o gradiente padrão do banco.
- Botão **"Salvar conta"** → vai pro passo `done`.

**Passo 3 — `done` (sucesso):**
- Ícone de check verde animado, "Conta adicionada!", sub "{apelido} agora aparece no seu saldo em contas e na sua carteira." Botão **"Concluir"** → fecha e **adiciona a conta ao estado** (`addAccount`): cria id, `balance: 0`, `last4` aleatório (ou pedir ao usuário), `face` se cor custom.

> Campos que coletamos no cadastro: **Banco (da lista), Apelido, Tipo, Cor**. (Saldo inicial e últimos 4 dígitos podem ser adicionados — no protótipo o saldo começa em 0 e os 4 dígitos são gerados.)

### 5. Importar extrato OFX (bottom sheet — FLUXO COM RECONHECIMENTO) ⚠️ crítico
**Passos: `pick` → (`detected` | `unknown`) → `review` → `done`.**

**Passo 1 — `pick`:** título "Importar extrato" + dropzone tracejada roxa ("arraste aqui ou escolha um arquivo") + lista de arquivos de exemplo:
- `Nubank_062026.ofx` (OFX · 23 lançamentos) → caminho **reconhecido**.
- `extrato_05-2026.ofx` (banco genérico) → caminho **não reconhecido**.

**Passo 2a — `detected` (banco reconhecido):** banner **verde** "DETECTAMOS / Nubank" com o cartão do banco + "✓ 23 itens". Abaixo, **seletor de conta destino** (lista de contas; a conta do banco detectado recebe selo "SUGERIDA" e já vem marcada). Botão **"Revisar lançamentos"**.
- *No código real:* o banco vem do OFX. O parser (`src/lib/ofxImport.ts`) lê os blocos `<STMTTRN>`; para detectar a instituição, leia os campos **`<BANKID>` / `<ORG>` / `<FID>`** do cabeçalho `<SONR
>/<FI>` ou `<BANKACCTFROM>` e faça match com a lista de bancos cadastrados (ou com o `ACCTID` da conta). Esse mapeamento banco→conta é o que falta hoje.

**Passo 2b — `unknown` (banco NÃO reconhecido):** título "Banco não reconhecido" + aviso amarelo "23 lançamentos lidos, mas sem banco identificado." Seletor de conta destino (sem sugestão) + botão **"+ Criar nova conta pra esse banco"** + botão "Continuar". Ambos seguem pro `review`.

**Passo 3 — `review` (revisão antes de confirmar):** header "Revisar lançamentos" + "{N} de 23 entram em {conta} · {D} duplicado(s)". Lista de itens, cada um com:
- ícone seta (verde/vermelho), título, **chip de categoria editável** (tocar cicla entre categorias sugeridas), e selo **"DUPLICADO?"** amarelo nos suspeitos.
- valor com sinal + **checkbox "Importar / Ignorado"** (itens duplicados já vêm desmarcados/ignorados).
- Botão **"Importar {N} lançamentos"** → aplica só os não-ignorados (`importTx`: faz `unshift` na conta e ajusta `balance += soma`), vai pro `done`.

**Passo 4 — `done`:** "{N} lançamentos importados!" na conta escolhida.

### 6. Editar / remover banco (bottom sheet)
Aberto pelo botão "Editar" no detalhe. Prévia do cartão + campos **Apelido**, **Tipo**, **Cor** (com swatch extra "Atual" mantendo a cor vigente). Botão **"Salvar alterações"** (`updateAccount`). Abaixo, **"Excluir conta"** (vermelho) → expande confirmação inline ("Excluir {conta} e todos os seus lançamentos?" com Cancelar / Excluir). Excluir = `removeAccount` (remove conta + transações) e fecha o detalhe.

### 7. Transferência entre contas (bottom sheet)
Aberto pelo FAB (menu "+") ou pelo botão "Transferir" no detalhe. Campos: **De** (chips de contas roláveis), seta pra baixo, **Para** (chips, exclui a conta "De"), **Valor** (input numérico grande com prefixo R$, máscara em centavos). Mostra "Saldo em {conta}: R$ X" e avisa "saldo insuficiente". Botão **"Transferir R$ X"** (desabilitado se inválido) → `addTransfer(from, to, cents)`: debita um, credita o outro, e cria **2 transações** (`type:'out'` na origem, `type:'in'` no destino, ambas `transfer:true`, categoria "Transferências"). **Não conta como receita nem despesa** nos totais do mês. Tela de sucesso ao final.

### 8. Grupos
Header "GRUPOS / Despesas divididas". Cards de grupo: emoji, nome, "N pessoas · total R$", **avatares empilhados** dos membros (iniciais), e badge de status: "Te devem R$ X" (verde), "Você deve R$ X" (vermelho) ou "Tudo quitado" (cinza). Botão "+ Criar novo grupo".

### 9. Categorias
Header "CATEGORIAS / Suas categorias". **Tabs** "Despesas" | "Receitas" (segmentado). Lista: emoji em badge colorido, nome, "N lançamentos", valor (vermelho p/ despesa, verde p/ receita). Botão "+ Nova categoria".

### 10. Perfil
Avatar grande + "Você" + pílula "● Plano Vitalício". Dois mini-cards: **Patrimônio** (= saldo total) e **Contas** (= nº de bancos). Lista de ajustes (Minha conta, Bancos e cartões, Categorias, Notificações, Exportar dados). Botão "Sair da conta" + versão.

---

## Interações & comportamento
- **Navegação**: estado `tab` ('home'|'carteiras'|'categorias'|'grupos'|'perfil'); `detail` (conta aberta, overlay full-screen); `sheet` ('cadastro'|'ofx'|'edit'|'transfer'|'fab'|null).
- **Sheets**: backdrop `rgba(3,6,18,0.66)` + blur; sobem com `translateY(40px)→0` em `0.4s var(--ease)`; fecham tocando fora.
- **Detalhe**: entra com `translateX(28px)+fade` `0.34s`.
- **FAB "+"** abre menu (QuickAdd): Novo banco, Importar extrato, Transferência, Nova receita, Nova despesa.
- **Háptico**: `navigator.vibrate(12)` ao trocar de cartão (Android).
- **Reduced motion**: respeitar `prefers-reduced-motion`.
- **Hit targets** ≥ 44px.

## Gerenciamento de estado
Estado mutável necessário (no app real, use o padrão do codebase — provavelmente os serviços em `src/lib/financeService.ts` / `financeStorage.ts` + persistência via API):
- `accounts: Account[]`, `txByAccountId: Record<string, Tx[]>`
- Ações: `addAccount`, `updateAccount(id, patch)`, `removeAccount(id)`, `addTransfer(from, to, cents)`, `importTx(accountId, items)`
- Derivados: saldo total (soma), receitas/despesas por conta, agregados do gráfico.
- Persistir igual ao resto do app (hoje há `financeStorage.ts` + API em `src/lib/api.ts`).

## Integração com o que já existe no codebase
- O parser OFX/CSV/XLSX/PDF já existe em **`src/lib/ofxImport.ts`** (`parseBankFile`, `parseOfx`, `toFinanceItem`). **Falta**: (1) extrair o identificador do banco do OFX e (2) associar os itens a uma `Account`. Adicione um campo `accountId` ao `FinanceItem` e ao fluxo de import.
- Estilos/Classes prontas: `.card`, `.button-primary`/`.finance-primary-button`, `.dashboard-hero-panel`, `.chip`, `.categories-composer-sheet` (bottom sheet), `.finance-row`, `.mobile-bottom-nav` (nav curva). Reaproveite.
- Tipos de pagamento e categorias já existem (`PaymentType`, `financeCategoriesService.ts`).

## Assets
- **Logos dos bancos**: aproximações em CSS/texto no protótipo. No app, usar SVGs oficiais quando possível.
- **Ícones**: conjunto inline estilo Lucide (home, tag, users, user, wallet, plus, up, down, eye, chevrons, upload, check, bank, card, sparkle). O app pode usar a lib de ícones que já utiliza.
- **Fontes**: Manrope + Space Grotesk (Google Fonts) — já importadas no app.
- Sem imagens externas.

## Arquivos deste bundle (referência de design)
- `Carteiras Conciliaaí.html` — entrada; carrega React/Babel + os módulos abaixo.
- `cc-data.jsx` — registro dos bancos, modelo de dados, store mutável (`CC`), `BankCard`, `fmtBRL`, logos e bandeiras.
- `cc-cards.jsx` — `CardDeck` (empilhado + swipe + háptico), `CardCarousel`, `WalletSection`.
- `cc-ui.jsx` — `Icon`, `TopBar`, `BottomNav`, `Hero` (Saldo em contas), `TxRow`, etc.
- `cc-screens.jsx` — `HomeScreen`, `CarteirasScreen`, `AccountDetail` (gráfico, filtro, conciliar).
- `cc-sheets.jsx` — `CadastroSheet` (3 etapas), `OfxSheet` (pick/detected/unknown/review/done), `EditSheet`, `TransferSheet`, `QuickAddMenu`.
- `cc-extra.jsx` — `GruposScreen`, `CategoriasScreen`, `PerfilScreen`.
- `ios-frame.jsx`, `tweaks-panel.jsx` — apenas andaime de demonstração (moldura do aparelho e painel de ajustes). **Não fazem parte do app**; ignore na implementação.

> Abra o `Carteiras Conciliaaí.html` num navegador pra ver e clicar em tudo antes de implementar.
