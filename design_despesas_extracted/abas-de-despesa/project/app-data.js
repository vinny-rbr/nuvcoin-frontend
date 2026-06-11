/* ============================================================
   nuvcoin — dados de exemplo para a aba Despesas (redesign)
   Plano: séries "fixas" e "parceladas" geram lançamentos por mês.
   Ao navegar de mês, as fixas e as próximas parcelas aparecem
   automaticamente (pendentes) no mês seguinte.
   ============================================================ */

const NUV_TODAY_ISO = "2026-06-11"; // "hoje" fixo do protótipo (Junho/2026)

const MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const DIAS_SEMANA_PT = [
  "Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado",
];

// Categorias com cor + ícone (chave usada no SVG do componente)
const NUV_CATEGORIES = {
  alimentacao: { name: "Alimentação", color: "#EF4444", icon: "cutlery" },
  moradia:     { name: "Moradia",     color: "#3B82F6", icon: "home" },
  energia:     { name: "Energia",     color: "#F59E0B", icon: "bolt" },
  internet:    { name: "Internet",    color: "#A78BFA", icon: "wifi" },
  transporte:  { name: "Transporte",  color: "#2DD4BF", icon: "car" },
  lazer:       { name: "Lazer",       color: "#EC4899", icon: "ticket" },
  // receitas
  salario:     { name: "Salário",     color: "#22C55E", icon: "wallet" },
  freela:      { name: "Freelance",   color: "#2DD4BF", icon: "laptop" },
  rendimento:  { name: "Rendimentos", color: "#34D399", icon: "chart" },
};

// Séries recorrentes. amount em centavos.
// kind "fixo": repete todo mês a partir de `start`.
// kind "parcelado": repete `total` vezes; rótulo (n/total).
const NUV_SERIES = [
  { id: "s_aluguel",  title: "Aluguel",     cat: "moradia",     wallet: "Nubank",   amount: 150000, day: 5,  kind: "fixo",       start: "2026-05" },
  { id: "s_energia",  title: "Energia",     cat: "energia",     wallet: "Nubank",   amount: 28000,  day: 11, kind: "fixo",       start: "2026-05" },
  { id: "s_internet", title: "Internet",    cat: "internet",    wallet: "Nubank",   amount: 12000,  day: 20, kind: "fixo",       start: "2026-04" },
  { id: "s_alim2",    title: "Alimentação", cat: "alimentacao", wallet: "Carteira", amount: 95000,  day: 11, kind: "parcelado", total: 2, start: "2026-06" },
  { id: "s_alim5",    title: "Alimentação", cat: "alimentacao", wallet: "Carteira", amount: 200000, day: 14, kind: "parcelado", total: 5, start: "2026-06" },
];

// Séries de receita (para o switcher Despesas/Receitas do header)
const NUV_SERIES_RECEITA = [
  { id: "r_salario", title: "Salário",    cat: "salario",    wallet: "Nubank",   amount: 500000, day: 5,  kind: "fixo", start: "2026-01" },
  { id: "r_freela",  title: "Freelance",  cat: "freela",     wallet: "Carteira", amount: 120000, day: 18, kind: "fixo", start: "2026-05" },
  { id: "r_rend",    title: "Rendimento", cat: "rendimento", wallet: "Nubank",   amount: 8400,   day: 1,  kind: "fixo", start: "2026-04" },
];

// ---------- helpers de data ----------
function nuvPad(n) { return String(n).padStart(2, "0"); }

function nuvDaysInMonth(year, month /* 0-idx */) {
  return new Date(year, month + 1, 0).getDate();
}

function nuvMonthIndexFromKey(key /* "2026-05" */) {
  const [y, m] = key.split("-").map(Number);
  return y * 12 + (m - 1);
}

function nuvFormatBRL(cents) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const MESES_ABREV = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
function nuvFormatDateLong(dateISO) {
  const d = new Date(`${dateISO}T00:00:00`);
  return `${d.getDate()} ${MESES_ABREV[d.getMonth()]}, ${d.getFullYear()}`;
}

function nuvWeekdayLabel(dateISO) {
  const d = new Date(`${dateISO}T00:00:00`);
  return DIAS_SEMANA_PT[d.getDay()];
}

function nuvDayLabel(dateISO) {
  const today = NUV_TODAY_ISO;
  const d = new Date(`${dateISO}T00:00:00`);
  const t = new Date(`${today}T00:00:00`);
  const diff = Math.round((d - t) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === -1) return "Ontem";
  if (diff === 1) return "Amanhã";
  return `${nuvWeekdayLabel(dateISO)}, ${d.getDate()}`;
}

// Gera os lançamentos de um mês a partir das séries.
function nuvBuildMonthItems(year, month /* 0-idx */, series) {
  const list = series || NUV_SERIES;
  const targetIdx = year * 12 + month;
  const items = [];
  for (const s of list) {
    const startIdx = nuvMonthIndexFromKey(s.start);
    const monthsSince = targetIdx - startIdx;
    if (monthsSince < 0) continue;

    let installmentLabel = "";
    let installment = null;
    if (s.kind === "parcelado") {
      const n = monthsSince + 1;
      if (n > s.total) continue; // série encerrada
      installmentLabel = ` (${n}/${s.total})`;
      installment = `${n}/${s.total}`;
    }

    const dim = nuvDaysInMonth(year, month);
    const day = Math.min(s.day, dim);
    const dateISO = `${year}-${nuvPad(month + 1)}-${nuvPad(day)}`;

    // status padrão: pago se a data já passou (conta quitada), senão pendente
    const status = dateISO < NUV_TODAY_ISO ? "paid" : "pending";

    const cat = NUV_CATEGORIES[s.cat];
    items.push({
      id: `${s.id}-${year}-${nuvPad(month + 1)}`,
      seriesId: s.id,
      title: s.title + installmentLabel,
      baseTitle: s.title,
      categoryKey: s.cat,
      categoryName: cat.name,
      color: cat.color,
      icon: cat.icon,
      wallet: s.wallet,
      amountCents: s.amount,
      dateISO,
      status,
      kind: s.kind,
      installment,
    });
  }
  return items;
}

// Agrupa por dia, ordenando os dias do mais recente p/ o mais antigo (igual à referência).
function nuvGroupByDay(items) {
  const map = new Map();
  for (const it of items) {
    if (!map.has(it.dateISO)) map.set(it.dateISO, []);
    map.get(it.dateISO).push(it);
  }
  const groups = Array.from(map.entries()).map(([dateISO, list]) => ({
    dateISO,
    label: nuvDayLabel(dateISO),
    items: list.sort((a, b) => b.amountCents - a.amountCents),
  }));
  groups.sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1)); // desc
  return groups;
}

Object.assign(window, {
  NUV_TODAY_ISO, MESES_PT, DIAS_SEMANA_PT, NUV_CATEGORIES, NUV_SERIES, NUV_SERIES_RECEITA,
  nuvDaysInMonth, nuvFormatBRL, nuvFormatDateLong, nuvDayLabel, nuvWeekdayLabel,
  nuvBuildMonthItems, nuvGroupByDay, nuvPad,
});
