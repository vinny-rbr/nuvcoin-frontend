import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import type { FinanceItem } from "../types/finance";
import { financeList, financeRefreshFromApi, financeSubscribe } from "../lib/financeService";
import "./relatorios.css";

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string): string {
  const parts = iso.split("-");
  return `${parts[2]}/${parts[1]}`;
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function printReport(items: FinanceItem[], periodLabel: string) {
  const receitas = items.filter((it) => it.type === "RECEITA");
  const despesas = items.filter((it) => it.type === "DESPESA");
  const totRec = receitas.reduce((s, it) => s + it.amountCents, 0);
  const totDes = despesas.reduce((s, it) => s + it.amountCents, 0);
  const saldo = totRec - totDes;

  const row = (it: FinanceItem, color: string, sign: string) =>
    `<tr>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;color:#1e293b">${it.title}</td>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#64748b">${it.category} • ${fmtDate(it.dateISO)}</td>
      <td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:700;text-align:right;white-space:nowrap;color:${color}">${sign} ${formatBRL(it.amountCents)}</td>
    </tr>`;

  const today = new Date().toLocaleDateString("pt-BR");

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Conciliaaí — ${periodLabel}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box;font-family:system-ui,sans-serif;}
    body{color:#0f172a;padding:32px;background:#fff;}
    table{width:100%;border-collapse:collapse;}
    th{text-align:left;padding:6px 8px;font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;}
    th:last-child{text-align:right;}
    @media print{body{padding:16px;}@page{margin:16px;}}
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #1d4ed8;">
    <div>
      <div style="font-size:20px;font-weight:800;color:#1d4ed8;">Conciliaaí</div>
      <div style="font-size:11px;color:#64748b;letter-spacing:.12em;font-weight:700;margin-top:2px;">FINANÇAS</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:3px;">Relatório financeiro</div>
      <div style="font-size:12px;color:#64748b;">Período: ${periodLabel}</div>
      <div style="font-size:12px;color:#64748b;">Gerado em ${today}</div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;">
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;background:#f8fafc;">
      <div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:.05em;margin-bottom:5px;">RECEITAS</div>
      <div style="font-size:17px;font-weight:700;color:#16a34a;">${formatBRL(totRec)}</div>
    </div>
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;background:#f8fafc;">
      <div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:.05em;margin-bottom:5px;">DESPESAS</div>
      <div style="font-size:17px;font-weight:700;color:#dc2626;">${formatBRL(totDes)}</div>
    </div>
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;background:#f8fafc;">
      <div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:.05em;margin-bottom:5px;">SALDO</div>
      <div style="font-size:17px;font-weight:700;color:${saldo >= 0 ? "#16a34a" : "#dc2626"};">${formatBRL(saldo)}</div>
    </div>
  </div>
  ${receitas.length > 0 ? `
  <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#16a34a;margin-bottom:8px;">Entradas</div>
  <table>
    <thead><tr><th>Descrição</th><th>Categoria / Data</th><th>Valor</th></tr></thead>
    <tbody>${receitas.map((it) => row(it, "#16a34a", "+")).join("")}</tbody>
  </table>` : ""}
  ${despesas.length > 0 ? `
  <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#dc2626;margin-top:20px;margin-bottom:8px;">Saídas</div>
  <table>
    <thead><tr><th>Descrição</th><th>Categoria / Data</th><th>Valor</th></tr></thead>
    <tbody>${despesas.map((it) => row(it, "#dc2626", "–")).join("")}</tbody>
  </table>` : ""}
  <div style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding:12px 16px;border-radius:8px;background:#0f172a;color:#fff;">
    <span style="font-size:13px;font-weight:700;color:#cbd5e1;">Saldo do período</span>
    <span style="font-size:18px;font-weight:700;color:${saldo >= 0 ? "#34d399" : "#f87171"};">${formatBRL(saldo)}</span>
  </div>
  <div style="margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;">
    <span>Gerado por Conciliaaí</span>
    <span>Página 1 de 1</span>
  </div>
</body>
</html>`;

  const w = window.open("", "_blank", "width=750,height=950");
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.onload = () => w.print();
}

const ICONS = {
  back: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  up: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5" />
      <path d="m6 11 6-6 6 6" />
    </svg>
  ),
  down: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="m6 13 6 6 6-6" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  empty: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  pdf: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6M9 17h6" />
    </svg>
  ),
  share: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  ),
};

export default function RelatoriosExtrato() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "RECEITA" | "DESPESA">("ALL");
  const [period, setPeriod] = useState<string>(currentMonthKey());
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    const load = () => setItems(financeList());
    load();
    void financeRefreshFromApi().then(setItems).catch(() => undefined);
    const unsub = financeSubscribe(load);
    const refresh = () => void financeRefreshFromApi().then(setItems).catch(() => undefined);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      unsub();
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const periods = useMemo(() => {
    const keys = new Set<string>();
    items.forEach((it) => keys.add(monthKey(it.dateISO)));
    keys.add(currentMonthKey());
    return [...keys].sort((a, b) => b.localeCompare(a)).map((key) => ({ key, label: monthLabel(key) }));
  }, [items]);

  const periodItems = useMemo(
    () => items.filter((it) => monthKey(it.dateISO) === period),
    [items, period]
  );

  const q = query.trim();
  const qDigits = onlyDigits(q);

  const filtered = useMemo(() => {
    return periodItems.filter((it) => {
      if (filter !== "ALL" && it.type !== filter) return false;
      if (!q) return true;
      const byName =
        it.title.toLowerCase().includes(q.toLowerCase()) ||
        it.category.toLowerCase().includes(q.toLowerCase());
      const valDigits = onlyDigits(formatBRL(it.amountCents));
      const reaisStr = String(Math.round(it.amountCents / 100));
      const byValue =
        qDigits.length > 0 &&
        (valDigits.includes(qDigits) || reaisStr.includes(qDigits));
      return byName || byValue;
    });
  }, [periodItems, filter, q, qDigits]);

  const totRec = useMemo(() => periodItems.filter((it) => it.type === "RECEITA").reduce((s, it) => s + it.amountCents, 0), [periodItems]);
  const totDes = useMemo(() => periodItems.filter((it) => it.type === "DESPESA").reduce((s, it) => s + it.amountCents, 0), [periodItems]);
  const saldo = totRec - totDes;

  const receitas = filtered.filter((it) => it.type === "RECEITA");
  const despesas = filtered.filter((it) => it.type === "DESPESA");
  const noResults = filtered.length === 0;

  const sumOf = (arr: FinanceItem[]) => arr.reduce((s, it) => s + it.amountCents, 0);

  const nameQuery = q && qDigits.length === 0 ? q : "";

  const currentPeriodLabel = periods.find((p) => p.key === period)?.label ?? monthLabel(period);

  function handleShare() {
    const text = `Relatório Conciliaaí — ${currentPeriodLabel}\nReceitas: ${formatBRL(totRec)}\nDespesas: ${formatBRL(totDes)}\nSaldo: ${formatBRL(saldo)}`;
    if (navigator.share) {
      void navigator.share({ title: "Relatório Conciliaaí", text });
    } else {
      void navigator.clipboard.writeText(text).then(() =>
        window.alert("Resumo copiado para a área de transferência.")
      );
    }
    setShowExport(false);
  }

  function handleDownloadPdf() {
    setShowExport(false);
    printReport(periodItems, currentPeriodLabel);
  }

  return (
    <div className="relatorios-view">
      {/* Header */}
      <div className="rep-head">
        <button className="rep-back" onClick={() => navigate(-1)} aria-label="Voltar">
          {ICONS.back}
        </button>
        <div className="rep-title">
          Relatórios
          <small>Entradas e saídas do período</small>
        </div>
        <button className="rep-export" onClick={() => setShowExport(true)}>
          {ICONS.download}
          <span>Exportar</span>
        </button>
      </div>

      {/* Period selector */}
      <div className="rep-period">
        <select
          className="period-select"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          {periods.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className="rep-summary">
        <div className="sum-row">
          <div className="sum-tile">
            <span
              className="sum-ic"
              style={{ background: "rgba(34,197,94,.14)", color: "#4ADE80" }}
            >
              {ICONS.up}
            </span>
            <div>
              <small>Receitas</small>
              <strong className="color-green">{formatBRL(totRec)}</strong>
            </div>
          </div>
          <div className="sum-vdiv" />
          <div className="sum-tile">
            <span
              className="sum-ic"
              style={{ background: "rgba(239,68,68,.14)", color: "#F87171" }}
            >
              {ICONS.down}
            </span>
            <div>
              <small>Despesas</small>
              <strong className="color-red">{formatBRL(totDes)}</strong>
            </div>
          </div>
        </div>
        <div className="sum-balance">
          <span className="lbl">Saldo do período</span>
          <span
            className="val"
            style={{ color: saldo >= 0 ? "#4ADE80" : "#F87171" }}
          >
            {formatBRL(saldo)}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="rep-search-wrap">
        {ICONS.search}
        <input
          className="rep-search-input"
          placeholder="Buscar por nome ou valor…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            className="rep-search-clear"
            onClick={() => setQuery("")}
            aria-label="Limpar busca"
          >
            ×
          </button>
        )}
      </div>
      <p className="rep-search-hint">
        Pesquise pelo <b>nome</b> (ex.: "aluguel") ou por um <b>valor</b> (ex.: "480").
      </p>

      {/* Segmented filter */}
      <div className="rep-seg">
        <button
          className={filter === "ALL" ? "is-active" : ""}
          onClick={() => setFilter("ALL")}
        >
          Tudo
        </button>
        <button
          className={`filter-receita${filter === "RECEITA" ? " is-active" : ""}`}
          onClick={() => setFilter("RECEITA")}
        >
          Entradas
        </button>
        <button
          className={`filter-despesa${filter === "DESPESA" ? " is-active" : ""}`}
          onClick={() => setFilter("DESPESA")}
        >
          Saídas
        </button>
      </div>

      {/* Empty state */}
      {noResults && (
        <div className="rep-empty">
          {ICONS.empty}
          <strong>Nada encontrado</strong>
          <small>Tente outro nome ou valor.</small>
        </div>
      )}

      {/* Entradas */}
      {receitas.length > 0 && (
        <div className="rep-grp">
          <div className="rep-grp-head">
            <span className="rep-grp-label" style={{ color: "#4ADE80" }}>
              <span className="rep-grp-dot" style={{ background: "#22c55e" }} />
              Entradas
              <span className="rep-grp-count">{receitas.length}</span>
            </span>
            <span className="rep-grp-total color-green">{formatBRL(sumOf(receitas))}</span>
          </div>
          {receitas.map((it) => (
            <div key={it.id} className="rep-item">
              <div
                className="rep-item-ic"
                style={{ background: "rgba(34,197,94,.14)", color: "#4ADE80" }}
              >
                ↑
              </div>
              <div className="rep-item-main">
                <strong>
                  <Highlight text={it.title} query={nameQuery} />
                </strong>
                <span>
                  {it.category} • {fmtDate(it.dateISO)}
                </span>
              </div>
              <div className="rep-item-right">
                <div className="amt color-green">+ {formatBRL(it.amountCents)}</div>
                <span className="tag tag-rec">Receita</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Saídas */}
      {despesas.length > 0 && (
        <div className="rep-grp">
          <div className="rep-grp-head">
            <span className="rep-grp-label" style={{ color: "#F87171" }}>
              <span className="rep-grp-dot" style={{ background: "#ef4444" }} />
              Saídas
              <span className="rep-grp-count">{despesas.length}</span>
            </span>
            <span className="rep-grp-total color-red">{formatBRL(sumOf(despesas))}</span>
          </div>
          {despesas.map((it) => (
            <div key={it.id} className="rep-item">
              <div
                className="rep-item-ic"
                style={{ background: "rgba(239,68,68,.14)", color: "#F87171" }}
              >
                ↓
              </div>
              <div className="rep-item-main">
                <strong>
                  <Highlight text={it.title} query={nameQuery} />
                </strong>
                <span>
                  {it.category} • {fmtDate(it.dateISO)}
                </span>
              </div>
              <div className="rep-item-right">
                <div className="amt color-red">− {formatBRL(it.amountCents)}</div>
                <span className="tag tag-des">Despesa</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Export sheet — rendered in document.body via portal so position:fixed
          is not affected by ancestor transforms (AnimatedPage will-change) */}
      {showExport && createPortal(
        <div className="rep-sheet-scrim" onClick={() => setShowExport(false)}>
          <div className="rep-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h4>Exportar relatório</h4>
            <p className="rep-sheet-sub">{currentPeriodLabel} · entradas e saídas</p>
            <button className="sheet-act primary" onClick={handleDownloadPdf}>
              <span
                className="si"
                style={{ background: "rgba(239,68,68,.16)", color: "#F87171" }}
              >
                {ICONS.pdf}
              </span>
              <span>
                <strong>Baixar PDF</strong>
                <small>Documento pronto para imprimir</small>
              </span>
            </button>
            <button className="sheet-act" onClick={handleShare}>
              <span
                className="si"
                style={{ background: "rgba(59,130,246,.16)", color: "#60A5FA" }}
              >
                {ICONS.share}
              </span>
              <span>
                <strong>Compartilhar</strong>
                <small>WhatsApp, e-mail, Drive…</small>
              </span>
            </button>
            <button className="sheet-cancel" onClick={() => setShowExport(false)}>
              Cancelar
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
