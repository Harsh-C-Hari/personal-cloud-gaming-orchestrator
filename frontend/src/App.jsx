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
    /* P7-T05: inkGhost lightened #4b4f52->#7b8286 to clear WCAG AA
       4.5:1 for real text (CC-3). Computed: 4.56:1 vs surface-l3
       (was ~2.15:1). Same hue/saturation family, lightness only. */
    --color-ink-ghost: #7b8286;
    --color-border: rgba(241,240,236,0.115);
    --color-border-subtle: rgba(241,240,236,0.065);
    --color-border-strong: rgba(241,240,236,0.25);
    --color-border-ink: #f1f0ec;

    /* L0-L4 surface elevation scale (D-008) - aliases of the 5 legacy
       background steps above, same values, ordered by lightness. See
       theme.js's surface export for the full L0-L4 documentation. */
    --surface-l0: #0a0b0d;
    --surface-l1: #0d0f13;
    --surface-l2: #101216;
    --surface-l3: #15181d;
    --surface-l4: #1b2027;
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
    /* P7-T05: inkGhost lightened #49544d->#75877b to clear WCAG AA
       4.5:1 for real text (CC-3). Computed: 4.59:1 vs surface-l3
       (was ~2.22:1). Same hue/saturation family, lightness only. */
    --color-ink-ghost: #75877b;
    --color-border: rgba(237,244,239,0.115);
    --color-border-subtle: rgba(237,244,239,0.065);
    --color-border-strong: rgba(237,244,239,0.25);
    --color-border-ink: #edf4ef;

    --surface-l0: #090d0b;
    --surface-l1: #0c120f;
    --surface-l2: #101713;
    --surface-l3: #141b17;
    --surface-l4: #1b2520;
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
    /* P7-T05: inkGhost lightened #554946->#8f7c77 to clear WCAG AA
       4.5:1 for real text (CC-3). Computed: 4.56:1 vs surface-l3
       (was ~2.08:1). Same hue/saturation family, lightness only. */
    --color-ink-ghost: #8f7c77;
    --color-border: rgba(245,235,231,0.115);
    --color-border-subtle: rgba(245,235,231,0.065);
    --color-border-strong: rgba(245,235,231,0.25);
    --color-border-ink: #f5ebe7;

    --surface-l0: #100b0a;
    --surface-l1: #120d0c;
    --surface-l2: #19110f;
    --surface-l3: #1c1513;
    --surface-l4: #271d19;
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
    /* P7-T05: inkGhost lightened #48545b->#738690 to clear WCAG AA
       4.5:1 for real text (CC-3). Computed: 4.59:1 vs surface-l3
       (was ~2.23:1). Same hue/saturation family, lightness only. */
    --color-ink-ghost: #738690;
    --color-border: rgba(237,244,247,0.115);
    --color-border-subtle: rgba(237,244,247,0.065);
    --color-border-strong: rgba(237,244,247,0.25);
    --color-border-ink: #edf4f7;

    --surface-l0: #090c0f;
    --surface-l1: #0b1116;
    --surface-l2: #10161b;
    --surface-l3: #141b21;
    --surface-l4: #1a242c;
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
    /* P7-T05: inkFaint lightened #7a7a78->#81817e to clear WCAG AA
       4.5:1 for real text (CC-4, mono-only borderline failure).
       Computed: 4.59:1 vs surface-l3 (was 4.17:1). */
    --color-ink-faint: #81817e;
    /* P7-T05: inkGhost lightened #494947->#81817d to clear WCAG AA
       4.5:1 for real text (CC-3). Computed: 4.58:1 vs surface-l3
       (was ~1.99:1). Same hue/saturation family, lightness only. */
    --color-ink-ghost: #81817d;
    --color-border: rgba(241,241,239,0.115);
    --color-border-subtle: rgba(241,241,239,0.065);
    --color-border-strong: rgba(241,241,239,0.25);
    --color-border-ink: #f1f1ef;

    --surface-l0: #0b0b0b;
    --surface-l1: #0f0f0f;
    --surface-l2: #121212;
    --surface-l3: #171717;
    --surface-l4: #202020;
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
    /* P7-T05: inkGhost lightened #484848->#7b7b7b to clear WCAG AA
       4.5:1 for real text (CC-3). Computed: 4.56:1 vs surface-l3
       (was ~2.11:1). Same hue family (neutral gray), lightness only. */
    --color-ink-ghost: #7b7b7b;
    --color-border: rgba(255,255,255,0.13);
    --color-border-subtle: rgba(255,255,255,0.07);
    --color-border-strong: rgba(255,255,255,0.28);
    --color-border-ink: #ffffff;

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
