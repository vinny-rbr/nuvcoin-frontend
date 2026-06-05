export interface ChangelogEntry {
  emoji: string;
  text: string;
}

export const CHANGELOG: Record<string, ChangelogEntry[]> = {
  "1.0.51": [
    { emoji: "⚡", text: "Após pagar no Asaas, o app detecta automaticamente e libera o acesso — sem precisar fechar e reabrir." },
    { emoji: "📅", text: "Dias restantes da assinatura aparecem na topbar para planos pagos e de teste." },
  ],
  "1.0.50": [
    { emoji: "📋", text: "Checkout agora pede nome completo e CPF — dados salvos no seu perfil automaticamente." },
    { emoji: "🔄", text: "Corrigido loop infinito de onboarding para contas com assinatura expirada." },
  ],
  "1.0.49": [
    { emoji: "OK", text: "Login agora sincroniza plano vitalicio imediatamente ao entrar." },
  ],
  "1.0.47": [
    { emoji: "🗂️", text: "Drill-in refinado — titulo com Space Grotesk, nome trunca correto (flex:0 1 auto), addrow nao estoura, icones SVG no menu editar/remover" },
  ],
  "1.0.46": [
    { emoji: "🗑️", text: "Subcategorias agora tem botao de remover e editar no drill — nome longo nao quebra mais o layout" },
  ],
  "1.0.45": [
    { emoji: "📊", text: "Receitas e Despesas redesenhadas — donut overview, tabs de navegacao, form colapsavel e lista com acoes no toque" },
  ],
  "1.0.44": [
    { emoji: "🔍", text: "Subcategorias com drill-in — clique num chip pra entrar e navegar nos niveis com animacao" },
  ],
  "1.0.43": [
    { emoji: "⊞", text: "Categorias sempre em grade — 2 colunas no celular, nunca mais empilha em coluna unica" },
  ],
  "1.0.42": [
    { emoji: "🗂️", text: "Categorias redesenhadas — botao Nova no inicio da lista, cards com icone e nome mais limpos" },
  ],
  "1.0.41": [
    { emoji: "📱", text: "Dashboard não desloca mais pra direita no celular — cards agora cabem certinho na tela" },
  ],
  "1.0.40": [
    { emoji: "🎞️", text: "Acordeão animado nos lançamentos do Confronto — abre e fecha suave sem quebrar o layout" },
  ],
  "1.0.39": [
    { emoji: "📋", text: "Clique em Receitas ou Despesas no gráfico Confronto para ver os lançamentos do período" },
  ],
  "1.0.38": [
    { emoji: "🗂️", text: "Grupos agora mostra a lista direto, sem painel de ações no topo" },
    { emoji: "⚡", text: "Ações do grupo ficam dentro do contexto ao selecionar um grupo" },
    { emoji: "✕", text: "Botão para fechar o grupo selecionado sem sair da tela" },
  ],
  "1.0.35": [
    { emoji: "📊", text: "Nova tela de Relatórios no menu +" },
    { emoji: "🔍", text: "Busca por nome ou valor nas movimentações" },
    { emoji: "📄", text: "Exportar relatório em PDF ou compartilhar" },
    { emoji: "🎯", text: "Filtro por Entradas, Saídas ou Tudo" },
  ],
  "1.0.34": [
    { emoji: "✨", text: "Valores dos cards se ajustam automaticamente ao tamanho" },
    { emoji: "🍩", text: "Donut mostra saldo do mês no centro" },
    { emoji: "📱", text: "Topbar mais limpa no celular" },
  ],
  "1.0.33": [
    { emoji: "📈", text: "Novo gráfico de barras por mês" },
    { emoji: "🍩", text: "Gráfico de pizza interativo por categoria" },
    { emoji: "💡", text: "Cards de estatísticas redesenhados" },
  ],
};
