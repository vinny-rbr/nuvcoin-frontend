import { useEffect, useState } from "react";

type Props = {
  isVisible: boolean; // controla se aparece ou não
  children: React.ReactNode; // conteúdo (lista de grupos)
  onFinish?: () => void; // callback quando animação terminar
};

export default function GroupsCreateSuccessTransition({
  isVisible,
  children,
  onFinish,
}: Props) {
  const [stage, setStage] = useState<"hidden" | "out" | "in">("hidden");

  useEffect(() => {
    if (isVisible) {
      // começa animação
      setStage("out");

      // depois entra o conteúdo
      const enterTimer = setTimeout(() => {
        setStage("in");
      }, 300);

      // finaliza
      const finishTimer = setTimeout(() => {
        onFinish?.();
      }, 800);

      return () => {
        clearTimeout(enterTimer);
        clearTimeout(finishTimer);
      };
    }
  }, [isVisible, onFinish]);

  const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    perspective: 1200,
    overflow: "hidden",
  };

  const contentStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    transformStyle: "preserve-3d",
    transition: "all 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
    transform:
      stage === "out"
        ? "scale(0.8) translateY(40px) rotateX(20deg) opacity(0)"
        : stage === "in"
        ? "scale(1) translateY(0px) rotateX(0deg)"
        : "scale(1)",
    opacity: stage === "out" ? 0 : 1,
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>{children}</div>
    </div>
  );
}