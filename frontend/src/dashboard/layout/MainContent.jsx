/**
 * dashboard/layout/MainContent.jsx
 *
 * Scrollable content region. Just a styled <main> — kept as its own file
 * per the requested layout/ structure so DashboardLayout stays a pure
 * composition of Header + Sidebar + MobileHeader + MainContent.
 */

import { colors } from "../theme.js";

export function MainContent({ children }) {
  return (
    <main
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "28px 32px 60px",
        background: colors.bg,
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>{children}</div>
    </main>
  );
}
