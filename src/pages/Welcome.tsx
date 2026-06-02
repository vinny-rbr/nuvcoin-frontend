import { useMemo, useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./onboarding.css";

const slides = [
  {
    title: "Seu dinheiro em uma visao clara",
    text: "Acompanhe entradas, saidas e saldo sem precisar montar planilha para tudo.",
    accent: "#3B82F6",
    preview: "summary",
  },
  {
    title: "Categorias com a sua linguagem",
    text: "Organize gastos e recebimentos do jeito que combina com sua rotina.",
    accent: "#22C55E",
    preview: "donut",
  },
  {
    title: "Controle individual ou compartilhado",
    text: "Use sozinho ou crie grupos para dividir custos com outras pessoas.",
    accent: "#A78BFA",
    preview: "cards",
  },
  {
    title: "Decisoes pequenas, mes mais previsivel",
    text: "Compare periodos, veja padroes e ajuste o caminho antes do susto chegar.",
    accent: "#F97316",
    preview: "bars",
  },
];

function WelcomeArt({ type }: { type: string }) {
  if (type === "donut") {
    return (
      <>
        <div className="welcome-art-donut" />
        <div className="welcome-art-list">
          <span />
          <span />
          <span />
        </div>
      </>
    );
  }

  if (type === "cards") {
    return (
      <>
        <div className="welcome-art-balance">
          <small>Grupo - Ape 302</small>
          R$ 4.280
        </div>
        <div className="welcome-art-list">
          <span />
          <span />
          <span />
        </div>
      </>
    );
  }

  if (type === "bars") {
    return (
      <>
        <div className="welcome-art-balance">
          <small>Saldo do mes</small>
          R$ 4.770
        </div>
        <div className="welcome-art-bars">
          {[40, 62, 48, 80, 58, 92].map((value, index) => (
            <span key={index} style={{ height: `${value}%`, animationDelay: `${index * 0.08}s` }} />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="welcome-art-balance">
        <small>Saldo atual</small>
        R$ 8.740
      </div>
      <div className="welcome-art-chips">
        <span>
          <i />
          <b />
        </span>
        <span>
          <i />
          <b />
        </span>
      </div>
      <div className="welcome-art-bars">
        {[50, 70, 45, 88, 60].map((value, index) => (
          <span key={index} style={{ height: `${value}%`, animationDelay: `${index * 0.08}s` }} />
        ))}
      </div>
    </>
  );
}

export default function Welcome() {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const slide = slides[activeIndex];
  const isLastSlide = activeIndex === slides.length - 1;
  const primaryLabel = useMemo(() => (isLastSlide ? "Criar conta" : "Proximo"), [isLastSlide]);

  function handlePrimaryClick() {
    if (!isLastSlide) {
      setActiveIndex((current) => current + 1);
      return;
    }

    navigate("/register");
  }

  return (
    <main className="welcome-redesign-screen">
      <section className="welcome-redesign-phone" aria-live="polite">
        <header className="welcome-redesign-top">
          <div className="welcome-redesign-brand">
            <span className="welcome-redesign-logo" aria-hidden="true">
              ↗
            </span>
            <strong>Conciliaaí</strong>
          </div>

          <Link to="/login" className="welcome-redesign-skip">
            Pular
          </Link>
        </header>

        <div className="welcome-redesign-stage">
          <div
            key={slide.preview}
            className="welcome-redesign-card"
            style={{ "--welcome-accent": slide.accent } as CSSProperties}
          >
            <span className="welcome-redesign-handle" />
            <WelcomeArt type={slide.preview} />
          </div>

          <div className="welcome-redesign-copy">
            <h1>{slide.title}</h1>
            <p>{slide.text}</p>

            <div className="welcome-redesign-dots" aria-label={`Tela ${activeIndex + 1} de ${slides.length}`}>
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

            <button type="button" className="welcome-redesign-primary" onClick={handlePrimaryClick}>
              {primaryLabel}
              <span aria-hidden="true">→</span>
            </button>

            <Link className="welcome-redesign-secondary" to="/login">
              Ja tenho conta
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
