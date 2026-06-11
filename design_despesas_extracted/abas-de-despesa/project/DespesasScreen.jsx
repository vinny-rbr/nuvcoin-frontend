/* DespesasScreen — redesign da aba Despesas do nuvcoin */
const { useState, useMemo, useRef, useEffect } = React;

function hexA(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function parseAmountToCents(input) {
  const n = String(input).trim().replace(/\./g, "").replace(",", ".");
  const v = Number(n);
  if (Number.isNaN(v) || v <= 0) return 0;
  return Math.round(v * 100);
}

const TYPE_CFG = {
  despesa: {
    title: "Despesas", amount: "#F87171", amountDark: "#DC2626",
    pendVal: "#FBBF24", paidVal: "#F87171",
    pendLabel: "Total pendente", paidLabel: "Total pago",
    series: () => window.NUV_SERIES, cats: ["alimentacao", "moradia", "energia", "internet", "transporte", "lazer"],
  },
  receita: {
    title: "Receitas", amount: "#4ADE80", amountDark: "#16A34A",
    pendVal: "#FBBF24", paidVal: "#4ADE80",
    pendLabel: "A receber", paidLabel: "Recebido",
    series: () => window.NUV_SERIES_RECEITA, cats: ["salario", "freela", "rendimento"],
  },
};

// ---------- linha de transação ----------
function TxRow({ item, cfg, onToggle, onOpen }) {
  const paid = item.status === "paid";
  return (
    <div className="dx-row" onClick={() => onOpen(item)}>
      <span className="dx-row-ic" style={{ background: hexA(item.color, 0.16), color: item.color, boxShadow: `inset 0 0 0 1px ${hexA(item.color, 0.30)}` }}>
        <NuvIcon name={item.icon} size={20} sw={2} />
      </span>
      <div className="dx-row-mid">
        <div className="dx-row-title">{item.title}</div>
        <div className="dx-row-sub">{item.categoryName} · {item.wallet}</div>
      </div>
      <div className="dx-row-right">
        <div className="dx-row-amt" style={{ color: cfg.amount }}>{nuvFormatBRL(item.amountCents)}</div>
        <button
          type="button"
          className={`dx-status${paid ? " is-paid" : ""}`}
          title={paid ? "Pago — toque p/ marcar pendente" : "Pendente — toque p/ marcar pago"}
          onClick={(e) => { e.stopPropagation(); onToggle(item); }}
          style={paid ? { background: hexA(cfg.amount, 0.16), color: cfg.amount } : { color: cfg.pendVal, borderColor: hexA(cfg.pendVal, 0.55) }}
        >
          {paid ? <NuvIcon name="check" size={13} /> : <span className="dx-status-ring" />}
        </button>
      </div>
    </div>
  );
}

// ---------- nav de mês ----------
function MonthNav({ year, month, onPrev, onNext, onToday }) {
  const label = MESES_PT[month];
  return (
    <div className="dx-monthnav">
      <button type="button" className="dx-mn-btn" onClick={onPrev} aria-label="Mês anterior"><NuvIcon name="chevron-left" size={20} /></button>
      <button type="button" className="dx-mn-label" onClick={onToday} title="Voltar para o mês atual">
        <span>{label}</span>
        <small>{year}</small>
      </button>
      <button type="button" className="dx-mn-btn" onClick={onNext} aria-label="Próximo mês"><NuvIcon name="chevron-right" size={20} /></button>
    </div>
  );
}

// ---------- sheet Nova Despesa ----------
function NovaSheet({ open, onClose, onSave, cfg, type, defaultDate }) {
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState(cfg.cats[0]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [pay, setPay] = useState("pix");
  const [status, setStatus] = useState("pending");
  const [fixo, setFixo] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(""); setCat(cfg.cats[0]); setAmount(""); setDate(defaultDate);
      setPay("pix"); setStatus("pending"); setFixo(false);
    }
  }, [open, defaultDate, type]);

  if (!open) return null;
  const verb = type === "despesa" ? "despesa" : "receita";

  function submit() {
    const cents = parseAmountToCents(amount);
    if (!title.trim()) { alert("Informe um título."); return; }
    if (cents <= 0) { alert("Informe um valor válido."); return; }
    onSave({ title: title.trim(), cat, amount: cents, date, pay, status, fixo });
  }

  return (
    <div className="dx-sheet-scrim" onClick={onClose}>
      <div className="dx-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="dx-sheet-grip" />
        <div className="dx-sheet-head">
          <div>
            <span className="dx-sheet-kick">Novo lançamento</span>
            <h3>Nova {verb}</h3>
          </div>
          <button type="button" className="dx-sheet-x" onClick={onClose}><NuvIcon name="x" size={18} /></button>
        </div>

        <div className="dx-form">
          <label className="dx-field dx-field-full">
            <span>Título</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === "despesa" ? "Ex: Mercado" : "Ex: Salário"} autoFocus />
          </label>

          <label className="dx-field">
            <span>Categoria</span>
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              {cfg.cats.map((c) => <option key={c} value={c}>{NUV_CATEGORIES[c].name}</option>)}
            </select>
          </label>

          <label className="dx-field">
            <span>Valor</span>
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
          </label>

          <label className="dx-field">
            <span>Data</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <label className="dx-field">
            <span>Pagamento</span>
            <select value={pay} onChange={(e) => setPay(e.target.value)}>
              <option value="pix">Pix</option>
              <option value="debit">Débito</option>
              <option value="cash">Dinheiro</option>
              <option value="credit">Crédito</option>
            </select>
          </label>

          <div className="dx-field dx-field-full">
            <span>Status</span>
            <div className="dx-seg">
              <button type="button" className={status === "pending" ? "on" : ""} onClick={() => setStatus("pending")}>{type === "despesa" ? "Pendente" : "A receber"}</button>
              <button type="button" className={status === "paid" ? "on" : ""} onClick={() => setStatus("paid")}>{type === "despesa" ? "Pago" : "Recebido"}</button>
            </div>
          </div>

          <button type="button" className={`dx-fixo${fixo ? " on" : ""}`} onClick={() => setFixo((v) => !v)}>
            <span className="dx-fixo-ic"><NuvIcon name="repeat" size={18} /></span>
            <span className="dx-fixo-txt">
              <strong>{type === "despesa" ? "Gasto fixo mensal" : "Entrada fixa mensal"}</strong>
              <small>Repete nos próximos meses automaticamente</small>
            </span>
            <span className={`dx-switch${fixo ? " on" : ""}`}><i /></span>
          </button>
        </div>

        <button type="button" className="dx-save" onClick={submit}>
          Adicionar {verb}
        </button>
      </div>
    </div>
  );
}

