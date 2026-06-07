import { useEffect, useState } from "react";

interface Tutorial {
  id: string;
  title: string;
  desc: string;
  long: string;
  learn: string[];
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
    title: "Lançamento de receitas",
    desc: "Adicione entradas e acompanhe seu saldo no dashboard.",
    long: "Veja como registrar uma receita do zero: toque em Nova receita, escolha a categoria, informe o valor e a data. O lançamento aparece no dashboard na hora e já atualiza o saldo do mês.",
    learn: ["Abrir o formulário de nova receita", "Escolher categoria, valor e data", "Acompanhar o impacto no saldo do mês"],
    duration: "0:42",
    cat: "Primeiros passos",
    accent: "#22c55e",
    thumb: "https://i.ytimg.com/vi/iO1MJsA0vVo/hqdefault.jpg",
    url: "https://www.youtube.com/shorts/iO1MJsA0vVo",
    ready: true,
    isShort: true,
  },
  {
    id: "wYUJ1H9UhBQ",
    title: "Lançamento de despesas",
    desc: "Registre um gasto em segundos e veja no dashboard.",
    long: "Veja na prática como registrar um gasto do zero: toque em Nova despesa, escolha a categoria, informe o valor e a data. O lançamento entra no dashboard na hora e já atualiza o saldo do mês.",
    learn: ["Abrir o formulário de nova despesa", "Escolher categoria, valor e data", "Acompanhar o impacto no saldo do mês"],
    duration: "0:42",
    cat: "Primeiros passos",
    accent: "#ef4444",
    thumb: "https://i.ytimg.com/vi/wYUJ1H9UhBQ/hqdefault.jpg",
    url: "https://www.youtube.com/shorts/wYUJ1H9UhBQ",
    ready: true,
    isShort: true,
  },
  {
    id: "soon-categorias",
    title: "Criar e organizar categorias",
    desc: "Monte suas categorias e mantenha tudo no lugar.",
    long: "Crie categorias do seu jeito, defina cores e mantenha cada lançamento no lugar certo — relatórios mais claros começam por aqui.",
    learn: ["Criar e editar categorias", "Definir cor e ícone", "Mover lançamentos entre categorias"],
    duration: "Em breve",
    cat: "Organização",
    accent: "#60a5fa",
    ready: false,
  },
  {
    id: "MsLkkJqCP1o",
    title: "Importar extrato (OFX)",
    desc: "Traga o extrato do banco e concilie automático.",
    long: "Importe o extrato do seu banco em arquivo OFX e deixe o Conciliaaí casar os lançamentos automaticamente, poupando digitação.",
    learn: ["Baixar o OFX no seu banco", "Importar e revisar os lançamentos", "Conciliar com poucos toques"],
    duration: "0:42",
    cat: "Automação",
    accent: "#a78bfa",
    thumb: "https://i.ytimg.com/vi/MsLkkJqCP1o/hqdefault.jpg",
    url: "https://www.youtube.com/shorts/MsLkkJqCP1o",
    ready: true,
    isShort: true,
  },
  {
    id: "soon-dashboard",
    title: "Lendo o dashboard",
    desc: "Entenda gráficos, metas e o resumo do mês.",
    long: "Entenda cada parte do painel: saldo do mês, receitas x despesas, metas e a evolução ao longo do tempo — pra tomar decisões com clareza.",
    learn: ["Ler o resumo do mês", "Interpretar os gráficos", "Acompanhar metas e tendências"],
    duration: "Em breve",
    cat: "Análise",
    accent: "#2dd4bf",
    ready: false,
  },
];

function openYouTube(t: Tutorial) {
  if (!t.ready || !t.url) return;
  window.open(t.url, "_blank", "noopener,noreferrer");
}

