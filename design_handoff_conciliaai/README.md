# Handoff: Conciliaaí — Redesign Premium do App

## Visão geral
Redesign visual completo do app de finanças **Conciliaaí / NuvCoin** (repositório `nuvcoin-frontend`, stack **React + TypeScript + Vite**). O objetivo é elevar o nível visual de todas as telas — do cadastro/entrada até a tela de Grupos — mantendo **exatamente a paleta de cores atual** (dark slate + azul/verde/vermelho) e adicionando animações de entrada sutis e elegantes.

## Sobre os arquivos deste pacote
O arquivo `prototipo/Conciliaai-App-Redesign.html` é uma **referência de design feita em HTML/CSS/JS puro** — um protótipo navegável que mostra a aparência e o comportamento desejados. **Não é código de produção para copiar e colar.** A tarefa é **recriar este design no ambiente já existente do projeto** (React + TypeScript + Vite, com `react-router-dom` e a biblioteca de gráficos que já está no repo — Recharts no Dashboard e Chart.js em Groups), seguindo os padrões do código atual.

Para ver o alvo: abra o `.html` em qualquer navegador. Na barra superior há um alternador **Desktop / Mobile** e um botão **Reiniciar fluxo**. Todo o fluxo é clicável.

## Fidelidade
**Alta fidelidade (hi-fi).** Cores, tipografia, espaçamentos e interações estão definidos. Recrie a UI fielmente usando os componentes/estilos do próprio codebase. Os números e nomes (Ana, "Apê 302", etc.) são fictícios — substitua pelos dados reais vindos da API.

---

## Design Tokens

### Cores (mantidas do app original + acentos já usados nos gráficos)
```css
:root{
  /* Base — mesma paleta do app atual */
  --bg-deep:    #0A0F1E;  /* fundo mais escuro */
  --bg-main:    #0F172A;  /* fundo principal (slate-900) */
  --bg-card:    #1E293B;  /* superfície de card (slate-800) */
  --primary:    #3B82F6;  /* azul */
  --primary-2:  #2563EB;
  --primary-lt: #60A5FA;
  --success:    #22C55E;  /* verde */
  --success-lt: #4ADE80;
  --danger:     #EF4444;  /* vermelho */
  --danger-lt:  #F87171;
  --text-main:  #F1F5F9;  /* texto principal */
  --text-2:     #94A3B8;  /* texto secundário */
  --text-3:     #64748B;  /* texto terciário */

  /* Acentos (categorias / gráficos) */
  --violet: #A78BFA;
  --orange: #F97316;
  --teal:   #14B8A6;
  --yellow: #EAB308;
  --pink:   #F472B6;

  /* Superfícies translúcidas */
  --card:        rgba(30, 41, 59, 0.55);
  --card-solid:  #18233B;
  --stroke:      rgba(148, 163, 184, 0.13);
  --stroke-soft: rgba(148, 163, 184, 0.09);

  /* Gradientes / sombras */
  --grad-primary: linear-gradient(135deg, #60A5FA 0%, #2563EB 100%);
  --grad-success: linear-gradient(135deg, #4ADE80 0%, #16A34A 100%);
  --grad-aurora:  linear-gradient(120deg, #60A5FA, #22C55E, #A78BFA);
  --shadow-card:  0 18px 48px rgba(2, 6, 23, 0.45);
  --shadow-pop:   0 28px 80px rgba(2, 6, 23, 0.6);
  --glow-blue:    0 0 0 1px rgba(96,165,250,.22), 0 18px 50px rgba(37,99,235,.28);
}
```

### Tipografia
- **Fonte de display / números**: `"Space Grotesk"` (pesos 500/600/700) — usada em títulos, saldos e todos os valores monetários. `letter-spacing: -.5px`, `font-feature-settings: "tnum" 1` para números tabulares.
- **Fonte de texto / UI**: `"Manrope"` (pesos 400/500/600/700/800) — corpo, labels, botões.
- Import (Google Fonts):
  ```
  https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap
  ```
- Escala aproximada: H1 telas auth `28px/700`; títulos de painel `18px/700`; valores grandes `26px/700`; corpo `14–15px`; labels `12.5px/700–800`; kicker (sobretítulo) `11.5px/800`, `letter-spacing:1.4px`, `text-transform:uppercase`, cor `--primary-lt`.