// ---------- nav inferior ----------
function BottomNav({ onFab, fabColor }) {
  const items = [
    { key: "inicio", label: "Início", icon: "nav-home" },
    { key: "categorias", label: "Categorias", icon: "nav-tag" },
    { key: "grupos", label: "Grupos", icon: "nav-groups" },
    { key: "plan", label: "Planejam.", icon: "nav-plan" },
  ];
  return (
    <nav className="dx-nav">
      <button type="button" className="dx-fab" onClick={onFab} aria-label="Novo lançamento" style={{ background: fabColor }}>
        <NuvIcon name="plus" size={26} stroke="#fff" />
      </button>
      <div className="dx-nav-row">
        <button type="button" className="dx-nav-btn"><NuvIcon name={items[0].icon} size={21} /><span>{items[0].label}</span></button>
        <button type="button" className="dx-nav-btn"><NuvIcon name={items[1].icon} size={21} /><span>{items[1].label}</span></button>
        <span className="dx-nav-gap" />
        <button type="button" className="dx-nav-btn"><NuvIcon name={items[2].icon} size={21} /><span>{items[2].label}</span></button>
        <button type="button" className="dx-nav-btn"><NuvIcon name={items[3].icon} size={21} /><span>{items[3].label}</span></button>
      </div>
    </nav>
  );
}

