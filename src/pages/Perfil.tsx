import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../lib/api";
import { APP_VERSION } from "../lib/appVersion";
import {
  deriveSubscriptionStatusFromAuthData,
  persistSubscriptionState,
  type SubscriptionStatus,
} from "../lib/auth";

function persistLifetimeState(value: boolean) {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem("conciliaai_subscription_lifetime", "true");
    window.localStorage.removeItem("subscriptionEndDateUtc");
  } else {
    window.localStorage.removeItem("conciliaai_subscription_lifetime");
  }
}

// ─── helpers ────────────────────────────────────────────────────────────────

function getPhotoKey(userId: string | null) {
  return `conciliaai_profile_photo:${userId ?? "anonymous"}`;
}

function getInitials(nameOrEmail: string): string {
  const s = nameOrEmail.trim();
  if (!s) return "US";
  const part = s.includes("@") ? s.split("@")[0] : s;
  const words = part.split(/[\s._-]+/).filter(Boolean);
  if (!words.length) return "US";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

function remainingDays(endUtc: string | null | undefined): number {
  if (!endUtc) return 0;
  return Math.max(0, Math.ceil((new Date(endUtc).getTime() - Date.now()) / 86_400_000));
}

function cycleProgress(startUtc: string | null | undefined, endUtc: string | null | undefined): number {
  if (!startUtc || !endUtc) return 0;
  const s = new Date(startUtc).getTime();
  const e = new Date(endUtc).getTime();
  if (e <= s) return 0;
  return Math.min(100, Math.max(0, ((Date.now() - s) / (e - s)) * 100));
}

// ─── icons ──────────────────────────────────────────────────────────────────

const ICON_USER = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.6"/><path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6"/>
  </svg>
);
const ICON_MAIL = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>
  </svg>
);
const ICON_ID = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="8.5" cy="11" r="2"/>
    <path d="M5.5 16c.4-1.4 1.6-2.2 3-2.2s2.6.8 3 2.2"/><path d="M14.5 10h4M14.5 13.5h3"/>
  </svg>
);
const ICON_CAMERA = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/>
    <circle cx="12" cy="13" r="3.2"/>
  </svg>
);
const ICON_CAL_IN = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 9h18M8 3v4M16 3v4"/>
    <path d="M12 12v5m0 0 2-2m-2 2-2-2"/>
  </svg>
);
const ICON_CAL_OUT = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 9h18M8 3v4M16 3v4"/>
    <path d="M12 17v-5m0 0 2 2m-2-2-2 2"/>
  </svg>
);
const ICON_SHIELD = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6Z"/><path d="m9 12 2 2 4-4"/>
  </svg>
);
const ICON_BELL = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 19a2 2 0 0 0 4 0"/>
  </svg>
);
const ICON_LOGOUT = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/>
    <path d="M10 12h10m0 0-3-3m3 3-3 3"/>
  </svg>
);
const ICON_PRIVACY = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const ICON_CHEV = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 6 6 6-6 6"/>
  </svg>
);
const ICON_BACK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
);

// ─── sub-components ──────────────────────────────────────────────────────────

function InfoRow({
  icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 16px" }}>
      <span
        style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          display: "grid", placeItems: "center",
          background: iconBg, color: iconColor,
        }}
      >
        <span style={{ width: 19, height: 19, display: "block" }}>{icon}</span>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", letterSpacing: "0.2px" }}>{label}</div>
        <div style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 600, fontSize: 15.5, marginTop: 3, letterSpacing: "-0.2px", color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
      </div>
    </div>
  );
}

function ActionRow({
  icon,
  label,
  danger = false,
  onClick,
  showChev = true,
}: {
  icon: React.ReactNode;
  label: string;
  danger?: boolean;
  onClick?: () => void;
  showChev?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 13,
        padding: "15px 16px", width: "100%",
        background: "transparent", border: 0, cursor: "pointer",
        color: danger ? "#f87171" : "#f1f5f9",
        fontSize: 14, fontWeight: 700, textAlign: "left",
        transition: "background 0.16s",
        fontFamily: "'Manrope', system-ui, sans-serif",
      }}
    >
      <span
        style={{
          width: 36, height: 36, borderRadius: 11,
          display: "grid", placeItems: "center", flexShrink: 0,
          background: danger ? "rgba(239,68,68,0.12)" : "rgba(148,163,184,0.1)",
          color: danger ? "#f87171" : "#94a3b8",
        }}
      >
        <span style={{ width: 18, height: 18, display: "block" }}>{icon}</span>
      </span>
      {label}
      {showChev ? (
        <span style={{ marginLeft: "auto", color: "#64748b", width: 18, height: 18, display: "block" }}>
          {ICON_CHEV}
        </span>
      ) : null}
    </button>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