### Raios, espaçamento e timing
```css
--r-sm:12px; --r-md:16px; --r-lg:22px; --r-xl:28px;
/* Cantos: inputs/botões ~13–14px, cards ~22px, modal ~26px */
--ease: cubic-bezier(0.16, 1, 0.3, 1);  /* easing padrão de todas as animações */
/* Padding de página: desktop 26px 22px; mobile 18px 14px 120px (espaço pra bottom nav) */
/* gap padrão entre cards: 14–18px */
```

### Animações (sutis e elegantes)
- **Entrada de tela**: `translateY(14px) → 0`, `.5s var(--ease)`.
- **Stagger** (itens em sequência): `translateY(18px) → 0`, `.55s`, com `animation-delay` incremental de ~`.06s` por item.
- **IMPORTANTE**: o estado final visível deve ser a base do CSS; anime *a partir* do escondido usando só `transform` (evite deixar `opacity:0` como estado base sem fallback — em print/SSR/reduced-motion o conteúdo tem que aparecer). Respeite `@media (prefers-reduced-motion: reduce)`.
- Donut: segmentos animam `stroke-dasharray` em `1s`. Barras: `scaleY` de baixo pra cima.

---

## Telas — mapeamento para os arquivos reais

> Ordem sugerida de implementação. Cada item aponta o arquivo do repo que deve ser estilizado.

### 1. Welcome — `src/pages/Welcome.tsx` (+ `onboarding.css`)
- Carrossel de 4 slides com **mockup de celular animado** à esquerda/centro mostrando saldo, mini-gráficos, donut e cards.
- Copy dos slides (pode ajustar): "Seu dinheiro em uma visão clara", "Categorias na sua linguagem", "Sozinho ou compartilhado", "Decisões pequenas, mês previsível".
- Indicadores de slide (dots; o ativo vira uma barrinha de 26px). Botões: **Próximo** (vira "Criar conta" no último slide) e **Já tenho conta**. Link **Pular** no topo.

### 2. Register — `src/pages/Register.tsx`
- Card central (`max-width:430px`) com logo em gradiente, título, subtítulo.
- Campos: nome, e-mail, senha (com botão olho de mostrar/ocultar). **Medidor de força da senha** (3 barras: vermelho → amarelo → verde conforme o tamanho).
- Botão primário "Criar conta" → leva à **verificação por código** (tela Verify). Rodapé "Já tem conta? Entrar". Crédito "Feito com ❤️ por vinnytecnologia".

### 3. Verify (confirmação de e-mail) — pode ser estado dentro de Register ou nova rota
- 4 inputs de OTP (um dígito cada, avanço automático, backspace volta). Botão "Confirmar" habilita quando os 4 estão preenchidos. Link "Reenviar código". Ao confirmar → Onboarding.

### 4. Onboarding — `src/pages/Onboarding.tsx` (+ `onboarding.css`)
- Barra de progresso no topo (gradiente "aurora" animado) + contador "X de N" + botão voltar + Pular.
- **3 perguntas** com opções em cartões (ícone à esquerda + texto + chevron; hover desliza 3px). 
- **4 passos de tour** (com arte ilustrativa: barras, lista de categorias, donut, avatares de grupo).
- **Tela final**: check verde grande com animação `pop`, "Seu painel está pronto", botão "Ativar teste e abrir dashboard" → Dashboard.

### 5. Login — `src/pages/Login.tsx`
- Mesmo padrão de card do Register. Campos e-mail + senha (com olho). Botão "Entrar" → Dashboard. Links "Esqueci minha senha" e "Criar conta".

### 6. Dashboard — `src/pages/Dashboard.tsx` (+ `dashboard.css`)
- **Hero** com kicker + título "Visão Geral" + seletor de período.
- **4 cards de estatística** (Receitas, Despesas, Crédito, Saldo) com ícone, valor grande, variação % e **sparkline** (mini-gráfico de linha no rodapé do card).
- **Alerta de vencimentos** (card amarelo) listando contas a vencer.
- **Painel de análise** com **segmented control** (Confronto / Gastos / Receitas / Pagamento) que troca um **donut interativo** com legenda (use Recharts, que já está no projeto).
- **Gráfico de linha** Receitas × Despesas (6 meses, com áreas preenchidas em gradiente) + **resumo do período** (incl. "Taxa de poupança").
- Lista de **Últimas transações**.

### 7. Receitas — `src/pages/Receitas.tsx` (ou equivalente)
- Hero verde + botão "Nova receita". 3 cards de resumo (total, maior lançamento, média). Toolbar com **busca** + **chips de filtro**. Lista de transações (ícone em emoji, descrição, categoria, data, valor em verde com "+").

