/* Importar Extrato — wizard step components */
const { useState } = React;
const Svg = ({ name, cls }) => (
  <span className="ix-svg" dangerouslySetInnerHTML={{ __html: window.IMPORT_ICONS.svg(name, cls) }} />
);

function brl(cents) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ───────────────── Stepper ───────────────── */
function Stepper({ step }) {
  const order = ["select", "review", "done"];
  const labels = ["Arquivo", "Revisar", "Pronto"];
  const idx = step === "reading" ? 0 : order.indexOf(step);
  return (
    <div className="ix-stepper">
      {labels.map((label, i) => (
        <React.Fragment key={label}>
          {i > 0 && <div className={`ix-step-line${i <= idx ? " is-filled" : ""}`}><span /></div>}
          <div className={`ix-step${i === idx ? " is-active" : ""}${i < idx ? " is-done" : ""}`}>
            <div className="ix-step-dot">{i < idx ? <Svg name="check" /> : i + 1}</div>
            <div className="ix-step-label">{label}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ───────────────── Status segmented control ───────────────── */
function StatusChoice({ value, onChange }) {
  return (
    <div className="ix-seg">
      <button
        type="button"
        className={`ix-seg-opt paid${value === "paid" ? " is-active" : ""}`}
        onClick={() => onChange("paid")}
      >
        <div className="ix-seg-ic"><Svg name="wallet" /></div>
        <strong>Conta no saldo agora</strong>
        <span>Já recebido / pago — entra no saldo atual</span>
        <div className="ix-seg-check"><Svg name="check" /></div>
      </button>
      <button
        type="button"
        className={`ix-seg-opt pending${value === "pending" ? " is-active" : ""}`}
        onClick={() => onChange("pending")}
      >
        <div className="ix-seg-ic"><Svg name="clock" /></div>
        <strong>Só na data prevista</strong>
        <span>A receber / a pagar — conta só no dia</span>
        <div className="ix-seg-check"><Svg name="check" /></div>
      </button>
    </div>
  );
}

/* ───────────────── Step 1 — select file ───────────────── */
function StepSelect({ defaultStatus, setDefaultStatus, onPick }) {
  const [drag, setDrag] = useState(false);
  const inputRef = React.useRef(null);

  return (
    <div className="ix-fade">
      <div style={{ marginBottom: 4 }}>
        <span className="ix-kicker">Arquivo bancário</span>
        <h1 className="ix-hero-title">Importar extrato</h1>
        <p className="ix-hero-sub">
          Envie OFX, CSV, XLSX ou PDF do banco. O Conciliaaí lê cada movimento e
          mostra uma prévia antes de lançar.
        </p>
      </div>

      <div
        className={`ix-drop${drag ? " is-drag" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onPick(); }}
      >
        <div className="ix-drop-icon"><Svg name="cloud" /></div>
        <div className="ix-drop-title">Arraste o extrato aqui</div>
        <div className="ix-drop-sub">ou toque para escolher do aparelho</div>
        <div className="ix-formats">
          {["OFX", "CSV", "XLSX", "PDF"].map((f) => <span key={f} className="ix-format">{f}</span>)}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".ofx,.csv,.xlsx,.xls,.pdf"
          hidden
          onChange={() => onPick()}
        />
      </div>

      <button type="button" className="ix-example" onClick={onPick}>
        Ver com um extrato de exemplo →
      </button>

      <div className="ix-card" style={{ marginTop: 22 }}>
        <div className="ix-field-label">
          Como lançar este extrato?
          <span className="ix-hint">padrão — dá pra ajustar item a item depois</span>
        </div>
        <StatusChoice value={defaultStatus} onChange={setDefaultStatus} />
      </div>
    </div>
  );
}

/* ───────────────── Reading state ───────────────── */
function StepReading({ progress, stepIdx }) {
  const steps = window.IMPORT_DATA.READ_STEPS;
  return (
    <div className="ix-fade">
      <div className="ix-card ix-reading">
        <div className="ix-reading-ic"><Svg name="cloud" /></div>
        <h3>Lendo o extrato</h3>
        <p>{window.IMPORT_DATA.FILE.fileName}</p>
        <div className="ix-progress"><div className="ix-progress-bar" style={{ width: progress + "%" }} /></div>
        <div className="ix-reading-step">{steps[Math.min(stepIdx, steps.length - 1)]}</div>
      </div>
    </div>
  );
}

window.ImportWizardA = { Svg, brl, Stepper, StatusChoice, StepSelect, StepReading };
