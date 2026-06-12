export interface ChangelogEntry {
  emoji: string;
  text: string;
}

export const CHANGELOG: Record<string, ChangelogEntry[]> = {
  "26.6.12.66": [
    { emoji: "🔧", text: "Importação: título da transação agora mostra até 2 linhas em vez de cortar com reticências." },
    { emoji: "🏷️", text: "Importação BB: prefixo de data+hora removido do agrupamento de comerciante — 'Aplicar aos N' agora aparece corretamente." },
  ],
  "26.6.12.65": [
    { emoji: "🏦", text: "Carteiras: campo de saldo no formulário de edição — edite o saldo da conta sem precisar excluí-la." },
  ],
  "26.6.12.64": [
    { emoji: "☑️", text: "Importação: checkbox em cada transação — marque/desmarque individualmente quais importar sem abrir o detalhe." },
    { emoji: "🏷️", text: "Importação: ao trocar categoria de uma transação, se existirem outras com o mesmo nome/CNPJ, o app pergunta se deseja aplicar a todas de uma vez." },
  ],
  "26.6.12.63": [
    { emoji: "🔧", text: "Importação OFX: corrigido bug que alterava o saldo da conta bancária a cada leitura do mesmo arquivo — saldo não é mais acumulado automaticamente durante o import." },
    { emoji: "🔧", text: "Importação OFX BB: popup de ajuste de saldo não aparece mais quando o banco exporta LEDGERBAL=0 (valor inválido que gerava ajuste errado)." },
  ],
  "26.6.12.62": [
    { emoji: "📈", text: "Fluxo de Caixa: nova tela mostrando entradas vs saídas mês a mês nos últimos 12 meses, com gráfico de barras e detalhamento por categoria." },
    { emoji: "📥", text: "Exportar CSV: botão de download em Despesas e Receitas — exporta as transações do mês atual filtradas para .csv." },
  ],
  "26.6.11.57": [
    { emoji: "📄", text: "Importação PDF Caixa: OCR sem vírgula decimal agora reconhecido — entradas AZCXVSCC/ELCD com valor compacto (ex: 19585C) são lidas corretamente." },
  ],
  "26.6.11.53": [
    { emoji: "📄", text: "Importação PDF Caixa: corrigidas transações perdidas por OCR — linhas divididas em colunas e entradas AZCX fundidas agora são reconhecidas corretamente." },
  ],
  "26.6.11.52": [
    { emoji: "🗑️", text: "Botão 'Apagar tudo' em Despesas e Receitas — remove todos os lançamentos do mês com confirmação inline." },
  ],
  "26.6.11.50": [
    { emoji: "⚖️", text: "Importação PDF: saldo final do extrato é detectado automaticamente e oferece ajuste de saldo, igual ao OFX." },
  ],
  "26.6.11.48": [
    { emoji: "📂", text: "Importação múltipla: selecione vários PDFs ou extratos de uma vez — todos os lançamentos são combinados em uma única revisão." },
  ],
  "26.6.11.45": [
    { emoji: "📊", text: "Dashboard: saldo em contas agora mostra o valor real das transações quando as contas não têm saldo inicial definido." },
    { emoji: "📄", text: "Importação PDF: barra de progresso real por página — você vê 'Página X de Y lida' em vez de travado." },
  ],
  "26.6.11.40": [
    { emoji: "📄", text: "Importação de extrato PDF da Caixa corrigida: lançamentos agora são lidos linha a linha com tipo correto (crédito/débito)." },
  ],
  "26.6.11.36": [
    { emoji: "📝", text: "Observação, Tags e Ignorar nos relatórios adicionados ao formulário de edição de despesas e receitas." },
  ],
  "26.6.11.32": [
    { emoji: "📅", text: "Despesas e Receitas redesenhadas: cabeçalho compacto com seletor de tipo, navegação por mês (‹ Junho ›), transações agrupadas por dia e resumo pendente/pago." },
    { emoji: "✅", text: "Toggle de status direto na linha — marque como pago ou pendente com um toque, sem abrir o item." },
    { emoji: "➕", text: "Botão + abre um sheet de adição direto na tela de Despesas ou Receitas." },
  ],
  "26.6.11.24": [
    { emoji: "📊", text: "Tela Planejamento: orçamentos por categoria com barra de progresso (verde/âmbar/vermelho) e metas de economia com anel de progresso." },
    { emoji: "👤", text: "Perfil subiu para o topo — o avatar fica no canto superior esquerdo no mobile, liberando espaço na barra inferior para o Planejamento." },
  ],
  "26.6.11.9": [
    { emoji: "🔔", text: "Push notifications reais — agora você recebe um aviso no celular toda vez que um gasto for lançado no cartão de crédito, mesmo com o app fechado." },
    { emoji: "🔕", text: "Som e vibração personalizados: o push toca o som que você configurou nas notificações do seu perfil." },
  ],
  "26.6.10.4": [
    { emoji: "🔢", text: "Nova numeração de versão: AA.M.D.N — você vê exatamente o dia e quantas atualizações saíram no mês." },
  ],
  "26.6.10.1": [
    { emoji: "💳", text: "Cartões de Crédito — gerencie todos os seus cartões em um só lugar: cadastre com limite, datas de vencimento, fechamento e melhor dia de compra." },
    { emoji: "📊", text: "Painel visual estilo Google Wallet com deck empilhado, barra de limite colorida (verde → âmbar → vermelho) e hero com fatura total aberta." },
    { emoji: "💸", text: "Pague a fatura direto pelo app: escolha de qual conta debitar, pagamento parcial com chips de 15% / metade / total, e o saldo da conta é descontado na hora." },
    { emoji: "🛒", text: "Lance gastos no cartão por dentro da fatura de cada cartão — a fatura atualiza em tempo real." },
    { emoji: "➕", text: "Menu '+' repaginado: bottom sheet deslizante com ícones coloridos para Novo banco, Novo cartão, Gasto no cartão, Importar extrato, Transferência, Lançar por foto, Nova receita e Nova despesa." },
    { emoji: "🏠", text: "Card 'Crédito' na home abre a tela de cartões com animação; Categorias voltou ao menu inferior; botão ← Início para voltar facilmente." },
    { emoji: "🔧", text: "Scroll corrigido nos sheets de cartão — o menu inferior não bloqueia mais o conteúdo inferior das telas de edição e pagamento." },
  ],
  "1.0.97": [
    { emoji: "🔧", text: "Seção Meus cartões só aparece no Dashboard quando há contas cadastradas." },
  ],
  "1.0.96": [
    { emoji: "💳", text: "BankCard com logo real de cada banco (Nubank, BB, Itaú, Inter, C6, Caixa, Santander, PicPay) e bandeira da rede (Mastercard, Visa, Elo)." },
    { emoji: "💰", text: "Saldo em contas no Dashboard agora reflete o saldo real das contas bancárias cadastradas." },
    { emoji: "📊", text: "Detalhe de conta: cards de Receitas/Despesas e gráfico de barras semanal." },
  ],
  "1.0.95": [
    { emoji: "💳", text: "Dashboard: seção Meus cartões com CardDeck animado — swipe para trocar, toque para abrir a conta." },
  ],
  "1.0.94": [
    { emoji: "💳", text: "Carteiras: gerencie seus bancos com cartões animados, transferências entre contas e saldo total consolidado." },
  ],
  "1.0.93": [
    { emoji: "🏷️", text: "Importação OFX: toque em qualquer lançamento para escolher a categoria — com navegação por subcategorias e memória por estabelecimento." },
  ],
  "1.0.92": [
    { emoji: "🗂️", text: "Tutorial de organização de categorias disponível na central de ajuda." },
  ],
  "1.0.91": [
    { emoji: "🎬", text: "Tutorial de importação de extrato OFX atualizado." },
  ],
  "1.0.90": [
    { emoji: "⚖️", text: "Importação OFX detecta diferença de saldo e oferece lançamento de ajuste automático." },
  ],
  "1.0.89": [
    { emoji: "💰", text: "Saldo em contas agora é acumulado — ao virar o mês sem movimentos, o saldo anterior é transportado corretamente." },
  ],
  "1.0.88": [
    { emoji: "💡", text: "Envie sugestões de melhorias direto pelo Perfil — toda ideia é lida." },
  ],
  "1.0.87": [
    { emoji: "🎬", text: "Texto dos tutoriais corrigido para branco." },
  ],
  "1.0.86": [
    { emoji: "🖼️", text: "Thumbnails dos tutoriais com visual colorido e sem fundo preto." },
  ],
  "1.0.85": [
    { emoji: "🖼️", text: "Thumbnails dos tutoriais exibidas corretamente." },
  ],
  "1.0.83": [
    { emoji: "🎬", text: "Tutorial de lançamento de despesas atualizado." },
  ],
  "1.0.82": [
    { emoji: "🎬", text: "Tutorial de lançamento de receitas atualizado." },
  ],
  "1.0.81": [
    { emoji: "🚫", text: "Correção: textos e valores não ficam mais selecionáveis ao tocar na tela." },
  ],
  "1.0.80": [
    { emoji: "🔁", text: "Gastos fixos e parcelados agrupados em accordion — 1 card por grupo, expanda para ver cada mês e marcar como pago." },
    { emoji: "💰", text: "Saldo real conta só o que foi pago; pendentes aparecem como Previsto em âmbar." },
  ],
  "1.0.79": [
    { emoji: "📱", text: "Correção: app Android agora abre em tela cheia sem barra de URL." },
  ],
  "1.0.78": [
    { emoji: "🗑️", text: "Exclusão de conta disponível no Perfil — seus dados são apagados permanentemente." },
  ],
  "1.0.77": [
    { emoji: "📱", text: "Conciliaaí chegou na Play Store — instale pelo Android como app nativo." },
  ],
  "1.0.74": [
    { emoji: "🗂️", text: "Categorias reorganizáveis — segure e arraste para ordenar do seu jeito. Botão Nova categoria largo no topo; arraste-o para a posição desejada e solte para criar ali." },
  ],
  "1.0.73": [
    { emoji: "🛡️", text: "Política de Privacidade disponível no Perfil — seção Jurídico." },
  ],
  "1.0.72": [
    { emoji: "✨", text: "Animação de entrada ao abrir o app — logo, nome e carregamento antes de tudo aparecer." },
  ],
  "1.0.71": [
    { emoji: "✨", text: "Nova logo do Conciliaai — ícone atualizado na tela inicial e ao instalar no celular." },
  ],
  "1.0.70": [
    { emoji: "🗂️", text: "Menu de ações das categorias agora abre acima de tudo — sem ser cortado por nenhum elemento." },
  ],
  "1.0.69": [
    { emoji: "🗂️", text: "Menu de ações das categorias não fica mais cortado — abre corretamente sobre o conteúdo." },
  ],
  "1.0.68": [
    { emoji: "🗂️", text: "+N ver todas nas subcategorias agora é clicável — abre a lista completa da categoria." },
  ],
  "1.0.67": [
    { emoji: "🔝", text: "Lançamento por foto e importação de arquivo ficam no topo da lista até você clicar em Concluir ou Lançar outro." },
  ],
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
