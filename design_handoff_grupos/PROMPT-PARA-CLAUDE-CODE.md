# 🚀 Cole isto no Claude Code (VS Code) — Tela de GRUPOS

> Abra o projeto `nuvcoin-frontend` no VS Code com o Claude Code e cole este texto. Deixe a pasta `design_handoff_grupos/` dentro do projeto.

---

Quero refazer **apenas a tela de Grupos** deste app (React + TypeScript + Vite), deixando-a premium, **mantendo a paleta atual** (dark slate + azul/verde/vermelho) e a biblioteca de gráficos que já uso aqui (**Chart.js** — o donut de divisão já é feito com ela).

Na pasta `design_handoff_grupos/` tem:
- `prototipo/Conciliaai-App-Redesign.html` — protótipo navegável. Abra no navegador e clique em **Grupos** no menu para ver o alvo exato (troque entre os grupos, abra os modais de "Criar grupo", "Membros" e "Base de divisão").
- `README.md` — especificação detalhada da tela de Grupos, com tokens, estrutura de componentes, estados e interações.

**O que fazer:**
1. Leia `design_handoff_grupos/README.md` inteiro e veja a tela de Grupos no protótipo.
2. **Não cole o HTML cru.** Recrie em React usando o que já existe no projeto: `src/pages/Groups.tsx`, `react-router-dom`, Chart.js, e as chamadas de API já presentes (`src/lib/api.ts`).
3. Atualize os tokens de cor/tipografia em `src/index.css` (se ainda não tiverem sido aplicados) — Manrope + Space Grotesk, cores em `:root`.
4. Implemente, nesta ordem: **lane de grupos → painel do grupo selecionado (métricas + divisão por salário + histórico + membros) → modais**.
5. Mantenha as animações de entrada sutis (slide-up) e o donut animado.
6. Garanta responsividade: desktop (grid 2 colunas) e mobile (empilhado, lane com scroll horizontal).

Me mostre o resultado da lane e do painel antes de seguir para os modais.
