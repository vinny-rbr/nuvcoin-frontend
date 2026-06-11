/* Importar Extrato — review + done step components */
const { Svg: SvgB, brl: brlB } = window.ImportWizardA;

/* ───────────────── Single new transaction row ───────────────── */
function TxnRow({ item, onToggleStatus, onToggleInclude }) {
  const isIn = item.type === "RECEITA";
  return (
    <div className={`ix-txn${item.included ? "" : " is-excluded"}`}>
      <div className={`ix-txn-ic ${isIn ? "in" : "out"}`}>
        <SvgB name={isIn ? "arrowUp" : "arrowDown"} />
      </div>
      <div className="ix-txn-main">
        <div className="ix-txn-title">{item.title}</div>
        <div className="ix-txn-meta">
          <span className="ix-txn-date">{item.date}</span>
          <span className="ix-badge cat">{item.cat}</span>
        </div>
      </div>
      <div className="ix-txn-right">
        <div className={`ix-txn-amount ${isIn ? "in" : "out"}`}>
          {isIn ? "+" : "−"}{brlB(item.amount)}
        </div>
        <button
          type="button"
          className={`ix-status-pill ${item.status}`}
          onClick={() => onToggleStatus(item.id)}
          title="Tocar para alternar"
        >
          <span className="pdot" />
          {item.status === "paid" ? "no saldo" : "na data"}
        </button>
      </div>
    </div>
  );
}

/* ───────────────── Duplicate comparison card ───────────────── */
function DupCard({ item, onAction }) {
  const isIn = item.type === "RECEITA";
  const rows = [
    { key: "title", label: "Nome" },
    { key: "cat", label: "Categoria" },
    { key: "status", label: "Status" },
  ];
  const statusText = (s) => (s === "paid" ? "No saldo" : "Na data");
  const cell = (side, r) => (r.key === "status" ? statusText(side.status) : side[r.key]);

  return (
    <div className="ix-dup">
      <div className="ix-dup-head">
        <div className="ix-dup-warn"><SvgB name="warn" /></div>
        <strong>{item.title}</strong>
        <span className={`ix-dup-amt ${isIn ? "in" : "out"}`}>
          {isIn ? "+" : "−"}{brlB(item.amount)} · {item.date}
        </span>
      </div>

      <div className="ix-dup-cols">
        <div className="ix-dup-col app">
          <div className="ix-dup-col-label"><span className="ix-tag" />No app hoje</div>
          {rows.map((r) => (
            <div key={r.key} className="ix-dup-row">
              <span className="k">{r.label}</span>
              <span className="v">{cell(item.app, r)}</span>
            </div>
          ))}
        </div>
        <div className="ix-dup-col file">
          <div className="ix-dup-col-label"><span className="ix-tag" />No arquivo</div>
          {rows.map((r) => {
            const changed = item.changes.includes(r.key);
            return (
              <div key={r.key} className={`ix-dup-row${changed ? " changed" : ""}`}>
                <span className="k">{r.label}</span>
                <span className="v">{cell(item.file, r)}</span>
                {changed && <span className="ix-diff-flag">novo</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="ix-dup-actions">
        <button type="button" className={`ix-act skip${item.action === "skip" ? " is-active" : ""}`} onClick={() => onAction(item.id, "skip")}>
          <SvgB name="skip" /><span>Pular</span>
        </button>
        <button type="button" className={`ix-act keep${item.action === "keep" ? " is-active" : ""}`} onClick={() => onAction(item.id, "keep")}>
          <SvgB name="lock" /><span>Manter</span>
        </button>
        <button type="button" className={`ix-act update${item.action === "update" ? " is-active" : ""}`} onClick={() => onAction(item.id, "update")}>
          <SvgB name="refresh" /><span>Atualizar</span>
        </button>
      </div>
    </div>
  );
}

/* ───────────────── Step 2 — review ───────────────── */
function StepReview({ file, newItems, dupItems, defaultStatus, applyAll, toggleStatus, toggleInclude, dupAction }) {
  const included = newItems.filter((i) => i.included).length;
  const toUpdate = dupItems.filter((d) => d.action === "update").length;

  return (
    <div className="ix-fade">
      <div style={{ marginBottom: 14 }}>
        <span className="ix-kicker">Prévia da importação</span>
        <h1 className="ix-hero-title">Revise antes de lançar</h1>
      </div>

      <div className="ix-bankbar">
        <div className="ix-bank-ic">{file.bankInitial}</div>
        <div className="ix-bank-info">
          <strong>{file.bank}</strong>
          <span>{file.account} · {file.period}</span>
        </div>
        <span className="ix-bank-file">{file.fileName}</span>
      </div>

      <div className="ix-summary-chips">
        <span className="ix-chip read"><span className="dot" />{newItems.length + dupItems.length} lidos</span>
        <span className="ix-chip new"><span className="dot" />{newItems.length} novos</span>
        <span className="ix-chip dup"><span className="dot" />{dupItems.length} já existem</span>
      </div>

      <div className="ix-applyall">
        <span className="ix-applyall-label">Aplicar a todos os novos:</span>
        <div className="ix-mini-seg">
          <button type="button" className={`ix-mini-opt paid${defaultStatus === "paid" ? " is-active" : ""}`} onClick={() => applyAll("paid")}>No saldo</button>
          <button type="button" className={`ix-mini-opt pending${defaultStatus === "pending" ? " is-active" : ""}`} onClick={() => applyAll("pending")}>Na data</button>
        </div>
      </div>

      <div className="ix-list-head new">
        <SvgB name="arrowDown" cls="" />
        <h4>Novos lançamentos</h4>
        <span className="count">{included}/{newItems.length}</span>
      </div>
      <div className="ix-stagger">
        {newItems.map((i) => (
          <TxnRow key={i.id} item={i} onToggleStatus={toggleStatus} onToggleInclude={toggleInclude} />
        ))}
      </div>

      <div className="ix-list-head dup">
        <SvgB name="warn" />
        <h4>Já existem no app</h4>
        <span className="count">{toUpdate} p/ atualizar</span>
      </div>
      <p style={{ color: "var(--text-2)", fontSize: 12.5, lineHeight: 1.45, margin: "0 2px 12px" }}>
        Mesma data, valor e descrição parecida. Escolha o que fazer com cada um.
      </p>
      <div className="ix-stagger">
        {dupItems.map((d) => <DupCard key={d.id} item={d} onAction={dupAction} />)}
      </div>
    </div>
  );
}

/* ───────────────── Step 3 — done ───────────────── */
function StepDone({ result, onRestart }) {
  return (
    <div className="ix-fade ix-done">
      <div className="ix-done-ring"><SvgB name="check" /></div>
      <h2>Extrato importado!</h2>
      <p>Seus lançamentos já estão no Conciliaaí e o saldo foi atualizado.</p>
      <div className="ix-done-stats">
        <div className="ix-done-stat new"><div className="num">{result.added}</div><div className="lbl">NOVOS</div></div>
        <div className="ix-done-stat upd"><div className="num">{result.updated}</div><div className="lbl">ATUALIZADOS</div></div>
        <div className="ix-done-stat skip"><div className="num">{result.skipped}</div><div className="lbl">PULADOS</div></div>
      </div>
      <button type="button" className="ix-btn-primary" onClick={onRestart}>
        Importar outro extrato
      </button>
    </div>
  );
}

window.ImportWizardB = { TxnRow, DupCard, StepReview, StepDone };
