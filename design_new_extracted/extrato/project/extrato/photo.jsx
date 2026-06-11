/* FAB action menu + Lançar por foto flow */
const { useState: useSP, useEffect: useEP, useRef: useRP } = React;
const SvgP = window.ImportWizardA.Svg;
const StatusChoiceP = window.ImportWizardA.StatusChoice;
const DP = window.IMPORT_DATA;

/* ───────── FAB action menu ───────── */
function FabMenu({ open, onClose, onSelect }) {
  if (!open) return null;
  const opts = [
    { key: "receita", label: "Nova receita", color: "#22C55E" },
    { key: "despesa", label: "Nova despesa", color: "#EF4444" },
    { key: "importar", label: "Importar extrato", color: "#A78BFA" },
    { key: "foto", label: "Lançar por foto", color: "#60A5FA", cls: "photo", novo: "blue" },
    { key: "relatorios", label: "Relatórios", color: "#2DD4BF", cls: "feature", novo: true },
  ];
  return (
    <React.Fragment>
      <div className="ix-fab-scrim" onClick={onClose} />
      <div className="ix-fab-menu">
        {opts.map((o) => (
          <button key={o.key} type="button" className={`ix-fab-opt ${o.cls || ""}`} onClick={() => onSelect(o.key)}>
            <span className="fdot" style={{ background: o.color, color: o.color }} />
            <span className="flabel">{o.label}</span>
            {o.novo && <span className={`ix-novo ${o.novo === "blue" ? "blue" : ""}`}>NOVO</span>}
          </button>
        ))}
      </div>
      <button type="button" className="ix-fab-close" onClick={onClose} aria-label="Fechar">
        <SvgP name="close" />
      </button>
    </React.Fragment>
  );
}

