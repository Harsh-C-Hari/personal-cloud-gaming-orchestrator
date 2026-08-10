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
import { ThemeProvider } from "./dashboard/ThemeContext.jsx";
import { colors, fonts } from "./dashboard/theme.js";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;700&display=swap');

  /* Multi-theme support (DESIGN_SYSTEM.md §8) — every background, ink,
     border, AND the brand accent vary per theme now (expanded from the
     original brand-only scope). Semantic status colors (success/warning/
     danger/info) and the 5 tag-accent colors stay literal hex in theme.js
     forever, identical across every theme — status meaning must not shift
     with the user's cosmetic choice. All 5 themes share the exact same
     lightness ladder (only hue lean + saturation differ), verified to
     preserve WCAG AA contrast (ink/inkDim/inkFaint against bg) in every
     theme, matching amber's own baseline. Default (unset [data-theme], or
     data-theme="amber") is the original amber theme, values unchanged
     from the original single-theme release. */
  :root {
    --color-brand: #E0A458;
    --color-brand-dim: rgba(224,164,88,0.14);
    --color-bg: #0B0B0D;
    --color-bg-elevated: #131316;
    --color-bg-card: #151517;
    --color-bg-card-hover: #1B1B1F;
    --color-bg-inset: #0E0E10;
    --color-ink: #EDEBE3;
    --color-ink-dim: #B9B7AE;
    --color-ink-faint: #7D7C77;
    --color-ink-ghost: #4A4A48;
    --color-border: rgba(237,235,227,0.12);
    --color-border-subtle: rgba(237,235,227,0.07);
    --color-border-strong: rgba(237,235,227,0.28);
    --color-border-ink: #EDEBE3;
  }

  [data-theme="verdant"] {
    --color-brand: #4FAE7E;
    --color-brand-dim: rgba(79,174,126,0.14);
    --color-bg: #0B0D0C;
    --color-bg-elevated: #121714;
    --color-bg-card: #151716;
    --color-bg-card-hover: #1A201D;
    --color-bg-inset: #0E100F;
    --color-ink: #E1EFE8;
    --color-ink-dim: #ACBBB3;
    --color-ink-faint: #767E7A;
    --color-ink-ghost: #484A49;
    --color-border: rgba(225,239,232,0.12);
    --color-border-subtle: rgba(225,239,232,0.07);
    --color-border-strong: rgba(225,239,232,0.28);
    --color-border-ink: #E1EFE8;
  }

  [data-theme="ember"] {
    --color-brand: #D97757;
    --color-brand-dim: rgba(217,119,87,0.14);
    --color-bg: #0D0B0B;
    --color-bg-elevated: #171412;
    --color-bg-card: #171515;
    --color-bg-card-hover: #201C1A;
    --color-bg-inset: #100E0E;
    --color-ink: #EFE5E1;
    --color-ink-dim: #BBB1AC;
    --color-ink-faint: #7E7876;
    --color-ink-ghost: #4A4848;
    --color-border: rgba(239,229,225,0.12);
    --color-border-subtle: rgba(239,229,225,0.07);
    --color-border-strong: rgba(239,229,225,0.28);
    --color-border-ink: #EFE5E1;
  }

  [data-theme="classic"] {
    --color-brand: #7EC8F2;
    --color-brand-dim: rgba(126,200,242,0.14);
    --color-bg: #0B0C0D;
    --color-bg-elevated: #121517;
    --color-bg-card: #151617;
    --color-bg-card-hover: #1A1D20;
    --color-bg-inset: #0E0F10;
    --color-ink: #E1E9EF;
    --color-ink-dim: #ACB5BB;
    --color-ink-faint: #767B7E;
    --color-ink-ghost: #48494A;
    --color-border: rgba(225,233,239,0.12);
    --color-border-subtle: rgba(225,233,239,0.07);
    --color-border-strong: rgba(225,233,239,0.28);
    --color-border-ink: #E1E9EF;
  }

  [data-theme="mono"] {
    --color-brand: #FFFFFF;
    --color-brand-dim: rgba(255,255,255,0.14);
    --color-bg: #0C0C0C;
    --color-bg-elevated: #141414;
    --color-bg-card: #161616;
    --color-bg-card-hover: #1D1D1D;
    --color-bg-inset: #0F0F0F;
    --color-ink: #E8E8E8;
    --color-ink-dim: #B3B3B3;
    --color-ink-faint: #7A7A7A;
    --color-ink-ghost: #494949;
    --color-border: rgba(232,232,232,0.12);
    --color-border-subtle: rgba(232,232,232,0.07);
    --color-border-strong: rgba(232,232,232,0.28);
    --color-border-ink: #E8E8E8;
  }

  [data-theme="oled"] {
    /* True pure black (#000000) and pure white (#FFFFFF) — the endpoints
       of the lightness range, pushed further than "mono" deliberately.
       On an actual OLED panel, #000000 pixels are fully off (max contrast,
       real power saving); "mono"'s softer near-black is NOT the same
       thing and stays as its own, separate, more moderate option. */
    --color-brand: #FFFFFF;
    --color-brand-dim: rgba(255,255,255,0.14);
    --color-bg: #000000;
    --color-bg-elevated: #0A0A0A;
    --color-bg-card: #0D0D0D;
    --color-bg-card-hover: #161616;
    --color-bg-inset: #050505;
    --color-ink: #FFFFFF;
    --color-ink-dim: #B8B8B8;
    --color-ink-faint: #7A7A7A;
    --color-ink-ghost: #464646;
    --color-border: rgba(255,255,255,0.12);
    --color-border-subtle: rgba(255,255,255,0.07);
    --color-border-strong: rgba(255,255,255,0.28);
    --color-border-ink: #FFFFFF;
  }

  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    background: ${colors.bg};
    color: ${colors.ink};
    font-family: ${fonts.body};
    font-weight: 500;
    min-height: 100vh;
    min-height: 100dvh;
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
  }

  input, select, button, textarea {
    font-family: ${fonts.body};
  }

  /* Tame number spinner */
  input[type=number]::-webkit-inner-spin-button,
  input[type=number]::-webkit-outer-spin-button { opacity: 0.3; }

  /* Dark select options */
  select option { background: ${colors.bgInset}; color: ${colors.ink}; }

  /* Thin scrollbars */
  /* Firefox */
  * {
      scrollbar-width: thin;
      scrollbar-color: ${colors.border} transparent;
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
      background: ${colors.border};
      border-radius: 999px;
  }

  *::-webkit-scrollbar-thumb:hover {
      background: ${colors.borderStrong};
  }

  *::-webkit-scrollbar-corner {
      background: transparent;
  }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${colors.border}; border-radius: 2px; }

  /* Shared animation keyframes referenced by multiple components */
  @keyframes badge-pulse {
    0%, 100% { opacity: 1;   }
    50%       { opacity: 0.3; }
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
