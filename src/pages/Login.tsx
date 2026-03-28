import { useState } from "react"; // Hook para controlar estados (inputs)
import { Link, useNavigate } from "react-router-dom"; // Link + navegação
import { deriveSubscriptionActiveFromAuthData, persistSubscriptionState } from "../lib/auth";

export default function Login() {
  const navigate = useNavigate(); // Permite redirecionar o usuário para outra rota

  const [email, setEmail] = useState(""); // Estado que guarda o e-mail digitado
  const [password, setPassword] = useState(""); // Estado que guarda a senha digitada
  const [loading, setLoading] = useState(false); // Estado de carregamento

  async function handleLogin() {
    // Função executada ao clicar no botão "Entrar"

    if (!email) {
      // Valida se o e-mail foi preenchido
      alert("Preencha o e-mail."); // Mostra alerta
      return; // Para aqui se estiver vazio
    }

    try {
      setLoading(true); // Ativa loading

      // =========================
      // ✅ Chama backend pra gerar JWT válido
      // =========================

      const res = await fetch("/api/auth/login", {
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
        // Se backend retornar erro, informa credenciais inválidas
        alert("Email ou senha inválidos");
        return;
      }

      const data = (await res.json()) as {
        token: string;
        userId: string;
        name: string;
        email: string;
        subscriptionActive?: boolean | string;
        hasActiveSubscription?: boolean | string;
        isSubscriptionActive?: boolean | string;
        subscriptionStatus?: string;
        planStatus?: string;
        isActive?: boolean | string;
      };

      if (!data.token) {
        // Se não vier token, não dá pra continuar
        throw new Error("Login falhou: token não retornou.");
      }

      // =========================
      // ✅ Chaves oficiais do app
      // =========================

      localStorage.setItem("auth", "true"); // Marca como logado (compatível com ProtectedRoute)
      localStorage.setItem("token", data.token); // ✅ JWT real (compatível com financeServices)

      // =========================
      // ✅ Chaves específicas do Nuvcoin
      // =========================

      localStorage.setItem("nuvcoin_email", data.email); // Email
      localStorage.setItem("nuvcoin_userId", data.userId); // UserId
      localStorage.setItem("nuvcoin_name", data.name ?? ""); // Nome
      persistSubscriptionState(deriveSubscriptionActiveFromAuthData(data)); // Estado da assinatura

      // Depois de salvar, manda pro Dashboard
      navigate("/dashboard"); // Vai para a rota protegida
    } catch (err: any) {
      alert(err?.message ?? "Erro ao logar."); // Mostra erro pro usuário
    } finally {
      setLoading(false); // Desativa loading
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh", // Ocupa altura total da tela
        display: "flex", // Usa flexbox
        justifyContent: "center", // Centraliza horizontalmente
        alignItems: "center", // Centraliza verticalmente
        backgroundColor: "#0f172a", // Fundo escuro
        color: "white", // Texto branco
      }}
    >
      <div
        style={{
          backgroundColor: "#1e293b", // Card escuro
          padding: 40, // Espaçamento interno
          borderRadius: 12, // Bordas arredondadas
          width: 340, // Largura fixa do card
          display: "flex", // Flex
          flexDirection: "column", // Itens em coluna
          gap: 16, // Espaço entre elementos
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)", // Sombra premium
        }}
      >
        <h1 style={{ textAlign: "center" }}>Nuvcoin</h1>

        <p style={{ textAlign: "center", fontSize: 14, opacity: 0.85 }}>
          Login (JWT real / API)
        </p>

        <input
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)} // Atualiza estado email
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #334155",
            backgroundColor: "#0b1220",
            color: "white",
            outline: "none",
          }}
        />

        <input
          type="password"
          placeholder="Sua senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)} // Atualiza estado password
          style={{
            padding: 10,
            borderRadius: 8,
            border: "1px solid #334155",
            backgroundColor: "#0b1220",
            color: "white",
            outline: "none",
          }}
        />

        <button
          onClick={handleLogin} // Ao clicar, executa login
          disabled={loading} // Desabilita enquanto carrega
          style={{
            padding: 10,
            borderRadius: 10,
            border: "none",
            backgroundColor: loading ? "#64748b" : "#3b82f6",
            color: "white",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <p style={{ textAlign: "center", fontSize: 14 }}>
          Não tem conta?{" "}
          <Link to="/register" style={{ color: "#60a5fa" }}>
            Criar conta
          </Link>
        </p>
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

✔ Removido login por "dev token"
✔ Agora chama POST /api/auth/token
✔ Salva JWT real em localStorage.setItem("token", jwt)
✔ Mantém "auth=true" para continuar compatível com ProtectedRoute
✔ Salva dados úteis: nuvcoin_email, nuvcoin_userId, nuvcoin_name
*/
