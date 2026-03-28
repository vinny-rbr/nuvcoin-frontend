import type { ReactNode } from "react";

type GroupsHeaderActionQuickInfoCardProps = {
  title: string;
  children: ReactNode;
};

export default function GroupsHeaderActionQuickInfoCard({
  title,
  children,
}: GroupsHeaderActionQuickInfoCardProps) {
  return (
    <div
      style={{
        display: "grid",
        gap: 12,
        padding: 18,
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 16 }}>{title}</div>
      {children}
    </div>
  );
}
