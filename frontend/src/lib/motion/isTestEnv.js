/**
 * lib/motion/isTestEnv.js
 *
 * Returns true when code is running inside Vitest (or any environment where
 * `window` does not exist). All GSAP/Lenis entry points guard against this
 * so that the test suite (which uses jsdom) never tries to run animation
 * code that requires a real layout engine.
 *
 * Vitest sets import.meta.env.MODE to "test" automatically — no config
 * change needed. The `typeof window === "undefined"` branch covers SSR or
 * any other headless context.
 */
export function isTestEnv() {
  return (
    typeof window === "undefined" ||
    (typeof import.meta !== "undefined" &&
      import.meta.env?.MODE === "test")
  );
}
