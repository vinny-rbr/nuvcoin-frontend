# Handoff: Tela de GRUPOS — Conciliaaí

## Visão geral
Redesign **focado na tela de Grupos** do app Conciliaaí / NuvCoin (`nuvcoin-frontend`, **React + TypeScript + Vite**). É a funcionalidade de **contas compartilhadas**: o usuário cria grupos (ex: "Apê 302", "Viagem Chile", "República"), adiciona membros e divide despesas de forma justa — por salário, igualmente ou por percentual. Arquivo do repo a estilizar: **`src/pages/Groups.tsx`** (donut já usa **Chart.js**).

## Sobre os arquivos deste pacote
`prototipo/Conciliaai-App-Redesign.html` é uma **referência de design** (HTML/CSS/JS puro). **Não é para copiar e colar** — recrie no ambiente React já existente do projeto, com seus padrões e bibliotecas. Abra no navegador, clique em **Grupos**, troque de grupo na lane e abra os modais para ver o comportamento.

## Fidelidade
**Alta fidelidade (hi-fi).** Cores, tipografia, espaçamento e interações estão definidos abaixo. Dados (Ana, "Apê 302", salários) são fictícios — use os dados reais da API.

---

## Design Tokens (necessários nesta tela)
```css
:root{
  --bg-deep:#0A0F1E; --bg-main:#0F172A; --bg-card:#1E293B;
  --primary:#3B82F6; --primary-2:#2563EB; --primary-lt:#60A5FA;
  --success:#22C55E; --success-lt:#4ADE80; --danger:#EF4444; --danger-lt:#F87171;
  --text-main:#F1F5F9; --text-2:#94A3B8; --text-3:#64748B;
  --violet:#A78BFA; --orange:#F97316; --teal:#14B8A6; --yellow:#EAB308; --pink:#F472B6;

  --card:rgba(30,41,59,.55); --card-solid:#18233B;
  --stroke:rgba(148,163,184,.13); --stroke-soft:rgba(148,163,184,.09);
  --grad-primary:linear-gradient(135deg,#60A5FA 0%,#2563EB 100%);
  --grad-success:linear-gradient(135deg,#4ADE80 0%,#16A34A 100%);
  --shadow-card:0 18px 48px rgba(2,6,23,.45);
  --shadow-pop:0 28px 80px rgba(2,6,23,.6);
  --glow-blue:0 0 0 1px rgba(96,165,250,.22), 0 18px 50px rgba(37,99,235,.28);
  --r-md:16px; --r-lg:22px;
  --ease:cubic-bezier(0.16,1,0.3,1);
}
```
- **Avatares de membros** — paleta cíclica por nome: `["#3B82F6","#22C55E","#A78BFA","#F97316","#F472B6","#14B8A6"]`.

### Tipografia
- **Display/números**: `"Space Grotesk"` (600/700) — títulos, valores monetários, percentuais. `letter-spacing:-.5px`, números tabulares (`font-feature-settings:"tnum" 1`).
- **UI/texto**: `"Manrope"` (400–800).
- Valores em **R$** sempre formatados pt-BR: `R$ 4.280,00` (use `toLocaleString("pt-BR",{minimumFractionDigits:2})`).

---

## Estrutura da tela (de cima para baixo)

### 1. Cabeçalho (card com gradiente azul)
- Fundo: `linear-gradient(135deg, rgba(59,130,246,.14), rgba(15,23,42,.55))`, borda `rgba(96,165,250,.2)`, raio `--r-lg`.
- Kicker "CONTAS COMPARTILHADAS" + título **"Grupos"** (Space Grotesk, ~26px) + subtítulo: "Divida aluguel, viagens e contas da casa de forma justa — por salário, igual ou percentual."
- À direita, 3 botões: **+ Criar grupo** (primário azul), **Membros** (ghost), **Base de divisão** (ghost). Em mobile, quebram para baixo (`flex-wrap`).

### 2. Lane de grupos (scroll horizontal)
- Card "Seus grupos" com subtítulo "Selecione para ver os detalhes".
- **Cards de grupo** lado a lado (`width:210px`, `overflow-x:auto`):
  - Emoji em quadrado com gradiente (🏠 ✈️ 🎓), nome (`15px/800`), meta "`N` pessoas • `R$ total`".
  - **Pilha de avatares** (sobrepostos -7px, borda na cor do card-solid) com a inicial de cada membro.
  - **Card ativo**: borda azul `rgba(96,165,250,.5)`, fundo em gradiente azul translúcido, `--glow-blue`, e o emoji cresce levemente (`scale(1.05)`).
  - Hover: sobe 3px.
- Último card **tracejado "Novo grupo"** com ícone +.
- Clicar num card seleciona o grupo e **recarrega o painel abaixo** com animação de entrada (slide-up `.45s`).

### 3. Card de convite
- Card azul ("Entrar em grupo" / "Recebeu um convite?") com input de código + botão "Entrar no grupo". Ao confirmar → toast "Convite aceito! Grupo liberado.".

