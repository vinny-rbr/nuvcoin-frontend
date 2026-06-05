import { useEffect, useRef, useState } from "react";
import { financeAdd } from "../lib/financeService";
import { categoriesForType, DEFAULT_CATEGORIES, listFinanceCategories } from "../lib/financeCategoriesService";
import type { FinanceStatus, PaymentType } from "../types/finance";
import "../pages/import-extrato.css";

type PhotoStage = "source" | "reading" | "review" | "done";

const READ_STEPS = [
  "Enviando a imagem…",
  "Lendo o comprovante…",
  "Identificando valor e data…",
  "Sugerindo categoria…",
];

const PAYMENTS: { key: PaymentType; label: string }[] = [
  { key: "pix",    label: "Pix"      },
  { key: "debit",  label: "Débito"   },
  { key: "credit", label: "Crédito"  },
  { key: "cash",   label: "Dinheiro" },
];

function todayISO(): string {
  return new Date().toISOString().split("T")[0]!;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8a2 2 0 012-2h1.5l1.2-1.8A1 1 0 0110.5 4h3a1 1 0 01.8.4L15.5 6H18a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V8z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.6" />
      <path d="M5 17l4.5-4.5L13 16l3-3 3 3" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2" />
      <path d="M4 12h16" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9l1-4h14l1 4M5 9v10h14V9M4 9h16M9 19v-5h6v5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 9h16M9 3v4M15 3v4" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <rect x="3" y="6" width="18" height="12" rx="2.5" />
      <path d="M3 10h18M7 15h4" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7h15a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" strokeWidth="1.8" />
      <path d="M3 7l2.5-3h9L17 7M16 13h2" strokeWidth="1.8" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8.5" strokeWidth="1.8" />
      <path d="M12 7.5V12l3 2" strokeWidth="1.8" />
    </svg>
  );
}

function StatusChoice({
  value,
  onChange,
}: {
  value: FinanceStatus;
  onChange: (v: FinanceStatus) => void;
}) {
  return (
    <div className="ix-seg">
      <button
        type="button"
        className={`ix-seg-opt paid${value === "paid" ? " is-active" : ""}`}
        onClick={() => onChange("paid")}
      >
        <div className="ix-seg-ic"><WalletIcon /></div>
        <strong>Conta no saldo agora</strong>
        <span>Já recebido / pago — entra no saldo atual</span>
        <div className="ix-seg-check"><CheckIcon /></div>
      </button>
      <button
        type="button"
        className={`ix-seg-opt pending${value === "pending" ? " is-active" : ""}`}
        onClick={() => onChange("pending")}
      >
        <div className="ix-seg-ic"><ClockIcon /></div>
        <strong>Só na data prevista</strong>
        <span>A receber / a pagar — conta só no dia</span>
        <div className="ix-seg-check"><CheckIcon /></div>
      </button>
    </div>
  );
}

type Props = { onClose: () => void };

