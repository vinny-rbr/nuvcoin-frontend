import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import type { FinanceItem } from "../types/finance";
import { financeList, financeRefreshFromApi, financeSubscribe } from "../lib/financeService";
import { getPlanName } from "../lib/auth";
import "./relatorios.css";

// ── helpers ───────────────────────────────────────────
function fmt(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const MO = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];

function periodStr(from: string, to: string): string {
  const [ay,am,ad] = from.split("-").map(Number);
  const [by,bm,bd] = to.split("-").map(Number);
  if (ay===by && am===bm) return `${ad} – ${bd} ${MO[bm-1]} ${by}`;
  if (ay===by) return `${ad} ${MO[am-1]} – ${bd} ${MO[bm-1]} ${by}`;
  return `${ad} ${MO[am-1]} ${ay} – ${bd} ${MO[bm-1]} ${by}`;
}

function initFrom(): string {
  const d = new Date(), y = d.getFullYear(), m = d.getMonth();
  return `${y}-${String(m+1).padStart(2,"0")}-01`;
}
function initTo(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().slice(0,10);
}

function buildPresets(): Array<{flag:string;from:string;to:string}> {
  const d = new Date(), y = d.getFullYear(), m = d.getMonth();
  const tmF = initFrom(), tmT = initTo();
  const lm = m===0?11:m-1, ly = m===0?y-1:y;
  const lmF = `${ly}-${String(lm+1).padStart(2,"0")}-01`;
  const lmT = new Date(ly,lm+1,0).toISOString().slice(0,10);
  const t3m = ((m-2)+12)%12, t3y = m<2?y-1:y;
  const t3F = `${t3y}-${String(t3m+1).padStart(2,"0")}-01`;
  return [
    {flag:"Este mês",         from:tmF, to:tmT},
    {flag:"Mês passado",      from:lmF, to:lmT},
    {flag:"Últimos 3 meses",  from:t3F, to:tmT},
    {flag:"Este ano",         from:`${y}-01-01`, to:tmT},
  ];
}

