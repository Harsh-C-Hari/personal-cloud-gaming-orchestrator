/**
 * qa/render.mjs
 *
 * VALIDATION-ONLY VISUAL QA HARNESS. Not part of the production build —
 * not referenced by any src/ file, not bundled by Vite, no production
 * code was modified to make this work. It drives the REAL app (real
 * components, real CSS, real routing, real theme system) against a live
 * `vite dev` server, intercepting only the network calls to the backend
 * (http://127.0.0.1:8100) with representative fixture data from
 * qa/fixtures/. Auth is bypassed the same way a real browser would after
 * a real login (planting the same localStorage keys client.js reads),
 * not by patching any component.
 *
 * USAGE
 *   1. In one terminal:  npm run dev            (serves on :5173)
 *   2. In another:       npm run qa:render      (see package.json note
 *                         below — or run directly: node qa/render.mjs)
 *
 * Requires `playwright` (with the chromium browser installed via
 * `npx playwright install chromium`). This is a QA-only devDependency —
 * intentionally NOT added to package.json without an explicit decision
 * (see .ai/DECISIONS.md D-006) to avoid silently expanding production
 * dependencies during a validation task.
 *
 * OUTPUT
 *   qa/output/<page>__<state>__<viewport>.png
 *   qa/output/manifest.json  (what was captured, for the review report)
 */
import { chromium } from "playwright";
import { installMocks } from "./fixtures/route-map.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "output");
mkdirSync(OUT_DIR, { recursive: true });

const APP_URL = process.env.QA_APP_URL || "http://127.0.0.1:5173";

const VIEWPORTS = {
  "1440": { width: 1440, height: 900 },
  "1024": { width: 1024, height: 900 },
  "768": { width: 768, height: 1000 },
  "390": { width: 390, height: 844 },
  "360": { width: 360, height: 780 },
};

// Sidebar button labels (admin role) — see src/dashboard/AdminDashboard.jsx
// NAV_ITEMS. Clicking, not URL navigation, because the dev-server proxy
// prefix-matches "/host*", "/config*" etc and will otherwise intercept
// direct loads of e.g. "/host-monitor"-shaped URLs (see .ai/ARCHITECTURE.md).
const NAV_LABEL = {
  home: "Home",
  monitor: "Host Monitor",
  recovery: "Recovery",
  streams: "Sunshine",
  "game-manager": "Game Manager",
  users: "User Management",
  analytics: "Analytics",
  history: "Session History",
  logs: "Logs",
  settings: "Settings",
};

/**
 * One entry per (page, state) capture we actually want. `viewports`
 * defaults to ["1440", "390"] (desktop + mobile spot check) unless
 * overridden — a handful of pages get the full 5-viewport sweep (see
 * qa/README.md "Coverage rationale").
 */
const FULL_PLAN = [
  // ── Home ────────────────────────────────────────────────────────────
  { page: "home", state: "normal", viewports: ["1440", "1024", "768", "390", "360"] },
  { page: "home", state: "attention", viewports: ["1440", "390"] },
  { page: "home", state: "active", viewports: ["1440"] },
  { page: "home", state: "empty", viewports: ["1440"] },
  { page: "home", state: "loading", viewports: ["1440"] },
  { page: "home", state: "error", viewports: ["1440"] },

  // ── Host Monitor ────────────────────────────────────────────────────
  { page: "monitor", state: "normal", viewports: ["1440", "1024", "768", "390"] },
  { page: "monitor", state: "attention", viewports: ["1440", "390"] },
  { page: "monitor", state: "active", viewports: ["1440"] },
  { page: "monitor", state: "error", viewports: ["1440"] },

  // ── Recovery ────────────────────────────────────────────────────────
  { page: "recovery", state: "normal", viewports: ["1440", "390"] },
  { page: "recovery", state: "empty", viewports: ["1440"] },
  { page: "recovery", state: "long", viewports: ["1440"] },
  { page: "recovery", state: "attention", viewports: ["1440"] },

  // ── Sunshine ────────────────────────────────────────────────────────
  { page: "streams", state: "normal", viewports: ["1440", "390"] },
  { page: "streams", state: "active", viewports: ["1440"] },
  { page: "streams", state: "empty", viewports: ["1440"] },

  // ── Game Manager ────────────────────────────────────────────────────
  { page: "game-manager", state: "normal", viewports: ["1440", "390"] },
  { page: "game-manager", state: "empty", viewports: ["1440"] },
  { page: "game-manager", state: "long", viewports: ["1440"] },

  // ── User Management ─────────────────────────────────────────────────
  { page: "users", state: "normal", viewports: ["1440", "390"] },
  { page: "users", state: "long", viewports: ["1440"] },

  // ── Analytics ───────────────────────────────────────────────────────
  { page: "analytics", state: "normal", viewports: ["1440", "1024", "768", "390"] },
  { page: "analytics", state: "empty", viewports: ["1440"] },
  { page: "analytics", state: "loading", viewports: ["1440"] },

  // ── Session History ─────────────────────────────────────────────────
  { page: "history", state: "normal", viewports: ["1440", "390"] },
  { page: "history", state: "empty", viewports: ["1440"] },
  { page: "history", state: "long", viewports: ["1440"] },

  // ── Logs ────────────────────────────────────────────────────────────
  { page: "logs", state: "normal", viewports: ["1440", "390"] },
  { page: "logs", state: "empty", viewports: ["1440"] },
  { page: "logs", state: "long", viewports: ["1440"] },

  // ── Settings ────────────────────────────────────────────────────────
  { page: "settings", state: "normal", viewports: ["1440", "390"] },

  // ── Change Password (reached via Settings → "Change password") ─────
  { page: "change-password", state: "normal", viewports: ["1440", "390"] },
];

