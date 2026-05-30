import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./onboarding.css";

const slides = [
  {
    title: "O jeito mais facil de controlar suas financas",
    text: "Cadastre-se, crie planejamentos e acompanhe receitas, despesas e saldo em um so lugar.",
    preview: "summary",
  },
  {
    title: "Entenda para onde seu dinheiro vai",
    text: "Veja categorias, formas de pagamento e comparativos para tomar decisoes melhores.",
    preview: "donut",
  },
  {
    title: "Organize gastos sozinho ou em grupo",
    text: "Controle suas despesas pessoais e divida custos com outras pessoas quando precisar.",
    preview: "cards",
  },
  {
    title: "Monte um plano para seus objetivos",
    text: "Use o dashboard para acompanhar evolucao e ajustar seus habitos mes a mes.",
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
