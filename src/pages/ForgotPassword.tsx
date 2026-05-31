import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiUrl } from "../lib/api";
import { readApiErrorMessage } from "../lib/apiError";
import { logClientEvent } from "../lib/clientLogger";
import { getPasswordPolicyError } from "../lib/passwordPolicy";
import "./auth.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get("email") ?? "", [searchParams]);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRequestCode() {
    if (!email) {
      alert("Informe o e-mail cadastrado.");
      return;
    }

    try {
      setLoading(true);
      logClientEvent({
        event: "auth.password_reset.request",
        message: "Solicitou codigo de reset de senha",
        data: { email: email.trim() || null },
      });

      const res = await fetch(apiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        const message = await readApiErrorMessage(res, "Nao foi possivel enviar o codigo.");
        throw new Error(message);
      }

      setCodeSent(true);
      alert("Se o e-mail estiver cadastrado, enviamos um codigo para alterar sua senha.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao solicitar codigo.";
      logClientEvent({
        event: "auth.password_reset.request_error",
        message: "Erro ao solicitar reset de senha",
        data: { email: email.trim() || null, error: message },
      });
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!email || !code || !password || !confirmPassword) {
      alert("Preencha o e-mail, codigo e nova senha.");
      return;
    }

    if (password !== confirmPassword) {
      alert("As senhas nao conferem.");
      return;
    }

    const passwordError = getPasswordPolicyError(password);
    if (passwordError) {
      alert(passwordError);
      return;
    }

    try {
      setLoading(true);
      logClientEvent({
        event: "auth.password_reset.submit",
        message: "Tentativa de alteracao de senha",
        data: { email: email.trim() || null },
      });

      const res = await fetch(apiUrl("/api/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          password,
        }),
      });

      if (!res.ok) {
        const message = await readApiErrorMessage(res, "Nao foi possivel alterar a senha.");
        throw new Error(message);
      }

      logClientEvent({
        event: "auth.password_reset.success",
        message: "Senha alterada",
        data: { email: email.trim() },
      });
      alert("Senha alterada com sucesso. Agora voce pode entrar.");
      navigate("/login");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao alterar senha.";
      logClientEvent({
        event: "auth.password_reset.error",
        message: "Erro ao alterar senha",
        data: { email: email.trim() || null, error: message },
      });
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-scene">
      <div className="auth-grid" />
      <div className="auth-card auth-card-reset">
        <h1 className="auth-title">Conciliaaí</h1>
        <p className="auth-subtitle">Alterar senha</p>

        <input
          className="auth-input"
          placeholder="Seu e-mail"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <button className="auth-button auth-button-login" type="button" onClick={handleRequestCode} disabled={loading}>
          {loading && !codeSent ? "Enviando..." : codeSent ? "Reenviar codigo" : "Enviar codigo"}
        </button>

        {codeSent ? (
          <>
            <input
              className="auth-input auth-code-input"
              inputMode="numeric"
              maxLength={6}
              placeholder="Codigo de 6 digitos"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            />

            <div className="auth-password-field">
              <input
                className="auth-input auth-password-input"
                type={showPassword ? "text" : "password"}
                placeholder="Nova senha"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button
                type="button"
                className="auth-password-toggle"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c5.5 0 9 5 9 7a8.8 8.8 0 0 1-2.1 3.2" />
                    <path d="M6.6 6.7C4.2 8.2 3 10.7 3 12c0 2 3.5 7 9 7a10.9 10.9 0 0 0 4.2-.8" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <input
              className="auth-input"
              type={showPassword ? "text" : "password"}
              placeholder="Confirmar nova senha"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />

            <button className="auth-button auth-button-register" type="button" onClick={handleResetPassword} disabled={loading}>
              {loading ? "Alterando..." : "Alterar senha"}
            </button>
          </>
        ) : null}

        <p className="auth-footer">
          Lembrou a senha? <Link to="/login">Entrar</Link>
        </p>

        <p className="auth-credit">Feito com ❤️ por vinnytecnologia</p>
      </div>
    </div>
  );
}
