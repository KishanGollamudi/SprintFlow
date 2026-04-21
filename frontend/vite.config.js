import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",  // Fix sockjs-client "global is not defined" error
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // Proxy API requests to backend to avoid CORS during development
    // Normalize VITE_API_BASE_URL to remove any trailing '/api' so we don't end up
    // proxying '/api' -> 'http://host/api' (which would produce '/api/api/...').
    proxy: (() => {
      const raw = process.env?.VITE_API_BASE_URL || "http://localhost:8080";
      const normalized = raw.replace(/\/$/, "").replace(/\/api$/i, "");
      return {
        "/api": {
          target: normalized,
          changeOrigin: true,
          secure: false,
          ws: false,
        },
        "/ws": {
          target: normalized,
          changeOrigin: true,
          secure: false,
          ws: true,  // enable WebSocket proxying for SockJS
        },
      };
    })(),
  },
});
