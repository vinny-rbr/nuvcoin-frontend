import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../lib/api";
import { readApiErrorMessage } from "../lib/apiError";
import { logClientEvent } from "../lib/clientLogger";
import { getPasswordPolicyError } from "../lib/passwordPolicy";
import "./auth.css";
// useNavigate permite redirecionar apÃ³s criar conta

export default function Register() {
  const navigate = useNavigate();
  // Hook para redirecionamento

  const [email, setEmail] = useState("");
  // Guarda email digitado

  const [password, setPassword] = useState("");
  // Guarda senha digitada
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  // Controla estado de carregamento

  async function handleRegister() {
    // Executado ao clicar em "Criar conta"
    logClientEvent({
      event: "auth.register.submit",
      message: "Tentativa de cadastro",
      data: { email: email.trim() || null },
    });

    if (!email || !password) {
      alert("Preencha email e senha.");
      return;
    }

    const passwordError = getPasswordPolicyError(password);
    if (passwordError) {
      alert(passwordError);
      logClientEvent({
        event: "auth.register.password_rejected",
        message: "Senha recusada pela politica de seguranca",
        data: { email: email.trim() || null, reason: passwordError },
      });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      if (!res.ok) {
        const message = await readApiErrorMessage(res, "Nao foi possivel criar a conta agora.");
        logClientEvent({
          event: "auth.register.failed",
          message: "Cadastro falhou",
          data: { email: email.trim(), status: res.status, error: message },
        });

        if (res.status === 409) {
          alert("Esse e-mail jÃ¡ estÃ¡ cadastrado.");
          return;
        }

        throw new Error(message);
      }

      alert("Conta criada. Enviamos um codigo para confirmar seu e-mail.");
      logClientEvent({
        event: "auth.register.success",
        message: "Cadastro realizado",
        data: { email: email.trim() },
      });

      navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao criar conta.";
      logClientEvent({
        event: "auth.register.error",
        message: "Erro no cadastro",
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
      <div className="auth-card">
        <h1 className="auth-title">Conciliaaí</h1>
        <p className="auth-subtitle">Crie sua conta</p>

        <input
          className="auth-input"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="auth-password-field">
          <input
            className="auth-input auth-password-input"
            type={showPassword ? "text" : "password"}
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        <button
          className="auth-button auth-button-register"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>

        <p className="auth-footer">
          Ja tem conta?{" "}
          <button type="button" className="auth-link-button" onClick={() => navigate("/login")}>
            Entrar
          </button>
        </p>

        <p className="auth-credit">Feito com ❤️ por vinnytecnologia</p>
      </div>
    </div>
  );
}




