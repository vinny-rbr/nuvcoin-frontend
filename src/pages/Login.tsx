import { useState } from "react"; // Hook para controlar estados (inputs)
import { Link, useNavigate } from "react-router-dom"; // Link + navegaÃ§Ã£o
import { apiUrl } from "../lib/api";
import { readApiErrorMessage } from "../lib/apiError";
import { persistSubscriptionState } from "../lib/auth";
import { hasCompletedOnboarding } from "../lib/onboarding";
import { logClientEvent } from "../lib/clientLogger";
import "./auth.css";

export default function Login() {
  const navigate = useNavigate(); // Permite redirecionar o usuÃ¡rio para outra rota

  const [email, setEmail] = useState(""); // Estado que guarda o e-mail digitado
  const [password, setPassword] = useState(""); // Estado que guarda a senha digitada
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false); // Estado de carregamento

  async function handleLogin() {
    // FunÃ§Ã£o executada ao clicar no botÃ£o "Entrar"
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
      // âœ… Chama backend pra gerar JWT vÃ¡lido
      // =========================

      const res = await fetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(), // Email do usuÃ¡rio
          password: password, // Senha do usuÃ¡rio
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
      };

      if (!data.token) {
        // Se nÃ£o vier token, nÃ£o dÃ¡ pra continuar
        throw new Error("Login falhou: token nÃ£o retornou.");
      }

      // =========================
      // âœ… Chaves oficiais do app
      // =========================

      localStorage.setItem("auth", "true"); // Marca como logado (compatÃ­vel com ProtectedRoute)
      localStorage.setItem("token", data.token); // âœ… JWT real (compatÃ­vel com financeServices)

      // =========================
      // âœ… Chaves especÃ­ficas do Conciliaaí
      // =========================

      localStorage.setItem("conciliaai_email", data.email); // Email
      localStorage.setItem("conciliaai_userId", data.userId); // UserId
      localStorage.setItem("conciliaai_name", data.name ?? ""); // Nome
      logClientEvent({
        event: "auth.login.success",
        message: "Login realizado",
        data: { email: data.email, userId: data.userId, name: data.name ?? "" },
      });
      if (data.subscriptionEndDateUtc) {
        localStorage.setItem("subscriptionEndDateUtc", data.subscriptionEndDateUtc);
      } else {
        localStorage.removeItem("subscriptionEndDateUtc");
      }
      localStorage.removeItem("conciliaai_subscription_lifetime");
      persistSubscriptionState(null); // Estado da assinatura sera validado pelo backend apos login

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
    <div className="auth-scene">
      <div className="auth-grid" />
      <div className="auth-card">
        <h1 className="auth-title">Conciliaaí</h1>

        <p className="auth-subtitle">
          Acesse sua conta
        </p>

        <input
          className="auth-input"
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)} // Atualiza estado email
        />

        <div className="auth-password-field">
          <input
            className="auth-input auth-password-input"
            type={showPassword ? "text" : "password"}
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)} // Atualiza estado password
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
          className="auth-button auth-button-login"
          onClick={handleLogin} // Ao clicar, executa login
          disabled={loading} // Desabilita enquanto carrega
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p className="auth-footer">
          <Link to="/forgot-password">Esqueci minha senha</Link>
        </p>

        <p className="auth-footer">
          Nao tem conta?{" "}
          <Link to="/register">
            Criar conta
          </Link>
        </p>

        <p className="auth-credit">Feito com ❤️ por vinnytecnologia</p>
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
âœ” MantÃ©m "auth=true" para continuar compatÃ­vel com ProtectedRoute
âœ” Salva dados Ãºteis: conciliaai_email, conciliaai_userId, conciliaai_name
*/




