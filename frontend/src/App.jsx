import { isLoggedIn } from "./api/client";
import Login from "./pages/Login";
import { Dashboard } from "./dashboard/Dashboard.jsx";
import { ToastProvider } from "./components/ui/Toast.jsx";
import { ConfirmDialogProvider } from "./components/ui/ConfirmDialog.jsx";
import { ErrorBoundary } from "./components/ui/ErrorBoundary.jsx";

import { colors, fonts } from "./dashboard/theme.js";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

  /* Single monochrome theme — OLED values (P7-T05 WCAG-audited).
     All six prior theme blocks and the custom HSL-derive system have
     been removed. Status colors (success/warning/danger/info) are the
     only hue remaining in the application. */
  :root {
    --color-brand:          #ffffff;
    --color-brand-dim:      rgba(255,255,255,0.12);
    --color-bg:             #000000;
    --color-bg-elevated:    #080808;
    --color-bg-card:        #0e0e0e;
    --color-bg-card-hover:  #171717;
    --color-bg-inset:       #050505;
    --color-ink:            #ffffff;
    --color-ink-dim:        #bdbdbd;
    --color-ink-faint:      #7e7e7e;
    /* P7-T05: inkGhost lightened #484848->#7b7b7b to clear WCAG AA
       4.5:1 for real text (CC-3). Computed: 4.56:1 vs surface-l3
       (was ~2.11:1). Same hue family (neutral gray), lightness only. */
    --color-ink-ghost:      #7b7b7b;
    --color-border:         rgba(255,255,255,0.13);
    --color-border-subtle:  rgba(255,255,255,0.07);
    --color-border-strong:  rgba(255,255,255,0.28);
    --color-border-ink:     #ffffff;

    /* L0-L4 surface elevation scale — aliases of the background steps
       above, ordered by lightness. See theme.js's surface export. */
    --surface-l0: #000000;
    --surface-l1: #050505;
    --surface-l2: #080808;
    --surface-l3: #0e0e0e;
    --surface-l4: #171717;
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
    font-weight: 500;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    overflow: hidden;
  }

  button, input, select, textarea { font: inherit; }
  button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, [tabindex]:focus-visible {
    outline: 2px solid ${colors.brand};
    outline-offset: 2px;
  }
  input::placeholder, textarea::placeholder { color: ${colors.inkGhost}; }
  select option { background: ${colors.bgInset}; color: ${colors.ink}; }
  input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { opacity: 0.35; }

  * { scrollbar-width: thin; scrollbar-color: ${colors.border} transparent; }
  *::-webkit-scrollbar { width: 7px; height: 7px; }
  *::-webkit-scrollbar-track { background: transparent; }
  *::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 6px; }
  *::-webkit-scrollbar-thumb:hover { background: ${colors.borderStrong}; }

  @keyframes cgo-fade-up { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes cgo-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .42; } }
  @keyframes cgo-spin { to { transform: rotate(360deg); } }

  .pcgo-page-enter { animation: cgo-fade-up 220ms ease both; }
  .pcgo-eyebrow { color: ${colors.inkFaint}; font: 600 10px/1.2 ${fonts.mono}; letter-spacing: .14em; text-transform: uppercase; }
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