function hexBg(hex: string, a: number): string {
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

function printReport(items: FinanceItem[], label: string) {
  const rec = items.filter(it=>it.type==="RECEITA");
  const des = items.filter(it=>it.type==="DESPESA");
  const totR = rec.reduce((s,it)=>s+it.amountCents,0);
  const totD = des.reduce((s,it)=>s+it.amountCents,0);
  const sal = totR-totD;
  const fd = (iso:string)=>{ const p=iso.split("-"); return `${p[2]}/${p[1]}`; };
  const row = (it:FinanceItem,c:string,sg:string) =>
    `<tr><td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:600;color:#1e293b">${it.title}</td><td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:11px;color:#64748b">${it.category} • ${fd(it.dateISO)}</td><td style="padding:8px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:700;text-align:right;white-space:nowrap;color:${c}">${sg} ${fmt(it.amountCents)}</td></tr>`;
  const today = new Date().toLocaleDateString("pt-BR");
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório — ${label}</title><style>*{margin:0;padding:0;box-sizing:border-box;font-family:system-ui,sans-serif;}body{color:#0f172a;padding:32px;background:#fff;}table{width:100%;border-collapse:collapse;}th{text-align:left;padding:6px 8px;font-size:10px;font-weight:800;color:#64748b;text-transform:uppercase;border-bottom:1px solid #e2e8f0;}th:last-child{text-align:right;}@media print{body{padding:16px;}@page{margin:16px;}}</style></head><body><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #1d4ed8;"><div><div style="font-size:20px;font-weight:800;color:#1d4ed8;">Conciliaaí</div><div style="font-size:11px;color:#64748b;letter-spacing:.12em;font-weight:700;margin-top:2px;">FINANÇAS</div></div><div style="text-align:right;"><div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:3px;">Relatório financeiro</div><div style="font-size:12px;color:#64748b;">Período: ${label}</div><div style="font-size:12px;color:#64748b;">Gerado em ${today}</div></div></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px;"><div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;background:#f8fafc;"><div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:.05em;margin-bottom:5px;">RECEITAS</div><div style="font-size:17px;font-weight:700;color:#16a34a;">${fmt(totR)}</div></div><div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;background:#f8fafc;"><div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:.05em;margin-bottom:5px;">DESPESAS</div><div style="font-size:17px;font-weight:700;color:#dc2626;">${fmt(totD)}</div></div><div style="border:1px solid #e2e8f0;border-radius:8px;padding:12px;background:#f8fafc;"><div style="font-size:10px;font-weight:800;color:#64748b;letter-spacing:.05em;margin-bottom:5px;">SALDO</div><div style="font-size:17px;font-weight:700;color:${sal>=0?"#16a34a":"#dc2626"};">${fmt(sal)}</div></div></div>${rec.length>0?`<div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#16a34a;margin-bottom:8px;">Entradas</div><table><thead><tr><th>Descrição</th><th>Categoria / Data</th><th>Valor</th></tr></thead><tbody>${rec.map(it=>row(it,"#16a34a","+")).join("")}</tbody></table>`:""}${des.length>0?`<div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#dc2626;margin-top:20px;margin-bottom:8px;">Saídas</div><table><thead><tr><th>Descrição</th><th>Categoria / Data</th><th>Valor</th></tr></thead><tbody>${des.map(it=>row(it,"#dc2626","–")).join("")}</tbody></table>`:""}<div style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;padding:12px 16px;border-radius:8px;background:#0f172a;color:#fff;"><span style="font-size:13px;font-weight:700;color:#cbd5e1;">Saldo do período</span><span style="font-size:18px;font-weight:700;color:${sal>=0?"#34d399":"#f87171"};">${fmt(sal)}</span></div><div style="margin-top:20px;padding-top:12px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:10px;color:#94a3b8;"><span>Gerado por Conciliaaí</span><span>Página 1 de 1</span></div></body></html>`;
  const w = window.open("","_blank","width=750,height=950");
  if(!w) return;
  w.document.write(html); w.document.close(); w.onload = ()=>w.print();
}

// ── SVG icon helper (dangerouslySetInnerHTML on svg is typed in React) ──
function SvgIc({ d, sw = "2", sz = 22 }: { d: string; sw?: string; sz?: number }) {
  return (
    <svg
      width={sz} height={sz} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: d }}
    />
  );
}

// Icon paths
const P = {
  back:   '<path d="M15 18l-6-6 6-6"/>',
  clock:  '<path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/>',
  cal:    '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  chDown: '<path d="m6 9 6 6 6-6"/>',
  chRt:   '<path d="M9 18l6-6-6-6"/>',
  up:     '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
  down:   '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  crown:  '<path d="M5 16L3 6l5.5 4L12 4l3.5 6L21 6l-2 10H5Zm0 2h14v2H5v-2Z"/>',
  lock:   '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  check:  '<path d="M20 6 9 17l-5-5"/>',
  eye:    '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  pdf:    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/>',
  share:  '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  inout:  '<path d="M16 3 21 8l-5 5M21 8H7"/><path d="M8 21 3 16l5-5M3 16h14"/>',
  pie:    '<path d="M21 12A9 9 0 1 1 11 3v9h10Z"/><path d="M14 3.2A9 9 0 0 1 20.8 10H14V3.2Z"/>',
  flame:  '<path d="M12 22c4 0 7-2.7 7-6.5 0-4-3.5-6-4.5-9C13 9 11 9.5 11 12c0-1.5-1-2.8-2-3.5C8 11 6 12.6 6 15.5 6 19.3 8.5 22 12 22Z"/>',
  flow:   '<path d="M3 17l5-5 4 3 8-8"/><path d="M21 7v5h-5"/>',
  compare:'<path d="M3 6h7v14H3z"/><path d="M14 10h7v10h-7z"/><path d="M6.5 6V3M17.5 10V3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
  dre:    '<path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h12v4"/><path d="M3 7v10a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1H5"/><circle cx="16" cy="13" r="1.3"/>',
  card:   '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
  group:  '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5"/><path d="M16 6.5a3 3 0 0 1 0 5.8M22 20c0-2.6-1.5-4.2-4-4.8"/>',
  annual: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h2M14 14h2M8 18h2"/>',
  acct:   '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>',
};

