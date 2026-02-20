import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
// useNavigate permite redirecionar após criar conta

export default function Register() {
  const navigate = useNavigate(); 
  // Hook para redirecionamento

  const [email, setEmail] = useState(""); 
  // Guarda email digitado

  const [password, setPassword] = useState(""); 
  // Guarda senha digitada

  function handleRegister() {
    // Executado ao clicar em "Criar conta"

    if (!email || !password) {
      alert("Preencha email e senha.");
      return;
    }

    // Simulação de cadastro (mock)
    localStorage.setItem("nuvcoin_email", email);
    localStorage.setItem("nuvcoin_password_mock", password);

    alert("Conta criada com sucesso! Faça login.");

    // 🔥 Redireciona automaticamente para o Login
    navigate("/login");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0f172a",
        color: "white",
      }}
    >
      <div
        style={{
          backgroundColor: "#1e293b",
          padding: 40,
          borderRadius: 12,
          width: 320,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <h1 style={{ textAlign: "center" }}>Nuvcoin</h1>
        <p style={{ textAlign: "center", fontSize: 14 }}>Criar conta</p>

        <input
          placeholder="Seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, borderRadius: 6, border: "none" }}
        />

        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, borderRadius: 6, border: "none" }}
        />

        <button
          onClick={handleRegister}
          style={{
            padding: 10,
            borderRadius: 6,
            border: "none",
            backgroundColor: "#22c55e",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Criar conta
        </button>
      </div>
    </div>
  );
}
