/**
 * dashboard/layout/DashboardLayout.jsx
 *
 * Composes Header + Sidebar (desktop) / MobileHeader (small screens) +
 * MainContent. AdminDashboard/UserDashboard hand it a `navItems` list and
 * the currently active route; it renders `children` (the current page)
 * inside MainContent.
 */

import { useEffect, useState } from "react";
import "./dashboard-shell.css";
import { DashboardHeader } from "./DashboardHeader.jsx";
import { Sidebar } from "./Sidebar.jsx";
import { MobileHeader } from "./MobileHeader.jsx";
import { MainContent } from "./MainContent.jsx";
import { colors } from "../theme.js";

export function DashboardLayout({
  navItems,
  activeRoute,
  onNavigate,
  connected,
  lastUpdated,
  username,
  role,
  onLogout,
  onLogoClick,
  children,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <div
      className="pcgo-shell-root"
      style={{
        overflow: "hidden",
        background: colors.bg,
        color: colors.ink,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <DashboardHeader
        connected={connected}
        lastUpdated={lastUpdated}
        username={username}
        role={role}
        onLogout={onLogout}
        onToggleMobileMenu={() => setMobileMenuOpen((v) => !v)}
        onLogoClick={onLogoClick}
      />

      <MobileHeader
        open={mobileMenuOpen}
        items={navItems}
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        onClose={() => setMobileMenuOpen(false)}
      />

      {mobileMenuOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "transparent",
          }}
        />
      )}

      <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
        <div className="pcgo-sidebar" style={{ display: "flex" }}>
          <Sidebar items={navItems} activeRoute={activeRoute} onNavigate={onNavigate} />
        </div>
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
}
