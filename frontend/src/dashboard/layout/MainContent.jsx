/**
 * dashboard/layout/MainContent.jsx
 *
 * Scrollable content region. Just a styled <main> — kept as its own file
 * per the requested layout/ structure so DashboardLayout stays a pure
 * composition of Header + Sidebar + MobileHeader + MainContent.
 */

import { colors, spacing } from "../theme.js";

export function MainContent({ children }) {
  return (
    <main
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
  );
}
