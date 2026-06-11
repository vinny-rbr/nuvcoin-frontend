/* Importar Extrato — app shell, state machine & mount */
const { useState: useS, useEffect: useE, useRef: useR } = React;
const { Stepper, StepSelect, StepReading, Svg: SvgM } = window.ImportWizardA;
const { StepReview, StepDone } = window.ImportWizardB;
const { FabMenu, PhotoFlow } = window.ImportPhoto;
const DATA = window.IMPORT_DATA;

function ImportApp() {
  const [step, setStep] = useS("select");            // select | reading | review | done
  const [defaultStatus, setDefaultStatus] = useS("paid");
  const [progress, setProgress] = useS(0);
  const [readStep, setReadStep] = useS(0);
  const [newItems, setNewItems] = useS([]);
  const [dupItems, setDupItems] = useS([]);
  const [result, setResult] = useS({ added: 0, updated: 0, skipped: 0 });
  const [fabOpen, setFabOpen] = useS(false);
  const [photoOpen, setPhotoOpen] = useS(false);
  const scrollRef = useR(null);

  function onFabSelect(key) {
    setFabOpen(false);
    if (key === "foto") setPhotoOpen(true);
    else if (key === "importar") restart();
  }

  function seed(status) {
    setNewItems(DATA.NEW_ITEMS.map((i) => ({ ...i, status, included: true })));
    // default duplicate action: update if there are changes, else keep
    setDupItems(DATA.DUP_ITEMS.map((d) => ({ ...d, action: d.changes.length ? "update" : "keep" })));
  }

  function pickFile() {
    setStep("reading");
    setProgress(0);
    setReadStep(0);
  }

  // reading animation
  useE(() => {
    if (step !== "reading") return;
    let p = 0;
    const total = DATA.READ_STEPS.length;
    const tick = setInterval(() => {
      p += 3 + Math.random() * 5;
      const clamped = Math.min(100, p);
      setProgress(clamped);
      setReadStep(Math.min(total - 1, Math.floor((clamped / 100) * total)));
      if (clamped >= 100) {
        clearInterval(tick);
        setTimeout(() => { seed(defaultStatus); setStep("review"); }, 380);
      }
    }, 110);
    return () => clearInterval(tick);
  }, [step]);

  // scroll to top on step change
  useE(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [step]);

  // ── review handlers ──
  const toggleStatus = (id) =>
    setNewItems((arr) => arr.map((i) => (i.id === id ? { ...i, status: i.status === "paid" ? "pending" : "paid" } : i)));
  const toggleInclude = (id) =>
    setNewItems((arr) => arr.map((i) => (i.id === id ? { ...i, included: !i.included } : i)));
  const applyAll = (status) => {
    setDefaultStatus(status);
    setNewItems((arr) => arr.map((i) => ({ ...i, status })));
  };
  const dupAction = (id, action) =>
    setDupItems((arr) => arr.map((d) => (d.id === id ? { ...d, action } : d)));

  function confirmImport() {
    const added = newItems.filter((i) => i.included).length;
    const updated = dupItems.filter((d) => d.action === "update").length;
    const skipped = dupItems.filter((d) => d.action === "skip").length;
    setResult({ added, updated, skipped });
    setStep("done");
  }

  function restart() {
    setStep("select");
    setProgress(0);
    setNewItems([]);
    setDupItems([]);
  }

  const addedCount = newItems.filter((i) => i.included).length;
  const updCount = dupItems.filter((d) => d.action === "update").length;
  const file = DATA.FILE;

  return (
    <div className="ix-app">
      {/* Top bar */}
      <div className="ix-topbar">
        <button className="ix-back" type="button" onClick={() => (step === "review" ? restart() : null)} aria-label="Voltar">
          <SvgM name="back" />
        </button>
        <div className="ix-topbar-title">Importar</div>
        <div className="ix-topbar-spacer" />
        <div className="ix-avatar">VI</div>
        <button className="ix-menu" type="button" aria-label="Menu"><SvgM name="menu" /></button>
      </div>

      {/* Scroll content */}
      <div className="ix-scroll" ref={scrollRef}>
        <div className="ix-stage">
          <Stepper step={step} />

          {step === "select" && (
            <StepSelect
              defaultStatus={defaultStatus}
              setDefaultStatus={setDefaultStatus}
              onPick={pickFile}
            />
          )}

          {step === "reading" && <StepReading progress={progress} stepIdx={readStep} />}

          {step === "review" && (
            <StepReview
              file={file}
              newItems={newItems}
              dupItems={dupItems}
              defaultStatus={defaultStatus}
              applyAll={applyAll}
              toggleStatus={toggleStatus}
              toggleInclude={toggleInclude}
              dupAction={dupAction}
            />
          )}

          {step === "done" && <StepDone result={result} onRestart={restart} />}
        </div>
      </div>

      {/* Sticky footer action (only on review) */}
      {step === "review" && (
        <div className="ix-footer">
          <div className="ix-footer-inner">
            <button type="button" className="ix-btn-primary" onClick={confirmImport} disabled={addedCount + updCount === 0}>
              <SvgM name="check" />
              Lançar {addedCount} {addedCount === 1 ? "novo" : "novos"}
              {updCount > 0 ? ` · atualizar ${updCount}` : ""}
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="ix-bottomnav">
        <div className="ix-nav-item"><SvgM name="home" /><span>Início</span></div>
        <div className="ix-nav-item"><SvgM name="tag" /><span>Categorias</span></div>
        <button className="ix-nav-fab" type="button" aria-label="Adicionar" onClick={() => setFabOpen(true)}><SvgM name="plus" /></button>
        <div className="ix-nav-item"><SvgM name="groups" /><span>Grupos</span></div>
        <div className="ix-nav-item is-active"><span className="ix-avatar" style={{ width: 22, height: 22, fontSize: 9 }}>V</span><span>Perfil</span></div>
      </nav>

      <FabMenu open={fabOpen} onClose={() => setFabOpen(false)} onSelect={onFabSelect} />
      {photoOpen && <PhotoFlow onClose={() => setPhotoOpen(false)} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<ImportApp />);
