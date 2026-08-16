# ARCHITECTURE.md

## CURRENT ARCHITECTURE (verified by inspection)

### Stack
- React 19 + Vite 5, no TypeScript.
- No Tailwind usage in practice despite `tailwind.config.js`/`postcss.config.js`
  being present — component styling is done via inline JS style objects that
  reference `theme.js` tokens, plus a handful of hand-written CSS files
  (`GLOBAL_CSS` in `App.jsx`, `dashboard-shell.css`, `feature-page.css`).
  This is a real inconsistency to resolve in P1 (see DECISIONS.md D-003).
- Vitest + Testing Library for the 4 existing test files.
- ESLint configured, clean.

### Routing
- Custom pathname router (`src/dashboard/hooks/useRoute.js`) using
  `history.pushState`/`popstate`. No React Router. Clean URLs like
  `/home`, `/host-monitor`, `/settings`.
- **Gotcha verified during audit:** the Vite dev server proxy config
  (`vite.config.js`) proxies by string prefix (`/host`, `/config`, etc.)
  to the FastAPI backend on `127.0.0.1:8100`. A page route like
  `/host-monitor` starts with `/host` and gets incorrectly proxied on a
  hard refresh / direct navigation in dev, producing a connection error
  instead of the SPA shell. Client-side `navigate()` (pushState, no full
  reload) is unaffected. This is a dev-server-only footgun, not a
  production bug, but worth knowing when doing browser QA — always
  navigate via in-app clicks/links, not raw URL loads, when testing
  non-home routes against `vite dev`.

### Theming
- `src/dashboard/theme.js` — 6 built-in themes (amber/default, plus at
  least "mono", "oled", and others) as flat token objects: brand,
  brandDim, ink/inkDim (text), background layers, borders, semantic
  colors (success/warning/danger/info) kept independent of brand accent
  per good practice.
- `src/dashboard/theme-derive.js` — supports a derived custom palette via
  HSL rotation with WCAG contrast guarantees, for user-customizable theming
  beyond the 6 presets.
- `src/dashboard/ThemeContext.jsx` — React context distributing the active
  theme; persists selection (localStorage) and applies it as CSS custom
  properties / inline styles.
- Reduced-motion is respected globally (verified in `App.jsx` `GLOBAL_CSS`).

### Layout
- `src/dashboard/layout/DashboardLayout.jsx` — shell composing
  `Sidebar`, `DashboardHeader`, `MobileHeader`, `MainContent`.
- `Sidebar.jsx` — active nav item uses `colors.brandDim` background (a
  dim brand-tinted wash) + accent treatment, NOT a solid white pill —
  this contradicts the stale reference screenshots (see DECISIONS.md
  D-001).
- Mobile gets a distinct `MobileHeader.jsx`, not just a squeezed sidebar.

### Component layers
- `src/components/ui/primitives.jsx` (175 lines) — Button, Chip/Badge,
  Card-ish primitives. Chip supports both semantic tones (success/
  warning/danger/info) and accent tones, kept as separate token families.
  Hover/disabled/focus states and reduced-motion are all handled here,
  not ad hoc per page.
- `src/dashboard/components/*` — dashboard-specific composites:
  `ActiveAlerts`, `DashboardStats`, `EmptyState`, `LoadingState`,
  `NavigationCard`, `PageHeader`, `SectionCard`, `SessionSidebar`.
- `src/components/*` — feature components: `EventLog`, `SessionCard`,
  `SessionHistory`, `StartSessionForm`, etc. (not exhaustively enumerated
  in this pass — see CURRENT_TASK.md for what's pending review).
- `src/dashboard/pages/*` — one file per route (Home.jsx confirmed to
  exist and compose `DashboardStats`, `SessionSidebar`/event log, and a
  quick-navigation grid).

### Styling architecture reality
- `feature-page.css` (~1,200 lines) already encodes distinct visual
  "vocabulary" per page (Home = flagship hero treatment, Host Monitor =
  operational/diagnostic density, Users = identity-directory list style,
  etc.) — i.e. PLAN.md §34 "page personality" from the meta-prompt is
  **already partially implemented**, not a greenfield idea. P1+ work
  should extend/refine this existing vocabulary rather than replace it
  wholesale.
- Full responsive breakpoints are already present in this file.

### Data / logic layer (DO NOT TOUCH for visual work)
- `src/api/client.js` — all backend calls, `BASE_URL = "http://127.0.0.1:8100"`,
  JWT-based auth (`access_token` in localStorage), ~50 exported functions
  covering games, sessions, host status/metrics, recovery, sunshine,
  users, config, logs, tailscale.
- `src/hooks/useSessions.js` — polling (5s) + WS-driven session state,
  careful merge strategy documented inline (handles the fact that
  `stop_session` has no WS broadcast).
- `src/hooks/useWebSocket.js` + `src/websocket/websocket.js` — WS client
  wrapper.
- `src/dashboard/useSessionShell.js` — shared session+WS+event-log wiring
  used by both `AdminDashboard` and `UserDashboard`. Contains the
  reproducible `EventLog` crash's *cause* is actually in `EventLog.jsx`,
  not here — this file's `session_id` usages are all safe (`event.session_id`,
  optional-chained where needed).

## PROPOSED PREMIUM VISUAL ARCHITECTURE

Not yet decided in detail — depends on the chosen Design Direction
(see DECISIONS.md / P0 audit output). Structural proposal, independent of
which direction is picked:

```
DESIGN TOKENS        theme.js (extend, don't replace — already good bones)
      ↓
PRIMITIVES           primitives.jsx (extend with any new variants needed;
                      resolve the Tailwind-vs-inline-styles inconsistency
                      by picking ONE and documenting it in DECISIONS.md
                      before P2 starts)
      ↓
COMPOSITE COMPONENTS dashboard/components/* (extend existing, don't
                      duplicate — e.g. don't create a second "stat card"
                      component when DashboardStats.jsx exists)
      ↓
PAGE SECTIONS         feature-page.css vocabulary (extend per-page
                      personality, don't flatten it)
      ↓
PAGES                 dashboard/pages/*
```

Recommendation for P1: audit `tailwind.config.js` usage precisely (is it
used ANYWHERE, or dead weight?) and record the decision to either (a)
remove Tailwind entirely to stop the confusion, or (b) adopt it
properly for new component work going forward. Do not leave both
approaches half-used indefinitely.
