import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import type { BankAccount, FinanceItem } from "../types/finance";
import { financeList, financeRefreshFromApi, financeSubscribe, acctMapClearByAccountId } from "../lib/financeService";
import {
  listBankAccounts,
  createBankAccount,
  updateBankAccount,
  deleteBankAccount,
  transferBetweenAccounts,
} from "../lib/bankAccountsService";
import {
  CARD_COLORS,
  BankCard,
  CardDeck,
  brandOf,
  brandFace,
  fmtBRL,
} from "../components/WalletCards";
import "./contas.css";

const BANK_LIST = ["nubank", "bb", "itau", "picpay", "inter", "c6", "caixa", "santander", "outro"];

// ── AccountDetail slide-in ────────────────────────────────────────────────────

function AccountDetail({ account, onBack, onEdit, onTransfer, onImport }: {
  account: BankAccount;
  onBack: () => void;
  onEdit: (a: BankAccount) => void;
  onTransfer: (a: BankAccount) => void;
  onImport: (a: BankAccount) => void;
}) {
  const b = brandOf(account.bank);
  const face = brandFace(account.bank, account.face);
  const [catFilter, setCatFilter] = useState("Tudo");
  const [allItems, setAllItems] = useState<FinanceItem[]>(() => financeList());

  useEffect(() => {
    setAllItems(financeList());
    // financeRefreshFromApi não seta lastWriteFromApiAt, então o subscribe
    // não é bloqueado pelo anti-rebote e chama setAllItems com dados frescos da API
    void financeRefreshFromApi().then(setAllItems).catch(() => undefined);
    return financeSubscribe(() => setAllItems(financeList()));
  }, []);

  const items = useMemo(
    () => allItems.filter(i => i.accountId === account.id),
    [allItems, account.id],
  );

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthItems = useMemo(() => items.filter(i => i.dateISO.startsWith(monthKey)), [items, monthKey]);

  const receitasCents = useMemo(() => monthItems.filter(i => i.type === "RECEITA").reduce((s, i) => s + i.amountCents, 0), [monthItems]);
  const despesasCents = useMemo(() => monthItems.filter(i => i.type === "DESPESA").reduce((s, i) => s + i.amountCents, 0), [monthItems]);

  // Weekly bars: 4 semanas do mês atual
  const weeks = useMemo(() => {
    const ws = [0, 1, 2, 3].map(() => ({ rec: 0, des: 0 }));
    for (const item of monthItems) {
      const day = Number(item.dateISO.slice(8, 10));
      const wk = Math.min(3, Math.floor((day - 1) / 7));
      if (item.type === "RECEITA") ws[wk].rec += item.amountCents;
      else ws[wk].des += item.amountCents;
    }
    return ws;
  }, [monthItems]);

  const maxW = useMemo(() => Math.max(1, ...weeks.flatMap(w => [w.rec, w.des])), [weeks]);

  const categories = useMemo(() => {
    const cats = new Set(items.map(i => i.category.split(">")[0].trim()));
    return ["Tudo", ...Array.from(cats)];
  }, [items]);

  const filtered = useMemo(() => {
    const base = catFilter === "Tudo" ? items : items.filter(i => i.category.split(">")[0].trim() === catFilter);
    return [...base].sort((a, b) => b.dateISO.localeCompare(a.dateISO));
  }, [items, catFilter]);

  const monthNames = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
  const monthLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  function fmtDate(iso: string) {
    const [, m, d] = iso.split("-");
    return `${Number(d)} ${monthNames[Number(m) - 1]}`;
  }

  return (
    <div className="cc-detail">
      <div className="cc-detail-scroll">
        <div className="cc-detail-hero" style={{ background: `radial-gradient(circle at 20% -10%, ${b.glow}, transparent 60%)` }}>
          <div className="cc-detail-topbar">
            <button type="button" className="cc-back-btn" onClick={onBack}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width={16} height={16}>
                <path d="M15 18l-6-6 6-6"/>
              </svg>
              Contas
            </button>
            <button type="button" className="cc-edit-pill" onClick={() => onEdit(account)}>Editar</button>
          </div>
          <div className="cc-detail-card-wrap">
            <BankCard account={{ ...account, face }} w={254} />
          </div>
          <div className="cc-detail-balance-wrap">
            <div className="cc-detail-account-label">{account.nick} · {account.accountType}</div>
            <div className="cc-detail-balance">{fmtBRL(account.balanceCents)}</div>
          </div>

          {/* Receitas / Despesas */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderRadius: 14, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#4ADE80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width={17} height={17} aria-hidden="true"><path d="M12 19V5M12 5l-6 6M12 5l6 6"/></svg>
              <div style={{ display: "grid", gap: 1 }}>
                <small style={{ color: "#86efac", fontSize: 11, fontWeight: 700 }}>Receitas</small>
                <strong style={{ color: "#fff", fontSize: 15, fontWeight: 800, fontFamily: "Space Grotesk, system-ui", whiteSpace: "nowrap" }}>{fmtBRL(receitasCents)}</strong>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderRadius: 14, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width={17} height={17} aria-hidden="true"><path d="M12 5v14M12 19l6-6M12 19l-6-6"/></svg>
              <div style={{ display: "grid", gap: 1 }}>
                <small style={{ color: "#fca5a5", fontSize: 11, fontWeight: 700 }}>Despesas</small>
                <strong style={{ color: "#fff", fontSize: 15, fontWeight: 800, fontFamily: "Space Grotesk, system-ui", whiteSpace: "nowrap" }}>{fmtBRL(despesasCents)}</strong>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="cc-detail-actions-row" style={{ marginTop: 10 }}>
            <button type="button" className="cc-detail-action-btn" onClick={() => onTransfer(account)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={16} height={16} aria-hidden="true">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
              Transferir
            </button>
            <button type="button" className="cc-detail-action-btn" onClick={() => onImport(account)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={16} height={16} aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Importar OFX
            </button>
          </div>
        </div>

        {/* Weekly bar chart */}
        <div style={{ padding: "14px 20px 0" }}>
          <div style={{ borderRadius: 18, border: "1px solid rgba(148,163,184,0.1)", background: "rgba(30,41,59,0.5)", padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ color: "#F1F5F9", fontWeight: 800, fontSize: 14, fontFamily: "Manrope, system-ui" }}>Movimento de {monthLabel}</span>
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#94A3B8", fontSize: 11, fontWeight: 700 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: "#22C55E", display: "inline-block" }} />Entr.
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#94A3B8", fontSize: 11, fontWeight: 700 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: "#EF4444", display: "inline-block" }} />Saíd.
                </span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: 96, gap: 14 }}>
              {weeks.map((w, i) => {
                const rh = Math.max(4, Math.round((w.rec / maxW) * 76));
                const dh = Math.max(4, Math.round((w.des / maxW) * 76));
                return (
                  <div key={i} style={{ display: "grid", justifyItems: "center", gap: 6, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 76 }}>
                      <div style={{ width: 13, height: rh, borderRadius: "4px 4px 0 0", background: "linear-gradient(180deg,#4ADE80,#16A34A)", opacity: w.rec > 0 ? 1 : 0.2 }} />
                      <div style={{ width: 13, height: dh, borderRadius: "4px 4px 0 0", background: "linear-gradient(180deg,#F87171,#DC2626)", opacity: w.des > 0 ? 1 : 0.2 }} />
                    </div>
                    <span style={{ color: "#64748B", fontSize: 10.5, fontWeight: 700 }}>S{i + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Movimentações section */}
        <div style={{ padding: "14px 20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 2px 10px" }}>
            <h3 style={{ fontFamily: "Space Grotesk, system-ui", fontWeight: 700, fontSize: 17, color: "#F1F5F9", margin: 0 }}>
              Movimentações <span style={{ color: "#64748B", fontSize: 13, fontWeight: 600 }}>({items.length})</span>
            </h3>
          </div>

          {/* Category filter chips */}
          {categories.length > 1 && (
            <div style={{ display: "flex", gap: 7, overflowX: "auto", margin: "0 -2px 10px", padding: "0 2px 6px", scrollbarWidth: "none" }}>
              {categories.map(c => (
                <button key={c} type="button" onClick={() => setCatFilter(c)} style={{
                  flexShrink: 0, padding: "7px 13px", borderRadius: 999, cursor: "pointer",
                  fontFamily: "Manrope, system-ui", fontWeight: 700, fontSize: 12.5, whiteSpace: "nowrap",
                  border: catFilter === c ? "1px solid rgba(96,165,250,0.4)" : "1px solid rgba(148,163,184,0.16)",
                  background: catFilter === c ? "rgba(59,130,246,0.16)" : "rgba(15,23,42,0.5)",
                  color: catFilter === c ? "#bfdbfe" : "#94A3B8",
                }}>{c}</button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ display: "grid", placeItems: "center", textAlign: "center", padding: "32px 0 8px", gap: 12 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width={32} height={32} aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
              <p style={{ color: "#64748B", fontSize: 13, fontWeight: 600, maxWidth: 260, lineHeight: 1.5, margin: 0 }}>
                Nenhuma movimentação vinculada a esta conta ainda.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 1 }}>
              {filtered.map(item => {
                const isIn = item.type === "RECEITA";
                return (
                  <div key={item.id} style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "12px 4px",
                    borderBottom: "1px solid rgba(148,163,184,0.07)",
                  }}>
                    <span style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: isIn ? "rgba(34,197,94,0.14)" : "rgba(239,68,68,0.13)",
                      display: "grid", placeItems: "center",
                    }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke={isIn ? "#4ADE80" : "#F87171"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={15} height={15} aria-hidden="true">
                        {isIn ? <><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></> : <><path d="M12 5v14"/><path d="M6 13l6 6 6-6"/></>}
                      </svg>
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                      <div style={{ color: "#64748B", fontSize: 11.5, fontWeight: 600 }}>{item.category} · {fmtDate(item.dateISO)}</div>
                    </div>
                    <strong style={{ color: isIn ? "#4ADE80" : "#F87171", fontWeight: 800, fontSize: 14.5, fontFamily: "Space Grotesk, system-ui", flexShrink: 0 }}>
                      {isIn ? "+" : "−"}{fmtBRL(item.amountCents)}
                    </strong>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sheet wrapper ─────────────────────────────────────────────────────────────

function Sheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return createPortal(
    <div className="cc-sheet-backdrop" onClick={onClose}>
      <div className="cc-sheet" onClick={e => e.stopPropagation()}>
        <div className="cc-sheet-handle" />
        {children}
      </div>
    </div>,
    document.body,
  );
}

// ── CadastroSheet ─────────────────────────────────────────────────────────────

function CadastroSheet({ onClose, onDone }: { onClose: () => void; onDone: (data: Omit<BankAccount, "id" | "userId" | "createdAtUtc" | "updatedAtUtc">) => void }) {
  const [step, setStep] = useState<"bank" | "form" | "done">("bank");
  const [bank, setBank] = useState("nubank");
  const [nick, setNick] = useState("");
  const [accountType, setAccountType] = useState("Conta corrente");
  const [color, setColor] = useState("auto");

  const previewFace = color === "auto" ? brandOf(bank).face : (CARD_COLORS.find(c => c.id === color)?.face ?? brandOf(bank).face);
  const previewAcc: BankAccount = { id: "", userId: "", nick: nick || brandOf(bank).name, bank, accountType, last4: "0000", balanceCents: 0, face: previewFace, createdAtUtc: "" };

  function finish() {
    const face = color === "auto" ? null : CARD_COLORS.find(c => c.id === color)?.face ?? null;
    onDone({ nick: nick || brandOf(bank).name, bank, accountType, last4: String(Math.floor(1000 + Math.random() * 9000)), balanceCents: 0, face });
    onClose();
  }

  return (
    <Sheet onClose={onClose}>
      {step === "bank" && (
        <div className="cc-sheet-content">
          <div className="cc-sheet-title">Adicionar banco</div>
          <div className="cc-sheet-sub">Escolha a instituição. Você pode cadastrar quantos bancos quiser.</div>
          <div className="cc-bank-grid">
            {BANK_LIST.map(id => (
              <button key={id} type="button" className="cc-bank-pick" onClick={() => { setBank(id); setNick(brandOf(id).name); setStep("form"); }}>
                {(() => { const { Logo, face } = brandOf(id); return (
                  <span className="cc-bank-icon" style={{ background: face, display: "grid", placeItems: "center" }}><Logo s={13} /></span>
                ); })()}
                <span className="cc-bank-pick-label">{brandOf(id).name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "form" && (
        <div className="cc-sheet-content">
          <div className="cc-sheet-back-row">
            <button type="button" className="cc-back-circle" onClick={() => setStep("bank")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width={16} height={16}><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div>
              <div className="cc-sheet-title">{brandOf(bank).name}</div>
              <div className="cc-sheet-sub" style={{ marginTop: 1 }}>Como você quer chamar essa conta?</div>
            </div>
          </div>

          <div className="cc-preview-wrap">
            <BankCard account={previewAcc} w={230} />
          </div>

          <label className="cc-field">
            <span className="cc-field-label">Apelido da conta</span>
            <input className="cc-input" value={nick} onChange={e => setNick(e.target.value)} placeholder={`Ex: ${brandOf(bank).name} principal`} />
          </label>

          <div className="cc-field">
            <span className="cc-field-label">Tipo de conta</span>
            <div className="cc-type-grid">
              {["Conta corrente", "Poupança", "Cartão de crédito"].map(t => (
                <button key={t} type="button" className={`cc-type-btn${accountType === t ? " is-active" : ""}`} onClick={() => setAccountType(t)}>{t}</button>
              ))}
            </div>
          </div>

          <div className="cc-field">
            <span className="cc-field-label">Cor do cartão</span>
            <div className="cc-color-row">
              {CARD_COLORS.map(c => (
                <button key={c.id} type="button" className={`cc-color-swatch${color === c.id ? " is-active" : ""}`}
                  style={{ background: c.id === "auto" ? "conic-gradient(from 180deg,#9F37E8,#3B82F6,#22C55E,#EC7000,#9F37E8)" : (c.face ?? "") }}
                  onClick={() => setColor(c.id)} />
              ))}
            </div>
          </div>

          <button type="button" className="cc-primary-btn" onClick={() => setStep("done")}>Salvar conta</button>
        </div>
      )}

      {step === "done" && (
        <div className="cc-sheet-content cc-done-state">
          <div className="cc-done-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" width={34} height={34} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div className="cc-sheet-title">Conta adicionada!</div>
          <div className="cc-sheet-sub">{nick || brandOf(bank).name} agora aparece no seu saldo em contas.</div>
          <button type="button" className="cc-primary-btn" onClick={finish} style={{ marginTop: 8 }}>Concluir</button>
        </div>
      )}
    </Sheet>
  );
}

// ── EditSheet ─────────────────────────────────────────────────────────────────

function EditSheet({ account, onClose, onSave, onDelete }: {
  account: BankAccount;
  onClose: () => void;
  onSave: (patch: { nick: string; accountType: string; face?: string | null }) => void;
  onDelete: () => void;
}) {
  const [nick, setNick] = useState(account.nick);
  const [accountType, setAccountType] = useState(account.accountType);
  const [color, setColor] = useState("keep");
  const [confirmDel, setConfirmDel] = useState(false);

  const colors = [{ id: "keep", face: brandFace(account.bank, account.face) }, ...CARD_COLORS];
  const previewFace =
    color === "keep" ? brandFace(account.bank, account.face)
    : color === "auto" ? brandOf(account.bank).face
    : CARD_COLORS.find(c => c.id === color)?.face ?? brandOf(account.bank).face;

  const previewAcc: BankAccount = { ...account, face: previewFace, nick };

  function save() {
    const face = color === "keep" ? account.face : color === "auto" ? null : CARD_COLORS.find(c => c.id === color)?.face ?? null;
    onSave({ nick: nick || account.nick, accountType, face });
    onClose();
  }

  return (
    <Sheet onClose={onClose}>
      <div className="cc-sheet-content">
        <div className="cc-sheet-title">Editar conta</div>
        <div className="cc-preview-wrap">
          <BankCard account={previewAcc} w={224} />
        </div>

        <label className="cc-field">
          <span className="cc-field-label">Apelido da conta</span>
          <input className="cc-input" value={nick} onChange={e => setNick(e.target.value)} />
        </label>

        <div className="cc-field">
          <span className="cc-field-label">Tipo de conta</span>
          <div className="cc-type-grid">
            {["Conta corrente", "Poupança", "Cartão de crédito"].map(t => (
              <button key={t} type="button" className={`cc-type-btn${accountType === t ? " is-active" : ""}`} onClick={() => setAccountType(t)}>{t}</button>
            ))}
          </div>
        </div>

        <div className="cc-field">
          <span className="cc-field-label">Cor do cartão</span>
          <div className="cc-color-row">
            {colors.map(c => (
              <button key={c.id} type="button" className={`cc-color-swatch${color === c.id ? " is-active" : ""}`}
                style={{ background: c.id === "auto" ? "conic-gradient(from 180deg,#9F37E8,#3B82F6,#22C55E,#EC7000,#9F37E8)" : (c.face ?? "") }}
                onClick={() => setColor(c.id)} />
            ))}
          </div>
        </div>

        <button type="button" className="cc-primary-btn" onClick={save}>Salvar alterações</button>

        {!confirmDel ? (
          <button type="button" className="cc-ghost-btn cc-ghost-btn-danger" onClick={() => setConfirmDel(true)}>Excluir conta</button>
        ) : (
          <div className="cc-confirm-delete">
            <span className="cc-confirm-delete-text">Excluir {account.nick} permanentemente?</span>
            <div className="cc-confirm-delete-btns">
              <button type="button" className="cc-ghost-btn" onClick={() => setConfirmDel(false)}>Cancelar</button>
              <button type="button" className="cc-danger-btn" onClick={() => { onDelete(); onClose(); }}>Excluir</button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

// ── TransferSheet ─────────────────────────────────────────────────────────────

function TransferSheet({ accounts, defaultFrom, onClose, onConfirm }: {
  accounts: BankAccount[];
  defaultFrom?: string;
  onClose: () => void;
  onConfirm: (fromId: string, toId: string, cents: number) => void;
}) {
  const [from, setFrom] = useState(defaultFrom ?? accounts[0]?.id ?? "");
  const [to, setTo] = useState(accounts.find(a => a.id !== (defaultFrom ?? accounts[0]?.id))?.id ?? "");
  const [cents, setCents] = useState(0);
  const [done, setDone] = useState(false);

  const fromAcc = accounts.find(a => a.id === from);
  const toAcc = accounts.find(a => a.id === to);
  const valid = cents > 0 && from !== to && fromAcc != null && cents <= fromAcc.balanceCents;

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = (e.target.value.match(/\d/g) ?? []).join("");
    setCents(parseInt(digits || "0", 10));
  }

  function picker(value: string, setValue: (id: string) => void, exclude: string) {
    return (
      <div className="cc-transfer-chips">
        {accounts.filter(a => a.id !== exclude).map(a => {
          const on = value === a.id;
          return (
            <button key={a.id} type="button" className={`cc-transfer-chip${on ? " is-active" : ""}`} onClick={() => setValue(a.id)}>
              {(() => { const { Logo } = brandOf(a.bank); return (
                <span className="cc-chip-icon" style={{ background: brandFace(a.bank, a.face), display: "grid", placeItems: "center" }}><Logo s={10} /></span>
              ); })()}
              {a.nick}
            </button>
          );
        })}
      </div>
    );
  }

  if (done) {
    return (
      <Sheet onClose={onClose}>
        <div className="cc-sheet-content cc-done-state">
          <div className="cc-done-icon cc-done-icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" width={34} height={34} aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div className="cc-sheet-title">Transferência registrada!</div>
          <div className="cc-sheet-sub">{fmtBRL(cents)} de {fromAcc?.nick} para {toAcc?.nick}. Não conta como receita nem despesa.</div>
          <button type="button" className="cc-primary-btn" onClick={onClose} style={{ marginTop: 8 }}>Concluir</button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet onClose={onClose}>
      <div className="cc-sheet-content">
        <div className="cc-sheet-title">Transferência entre contas</div>
        <div className="cc-sheet-sub">Mova dinheiro entre seus bancos sem virar despesa ou receita.</div>

        <div className="cc-field">
          <span className="cc-field-label">De</span>
          {picker(from, (id) => { setFrom(id); if (id === to) setTo(accounts.find(a => a.id !== id)?.id ?? ""); }, "")}
        </div>

        <div className="cc-transfer-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={16} height={16} aria-hidden="true"><path d="M12 5v14"/><path d="m6 13 6 6 6-6"/></svg>
        </div>

        <div className="cc-field">
          <span className="cc-field-label">Para</span>
          {picker(to, setTo, from)}
        </div>

        <div className="cc-field">
          <span className="cc-field-label">Valor</span>
          <div className="cc-money-wrap">
            <span className="cc-money-prefix">R$</span>
            <input
              className="cc-money-input"
              inputMode="numeric"
              value={(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              onChange={handleAmountChange}
            />
          </div>
          {fromAcc && (
            <span className={`cc-balance-hint${cents > fromAcc.balanceCents ? " is-error" : ""}`}>
              Saldo em {fromAcc.nick}: {fmtBRL(fromAcc.balanceCents)}{cents > fromAcc.balanceCents ? " · saldo insuficiente" : ""}
            </span>
          )}
        </div>

        <button
          type="button"
          className="cc-primary-btn"
          style={{ opacity: valid ? 1 : 0.4, pointerEvents: valid ? "auto" : "none" }}
          onClick={() => { onConfirm(from, to, cents); setDone(true); }}
        >
          Transferir {cents > 0 ? fmtBRL(cents) : ""}
        </button>
      </div>
    </Sheet>
  );
}

// ── QuickAddMenu ──────────────────────────────────────────────────────────────

function QuickAddMenu({ onClose, onAdd, onImport, onTransfer }: {
  onClose: () => void;
  onAdd: () => void;
  onImport: () => void;
  onTransfer: () => void;
}) {
  const navigate = useNavigate();

  function item(
    icon: React.ReactNode,
    color: string,
    label: string,
    sub: string,
    onClick: () => void,
  ) {
    return (
      <button type="button" onClick={onClick} style={{
        display: "flex", alignItems: "center", gap: 13, width: "100%", padding: "13px 14px", borderRadius: 15,
        border: "1px solid rgba(148,163,184,0.12)", background: "rgba(30,41,59,0.6)", cursor: "pointer", textAlign: "left",
      }}>
        <span style={{ width: 40, height: 40, borderRadius: 12, background: `${color}22`, display: "grid", placeItems: "center", flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: "#F1F5F9", fontWeight: 800, fontSize: 14.5, fontFamily: "Manrope, system-ui" }}>{label}</div>
          <div style={{ color: "#64748B", fontSize: 12, fontWeight: 600 }}>{sub}</div>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={16} height={16} aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    );
  }

  return (
    <Sheet onClose={onClose}>
      <div style={{ display: "grid", gap: 10 }}>
        <div className="cc-sheet-title" style={{ marginBottom: 4 }}>Adicionar</div>
        {item(
          <svg viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={19} height={19} aria-hidden="true"><path d="M3 9.5 12 4l9 5.5"/><path d="M5 10v8M10 10v8M14 10v8M19 10v8"/><path d="M3 20h18"/></svg>,
          "#60A5FA", "Novo banco", "Cadastrar conta ou cartão",
          () => { onClose(); onAdd(); }
        )}
        {item(
          <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={19} height={19} aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>,
          "#a78bfa", "Importar extrato", "OFX, CSV, XLSX ou PDF",
          () => { onClose(); onImport(); }
        )}
        {item(
          <svg viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={19} height={19} aria-hidden="true"><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18v3"/><path d="M3 7v10.5A2.5 2.5 0 0 0 5.5 20H20a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H5.5"/><circle cx="16.5" cy="13.5" r="1.2" fill="#2dd4bf" stroke="none"/></svg>,
          "#2dd4bf", "Transferência", "Mover entre suas contas",
          () => { onClose(); onTransfer(); }
        )}
        {item(
          <svg viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={19} height={19} aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>,
          "#22C55E", "Nova receita", "Lançar entrada manual",
          () => { onClose(); navigate("/receitas"); }
        )}
        {item(
          <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={19} height={19} aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>,
          "#EF4444", "Nova despesa", "Lançar saída manual",
          () => { onClose(); navigate("/despesas"); }
        )}
      </div>
    </Sheet>
  );
}

// ── OfxSheet (simplified — routes to the full importer) ───────────────────────

function OfxSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();

  return (
    <Sheet onClose={onClose}>
      <div style={{ display: "grid", gap: 16 }}>
        <div>
          <div className="cc-sheet-title">Importar extrato</div>
          <div className="cc-sheet-sub">Envie um arquivo do banco (OFX, CSV, XLSX ou PDF). A gente reconhece o banco e organiza tudo.</div>
        </div>
        <div style={{ display: "grid", placeItems: "center", gap: 8, padding: "22px", borderRadius: 18, border: "1.5px dashed rgba(167,139,250,0.4)", background: "rgba(167,139,250,0.08)" }}>
          <span style={{ width: 52, height: 52, borderRadius: 15, background: "rgba(167,139,250,0.18)", display: "grid", placeItems: "center" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={24} height={24} aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>
          </span>
          <span style={{ color: "#94A3B8", fontSize: 12.5, fontWeight: 600 }}>arraste aqui ou escolha um arquivo</span>
        </div>
        <button type="button" className="cc-primary-btn" onClick={() => { onClose(); navigate("/importar-ofx"); }}>
          Abrir importador de extrato
        </button>
        <button type="button" className="cc-ghost-btn" onClick={onClose}>Cancelar</button>
      </div>
    </Sheet>
  );
}

// ── Main Contas page ──────────────────────────────────────────────────────────

type ActiveSheet = "add" | "edit" | "transfer" | "ofx" | "fab" | null;

export default function Contas() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<BankAccount | null>(null);
  const [sheet, setSheet] = useState<ActiveSheet>(null);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [transferFrom, setTransferFrom] = useState<string | undefined>();

  useEffect(() => {
    function handler() { setSheet("fab"); }
    window.addEventListener("conciliaai:open-quick-add-accounts", handler);
    return () => window.removeEventListener("conciliaai:open-quick-add-accounts", handler);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listBankAccounts();
      setAccounts(data);
      setError(null);
    } catch {
      setError("Não foi possível carregar suas contas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const totalBalance = accounts.reduce((s, a) => s + a.balanceCents, 0);

  async function handleAdd(data: Omit<BankAccount, "id" | "userId" | "createdAtUtc" | "updatedAtUtc">) {
    try {
      const created = await createBankAccount(data);
      setAccounts(prev => [created, ...prev]);
    } catch {
      window.alert("Erro ao cadastrar conta.");
    }
  }

  async function handleSave(patch: { nick: string; accountType: string; face?: string | null }) {
    if (!editing) return;
    try {
      const updated = await updateBankAccount(editing.id, patch);
      setAccounts(prev => prev.map(a => a.id === updated.id ? updated : a));
      if (detail?.id === updated.id) setDetail(updated);
    } catch {
      window.alert("Erro ao salvar alterações.");
    }
  }

  async function handleDelete() {
    if (!editing) return;
    try {
      await deleteBankAccount(editing.id);
      acctMapClearByAccountId(editing.id);
      setAccounts(prev => prev.filter(a => a.id !== editing.id));
      if (detail?.id === editing.id) setDetail(null);
    } catch {
      window.alert("Erro ao excluir conta.");
    }
  }

  async function handleTransfer(fromId: string, toId: string, cents: number) {
    try {
      const result = await transferBetweenAccounts(fromId, toId, cents);
      setAccounts(prev => prev.map(a => {
        if (a.id === fromId) return { ...a, balanceCents: result.fromBalance };
        if (a.id === toId) return { ...a, balanceCents: result.toBalance };
        return a;
      }));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Erro na transferência.");
    }
  }

  return (
    <div className="cc-page">
      {detail ? (
        <AccountDetail
          account={detail}
          onBack={() => setDetail(null)}
          onEdit={(a) => { setEditing(a); setSheet("edit"); }}
          onTransfer={(a) => { setTransferFrom(a.id); setSheet("transfer"); }}
          onImport={() => setSheet("ofx")}
        />
      ) : (
        <>
          <div className="cc-page-header">
            <span className="cc-page-eyebrow">CARTEIRAS</span>
            <h1 className="cc-page-title">Suas contas</h1>
            <p className="cc-page-sub">
              {accounts.length} {accounts.length === 1 ? "banco" : "bancos"} · saldo total{" "}
              <strong className="cc-total-balance">{fmtBRL(totalBalance)}</strong>
            </p>
          </div>

          {loading ? (
            <div className="cc-loading"><div className="cc-spinner" /></div>
          ) : error ? (
            <div className="cc-error">
              {error}
              <button type="button" onClick={load} className="cc-retry-btn">Tentar novamente</button>
            </div>
          ) : (
            <>
              <div className="cc-deck-section">
                <CardDeck
                  accounts={accounts}
                  onSelect={(a) => setDetail(a)}
                  onAdd={() => setSheet("add")}
                  w={Math.min(290, window.innerWidth - 48)}
                />
              </div>

              {accounts.length > 0 && (
                <div className="cc-list-section">
                  <div className="cc-section-title">Lista de contas</div>
                  <div className="cc-account-list">
                    {accounts.map((acc, i) => {
                      const face = brandFace(acc.bank, acc.face);
                      const { Logo } = brandOf(acc.bank);
                      return (
                        <button key={acc.id} type="button" className="cc-account-row" onClick={() => setDetail(acc)}
                          style={{ borderTop: i > 0 ? "1px solid rgba(148,163,184,.08)" : "none" }}>
                          <span className="cc-row-icon" style={{ background: face, display: "grid", placeItems: "center" }}><Logo s={15} /></span>
                          <div className="cc-row-info">
                            <div className="cc-row-nick">{acc.nick}</div>
                            <div className="cc-row-sub">{acc.accountType} · ••{acc.last4}</div>
                          </div>
                          <div className="cc-row-right">
                            <div className="cc-row-balance">{fmtBRL(acc.balanceCents)}</div>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={15} height={15} aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {accounts.length > 1 && (
                <button type="button" className="cc-transfer-banner" onClick={() => { setTransferFrom(undefined); setSheet("transfer"); }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={18} height={18} aria-hidden="true">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                  </svg>
                  Transferência entre contas
                </button>
              )}

              <button type="button" className="cc-ofx-import-btn" onClick={() => setSheet("ofx")}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#c4b5fd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={18} height={18} aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>
                Importar extrato (OFX)
              </button>
            </>
          )}
        </>
      )}

      {sheet === "fab" && (
        <QuickAddMenu
          onClose={() => setSheet(null)}
          onAdd={() => setSheet("add")}
          onImport={() => setSheet("ofx")}
          onTransfer={() => { setTransferFrom(undefined); setSheet("transfer"); }}
        />
      )}
      {sheet === "add" && (
        <CadastroSheet onClose={() => setSheet(null)} onDone={handleAdd} />
      )}
      {sheet === "edit" && editing && (
        <EditSheet account={editing} onClose={() => { setSheet(null); setEditing(null); }} onSave={handleSave} onDelete={handleDelete} />
      )}
      {sheet === "transfer" && accounts.length >= 2 && (
        <TransferSheet accounts={accounts} defaultFrom={transferFrom} onClose={() => setSheet(null)} onConfirm={handleTransfer} />
      )}
      {sheet === "ofx" && (
        <OfxSheet onClose={() => setSheet(null)} />
      )}
    </div>
  );
}