// ── Report catalog ──
type Tier = "free" | "pro" | "premium";
type RepDef = { title:string; desc:string; tier:Tier; color:string; iconKey:keyof typeof P; route?:string };
const REPS: Record<string, RepDef> = {
  inout:      {title:"Entradas e saídas",      desc:"Resumo do mês com saldo final",             tier:"free",    color:"#60A5FA", iconKey:"inout",   route:"/relatorios/extrato"},
  pie:        {title:"Gastos por categoria",   desc:"Para onde seu dinheiro foi",                tier:"free",    color:"#A78BFA", iconKey:"pie"},
  flame:      {title:"Maiores gastos",         desc:"Top despesas e recorrentes do período",     tier:"free",    color:"#F87171", iconKey:"flame"},
  flow:       {title:"Fluxo de caixa",         desc:"Evolução do saldo mês a mês",              tier:"free",    color:"#2DD4BF", iconKey:"flow",    route:"/fluxo-caixa"},
  compare:    {title:"Comparativo entre meses",desc:"Compare dois períodos lado a lado",         tier:"pro",     color:"#60A5FA", iconKey:"compare"},
  budget:     {title:"Orçamento x realizado",  desc:"Metas planejadas vs. gastos reais",        tier:"pro",     color:"#4ADE80", iconKey:"target"},
  dre:        {title:"DRE simplificado",       desc:"Resultado: receitas − custos − despesas",  tier:"premium", color:"#FBBF24", iconKey:"dre"},
  wallet:     {title:"Por conta / carteira",   desc:"Saldo e movimento por banco",              tier:"free",    color:"#2DD4BF", iconKey:"wallet"},
  card:       {title:"Por cartão de crédito",  desc:"Fatura e gastos por cartão",               tier:"free",    color:"#F472B6", iconKey:"card"},
  group:      {title:"Por grupo",              desc:"Despesas compartilhadas e divisões",       tier:"free",    color:"#A78BFA", iconKey:"group"},
  annual:     {title:"Relatório anual",        desc:"Resumo completo do ano em um doc",         tier:"premium", color:"#60A5FA", iconKey:"annual"},
  accountant: {title:"Extrato para o contador",desc:"Lançamentos detalhados p/ contabilidade",  tier:"premium", color:"#94A3B8", iconKey:"acct"},
};

const SECTIONS: Array<{sec:string; ids:string[]}> = [
  {sec:"Mais usados",               ids:["inout","pie","flame"]},
  {sec:"Análises",                  ids:["flow","compare","budget","dre"]},
  {sec:"Por fonte",                 ids:["wallet","card","group"]},
  {sec:"Fechamento e contabilidade",ids:["annual","accountant"]},
];

// ── Sheet types ──
type Sheet =
  | {kind:"none"}
  | {kind:"period"}
  | {kind:"report"; id:string; items:FinanceItem[]; from:string; to:string}
  | {kind:"paywall"; title:string; desc:string; requiredTier:"pro"|"premium"};

