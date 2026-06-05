import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiUrl } from "../lib/api";
import { readApiErrorMessage } from "../lib/apiError";
import { logClientEvent } from "../lib/clientLogger";
import { getPasswordPolicyError } from "../lib/passwordPolicy";
import "./auth.css";
// useNavigate permite redirecionar apÃ³s criar conta

export default function Register() {
  const navigate = useNavigate();
  // Hook para redirecionamento

  const [name, setName] = useState("");
  // Guarda como a pessoa quer ser chamada

  const [email, setEmail] = useState("");
  // Guarda email digitado

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cpf, setCpf] = useState("");

  const [loading, setLoading] = useState(false);

  function formatCpf(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  async function handleRegister() {
    logClientEvent({
      event: "auth.register.submit",
      message: "Tentativa de cadastro",
      data: { email: email.trim() || null, name: name.trim() || null },
    });

    if (!name.trim() || !email || !password) {
      alert("Preencha nome, email e senha.");
      return;
    }

    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits && cpfDigits.length !== 11) {
      alert("CPF inválido. Informe todos os 11 dígitos.");
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
          name: name.trim(),
          email: email.trim(),
          password: password,
          ...(cpfDigits ? { cpfCnpj: cpfDigits } : {}),
        }),
      });

      if (!res.ok) {
        const message = await readApiErrorMessage(res, "Nao foi possivel criar a conta agora.");
        logClientEvent({
          event: "auth.register.failed",
          message: "Cadastro falhou",
          data: { email: email.trim(), name: name.trim(), status: res.status, error: message },
        });

        if (res.status === 409) {
          alert("Esse e-mail jÃ¡ estÃ¡ cadastrado.");
          return;
        }

        throw new Error(message);
      }

      alert("Conta criada. Enviamos um codigo para confirmar seu e-mail.");
      window.localStorage.setItem("conciliaai_name", name.trim());
      logClientEvent({
        event: "auth.register.success",
        message: "Cadastro realizado",
        data: { email: email.trim(), name: name.trim() },
      });

      navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao criar conta.";
      logClientEvent({
        event: "auth.register.error",
        message: "Erro no cadastro",
        data: { email: email.trim() || null, name: name.trim() || null, error: message },
      });
      alert(message);
    } finally {
      setLoading(false);
    }
  }

  const strengthLevel = useMemo(() => Math.min(3, Math.floor(password.length / 4)), [password]);
  const strengthColors = ["#EF4444", "#EAB308", "#22C55E"];

  return (
    <div className="auth-page">
      <div className="auth-v2-card stagger">
        <div className="auth-logo-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l5-5 4 3 8-8"/><path d="M16 7h4v4"/>
          </svg>
        </div>

        <h1 className="auth-h1">Criar conta</h1>
        <p className="auth-sub">Comece a organizar seu dinheiro em minutos.</p>

        <div className="auth-form">
          <div className="auth-field">
            <span>Como quer ser chamado?</span>
            <input
              className="auth-input"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

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
            <span>CPF <span style={{ color: "rgba(148,163,184,.6)", fontWeight: 400 }}>(opcional)</span></span>
            <input
              className="auth-input"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
              inputMode="numeric"
            />
          </div>

          <div className="auth-field">
            <span>Senha</span>
            <div className="auth-pw-wrapper">
              <input
                className="auth-input"
                type={showPassword ? "text" : "password"}
                placeholder="Crie uma senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <div className="auth-strength" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    background: i < strengthLevel
                      ? strengthColors[strengthLevel - 1]
                      : "rgba(148,163,184,.18)",
                  }}
                />
              ))}
            </div>
          </div>

          <button className="auth-btn-primary" type="button" onClick={handleRegister} disabled={loading}>
            {loading ? "Criando conta..." : "Criar conta"}
            {!loading && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            )}
          </button>
        </div>

        <p className="auth-foot-v2">Já tem conta? <Link to="/login">Entrar</Link></p>
        <p className="auth-credit-v2">Feito com ❤️ por vinnytecnologia</p>
      </div>
    </div>
  );
}




