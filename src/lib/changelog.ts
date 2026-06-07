export interface ChangelogEntry {
  emoji: string;
  text: string;
}

export const CHANGELOG: Record<string, ChangelogEntry[]> = {
  "1.0.66": [
    { emoji: "🎓", text: "Tutorial de Importação de extrato (OFX) agora disponível na central de ajuda." },
  ],
  "1.0.65": [
    { emoji: "🎓", text: "Tutoriais agora mostram descrição e tópicos antes de abrir o YouTube — clique para ver o que vai aprender." },
  ],
  "1.0.64": [
    { emoji: "🎓", text: "Tutorial de Lançamento de despesas agora disponível na central de ajuda." },
  ],
  "1.0.63": [
    { emoji: "🎓", text: "Corrigido título do tutorial: o vídeo disponível é de Lançamento de receitas." },
  ],
  "1.0.62": [
    { emoji: "🎓", text: "Central de tutoriais em vídeo — toque no ? da barra superior para aprender o app. Balão de boas-vindas para novos usuários." },
  ],
  "1.0.61": [
    { emoji: "✨", text: "Tela de login ganha fundo animado — moedas, redes e órbitas financeiras que mudam a cada entrada." },
  ],
  "1.0.60": [
    { emoji: "🔑", text: "Código de verificação preenchido automaticamente pelo iOS e Android — toque na sugestão do teclado e pronto." },
  ],
  "1.0.59": [
    { emoji: "🔑", text: "Confirmação de e-mail agora sugere o código automaticamente no iOS e Android — sem precisar digitar." },
  ],
  "1.0.58": [
    { emoji: "🔝", text: "Novo lançamento agora aparece no topo da lista imediatamente, sem desaparecer e reaparecer embaixo." },
  ],
  "1.0.57": [
    { emoji: "⚡", text: "Lançamentos mais rápidos — a tela não pisca mais ao salvar despesas ou receitas." },
  ],
  "1.0.56": [
    { emoji: "📅", text: "Importar extrato agora tem filtro de período — escolha quais dias do arquivo você quer lançar antes de confirmar." },
  ],
  "1.0.55": [
    { emoji: "🪄", text: "Checkout sem redigitar: se CPF e nome já estão no seu perfil, o pagamento abre direto no Asaas sem pedir dados de novo." },
  ],
  "1.0.54": [
    { emoji: "👤", text: "Nova tela de Perfil — foto, nome, e-mail, CPF, assinatura e dias restantes. Acesse pelo botão Perfil na barra inferior." },
    { emoji: "✨", text: "Cabeçalho simplificado — menu lateral removido. A navegação fica toda na barra inferior." },
  ],
  "1.0.52": [
    { emoji: "👤", text: "Nova tela de Perfil — foto, nome, e-mail, CPF, datas de assinatura e barra de progresso do ciclo. Acesse pelo botão Perfil na barra inferior." },
  ],
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
