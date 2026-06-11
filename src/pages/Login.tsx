import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiUrl } from "../lib/api";
import { readApiErrorMessage } from "../lib/apiError";
import { deriveSubscriptionStatusFromAuthData, persistSubscriptionState } from "../lib/auth";
import { hasCompletedOnboarding } from "../lib/onboarding";
import { logClientEvent } from "../lib/clientLogger";
import LoginAnimatedBg from "./LoginAnimatedBg";
import "./auth.css";

export default function Login() {
  const navigate = useNavigate(); // Permite redirecionar o usuário para outra rota

  const [email, setEmail] = useState(""); // Estado que guarda o e-mail digitado
  const [password, setPassword] = useState(""); // Estado que guarda a senha digitada
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Estado de carregamento

  async function handleLogin() {
    // Função executada ao clicar no botão "Entrar"
    logClientEvent({
      event: "auth.login.submit",
      message: "Tentativa de login",
      data: { email: email.trim() || null },
    });

    if (!email) {
      // Valida se o e-mail foi preenchido
      alert("Preencha o e-mail."); // Mostra alerta
      return; // Para aqui se estiver vazio
    }

    try {
      setLoading(true); // Ativa loading

      // =========================
      // âœ… Chama backend pra gerar JWT válido
      // =========================

      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(), // Email do usuário
          password: password, // Senha do usuário
        }),
      });

      if (!res.ok) {
        const message = await readApiErrorMessage(res, "Email ou senha invalidos.");
        logClientEvent({
          event: "auth.login.failed",
          message: "Login falhou",
          data: { email: email.trim(), status: res.status, error: message },
        });

        if (res.status === 403) {
          alert(message);
          navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
          return;
        }

        alert(message);
        return;
      }

      const data = (await res.json()) as {
        token: string;
        userId: string;
        name: string;
        email: string;
        subscriptionEndDateUtc?: string | null;
        subscriptionActive?: boolean | string;
        hasActiveSubscription?: boolean | string;
        isSubscriptionActive?: boolean | string;
        subscriptionStatus?: string;
        planStatus?: string;
        isActive?: boolean | string;
        isLifetime?: boolean;
        lifetime?: boolean;
        planLifetime?: boolean;
        endDateUtc?: string | null;
      };

      if (!data.token) {
        // Se não vier token, não dá pra continuar
        throw new Error("Login falhou: token não retornou.");
      }

      // =========================
      // âœ… Chaves oficiais do app
      // =========================

      localStorage.setItem("auth", "true"); // Marca como logado (compatível com ProtectedRoute)
      localStorage.setItem("token", data.token); // âœ… JWT real (compatível com financeServices)

      // =========================
      // âœ… Chaves específicas do Conciliaaí
      // =========================

      localStorage.setItem("conciliaai_email", data.email); // Email
      localStorage.setItem("conciliaai_userId", data.userId); // UserId
      localStorage.setItem("conciliaai_name", data.name ?? ""); // Nome
      logClientEvent({
        event: "auth.login.success",
        message: "Login realizado",
        data: { email: data.email, userId: data.userId, name: data.name ?? "" },
      });
      const nextSubscriptionStatus = deriveSubscriptionStatusFromAuthData(data);
      const nextIsLifetime = data.isLifetime === true || data.lifetime === true || data.planLifetime === true;
      const nextEndDate = data.subscriptionEndDateUtc ?? data.endDateUtc ?? null;

      if (nextIsLifetime) {
        localStorage.setItem("conciliaai_subscription_lifetime", "true");
        localStorage.removeItem("subscriptionEndDateUtc");
      } else {
        localStorage.removeItem("conciliaai_subscription_lifetime");
      }

      if (!nextIsLifetime && nextEndDate) {
        localStorage.setItem("subscriptionEndDateUtc", nextEndDate);
      } else {
        localStorage.removeItem("subscriptionEndDateUtc");
      }

      persistSubscriptionState(nextSubscriptionStatus); // Estado da assinatura tambem sera revalidado pelo layout.

      navigate(hasCompletedOnboarding(data.userId) ? "/dashboard" : "/onboarding");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao logar.";
      logClientEvent({
        event: "auth.login.error",
        message: "Erro no login",
        data: { email: email.trim() || null, error: message },
      });
      alert(message);
    } finally {
      setLoading(false); // Desativa loading
    }
  }

  return (
    <div className="auth-page">
      <LoginAnimatedBg />
      <div className="auth-v2-card stagger">
        <div className="auth-logo-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l5-5 4 3 8-8"/><path d="M16 7h4v4"/>
          </svg>
        </div>

        <h1 className="auth-h1">Bem-vindo de volta</h1>
        <p className="auth-sub">Acesse sua conta para continuar.</p>

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

          <div className="auth-field">
            <span>Senha</span>
            <div className="auth-pw-wrapper">
              <input
                className="auth-input"
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void handleLogin(); }}
              />
              <button
                type="button"
                className="auth-pw-btn"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
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

          <button className="auth-btn-primary" type="button" onClick={handleLogin} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
            {!loading && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            )}
          </button>
        </div>

        <p className="auth-foot-v2"><Link to="/forgot-password">Esqueci minha senha</Link></p>
        <p className="auth-foot-v2">Não tem conta? <Link to="/register">Criar conta</Link></p>
        <p className="auth-credit-v2">Feito com ❤️ por vinnytecnologia</p>
      </div>
    </div>
  );
}

/*
=====================================================
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com
=====================================================

O que foi feito:

âœ” Removido login por "dev token"
âœ” Agora chama POST /api/auth/token
âœ” Salva JWT real em localStorage.setItem("token", jwt)
âœ” Mantém "auth=true" para continuar compatível com ProtectedRoute
âœ” Salva dados úteis: conciliaai_email, conciliaai_userId, conciliaai_name
*/




