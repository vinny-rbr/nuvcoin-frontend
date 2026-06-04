/* ============================================================
   Conciliaaí — Dashboard chart components
   Implements the 4 charts chosen in the design handoff:
   1. InteractiveDonut   — filled-sector donut (v6)
   2. AreaTrendChart     — smooth area + crosshair (v1)
   3. MiniRingsCompare   — two mini-ring donuts (v1)
   4. SummaryCards       — stat cards with sparkline (v1)
   ============================================================ */

import { useEffect, useRef, useState } from "react";

// ─── Color tokens (green=receitas · red=despesas · blue=saldo) ────
const G = "#34d399";
const R = "#fb7185";
const B = "#60a5fa";

// ─── Geometry ─────────────────────────────────────────────────────
function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function sectorD(cx: number, cy: number, rOut: number, rIn: number, a0: number, a1: number) {
  const [ox0, oy0] = polar(cx, cy, rOut, a0);
  const [ox1, oy1] = polar(cx, cy, rOut, a1);
  const [ix1, iy1] = polar(cx, cy, rIn, a1);
  const [ix0, iy0] = polar(cx, cy, rIn, a0);
  const lg = a1 - a0 > 180 ? 1 : 0;
  return `M ${ox0} ${oy0} A ${rOut} ${rOut} 0 ${lg} 1 ${ox1} ${oy1} L ${ix1} ${iy1} A ${rIn} ${rIn} 0 ${lg} 0 ${ix0} ${iy0} Z`;
}