function VideoThumb({
  t,
  radius = 12,
  onPlay,
}: {
  t: Tutorial;
  radius?: number;
  onPlay?: (t: Tutorial) => void;
}) {
  return (
    <div
      onClick={() => onPlay?.(t)}
      style={{
        position: "relative",
        aspectRatio: "16 / 9",
        borderRadius: radius,
        overflow: "hidden",
        flexShrink: 0,
        background: "linear-gradient(135deg,#0c1426,#16223c)",
        border: "1px solid rgba(148,163,184,.16)",
        cursor: onPlay ? "pointer" : "default",
      }}
    >
      {t.ready && t.thumb ? (
        <img
          src={t.thumb}
          alt=""
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: t.accent,
            opacity: 0.9,
            background: `radial-gradient(circle at 50% 40%, ${t.accent}22, transparent 60%)`,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: 22, height: 22, opacity: 0.8 }}
          >
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
      )}

      <span
        style={{
          position: "absolute",
          right: 6,
          bottom: 6,
          fontSize: 11,
          fontWeight: 800,
          padding: "3px 7px",
          borderRadius: 7,
          lineHeight: 1,
          color: t.ready ? "#fff" : "#cbd5e1",
          background: t.ready ? "rgba(2,6,23,.78)" : "rgba(2,6,23,.6)",
          border: t.ready ? "0" : "1px solid rgba(148,163,184,.2)",
        }}
      >
        {t.duration}
      </span>

      {t.ready && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(180deg,rgba(2,6,23,.05),rgba(2,6,23,.34))",
          }}
        >
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,.94)",
              color: "#0f172a",
              boxShadow: "0 8px 24px rgba(2,6,23,.5)",
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ width: 18, height: 18, marginLeft: 2 }}
            >
              <path d="M8 5.2v13.6a1 1 0 0 0 1.5.87l11-6.8a1 1 0 0 0 0-1.74l-11-6.8A1 1 0 0 0 8 5.2Z" />
            </svg>
          </span>
        </div>
      )}

      {t.isShort && t.ready && (
        <span
          style={{
            position: "absolute",
            left: 6,
            top: 6,
            fontSize: 9.5,
            fontWeight: 900,
            letterSpacing: ".06em",
            padding: "3px 6px",
            borderRadius: 6,
            color: "#fff",
            background: "rgba(239,68,68,.9)",
          }}
        >
          SHORT
        </span>
      )}
    </div>
  );
}

function TutorialDetail({
  t,
  onBack,
  onClose,
}: {
  t: Tutorial;
  onBack: () => void;
  onClose: () => void;
}) {
  const ready = t.ready;
  return (
    <div
      style={{
        animation: "tutDetailIn .26s cubic-bezier(.16,1,.3,1) both",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* topo: voltar + fechar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 2px 14px" }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            minHeight: 32,
            padding: "0 10px 0 7px",
            borderRadius: 9,
            cursor: "pointer",
            color: "var(--text-secondary)",
            fontWeight: 700,
            fontSize: 12.5,
            border: "1px solid rgba(148,163,184,.16)",
            background: "rgba(30,41,59,.5)",
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Voltar
        </button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar tutoriais"
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            color: "var(--text-secondary)",
            border: "1px solid rgba(148,163,184,.16)",
            background: "rgba(30,41,59,.5)",
            flexShrink: 0,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: 16, height: 16 }}
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* thumbnail clicável (abre YouTube diretamente) */}
      <VideoThumb t={t} radius={16} onPlay={ready ? openYouTube : undefined} />

      {/* categoria + duração */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          margin: "14px 0 9px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: ".04em",
            padding: "5px 10px",
            borderRadius: 999,
            color: t.accent,
            textTransform: "uppercase",
            background: t.accent + "1c",
            border: `1px solid ${t.accent}45`,
          }}
        >
          <span
            style={{ width: 6, height: 6, borderRadius: 999, background: t.accent }}
          />
          {t.cat}
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>
          {ready ? `${t.duration} · vídeo curto` : "Em breve"}
        </span>
      </div>

      {/* título */}
      <h3
        style={{
          fontFamily: "var(--display)",
          fontSize: 21,
          fontWeight: 700,
          lineHeight: 1.15,
          margin: 0,
        }}
      >
        {t.title}
      </h3>

      {/* descrição longa */}
      <p
        style={{
          fontSize: 13.5,
          color: "var(--text-secondary)",
          lineHeight: 1.5,
          marginTop: 9,
        }}
      >
        {t.long}
      </p>

      {/* o que você vai aprender */}
      <div
        style={{
          margin: "18px 0 8px",
          fontSize: 11.5,
          fontWeight: 800,
          letterSpacing: ".05em",
          color: "var(--text-secondary)",
          textTransform: "uppercase",
        }}
      >
        O que você vai aprender
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {t.learn.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span
              style={{
                width: 21,
                height: 21,
                borderRadius: 999,
                flexShrink: 0,
                marginTop: 1,
                display: "grid",
                placeItems: "center",
                color: t.accent,
                background: t.accent + "20",
                border: `1px solid ${t.accent}40`,
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: 12, height: 12 }}
              >
                <path d="M5 12.5l4.2 4.2L19 6.5" />
              </svg>
            </span>
            <span style={{ fontSize: 13, lineHeight: 1.4 }}>{item}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={() => ready && openYouTube(t)}
        disabled={!ready}
        style={{
          marginTop: 20,
          minHeight: 50,
          borderRadius: 14,
          border: 0,
          cursor: ready ? "pointer" : "default",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 9,
          color: "#fff",
          fontWeight: 800,
          fontSize: 14.5,
          background: ready
            ? "linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)"
            : "rgba(51,65,85,.55)",
          boxShadow: ready ? "0 14px 34px rgba(37,99,235,.42)" : "none",
          opacity: ready ? 1 : 0.8,
        }}
      >
        {ready ? (
          <>
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ width: 16, height: 16 }}
            >
              <path d="M8 5.2v13.6a1 1 0 0 0 1.5.87l11-6.8a1 1 0 0 0 0-1.74l-11-6.8A1 1 0 0 0 8 5.2Z" />
            </svg>
            Assistir no YouTube
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: 13, height: 13, opacity: 0.75 }}
            >
              <path d="M14 4h6v6" />
              <path d="M20 4l-9 9" />
              <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
            </svg>
          </>
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: 15, height: 15 }}
            >
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            Em breve · te avisamos quando sair
          </>
        )}
      </button>
    </div>
  );
}

