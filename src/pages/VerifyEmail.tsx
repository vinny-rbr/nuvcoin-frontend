import { useMemo, useState } from "react";
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

  async function handleVerify() {
    if (!email || !code) {
      alert("Informe o e-mail e o codigo.");
      return;
    }

    try {
      setLoading(true);
      logClientEvent({
        event: "auth.email.verify.submit",
        message: "Tentativa de verificacao de e-mail",
        data: { email: email.trim() || null },
      });

      const res = await fetch(apiUrl("/api/auth/verify-email"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });

      if (!res.ok) {
        const message = await readApiErrorMessage(res, "Nao foi possivel confirmar o e-mail.");
        throw new Error(message);
      }

      logClientEvent({
        event: "auth.email.verify.success",
        message: "E-mail verificado",
        data: { email: email.trim() },
      });
      alert("E-mail confirmado. Agora voce pode entrar.");
      navigate("/login");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao confirmar e-mail.";
      logClientEvent({
        event: "auth.email.verify.error",
        message: "Erro na verificacao de e-mail",
        data: { email: email.trim() || null, error: message },
      });
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) {
      alert("Informe o e-mail.");
      return;
    }

    try {
      setResending(true);
      const res = await fetch(apiUrl("/api/auth/resend-verification-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const message = await readApiErrorMessage(res, "Nao foi possivel reenviar o codigo.");
        throw new Error(message);
      }

      logClientEvent({
        event: "auth.email.verify.resend",
        message: "Codigo de e-mail reenviado",
        data: { email: email.trim() },
      });
      alert("Codigo reenviado.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao reenviar codigo.";
      alert(message);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="auth-scene">
      <div className="auth-grid" />
      <div className="auth-card">
        <h1 className="auth-title">Conciliaaí</h1>
        <p className="auth-subtitle">Confirme seu e-mail</p>

        <input
          className="auth-input"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="auth-input auth-code-input"
          inputMode="numeric"
          maxLength={6}
          placeholder="Codigo de 6 digitos"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        />

        <button className="auth-button auth-button-register" onClick={handleVerify} disabled={loading}>
          {loading ? "Confirmando..." : "Confirmar e-mail"}
        </button>

        <button className="auth-link-button" type="button" onClick={handleResend} disabled={resending}>
          {resending ? "Reenviando..." : "Reenviar codigo"}
        </button>

        <p className="auth-footer">
          Ja confirmou? <Link to="/login">Entrar</Link>
        </p>

        <p className="auth-credit">Feito com ❤️ por vinnytecnologia</p>
      </div>
    </div>
  );
}
