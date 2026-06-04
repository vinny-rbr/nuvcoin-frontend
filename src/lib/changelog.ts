export interface ChangelogEntry {
  emoji: string;
  text: string;
}

export const CHANGELOG: Record<string, ChangelogEntry[]> = {
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
