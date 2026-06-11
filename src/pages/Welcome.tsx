import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./onboarding.css";

const slides = [
  {
    title: "Seu dinheiro em uma visão clara",
    text: "Acompanhe entradas, saídas e saldo sem precisar montar planilha para tudo.",
    glow: "#3B82F6",
    art: "summary",
  },
  {
    title: "Categorias na sua linguagem",
    text: "Organize gastos e recebimentos do jeito que combina com a sua rotina.",
    glow: "#22C55E",
    art: "donut",
  },
  {
    title: "Sozinho ou compartilhado",
    text: "Use individualmente ou crie grupos para dividir custos com outras pessoas.",
    glow: "#A78BFA",
    art: "cards",
  },
  {
    title: "Decisões pequenas, mês previsível",
    text: "Compare períodos, veja padrões e ajuste o caminho antes do susto chegar.",
    glow: "#F97316",
    art: "bars",
  },
];

function WelcomeArt({ type }: { type: string }) {
  if (type === "donut") {
    return (
      <>
        <div className="w-donut" />
        <div className="w-list">
          <div className="w-li"><i style={{ background: "#60A5FA" }} /><b /><u /></div>
          <div className="w-li"><i style={{ background: "#22C55E" }} /><b style={{ flex: "0.7" }} /><u /></div>
          <div className="w-li"><i style={{ background: "#A78BFA" }} /><b style={{ flex: "0.5" }} /><u /></div>
        </div>
      </>
    );
  }

  if (type === "cards") {
    return (
      <>
        <div className="w-balance"><small>Grupo · Apê 302</small>R$ 4.280</div>
        <div className="w-list">
          <div className="w-li"><i style={{ background: "linear-gradient(135deg,#3B82F6,#2563EB)" }} /><b /><u /></div>
          <div className="w-li"><i style={{ background: "linear-gradient(135deg,#22C55E,#16A34A)" }} /><b style={{ flex: "0.8" }} /><u /></div>
          <div className="w-li"><i style={{ background: "linear-gradient(135deg,#A78BFA,#7C3AED)" }} /><b style={{ flex: "0.6" }} /><u /></div>
        </div>
      </>
    );
  }

  if (type === "bars") {
    return (
      <>
        <div className="w-balance"><small>Saldo do mês</small>R$ 4.770</div>
        <div className="w-bars">
          {[40, 62, 48, 80, 58, 92].map((v, i) => (
            <span key={i} style={{ height: `${v}%`, animationDelay: `${i * 0.08}s` }} />
          ))}
        </div>
      </>
    );
  }

  // summary (default)
  return (
    <>
      <div className="w-balance"><small>Saldo atual</small>R$ 8.740</div>
      <div className="w-row">
        <div className="w-chip">
          <i style={{ background: "rgba(34,197,94,.4)" }} />
          <b />
        </div>
        <div className="w-chip">
          <i style={{ background: "rgba(239,68,68,.4)" }} />
          <b />
        </div>
      </div>
      <div className="w-bars">
        {[50, 70, 45, 88, 60].map((v, i) => (
          <span key={i} style={{ height: `${v}%`, animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    </>
  );
}

export default function Welcome() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);
  const slide = slides[activeIndex];
  const isLastSlide = activeIndex === slides.length - 1;

  function handlePrimaryClick() {
    if (!isLastSlide) {
      setActiveIndex((i) => i + 1);
    } else {
      navigate("/register");
    }
  }

  return (
    <main className="welcome-page">
      <div className="welcome-top">
        <div className="brand">
          <span className="app-logo-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l5-5 4 3 8-8" /><path d="M16 7h4v4" />
            </svg>
          </span>
          <span className="brand-copy">
            <strong>Conciliaaí</strong>
          </span>
        </div>
        <Link to="/login" className="welcome-skip">Pular</Link>
      </div>

      <div className="welcome-stage">
        <div
          className="welcome-phone"
          style={{ "--welcome-glow": slide.glow } as React.CSSProperties}
        >
          <div className="welcome-phone-glow" />
          <WelcomeArt key={slide.art} type={slide.art} />
        </div>

        <div className="welcome-copy">
          <h1>{slide.title}</h1>
          <p>{slide.text}</p>

          <div className="welcome-dots" aria-label={`Slide ${activeIndex + 1} de ${slides.length}`}>
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                className={index === activeIndex ? "is-active" : ""}
                onClick={() => setActiveIndex(index)}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="welcome-actions">
            <button type="button" className="welcome-btn-primary" onClick={handlePrimaryClick}>
              {isLastSlide ? "Criar conta" : "Próximo"}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <Link className="welcome-btn-ghost" to="/login">Já tenho conta</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