/* ───────── Photo flow ───────── */
function PhotoFlow({ onClose }) {
  const R = DP.RECEIPT;
  const [stage, setStage] = useSP("source");   // source | reading | review | done
  const [progress, setProgress] = useSP(0);
  const [readStep, setReadStep] = useSP(0);

  // editable fields (prefilled from the receipt read)
  const [type, setType] = useSP(R.type);
  const [amount, setAmount] = useSP("15,03");
  const [store, setStore] = useSP(R.store);
  const [date, setDate] = useSP("05/06/2026");
  const [payment, setPayment] = useSP(R.payment);
  const [catPath, setCatPath] = useSP(["PESSOA FISICA", "ALIMENTAÇÃO", "MERCADO"]);
  const [catOpen, setCatOpen] = useSP(false);
  const [status, setStatus] = useSP("paid");
  const category = catPath[catPath.length - 1];

  function capture() { setStage("reading"); setProgress(0); setReadStep(0); }

  useEP(() => {
    if (stage !== "reading") return;
    let p = 0; const total = DP.PHOTO_STEPS.length;
    const t = setInterval(() => {
      p += 3 + Math.random() * 5;
      const c = Math.min(100, p);
      setProgress(c);
      setReadStep(Math.min(total - 1, Math.floor((c / 100) * total)));
      if (c >= 100) { clearInterval(t); setTimeout(() => setStage("review"), 360); }
    }, 110);
    return () => clearInterval(t);
  }, [stage]);

  const isIn = type === "RECEITA";

  return (
    <div className="ix-photo">
      <div className="ix-photo-bar">
        <button className="ix-back" type="button" onClick={onClose} aria-label="Fechar"><SvgP name="close" /></button>
        <span className="ttl">Lançar por foto</span>
      </div>

      {/* ── Source ── */}
      {stage === "source" && (
        <div className="ix-photo-body ix-fade">
          <div className="ix-src-hero">
            <span className="ix-kicker">Comprovante</span>
            <h1>Fotografe o comprovante</h1>
            <p>Tire uma foto ou escolha uma imagem da nota/recibo. O Conciliaaí lê o valor, a data e sugere a categoria.</p>
          </div>
          <div className="ix-src-grid">
            <button type="button" className="ix-src-card cam" onClick={capture}>
              <div className="ix-src-ic"><SvgP name="camera" /></div>
              <strong>Tirar foto</strong>
              <span>usar a câmera</span>
            </button>
            <button type="button" className="ix-src-card gal" onClick={capture}>
              <div className="ix-src-ic"><SvgP name="image" /></div>
              <strong>Escolher imagem</strong>
              <span>da galeria</span>
            </button>
          </div>
          <div className="ix-src-tip">
            <div className="ix-src-tip-ic"><SvgP name="sparkle" /></div>
            <p>Funciona com cupom fiscal, recibo, comprovante de Pix ou print do app do banco. Quanto mais nítida a foto, melhor a leitura.</p>
          </div>
        </div>
      )}

      {/* ── Reading ── */}
      {stage === "reading" && (
        <div className="ix-photo-body ix-fade">
          <div className="ix-card ix-reading" style={{ paddingBottom: 22 }}>
            <div className="ix-scan-wrap">
              <img src={R.image} alt="comprovante" />
              <div className="ix-scan-grid" />
              <div className="ix-scan-line" />
            </div>
            <h3 style={{ marginTop: 20 }}>Lendo o comprovante</h3>
            <div className="ix-progress"><div className="ix-progress-bar" style={{ width: progress + "%" }} /></div>
            <div className="ix-reading-step">{DP.PHOTO_STEPS[Math.min(readStep, DP.PHOTO_STEPS.length - 1)]}</div>
          </div>
        </div>
      )}

      {/* ── Review ── */}
      {stage === "review" && (
        <React.Fragment>
          <div className="ix-photo-body ix-fade" style={{ paddingBottom: 16 }}>
            <div className="ix-rcpt-head">
              <img className="ix-rcpt-thumb" src={R.image} alt="comprovante" />
              <div className="info">
                <span className="ix-kicker">Confira o lançamento</span>
                <h2>Lido do comprovante</h2>
                <span className="ix-rcpt-read-flag"><SvgP name="sparkle" />4 campos detectados</span>
              </div>
            </div>

            <div className="ix-card">
              <div className="ix-type-toggle">
                <button type="button" className={`ix-type-opt in${isIn ? " is-active" : ""}`} onClick={() => setType("RECEITA")}>
                  <SvgP name="arrowUp" />Receita
                </button>
                <button type="button" className={`ix-type-opt out${!isIn ? " is-active" : ""}`} onClick={() => setType("DESPESA")}>
                  <SvgP name="arrowDown" />Despesa
                </button>
              </div>

              <div className="ix-amount-display">
                <div className="lbl">VALOR</div>
                <div className={`val ${isIn ? "in" : "out"}`}>{isIn ? "+" : "−"}R$ {amount || "0,00"}</div>
              </div>

              <div className="ix-field">
                <label>Valor (R$)</label>
                <div className="ix-input-icon">
                  <SvgP name="wallet" />
                  <input className="ix-input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
              </div>

              <div className="ix-field">
                <label>Descrição / Estabelecimento</label>
                <div className="ix-input-icon">
                  <SvgP name="store" />
                  <input className="ix-input" value={store} onChange={(e) => setStore(e.target.value)} placeholder="Nome do estabelecimento ou descrição" />
                </div>
              </div>

              <div className="ix-field">
                <label>Data</label>
                <div className="ix-input-icon">
                  <SvgP name="calendar" />
                  <input className="ix-input" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>

              <div className="ix-field">
                <label>Forma de pagamento</label>
                <div className="ix-pay-chips">
                  {DP.PAYMENTS.map((p) => (
                    <button key={p.key} type="button" className={`ix-pay-chip${payment === p.key ? " is-active" : ""}`} onClick={() => setPayment(p.key)}>
                      <SvgP name={p.icon} />{p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ix-field" style={{ marginBottom: 0 }}>
                <label>Categoria</label>
                <button type="button" className="ix-cat-field" onClick={() => setCatOpen(true)}>
                  <div className="ix-cat-chosen">
                    {catPath.length > 1 && <span className="crumb">{catPath.slice(0, -1).join(" › ")}</span>}
                    <span className={`leaf${catPath.length ? "" : " empty"}`}>{catPath.length ? category : "Escolher categoria"}</span>
                  </div>
                  <span className="ix-cat-chev"><SvgP name="chevD" /></span>
                </button>
              </div>
            </div>

            <div className="ix-card">
              <div className="ix-field-label" style={{ marginBottom: 10 }}>Como lançar?</div>
              <StatusChoiceP value={status} onChange={setStatus} />
            </div>
          </div>

          <div className="ix-photo-footer ix-photo-body" style={{ paddingTop: 0 }}>
            <button type="button" className="ix-btn-primary" onClick={() => setStage("done")}>
              <SvgP name="check" />Lançar {isIn ? "receita" : "despesa"} de R$ {amount}
            </button>
            <button type="button" className="ix-btn-ghost" onClick={capture}>Trocar foto</button>
          </div>
        </React.Fragment>
      )}

      {/* ── Done ── */}
      {stage === "done" && (
        <div className="ix-photo-body ix-fade ix-done" style={{ paddingTop: 30 }}>
          <div className="ix-done-ring"><SvgP name="check" /></div>
          <h2>{isIn ? "Receita" : "Despesa"} lançada!</h2>
          <p>{store} · R$ {amount} foi {status === "paid" ? "adicionada ao seu saldo" : "agendada para a data"}.</p>
          <div className="ix-card" style={{ textAlign: "left", marginTop: 22 }}>
            <div className="ix-txn" style={{ border: "none", background: "transparent", padding: 0 }}>
              <div className={`ix-txn-ic ${isIn ? "in" : "out"}`}><SvgP name={isIn ? "arrowUp" : "arrowDown"} /></div>
              <div className="ix-txn-main">
                <div className="ix-txn-title">{store}</div>
                <div className="ix-txn-meta">
                  <span className="ix-txn-date">{date}</span>
                  <span className="ix-badge cat">{category}</span>
                  <span className={`ix-badge status-${status}`}>{status === "paid" ? "No saldo" : "Na data"}</span>
                </div>
              </div>
              <div className={`ix-txn-amount ${isIn ? "in" : "out"}`}>{isIn ? "+" : "−"}R$ {amount}</div>
            </div>
          </div>
          <button type="button" className="ix-btn-primary" style={{ marginTop: 18 }} onClick={onClose}>Concluir</button>
          <button type="button" className="ix-btn-ghost" onClick={() => { setStage("source"); setProgress(0); }}>Lançar outro</button>
        </div>
      )}

      {catOpen && (
        <CategoryPicker
          tree={DP.CATEGORY_TREE}
          value={catPath}
          onClose={() => setCatOpen(false)}
          onSelect={(path) => { setCatPath(path); setCatOpen(false); }}
        />
      )}
    </div>
  );
}

/* ───────── Hierarchical category picker (matches normal launch) ───────── */
function CategoryPicker({ tree, value, onClose, onSelect }) {
  const [stack, setStack] = useSP([]); // array of nodes drilled into
  const list = stack.length ? stack[stack.length - 1].children || [] : tree;
  const crumbNames = stack.map((n) => n.name);

  return (
    <div className="ix-catsheet-scrim" onClick={onClose}>
      <div className="ix-catsheet" onClick={(e) => e.stopPropagation()}>
        <div className="ix-catsheet-handle" />
        <div className="ix-catsheet-top">
          {stack.length > 0 && (
            <button type="button" className="ix-back" onClick={() => setStack(stack.slice(0, -1))} aria-label="Voltar"><SvgP name="back" /></button>
          )}
          <div className="info">
            <span className="kick">Organização</span>
            <h3>Categorias</h3>
          </div>
          <button type="button" className="closex" onClick={onClose} aria-label="Fechar"><SvgP name="close" /></button>
        </div>

        {stack.length > 0 && (
          <div className="ix-crumbbar">
            <span className="c muted">Todas</span>
            {crumbNames.map((n, i) => (
              <React.Fragment key={n + i}>
                <span className="sep">›</span>
                <span className={`c${i === crumbNames.length - 1 ? "" : " muted"}`}>{n}</span>
              </React.Fragment>
            ))}
          </div>
        )}

        {stack.length > 0 && (
          <button type="button" className="ix-cat-use" onClick={() => onSelect(crumbNames)}>
            <SvgP name="check" />Usar {crumbNames[crumbNames.length - 1]} como categoria
          </button>
        )}

        <div className="ix-catlist">
          {list.map((node) => {
            const hasKids = node.children && node.children.length > 0;
            const nodePath = [...crumbNames, node.name];
            const selected = value.join(">") === nodePath.join(">");
            return (
              <div key={node.name} className={`ix-catrow${selected ? " is-selected" : ""}`}>
                <button type="button" className="pickdot" onClick={() => onSelect(nodePath)} aria-label="Selecionar">
                  <SvgP name="check" />
                </button>
                <button type="button" className="nm" onClick={() => onSelect(nodePath)} style={{ background: "none", border: 0, padding: 0 }}>
                  <strong>{node.name}</strong>
                  <span>{hasKids ? "Toque na seta para ver subcategorias" : "Selecionar esta categoria"}</span>
                </button>
                <span className="lvl">Nível {stack.length + 1}</span>
                {hasKids && (
                  <button type="button" className="drill" onClick={() => setStack([...stack, node])} aria-label="Ver subcategorias">
                    <SvgP name="chevR" />
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

window.ImportPhoto = { FabMenu, PhotoFlow };
