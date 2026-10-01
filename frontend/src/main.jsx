/**
 * main.jsx
 *
 * Vite entry point. Mounts the React app into #root.
 * StrictMode is intentionally included — it double-invokes effects in dev
 * which stress-tests the WSClient connect/destroy lifecycle.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// 2.4: Self-hosted fonts — removes Google Fonts runtime dependency.
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "./styles/base.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
