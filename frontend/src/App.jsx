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
import { Dashboard } from "./dashboard/Dashboard.jsx";
import { ToastProvider } from "./components/ui/Toast.jsx";
import { ConfirmDialogProvider } from "./components/ui/ConfirmDialog.jsx";
import { ErrorBoundary } from "./components/ui/ErrorBoundary.jsx";

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
  const loggedIn = isLoggedIn();

  // Keep the URL bar honest: "/login" should only ever be visible while
  // logged out, and logging in should never leave "/login" (or a blank
  // "/") sitting in the address bar.
  //
  // This runs synchronously here in the render body — NOT in a
  // useEffect — on purpose. Dashboard (and its useRoute hook) reads
  // window.location.pathname during ITS first render, which happens in
  // the same synchronous render pass as this component's first render,
  // before any effect has a chance to run. If this correction lived in
  // an effect, Dashboard could briefly (and, since replaceState doesn't
  // re-render anything, indefinitely) initialize its route from a stale
  // "/login" left over from before login/logout, showing a 404 for a
  // route that isn't real.
  const path = window.location.pathname;
  if (!loggedIn && path !== "/login") {
    window.history.replaceState(null, "", "/login");
  } else if (loggedIn && (path === "/login" || path === "/")) {
    window.history.replaceState(null, "", "/home");
  }

  return (
    <ToastProvider>
      <ConfirmDialogProvider>
        <style>{GLOBAL_CSS}</style>
        <ErrorBoundary>
          {loggedIn ? <Dashboard /> : <Login />}
        </ErrorBoundary>
      </ConfirmDialogProvider>
    </ToastProvider>
  );
}