### 4. Painel do grupo selecionado (recarrega ao trocar de grupo)
Composto por:

**4a. Métricas (4 cards)** — grid 4 colunas (desktop) / 2 colunas (mobile):
- **Total do mês** (soma das despesas), **Pessoas** (nº de membros), **Média por pessoa** (total ÷ nº membros), **Maior parte** (% do membro com maior participação + nome).
- Cada card: label `12px/800` em `--text-2`, valor grande em Space Grotesk `22px/700`, legenda `11.5px` em `--text-3`.

**4b. Divisão do mês** (card, grid `auto 1fr`):
- **Donut** (Chart.js) à esquerda, `~170px`, anel grosso, centro com "Total" + valor. Segmentos = participação % de cada membro, nas cores de avatar.
- À direita, **lista de membros** — cada linha:
  - Avatar quadrado (cor do membro, inicial).
  - Nome (`14px/800`) + papel ("Você · admin", "Membro", "Convidado").
  - **Barra de proporção** (`height:7px`, preenchida em % conforme o share, na cor do membro), animando a largura em `1s`.
  - À direita: valor `R$` (`16px/700`) = `total × share%`, e o `%` abaixo.
- Botão "Ajustar" (ghost) abre o modal **Base de divisão**.

**4c. Histórico** (card):
- Título "Histórico" / "Despesas lançadas" + botão **+** (abre modal de lançar despesa).
- Lista de despesas (mais recentes primeiro): ícone emoji (cor do pagador), descrição, "Pago por `Nome` • `data`", valor em Space Grotesk à direita.

**4d. Membros de `<grupo>`** (card):
- Título + "Quem participa e a base salarial usada na divisão" + botão **+ Adicionar**.
- Lista: avatar + nome + papel + **base salarial** (`R$`, em cinza) à direita.

---

## Modais (overlay escuro com blur; sobe de baixo no mobile, centraliza ≥560px)

1. **Criar grupo** — campo "Nome do grupo" + seleção de emoji (chips: 🏠 ✈️ 🎓 🍔 🎉 🚗) → botão "Criar grupo" → toast "Grupo criado com sucesso!".
2. **Adicionar membro** — campos e-mail + nome de exibição + bloco com **código copiável** (ex: `4 8 2 1`, botão Copiar) → "Enviar convite" → toast.
3. **Base de divisão** — **segmented control**: `Por salário` / `Igual` / `Percentual`. Abaixo, para cada membro: avatar + nome + input editável (salário/valor). Botão "Salvar divisão" → toast "Divisão atualizada!". Trocar a base recalcula os percentuais de cada membro.
4. **Lançar despesa do grupo** — descrição + valor + data + "Pago por" (select de membros). "Será dividida automaticamente entre os membros." → "Lançar despesa" → toast "Despesa dividida entre o grupo!".

Todos fecham no **X** ou clicando no overlay.

---

## Lógica de divisão (recriar fielmente)
- `share%` de cada membro depende da **base** escolhida:
  - **Por salário**: `share_i = salário_i / Σ salários` (× 100).
  - **Igual**: `share_i = 100 / nº membros`.
  - **Percentual**: valores definidos manualmente (devem somar 100%).
- **Valor a pagar** por membro = `totalDoMês × share_i / 100`.
- **Média por pessoa** (card de métrica) = `total / nºMembros` (divisão simples, independente da base).
- "Maior parte" = membro com maior `share`.

## Estado (sugestão)
- `groups` (lista vinda da API), `selectedGroupId`, `members[selectedGroupId]`, `expenses[selectedGroupId]`, `splitBase` ('salario' | 'igual' | 'percentual'), flags de modal aberto, formulários.
- Ao trocar `selectedGroupId`, recarregar membros/despesas e re-renderizar o painel com animação de entrada.

## Animações
- Entrada de painel/cartões: `translateY(18px) → 0`, `.45–.55s var(--ease)`, com `animation-delay` incremental (~`.06s`) nos cards de métrica.
- Donut: animação nativa do Chart.js (ou `stroke-dasharray` se for SVG).
- Barras de proporção dos membros: largura anima em `1s`.
- **Estado final deve ser a base do CSS** (não deixe `opacity:0` permanente); respeite `prefers-reduced-motion`.

## Responsividade
- **Desktop**: painel em **grid 2 colunas** (Divisão | Histórico); métricas em 4 colunas.
- **Mobile (≤760px)**: tudo **empilhado**; métricas em 2 colunas; lane de grupos com **scroll horizontal**; donut e lista de membros um sobre o outro.

## Assets
- Fontes: Google Fonts — `Manrope` + `Space Grotesk`.
- Ícones: SVG inline (users, plus, scale/balance, arrow-right, check) — pode usar `lucide-react`.
- Emojis para grupos/categorias e pagadores. Sem imagens externas.

## Arquivos de referência
- `prototipo/Conciliaai-App-Redesign.html` → menu **Grupos**.
- `PROMPT-PARA-CLAUDE-CODE.md` → mensagem inicial pronta.
