import { useEffect } from "react";

interface Tutorial {
  id: string;
  title: string;
  desc: string;
  duration: string;
  cat: string;
  accent: string;
  url?: string;
  thumb?: string;
  ready: boolean;
  isShort?: boolean;
}

const TUTORIALS: Tutorial[] = [
  {
    id: "iO1MJsA0vVo",
    title: "Lançamento de despesas",
    desc: "Registre um gasto em segundos e veja no dashboard.",
    duration: "0:42",
    cat: "Primeiros passos",
    accent: "#ef4444",
    thumb: "https://i.ytimg.com/vi/iO1MJsA0vVo/hqdefault.jpg",
    url: "https://www.youtube.com/shorts/iO1MJsA0vVo",
    ready: true,
    isShort: true,
  },
  {
    id: "soon-receita",
    title: "Lançamento de receitas",
    desc: "Adicione entradas e acompanhe seu saldo.",
    duration: "Em breve",
    cat: "Primeiros passos",
    accent: "#22c55e",
    ready: false,
  },
  {
    id: "soon-categorias",
    title: "Criar e organizar categorias",
    desc: "Monte suas categorias e mantenha tudo no lugar.",
    duration: "Em breve",
    cat: "Organização",
    accent: "#60a5fa",
    ready: false,
  },
  {
    id: "soon-ofx",
    title: "Importar extrato (OFX)",
    desc: "Traga o extrato do banco e concilie automático.",
    duration: "Em breve",
    cat: "Automação",
    accent: "#a78bfa",
    ready: false,
  },
  {
    id: "soon-dashboard",
    title: "Lendo o dashboard",
    desc: "Entenda gráficos, metas e o resumo do mês.",
    duration: "Em breve",
    cat: "Análise",
    accent: "#2dd4bf",
    ready: false,
  },
];

function openTutorial(t: Tutorial) {
  if (!t.ready || !t.url) return;
  window.open(t.url, "_blank", "noopener,noreferrer");
}

function VideoThumb({ t, radius = 12 }: { t: Tutorial; radius?: number }) {
  return (
    <div
      onClick={() => openTutorial(t)}
      style={{
        position: "relative",
        aspectRatio: "16 / 9",
        borderRadius: radius,
        overflow: "hidden",
        flexShrink: 0,
        background: "linear-gradient(135deg,#0c1426,#16223c)",
        border: "1px solid rgba(148,163,184,.16)",
        cursor: t.ready ? "pointer" : "default",
      }}
    >
      {t.ready && t.thumb ? (
        <img
          src={t.thumb}
          alt=""
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      ) : (
        <div style={{
          position: "absolute", inset: 0, display: "grid", placeItems: "center",
          color: t.accent, opacity: 0.9,
          background: `radial-gradient(circle at 50% 40%, ${t.accent}22, transparent 60%)`,
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ width: 22, height: 22, opacity: 0.8 }}>
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
      )}

      {/* duration badge */}
      <span style={{
        position: "absolute", right: 6, bottom: 6, fontSize: 11, fontWeight: 800,
        padding: "3px 7px", borderRadius: 7, lineHeight: 1,
        color: t.ready ? "#fff" : "#cbd5e1",
        background: t.ready ? "rgba(2,6,23,.78)" : "rgba(2,6,23,.6)",
        border: t.ready ? "0" : "1px solid rgba(148,163,184,.2)",
      }}>{t.duration}</span>

      {/* play button */}
      {t.ready && (
        <div style={{
          position: "absolute", inset: 0, display: "grid", placeItems: "center",
          background: "linear-gradient(180deg,rgba(2,6,23,.05),rgba(2,6,23,.34))",
        }}>
          <span style={{
            width: 44, height: 44, borderRadius: 999, display: "grid", placeItems: "center",
            background: "rgba(255,255,255,.94)", color: "#0f172a",
            boxShadow: "0 8px 24px rgba(2,6,23,.5)",
          }}>
            <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18, marginLeft: 2 }}>
              <path d="M8 5.2v13.6a1 1 0 0 0 1.5.87l11-6.8a1 1 0 0 0 0-1.74l-11-6.8A1 1 0 0 0 8 5.2Z" />
            </svg>
          </span>
        </div>
      )}

      {/* SHORT badge */}
      {t.isShort && t.ready && (
        <span style={{
          position: "absolute", left: 6, top: 6, fontSize: 9.5, fontWeight: 900,
          letterSpacing: ".06em", padding: "3px 6px", borderRadius: 6,
          color: "#fff", background: "rgba(239,68,68,.9)",
        }}>SHORT</span>
      )}
    </div>
  );
}

