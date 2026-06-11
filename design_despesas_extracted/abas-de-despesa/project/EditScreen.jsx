/* EditScreen — edição de lançamento no estilo PRÓPRIO do nuvcoin
   (mesma função da referência, identidade visual distinta:
    cartões rotulados, status segmentado, botão Salvar full-width) */
const { useState: useStateEd, useEffect: useEffectEd } = React;

function edParseToCents(input) {
  const n = String(input).trim().replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const v = Number(n);
  if (Number.isNaN(v) || v <= 0) return 0;
  return Math.round(v * 100);
}
function edCentsToStr(cents) {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const ED_WALLETS = ["Carteira", "Nubank", "Cartão", "Pix", "Inter"];

function EdPicker({ title, options, current, render, onPick, onClose }) {
  return (
    <div className="ed-pick-scrim" onClick={onClose}>
      <div className="ed-pick" onClick={(e) => e.stopPropagation()}>
        <div className="dx-sheet-grip" />
        <div className="ed-pick-title">{title}</div>
        <div className="ed-pick-list">
          {options.map((o) => (
            <button type="button" key={o} className={`ed-pick-item${o === current ? " on" : ""}`} onClick={() => onPick(o)}>
              {render(o)}
              {o === current ? <NuvIcon name="check" size={18} /> : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EditScreen({ item, type, cfg, onSave, onDelete, onClose }) {
  const [amountStr, setAmountStr] = useStateEd(edCentsToStr(item.amountCents));
  const [paid, setPaid] = useStateEd(item.status === "paid");
  const [date, setDate] = useStateEd(item.dateISO);
  const [titlev, setTitle] = useStateEd(item.baseTitle || item.title);
  const [catKey, setCatKey] = useStateEd(item.categoryKey);
  const [wallet, setWallet] = useStateEd(item.wallet);
  const [note, setNote] = useStateEd(item.note || "");
  const [ignore, setIgnore] = useStateEd(!!item.ignore);
  const [picker, setPicker] = useStateEd(null);
  const [anim, setAnim] = useStateEd(false);

  useEffectEd(() => { const id = setTimeout(() => setAnim(true), 20); return () => clearTimeout(id); }, []);

  const cat = NUV_CATEGORIES[catKey];
  const verb = type === "despesa" ? "despesa" : "receita";
  const recLabel = item.installment ? "Parcela" : "Recorrência";
  const recValue = item.installment ? item.installment : (item.kind === "fixo" ? "Fixo mensal" : "Avulso");

  function commit() {
    const cents = edParseToCents(amountStr) || item.amountCents;
    onSave(item.id, {
      amountCents: cents,
      status: paid ? "paid" : "pending",
      dateISO: date,
      baseTitle: titlev.trim() || item.baseTitle,
      categoryKey: catKey,
      wallet, note, ignore,
    });
  }

  return (
    <div className={`ed2-screen${anim ? " in" : ""}`} data-theme={cfg.themeAttr}>
      <header className="ed2-head">
        <button type="button" className="ed2-back" onClick={onClose} aria-label="Voltar"><NuvIcon name="arrow-left" size={20} /></button>
        <span className="ed2-title">Editar {verb}</span>
        <button type="button" className="ed2-trash" onClick={() => onDelete(item.id)} aria-label="Excluir"><NuvIcon name="trash" size={19} /></button>
      </header>

      <div className="ed2-body">
        {/* valor + status */}
        <div className="ed2-valcard" style={{ borderColor: `${cfg.amount}55` }}>
          <span className="ed2-vallbl">Valor da {verb}</span>
          <div className="ed2-valrow">
            <span className="ed2-cur" style={{ color: cfg.amount }}>R$</span>
            <input className="ed2-val" value={amountStr} inputMode="decimal" onChange={(e) => setAmountStr(e.target.value)} onFocus={(e) => e.target.select()} style={{ color: cfg.amount }} />
          </div>
          <div className="ed2-seg">
            <button type="button" className={!paid ? "on pend" : ""} onClick={() => setPaid(false)}>{type === "despesa" ? "Pendente" : "A receber"}</button>
            <button type="button" className={paid ? "on paid" : ""} onClick={() => setPaid(true)}>{type === "despesa" ? "Pago" : "Recebido"}</button>
          </div>
        </div>

        {/* detalhes */}
        <div className="ed2-card">
          <div className="ed2-field">
            <label>Título</label>
            <div className="ed2-control"><input value={titlev} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Mercado" /></div>
          </div>
          <div className="ed2-grid2">
            <div className="ed2-field">
              <label>Data</label>
              <div className="ed2-control ed2-tap">
                <NuvIcon name="calendar" size={17} style={{ opacity: 0.6 }} />
                <span>{nuvFormatDateLong(date)}</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>
            <div className="ed2-field">
              <label>{recLabel}</label>
              <div className="ed2-control ed2-static">
                <NuvIcon name="repeat" size={16} style={{ opacity: 0.6 }} />
                <span>{recValue}</span>
              </div>
            </div>
          </div>
          <div className="ed2-field">
            <label>Categoria</label>
            <button type="button" className="ed2-select" onClick={() => setPicker("cat")}>
              <span className="ed2-chip" style={{ color: cat.color, background: `${cat.color}1f`, borderColor: `${cat.color}55` }}>
                <NuvIcon name={cat.icon} size={15} /> {cat.name}
              </span>
              <NuvIcon name="chevron-right" size={18} style={{ opacity: 0.45 }} />
            </button>
          </div>
          <div className="ed2-field">
            <label>Carteira / conta</label>
            <button type="button" className="ed2-select" onClick={() => setPicker("wallet")}>
              <span className="ed2-chip" style={{ color: "#60A5FA", background: "rgba(96,165,250,0.12)", borderColor: "rgba(96,165,250,0.45)" }}>
                <NuvIcon name="wallet" size={15} /> {wallet}
              </span>
              <NuvIcon name="chevron-right" size={18} style={{ opacity: 0.45 }} />
            </button>
          </div>
        </div>

        {/* extras */}
        <div className="ed2-card">
          <div className="ed2-field">
            <label>Observação</label>
            <div className="ed2-control"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Adicione uma nota…" /></div>
          </div>
          <button type="button" className="ed2-line">
            <span className="ed2-line-l"><NuvIcon name="image" size={18} style={{ opacity: 0.7 }} /> Anexar comprovante</span>
            <NuvIcon name="upload" size={17} style={{ color: cfg.amount }} />
          </button>
          <button type="button" className="ed2-line">
            <span className="ed2-line-l"><NuvIcon name="tag" size={18} style={{ opacity: 0.7 }} /> Tags</span>
            <NuvIcon name="chevron-right" size={18} style={{ opacity: 0.45 }} />
          </button>
          <button type="button" className="ed2-line ed2-line-last" onClick={() => setIgnore((v) => !v)}>
            <span className="ed2-line-l"><NuvIcon name="help" size={18} style={{ opacity: 0.7 }} /> Ignorar nos relatórios</span>
            <span className={`ed2-switch${ignore ? " on" : ""}`}><i /></span>
          </button>
        </div>
      </div>

      <div className="ed2-foot">
        <button type="button" className="ed2-save" onClick={commit}>Salvar alterações</button>
      </div>

      {picker === "cat" ? (
        <EdPicker
          title="Categoria"
          options={cfg.cats}
          current={catKey}
          render={(c) => (
            <span className="ed-pick-cat">
              <span className="ed-pick-ic" style={{ background: `${NUV_CATEGORIES[c].color}26`, color: NUV_CATEGORIES[c].color }}><NuvIcon name={NUV_CATEGORIES[c].icon} size={17} /></span>
              {NUV_CATEGORIES[c].name}
            </span>
          )}
          onPick={(c) => { setCatKey(c); setPicker(null); }}
          onClose={() => setPicker(null)}
        />
      ) : null}

      {picker === "wallet" ? (
        <EdPicker
          title="Carteira / conta"
          options={ED_WALLETS}
          current={wallet}
          render={(w) => (
            <span className="ed-pick-cat">
              <span className="ed-pick-ic" style={{ background: "rgba(96,165,250,0.16)", color: "#60A5FA" }}><NuvIcon name="wallet" size={17} /></span>
              {w}
            </span>
          )}
          onPick={(w) => { setWallet(w); setPicker(null); }}
          onClose={() => setPicker(null)}
        />
      ) : null}
    </div>
  );
}

Object.assign(window, { EditScreen });