function arcD(cx: number, cy: number, r: number, a0: number, a1: number) {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const lg = a1 - a0 > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${lg} 1 ${x1} ${y1}`;
}

function smooth(pts: [number, number][], t = 0.5): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * t * 2;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * t * 2;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * t * 2;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * t * 2;
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

function niceMax(v: number): number {
  if (v <= 0) return 10;
  const exp = Math.floor(Math.log10(v));
  const base = Math.pow(10, exp);
  const f = v / base;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nf * base;
}

// ─── Formatters ───────────────────────────────────────────────────
function brl(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function brlShort(cents: number): string {
  const v = Math.abs(cents) / 100;
  const sign = cents < 0 ? "-" : "";
  if (v >= 1000) return sign + "R$ " + (v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "k";
  return sign + "R$ " + v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

/* Format whole-BRL values (chartData is already divided by 100) */
function brlVal(v: number): string {
  if (v >= 1000) return "R$ " + (v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "k";
  return "R$ " + v.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

function brlValFull(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function pctStr(n: number, d: number): string {
  if (!d) return "0%";
  return ((n / d) * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%";
}

// ─── Hooks ────────────────────────────────────────────────────────
function useInView(threshold = 0.18) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 1.1) { setInView(true); return; }

    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); io.disconnect(); } },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}

function useTween(active: boolean, dur = 820): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!active) return;
    setP(0);
    const t0 = Date.now();
    const iv = setInterval(() => {
      const raw = Math.min(1, (Date.now() - t0) / dur);
      const e = 1 - Math.pow(1 - raw, 3);
      setP(e);
      if (raw >= 1) { setP(1); clearInterval(iv); }
    }, 1000 / 30);
    setTimeout(() => { setP(1); clearInterval(iv); }, dur + 400);
    return () => clearInterval(iv);
  }, [active, dur]);
  return p;
}

function useCountUp(target: number, active: boolean, dur = 1100): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) { setVal(0); return; }
    const t0 = Date.now();
    const iv = setInterval(() => {
      const raw = Math.min(1, (Date.now() - t0) / dur);
      const e = 1 - Math.pow(1 - raw, 3);
      setVal(Math.round(target * e));
      if (raw >= 1) { setVal(target); clearInterval(iv); }
    }, 1000 / 30);
    setTimeout(() => { setVal(target); clearInterval(iv); }, dur + 400);
    return () => clearInterval(iv);
  }, [target, active, dur]);
  return active ? val : 0;
}

function useStrokeAnim(active: boolean, dur = 1100, delay = 0): number {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!active) return;
    const tid = setTimeout(() => {
      const t0 = Date.now();
      const iv = setInterval(() => {
        const raw = Math.min(1, (Date.now() - t0) / dur);
        const e = 1 - Math.pow(1 - raw, 3);
        setProgress(e);
        if (raw >= 1) { setProgress(1); clearInterval(iv); }
      }, 1000 / 30);
      setTimeout(() => { setProgress(1); clearInterval(iv); }, dur + 400);
    }, delay);
    return () => clearTimeout(tid);
  }, [active, dur, delay]);
  return active ? progress : 0;
}

// ─── Sparkline ────────────────────────────────────────────────────
let _sparkId = 0;
function Spark({ vals, color, w = 96, h = 28 }: { vals: number[]; color: string; w?: number; h?: number }) {
  const id = useRef("sk" + ++_sparkId).current;
  if (vals.length < 2) return null;
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const rng = max - min || 1;
  const pts: [number, number][] = vals.map((v, i) => [(i / (vals.length - 1)) * w, h - 3 - ((v - min) / rng) * (h - 6)]);
  const line = smooth(pts);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ overflow: "visible", display: "block" }} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${line} L ${w} ${h} L 0 ${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CHART 1 — InteractiveDonut (v6 Setores interativos)
// ═══════════════════════════════════════════════════════════════════

export function InteractiveDonut({
  receitasCents,
  despesasCents,
  saldoCents,
  periodo,
}: {
  receitasCents: number;
  despesasCents: number;
  saldoCents: number;
  periodo: string;
}) {
  const [cardRef, inView] = useInView();
  const tweenProg = useTween(inView);
  const saldoAnimated = useCountUp(Math.abs(saldoCents), inView);
  const [hovered, setHovered] = useState<number | null>(null);
  const [tip, setTip] = useState<{ html: string; x: number; y: number } | null>(null);

  const total = receitasCents + despesasCents || 1;
  const segs = [
    { nm: "Receitas", v: receitasCents, c: G },
    { nm: "Despesas", v: despesasCents, c: R },
  ];

  let angle = 0;
  const sectors = segs.map((seg) => {
    const a0 = angle + 1.5;
    const a1 = angle + (seg.v / total) * 360 - 1.5;
    const mid = (a0 + a1) / 2;
    angle += (seg.v / total) * 360;
    return { ...seg, a0, a1: Math.max(a0 + 0.1, a1), mid };
  });

  return (
    <div ref={cardRef} className="chart-card dashboard-panel" style={{ minHeight: "unset", position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-.01em" }}>Receitas × Despesas</div>
          <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 3 }}>{periodo}</div>
        </div>
        <span style={{
          border: "1px solid rgba(96,165,250,.3)",
          background: "rgba(15,23,42,.5)",
          color: B,
          fontWeight: 800,
          fontSize: 13,
          padding: "7px 13px",
          borderRadius: 999,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}>
          {brl(saldoCents)}
        </span>
      </div>

      {/* Donut */}
      <div style={{ position: "relative", width: 210, height: 210, margin: "6px auto 2px" }}>
        <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ overflow: "visible" }}>
          <g style={{
            transformOrigin: "100px 100px",
            transform: `scale(${(0.6 + 0.4 * tweenProg).toFixed(4)})`,
            opacity: tweenProg,
          }}>
            {sectors.map((seg, i) => (
              <path
                key={i}
                d={sectorD(100, 100, 86, 56, seg.a0, seg.a1)}
                fill={seg.c}
                stroke="rgba(10,15,30,.6)"
                strokeWidth={1.5}
                style={{
                  cursor: "pointer",
                  transition: "transform .2s cubic-bezier(0.16,1,0.3,1)",
                  transformOrigin: "100px 100px",
                  transform: hovered === i
                    ? `scale(1.04) translate(${(Math.sin((seg.mid - 90) * Math.PI / 180) * 3).toFixed(3)}px,${(-Math.cos((seg.mid - 90) * Math.PI / 180) * 3).toFixed(3)}px)`
                    : "scale(1)",
                }}
                onMouseMove={(e) => {
                  setHovered(i);
                  setTip({
                    html: `${seg.nm}`,
                    x: e.clientX,
                    y: e.clientY,
                  });
                }}
                onMouseLeave={() => { setHovered(null); setTip(null); }}
              />
            ))}
          </g>
        </svg>

        {/* Center label */}
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", pointerEvents: "none" }}>
          <div style={{ whiteSpace: "nowrap" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: 11, fontWeight: 700 }}>Saldo</div>
            <strong style={{ display: "block", fontSize: 23, fontWeight: 700, color: saldoCents >= 0 ? G : R }}>
              {saldoCents < 0 ? "-" : ""}{brlShort(inView ? saldoAnimated : 0)}
            </strong>
            <small style={{ color: "var(--text-secondary)", fontSize: 10 }}>{periodo}</small>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
        {segs.map((seg) => (
          <div key={seg.nm} style={{
            display: "grid",
            gridTemplateColumns: "auto minmax(0,1fr) auto",
            alignItems: "center",
            gap: 10,
            border: "1px solid rgba(148,163,184,.09)",
            background: "rgba(15,23,42,.36)",
            borderRadius: 12,
            padding: "11px 13px",
          }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: seg.c, display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: 13.5 }}>{seg.nm}</span>
            <span style={{ display: "flex", alignItems: "baseline", gap: 7, whiteSpace: "nowrap" }}>
              <strong style={{ fontWeight: 800, fontSize: 13.5, color: seg.c }}>{brl(seg.v)}</strong>
              <span style={{ color: "var(--text-secondary)", fontSize: 12, fontWeight: 700 }}>{pctStr(seg.v, total)}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tip && (() => {
        const seg = sectors[hovered!];
        if (!seg) return null;
        return (
          <div style={{
            position: "fixed",
            zIndex: 9999,
            pointerEvents: "none",
            left: tip.x - 90,
            top: tip.y - 56,
            background: "rgba(15,23,42,.97)",
            border: "1px solid rgba(96,165,250,.24)",
            borderRadius: 12,
            boxShadow: "0 28px 80px rgba(2,6,23,.6)",
            padding: "10px 13px",
            fontSize: 12.5,
            color: "#f1f5f9",
            minWidth: 140,
          }}>
            <div style={{ fontWeight: 800, fontSize: 12, color: "#cbd5e1", marginBottom: 6 }}>{seg.nm}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: seg.c, display: "inline-block", flexShrink: 0 }} />
              <span style={{ color: "var(--text-secondary)" }}>valor</span>
              <span style={{ marginLeft: "auto", fontWeight: 800 }}>{brl(seg.v)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
              <span style={{ width: 9, display: "inline-block", flexShrink: 0 }} />
              <span style={{ color: "var(--text-secondary)", paddingLeft: 0 }}>do total</span>
              <span style={{ marginLeft: "auto", fontWeight: 800 }}>{pctStr(seg.v, total)}</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CHART 2 — AreaTrendChart (v1 Área com gradiente)
// ═══════════════════════════════════════════════════════════════════

export interface TrendPoint {
  mes: string;
  receitas: number; // whole BRL (cents / 100)
  despesas: number;
}

const VW = 560, VH = 300, PL = 46, PR = 16, PT = 16, PB = 36;
const PW = VW - PL - PR, PH = VH - PT - PB, BASE = PT + PH;

export function AreaTrendChart({ data, periodo }: { data: TrendPoint[]; periodo: string }) {
  const [cardRef, inView] = useInView();
  const drawProg = useTween(inView, 1400);

  const strokeRRef = useRef<SVGPathElement>(null);
  const strokeDRef = useRef<SVGPathElement>(null);
  const [lenR, setLenR] = useState<number | null>(null);
  const [lenD, setLenD] = useState<number | null>(null);
  const [cross, setCross] = useState<{ x: number; idx: number } | null>(null);

  if (data.length === 0) return null;
  const n = data.length;
  const max = niceMax(Math.max(...data.map((d) => Math.max(d.receitas, d.despesas))));
  const xs = data.map((_, i) => PL + (n === 1 ? PW / 2 : (i / (n - 1)) * PW));

  const ptsR: [number, number][] = data.map((d, i) => [xs[i], BASE - (d.receitas / max) * PH]);
  const ptsD: [number, number][] = data.map((d, i) => [xs[i], BASE - (d.despesas / max) * PH]);
  const lineR = smooth(ptsR);
  const lineD = smooth(ptsD);

  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const v = (max / 4) * i;
    return { v, y: BASE - (v / max) * PH };
  });

  // Measure stroke lengths after mount / when paths change
  useEffect(() => {
    if (strokeRRef.current) {
      const l = strokeRRef.current.getTotalLength();
      if (l > 0) setLenR(l);
    }
    if (strokeDRef.current) {
      const l = strokeDRef.current.getTotalLength();
      if (l > 0) setLenD(l);
    }
  });

  const activePt = cross != null ? data[cross.idx] : null;

  const handleMove = (e: React.MouseEvent<SVGRectElement>) => {
    const svgEl = e.currentTarget.ownerSVGElement;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * VW;
    let idx = 0, best = 1e9;
    xs.forEach((x, i) => { const dd = Math.abs(x - px); if (dd < best) { best = dd; idx = i; } });
    setCross({ x: xs[idx], idx });
  };

  return (
    <div ref={cardRef} className="chart-card dashboard-panel" style={{ position: "relative" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-.01em" }}>Receitas × Despesas</div>
          <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 3 }}>{periodo}</div>
        </div>
        <span style={{
          border: "1px solid rgba(148,163,184,.13)",
          background: "rgba(15,23,42,.5)",
          color: "#94a3b8",
          fontWeight: 800,
          fontSize: 12,
          padding: "6px 12px",
          borderRadius: 999,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}>
          Mensal
        </span>
      </div>

      <div style={{ position: "relative" }}>
        <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" style={{ display: "block", overflow: "visible" }}>
          {/* Y grid + labels */}
          {yTicks.map(({ v, y }) => (
            <g key={v}>
              <line x1={PL} y1={y} x2={PL + PW} y2={y} stroke="rgba(148,163,184,.12)" strokeDasharray="3 4" />
              <text x={PL - 8} y={y + 3} textAnchor="end" fill="var(--text-secondary)" fontSize={11} fontWeight={600}>{brlVal(v)}</text>
            </g>
          ))}

          {/* X labels */}
          {data.map((d, i) => (
            <text key={i} x={xs[i]} y={BASE + 20} textAnchor="middle" fill="var(--text-secondary)" fontSize={11} fontWeight={600}>{d.mes}</text>
          ))}

          {/* Area fills */}
          <path d={`${lineD} L ${xs[n - 1]} ${BASE} L ${xs[0]} ${BASE} Z`} fill="rgba(239,68,68,.13)" />
          <path d={`${lineR} L ${xs[n - 1]} ${BASE} L ${xs[0]} ${BASE} Z`} fill="rgba(34,197,94,.16)" />

          {/* Animated strokes */}
          <path
            ref={strokeDRef}
            d={lineD}
            fill="none"
            stroke={R}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={lenD ?? undefined}
            strokeDashoffset={lenD != null ? lenD * (1 - drawProg) : undefined}
          />
          <path
            ref={strokeRRef}
            d={lineR}
            fill="none"
            stroke={G}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={lenR ?? undefined}
            strokeDashoffset={lenR != null ? lenR * (1 - drawProg) : undefined}
          />

          {/* Crosshair */}
          {cross && activePt && (
            <>
              <line x1={cross.x} y1={PT} x2={cross.x} y2={BASE} stroke="rgba(148,163,184,.4)" strokeWidth={1} />
              <circle cx={cross.x} cy={BASE - (activePt.receitas / max) * PH} r={5} fill={G} stroke="#0a0f1e" strokeWidth={2} />
              <circle cx={cross.x} cy={BASE - (activePt.despesas / max) * PH} r={5} fill={R} stroke="#0a0f1e" strokeWidth={2} />
            </>
          )}

          {/* Invisible hit area */}
          <rect
            x={PL} y={PT} width={PW} height={PH}
            fill="transparent"
            style={{ cursor: "crosshair" }}
            onMouseMove={handleMove}
            onMouseLeave={() => setCross(null)}
          />
        </svg>

        {/* Crosshair tooltip */}
        {cross && activePt && (() => {
          const pxFrac = (cross.x - PL) / PW;
          const leftPct = Math.min(Math.max(pxFrac * 100, 10), 85);
          return (
            <div style={{
              position: "absolute",
              top: 0,
              left: `${leftPct}%`,
              transform: "translateX(-50%)",
              pointerEvents: "none",
              background: "rgba(15,23,42,.97)",
              border: "1px solid rgba(96,165,250,.24)",
              borderRadius: 12,
              padding: "10px 13px",
              fontSize: 12.5,
              color: "#f1f5f9",
              whiteSpace: "nowrap",
              zIndex: 10,
              boxShadow: "0 28px 80px rgba(2,6,23,.6)",
            }}>
              <div style={{ fontWeight: 800, fontSize: 12, color: "#cbd5e1", marginBottom: 6 }}>{activePt.mes}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: G, display: "inline-block", flexShrink: 0 }} />
                <span style={{ color: "var(--text-secondary)" }}>Receitas</span>
                <span style={{ marginLeft: "auto", fontWeight: 800, paddingLeft: 12 }}>{brlValFull(activePt.receitas)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: R, display: "inline-block", flexShrink: 0 }} />
                <span style={{ color: "var(--text-secondary)" }}>Despesas</span>
                <span style={{ marginLeft: "auto", fontWeight: 800, paddingLeft: 12 }}>{brlValFull(activePt.despesas)}</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 18, justifyContent: "center", marginTop: 6, flexWrap: "wrap" }}>
        {([["Receitas", G], ["Despesas", R]] as const).map(([nm, c]) => (
          <div key={nm} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 14, height: 3, borderRadius: 2, background: c, display: "inline-block" }} />
            <span style={{ color: "var(--text-secondary)", fontSize: 12.5, fontWeight: 700 }}>{nm}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CHART 3 — MiniRingsCompare (v1 Dois mini-rings)
// ═══════════════════════════════════════════════════════════════════

interface RingBlock {
  label: string;
  name: string;
  receitasCents: number;
  despesasCents: number;
  saldoCents: number;
}

function MiniRingBlock({ label, name, receitasCents, despesasCents, saldoCents, inView }: RingBlock & { inView: boolean }) {
  const total = receitasCents + despesasCents || 1;
  const aR = (receitasCents / total) * 360;

  const arcRPath = arcD(70, 70, 56, 2, Math.max(3, aR - 2));
  const arcDPath = arcD(70, 70, 56, aR + 2, 358);

  const arcRRef = useRef<SVGPathElement>(null);
  const arcDRef = useRef<SVGPathElement>(null);
  const [lenR, setLenR] = useState<number | null>(null);
  const [lenD, setLenD] = useState<number | null>(null);

  useEffect(() => {
    if (arcRRef.current) { const l = arcRRef.current.getTotalLength(); if (l > 0) setLenR(l); }
    if (arcDRef.current) { const l = arcDRef.current.getTotalLength(); if (l > 0) setLenD(l); }
  });

  const progR = useStrokeAnim(inView, 1100, 0);
  const progD = useStrokeAnim(inView, 1100, 150);
  const saldoAnimated = useCountUp(Math.abs(saldoCents), inView);

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ color: B, fontSize: 10, fontWeight: 900, letterSpacing: ".12em", textTransform: "uppercase" }}>{label}</div>
        <strong style={{ fontSize: 15, fontWeight: 700, display: "block" }}>{name}</strong>
      </div>

      <div style={{ position: "relative", width: 140, height: 140 }}>
        <svg viewBox="0 0 140 140" width="100%" height="100%">
          <circle cx={70} cy={70} r={56} fill="none" stroke="rgba(148,163,184,.1)" strokeWidth={14} />
          <path
            ref={arcRRef}
            d={arcRPath}
            fill="none"
            stroke={G}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={lenR ?? undefined}
            strokeDashoffset={lenR != null ? lenR * (1 - progR) : undefined}
          />
          <path
            ref={arcDRef}
            d={arcDPath}
            fill="none"
            stroke={R}
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={lenD ?? undefined}
            strokeDashoffset={lenD != null ? lenD * (1 - progD) : undefined}
          />
        </svg>

        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", pointerEvents: "none" }}>
          <div>
            <div style={{ color: "var(--text-secondary)", fontSize: 10, fontWeight: 700 }}>Saldo</div>
            <strong style={{ display: "block", fontSize: 15, fontWeight: 700, color: saldoCents >= 0 ? G : R }}>
              {saldoCents < 0 ? "-" : ""}{brlShort(inView ? saldoAnimated : 0)}
            </strong>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "var(--text-secondary)", fontSize: 10 }}>Receitas</div>
          <strong style={{ color: G, fontSize: 13, display: "block" }}>{brlShort(receitasCents)}</strong>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "var(--text-secondary)", fontSize: 10 }}>Despesas</div>
          <strong style={{ color: R, fontSize: 13, display: "block" }}>{brlShort(despesasCents)}</strong>
        </div>
      </div>
    </div>
  );
}

export function MiniRingsCompare({ blockA, blockB }: { blockA: RingBlock | null; blockB: RingBlock | null }) {
  const [cardRef, inView] = useInView();

  return (
    <div ref={cardRef} className="chart-card dashboard-panel" style={{ minHeight: "unset" }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-.01em" }}>Compare dois blocos</div>
        <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 3 }}>Receitas, despesas e saldo lado a lado</div>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 8, alignItems: "flex-start" }}>
        {blockA
          ? <MiniRingBlock {...blockA} inView={inView} />
          : <div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--text-secondary)", minHeight: 160 }}>Selecione uma categoria</div>
        }
        <div style={{ width: 1, alignSelf: "stretch", background: "rgba(148,163,184,.13)" }} />
        {blockB
          ? <MiniRingBlock {...blockB} inView={inView} />
          : <div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--text-secondary)", minHeight: 160 }}>Selecione uma categoria</div>
        }
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CHART 4 — SummaryCards (v1 Cards refinados)
// ═══════════════════════════════════════════════════════════════════

export interface SummaryCardItem {
  lab: string;
  v: number;      // value in cents (or 0 when txt is used)
  c: string;      // color
  s: number[];    // sparkline values in cents
  dl: string;     // change label e.g. "+4,2%"
  up: boolean;    // direction
  txt?: string;   // override display (for poupança %)
}

function StatCard({ item, inView }: { item: SummaryCardItem; inView: boolean }) {
  const animated = useCountUp(item.v, inView && !item.txt);
  return (
    <div style={{
      position: "relative",
      border: "1px solid rgba(148,163,184,.09)",
      background: "rgba(15,23,42,.4)",
      borderRadius: 14,
      padding: 14,
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "var(--text-secondary)", fontSize: 11.5, fontWeight: 700 }}>{item.lab}</span>
        <span style={{
          fontSize: 10.5,
          fontWeight: 800,
          padding: "2px 7px",
          borderRadius: 999,
          color: item.up ? G : R,
          background: item.up ? "rgba(52,211,153,.14)" : "rgba(251,113,133,.14)",
        }}>
          {item.up ? "▲ " : "▼ "}{item.dl}
        </span>
      </div>
      <strong style={{ display: "block", fontSize: 20, fontWeight: 700, color: item.c, marginTop: 6 }}>
        {item.txt ?? brlShort(inView ? animated : 0)}
      </strong>
      <div style={{ marginTop: 8, opacity: 0.9 }}>
        <Spark vals={item.s} color={item.c} />
      </div>
    </div>
  );
}

export function SummaryCards({ items, periodo }: { items: SummaryCardItem[]; periodo: string }) {
  const [cardRef, inView] = useInView();
  return (
    <div ref={cardRef} className="chart-card dashboard-panel">
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-.01em" }}>Resumo do período</div>
        <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 3 }}>{periodo}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {items.map((it) => <StatCard key={it.lab} item={it} inView={inView} />)}
      </div>
    </div>
  );
}