interface Props {
  onClose: () => void;
  isMobile: boolean;
}

export default function TutoriaisModal({ onClose, isMobile }: Props) {
  const featured = TUTORIALS[0];
  const rest = TUTORIALS.slice(1);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const Header = (
    <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 18 }}>
      <span style={{
        width: 38, height: 38, borderRadius: 12, display: "grid", placeItems: "center",
        color: "#bfdbfe", background: "rgba(59,130,246,.16)", border: "1px solid rgba(96,165,250,.24)",
        flexShrink: 0,
      }}>
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 19, height: 19 }}>
          <path d="M12 2l1.6 5.3L19 9l-5.4 1.7L12 16l-1.6-5.3L5 9l5.4-1.7Z" />
          <path d="M19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7Z" opacity=".7" />
        </svg>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong style={{ fontFamily: "var(--display)", fontSize: 17, display: "block" }}>Tutoriais em vídeo</strong>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>Aprenda o Conciliaaí no seu ritmo</div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar tutoriais"
        style={{
          width: 34, height: 34, borderRadius: 10, display: "grid", placeItems: "center", cursor: "pointer",
          color: "var(--text-secondary)", border: "1px solid rgba(148,163,184,.16)", background: "rgba(30,41,59,.5)",
          flexShrink: 0,
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );

  const Hero = (
    <div style={{ display: isMobile ? "block" : "flex", gap: 18, padding: isMobile ? 0 : 4 }}>
      <div style={{ width: isMobile ? "100%" : 260, flexShrink: 0, marginBottom: isMobile ? 14 : 0 }}>
        <VideoThumb t={featured} radius={16} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
        <span style={{
          alignSelf: "flex-start", fontSize: 10.5, fontWeight: 900, letterSpacing: ".06em",
          padding: "4px 8px", borderRadius: 999, color: "#fecaca",
          background: "rgba(239,68,68,.14)", border: "1px solid rgba(239,68,68,.3)", marginBottom: 10,
        }}>COMECE POR AQUI</span>
        <h3 style={{ fontFamily: "var(--display)", fontSize: 21, fontWeight: 700, lineHeight: 1.15, margin: 0 }}>{featured.title}</h3>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.45, margin: "8px 0 16px" }}>{featured.desc}</p>
        <button
          type="button"
          onClick={() => openTutorial(featured)}
          style={{
            alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 9,
            minHeight: 46, padding: "0 20px", borderRadius: 13, border: 0, cursor: "pointer",
            color: "#fff", fontWeight: 800, fontSize: 14,
            background: "linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)",
            boxShadow: "0 14px 34px rgba(37,99,235,.42)",
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}>
            <path d="M8 5.2v13.6a1 1 0 0 0 1.5.87l11-6.8a1 1 0 0 0 0-1.74l-11-6.8A1 1 0 0 0 8 5.2Z" />
          </svg>
          Assistir no YouTube
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13, opacity: 0.75 }}>
            <path d="M14 4h6v6" /><path d="M20 4l-9 9" />
            <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
          </svg>
        </button>
      </div>
    </div>
  );

  const Grid = (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "22px 0 12px" }}>
        <strong style={{ fontSize: 13, color: "var(--text-secondary)", letterSpacing: ".03em", whiteSpace: "nowrap" }}>MAIS TUTORIAIS</strong>
        <div style={{ flex: 1, height: 1, background: "rgba(148,163,184,.12)" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
        {rest.map((t) => (
          <div key={t.id} style={{
            display: "flex", gap: 11, padding: 9, borderRadius: 14, opacity: 0.72,
            border: "1px solid rgba(148,163,184,.1)", background: "rgba(15,23,42,.45)",
          }}>
            <div style={{ width: 80, flexShrink: 0 }}><VideoThumb t={t} /></div>
            <div style={{ minWidth: 0, flex: 1, paddingTop: 2 }}>
              <strong style={{ fontSize: 12.5, display: "block" }}>{t.title}</strong>
              <p style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.35, marginTop: 3 }}>{t.cat}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const YtFooter = (
    <a
      href="https://www.youtube.com/@nuvcoin"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none",
        minHeight: 42, borderRadius: 12, fontSize: 12.5, fontWeight: 700, color: "#bfdbfe",
        border: "1px solid rgba(96,165,250,.2)", background: "rgba(59,130,246,.1)", marginTop: 16,
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
        <path d="M14 4h6v6" /><path d="M20 4l-9 9" />
        <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
      </svg>
      Ver canal completo no YouTube
    </a>
  );

  if (isMobile) {
    return (
      <>
        {/* scrim */}
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, zIndex: 9990,
            background: "rgba(5,9,20,.62)", backdropFilter: "blur(3px)",
            animation: "tutScrimIn .2s ease",
          }}
        />
        {/* bottom sheet */}
        <div style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 9991,
          padding: "10px 16px 34px",
          borderRadius: "24px 24px 0 0",
          border: "1px solid rgba(96,165,250,.18)", borderBottom: 0,
          background: "linear-gradient(180deg, rgba(20,29,48,.99), rgba(11,17,32,.99))",
          boxShadow: "0 -28px 70px rgba(0,0,0,.55)",
          animation: "tutSheetUp .3s cubic-bezier(.16,1,.3,1) both",
          display: "flex", flexDirection: "column",
          maxHeight: "88dvh", overflowY: "auto",
        }}>
          <div style={{ width: 44, height: 4, borderRadius: 999, background: "rgba(148,163,184,.35)", margin: "0 auto 16px", flexShrink: 0 }} />
          {Header}
          {Hero}
          {Grid}
          {YtFooter}
        </div>
      </>
    );
  }

  return (
    <>
      {/* scrim */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9990,
          background: "rgba(5,9,20,.62)", backdropFilter: "blur(3px)",
          animation: "tutScrimIn .2s ease",
        }}
      />
      {/* centered modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 9991, width: 720, maxWidth: "calc(100vw - 48px)",
        maxHeight: "calc(100dvh - 60px)", overflowY: "auto",
        padding: 22, borderRadius: 24,
        border: "1px solid rgba(148,163,184,.16)",
        background: "radial-gradient(circle at 16% 0%, rgba(96,165,250,.1), transparent 40%), rgba(13,20,38,.99)",
        boxShadow: "0 40px 100px rgba(2,6,23,.66), inset 0 1px 0 rgba(255,255,255,.05)",
        animation: "tutModalIn .26s cubic-bezier(.16,1,.3,1) both",
      }}>
        {Header}
        {Hero}
        {Grid}
        {YtFooter}
      </div>
      <style>{`
        @keyframes tutScrimIn { from { opacity:0; } to { opacity:1; } }
        @keyframes tutModalIn { from { transform: translate(-50%,-46%) scale(.97); } to { transform: translate(-50%,-50%) scale(1); } }
        @keyframes tutSheetUp { from { transform: translateY(60px); } to { transform: none; } }
      `}</style>
    </>
  );
}