### 8. Despesas — `src/pages/Despesas.tsx` (ou equivalente)
- Igual a Receitas, porém acento vermelho, "Nova despesa", valores com "–". Botão central (FAB) do mobile abre o cadastro de despesa.

### 9. Categorias — `src/pages/Categorias.tsx` (ou equivalente)
- Grid de cards (`minmax(230px,1fr)`). Cada card: ícone emoji em cor da categoria, nome, nº de lançamentos, **barra de progresso** (% do total) na cor da categoria, valor, e chips de **subcategorias**. Card tracejado "Criar categoria".

### 10. Grupos — `src/pages/Groups.tsx` (DESTAQUE) (+ `groups.css` se houver)
- **Cabeçalho** em card com gradiente azul + ações: "Criar grupo", "Membros", "Base de divisão".
- **Lane horizontal de grupos** (cards roláveis; o ativo ganha borda azul + glow; mostra emoji, nome, nº de pessoas, total e pilha de avatares). Card tracejado "Novo grupo".
- **Card de convite** ("Recebeu um convite?") com input de código.
- **Dashboard do grupo selecionado** (recarrega ao trocar de grupo):
  - 4 métricas (Total do mês, Pessoas, Média por pessoa, Maior parte %).
  - **Divisão do mês**: donut (Chart.js, já usado aqui) + lista de membros com **barra proporcional ao salário**, valor e %.
  - **Histórico** de despesas (quem pagou, data, valor).
  - **Lista de membros** com base salarial.
- **Modais**: Criar grupo (nome + emoji), Adicionar membro (e-mail + código copiável), Base de divisão (segmented: Por salário / Igual / Percentual + inputs de salário), Lançar despesa do grupo (divide automaticamente).

---

## Chrome do app (navegação) — `src/components/` (`layout.tsx` / `layout.css`)
- **Topbar (desktop)**: logo + nome "Conciliaaí" + nav horizontal (Visão geral, Receitas, Despesas, Categorias, Grupos) + badge "Teste · 7 dias" + botão de perfil (avatar + nome + e-mail). Item ativo: fundo azul translúcido + borda.
- **Bottom nav (mobile)**: 5 posições — Início, Receitas, **FAB central** (botão grande em gradiente, sobe -26px), Despesas, Grupos. Aparece abaixo de `760px`.
- Use **container queries** (ou as breakpoints que o projeto já usar) para alternar entre os dois layouts. No protótipo a quebra principal é `760px`.

## Interações & comportamento
- Navegação entre telas via `react-router-dom` (já no projeto). No protótipo é um router próprio só para demonstrar o fluxo.
- Segmented control do Dashboard troca o dataset do donut com fade/slide curto.
- Trocar de grupo recarrega o painel do grupo com animação de entrada.
- Modais: overlay escuro com blur, card sobe de baixo (mobile) / centraliza (desktop ≥560px). Fecha no X ou clicando no overlay.
- Toast de sucesso (canto inferior) ao salvar/convidar.
- Mostrar/ocultar senha; medidor de força; OTP com auto-avanço.

## Estado (sugestão)
- `currentUser`, `period` (filtro), `selectedGroupId`, `donutView` (CONFRONTO/GASTOS/RECEITAS/PAGAMENTO), `splitBase` (salário/igual/percentual), estados de modal aberto, valores de formulários. Dados de transações/categorias/grupos vêm da API existente (`src/lib/api.ts`).

## Assets
- **Fontes**: Google Fonts (Manrope + Space Grotesk) — adicionar no `index.html` ou via `@import`.
- **Ícones**: SVGs inline (stroke, 24×24). Pode trocar por `lucide-react` se preferir uma lib — os nomes equivalentes estão no protótipo (home, trending-up/down, tag, users, wallet, credit-card, bell, eye, search, arrow-right, check, plus).
- **Emojis**: usados como ícone de categoria/grupo (🏠 🍽️ 🚗 🎬 💊 📱 ✈️ 🎓). Manter ou trocar por ilustrações reais.
- Nenhuma imagem externa é necessária — todos os gráficos são SVG/Canvas.

## Arquivos de referência neste pacote
- `prototipo/Conciliaai-App-Redesign.html` — protótipo completo navegável (abra no navegador).
- `PROMPT-PARA-CLAUDE-CODE.md` — texto pronto para colar como primeira mensagem no Claude Code.
- `README.md` — este documento.