interface Props {
  onClose: () => void;
  isMobile: boolean;
}

export default function TutoriaisModal({ onClose, isMobile }: Props) {
  const [sel, setSel] = useState<Tutorial | null>(null);
  const featured = TUTORIALS[0];
  const rest = TUTORIALS.slice(1);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (sel) setSel(null);
        else onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, sel]);

  const Header = (
    <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 18 }}>
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          color: "#bfdbfe",
          background: "rgba(59,130,246,.16)",
          border: "1px solid rgba(96,165,250,.24)",
          flexShrink: 0,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          style={{ width: 19, height: 19 }}
        >
          <path d="M12 2l1.6 5.3L19 9l-5.4 1.7L12 16l-1.6-5.3L5 9l5.4-1.7Z" />
          <path
            d="M19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7Z"
            opacity=".7"
          />
        </svg>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <strong
          style={{
            fontFamily: "var(--display)",
            fontSize: 17,
            display: "block",
          }}
        >
          Tutoriais em vídeo
        </strong>
        <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
          Aprenda o Conciliaaí no seu ritmo
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar tutoriais"
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          color: "var(--text-secondary)",
          border: "1px solid rgba(148,163,184,.16)",
          background: "rgba(30,41,59,.5)",
          flexShrink: 0,
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: 16, height: 16 }}
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );

  const Hero = (
    <div
      style={{
        display: isMobile ? "block" : "flex",
        gap: 18,
        padding: isMobile ? 0 : 4,
      }}
    >
      <div
        style={{
          width: isMobile ? "100%" : 260,
          flexShrink: 0,
          marginBottom: isMobile ? 14 : 0,
        }}
      >
        <VideoThumb t={featured} radius={16} onPlay={setSel} />
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          minWidth: 0,
        }}
      >
        <span
          style={{
            alignSelf: "flex-start",
            fontSize: 10.5,
            fontWeight: 900,
            letterSpacing: ".06em",
            padding: "4px 8px",
            borderRadius: 999,
            color: "#fecaca",
            background: "rgba(239,68,68,.14)",
            border: "1px solid rgba(239,68,68,.3)",
            marginBottom: 10,
          }}
        >
          COMECE POR AQUI
        </span>
        <h3
          style={{
            fontFamily: "var(--display)",
            fontSize: 21,
            fontWeight: 700,
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          {featured.title}
        </h3>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            lineHeight: 1.45,
            margin: "8px 0 16px",
          }}
        >
          {featured.desc}
        </p>
        <button
          type="button"
          onClick={() => setSel(featured)}
          style={{
            alignSelf: "flex-start",
            display: "inline-flex",
            alignItems: "center",
            gap: 9,
            minHeight: 46,
            padding: "0 20px",
            borderRadius: 13,
            border: 0,
            cursor: "pointer",
            color: "#fff",
            fontWeight: 800,
            fontSize: 14,
            background: "linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)",
            boxShadow: "0 14px 34px rgba(37,99,235,.42)",
          }}
        >
          Ver tutorial
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );

  const Grid = (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          margin: "22px 0 12px",
        }}
      >
        <strong
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            letterSpacing: ".03em",
            whiteSpace: "nowrap",
          }}
        >
          MAIS TUTORIAIS
        </strong>
        <div
          style={{ flex: 1, height: 1, background: "rgba(148,163,184,.12)" }}
        />
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 12,
        }}
      >
        {rest.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSel(t)}
            style={{
              display: "flex",
              gap: 11,
              padding: 9,
              borderRadius: 14,
              textAlign: "left",
              cursor: "pointer",
              opacity: t.ready ? 1 : 0.78,
              border: "1px solid rgba(148,163,184,.1)",
              background: "rgba(15,23,42,.45)",
              transition: "border-color .15s, background .15s",
            }}
          >
            <div style={{ width: 80, flexShrink: 0 }}>
              <VideoThumb t={t} />
            </div>
            <div style={{ minWidth: 0, flex: 1, paddingTop: 2 }}>
              <strong style={{ fontSize: 12.5, display: "block" }}>
                {t.title}
              </strong>
              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  lineHeight: 1.35,
                  marginTop: 3,
                }}
              >
                {t.cat}
              </p>
            </div>
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--text-secondary)", flexShrink: 0, marginTop: 2 }}
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </button>
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        textDecoration: "none",
        minHeight: 42,
        borderRadius: 12,
        fontSize: 12.5,
        fontWeight: 700,
        color: "#bfdbfe",
        border: "1px solid rgba(96,165,250,.2)",
        background: "rgba(59,130,246,.1)",
        marginTop: 16,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: 14, height: 14 }}
      >
        <path d="M14 4h6v6" />
        <path d="M20 4l-9 9" />
        <path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
      </svg>
      Ver canal completo no YouTube
    </a>
  );

  const listBody = (
    <>
      {Header}
      {Hero}
      {Grid}
      {YtFooter}
    </>
  );

  const body = sel ? (
    <TutorialDetail t={sel} onBack={() => setSel(null)} onClose={onClose} />
  ) : (
    listBody
  );

  if (isMobile) {
    return (
      <>
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9990,
            background: "rgba(5,9,20,.62)",
            backdropFilter: "blur(3px)",
            animation: "tutScrimIn .2s ease",
          }}
        />
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9991,
            padding: "10px 16px 34px",
            borderRadius: "24px 24px 0 0",
            border: "1px solid rgba(96,165,250,.18)",
            borderBottom: 0,
            background:
              "linear-gradient(180deg, rgba(20,29,48,.99), rgba(11,17,32,.99))",
            boxShadow: "0 -28px 70px rgba(0,0,0,.55)",
            animation: "tutSheetUp .3s cubic-bezier(.16,1,.3,1) both",
            display: "flex",
            flexDirection: "column",
            maxHeight: "88dvh",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              width: 44,
              height: 4,
              borderRadius: 999,
              background: "rgba(148,163,184,.35)",
              margin: "0 auto 16px",
              flexShrink: 0,
            }}
          />
          {body}
        </div>
      </>
    );
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9990,
          background: "rgba(5,9,20,.62)",
          backdropFilter: "blur(3px)",
          animation: "tutScrimIn .2s ease",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 9991,
          width: sel ? 540 : 720,
          maxWidth: "calc(100vw - 48px)",
          maxHeight: "calc(100dvh - 60px)",
          overflowY: "auto",
          padding: 22,
          borderRadius: 24,
          border: "1px solid rgba(148,163,184,.16)",
          background:
            "radial-gradient(circle at 16% 0%, rgba(96,165,250,.1), transparent 40%), rgba(13,20,38,.99)",
          boxShadow:
            "0 40px 100px rgba(2,6,23,.66), inset 0 1px 0 rgba(255,255,255,.05)",
          animation: "tutModalIn .26s cubic-bezier(.16,1,.3,1) both",
          transition: "width .2s ease",
        }}
      >
        {body}
      </div>
      <style>{`
        @keyframes tutScrimIn { from { opacity:0; } to { opacity:1; } }
        @keyframes tutModalIn { from { transform: translate(-50%,-46%) scale(.97); } to { transform: translate(-50%,-50%) scale(1); } }
        @keyframes tutSheetUp { from { transform: translateY(60px); } to { transform: none; } }
        @keyframes tutDetailIn { from { opacity:0; transform: translateX(12px); } to { opacity:1; transform: none; } }
      `}</style>
    </>
  );
}
