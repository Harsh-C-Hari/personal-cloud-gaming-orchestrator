import { isLoggedIn } from "./api/client";
import Login from "./pages/Login";
import { Dashboard } from "./dashboard/Dashboard.jsx";
import { ToastProvider } from "./components/ui/Toast.jsx";
import { ConfirmDialogProvider } from "./components/ui/ConfirmDialog.jsx";
import { ErrorBoundary } from "./components/ui/ErrorBoundary.jsx";

import { colors, fonts } from "./dashboard/theme.js";

const GLOBAL_CSS = `
  /* Single monochrome theme — OLED values (WCAG-audited).
     Status colors (success/warning/danger/info) are the only hue remaining. */
  :root {
    --color-brand:          #ffffff;
    --color-brand-dim:      rgba(255,255,255,0.12);
    --color-bg:             #000000;
    --color-bg-elevated:    #050505;
    --color-bg-card:        #080808;
    --color-bg-card-hover:  #0e0e0e;
    --color-bg-inset:       #030303;
    --color-ink:            #ffffff;
    --color-ink-dim:        #bdbdbd;
    /* 2.2: #949494 on #080808 (L3) = 6.2:1 (AA pass) */
    --color-ink-faint:      #949494;
    --color-ink-ghost:      #8a8a8a;
    --color-border:         rgba(255,255,255,0.13);
    --color-border-subtle:  rgba(255,255,255,0.07);
    --color-border-strong:  rgba(255,255,255,0.28);
    --color-border-ink:     #ffffff;
    /* 2.2: control borders — inputs, selects, toggles ≥ 3.41:1 */
    --color-border-control: rgba(255,255,255,0.40);

    /* L0-L4 surface elevation scale */
    --surface-l0: #000000;
    --surface-l1: #030303;
    --surface-l2: #050505;
    --surface-l3: #080808;
    --surface-l4: #0e0e0e;
  }

  *, *::before, *::after { box-sizing: border-box; }
  html { background: ${colors.bg}; }
  body {
    margin: 0;
    min-width: 320px;
    min-height: 100vh;
    min-height: 100dvh;
    background: ${colors.bg};
    color: ${colors.ink};
    font-family: ${fonts.body};
    /* 2.4: 400 weight; 500 was a template default */
    font-weight: 400;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    overflow: hidden;
  }

  button, input, select, textarea { font: inherit; }

  input::placeholder, textarea::placeholder { color: ${colors.inkGhost}; }
  select option { background: ${colors.bgInset}; color: ${colors.ink}; }
  input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { opacity: 0.35; }

  * { scrollbar-width: thin; scrollbar-color: ${colors.border} transparent; }
  *::-webkit-scrollbar { width: 7px; height: 7px; }
  *::-webkit-scrollbar-track { background: transparent; }
  *::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 6px; }
  *::-webkit-scrollbar-thumb:hover { background: ${colors.borderStrong}; }

  /* .pcgo-page-enter uses card-in defined in base.css */
  .pcgo-page-enter { animation: card-in 220ms ease both; }
  .pcgo-eyebrow { color: ${colors.inkFaint}; font: 500 12px/1.2 ${fonts.mono}; letter-spacing: 0; }
  .pcgo-mono { font-family: ${fonts.mono}; }
  .pcgo-muted { color: ${colors.inkFaint}; }
  .pcgo-status-dot { width: 7px; height: 7px; border-radius: 50%; flex: 0 0 auto; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
  }
`;

export default function App() {
  const loggedIn = isLoggedIn();
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
