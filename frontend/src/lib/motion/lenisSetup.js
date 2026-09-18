/**
 * lib/motion/lenisSetup.js
 *
 * Factory for creating a Lenis smooth-scroll instance scoped to a specific
 * DOM wrapper element (the `<main>` in MainContent and Login). Returns null
 * in test environments or when the user prefers reduced motion.
 *
 * Usage:
 *   const lenis = await createScopedLenis(wrapperEl);
 *   // on unmount:
 *   lenis?.destroy();
 *
 * The `wrapperEl` is the scrolling container (the element with overflow-y).
 * Lenis reads the scroll from this element rather than from window.
 *
 * GSAP ticker integration: Lenis's tick is wired into GSAP's RAF loop so
 * that GSAP ScrollTrigger and smooth scroll stay in sync with a single
 * requestAnimationFrame per frame.
 */
import { isTestEnv } from "./isTestEnv.js";
import { prefersReducedMotion } from "./reducedMotion.js";
import { initMotion } from "./gsapSetup.js";

export async function createScopedLenis(wrapperEl) {
  if (isTestEnv()) return null;
  if (prefersReducedMotion()) return null;
  if (!wrapperEl) return null;

  // Ensure GSAP is initialized (idempotent).
  const { gsap, ScrollTrigger } = await initMotion();

  const { Lenis } = await import("lenis");

  const lenis = new Lenis({
    wrapper: wrapperEl,
    content: wrapperEl,
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    touchMultiplier: 2,
    infinite: false,
  });

  // Wire Lenis scroll events into ScrollTrigger so it stays in sync.
  lenis.on("scroll", ScrollTrigger.update);

  // Use GSAP's ticker so Lenis and GSAP share a single RAF frame.
  function onTick(time) {
    lenis.raf(time * 1000); // GSAP time is in seconds; Lenis expects ms
  }
  gsap.ticker.add(onTick);
  gsap.ticker.lagSmoothing(0); // Prevent frame-lag compensation from
                               // causing a jerk when the tab regains focus.

  // Patch destroy() to also remove the GSAP ticker subscription.
  const originalDestroy = lenis.destroy.bind(lenis);
  lenis.destroy = () => {
    gsap.ticker.remove(onTick);
    originalDestroy();
  };

  return lenis;
}
