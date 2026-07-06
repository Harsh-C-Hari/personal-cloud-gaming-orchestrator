/**
 * vite.config.js
 *
 * Dev server proxies /sessions, /games, /health, and /ws to the
 * FastAPI host-agent on :8000. This eliminates all CORS issues in dev.
 *
 * In production, put nginx (or any reverse proxy) in front of both
 * the Vite static build and the FastAPI server.
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    proxy: {
      "/sessions": { target: "http://localhost:8100", changeOrigin: true },
      "/games":    { target: "http://localhost:8100", changeOrigin: true },
      "/health":   { target: "http://localhost:8100", changeOrigin: true },
      "/saves":    { target: "http://127.0.0.1:8100", changeOrigin: true},
      "/ws": {
        target:       "ws://localhost:8100",
        ws:           true,
        changeOrigin: true,
      },
      "/host": {
        target: "http://127.0.0.1:8100",
        changeOrigin: true,
      },
      "/config": {
        target: "http://127.0.0.1:8100",
        changeOrigin: true,
      },

      "/admin": {
        target: "http://127.0.0.1:8100",
        changeOrigin: true,
      },

      "/system": {
        target: "http://127.0.0.1:8100",
        changeOrigin: true,
      },
    },
  },
});
