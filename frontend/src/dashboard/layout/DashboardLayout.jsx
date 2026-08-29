import { useEffect, useRef, useState } from "react";
import "./dashboard-shell.css";
import { DashboardHeader } from "./DashboardHeader.jsx";
import { Sidebar } from "./Sidebar.jsx";
import { MobileHeader } from "./MobileHeader.jsx";
import { MainContent } from "./MainContent.jsx";
import { colors, surface } from "../theme.js";

export function DashboardLayout({ navItems, activeRoute, onNavigate, connected, lastUpdated, username, role, onLogout, onLogoClick, children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef(null);
  const mobileCloseButtonRef = useRef(null);
  const wasMobileMenuOpen = useRef(false);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape") setMobileMenuOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const focusTarget = mobileMenuOpen ? mobileCloseButtonRef.current : mobileMenuButtonRef.current;
    if (!focusTarget && !wasMobileMenuOpen.current) {
      wasMobileMenuOpen.current = mobileMenuOpen;
      return undefined;
    }

    const shouldReturnFocus = !mobileMenuOpen && wasMobileMenuOpen.current;
    const frame = window.requestAnimationFrame(() => {
      if (mobileMenuOpen || shouldReturnFocus) focusTarget?.focus({ preventScroll: true });
    });
    wasMobileMenuOpen.current = mobileMenuOpen;
    return () => window.cancelAnimationFrame(frame);
  }, [mobileMenuOpen]);

  return (
    <div className="pcgo-shell-root" style={{ overflow: "hidden", background: surface.l0, color: colors.ink, display: "flex", flexDirection: "column" }}>
      <DashboardHeader connected={connected} lastUpdated={lastUpdated} username={username} role={role} onLogout={onLogout} mobileMenuButtonRef={mobileMenuButtonRef} onToggleMobileMenu={() => setMobileMenuOpen((value) => !value)} onLogoClick={onLogoClick} />
      <MobileHeader open={mobileMenuOpen} items={navItems} activeRoute={activeRoute} closeButtonRef={mobileCloseButtonRef} onNavigate={onNavigate} onClose={() => setMobileMenuOpen(false)} />
      {mobileMenuOpen && <div aria-hidden="true" onClick={() => setMobileMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(0,0,0,0.44)" }} />}
      <div style={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
        <div className="pcgo-sidebar" style={{ display: "flex" }}><Sidebar items={navItems} activeRoute={activeRoute} onNavigate={onNavigate} /></div>
        <MainContent>{children}</MainContent>
      </div>
    </div>
  );
}
