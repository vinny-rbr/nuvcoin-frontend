# 🚀 Cole isto no Claude Code (VS Code)

> Abra o projeto `nuvcoin-frontend` no VS Code com o Claude Code e cole o texto abaixo como primeira mensagem. Deixe o arquivo `design_handoff_conciliaai/` dentro do projeto para o Claude Code conseguir ler o protótipo e este guia.

---

Quero aplicar um **redesign premium** no front-end deste app (React + TypeScript + Vite), **mantendo a paleta de cores atual** (dark slate + azul/verde/vermelho).

Dentro da pasta `design_handoff_conciliaai/` tem:
- `prototipo/Conciliaai-App-Redesign.html` — um **protótipo de referência** (HTML/CSS/JS puro) que mostra o visual e o comportamento desejados de TODAS as telas.
- `README.md` — documentação detalhada com tokens de cor, tipografia, espaçamentos, descrição tela a tela e o mapeamento para os arquivos `src/pages/*.tsx` reais.

**O que fazer:**
1. Leia `design_handoff_conciliaai/README.md` por completo e abra o `prototipo/*.html` no navegador para ver o resultado-alvo.
2. **Não copie o HTML cru.** Recrie o visual usando a estrutura React/TS que já existe (mantenha rotas, hooks, chamadas de API, `react-router-dom`, Recharts/Chart.js que já estão no projeto).
3. Atualize `src/index.css` e `src/components/layout.css` com os tokens novos (cores em `:root`, fontes Manrope + Space Grotesk, raios, sombras).
4. Refaça as telas uma a uma, começando por: **Welcome → Register → Onboarding → Dashboard → Groups**. Depois Login, Receitas, Despesas, Categorias.
5. Preserve as animações de entrada (slide-up suave), o gráfico donut interativo e a divisão por salário na tela de Grupos.
6. Garanta responsividade: layout desktop (nav no topo) e mobile (bottom nav com botão central). Use as mesmas quebras do protótipo.

Faça **uma tela por vez** e me mostre o resultado antes de seguir para a próxima.