// ── Main component ──────────────────────────────────────
export default function Relatorios() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FinanceItem[]>([]);
  const [periFrom, setPeriFrom] = useState(initFrom);
  const [periTo, setPeriTo] = useState(initTo);
  const [periFlag, setPeriFlag] = useState("Este mês");
  const [customFrom, setCustomFrom] = useState(initFrom);
  const [customTo, setCustomTo] = useState(initTo);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all"|"free"|"pro"|"premium">("all");
  const planName = getPlanName(); // "Basico" | "Pro" | "Premium" | null
  const userTier: Tier = planName === "Premium" ? "premium" : planName === "Pro" ? "pro" : "free";
  const [sheet, setSheet] = useState<Sheet>({kind:"none"});
  const [toast, setToast] = useState<string|null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(() => {
    const load = () => setItems(financeList());
    load();
    void financeRefreshFromApi().then(setItems).catch(()=>{});
    const unsub = financeSubscribe(load);
    const refresh = () => void financeRefreshFromApi().then(setItems).catch(()=>{});
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { unsub(); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    if(toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(()=>setToast(null), 2200);
  }

  const periodItems = useMemo(
    ()=>items.filter(it=>it.dateISO>=periFrom && it.dateISO<=periTo),
    [items, periFrom, periTo]
  );

  const totRec = useMemo(()=>periodItems.filter(it=>it.type==="RECEITA").reduce((s,it)=>s+it.amountCents,0),[periodItems]);
  const totDes = useMemo(()=>periodItems.filter(it=>it.type==="DESPESA").reduce((s,it)=>s+it.amountCents,0),[periodItems]);
  const saldo = totRec - totDes;

  // Spark — last 6 months net saldo (all items, not period-filtered)
  const sparkVals = useMemo(() => {
    const d = new Date();
    return Array.from({length:6},(_,i) => {
      const dt = new Date(d.getFullYear(), d.getMonth()-5+i, 1);
      const mk = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`;
      const mi = items.filter(it=>it.dateISO.startsWith(mk));
      const r = mi.filter(it=>it.type==="RECEITA").reduce((s,it)=>s+it.amountCents,0);
      const dp = mi.filter(it=>it.type==="DESPESA").reduce((s,it)=>s+it.amountCents,0);
      return r - dp;
    });
  }, [items]);
  const sparkMax = Math.max(...sparkVals.map(Math.abs), 1);

  const topDespesa = useMemo(()=>{
    const des = periodItems.filter(it=>it.type==="DESPESA");
    return des.length ? des.reduce((t,it)=>it.amountCents>t.amountCents?it:t, des[0]) : null;
  },[periodItems]);

  function isLocked(repTier: Tier): boolean {
    if (repTier === "free") return false;
    if (repTier === "pro") return userTier === "free";
    return userTier !== "premium";
  }

  // Filter report cards
  const sq = search.trim().toLowerCase();
  const visSections = SECTIONS.map(s=>({
    sec: s.sec,
    items: s.ids.map(id=>({id,...REPS[id]})).filter(r=>{
      if(filterTab==="free" && r.tier!=="free") return false;
      if(filterTab==="pro" && r.tier!=="pro") return false;
      if(filterTab==="premium" && r.tier!=="premium") return false;
      if(sq && !r.title.toLowerCase().includes(sq) && !r.desc.toLowerCase().includes(sq)) return false;
      return true;
    }),
  })).filter(s=>s.items.length>0);

  function openCard(id: string) {
    const def = REPS[id];
    if(!def) return;
    if(isLocked(def.tier)) {
      const rt = def.tier as "pro"|"premium";
      setSheet({kind:"paywall", title:def.title, desc:def.desc, requiredTier:rt});
      return;
    }
    if(def.route) { navigate(def.route); return; }
    setSheet({kind:"report", id, items:periodItems, from:periFrom, to:periTo});
  }

  function closeSheet() { setSheet({kind:"none"}); }

  function applyPreset(p:{flag:string;from:string;to:string}) {
    setPeriFrom(p.from); setPeriTo(p.to); setPeriFlag(p.flag);
    setCustomFrom(p.from); setCustomTo(p.to);
    closeSheet();
  }

  function applyCustom() {
    if(!customFrom || !customTo) return;
    const [f,t] = customFrom>customTo ? [customTo,customFrom] : [customFrom,customTo];
    setPeriFrom(f); setPeriTo(t); setPeriFlag("Personalizado");
    closeSheet();
  }

  // Card hint element
  function repHint(id: string) {
    if(id==="inout") {
      const c = saldo>=0?"#4ADE80":"#F87171";
      return <span style={{fontFamily:"'Space Grotesk',system-ui",fontSize:12,fontWeight:700,color:c,whiteSpace:"nowrap"}}>{saldo>=0?"+ ":"− "}{fmt(Math.abs(saldo))}</span>;
    }
    if(id==="pie") return (
      <svg width={26} height={26} viewBox="0 0 36 36" style={{transform:"rotate(-90deg)"}}>
        <circle cx={18} cy={18} r={14} fill="none" stroke="rgba(148,163,184,.18)" strokeWidth={5}/>
        <circle cx={18} cy={18} r={14} fill="none" stroke="#A78BFA" strokeWidth={5} strokeDasharray="44 88" strokeLinecap="round"/>
        <circle cx={18} cy={18} r={14} fill="none" stroke="#60A5FA" strokeWidth={5} strokeDasharray="26 88" strokeDashoffset={-46} strokeLinecap="round"/>
      </svg>
    );
    if(id==="flame" && topDespesa) {
      const lbl = topDespesa.title.length>14?topDespesa.title.slice(0,12)+"…":topDespesa.title;
      return <span style={{fontFamily:"'Space Grotesk',system-ui",fontSize:11,fontWeight:700,color:"#94A3B8",whiteSpace:"nowrap"}}>{lbl}</span>;
    }
    if(id==="flow") return (
      <span style={{display:"flex",alignItems:"flex-end",gap:2.5,height:22}}>
        {sparkVals.map((v,i)=>(
          <i key={i} style={{width:3.5,height:`${Math.max(15,Math.round(85*Math.abs(v)/sparkMax))}%`,borderRadius:2,flexShrink:0,
            background:`linear-gradient(180deg,${v>=0?"#60A5FA":"#F87171"},${v>=0?"#60A5FA40":"#F8717140"})`}} />
        ))}
      </span>
    );
    return null;
  }

  const presets = buildPresets();
  const periodLabel = periodStr(periFrom, periTo);

  return (
    <div className="relatorios-view">
      {/* Header */}
      <div className="rep-head">
        <button className="rep-back" onClick={()=>navigate(-1)} aria-label="Voltar">
          <SvgIc d={P.back} sw="2.2" />
        </button>
        <div className="rep-title">
          Relatórios
          <small>Central de relatórios financeiros</small>
        </div>
        <button className="rep-back" style={{marginLeft:"auto"}} aria-label="Histórico">
          <SvgIc d={P.clock} />
        </button>
      </div>

      {/* Premium/Pro banner — oculto se já é Premium */}
      {userTier !== "premium" && (
        <div className="cr-pro-banner" onClick={()=>setSheet({kind:"paywall",title:"Conciliaaí Premium",desc:"Todos os relatórios avançados liberados",requiredTier:"premium"})}>
          <span className="cr-pb-ic"><SvgIc d={P.crown} sz={21}/></span>
          <div className="cr-pb-txt">
            {userTier === "pro"
              ? <><strong>Desbloqueie relatórios Premium</strong><span>DRE, anual e extrato para o contador.</span></>
              : <><strong>Desbloqueie todos os relatórios</strong><span>Comparativos, DRE, anual e muito mais.</span></>}
          </div>
          <span className="cr-pb-cta">{userTier === "pro" ? "Ver Premium" : "Ativar"}</span>
        </div>
      )}

      {/* Summary card */}
      <div className="rep-summary">
        <div className="cr-sum-top">
          <button className="cr-period-pill" onClick={()=>setSheet({kind:"period"})}>
            <SvgIc d={P.cal} sz={13}/>
            <span>{periodLabel}</span>
            <SvgIc d={P.chDown} sz={13}/>
          </button>
          <span className="cr-period-flag">{periFlag}</span>
        </div>
        <div className="sum-row">
          <div className="sum-tile">
            <span className="sum-ic" style={{background:"rgba(34,197,94,.14)",color:"#4ADE80"}}>
              <SvgIc d={P.up} sw="2.4"/>
            </span>
            <div>
              <small>Receitas</small>
              <strong style={{fontFamily:"'Space Grotesk',system-ui",fontSize:16.5,fontWeight:700,lineHeight:1,color:"#4ADE80",whiteSpace:"nowrap"}}>{fmt(totRec)}</strong>
            </div>
          </div>
          <div className="sum-vdiv"/>
          <div className="sum-tile">
            <span className="sum-ic" style={{background:"rgba(239,68,68,.14)",color:"#F87171"}}>
              <SvgIc d={P.down} sw="2.4"/>
            </span>
            <div>
              <small>Despesas</small>
              <strong style={{fontFamily:"'Space Grotesk',system-ui",fontSize:16.5,fontWeight:700,lineHeight:1,color:"#F87171",whiteSpace:"nowrap"}}>{fmt(totDes)}</strong>
            </div>
          </div>
        </div>
        <div className="sum-balance">
          <span className="lbl">Saldo do período</span>
          <span className="val" style={{color:saldo>=0?"#4ADE80":"#F87171"}}>
            {saldo>=0?"+ ":"− "}{fmt(Math.abs(saldo))}
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="rep-search-wrap" style={{marginBottom:12}}>
        <SvgIc d={P.search}/>
        <input
          className="rep-search-input"
          placeholder="Buscar relatório…"
          value={search}
          onChange={e=>setSearch(e.target.value)}
        />
        {search && <button className="rep-search-clear" onClick={()=>setSearch("")}>×</button>}
      </div>

      {/* Segmented filter */}
      <div className="rep-seg" style={{marginBottom:20}}>
        <button className={filterTab==="all"?"is-active":""} onClick={()=>setFilterTab("all")}>Todos</button>
        <button className={filterTab==="free"?"is-active":""} onClick={()=>setFilterTab("free")}>Grátis</button>
        <button className={filterTab==="pro"?"is-active":""} onClick={()=>setFilterTab("pro")}>Pro</button>
        <button className={filterTab==="premium"?"is-active":""} onClick={()=>setFilterTab("premium")}>Premium</button>
      </div>

      {/* Report sections */}
      {visSections.length===0 ? (
        <div className="rep-empty">
          <SvgIc d={P.search}/>
          <strong>Nenhum relatório encontrado</strong>
          <small>Tente outro termo ou filtro.</small>
        </div>
      ) : visSections.map(sec=>(
        <div key={sec.sec} className="cr-section">
          <div className="cr-section-head">
            <h3>{sec.sec}</h3>
            <div className="cr-section-line"/>
          </div>
          <div className="cr-cards">
            {sec.items.map(rep=>{
              const locked = isLocked(rep.tier);
              return (
                <div key={rep.id} className={`cr-card${locked?" cr-locked":""}`} onClick={()=>openCard(rep.id)}>
                  <span className="cr-ic" style={{background:hexBg(rep.color,0.14),color:rep.color}}>
                    <SvgIc d={P[rep.iconKey]} sz={22}/>
                  </span>
                  <div className="cr-main">
                    <div className="cr-title-row">
                      <strong>{rep.title}</strong>
                      {rep.tier==="pro" && <span className="cr-pro-pill">PRO</span>}
                      {rep.tier==="premium" && <span className="cr-pro-pill" style={{background:"linear-gradient(135deg,#FBBF24,#F59E0B)",color:"#3a2a06"}}>PREMIUM</span>}
                    </div>
                    <p>{rep.desc}</p>
                  </div>
                  <div className="cr-right">
                    {repHint(rep.id) && <span className="cr-hint">{repHint(rep.id)}</span>}
                    {locked
                      ? <span className="cr-lock"><SvgIc d={P.lock}/></span>
                      : <span className="cr-chev"><SvgIc d={P.chRt}/></span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Toast */}
      {toast && createPortal(
        <div className="cr-toast">
          <SvgIc d={P.check} sw="2.6"/>
          <span>{toast}</span>
        </div>,
        document.body
      )}

      {/* Sheet portal */}
      {sheet.kind!=="none" && createPortal(
        <div className="rep-sheet-scrim" onClick={closeSheet}>
          <div className="rep-sheet" onClick={e=>e.stopPropagation()}>
            <div className="sheet-handle"/>

            {/* Period picker */}
            {sheet.kind==="period" && <>
              <div style={{display:"flex",alignItems:"center",gap:13,marginBottom:4}}>
                <span style={{width:46,height:46,borderRadius:13,background:"rgba(59,130,246,.16)",color:"#60A5FA",display:"grid",placeItems:"center",flexShrink:0}}>
                  <SvgIc d={P.cal} sz={23}/>
                </span>
                <div>
                  <h4 style={{fontFamily:"'Space Grotesk',system-ui",fontSize:16.5,fontWeight:700}}>Período do relatório</h4>
                  <p style={{fontSize:12,color:"#94A3B8",marginTop:3}}>Escolha o intervalo de análise</p>
                </div>
              </div>
              {presets.map(ps=>(
                <button key={ps.flag} className={`sheet-act${ps.from===periFrom&&ps.to===periTo?" primary":""}`} onClick={()=>applyPreset(ps)}>
                  <span className="si" style={{background:"rgba(96,165,250,.14)",color:"#60A5FA"}}><SvgIc d={P.cal} sz={20}/></span>
                  <span className="st"><strong>{ps.flag}</strong><small>{periodStr(ps.from,ps.to)}</small></span>
                  {ps.from===periFrom&&ps.to===periTo && <SvgIc d={P.check} sw="2.6"/>}
                </button>
              ))}
              <div style={{height:1,background:"rgba(148,163,184,.12)",margin:"6px 2px"}}/>
              <p style={{fontSize:12,color:"#94A3B8",margin:"0 2px 6px",fontWeight:700}}>Período personalizado</p>
              <div className="cr-range-fields">
                <div className="cr-range-field">
                  <label>De</label>
                  <input type="date" value={customFrom} max="2099-12-31" onChange={e=>setCustomFrom(e.target.value)}/>
                </div>
                <div className="cr-range-field">
                  <label>Até</label>
                  <input type="date" value={customTo} max="2099-12-31" onChange={e=>setCustomTo(e.target.value)}/>
                </div>
              </div>
              <button className="cr-range-apply" onClick={applyCustom}>Aplicar período</button>
              <button className="sheet-cancel" onClick={closeSheet}>Fechar</button>
            </>}

            {/* Free report action sheet */}
            {sheet.kind==="report" && (()=>{
              type RS = Extract<Sheet, {kind:"report"}>;
              const s = sheet as RS;
              const def = REPS[s.id];
              if(!def) return null;
              const lbl = `${def.title} · ${periodStr(s.from,s.to)}`;
              function handleView() {
                closeSheet();
                showToast("Em desenvolvimento…");
              }
              function handlePdf() { closeSheet(); printReport(s.items, lbl); }
              function handleShare() {
                const rec = s.items.filter(it=>it.type==="RECEITA").reduce((acc,it)=>acc+it.amountCents,0);
                const des = s.items.filter(it=>it.type==="DESPESA").reduce((acc,it)=>acc+it.amountCents,0);
                const text = `Relatório Conciliaaí — ${lbl}\nReceitas: ${fmt(rec)}\nDespesas: ${fmt(des)}\nSaldo: ${fmt(rec-des)}`;
                if(navigator.share) void navigator.share({title:"Relatório Conciliaaí",text});
                else void navigator.clipboard.writeText(text).then(()=>window.alert("Resumo copiado."));
                closeSheet();
              }
              return <>
                <div style={{display:"flex",alignItems:"center",gap:13,marginBottom:4}}>
                  <span style={{width:46,height:46,borderRadius:13,background:hexBg(def.color,0.16),color:def.color,display:"grid",placeItems:"center",flexShrink:0}}>
                    <SvgIc d={P[def.iconKey]} sz={23}/>
                  </span>
                  <div>
                    <h4 style={{fontFamily:"'Space Grotesk',system-ui",fontSize:16.5,fontWeight:700}}>{def.title}</h4>
                    <p style={{fontSize:12,color:"#94A3B8",marginTop:3}}>{periodStr(s.from,s.to)} · {def.desc.toLowerCase()}</p>
                  </div>
                </div>
                <button className="sheet-act primary" onClick={handleView}>
                  <span className="si" style={{background:"rgba(59,130,246,.16)",color:"#60A5FA"}}><SvgIc d={P.eye} sz={20}/></span>
                  <span className="st"><strong>Ver na tela</strong><small>Visualizar com gráficos e detalhes</small></span>
                </button>
                <button className="sheet-act" onClick={handlePdf}>
                  <span className="si" style={{background:"rgba(239,68,68,.16)",color:"#F87171"}}><SvgIc d={P.pdf} sz={20}/></span>
                  <span className="st"><strong>Baixar PDF</strong><small>Documento pronto para imprimir</small></span>
                </button>
                <button className="sheet-act" onClick={handleShare}>
                  <span className="si" style={{background:"rgba(45,212,191,.16)",color:"#2DD4BF"}}><SvgIc d={P.share} sz={20}/></span>
                  <span className="st"><strong>Compartilhar</strong><small>WhatsApp, e-mail, Drive…</small></span>
                </button>
                <button className="sheet-cancel" onClick={closeSheet}>Cancelar</button>
              </>;
            })()}

            {/* Paywall */}
            {sheet.kind==="paywall" && (()=>{
              type PW = Extract<Sheet, {kind:"paywall"}>;
              const pw = sheet as PW;
              const isPro = pw.requiredTier === "pro";
              const planLabel = isPro ? "Pro" : "Premium";
              const planColor = isPro ? "#60A5FA" : "#FBBF24";
              const planBg = isPro ? "linear-gradient(135deg,#3B82F6,#2563EB)" : "linear-gradient(135deg,#FBBF24,#F59E0B)";
              const planTextColor = isPro ? "#fff" : "#3a2a06";
              const proFeatures = isPro
                ? [pw.desc,"Comparativo entre dois períodos","Orçamento planejado vs. realizado","Acesso a todos os recursos Pro"]
                : [pw.desc,"DRE simplificado e relatório anual","Extrato detalhado para o contador","Todos os recursos Pro inclusos"];
              return <>
                <div style={{display:"flex",alignItems:"center",gap:13,marginBottom:4}}>
                  <span style={{width:46,height:46,borderRadius:13,background:planBg,color:planTextColor,display:"grid",placeItems:"center",flexShrink:0}}>
                    <SvgIc d={P.crown} sz={23}/>
                  </span>
                  <div>
                    <h4 style={{fontFamily:"'Space Grotesk',system-ui",fontSize:16.5,fontWeight:700}}>{pw.title}</h4>
                    <p style={{fontSize:12,color:"#94A3B8",marginTop:3}}>Disponível no plano <b style={{color:planColor}}>{planLabel}</b></p>
                  </div>
                </div>
                <div style={{display:"grid",gap:8,margin:"4px 0 6px"}}>
                  {proFeatures.map(f=>(
                    <div key={f} style={{display:"flex",alignItems:"center",gap:10,fontSize:13,fontWeight:600,color:"#e2e8f0"}}>
                      <SvgIc d={P.check} sw="2.6"/>{f}
                    </div>
                  ))}
                </div>
                <button className="cr-pw-cta" style={isPro?{background:"linear-gradient(135deg,#3B82F6,#2563EB)"}:{}} onClick={()=>{closeSheet();showToast("Abrindo planos…");}}>
                  Ativar plano {planLabel}
                </button>
                <p style={{fontSize:11,color:"#64748b",textAlign:"center"}}>7 dias grátis · cancele quando quiser</p>
                <button className="sheet-cancel" onClick={closeSheet}>Agora não</button>
              </>;
            })()}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
