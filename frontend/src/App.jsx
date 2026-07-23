/**
 * App.jsx
 *
 * Root component. Injects global styles and renders Dashboard.
 * Kept intentionally thin — all layout lives in Dashboard.
 */

import {
    isLoggedIn,
} from "./api/client";
import Login from "./pages/Login";
import { Dashboard } from "./pages/Dashboard.jsx";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');

  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    background: #060810;
    color: #e2e8f0;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 500;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
  }

  input, select, button, textarea {
    font-family: 'Rajdhani', sans-serif;
  }

  /* Tame number spinner */
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { opacity: 0.3; }

  /* Dark select options */
  select option { background: #0f1117; color: #e2e8f0; }

  /* Thin scrollbars */
  /* Firefox */
  * {
      scrollbar-width: thin;
      scrollbar-color: #1c2130 transparent;
  }

  /* Chromium */
  *::-webkit-scrollbar {
      width: 6px;
      height: 6px;
  }

  *::-webkit-scrollbar-track {
      background: transparent;
  }

  *::-webkit-scrollbar-thumb {
      background: #1c2130;
      border-radius: 999px;
  }

  *::-webkit-scrollbar-thumb:hover {
      background: #334155;
  }

  *::-webkit-scrollbar-corner {
      background: transparent;
  }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1c2130; border-radius: 2px; }

  /* Shared animation keyframes referenced by multiple components */
  @keyframes badge-pulse {
    0%, 100% { opacity: 1;    transform: scale(1);   }
    50%       { opacity: 0.2; transform: scale(0.8); }
  }

  @keyframes card-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
`;

export default function App() {
  if (!isLoggedIn()) {
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <Login />
      </>
    );
  }
  
  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <Dashboard />
    </>
  );
}