type SubData = {
  status: SubscriptionStatus;
  startDateUtc: string | null;
  endDateUtc: string | null;
  isLifetime: boolean;
};

export default function Perfil() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const userId = typeof window !== "undefined" ? localStorage.getItem("conciliaai_userId") : null;

  const [photo, setPhoto] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(getPhotoKey(userId)) : null
  );
  const [name, setName] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("conciliaai_name") ?? "") : ""
  );
  const [email] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("conciliaai_email") ?? "") : ""
  );
  const [cpf, setCpf] = useState<string | null>(null);
  const [sub, setSub] = useState<SubData | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    void Promise.allSettled([
      fetch(apiUrl("/api/users/me"), { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d: Record<string, unknown>) => {
          if (d.name && typeof d.name === "string" && d.name.trim()) {
            setName(d.name.trim());
            localStorage.setItem("conciliaai_name", d.name.trim());
          }
          if (d.cpfCnpj && typeof d.cpfCnpj === "string") {
            setCpf(d.cpfCnpj);
            localStorage.setItem("conciliaai_cpf", d.cpfCnpj);
          }
        }),
      fetch(apiUrl("/api/subscriptions/me"), { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((d: Record<string, unknown>) => {
          const status: SubscriptionStatus = deriveSubscriptionStatusFromAuthData(d) ?? "inactive";
          const isLifetime = d.isLifetime === true || d.lifetime === true;
          const endDate =
            typeof d.subscriptionEndDateUtc === "string"
              ? d.subscriptionEndDateUtc
              : typeof d.endDateUtc === "string"
                ? d.endDateUtc
                : null;
          const startDate = typeof d.startDateUtc === "string" ? d.startDateUtc : null;

          setSub({ status, startDateUtc: startDate, endDateUtc: endDate, isLifetime });

          persistSubscriptionState(status);
          persistLifetimeState(isLifetime);
          if (endDate && !isLifetime) localStorage.setItem("subscriptionEndDateUtc", endDate);
        }),
    ]);
  }, []);

  function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) return;
      localStorage.setItem(getPhotoKey(userId), result);
      setPhoto(result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleLogout() {
    const keys = [
      "token", "conciliaai_email", "conciliaai_userId", "conciliaai_name",
      "conciliaai_subscription_active", "subscriptionActive", "subscriptionStatus",
      "subscription_status", "hasActiveSubscription", "isSubscriptionActive",
      "planStatus", "plan_status", "planActive", "plan_active", "isActive",
      "conciliaai_subscription_lifetime", "subscriptionEndDateUtc",
    ];
    keys.forEach((k) => localStorage.removeItem(k));
    navigate("/login");
  }

  const initials = getInitials(name || email);
  const days = remainingDays(sub?.endDateUtc);
  const progress = cycleProgress(sub?.startDateUtc, sub?.endDateUtc);

  const chipLabel = sub?.isLifetime
    ? "Vitalício"
    : sub?.status === "active"
      ? `Ativo · ${days} dias`
      : sub?.status === "trial"
        ? `Teste · ${days} dias`
        : "Inativo";

  const chipDotColor = sub?.status === "inactive" ? "#f87171" : "#4ade80";

  const renewLabel = sub?.endDateUtc
    ? `Sua assinatura ${sub.isLifetime ? "não expira" : `renova em ${formatDate(sub.endDateUtc)}`}.`
    : "Dados de assinatura indisponíveis.";

  return (
    <div
      style={{
        maxWidth: 520,
        margin: "0 auto",
        paddingBottom: 40,
        fontFamily: "'Manrope', system-ui, sans-serif",
      }}
    >
      {/* ── Hero ── */}
      <div
        style={{
          position: "relative",
          margin: "0 -16px",
          padding: "18px 22px 28px",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {/* radial glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(60% 100% at 50% 0%, rgba(59,130,246,0.22), transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* top row: back + title */}
        <div
          style={{
            position: "relative", zIndex: 1,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 22,
          }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              width: 38, height: 38, borderRadius: 12,
              display: "grid", placeItems: "center",
              background: "rgba(30,41,59,0.7)",
              border: "1px solid rgba(148,163,184,0.13)",
              color: "#94a3b8", cursor: "pointer",
            }}
            aria-label="Voltar"
          >
            <span style={{ width: 20, height: 20, display: "block" }}>{ICON_BACK}</span>
          </button>
          <span
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontWeight: 700, fontSize: 19, letterSpacing: "-0.3px",
            }}
          >
            Meu perfil
          </span>
          {/* spacer to keep title centered */}
          <div style={{ width: 38 }} />
        </div>

        {/* avatar ring + camera badge */}
        <div style={{ position: "relative", zIndex: 1, display: "inline-grid", placeItems: "center" }}>
          <div
            style={{
              width: 116, height: 116, borderRadius: "50%", padding: 4,
              background: "conic-gradient(from 140deg, #60a5fa, #2563eb, #a78bfa, #60a5fa)",
              boxShadow: "0 18px 44px rgba(37,99,235,0.5)",
            }}
          >
            <div
              style={{
                width: "100%", height: "100%", borderRadius: "50%",
                display: "grid", placeItems: "center",
                fontFamily: "'Space Grotesk', system-ui, sans-serif",
                fontWeight: 700, fontSize: 40, color: "#dbeafe",
                background: "linear-gradient(150deg, #3b4a73, #1b2236)",
                overflow: "hidden",
                border: "3px solid #0b1120",
              }}
            >
              {photo ? <img src={photo} alt="Foto de perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
            </div>
          </div>
          <button
            type="button"
            title="Trocar foto"
            onClick={() => fileRef.current?.click()}
            style={{
              position: "absolute", right: 2, bottom: 2,
              width: 38, height: 38, borderRadius: "50%",
              display: "grid", placeItems: "center",
              background: "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)",
              color: "#fff", border: "3px solid #0b1120", cursor: "pointer",
              boxShadow: "0 8px 20px rgba(37,99,235,0.5)",
            }}
          >
            <span style={{ width: 17, height: 17, display: "block" }}>{ICON_CAMERA}</span>
          </button>
        </div>

        {/* name + email */}
        <div
          style={{
            position: "relative", zIndex: 1,
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontWeight: 700, fontSize: 24, letterSpacing: "-0.4px", marginTop: 16,
          }}
        >
          {name || email.split("@")[0] || "Usuário"}
        </div>
        <div style={{ position: "relative", zIndex: 1, color: "#94a3b8", fontSize: 14, fontWeight: 600, marginTop: 4 }}>
          {email}
        </div>

        {/* chips */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "center", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "7px 13px", borderRadius: 999,
              fontSize: 11.5, fontWeight: 800, whiteSpace: "nowrap",
              color: "#bfdbfe",
              background: "rgba(37,99,235,0.18)",
              border: "1px solid rgba(96,165,250,0.3)",
            }}
          >
            <span
              style={{
                width: 7, height: 7, borderRadius: "50%",
                background: chipDotColor,
                boxShadow: `0 0 8px ${chipDotColor}`,
              }}
            />
            {chipLabel}
          </span>
          <span
            style={{
              display: "inline-flex", alignItems: "center",
              padding: "7px 13px", borderRadius: 999,
              fontSize: 11.5, fontWeight: 800,
              color: "#64748b",
              background: "rgba(148,163,184,0.08)",
              border: "1px solid rgba(148,163,184,0.13)",
            }}
          >
            Versão {APP_VERSION}
          </span>
        </div>

        {/* trocar foto button */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{
            position: "relative", zIndex: 1,
            marginTop: 18,
            display: "inline-flex", alignItems: "center", gap: 9,
            padding: "11px 20px", borderRadius: 14,
            fontSize: 13.5, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap",
            color: "#f1f5f9",
            background: "rgba(30,41,59,0.8)",
            border: "1px solid rgba(148,163,184,0.13)",
          }}
        >
          <span style={{ width: 16, height: 16, display: "block" }}>{ICON_CAMERA}</span>
          {photo ? "Trocar foto" : "Adicionar foto"}
        </button>
      </div>

      {/* ── Dados pessoais ── */}
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase", color: "#64748b", margin: "24px 4px 11px" }}>
        Dados pessoais
      </div>
      <div
        style={{
          borderRadius: 20, overflow: "hidden",
          background: "radial-gradient(circle at 16% 0%, rgba(96,165,250,0.07), transparent 40%), rgba(30,41,59,0.55)",
          border: "1px solid rgba(148,163,184,0.13)",
          boxShadow: "0 18px 48px rgba(2,6,23,0.45)",
        }}
      >
        <InfoRow icon={ICON_USER} iconBg="rgba(59,130,246,0.18)" iconColor="#60a5fa" label="NOME" value={name || "—"} />
        <div style={{ borderTop: "1px solid rgba(148,163,184,0.09)" }}>
          <InfoRow icon={ICON_MAIL} iconBg="rgba(167,139,250,0.18)" iconColor="#a78bfa" label="E-MAIL" value={email || "—"} />
        </div>
        <div style={{ borderTop: "1px solid rgba(148,163,184,0.09)" }}>
          <InfoRow icon={ICON_ID} iconBg="rgba(20,184,166,0.18)" iconColor="#2dd4bf" label="CPF" value={cpf ?? "Não informado"} />
        </div>
      </div>

      {/* ── Assinatura ── */}
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase", color: "#64748b", margin: "24px 4px 11px" }}>
        Assinatura
      </div>

      {sub && (sub.status !== "inactive" || sub.startDateUtc) ? (
        <div
          style={{
            borderRadius: 20, padding: 18,
            background: "radial-gradient(120% 120% at 0% 0%, rgba(37,99,235,0.18), transparent 55%), rgba(24,35,59,0.85)",
            border: "1px solid rgba(96,165,250,0.22)",
            boxShadow: "0 18px 48px rgba(2,6,23,0.45)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#f1f5f9" }}>Ciclo atual</span>
            {!sub.isLifetime && (
              <span
                style={{
                  fontSize: 11.5, fontWeight: 800, color: "#bfdbfe",
                  padding: "5px 11px", borderRadius: 999,
                  background: "rgba(37,99,235,0.22)",
                  border: "1px solid rgba(96,165,250,0.3)",
                }}
              >
                {days > 0 ? `${days} dias restantes` : "Vence hoje"}
              </span>
            )}
            {sub.isLifetime && (
              <span
                style={{
                  fontSize: 11.5, fontWeight: 800, color: "#4ade80",
                  padding: "5px 11px", borderRadius: 999,
                  background: "rgba(34,197,94,0.14)",
                  border: "1px solid rgba(74,222,128,0.3)",
                }}
              >
                Sem expiração
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 16, height: 16, display: "block", color: "#4ade80" }}>{ICON_CAL_IN}</span>
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.8px", textTransform: "uppercase", color: "#64748b" }}>Pagamento</span>
              </div>
              <span style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.4px" }}>
                {formatDate(sub.startDateUtc)}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.8px", textTransform: "uppercase", color: "#64748b" }}>Vencimento</span>
                <span style={{ width: 16, height: 16, display: "block", color: "#60a5fa" }}>{ICON_CAL_OUT}</span>
              </div>
              <span style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: "-0.4px", color: "#60a5fa" }}>
                {sub.isLifetime ? "—" : formatDate(sub.endDateUtc)}
              </span>
            </div>
          </div>

          {!sub.isLifetime && (
            <>
              <div
                style={{
                  height: 7, borderRadius: 999, margin: "14px 0 8px",
                  background: "rgba(148,163,184,0.16)", overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%", borderRadius: 999, width: `${progress}%`,
                    background: "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)",
                    boxShadow: "0 0 12px rgba(96,165,250,0.6)",
                  }}
                />
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "#94a3b8" }}>{renewLabel}</div>
            </>
          )}
        </div>
      ) : (
        <div
          style={{
            borderRadius: 20, padding: "18px 16px",
            background: "rgba(30,41,59,0.55)",
            border: "1px solid rgba(148,163,184,0.13)",
            color: "#64748b", fontSize: 14, fontWeight: 600, textAlign: "center",
          }}
        >
          Nenhuma assinatura ativa encontrada.
        </div>
      )}

      {/* ── Conta ── */}
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase", color: "#64748b", margin: "24px 4px 11px" }}>
        Conta
      </div>
      <div
        style={{
          borderRadius: 20, overflow: "hidden",
          background: "rgba(30,41,59,0.45)",
          border: "1px solid rgba(148,163,184,0.13)",
        }}
      >
        <ActionRow icon={ICON_SHIELD} label="Segurança e senha" />
        <div style={{ borderTop: "1px solid rgba(148,163,184,0.09)" }}>
          <ActionRow icon={ICON_BELL} label="Notificações" />
        </div>
        <div style={{ borderTop: "1px solid rgba(148,163,184,0.09)" }}>
          <ActionRow icon={ICON_LOGOUT} label="Sair da conta" danger onClick={handleLogout} showChev={false} />
        </div>
      </div>

      {/* ── Jurídico ── */}
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase", color: "#64748b", margin: "24px 4px 11px" }}>
        Jurídico
      </div>
      <div
        style={{
          borderRadius: 20, overflow: "hidden",
          background: "rgba(30,41,59,0.45)",
          border: "1px solid rgba(148,163,184,0.13)",
        }}
      >
        <ActionRow
          icon={ICON_PRIVACY}
          label="Política de Privacidade"
          onClick={() => window.open("https://conciliaai.com.br/politica-de-privacidade.html", "_blank", "noopener")}
        />
      </div>

      {/* footer */}
      <div style={{ textAlign: "center", color: "#64748b", fontSize: 11.5, fontWeight: 700, margin: "28px 0 4px", letterSpacing: "0.3px" }}>
        Conciliaaí · Versão {APP_VERSION}
      </div>

      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />

      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&display=swap");
      `}</style>
    </div>
  );
}
