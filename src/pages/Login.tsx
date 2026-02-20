import { useState } from "react"; // Hook para controlar estados (inputs)
import { Link, useNavigate } from "react-router-dom"; 
// Link -> navega sem recarregar
// useNavigate -> redireciona via código (ex: após login)

export default function Login() {
  const navigate = useNavigate(); 
  // Permite redirecionar o usuário para outra rota

  const [email, setEmail] = useState(""); 
  // Estado que guarda o e-mail digitado

  const [token, setToken] = useState(""); 
  // Estado que guarda o token digitado (mock/dev)

  function handleLogin() {
    // Função executada ao clicar no botão "Entrar"

    if (!email || !token) {
      // Valida se os campos estão preenchidos
      alert("Preencha email e token.");
      return; 
      // Para aqui se estiver vazio
    }

    localStorage.setItem("nuvcoin_email", email); 
    // Salva email (opcional, só pra mock)

    localStorage.setItem("nuvcoin_mock_token", token); 
    // ✅ ESSA é a chave que o ProtectedRoute procura:
    // isMockLoggedIn() -> localStorage.getItem("nuvcoin_mock_token")

    // Depois de salvar o token, manda pro Dashboard
    navigate("/dashboard"); 
    // ✅ Vai para a rota protegida
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
        }}
      >
        <h1 style={{ textAlign: "center" }}>Nuvcoin</h1>

        <p style={{ textAlign: "center", fontSize: 14 }}>
          Login (mock / dev-token)
        </p>

        <input
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)} 
          // Atualiza estado email
          style={{ padding: 10, borderRadius: 6, border: "none" }}
        />

        <input
          placeholder="Dev token (qualquer texto)"
          value={token}
          onChange={(e) => setToken(e.target.value)} 
          // Atualiza estado token
          style={{ padding: 10, borderRadius: 6, border: "none" }}
        />

        <button
          onClick={handleLogin} 
          // Ao clicar, executa login
          style={{
            padding: 10,
            borderRadius: 6,
            border: "none",
            backgroundColor: "#3b82f6",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
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

// =====================================================
// Desenvolvido por Lucas Vinicius
// lucassousa@gmail.com

// =====================================================
// Explicação adicional:
// - Antes: você salvava "nuvcoin_token", mas o ProtectedRoute procura "nuvcoin_mock_token".
// - Agora: salvamos "nuvcoin_mock_token" e redirecionamos para "/dashboard" após login.
// - Resultado: ao clicar Entrar → token existe → rota protegida libera o Dashboard.