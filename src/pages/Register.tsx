import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../lib/api";
import { readApiErrorMessage } from "../lib/apiError";
import { logClientEvent } from "../lib/clientLogger";
import "./auth.css";
// useNavigate permite redirecionar apÃ³s criar conta

export default function Register() {
  const navigate = useNavigate();
  // Hook para redirecionamento

  const [email, setEmail] = useState("");
  // Guarda email digitado

  const [password, setPassword] = useState("");
  // Guarda senha digitada

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

        <input
          className="auth-input"
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="auth-button auth-button-register"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>

        <p className="auth-credit">Feito com ❤️ por vinnytecnologia</p>
      </div>
    </div>
  );
}