// Allow resuming a partial run: QA_SKIP="home,monitor" skips already-done
// (page) groups entirely; QA_ONLY restricts to a comma list of pages.
const skip = new Set((process.env.QA_SKIP || "").split(",").filter(Boolean));
const only = new Set((process.env.QA_ONLY || "").split(",").filter(Boolean));
const PLAN = FULL_PLAN.filter((e) => {
  if (skip.has(e.page)) return false;
  if (only.size && !only.has(e.page)) return false;
  return true;
});

async function gotoPage(page, targetRoute) {
  if (targetRoute === "change-password") {
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.waitForTimeout(300);
    await page.getByText("Change password", { exact: false }).click();
    return;
  }
  const label = NAV_LABEL[targetRoute];
  await page.getByRole("button", { name: label, exact: true }).click();
}

async function run() {
  const browser = await chromium.launch();
  const manifest = [];

  for (const entry of PLAN) {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      localStorage.setItem("access_token", "qa.fake.token");
      localStorage.setItem("username", "admin");
      localStorage.setItem("role", "admin");
      // WORKAROUND for a verified production bug (.ai/DECISIONS.md D-004):
      // EventLog.jsx reads `latest.session_id` unguarded in a useEffect
      // dependency array, where `latest = events[0]`. On a genuinely fresh
      // browser (no cached "pcgo_ws_events"), the FIRST render always has
      // events=[] before any fetch can resolve, so `latest` is undefined
      // and the app crashes to the global ErrorBoundary on every single
      // load — not an edge case, the default experience for any new
      // session. Without this seed, NOTHING beyond the crash card can be
      // captured. This is a QA-harness-only workaround (localStorage seed,
      // same mechanism a real returning user's browser would already
      // have) — no production source file was modified.
      localStorage.setItem("pcgo_ws_events", JSON.stringify([
        { type: "session_status", session_id: "seed-0000", user_id: "admin", game_id: "notepad_test",
          status: "completed", message: "Session completed", ts: "12:00:00 PM", date: "Aug 16" },
      ]));
    });
    const page = await context.newPage();
    await installMocks(page, entry.state);

    // Loading-state captures intentionally hang forever (see route-map.js)
    // — don't waitUntil networkidle for those, use a short fixed wait.
    const isLoading = entry.state === "loading";

    await page.setViewportSize(VIEWPORTS[entry.viewports[0]]);
    await page.goto(APP_URL + "/home", {
      waitUntil: isLoading ? "domcontentloaded" : "networkidle",
      timeout: 15000,
    }).catch(() => {});

    if (entry.page !== "home") {
      await gotoPage(page, entry.page).catch((e) =>
        console.warn(`nav click failed for ${entry.page}: ${e.message}`)
      );
      await page.waitForTimeout(isLoading ? 250 : 500);
    } else if (isLoading) {
      await page.waitForTimeout(250);
    }

    for (const vp of entry.viewports) {
      await page.setViewportSize(VIEWPORTS[vp]);
      await page.waitForTimeout(200);
      const filename = `${entry.page}__${entry.state}__${vp}.png`;
      const filepath = path.join(OUT_DIR, filename);
      try {
        await page.screenshot({ path: filepath, timeout: 8000 });
        manifest.push({ ...entry, viewport: vp, file: filename, ok: true });
        console.log(`✓ ${filename}`);
      } catch (e) {
        manifest.push({ ...entry, viewport: vp, file: filename, ok: false, error: e.message });
        console.warn(`✗ ${filename}: ${e.message}`);
      }
    }

    await context.close();
  }

  writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  await browser.close();
  console.log(`\nDone. ${manifest.filter((m) => m.ok).length}/${manifest.length} captures succeeded.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
