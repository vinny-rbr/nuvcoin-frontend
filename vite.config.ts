import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173, // Porta do frontend
    proxy: {
      "/api": {
        target: "http://localhost:5024", // ✅ Sua API .NET
        changeOrigin: true,
        secure: false,
      },
    },
  },
});