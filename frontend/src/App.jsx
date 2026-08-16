import { isLoggedIn } from "./api/client";
import Login from "./pages/Login";
import { Dashboard } from "./dashboard/Dashboard.jsx";
import { ToastProvider } from "./components/ui/Toast.jsx";
import { ConfirmDialogProvider } from "./components/ui/ConfirmDialog.jsx";
import { ErrorBoundary } from "./components/ui/ErrorBoundary.jsx";
import { ThemeProvider } from "./dashboard/ThemeContext.jsx";
import { colors, fonts } from "./dashboard/theme.js";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

  :root {
    --color-brand: #E8B66C;
    --color-brand-dim: rgba(232,182,108,0.12);
    --color-bg: #0a0b0d;
    --color-bg-elevated: #101216;
    --color-bg-card: #15181d;
    --color-bg-card-hover: #1b2027;
    --color-bg-inset: #0d0f13;
    --color-ink: #f1f0ec;
    --color-ink-dim: #b8b9b6;
    --color-ink-faint: #7d8180;
    --color-ink-ghost: #4b4f52;
    --color-border: rgba(241,240,236,0.115);
    --color-border-subtle: rgba(241,240,236,0.065);
    --color-border-strong: rgba(241,240,236,0.25);
    --color-border-ink: #f1f0ec;
  }

  [data-theme="verdant"] {
    --color-brand: #77c99a;
    --color-brand-dim: rgba(119,201,154,0.12);
    --color-bg: #090d0b;
    --color-bg-elevated: #101713;
    --color-bg-card: #141b17;
    --color-bg-card-hover: #1b2520;
    --color-bg-inset: #0c120f;
    --color-ink: #edf4ef;
    --color-ink-dim: #b4c3b9;
    --color-ink-faint: #7d8a82;
    --color-ink-ghost: #49544d;
    --color-border: rgba(237,244,239,0.115);
    --color-border-subtle: rgba(237,244,239,0.065);
    --color-border-strong: rgba(237,244,239,0.25);
    --color-border-ink: #edf4ef;
  }

  [data-theme="ember"] {
    --color-brand: #e9936f;
    --color-brand-dim: rgba(233,147,111,0.12);
    --color-bg: #100b0a;
    --color-bg-elevated: #19110f;
    --color-bg-card: #1c1513;
    --color-bg-card-hover: #271d19;
    --color-bg-inset: #120d0c;
    --color-ink: #f5ebe7;
    --color-ink-dim: #c3b5af;
    --color-ink-faint: #8d7e79;
    --color-ink-ghost: #554946;
    --color-border: rgba(245,235,231,0.115);
    --color-border-subtle: rgba(245,235,231,0.065);
    --color-border-strong: rgba(245,235,231,0.25);
    --color-border-ink: #f5ebe7;
  }

  [data-theme="classic"] {
    --color-brand: #8dc8e6;
    --color-brand-dim: rgba(141,200,230,0.12);
    --color-bg: #090c0f;
    --color-bg-elevated: #10161b;
    --color-bg-card: #141b21;
    --color-bg-card-hover: #1a242c;
    --color-bg-inset: #0b1116;
    --color-ink: #edf4f7;
    --color-ink-dim: #b4c2c9;
    --color-ink-faint: #7e8b92;
    --color-ink-ghost: #48545b;
    --color-border: rgba(237,244,247,0.115);
    --color-border-subtle: rgba(237,244,247,0.065);
    --color-border-strong: rgba(237,244,247,0.25);
    --color-border-ink: #edf4f7;
  }

  [data-theme="mono"] {
    --color-brand: #f4f4f2;
    --color-brand-dim: rgba(244,244,242,0.12);
    --color-bg: #0b0b0b;
    --color-bg-elevated: #121212;
    --color-bg-card: #171717;
    --color-bg-card-hover: #202020;
    --color-bg-inset: #0f0f0f;
    --color-ink: #f1f1ef;
    --color-ink-dim: #b8b8b6;
    --color-ink-faint: #7a7a78;
    --color-ink-ghost: #494947;
    --color-border: rgba(241,241,239,0.115);
    --color-border-subtle: rgba(241,241,239,0.065);
    --color-border-strong: rgba(241,241,239,0.25);
    --color-border-ink: #f1f1ef;
  }

  [data-theme="oled"] {
    --color-brand: #ffffff;
    --color-brand-dim: rgba(255,255,255,0.12);
    --color-bg: #000000;
    --color-bg-elevated: #080808;
    --color-bg-card: #0e0e0e;
    --color-bg-card-hover: #171717;
    --color-bg-inset: #050505;
    --color-ink: #ffffff;
    --color-ink-dim: #bdbdbd;
    --color-ink-faint: #7e7e7e;
    --color-ink-ghost: #484848;
    --color-border: rgba(255,255,255,0.13);
    --color-border-subtle: rgba(255,255,255,0.07);
    --color-border-strong: rgba(255,255,255,0.28);
    --color-border-ink: #ffffff;
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
    <ThemeProvider>
      <ToastProvider>
        <ConfirmDialogProvider>
          <style>{GLOBAL_CSS}</style>
          <ErrorBoundary>
            {loggedIn ? <Dashboard /> : <Login />}
          </ErrorBoundary>
        </ConfirmDialogProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
