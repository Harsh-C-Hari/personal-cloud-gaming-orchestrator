/**
 * qa/fixtures/route-map.js
 *
 * VALIDATION-ONLY. Maps each real backend route (from src/api/client.js —
 * kept in sync by hand; re-check against client.js if endpoints change)
 * to the mock-data builder that should answer it, for a given `state`.
 *
 * This is consumed by qa/render.js via Playwright's page.route(), which
 * intercepts network requests at the browser level. Nothing in
 * production source is imported, patched, or modified — the app talks to
 * the same BASE_URL ("http://127.0.0.1:8100") it always does; only the
 * QA browser session redirects those specific calls to fixture data.
 */
import * as data from "./mock-data.js";

// Order matters: first matching pattern wins. Put longer/more specific
// paths before shorter prefixes (e.g. "/sessions/analytics" before a
// hypothetical bare "/sessions").
export const ROUTES = [
  { pattern: /\/host\/status$/, build: data.hostStatus },
  { pattern: /\/host\/metrics$/, build: data.hostMetrics },
  { pattern: /\/host\/recovery-events/, build: data.recoveryEvents },
  { pattern: /\/host\/recovery-stats$/, build: data.recoveryStats },
  { pattern: /\/host\/tailscale\/status$/, build: data.tailscaleStatus },
  { pattern: /\/host\/sunshine\/history/, build: data.streamHistory },
  { pattern: /\/host\/sunshine\/stream$/, build: data.sunshineStream },
  { pattern: /\/host\/sunshine\/clients$/, build: data.sunshineClients },
  { pattern: /\/host\/user-status$/, build: data.userHostStatus },
  { pattern: /\/games\/list_games$/, build: data.games },
  { pattern: /\/games\/user_games$/, build: data.games },
  { pattern: /\/games\/reload$/, build: data.games },
  { pattern: /\/sessions\/active$/, build: data.activeSessions },
  { pattern: /\/sessions\/analytics$/, build: data.sessionAnalytics },
  { pattern: /\/sessions\/health$/, build: data.sessionHealth },
  { pattern: /\/sessions\/(my-)?history/, build: data.sessionHistory },
  { pattern: /\/sessions\/(my-)?events/, build: data.sessionEvents },
  { pattern: /\/auth\/users$/, build: data.users },
  { pattern: /\/config\/?$/, build: data.config },
  { pattern: /\/admin\/(my-)?logs/, build: data.logs },
  { pattern: /\/admin\/log-sessions$/, build: data.logSessions },
];

/**
 * Registers the interception on a Playwright `page` for the given state.
 * Endpoints not in ROUTES fall back to `{}` (200 OK, empty object) so
 * unmapped calls don't hang the page — extend ROUTES rather than relying
 * on that fallback for anything visually meaningful.
 *
 * When `state === "error"`, every mapped route (except ones passed in
 * `keepAliveFor`) responds 500, to exercise error UI. `keepAliveFor` lets
 * a specific page keep its shell data (e.g. host status) while only the
 * page's *own* primary data fails, matching a realistic partial-outage.
 */
export async function installMocks(page, state, { keepAliveFor = [] } = {}) {
  await page.route("http://127.0.0.1:8100/**", async (route) => {
    const url = route.request().url();
    const match = ROUTES.find((r) => r.pattern.test(url));

    if (!match) {
      return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    }

    const isKeptAlive = keepAliveFor.some((p) => p.test(url));
    const effectiveState = state === "error" && isKeptAlive ? "normal" : state;

    if (state === "error" && !isKeptAlive) {
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Simulated failure for QA error-state render." }),
      });
    }

    if (state === "loading") {
      // Never resolves within the QA capture window — caller takes the
      // screenshot shortly after navigation while this is still pending.
      await new Promise(() => {});
    }

    const body = JSON.stringify(match.build(effectiveState));
    return route.fulfill({ status: 200, contentType: "application/json", body });
  });
}
