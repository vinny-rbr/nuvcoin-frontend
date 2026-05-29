import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { readApiErrorMessage } from "../lib/apiError";
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

    if (!email || !password) {
      alert("Preencha email e senha.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/auth/register", {
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

        if (res.status === 409) {
          alert("Esse e-mail jÃ¡ estÃ¡ cadastrado.");
          return;
        }

        throw new Error(message);
      }

      alert("Conta criada com sucesso! FaÃ§a login.");

      // ðŸ”¥ Redireciona automaticamente para o Login
      navigate("/login");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao criar conta.";
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
        <p className="auth-subtitle">Criar conta</p>

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
      </div>
    </div>
  );
}