// ---------- tela principal ----------
function DespesasScreen({ t }) {
  const t0 = NUV_TODAY_ISO.split("-").map(Number);
  const [type, setType] = useState("despesa");
  const [year, setYear] = useState(t0[0]);
  const [month, setMonth] = useState(t0[1] - 1);
  const [overrides, setOverrides] = useState({}); // edits parciais por id
  const [deleted, setDeleted] = useState({});
  const [editing, setEditing] = useState(null);
  const [extra, setExtra] = useState({});
  const [typeMenu, setTypeMenu] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | pending | paid
  const [sheetOpen, setSheetOpen] = useState(false);

  const cfg = TYPE_CFG[type];
  const monthKey = `${year}-${month}`;

  const allItems = useMemo(() => {
    const gen = nuvBuildMonthItems(year, month, cfg.series());
    const ex = extra[`${type}:${monthKey}`] || [];
    return [...gen, ...ex]
      .filter((it) => !deleted[it.id])
      .map((it) => {
        const e = overrides[it.id];
        if (!e) return it;
        const merged = { ...it, ...e };
        if (e.categoryKey && NUV_CATEGORIES[e.categoryKey]) {
          const c = NUV_CATEGORIES[e.categoryKey];
          merged.categoryName = c.name; merged.color = c.color; merged.icon = c.icon;
        }
        if (e.baseTitle != null) {
          merged.title = e.baseTitle + (it.installment ? ` (${it.installment})` : "");
        }
        return merged;
      });
  }, [year, month, type, overrides, extra, deleted]);

  const visible = useMemo(() => {
    return allItems.filter((it) => {
      const q = query.trim().toLowerCase();
      const mq = !q || it.title.toLowerCase().includes(q) || it.categoryName.toLowerCase().includes(q) || nuvFormatBRL(it.amountCents).includes(q);
      const mf = filter === "all" || it.status === (filter === "paid" ? "paid" : "pending");
      return mq && mf;
    });
  }, [allItems, query, filter]);

  const totals = useMemo(() => {
    let pend = 0, paid = 0;
    for (const it of allItems) { if (it.status === "paid") paid += it.amountCents; else pend += it.amountCents; }
    return { pend, paid };
  }, [allItems]);

  const groups = useMemo(() => {
    const g = nuvGroupByDay(visible);
    if (t.sortAsc) g.reverse();
    return g;
  }, [visible, t.sortAsc]);

  function shiftMonth(delta) {
    let m = month + delta, y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m); setYear(y); setEditing(null);
  }
  function goToday() { setYear(t0[0]); setMonth(t0[1] - 1); }

  function toggleStatus(item) {
    setOverrides((prev) => ({ ...prev, [item.id]: { ...prev[item.id], status: item.status === "paid" ? "pending" : "paid" } }));
  }

  function saveEdit(id, partial) {
    setOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...partial } }));
    setEditing(null);
  }

  function deleteItem(id) {
    if (!confirm("Excluir este lançamento?")) return;
    setDeleted((prev) => ({ ...prev, [id]: true }));
    setEditing(null);
  }

  function handleSave(form) {
    const cat = NUV_CATEGORIES[form.cat];
    const [yy, mm] = form.date.split("-").map(Number);
    const base = {
      seriesId: "custom", baseTitle: form.title, title: form.title,
      categoryKey: form.cat, categoryName: cat.name, color: cat.color, icon: cat.icon,
      wallet: form.pay === "credit" ? "Cartão" : form.pay === "pix" ? "Pix" : "Carteira",
      amountCents: form.amount, kind: form.fixo ? "fixo" : "avulso",
    };
    setExtra((prev) => {
      const next = { ...prev };
      const months = form.fixo ? 6 : 1;
      for (let i = 0; i < months; i++) {
        const d = new Date(yy, (mm - 1) + i, Math.min(Number(form.date.slice(8, 10)), nuvDaysInMonth(yy, (mm - 1) + i)));
        const ky = d.getFullYear(), km = d.getMonth();
        const iso = `${ky}-${nuvPad(km + 1)}-${nuvPad(d.getDate())}`;
        const key = `${type}:${ky}-${km}`;
        const item = { ...base, id: `custom-${Date.now()}-${i}`, dateISO: iso, status: i === 0 ? form.status : "pending" };
        next[key] = [...(next[key] || []), item];
      }
      return next;
    });
    setSheetOpen(false);
  }

  const fabColor = t.fabColor === "red"
    ? "linear-gradient(135deg,#f87171,#dc2626)"
    : "linear-gradient(135deg,#60a5fa,#2563eb)";

  return (
    <div className="dx-screen" data-theme={t.theme} data-density={t.density} style={{ "--accent": cfg.amount }}>
      {/* status bar do app */}
      <div className="dx-statusbar">
        <span className="dx-sb-time">19:14</span>
        <span className="dx-sb-right">
          <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1" opacity="0.4"/></svg>
          <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M8 2.6c2 0 3.9.8 5.3 2.1l1-1A9 9 0 0 0 8 .8 9 9 0 0 0 1.7 3.7l1 1A7.4 7.4 0 0 1 8 2.6z"/><path d="M8 6c1 0 2 .4 2.7 1.1l1-1A6 6 0 0 0 8 4.4a6 6 0 0 0-3.7 1.7l1 1C6 6.4 7 6 8 6z"/><circle cx="8" cy="9.2" r="1.3"/></svg>
          <span className="dx-sb-batt"><i style={{ width: "76%" }} /></span>
          <small>76</small>
        </span>
      </div>

      {/* header */}
      <header className="dx-head">
        <div className="dx-head-top">
          <button type="button" className="dx-type" onClick={() => setTypeMenu((v) => !v)}>
            <span>{cfg.title}</span>
            <NuvIcon name="chevron-down" size={18} style={{ transform: typeMenu ? "rotate(180deg)" : "none", transition: ".2s" }} />
          </button>
          <div className="dx-head-actions">
            <button type="button" className={`dx-icbtn${searchOpen ? " on" : ""}`} onClick={() => setSearchOpen((v) => !v)}><NuvIcon name="search" size={20} /></button>
            <button type="button" className={`dx-icbtn${filter !== "all" ? " on" : ""}`} onClick={() => setFilter((f) => f === "all" ? "pending" : f === "pending" ? "paid" : "all")} title="Filtrar status"><NuvIcon name="filter" size={20} /></button>
            <button type="button" className="dx-icbtn"><NuvIcon name="kebab" size={20} /></button>
          </div>
        </div>

        {typeMenu ? (
          <div className="dx-typemenu">
            <button type="button" className={type === "despesa" ? "on" : ""} onClick={() => { setType("despesa"); setTypeMenu(false); setEditing(null); }}>Despesas</button>
            <button type="button" className={type === "receita" ? "on" : ""} onClick={() => { setType("receita"); setTypeMenu(false); setEditing(null); }}>Receitas</button>
          </div>
        ) : null}

        {searchOpen ? (
          <div className="dx-searchbar">
            <NuvIcon name="search" size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nome ou valor…" autoFocus />
            {query ? <button type="button" onClick={() => setQuery("")}><NuvIcon name="x" size={16} /></button> : null}
          </div>
        ) : null}

        <MonthNav year={year} month={month} onPrev={() => shiftMonth(-1)} onNext={() => shiftMonth(1)} onToday={goToday} />
      </header>

      {/* resumo */}
      {t.showSummary ? (
        <div className="dx-summary">
          <div className="dx-sum-cell">
            <div className="dx-sum-top"><NuvIcon name="clock" size={15} /><span>{cfg.pendLabel}</span></div>
            <div className="dx-sum-val" style={{ color: cfg.pendVal }}>{nuvFormatBRL(totals.pend)}</div>
          </div>
          <div className="dx-sum-div" />
          <div className="dx-sum-cell">
            <div className="dx-sum-top"><NuvIcon name="receipt" size={15} /><span>{cfg.paidLabel}</span></div>
            <div className="dx-sum-val" style={{ color: cfg.paidVal }}>{nuvFormatBRL(totals.paid)}</div>
          </div>
        </div>
      ) : null}

      {filter !== "all" ? (
        <div className="dx-filterchip">
          Mostrando: <strong>{filter === "pending" ? (type === "despesa" ? "pendentes" : "a receber") : (type === "despesa" ? "pagas" : "recebidas")}</strong>
          <button type="button" onClick={() => setFilter("all")}>limpar</button>
        </div>
      ) : null}

      {/* lista */}
      <div className="dx-list">
        {groups.length === 0 ? (
          <div className="dx-empty">
            <span className="dx-empty-ic"><NuvIcon name="receipt" size={26} /></span>
            <strong>Nada por aqui em {MESES_PT[month]}</strong>
            <small>Toque no <b>+</b> para lançar { type === "despesa" ? "uma despesa" : "uma receita"}.</small>
          </div>
        ) : groups.map((g) => {
          const dayTotal = g.items.reduce((s, it) => s + it.amountCents, 0);
          return (
            <div className="dx-day" key={g.dateISO}>
              <div className="dx-day-h">
                <span className="dx-day-lbl">{g.label}</span>
                <span className="dx-day-tot">{nuvFormatBRL(dayTotal)}</span>
              </div>
              <div className="dx-day-rows">
                {g.items.map((it) => (
                  <TxRow key={it.id} item={it} cfg={cfg} onToggle={toggleStatus} onOpen={setEditing} />
                ))}
              </div>
            </div>
          );
        })}
        <div className="dx-list-pad" />
      </div>

      <BottomNav onFab={() => setSheetOpen(true)} fabColor={fabColor} />

      <NovaSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSave={handleSave}
        cfg={cfg}
        type={type}
        defaultDate={`${year}-${nuvPad(month + 1)}-${nuvPad(Math.min(Number(NUV_TODAY_ISO.slice(8, 10)), nuvDaysInMonth(year, month)))}`}
      />

      {editing ? (
        <EditScreen
          item={editing}
          type={type}
          cfg={{ ...cfg, themeAttr: t.theme }}
          onSave={saveEdit}
          onDelete={deleteItem}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

Object.assign(window, { DespesasScreen });
