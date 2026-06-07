import { useEffect, useRef } from "react";

type Hue = "blue" | "green" | "gold";

function pickHue(): Hue {
  const r = Math.random();
  return r < 0.5 ? "blue" : r < 0.82 ? "green" : "gold";
}

function coinGrad(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, hue: Hue): CanvasGradient {
  const g = ctx.createRadialGradient(x - r * 0.32, y - r * 0.32, r * 0.2, x, y, r);
  if (hue === "green") { g.addColorStop(0, "#86EFAC"); g.addColorStop(1, "#16A34A"); }
  else if (hue === "gold") { g.addColorStop(0, "#FDE68A"); g.addColorStop(1, "#D97706"); }
  else { g.addColorStop(0, "#93C5FD"); g.addColorStop(1, "#2563EB"); }
  return g;
}

function rgbFor(hue: Hue): string {
  return hue === "green" ? "52,211,153" : hue === "gold" ? "245,180,60" : "96,165,250";
}

interface CanvasCtl { start: () => void; stop: () => void; destroy: () => void; }

function makeCanvasScene(
  canvas: HTMLCanvasElement,
  reduce: boolean,
  hooks: {
    resize?: (w: number, h: number) => void;
    frame: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;
  },
): CanvasCtl {
  const ctx = canvas.getContext("2d")!;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0, running = false, raf = 0, t0 = 0;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = rect.width; H = rect.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    hooks.resize?.(W, H);
  }

  function loop(ts: number) {
    if (!running) return;
    if (!t0) t0 = ts;
    hooks.frame(ctx, W, H, (ts - t0) / 1000);
    raf = requestAnimationFrame(loop);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  hooks.frame(ctx, W, H, 0);

  return {
    start() { if (!running && !reduce) { running = true; t0 = 0; raf = requestAnimationFrame(loop); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    destroy() { running = false; cancelAnimationFrame(raf); ro.disconnect(); },
  };
}

export default function LoginAnimatedBg() {
  const bgRef = useRef<HTMLDivElement>(null);
  const moedasRef = useRef<HTMLDivElement>(null);
  const chuvaRef = useRef<HTMLDivElement>(null);
  const redeRef = useRef<HTMLCanvasElement>(null);
  const redecoinRef = useRef<HTMLCanvasElement>(null);
  const pulsoRef = useRef<HTMLCanvasElement>(null);
  const orbitaRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const bgEl = bgRef.current;
    const moedasEl = moedasRef.current;
    const chuvaEl = chuvaRef.current;
    const redeEl = redeRef.current;
    const redecoinEl = redecoinRef.current;
    const pulsoEl = pulsoRef.current;
    const orbitaEl = orbitaRef.current;
    if (!bgEl || !moedasEl || !chuvaEl || !redeEl || !redecoinEl || !pulsoEl || !orbitaEl) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // --- MOEDAS (rising coins) ---
    for (let i = 0; i < 16; i++) {
      const size = 18 + Math.random() * 40;
      const c = document.createElement("div");
      c.className = "coin " + pickHue();
      c.style.left = Math.random() * 100 + "%";
      c.style.bottom = "-80px";
      c.style.width = size + "px";
      c.style.height = size + "px";
      c.style.fontSize = size * 0.42 + "px";
      const blur = Math.random() > 0.55 ? 1 + Math.random() * 3.5 : 0;
      c.style.filter = blur ? `blur(${blur.toFixed(1)}px)` : "none";
      c.style.setProperty("--op", (0.18 + Math.random() * 0.4).toFixed(2));
      c.style.setProperty("--dx", Math.random() * 80 - 40 + "px");
      c.style.setProperty("--rot", Math.random() * 220 - 110 + "deg");
      c.style.animationDuration = 13 + Math.random() * 12 + "s";
      c.style.animationDelay = -Math.random() * 22 + "s";
      c.innerHTML = '<span class="face">R$</span>';
      moedasEl.appendChild(c);
    }

    // --- CHUVA (falling coins) ---
    for (let i = 0; i < 34; i++) {
      const depth = Math.random();
      const size = 12 + (1 - depth) * 34;
      const c = document.createElement("div");
      c.className = "coin " + pickHue();
      c.style.left = Math.random() * 100 + "%";
      c.style.top = "0";
      c.style.width = size + "px";
      c.style.height = size + "px";
      c.style.fontSize = size * 0.42 + "px";
      c.style.filter = depth > 0.45 ? `blur(${(depth * 3.2).toFixed(1)}px)` : "none";
      c.style.setProperty("--op", (0.16 + (1 - depth) * 0.45).toFixed(2));
      c.style.setProperty("--rot", Math.random() * 320 - 160 + "deg");
      c.style.animationDuration = 6 + depth * 9 + "s";
      c.style.animationDelay = -Math.random() * 14 + "s";
      c.innerHTML = '<span class="face">R$</span>';
      chuvaEl.appendChild(c);
    }

    // --- REDE (network nodes) ---
    interface RedeNode { x: number; y: number; vx: number; vy: number; r: number; }
    let redeNodes: RedeNode[] = [];
    let rW = 0, rH = 0;
    const redeCtl = makeCanvasScene(redeEl, reduce, {
      resize(w, h) {
        rW = w; rH = h;
        const n = Math.round(Math.min(58, (w * h) / 9000));
        redeNodes = Array.from({ length: n }, () => ({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.8 + 1,
        }));
      },
      frame(ctx) {
        ctx.clearRect(0, 0, rW, rH);
        for (let i = 0; i < redeNodes.length; i++) {
          const nd = redeNodes[i];
          nd.x += nd.vx; nd.y += nd.vy;
          if (nd.x < 0 || nd.x > rW) nd.vx *= -1;
          if (nd.y < 0 || nd.y > rH) nd.vy *= -1;
          for (let j = i + 1; j < redeNodes.length; j++) {
            const m = redeNodes[j], dx = nd.x - m.x, dy = nd.y - m.y, d = Math.sqrt(dx * dx + dy * dy);
            if (d < 128) {
              ctx.strokeStyle = `rgba(96,165,250,${((1 - d / 128) * 0.5).toFixed(3)})`;
              ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(nd.x, nd.y); ctx.lineTo(m.x, m.y); ctx.stroke();
            }
          }
        }
        for (const p of redeNodes) {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832);
          ctx.fillStyle = "rgba(147,197,253,0.9)";
          ctx.shadowColor = "rgba(96,165,250,0.8)"; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0;
        }
      },
    });

    // --- REDE + MOEDAS (coin nodes connected by lines) ---
    interface RCNode { x: number; y: number; vx: number; vy: number; r: number; hue: Hue; sp: number; }
    let rcNodes: RCNode[] = [];
    let rcW = 0, rcH = 0;
    const redecoinCtl = makeCanvasScene(redecoinEl, reduce, {
      resize(w, h) {
        rcW = w; rcH = h;
        const n = Math.round(Math.min(26, (w * h) / 26000));
        rcNodes = Array.from({ length: n }, () => ({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
          r: 7 + Math.random() * 11, hue: pickHue(), sp: 0.5 + Math.random(),
        }));
      },
      frame(ctx, _w, _h, t) {
        ctx.clearRect(0, 0, rcW, rcH);
        for (let i = 0; i < rcNodes.length; i++) {
          const nd = rcNodes[i];
          nd.x += nd.vx; nd.y += nd.vy;
          if (nd.x < nd.r || nd.x > rcW - nd.r) nd.vx *= -1;
          if (nd.y < nd.r || nd.y > rcH - nd.r) nd.vy *= -1;
          for (let j = i + 1; j < rcNodes.length; j++) {
            const m = rcNodes[j], dx = nd.x - m.x, dy = nd.y - m.y, d = Math.sqrt(dx * dx + dy * dy);
            if (d < 220) {
              ctx.strokeStyle = `rgba(120,160,220,${((1 - d / 220) * 0.32).toFixed(3)})`;
              ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(nd.x, nd.y); ctx.lineTo(m.x, m.y); ctx.stroke();
            }
          }
        }
        for (let k = 0; k < rcNodes.length; k++) {
          const p = rcNodes[k];
          const squash = 0.55 + 0.45 * Math.abs(Math.cos(t * p.sp + k));
          ctx.save(); ctx.translate(p.x, p.y); ctx.scale(squash, 1);
          ctx.shadowColor = `rgba(${rgbFor(p.hue)},0.6)`; ctx.shadowBlur = 14;
          ctx.beginPath(); ctx.arc(0, 0, p.r, 0, 6.2832);
          ctx.fillStyle = coinGrad(ctx, 0, 0, p.r, p.hue); ctx.fill();
          ctx.shadowBlur = 0; ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.28)"; ctx.stroke();
          ctx.restore();
        }
      },
    });

    // --- PULSO (flow: transactions running along network edges) ---
    interface PNode { x: number; y: number; hue: Hue; glow: number; }
    interface PEdge { a: number; b: number; key: string; }
    interface Pulse { a: number; b: number; t: number; sp: number; hue: Hue; }
    let pNodes: PNode[] = [], pEdges: PEdge[] = [], pulses: Pulse[] = [];
    let pW = 0, pH = 0, pAcc = 0;

    function buildPulso(w: number, h: number) {
      pW = w; pH = h; pNodes = []; pEdges = []; pulses = [];
      const n = Math.round(Math.min(16, Math.max(8, (w * h) / 52000)));
      for (let i = 0; i < n; i++) {
        pNodes.push({ x: 40 + Math.random() * (w - 80), y: 40 + Math.random() * (h - 80), hue: pickHue(), glow: 0 });
      }
      for (let i = 0; i < pNodes.length; i++) {
        const dists = pNodes
          .map((_, j) => { const dx = pNodes[i].x - pNodes[j].x, dy = pNodes[i].y - pNodes[j].y; return { j, d: dx * dx + dy * dy }; })
          .filter(d => d.j !== i)
          .sort((a, b) => a.d - b.d);
        for (let k = 0; k < Math.min(2, dists.length); k++) {
          const [a, b] = [i, dists[k].j];
          const key = Math.min(a, b) + "-" + Math.max(a, b);
          if (!pEdges.some(e => e.key === key)) pEdges.push({ a, b, key });
        }
      }
    }

    function spawnPulse() {
      if (!pEdges.length) return;
      const e = pEdges[Math.floor(Math.random() * pEdges.length)];
      const dir = Math.random() > 0.5;
      pulses.push({ a: dir ? e.a : e.b, b: dir ? e.b : e.a, t: 0, sp: 0.5 + Math.random() * 0.7, hue: pNodes[e.a].hue });
    }

    const pulsoCtl = makeCanvasScene(pulsoEl, reduce, {
      resize: buildPulso,
      frame(ctx) {
        ctx.clearRect(0, 0, pW, pH);
        ctx.lineWidth = 1;
        for (const e of pEdges) {
          const A = pNodes[e.a], B = pNodes[e.b];
          ctx.strokeStyle = "rgba(120,150,210,0.16)";
          ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
        }
        pAcc += 0.016;
        if (pAcc > 0.5) { pAcc = 0; spawnPulse(); }
        for (let p = pulses.length - 1; p >= 0; p--) {
          const pu = pulses[p]; pu.t += pu.sp * 0.016;
          const A2 = pNodes[pu.a], B2 = pNodes[pu.b];
          const x = A2.x + (B2.x - A2.x) * pu.t, y = A2.y + (B2.y - A2.y) * pu.t;
          const rgb = rgbFor(pu.hue);
          ctx.beginPath(); ctx.arc(x, y, 3, 0, 6.2832);
          ctx.fillStyle = `rgba(${rgb},0.95)`;
          ctx.shadowColor = `rgba(${rgb},0.9)`; ctx.shadowBlur = 12; ctx.fill(); ctx.shadowBlur = 0;
          if (pu.t >= 1) { pNodes[pu.b].glow = 1; pulses.splice(p, 1); }
        }
        for (const nd of pNodes) {
          nd.glow *= 0.94;
          const rgb2 = rgbFor(nd.hue), rr = 4 + nd.glow * 4;
          ctx.beginPath(); ctx.arc(nd.x, nd.y, rr, 0, 6.2832);
          ctx.fillStyle = `rgba(${rgb2},${(0.6 + nd.glow * 0.4).toFixed(2)})`;
          ctx.shadowColor = `rgba(${rgb2},0.9)`; ctx.shadowBlur = 8 + nd.glow * 16; ctx.fill(); ctx.shadowBlur = 0;
        }
      },
    });

    // --- ORBITA (coins orbiting a nucleus) ---
    interface ONode { radius: number; ang: number; sp: number; r: number; hue: Hue; sq: number; }
    let oW = 0, oH = 0, oCx = 0, oCy = 0, oMaxR = 0, oCoins: ONode[] = [];

    function buildOrbita(w: number, h: number) {
      oW = w; oH = h; oCx = w * 0.62; oCy = h * 0.5; oMaxR = Math.min(w, h) * 0.52; oCoins = [];
      let idx = 0;
      for (let ring = 1; ring <= 4; ring++) {
        const radius = oMaxR * (ring / 4), count = 2 + ring;
        for (let i = 0; i < count; i++) {
          oCoins.push({ radius, ang: (i / count) * 6.2832 + ring, sp: (0.12 + 0.05 * (4 - ring)) * (ring % 2 ? 1 : -1), r: 6 + (4 - ring) * 2.2, hue: pickHue(), sq: idx++ });
        }
      }
    }

    const orbitaCtl = makeCanvasScene(orbitaEl, reduce, {
      resize: buildOrbita,
      frame(ctx, _w, _h, t) {
        ctx.clearRect(0, 0, oW, oH);
        const pts = oCoins.map(c => ({ x: oCx + Math.cos(c.ang + t * c.sp) * c.radius, y: oCy + Math.sin(c.ang + t * c.sp) * c.radius * 0.62, c }));
        ctx.lineWidth = 1;
        for (const p of pts) {
          ctx.strokeStyle = "rgba(120,150,210,0.10)";
          ctx.beginPath(); ctx.moveTo(oCx, oCy); ctx.lineTo(p.x, p.y); ctx.stroke();
        }
        for (let ring = 1; ring <= 4; ring++) {
          ctx.strokeStyle = "rgba(148,163,184,0.07)"; ctx.beginPath();
          ctx.ellipse(oCx, oCy, oMaxR * (ring / 4), oMaxR * (ring / 4) * 0.62, 0, 0, 6.2832); ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(oCx, oCy, 5, 0, 6.2832);
        ctx.fillStyle = "rgba(147,197,253,0.9)";
        ctx.shadowColor = "rgba(96,165,250,0.9)"; ctx.shadowBlur = 18; ctx.fill(); ctx.shadowBlur = 0;
        for (const { x, y, c } of pts) {
          const squash = 0.5 + 0.5 * Math.abs(Math.cos(t * 1.4 + c.sq));
          ctx.save(); ctx.translate(x, y); ctx.scale(squash, 1);
          ctx.shadowColor = `rgba(${rgbFor(c.hue)},0.6)`; ctx.shadowBlur = 12;
          ctx.beginPath(); ctx.arc(0, 0, c.r, 0, 6.2832);
          ctx.fillStyle = coinGrad(ctx, 0, 0, c.r, c.hue); ctx.fill();
          ctx.shadowBlur = 0; ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.stroke();
          ctx.restore();
        }
      },
    });

    // --- SWITCHER: random pick, no repeat ---
    const ALL = ["moedas", "rede", "redecoin", "chuva", "pulso", "orbita"];
    const canvasCtls: Record<string, CanvasCtl> = { rede: redeCtl, redecoin: redecoinCtl, pulso: pulsoCtl, orbita: orbitaCtl };

    const sceneEls: Record<string, HTMLElement> = {};
    bgEl.querySelectorAll<HTMLElement>(".scene").forEach(s => {
      if (s.dataset.scene) sceneEls[s.dataset.scene] = s;
    });

    let current = "moedas";

    function go(id: string) {
      if (!sceneEls[id] || id === current) return;
      for (const k of Object.keys(sceneEls)) sceneEls[k].classList.toggle("is-active", k === id);
      for (const k of Object.keys(canvasCtls)) { if (k === id) canvasCtls[k].start(); else canvasCtls[k].stop(); }
      current = id;
      try { localStorage.setItem("conciliaai-last", id); } catch { /* ignore */ }
    }

    for (const ctl of Object.values(canvasCtls)) ctl.stop();

    let last: string | null = null;
    try { last = localStorage.getItem("conciliaai-last"); } catch { /* ignore */ }
    const pool = ALL.filter(id => id !== last);
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? "moedas";
    if (pick === current) {
      try { localStorage.setItem("conciliaai-last", pick); } catch { /* ignore */ }
    } else {
      go(pick);
    }

    return () => {
      for (const ctl of Object.values(canvasCtls)) ctl.destroy();
      while (moedasEl.firstChild) moedasEl.removeChild(moedasEl.firstChild);
      while (chuvaEl.firstChild) chuvaEl.removeChild(chuvaEl.firstChild);
    };
  }, []);

  return (
    <div className="scene-bg" ref={bgRef}>
      <div className="scene is-active" data-scene="moedas">
        <div className="m-field" ref={moedasRef} />
      </div>
      <div className="scene" data-scene="rede">
        <canvas ref={redeRef} />
      </div>
      <div className="scene" data-scene="redecoin">
        <canvas ref={redecoinRef} />
      </div>
      <div className="scene" data-scene="chuva">
        <div className="r-field" ref={chuvaRef} />
      </div>
      <div className="scene" data-scene="pulso">
        <canvas ref={pulsoRef} />
      </div>
      <div className="scene" data-scene="orbita">
        <canvas ref={orbitaRef} />
      </div>
    </div>
  );
}
