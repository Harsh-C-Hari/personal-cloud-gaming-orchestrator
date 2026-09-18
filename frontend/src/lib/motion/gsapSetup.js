/**
 * lib/motion/gsapSetup.js
 *
 * Single registration point for GSAP + ScrollTrigger. All consumers import
 * from here rather than from "gsap" directly.
 *
 * Pattern: lazy async init via initMotion(). Call once from the app root
 * before any animation code runs. Subsequent calls are no-ops (guarded by
 * a flag). Returns the {gsap, ScrollTrigger} pair for convenience.
 *
 * In test environments (isTestEnv()), initMotion() is a no-op and all
 * exports are lightweight stubs so call sites don't need individual guards.
 *
 * Usage:
 *   // At app boot (e.g., MainContent useEffect):
 *   await initMotion();
 *
 *   // In components:
 *   import { gsap, ScrollTrigger } from "../../lib/motion/gsapSetup.js";
 *   ScrollTrigger.refresh();
 */
import { isTestEnv } from "./isTestEnv.js";

// Stubs used in test environments and before initMotion() resolves.
const noop = () => {};
const noopTimeline = () => ({
  to: noopTimeline,
  from: noopTimeline,
  fromTo: noopTimeline,
  set: noopTimeline,
  add: noopTimeline,
  kill: noop,
  pause: noop,
  play: noop,
  reversed: () => false,
});

const GSAP_STUB = {
  to: noop,
  from: noop,
  set: noop,
  fromTo: noop,
  timeline: noopTimeline,
  ticker: { add: noop, remove: noop, lagSmoothing: noop },
  registerPlugin: noop,
  defaults: noop,
  killTweensOf: noop,
  getById: () => null,
  matchMedia: () => ({ add: noop, revert: noop }),
  context: (func) => {
    if (typeof func === 'function') {
      try { func(); } catch(e) {}
    }
    return { revert: noop };
  },
};

const ST_STUB = {
  create: () => ({ kill: noop }),
  refresh: noop,
  update: noop,
  getAll: () => [],
  kill: noop,
  batch: noop,
  addEventListener: noop,
  removeEventListener: noop,
};

let _gsap = GSAP_STUB;
let _ScrollTrigger = ST_STUB;
let _initialized = false;
let _initPromise = null;

/**
 * initMotion()
 *
 * Async-loads GSAP and ScrollTrigger, registers the plugin, and wires GSAP
 * defaults. Call once at app boot. Idempotent — safe to call multiple times.
 *
 * Returns {gsap, ScrollTrigger} after initialization.
 */
export async function initMotion() {
  if (isTestEnv()) return { gsap: _gsap, ScrollTrigger: _ScrollTrigger };
  if (_initialized) return { gsap: _gsap, ScrollTrigger: _ScrollTrigger };
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]);

    // Register once — GSAP ignores double-registration.
    gsap.registerPlugin(ScrollTrigger);

    _gsap = gsap;
    _ScrollTrigger = ScrollTrigger;
    _initialized = true;

    return { gsap: _gsap, ScrollTrigger: _ScrollTrigger };
  })();

  return _initPromise;
}

/**
 * Synchronous accessors — safe to call any time. Will return stubs if
 * initMotion() hasn't resolved yet (e.g., called at module parse time).
 * In practice, initMotion() is awaited before any animation code runs.
 */
export const gsap = new Proxy(GSAP_STUB, {
  get(target, prop) {
    return _gsap[prop] ?? target[prop];
  },
});

export const ScrollTrigger = new Proxy(ST_STUB, {
  get(target, prop) {
    return _ScrollTrigger[prop] ?? target[prop];
  },
});
