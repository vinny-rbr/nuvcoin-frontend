import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { financeUpdate } from "../lib/financeService";
import type { FinanceItem, FinanceStatus, PaymentType } from "../types/finance";
import CategoryPicker from "./CategoryPicker";

type Props = {
  item: FinanceItem;
  categoryOptions: string[];
  onClose: () => void;
  onSaved: (items: FinanceItem[]) => void;
  onDelete?: (id: string) => void;
};

function centsToStr(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseToCents(input: string): number {
  const n = input.trim().replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const v = Number(n);
  return Number.isNaN(v) || v <= 0 ? 0 : Math.round(v * 100);
}

function formatDateLong(dateISO: string): string {
  return new Date(`${dateISO}T00:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

function getRecLabel(item: FinanceItem): string {
  if (item.recurringKind === "parcelado") return "Parcelado";
  if (item.recurringKind === "fixo") return "Fixo mensal";
  return "Avulso";
}

const PAYMENT_LABELS: Record<PaymentType, string> = {
  pix: "Pix",
  debit: "Débito",
  cash: "Dinheiro",
  credit: "Crédito",
};

const PAYMENT_OPTIONS: PaymentType[] = ["pix", "debit", "cash", "credit"];

function PaymentPicker({ current, onPick, onClose }: {
  current: PaymentType;
  onPick: (p: PaymentType) => void;
  onClose: () => void;
}) {
  return (
    <div className="ed-pick-scrim" onClick={onClose}>
      <div className="ed-pick" onClick={(e) => e.stopPropagation()}>
        <div className="dx-sheet-grip" />
        <div className="ed-pick-title">Forma de pagamento</div>
        <div className="ed-pick-list">
          {PAYMENT_OPTIONS.map((p) => (
            <button key={p} type="button" className={`ed-pick-item${p === current ? " on" : ""}`} onClick={() => onPick(p)}>
              <span className="ed-pick-cat">
                <span className="ed-pick-ic" style={{ background: "rgba(96,165,250,0.16)", color: "#60a5fa" }}>💳</span>
                {PAYMENT_LABELS[p]}
              </span>
              {p === current && (
                <svg viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" width="18" height="18" style={{ marginLeft: "auto" }}>
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FinanceItemEditModal({ item, categoryOptions, onClose, onSaved, onDelete }: Props) {
  const [amountStr, setAmountStr] = useState(centsToStr(item.amountCents));
  const [status, setStatus] = useState<FinanceStatus>(item.status ?? "paid");
  const [title, setTitle] = useState(item.title);
  const [category, setCategory] = useState(item.category);
  const [dateISO, setDateISO] = useState(item.dateISO);
  const [paymentType, setPaymentType] = useState<PaymentType>(item.paymentType ?? "pix");
  const [note, setNote] = useState(item.note ?? "");
  const [tags, setTags] = useState(item.tags ?? "");
  const [ignoreInReports, setIgnoreInReports] = useState(item.ignoreInReports ?? false);
  const [showPayPicker, setShowPayPicker] = useState(false);
  const [anim, setAnim] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const isDespesa = item.type === "DESPESA";
  const accentColor = isDespesa ? "#f87171" : "#4ade80";
  const verb = isDespesa ? "despesa" : "receita";

  useEffect(() => {
    const id = window.setTimeout(() => setAnim(true), 20);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function handleSave() {
    const amountCents = parseToCents(amountStr) || item.amountCents;
    if (!title.trim()) { setError("Informe um título."); return; }
    if (amountCents <= 0) { setError("Informe um valor válido."); return; }
    setError(null);
    const updated = financeUpdate(item.id, {
      title: title.trim(), category, amountCents, dateISO, paymentType, status,
      note: note.trim() || null,
      tags: tags.trim() || null,
      ignoreInReports,
    });
    onSaved(updated);
    onClose();
  }

  function handleDeleteClick() {
    if (onDelete) onDelete(item.id);
  }

  return createPortal(
    <div
      className={`ed2-screen${anim ? " in" : ""}`}
      style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", flexDirection: "column",
        background: "radial-gradient(700px 420px at 12% -6%, rgba(59,130,246,.14), transparent 55%), #0b1120",
        color: "#f1f5f9" }}
    >
      {/* Header */}
      <header className="ed2-head">
        <button type="button" className="ed2-back" onClick={onClose} aria-label="Voltar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="20" height="20">
            <path d="m19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <span className="ed2-title">Editar {verb}</span>
        {onDelete ? (
          <button type="button" className="ed2-trash" onClick={handleDeleteClick} aria-label="Excluir">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="19" height="19">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
            </svg>
          </button>
        ) : <span style={{ width: 40 }} />}
      </header>

      {/* Body */}
      <div className="ed2-body" ref={bodyRef}>
        {error && <div className="finance-feedback" style={{ margin: "0 0 12px" }}>{error}</div>}

        {/* Value card */}
        <div className="ed2-valcard" style={{ borderColor: `${accentColor}55` }}>
          <span className="ed2-vallbl">Valor da {verb}</span>
          <div className="ed2-valrow">
            <span className="ed2-cur" style={{ color: accentColor }}>R$</span>
            <input
              className="ed2-val"
              value={amountStr}
              inputMode="decimal"
              onChange={(e) => setAmountStr(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              style={{ color: accentColor }}
            />
          </div>
          <div className="ed2-seg">
            <button
              type="button"
              className={status === "pending" ? "on pend" : ""}
              onClick={() => setStatus("pending")}
            >
              {isDespesa ? "Pendente" : "A receber"}
            </button>
            <button
              type="button"
              className={status === "paid" ? "on paid" : ""}
              onClick={() => setStatus("paid")}
            >
              {isDespesa ? "Pago" : "Recebido"}
            </button>
          </div>
        </div>

        {/* Details card */}
        <div className="ed2-card">
          <div className="ed2-field">
            <label>TÍTULO</label>
            <div className="ed2-control">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Mercado" />
            </div>
          </div>

          <div className="ed2-grid2">
            <div className="ed2-field">
              <label>DATA</label>
              <div className="ed2-control ed2-tap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="17" height="17" style={{ opacity: 0.6 }}>
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                <span>{formatDateLong(dateISO)}</span>
                <input type="date" value={dateISO} onChange={(e) => setDateISO(e.target.value)} />
              </div>
            </div>
            <div className="ed2-field">
              <label>RECORRÊNCIA</label>
              <div className="ed2-control ed2-static">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16" style={{ opacity: 0.6 }}>
                  <path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                  <path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
                <span>{getRecLabel(item)}</span>
              </div>
            </div>
          </div>

          <div className="ed2-field">
            <label>CATEGORIA</label>
            <CategoryPicker
              label=""
              value={category}
              options={categoryOptions}
              onChange={setCategory}
            />
          </div>

          {isDespesa && (
            <div className="ed2-field">
              <label>PAGAMENTO</label>
              <button type="button" className="ed2-select" onClick={() => setShowPayPicker(true)}>
                <span className="ed2-chip" style={{ color: "#60a5fa", background: "rgba(96,165,250,0.12)", borderColor: "rgba(96,165,250,0.45)" }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="15" height="15">
                    <rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/>
                  </svg>
                  {PAYMENT_LABELS[paymentType]}
                </span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="18" height="18" style={{ opacity: 0.45 }}>
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Extra fields card */}
        <div className="ed2-card">
          <div className="ed2-field">
            <label>OBSERVAÇÃO</label>
            <div className="ed2-control">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Adicione uma observação..."
                rows={3}
                style={{ resize: "none", lineHeight: "1.5" }}
              />
            </div>
          </div>

          <div className="ed2-field">
            <label>TAGS</label>
            <div className="ed2-control">
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Ex: viagem, trabalho, família"
              />
            </div>
          </div>

          <div className="ed2-field">
            <label>ANEXAR COMPROVANTE</label>
            <button type="button" className="ed2-select" style={{ opacity: 0.55, cursor: "not-allowed" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", fontSize: 14 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="17" height="17">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
                Em breve
              </span>
            </button>
          </div>

          <div className="ed2-field">
            <div className="ed2-toggle-row" onClick={() => setIgnoreInReports((v) => !v)}>
              <div>
                <span className="ed2-toggle-label">IGNORAR NOS RELATÓRIOS</span>
                <span className="ed2-toggle-sub">Este lançamento não entra nos totais</span>
              </div>
              <div className={`ed2-toggle${ignoreInReports ? " on" : ""}`}>
                <div className="ed2-toggle-thumb" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="ed2-foot">
        <button type="button" className="ed2-save" onClick={handleSave}>
          Salvar alterações
        </button>
      </div>

      {/* Payment picker sheet */}
      {showPayPicker && (
        <PaymentPicker
          current={paymentType}
          onPick={(p) => { setPaymentType(p); setShowPayPicker(false); }}
          onClose={() => setShowPayPicker(false)}
        />
      )}
    </div>,
    document.body,
  );
}
