import { useState } from "react"; // Hook para controlar estados (inputs)
import { Link, useNavigate } from "react-router-dom"; // Link (navega sem reload) + useNavigate (redireciona via código)

export default function Login() {
  const navigate = useNavigate(); // Permite redirecionar o usuário para outra rota

  const [email, setEmail] = useState(""); // Estado que guarda o e-mail digitado
  const [token, setToken] = useState(""); // Estado que guarda o token digitado (mock/dev)

  function handleLogin() {
    // Função executada ao clicar no botão "Entrar"

    if (!email || !token) {
      // Valida se os campos estão preenchidos
      alert("Preencha email e token."); // Mostra alerta
      return; // Para aqui se estiver vazio
    }

    // =========================
    // ✅ Chaves oficiais do mock
    // =========================

    localStorage.setItem("auth", "true"); // ✅ Marca como logado (compatível com ProtectedRoute)
    localStorage.setItem("token", token); // ✅ Salva um token genérico (compatível com ProtectedRoute)

    // =========================
    // ✅ Chaves específicas do Nuvcoin
    // =========================

    localStorage.setItem("nuvcoin_email", email); // Salva email (mock)
    localStorage.setItem("nuvcoin_mock_token", token); // Salva token mock (se você quiser usar depois)

    // Depois de salvar, manda pro Dashboard
    navigate("/dashboard"); // ✅ Vai para a rota protegida
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
          width: 320, // Largura fixa do card
          display: "flex", // Flex
          flexDirection: "column", // Itens em coluna
          gap: 16, // Espaço entre elementos
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)", // Sombra premium
        }}
      >
        <h1 style={{ textAlign: "center" }}>Nuvcoin</h1>

        <p style={{ textAlign: "center", fontSize: 14, opacity: 0.85 }}>
          Login (mock / dev-token)
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
          placeholder="Dev token (qualquer texto)"
          value={token}
          onChange={(e) => setToken(e.target.value)} // Atualiza estado token
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
          style={{
            padding: 10,
            borderRadius: 10,
            border: "none",
            backgroundColor: "#3b82f6",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")} // Hover simples
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")} // Volta ao normal
        >
          Entrar
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
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com

// O que foi ajustado:
// - Agora salvamos "auth=true" e "token", que o ProtectedRoute aceita
// - Mantivemos as chaves específicas do Nuvcoin ("nuvcoin_email" e "nuvcoin_mock_token")
// - Resultado: clicar Entrar -> libera /dashboard e renderiza Layout + Dashboard
*/