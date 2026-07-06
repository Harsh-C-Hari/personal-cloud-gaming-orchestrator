/**
 * main.jsx
 *
 * Vite entry point. Mounts the React app into #root.
 * StrictMode is intentionally included — it double-invokes effects in dev
 * which stress-tests the WSClient connect/destroy lifecycle.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
