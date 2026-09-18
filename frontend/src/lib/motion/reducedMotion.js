/**
 * lib/motion/reducedMotion.js
 *
 * Returns true when the user has requested reduced motion via the OS or
 * browser "prefers-reduced-motion: reduce" media query.
 *
 * Every animation entry point calls this before starting a timeline or
 * tween. When true, skip ALL motion — render elements at their final state
 * with gsap.set() if needed, or simply don't create the timeline.
 *
 * Note: `matchMedia` may not exist in jsdom — the `isTestEnv` guard
 * should normally prevent this from being called in tests, but a
 * defensive `window.matchMedia?.()` call is used just in case.
 */
export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}
