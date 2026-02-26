import React from "react"; // Importa React
import ReactDOM from "react-dom/client"; // Render do React 18
import { BrowserRouter } from "react-router-dom"; // Provider do Router (obrigatório para rotas)
import App from "./App"; // Componente principal
import "./index.css"; // CSS global

ReactDOM.createRoot(document.getElementById("root")!).render(
  // ✅ Removido StrictMode para evitar efeitos duplicados no DEV (React 18)
  // ✅ Isso impede o useEffect rodar 2x e disparar GET duplicado no /api/finance
  <BrowserRouter>
    <App />
  </BrowserRouter>
);