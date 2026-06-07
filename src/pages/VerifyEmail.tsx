import { useCallback, useMemo, useRef, useState } from "react";
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
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const code = digits.join("");

  const fillDigits = useCallback((value: string, fromIndex = 0) => {
    const cleaned = value.replace(/\D/g, "").slice(0, 6 - fromIndex);
    if (!cleaned) return;
    setDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < cleaned.length; i++) {
        next[fromIndex + i] = cleaned[i];
      }
      return next;
    });
    const lastFilled = Math.min(fromIndex + cleaned.length - 1, 5);
    inputRefs.current[lastFilled]?.focus();
  }, []);

  const handleDigit = useCallback((index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length > 1) {
      // iOS auto-fill ou paste via onChange: espalha a partir deste campo
      fillDigits(cleaned, index);
      return;
    }
    setDigits((prev) => {
      const next = [...prev];
      next[index] = cleaned;
      return next;
    });
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [fillDigits]);

  const handlePaste = useCallback((e: React.ClipboardEvent, index: number) => {
    e.preventDefault();
    fillDigits(e.clipboardData.getData("text"), index);
  }, [fillDigits]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [digits]);

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

  const allFilled = code.length === 6;

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

        <div className="otp-row" aria-label="Código de verificação">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              className={`otp-digit${d ? " is-filled" : ""}`}
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete={i === 0 ? "one-time-code" : "off"}
              value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={(e) => handlePaste(e, i)}
              aria-label={`Dígito ${i + 1}`}
            />
          ))}
        </div>

        <button
          className="auth-btn-primary"
          type="button"
          onClick={handleVerify}
          disabled={loading || !allFilled}
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
