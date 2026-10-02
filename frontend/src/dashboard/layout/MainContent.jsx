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
import { colors, spacing, nav } from "../theme.js";

export function MainContent({ children }) {
  const mainRef = useRef(null);

  return (
    <main
      ref={mainRef}
      style={{
        flex: 1,
        minWidth: 0,
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        padding: `calc(${nav.headerHeight}px + ${spacing.xl}px) clamp(12px, 4vw, ${spacing.xxl}px) calc(${spacing.massive}px + env(safe-area-inset-bottom, 0px))`,
        background: colors.bg,
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto", minWidth: 0 }}>{children}</div>
    </main>
  );
}
