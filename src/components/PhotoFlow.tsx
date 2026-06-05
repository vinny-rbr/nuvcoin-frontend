import { Fragment, useEffect, useRef, useState } from "react";
import { financeAdd } from "../lib/financeService";
import { listFinanceCategories } from "../lib/financeCategoriesService";
import type { FinanceStatus, PaymentType } from "../types/finance";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { apiUrl } from "../lib/api";
import "../pages/import-extrato.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/legacy/build/pdf.worker.mjs",
  import.meta.url,
).toString();

type PhotoStage = "source" | "reading" | "review" | "done";

type CategoryNode = { id: string; name: string; children: CategoryNode[] };

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

const DEFAULT_TREE: CategoryNode[] = [
  { id: "f1",  name: "Alimentação", children: [] },
  { id: "f2",  name: "Transporte",  children: [] },
  { id: "f3",  name: "Moradia",     children: [] },
  { id: "f4",  name: "Saúde",       children: [] },
  { id: "f5",  name: "Lazer",       children: [] },
  { id: "f6",  name: "Educação",    children: [] },
  { id: "f7",  name: "Salário",     children: [] },
  { id: "f8",  name: "Vendas",      children: [] },
  { id: "f9",  name: "Outros",      children: [] },
];

function todayISO(): string {
  return new Date().toISOString().split("T")[0]!;
}

function getToken(): string | null {
  return (
    localStorage.getItem("conciliaai_token") ??
    localStorage.getItem("token") ??
    localStorage.getItem("auth_token")
  );
}

type OcrResult = {
  amount: string;
  description: string;
  date: string;
  paymentType: PaymentType | "";
  category: string;
  detectedFields: number;
};

async function ocrImage(file: File): Promise<OcrResult | null> {
  const token = getToken();
  if (!token) return null;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const comma = dataUrl.indexOf(",");
      const imageBase64 = dataUrl.slice(comma + 1);
      const mimeType = dataUrl.slice(5, comma).split(";")[0];

      try {
        const res = await fetch(apiUrl("/api/finance/receipt-ocr/image"), {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ imageBase64, mimeType }),
        });
        if (!res.ok) { resolve(null); return; }
        resolve(await res.json());
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

