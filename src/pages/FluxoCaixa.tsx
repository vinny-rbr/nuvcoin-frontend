import { useEffect, useMemo, useState } from "react";
import type { FinanceItem } from "../types/finance";
import { financeList, financeRefreshFromApi, financeSubscribe } from "../lib/financeService";
import "./finance.css";

const MESES_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-");
  return `${MESES_PT[Number(month) - 1]}/${year.slice(2)}`;
}

function monthLabelFull(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getLast12Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

interface MonthData {
  key: string;
  receitasCents: number;
  despesasCents: number;
  saldoCents: number;
  categorias: Record<string, { receitasCents: number; despesasCents: number }>;
}

export default function FluxoCaixa() {
  const [items, setItems] = useState<FinanceItem[]>(() => financeList());
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  useEffect(() => {
    void financeRefreshFromApi();
    return financeSubscribe(() => setItems(financeList()));
  }, []);

  const months12 = useMemo(() => getLast12Months(), []);

  const monthData = useMemo((): MonthData[] => {
    return months12.map((key) => {
      const monthItems = items.filter((it) => monthKey(it.dateISO) === key);
      const receitasCents = monthItems
        .filter((it) => it.type === "RECEITA")
        .reduce((s, it) => s + it.amountCents, 0);
      const despesasCents = monthItems
        .filter((it) => it.type === "DESPESA")
        .reduce((s, it) => s + it.amountCents, 0);

      const categorias: Record<string, { receitasCents: number; despesasCents: number }> = {};
      for (const it of monthItems) {
        const cat = it.category || "Sem categoria";
        if (!categorias[cat]) categorias[cat] = { receitasCents: 0, despesasCents: 0 };
        if (it.type === "RECEITA") categorias[cat].receitasCents += it.amountCents;
        else categorias[cat].despesasCents += it.amountCents;
      }

      return { key, receitasCents, despesasCents, saldoCents: receitasCents - despesasCents, categorias };
    });
  }, [items, months12]);

  const maxCents = useMemo(
    () => Math.max(...monthData.map((m) => Math.max(m.receitasCents, m.despesasCents)), 1),
    [monthData],
  );

  const selectedData = useMemo(
    () => monthData.find((m) => m.key === selectedMonth) ?? null,
    [monthData, selectedMonth],
  );

  const categoryRows = useMemo(() => {
    if (!selectedData) return [];
    return Object.entries(selectedData.categorias)
      .map(([cat, vals]) => ({ cat, ...vals, total: vals.receitasCents + vals.despesasCents }))
      .sort((a, b) => b.total - a.total);
  }, [selectedData]);

  return (
    <div style={{ padding: "0 0 80px" }}>
      {/* Header */}
      <div className="dx-header">
        <div>
          <h1 className="dx-title">Fluxo de Caixa</h1>
          <p className="dx-subtitle">Entradas e saídas por mês</p>
        </div>
      </div>

      {/* Bar chart */}
      <div
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: 16,
          padding: "20px 16px 8px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 6,
            height: 140,
            overflowX: "auto",
            paddingBottom: 4,
          }}
        >
          {monthData.map((m) => {
            const recH = Math.round((m.receitasCents / maxCents) * 120);
            const despH = Math.round((m.despesasCents / maxCents) * 120);
            const isSelected = m.key === selectedMonth;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelectedMonth(m.key)}
                style={{
                  flexShrink: 0,
                  width: 44,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 3,
                    height: 120,
                  }}
                >
                  <div
                    style={{
                      width: 14,
                      height: Math.max(recH, 3),
                      borderRadius: "3px 3px 0 0",
                      background: isSelected ? "#34d399" : "rgba(52,211,153,.55)",
                      transition: "height .3s ease",
                    }}
                  />
                  <div
                    style={{
                      width: 14,
                      height: Math.max(despH, 3),
                      borderRadius: "3px 3px 0 0",
                      background: isSelected ? "#f87171" : "rgba(248,113,113,.45)",
                      transition: "height .3s ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    color: isSelected ? "var(--text-main)" : "var(--text-secondary)",
                    fontWeight: isSelected ? 700 : 400,
                    whiteSpace: "nowrap",
                  }}
                >
                  {monthLabel(m.key)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginTop: 8, paddingLeft: 4 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-secondary)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#34d399", display: "inline-block" }} />
            Receitas
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-secondary)" }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#f87171", display: "inline-block" }} />
            Despesas
          </span>
        </div>
      </div>

      {/* Selected month detail */}
      {selectedData && (
        <div style={{ display: "grid", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>
            {monthLabelFull(selectedData.key)}
          </h2>

          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              { label: "Receitas", cents: selectedData.receitasCents, color: "#34d399" },
              { label: "Despesas", cents: selectedData.despesasCents, color: "#f87171" },
              {
                label: "Saldo",
                cents: selectedData.saldoCents,
                color: selectedData.saldoCents >= 0 ? "#34d399" : "#f87171",
              },
            ].map(({ label, cents, color }) => (
              <div
                key={label}
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--card-border)",
                  borderRadius: 12,
                  padding: "14px 12px",
                  display: "grid",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{label}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color }}>{formatBRL(cents)}</span>
              </div>
            ))}
          </div>

          {/* Category breakdown */}
          {categoryRows.length > 0 && (
            <div
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--card-border)",
                borderRadius: 16,
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--card-border)" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-main)" }}>Por categoria</span>
              </div>
              {categoryRows.map(({ cat, receitasCents, despesasCents }) => (
                <div
                  key={cat}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 16px",
                    borderBottom: "1px solid var(--card-border)",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 13, color: "var(--text-main)", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {cat}
                  </span>
                  <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
                    {receitasCents > 0 && (
                      <span style={{ fontSize: 12, color: "#34d399", fontWeight: 600 }}>
                        +{formatBRL(receitasCents)}
                      </span>
                    )}
                    {despesasCents > 0 && (
                      <span style={{ fontSize: 12, color: "#f87171", fontWeight: 600 }}>
                        -{formatBRL(despesasCents)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {categoryRows.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "40px 16px",
                color: "var(--text-secondary)",
                fontSize: 14,
              }}
            >
              Nenhuma transação neste mês.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
