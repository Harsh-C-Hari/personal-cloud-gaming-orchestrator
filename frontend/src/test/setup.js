/**
 * src/test/setup.js
 *
 * Runs once before every test file (see vite.config.js `test.setupFiles`).
 */

import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount React trees between tests so components don't leak state/timers.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

// jsdom's window.location.reload exists but throws "Not implemented:
// navigation (except hash changes)" when actually called. Several flows in
// this app call it on success (login, logout) — stub it so those code
// paths run cleanly in tests instead of failing on an unrelated jsdom gap.
Object.defineProperty(window, "location", {
  value: { ...window.location, reload: vi.fn(), href: window.location.href },
  writable: true,
});

// Vitest automatically sets import.meta.env.MODE to "test", which our
// lib/motion/isTestEnv.js reads to skip all GSAP/Lenis initialization.
// The stubs below are belt-and-suspenders: if any motion guard is bypassed,
// GSAP's ScrollTrigger (which uses ResizeObserver and IntersectionObserver
// internally) would fail in jsdom without these stubs.
if (typeof window.ResizeObserver === "undefined") {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof window.IntersectionObserver === "undefined") {
  window.IntersectionObserver = class IntersectionObserver {
    constructor(cb) { this._cb = cb; }
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
