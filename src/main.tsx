import ReactDOM from "react-dom/client"; // Render do React 18
import { BrowserRouter } from "react-router-dom"; // Provider do Router (obrigatório para rotas)
import App from "./App"; // Componente principal
import { ensureAppDialog } from "./lib/appDialog";
import { installGlobalClientLogger } from "./lib/clientLogger";
import { registerServiceWorker } from "./lib/registerServiceWorker";
import "./index.css"; // CSS global

installGlobalClientLogger();
ensureAppDialog();
registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")!).render(
  // ✅ Removido StrictMode para evitar efeitos duplicados no DEV (React 18)
  // ✅ Isso impede o useEffect rodar 2x e disparar GET duplicado no /api/finance
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
