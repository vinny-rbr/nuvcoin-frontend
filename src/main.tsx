import React from "react"; // Importa React
import ReactDOM from "react-dom/client"; // Render do React 18
import { BrowserRouter } from "react-router-dom"; // Provider do Router (obrigatório para rotas)
import App from "./App"; // Componente principal
import "./index.css"; // CSS global

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
