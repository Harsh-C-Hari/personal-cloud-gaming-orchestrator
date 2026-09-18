/**
 * dashboard/layout/MainContent.jsx
 *
 * Scrollable content region. Just a styled <main> — kept as its own file
 * per the requested layout/ structure so DashboardLayout stays a pure
 * composition of Header + Sidebar + MobileHeader + MainContent.
 *
 * Phase 3 additions:
 *  - useRef on the <main> element, passed to createScopedLenis on mount.
 *  - ScrollContainerContext.Provider wraps the output so consumers (Phase 4
 *    list stagger, ScrollTrigger) can access the scroll container ref.
 *  - Lenis is destroyed on unmount (though MainContent never unmounts
 *    during a session — this is correctness hygiene for test/HMR).
 */
import { useEffect, useRef } from "react";
import { colors, spacing } from "../theme.js";
import { ScrollContainerContext } from "../../lib/motion/scrollContainerContext.jsx";
import { createScopedLenis } from "../../lib/motion/lenisSetup.js";
import { initMotion } from "../../lib/motion/gsapSetup.js";

export function MainContent({ children }) {
  const mainRef = useRef(null);

  useEffect(() => {
    let lenis = null;

    (async () => {
      await initMotion();
      lenis = await createScopedLenis(mainRef.current);
    })();

    return () => {
      lenis?.destroy();
    };
  }, []); // empty deps — run once on mount, destroy on unmount

  return (
    <ScrollContainerContext.Provider value={mainRef}>
      <main
        ref={mainRef}
        style={{
          flex: 1,
          minWidth: 0,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          padding: `${spacing.xl}px clamp(12px, 4vw, ${spacing.xxl}px) calc(${spacing.massive}px + env(safe-area-inset-bottom, 0px))`,
          background: colors.bg,
        }}
      >
        <div style={{ maxWidth: "1180px", margin: "0 auto", minWidth: 0 }}>{children}</div>
      </main>
    </ScrollContainerContext.Provider>
  );
}