export default function PhotoFlow({ onClose }: Props) {
  const [stage, setStage] = useState<PhotoStage>("source");
  const [progress, setProgress] = useState(0);
  const [readStep, setReadStep] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [type, setType] = useState<"RECEITA" | "DESPESA">("DESPESA");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());
  const [payment, setPayment] = useState<PaymentType>("debit");
  const [category, setCategory] = useState("Alimentação");
  const [status, setStatus] = useState<FinanceStatus>("paid");
  const [categories, setCategories] = useState<string[]>([]);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listFinanceCategories()
      .then((cats) => {
        const income = categoriesForType(cats, "RECEITA");
        const expense = categoriesForType(cats, "DESPESA");
        const unique = [...new Set([...expense, ...income])];
        setCategories(unique.length > 0 ? unique : [...DEFAULT_CATEGORIES.DESPESA, ...DEFAULT_CATEGORIES.RECEITA]);
      })
      .catch(() => {
        setCategories([...DEFAULT_CATEGORIES.DESPESA, ...DEFAULT_CATEGORIES.RECEITA]);
      });
  }, []);

  // Reading animation
  useEffect(() => {
    if (stage !== "reading") return;
    let p = 0;
    const total = READ_STEPS.length;
    const tick = setInterval(() => {
      p += 3 + Math.random() * 5;
      const clamped = Math.min(100, p);
      setProgress(clamped);
      setReadStep(Math.min(total - 1, Math.floor((clamped / 100) * total)));
      if (clamped >= 100) {
        clearInterval(tick);
        setTimeout(() => setStage("review"), 360);
      }
    }, 110);
    return () => clearInterval(tick);
  }, [stage]);

  // Revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  function handleFileSelected(file: File) {
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setStage("reading");
    setProgress(0);
    setReadStep(0);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleFileSelected(file);
  }

  function handleConfirm() {
    const raw = parseFloat(amount.replace(",", "."));
    const amountCents = Math.round(raw * 100);
    if (!amountCents || isNaN(amountCents)) return;

    financeAdd({
      id: crypto.randomUUID(),
      type,
      title: description.trim() || "Lançamento por foto",
      amountCents,
      dateISO: date,
      category,
      status,
      paymentType: payment,
      createdAtISO: new Date().toISOString(),
    });
    setStage("done");
  }

  function handleRetake() {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
    setStage("source");
    setProgress(0);
    setReadStep(0);
    setAmount("");
    setDescription("");
    setDate(todayISO());
  }

  const isIn = type === "RECEITA";
  const amountNum = parseFloat(amount.replace(",", "."));
  const amountValid = !isNaN(amountNum) && amountNum > 0;

  const displayCats =
    categories.length > 0
      ? categories
      : ["Alimentação", "Transporte", "Moradia", "Saúde", "Lazer", "Educação", "Vendas", "Salário", "Outros"];

  const amountDisplay = amountValid
    ? amountNum.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0,00";

  return (
    <div className="ix-photo">
      <div className="ix-photo-bar">
        <button className="ix-back" type="button" onClick={onClose} aria-label="Fechar">
          <CloseIcon />
        </button>
        <span className="ttl">Lançar por foto</span>
      </div>

      {/* Source */}
      {stage === "source" && (
        <div className="ix-photo-body ix-fade">
          <div className="ix-src-hero">
            <span className="ix-kicker">Comprovante</span>
            <h1>Fotografe o comprovante</h1>
            <p>
              Tire uma foto ou escolha uma imagem da nota/recibo. Depois confira e ajuste os dados antes de lançar.
            </p>
          </div>
          <div className="ix-src-grid">
            <button
              type="button"
              className="ix-src-card cam"
              onClick={() => cameraInputRef.current?.click()}
            >
              <div className="ix-src-ic"><CameraIcon /></div>
              <strong>Tirar foto</strong>
              <span>usar a câmera</span>
            </button>
            <button
              type="button"
              className="ix-src-card gal"
              onClick={() => galleryInputRef.current?.click()}
            >
              <div className="ix-src-ic"><ImageIcon /></div>
              <strong>Escolher imagem</strong>
              <span>da galeria</span>
            </button>
          </div>
          <div className="ix-src-tip">
            <div className="ix-src-tip-ic"><SparkleIcon /></div>
            <p>
              Funciona com cupom fiscal, recibo, comprovante de Pix ou print do app do banco. Quanto mais
              nítida a foto, melhor.
            </p>
          </div>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            onChange={handleInputChange}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleInputChange}
          />
        </div>
      )}

      {/* Reading */}
      {stage === "reading" && (
        <div className="ix-photo-body ix-fade">
          <div className="ix-card ix-reading" style={{ paddingBottom: 22 }}>
            {imageUrl ? (
              <div className="ix-scan-wrap">
                <img src={imageUrl} alt="comprovante" />
                <div className="ix-scan-grid" />
                <div className="ix-scan-line" />
              </div>
            ) : (
              <div className="ix-reading-ic"><ScanIcon /></div>
            )}
            <h3 style={{ marginTop: imageUrl ? 20 : 0 }}>Lendo o comprovante</h3>
            <div className="ix-progress">
              <div className="ix-progress-bar" style={{ width: `${progress}%` }} />
            </div>
            <div className="ix-reading-step">
              {READ_STEPS[Math.min(readStep, READ_STEPS.length - 1)]}
            </div>
          </div>
        </div>
      )}

      {/* Review */}
      {stage === "review" && (
        <>
          <div className="ix-photo-body ix-fade" style={{ paddingBottom: 16 }}>
            <div className="ix-rcpt-head">
              {imageUrl && (
                <img className="ix-rcpt-thumb" src={imageUrl} alt="comprovante" />
              )}
              <div className="info">
                <span className="ix-kicker">Confira o lançamento</span>
                <h2>Preencha os dados</h2>
                <span className="ix-rcpt-read-flag">
                  <SparkleIcon />
                  Confira antes de lançar
                </span>
              </div>
            </div>

            <div className="ix-card">
              <div className="ix-type-toggle">
                <button
                  type="button"
                  className={`ix-type-opt in${isIn ? " is-active" : ""}`}
                  onClick={() => setType("RECEITA")}
                >
                  <ArrowUpIcon />Receita
                </button>
                <button
                  type="button"
                  className={`ix-type-opt out${!isIn ? " is-active" : ""}`}
                  onClick={() => setType("DESPESA")}
                >
                  <ArrowDownIcon />Despesa
                </button>
              </div>

              <div className="ix-amount-display">
                <div className="lbl">VALOR</div>
                <div className={`val ${isIn ? "in" : "out"}`}>
                  {isIn ? "+" : "−"}R$ {amountDisplay}
                </div>
              </div>

              <div className="ix-field">
                <label>Valor (R$)</label>
                <input
                  className="ix-input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="ix-field">
                <label>Descrição / Estabelecimento</label>
                <div className="ix-input-icon">
                  <StoreIcon />
                  <input
                    className="ix-input"
                    type="text"
                    placeholder="Nome do estabelecimento ou descrição"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="ix-field">
                <label>Data</label>
                <div className="ix-input-icon">
                  <CalendarIcon />
                  <input
                    className="ix-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="ix-field">
                <label>Forma de pagamento</label>
                <div className="ix-pay-chips">
                  {PAYMENTS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      className={`ix-pay-chip${payment === p.key ? " is-active" : ""}`}
                      onClick={() => setPayment(p.key)}
                    >
                      <CardIcon />{p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ix-field" style={{ marginBottom: 0 }}>
                <label>Categoria</label>
                <div className="ix-cat-chips">
                  {displayCats.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`ix-cat-chip${category === c ? " is-active" : ""}`}
                      onClick={() => setCategory(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="ix-card">
              <div className="ix-field-label" style={{ marginBottom: 10 }}>Como lançar?</div>
              <StatusChoice value={status} onChange={setStatus} />
            </div>
          </div>

          <div className="ix-photo-footer ix-photo-body" style={{ paddingTop: 0 }}>
            <button
              type="button"
              className="ix-btn-primary"
              onClick={handleConfirm}
              disabled={!amountValid}
            >
              <CheckIcon />
              Lançar {isIn ? "receita" : "despesa"}
              {amountValid ? ` · R$ ${amountDisplay}` : ""}
            </button>
            <button type="button" className="ix-btn-ghost" onClick={handleRetake}>
              Trocar foto
            </button>
          </div>
        </>
      )}

      {/* Done */}
      {stage === "done" && (
        <div className="ix-photo-body ix-fade ix-done" style={{ paddingTop: 30 }}>
          <div className="ix-done-ring"><CheckIcon /></div>
          <h2>{isIn ? "Receita" : "Despesa"} lançada!</h2>
          <p>
            {description.trim() || "Lançamento"} foi{" "}
            {status === "paid" ? "adicionado ao seu saldo" : "agendado para a data"}.
          </p>
          <button
            type="button"
            className="ix-btn-primary"
            style={{ marginTop: 18 }}
            onClick={onClose}
          >
            <CheckIcon />
            Concluir
          </button>
          <button type="button" className="ix-btn-ghost" onClick={handleRetake}>
            Lançar outro
          </button>
        </div>
      )}
    </div>
  );
}
