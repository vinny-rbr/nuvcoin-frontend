import type { CSSProperties } from "react"; // Tipo de estilo do React

export const shellOuterStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
  padding: "0 16px",
  boxSizing: "border-box",
  overflowX: "hidden",
};

export const shellStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  maxWidth: 1280,
  margin: "0 auto",
  padding: "18px 0 28px",
  boxSizing: "border-box",
  display: "grid",
  gap: 20,
  justifyItems: "stretch",
  alignItems: "start",
  overflowX: "hidden",
};

export const subtleText: CSSProperties = {
  opacity: 0.72,
  fontSize: 12,
  lineHeight: 1.45,
};

export const pageHeroStyle: CSSProperties = {
  padding: 24,
  borderRadius: 24,
  border: "1px solid rgba(255,255,255,0.08)",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 45%, rgba(76,110,245,0.08) 100%)",
  boxShadow: "0 18px 45px rgba(0,0,0,0.18)",
};

export const sectionCard: CSSProperties = {
  padding: 18,
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.02) 100%)",
  boxShadow: "0 16px 40px rgba(0,0,0,0.16)",
  backdropFilter: "blur(8px)",
};

export const sidebarCard: CSSProperties = {
  padding: 18,
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.018) 100%)",
  boxShadow: "0 16px 36px rgba(0,0,0,0.14)",
};

export function metricCard(accent?: "blue" | "green" | "red" | "purple"): CSSProperties {
  const accentMap: Record<string, string> = {
    blue: "rgba(95, 135, 255, 0.18)",
    green: "rgba(38, 208, 124, 0.16)",
    red: "rgba(255, 108, 108, 0.16)",
    purple: "rgba(149, 94, 255, 0.16)",
  };

  return {
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.08)",
    background: `linear-gradient(180deg, ${accentMap[accent ?? "blue"]} 0%, rgba(255,255,255,0.025) 100%)`,
    minHeight: 102,
    display: "grid",
    alignContent: "space-between",
    gap: 10,
    boxShadow: "0 14px 30px rgba(0,0,0,0.12)",
  };
}

export const panelTitle: CSSProperties = {
  fontWeight: 900,
  fontSize: 17,
  letterSpacing: -0.2,
};

export const primaryButton: CSSProperties = {
  cursor: "pointer",
  borderRadius: 14,
  border: "1px solid rgba(126,167,255,0.32)",
  padding: "12px 14px",
  background: "linear-gradient(180deg, rgba(92,132,255,0.28) 0%, rgba(67,108,255,0.18) 100%)",
  color: "inherit",
  fontWeight: 900,
  boxShadow: "0 10px 24px rgba(47,84,235,0.18)",
};

export const ghostButton: CSSProperties = {
  cursor: "pointer",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.12)",
  padding: "8px 12px",
  background: "rgba(255,255,255,0.02)",
  color: "inherit",
  fontWeight: 800,
};

export const softButton: CSSProperties = {
  cursor: "pointer",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  padding: "10px 14px",
  background: "rgba(255,255,255,0.04)",
  color: "inherit",
  fontWeight: 900,
};

export const dangerButtonSmall: CSSProperties = {
  cursor: "pointer",
  borderRadius: 12,
  border: "1px solid rgba(255,120,120,0.30)",
  padding: "8px 12px",
  background: "rgba(255,0,0,0.08)",
  color: "#ffb4b4",
  fontWeight: 900,
};

export const inputStyle: CSSProperties = {
  padding: "12px 12px",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.045)",
  color: "inherit",
  outline: "none",
};

export const modalOverlay: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.60)",
  display: "grid",
  placeItems: "center",
  zIndex: 50,
  padding: 16,
};

export const modalCard: CSSProperties = {
  width: "min(980px, 96vw)",
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(12,16,25,0.96)",
  boxShadow: "0 24px 70px rgba(0,0,0,0.55)",
  overflow: "hidden",
};

export const modalHeader: CSSProperties = {
  padding: 18,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

export const modalBody: CSSProperties = {
  padding: 18,
  display: "grid",
  gap: 14,
};

export function tabButton(active: boolean): CSSProperties {
  return {
    ...ghostButton,
    border: active ? "1px solid rgba(113,153,255,0.34)" : "1px solid rgba(255,255,255,0.12)",
    background: active ? "rgba(84,121,255,0.12)" : "rgba(255,255,255,0.02)",
    boxShadow: active ? "0 10px 24px rgba(47,84,235,0.12)" : "none",
  };
}

export const memberAvatarStyle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  fontSize: 13,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "linear-gradient(180deg, rgba(87,125,255,0.22) 0%, rgba(255,255,255,0.04) 100%)",
  flexShrink: 0,
};

export const timelineCard: CSSProperties = {
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.02)",
  display: "grid",
  gap: 8,
};

export const pillStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  fontSize: 12,
  opacity: 0.9,
};

// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com
//
// O que foi feito neste arquivo:
// - ✅ Extraídos os estilos do Groups.tsx
// - ✅ Mantidos estilos fixos como constantes
// - ✅ Mantidos estilos dinâmicos como funções
// - ✅ Preparado para reutilização nos componentes de Groups
