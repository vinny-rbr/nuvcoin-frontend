import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./onboarding.css";

const slides = [
  {
    title: "Seu dinheiro em uma visao clara",
    text: "Acompanhe entradas, saidas e saldo sem precisar montar planilha para tudo.",
    preview: "summary",
  },
  {
    title: "Categorias com a sua linguagem",
    text: "Organize gastos e recebimentos do jeito que combina com sua rotina.",
    preview: "donut",
  },
  {
    title: "Controle individual ou compartilhado",
    text: "Use sozinho ou crie grupos para dividir custos com outras pessoas.",
    preview: "cards",
  },
  {
    title: "Decisoes pequenas, mes mais previsivel",
    text: "Compare periodos, veja padroes e ajuste o caminho antes do susto chegar.",
    preview: "plan",
  },
];

function PhonePreview({ type }: { type: string }) {
  return (
    <div className={`welcome-phone welcome-phone-${type}`}>
      <div className="welcome-phone-bar" />
      {type === "donut" ? (
        <>
          <div className="welcome-donut" />
          <div className="welcome-lines">
            <span />
            <span />
          </div>
        </>
      ) : type === "cards" ? (
        <>
          <div className="welcome-mini-card" />
          <div className="welcome-mini-card is-purple" />
          <div className="welcome-mini-card is-orange" />
        </>
      ) : type === "plan" ? (
        <>
          <div className="welcome-progress" />
          <div className="welcome-task" />
          <div className="welcome-task is-red" />
          <div className="welcome-task is-blue" />
        </>
      ) : (
        <>
          <div className="welcome-balance">R$ 870,50</div>
          <div className="welcome-summary-grid">
            <span />
            <span />
          </div>
          <div className="welcome-mini-card" />
        </>
      )}
    </div>
  );
}

export default function Welcome() {
  const [activeIndex, setActiveIndex] = useState(0);
  const slide = slides[activeIndex];
  const nextLabel = useMemo(() => (activeIndex === slides.length - 1 ? "Cadastrar" : "Proximo"), [activeIndex]);

  function handlePrimaryClick() {
    if (activeIndex < slides.length - 1) {
      setActiveIndex((current) => current + 1);
    }
  }

  return (
    <main className="welcome-screen">
      <section className="welcome-stage" aria-live="polite">
        <PhonePreview type={slide.preview} />

        <div className="welcome-copy-card">
          <h1>{slide.title}</h1>
          <p>{slide.text}</p>

          <div className="welcome-dots" aria-label={`Tela ${activeIndex + 1} de ${slides.length}`}>
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

          {activeIndex === slides.length - 1 ? (
            <Link className="welcome-primary" to="/register">
              {nextLabel}
            </Link>
          ) : (
            <button className="welcome-primary" type="button" onClick={handlePrimaryClick}>
              {nextLabel}
            </button>
          )}

          <Link className="welcome-secondary" to="/login">
            Ja sou cadastrado
          </Link>
        </div>
      </section>
    </main>
  );
}
