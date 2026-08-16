# Frontend Visual QA Harness

**Validation-only.** Nothing in `frontend/src/` was changed to build this.
Not imported by production code, not part of the Vite build, not shipped.

## What it is

A Playwright script (`render.mjs`) that drives the *real* app — real
components, real CSS, real routing, real theme — against a live
`vite dev` server, and intercepts only the network calls that would
normally go to the FastAPI backend (`http://127.0.0.1:8100`), answering
them with representative fixture data (`fixtures/mock-data.js`).

Auth is bypassed the same way a browser would after a real login: by
planting the same `localStorage` keys `src/api/client.js` already reads
(`access_token`, `username`, `role`). No component was patched to make
this possible.

## Why this approach (vs. a real backend, vs. Storybook, vs. static screenshots)

- A real `host-agent` backend is heavier to stand up per QA session and
  couples visual review to backend state — good for final P8 regression,
  overkill for iterating on design.
- Storybook/component-isolation tools would mean re-hosting each page
  outside its real routing/layout/theme context — exactly what we don't
  want to review, since layout composition is a big part of what's being
  judged.
- Static screenshots (the old `assets/screenshots/`) go stale silently,
  as this project already learned the hard way (see `.ai/DECISIONS.md`
  D-001). A harness you can re-run any time a component changes doesn't
  have that failure mode.

## How to run it

```bash
cd frontend
npm install
npx playwright install chromium   # one-time, downloads a browser binary

# terminal 1
npm run dev

# terminal 2
node qa/render.mjs
```

Output: `qa/output/<page>__<state>__<viewport>.png` plus
`qa/output/manifest.json` listing every capture attempted and whether it
succeeded.

`playwright` itself is **not** added to `package.json` — see
`.ai/DECISIONS.md` D-006. Install it locally/ephemerally to run this,
or add it as a devDependency if the team wants this harness to become a
permanent, always-available tool (that's a real decision, not a default).

## Coverage rationale

States captured are `normal`, `empty`, `error`, `attention`, `active`,
`long` (data-driven, see `fixtures/mock-data.js`), plus `loading`
(network calls hang forever so the capture lands mid-skeleton). `disabled`
is not captured as a standalone state — it's an in-app interaction result
(e.g. a button while its own request is in flight) rather than a data
shape, and is better checked by hand during implementation review than
faked here.

Not every state applies to every page — applying all 7 states × all 11
pages × all 5 viewports (385 shots) would produce far more noise than
signal. The actual plan in `render.mjs` (`PLAN` array) applies:

- **`normal` at all 5 viewports**: only Home and Host Monitor (the two
  most layout-complex, most-visited pages — full responsive behavior
  matters most here).
- **`normal` at 1440 + 1024 + 768 + 390**: Analytics (dense data page,
  worth checking the tablet range too).
- **`normal` at 1440 + 390 (desktop + mobile spot check)**: every other
  page — sufficient to catch major responsive breakage without
  redundant middle-viewport captures of simpler layouts.
- **Non-`normal` states**: applied only where they're actually
  meaningful for that page (e.g. `active` for Host Monitor/Sunshine/Home
  session-running states; `long` for list-heavy pages like Logs, Session
  History, Recovery, Game Manager, Users; `attention` for pages with a
  warning/health concept).

If you need a capture this plan doesn't include, add an entry to `PLAN`
in `render.mjs` — it's a flat array, intentionally easy to extend.

## Known limitations

- The dev-server proxy in `vite.config.js` prefix-matches paths like
  `/host`, `/config` — navigating this harness by clicking sidebar
  buttons (not direct URL loads) avoids that trap. See
  `.ai/ARCHITECTURE.md` for detail.
- `loading` states are approximate — they capture "shortly after
  navigation, before any response," which is representative of a slow
  connection but not pixel-identical to every possible loading
  micro-state a page might have.
- This harness was authored and last verified against the code as of
  `.ai/CHANGELOG.md`'s P1 entry. If pages/routes/endpoints change,
  `fixtures/route-map.js` needs updating to match — it is hand-maintained
  against `src/api/client.js`, not auto-generated.