async function ocrPdf(file: File): Promise<OcrResult | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    let text = "";
    for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += (content.items as { str: string }[]).map((it) => it.str).join(" ") + "\n";
    }

    const res = await fetch(apiUrl("/api/finance/receipt-ocr/text"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: text.slice(0, 3000) }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function buildTree(cats: { id: string; name: string; parentId?: string | null }[]): CategoryNode[] {
  const byId = new Map<string, CategoryNode>(
    cats.map((c) => [c.id, { id: c.id, name: c.name, children: [] }]),
  );
  const roots: CategoryNode[] = [];
  for (const c of cats) {
    const node = byId.get(c.id)!;
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots.length > 0 ? roots : DEFAULT_TREE;
}

/* ── Icons ── */
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

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ChevRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
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

/* ── Status choice ── */
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

/* ── Hierarchical category picker ── */
function CategoryPicker({
  tree,
  value,
  onClose,
  onSelect,
}: {
  tree: CategoryNode[];
  value: string[];
  onClose: () => void;
  onSelect: (path: string[]) => void;
}) {
  const [stack, setStack] = useState<CategoryNode[]>([]);
  const list = stack.length ? stack[stack.length - 1]!.children : tree;
  const crumbNames = stack.map((n) => n.name);

  return (
    <div className="ix-catsheet-scrim" onClick={onClose}>
      <div className="ix-catsheet" onClick={(e) => e.stopPropagation()}>
        <div className="ix-catsheet-handle" />
        <div className="ix-catsheet-top">
          {stack.length > 0 && (
            <button
              type="button"
              className="ix-back"
              onClick={() => setStack(stack.slice(0, -1))}
              aria-label="Voltar"
            >
              <BackIcon />
            </button>
          )}
          <div className="info">
            <span className="kick">Organização</span>
            <h3>Categorias</h3>
          </div>
          <button type="button" className="closex" onClick={onClose} aria-label="Fechar">
            <CloseIcon />
          </button>
        </div>

        {crumbNames.length > 0 && (
          <div className="ix-crumbbar">
            <span className="c muted">Todas</span>
            {crumbNames.map((n, i) => (
              <Fragment key={n + i}>
                <span className="sep">›</span>
                <span className={`c${i === crumbNames.length - 1 ? "" : " muted"}`}>{n}</span>
              </Fragment>
            ))}
          </div>
        )}

        {crumbNames.length > 0 && (
          <button type="button" className="ix-cat-use" onClick={() => onSelect(crumbNames)}>
            <CheckIcon />
            Usar {crumbNames[crumbNames.length - 1]} como categoria
          </button>
        )}

        <div className="ix-catlist">
          {list.map((node) => {
            const hasKids = node.children.length > 0;
            const nodePath = [...crumbNames, node.name];
            const selected = value.join(">") === nodePath.join(">");
            return (
              <div key={node.id} className={`ix-catrow${selected ? " is-selected" : ""}`}>
                <button
                  type="button"
                  className="pickdot"
                  onClick={() => onSelect(nodePath)}
                  aria-label="Selecionar"
                >
                  <CheckIcon />
                </button>
                <button type="button" className="nm" onClick={() => onSelect(nodePath)}>
                  <strong>{node.name}</strong>
                  <span>{hasKids ? "Toque na seta para ver subcategorias" : "Selecionar esta categoria"}</span>
                </button>
                <span className="lvl">Nível {stack.length + 1}</span>
                {hasKids && (
                  <button
                    type="button"
                    className="drill"
                    onClick={() => setStack([...stack, node])}
                    aria-label="Ver subcategorias"
                  >
                    <ChevRightIcon />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
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
  const [catPath, setCatPath] = useState<string[]>(["Alimentação"]);
  const [catOpen, setCatOpen] = useState(false);
  const [status, setStatus] = useState<FinanceStatus>("paid");
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>(DEFAULT_TREE);

  const [detectedFields, setDetectedFields] = useState(0);
  const ocrResultRef = useRef<OcrResult | null>(null);
  const pendingFileRef = useRef<File | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listFinanceCategories()
      .then((cats) => {
        const tree = buildTree(cats);
        setCategoryTree(tree);
      })
      .catch(() => {
        setCategoryTree(DEFAULT_TREE);
      });
  }, []);

  useEffect(() => {
    if (stage !== "reading") return;

    let animDone = false;
    let ocrDone = false;
    let ocrResult: OcrResult | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    function applyAndTransition() {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (ocrResult) {
        if (ocrResult.amount)      setAmount(ocrResult.amount);
        if (ocrResult.description) setDescription(ocrResult.description);
        if (ocrResult.date)        setDate(ocrResult.date);
        if (ocrResult.paymentType) setPayment(ocrResult.paymentType as PaymentType);
        if (ocrResult.category)    setCatPath([ocrResult.category]);
        setDetectedFields(ocrResult.detectedFields ?? 0);
      }
      setStage("review");
    }

    function tryTransition() {
      if (animDone && ocrDone) applyAndTransition();
    }

    const file = pendingFileRef.current;
    if (file) {
      const isPdf = file.type === "application/pdf";
      const ocrPromise = isPdf ? ocrPdf(file) : ocrImage(file);
      ocrPromise.then((result) => {
        ocrResultRef.current = result;
        ocrResult = result;
        ocrDone = true;
        tryTransition();
      });
    } else {
      ocrDone = true;
    }

    let p = 0;
    const total = READ_STEPS.length;
    const tick = setInterval(() => {
      p += 3 + Math.random() * 5;
      const clamped = Math.min(100, p);
      setProgress(clamped);
      setReadStep(Math.min(total - 1, Math.floor((clamped / 100) * total)));
      if (clamped >= 100) {
        clearInterval(tick);
        setTimeout(() => {
          animDone = true;
          // fallback: if OCR takes too long, proceed anyway after 8s
          fallbackTimer = setTimeout(() => {
            ocrDone = true;
            applyAndTransition();
          }, 8000);
          tryTransition();
        }, 360);
      }
    }, 110);
    return () => {
      clearInterval(tick);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [stage]);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  function handleFileSelected(file: File) {
    pendingFileRef.current = file;
    ocrResultRef.current = null;
    const isPdf = file.type === "application/pdf";
    const url = isPdf ? null : URL.createObjectURL(file);
    setImageUrl(url);
    setStage("reading");
    setProgress(0);
    setReadStep(0);
    setDetectedFields(0);
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

    const category = catPath[catPath.length - 1] ?? "Outros";

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
    pendingFileRef.current = null;
    ocrResultRef.current = null;
    setStage("source");
    setProgress(0);
    setReadStep(0);
    setAmount("");
    setDescription("");
    setDate(todayISO());
    setDetectedFields(0);
  }

  const isIn = type === "RECEITA";
  const amountNum = parseFloat(amount.replace(",", "."));
  const amountValid = !isNaN(amountNum) && amountNum > 0;
  const category = catPath[catPath.length - 1] ?? "";

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
              Tire uma foto ou escolha uma imagem da nota/recibo. O Conciliaaí lê o valor, a data e sugere a
              categoria.
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
              <strong>Escolher arquivo</strong>
              <span>imagem ou PDF</span>
            </button>
          </div>
          <div className="ix-src-tip">
            <div className="ix-src-tip-ic"><SparkleIcon /></div>
            <p>
              Funciona com cupom fiscal, recibo, comprovante de Pix, print do banco ou PDF. O Conciliaaí lê
              automaticamente o valor, a data, a forma de pagamento e sugere a categoria.
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
            accept="image/*,application/pdf"
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
                <h2>Lido do comprovante</h2>
                <span className="ix-rcpt-read-flag">
                  <SparkleIcon />
                  {detectedFields > 0
                    ? `${detectedFields} campo${detectedFields > 1 ? "s" : ""} detectado${detectedFields > 1 ? "s" : ""}`
                    : "Confira antes de lançar"}
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
                  {isIn ? "+" : "−"}R$ {amount || "0,00"}
                </div>
              </div>

              <div className="ix-field">
                <label>Valor (R$)</label>
                <div className="ix-input-icon">
                  <WalletIcon />
                  <input
                    className="ix-input"
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
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
                <button type="button" className="ix-cat-field" onClick={() => setCatOpen(true)}>
                  <div className="ix-cat-chosen">
                    {catPath.length > 1 && (
                      <span className="crumb">{catPath.slice(0, -1).join(" › ")}</span>
                    )}
                    <span className={`leaf${category ? "" : " empty"}`}>
                      {category || "Escolher categoria"}
                    </span>
                  </div>
                  <span className="ix-cat-chev"><ChevDownIcon /></span>
                </button>
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
              {amountValid ? ` · R$ ${amount}` : ""}
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
          <div className="ix-card" style={{ textAlign: "left", marginTop: 22 }}>
            <div className="ix-txn" style={{ border: "none", background: "transparent", padding: 0 }}>
              <div className={`ix-txn-ic ${isIn ? "in" : "out"}`}>
                {isIn ? <ArrowUpIcon /> : <ArrowDownIcon />}
              </div>
              <div className="ix-txn-main">
                <div className="ix-txn-title">{description.trim() || "Lançamento"}</div>
                <div className="ix-txn-meta">
                  <span className="ix-txn-date">{date}</span>
                  <span className="ix-badge cat">{category || "Outros"}</span>
                  <span className={`ix-badge status-${status}`}>
                    {status === "paid" ? "No saldo" : "Na data"}
                  </span>
                </div>
              </div>
              <div className={`ix-txn-amount ${isIn ? "in" : "out"}`}>
                {isIn ? "+" : "−"}R$ {amount || "0,00"}
              </div>
            </div>
          </div>
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

      {catOpen && (
        <CategoryPicker
          tree={categoryTree}
          value={catPath}
          onClose={() => setCatOpen(false)}
          onSelect={(path) => { setCatPath(path); setCatOpen(false); }}
        />
      )}
    </div>
  );
}
