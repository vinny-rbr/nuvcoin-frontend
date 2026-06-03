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
    <div className="auth-page">
      <div className="auth-v2-card stagger" style={{ maxHeight: "calc(100dvh - 40px)", overflowY: "auto" }}>
        <div className="auth-logo-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l5-5 4 3 8-8"/><path d="M16 7h4v4"/>
          </svg>
        </div>

        <h1 className="auth-h1">Esqueci minha senha</h1>
        <p className="auth-sub">Informe seu e-mail e enviaremos um código para redefinir.</p>

        <div className="auth-form">
          <div className="auth-field">
            <span>E-mail</span>
            <input
              className="auth-input"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button className="auth-btn-primary" type="button" onClick={handleRequestCode} disabled={loading}>
            {loading && !codeSent ? "Enviando..." : codeSent ? "Reenviar código" : "Enviar código"}
          </button>

          {codeSent ? (
            <>
              <div className="auth-field">
                <span>Código de 6 dígitos</span>
                <input
                  className="auth-input"
                  style={{ textAlign: "center", fontSize: 22, fontWeight: 700, letterSpacing: 8 }}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="______"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>

              <div className="auth-field">
                <span>Nova senha</span>
                <div className="auth-pw-wrapper">
                  <input
                    className="auth-input"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nova senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="auth-pw-btn"
                    aria-label={showPassword ? "Ocultar" : "Mostrar"}
                    onClick={() => setShowPassword((c) => !c)}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 3l18 18"/><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"/>
                        <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c5.5 0 9 5 9 7a8.8 8.8 0 0 1-2.1 3.2"/>
                        <path d="M6.6 6.7C4.2 8.2 3 10.7 3 12c0 2 3.5 7 9 7a10.9 10.9 0 0 0 4.2-.8"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <span>Confirmar nova senha</span>
                <input
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button className="auth-btn-primary" type="button" onClick={handleResetPassword} disabled={loading}>
                {loading ? "Alterando..." : "Alterar senha"}
              </button>
            </>
          ) : null}
        </div>

        <p className="auth-foot-v2">Lembrou? <Link to="/login">Entrar</Link></p>
        <p className="auth-credit-v2">Feito com ❤️ por vinnytecnologia</p>
      </div>
    </div>
  );
}
