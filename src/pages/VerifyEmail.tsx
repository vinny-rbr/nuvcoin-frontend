import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiUrl } from "../lib/api";
import { readApiErrorMessage } from "../lib/apiError";
import { logClientEvent } from "../lib/clientLogger";
import "./auth.css";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get("email") ?? "", [searchParams]);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(value: string) {
    const cleaned = value.replace(/\D/g, "").slice(0, 6);
    setCode(cleaned);
  }

  async function handleVerify() {
    if (!email || code.length < 6) {
      alert("Informe o e-mail e o código completo.");
      return;
    }

    try {
      setLoading(true);
      logClientEvent({ event: "auth.email.verify.submit", message: "Verificação de e-mail", data: { email } });

      const res = await fetch(apiUrl("/api/auth/verify-email"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code }),
      });

      if (!res.ok) {
        const message = await readApiErrorMessage(res, "Não foi possível confirmar o e-mail.");
        throw new Error(message);
      }

      logClientEvent({ event: "auth.email.verify.success", message: "E-mail verificado", data: { email } });
      alert("E-mail confirmado. Agora você pode entrar.");
      navigate("/login");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao confirmar e-mail.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) { alert("Informe o e-mail."); return; }

    try {
      setResending(true);
      const res = await fetch(apiUrl("/api/auth/resend-verification-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) throw new Error(await readApiErrorMessage(res, "Não foi possível reenviar o código."));
      logClientEvent({ event: "auth.email.verify.resend", message: "Código reenviado", data: { email } });
      alert("Código reenviado.");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao reenviar código.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-v2-card stagger">
        <div className="auth-logo-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.7 21a2 2 0 0 1-3.4 0"/>
          </svg>
        </div>

        <h1 className="auth-h1">Confirme seu e-mail</h1>
        <p className="auth-sub">
          Enviamos um código para{" "}
          <strong style={{ color: "var(--text-main)" }}>{email || "seu e-mail"}</strong>
        </p>

        {!initialEmail ? (
          <div className="auth-field" style={{ marginBottom: 4 }}>
            <span>E-mail</span>
            <input
              className="auth-input"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        ) : null}

        {/* Container relativo — input invisível cobre tudo, spans são só visuais */}
        <div
          className="otp-row"
          style={{ position: "relative", cursor: "text" }}
          onClick={() => inputRef.current?.focus()}
          aria-label="Código de verificação"
        >
          {Array.from({ length: 6 }, (_, i) => (
            <span
              key={i}
              className={`otp-digit${code[i] ? " is-filled" : ""}${i === code.length ? " is-active" : ""}`}
            >
              {code[i] ?? ""}
            </span>
          ))}

          {/* Input real — invisível mas interativo; captura teclado e autocomplete do OS */}
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => handleChange(e.target.value)}
            aria-label="Código de verificação"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              fontSize: "16px",   // evita zoom automático no iOS
              caretColor: "transparent",
              border: "none",
              background: "transparent",
              cursor: "text",
            }}
          />
        </div>

        <button
          className="auth-btn-primary"
          type="button"
          onClick={handleVerify}
          disabled={loading || code.length < 6}
          style={{ marginTop: 8 }}
        >
          {loading ? "Confirmando..." : "Confirmar"}
          {!loading && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          )}
        </button>

        <p className="auth-foot-v2">
          Não chegou?{" "}
          <button type="button" onClick={handleResend} disabled={resending}>
            {resending ? "Reenviando..." : "Reenviar código"}
          </button>
        </p>

        <p className="auth-foot-v2">
          Já confirmou? <Link to="/login">Entrar</Link>
        </p>

        <p className="auth-credit-v2">Feito com ❤️ por vinnytecnologia</p>
      </div>
    </div>
  );
}
