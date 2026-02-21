export {};

declare global {
  interface WindowEventMap {
    nuvcoin_finance_updated: Event;
  }
}

/*
Desenvolvido por Lucas Vinicius
lucassousa@gmail.com

// Esse arquivo tipa o evento customizado do Nuvcoin:
// window.addEventListener("nuvcoin_finance_updated", ...)
// Assim o VS Code para de marcar como erro.
*/
