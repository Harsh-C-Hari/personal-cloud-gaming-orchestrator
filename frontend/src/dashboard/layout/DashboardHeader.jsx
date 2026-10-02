import { LogOut, Wifi, WifiOff } from "lucide-react";
import { colors, fonts, motion, nav, radius, surface, typeScale } from "../theme.js";
import { BrandMark } from "../../components/ui/BrandMark.jsx";

/**
 * Animated 3-bar hamburger that morphs into an ✕ when menuOpen=true.
 *
 * Built from 3 plain <span> bars — no Lucide icon so we own the
 * transform origin and can cross-fade bar 2 while rotating bars 1 & 3.
 *
 * Transitions: 250ms cubic-bezier(0.4,0,0.2,1) — same curve used by
 * the drawer slide itself, so the icon and panel feel synchronised.
 */
function HamburgerIcon({ open }) {
  const t = "250ms cubic-bezier(0.4,0,0.2,1)";
  const barBase = {
    display: "block",
    width: 17,
    height: 1.5,
    borderRadius: 1,
    background: "currentColor",
    transformOrigin: "center",
    transition: `transform ${t}, opacity ${t}, width ${t}`,
  };
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        width: 17,
        height: 17,
      }}
    >
      <span
        style={{
          ...barBase,
          transform: open ? "translateY(5.5px) rotate(45deg)" : "none",
        }}
      />
      <span
        style={{
          ...barBase,
          opacity: open ? 0 : 1,
          width: open ? 10 : 17,
        }}
      />
      <span
        style={{
          ...barBase,
          transform: open ? "translateY(-5.5px) rotate(-45deg)" : "none",
        }}
      />
    </span>
  );
}

export function DashboardHeader({ connected, lastUpdated, username, role, onLogout, onToggleMobileMenu, mobileMenuButtonRef, onLogoClick, menuOpen }) {
  const subtitle = role === "admin" ? "HOST OPERATIONS" : "PLAYER CONSOLE";
  return (
    <header className="pcgo-header" style={{ position: "absolute", top: 0, left: 0, right: 0, height: `${nav.headerHeight}px`, minHeight: `${nav.headerHeight}px`, borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "0 20px 0 18px", flexShrink: 0, background: "rgba(0, 0, 0, 0.65)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
        {onToggleMobileMenu && (
          <button
            ref={mobileMenuButtonRef}
            type="button"
            onClick={onToggleMobileMenu}
            className="pcgo-mobile-menu-btn"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            style={{
              background: "transparent",
              border: `1px solid ${menuOpen ? colors.borderStrong : colors.border}`,
              borderRadius: `${radius.tight}px`,
              color: menuOpen ? colors.ink : colors.inkDim,
              width: 40,
              height: 40,
              flexShrink: 0,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transition: `background ${motion.hover}, border-color ${motion.hover}, color ${motion.hover}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = surface.l4;
              e.currentTarget.style.color = colors.ink;
              e.currentTarget.style.borderColor = colors.borderStrong;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = menuOpen ? colors.ink : colors.inkDim;
              e.currentTarget.style.borderColor = menuOpen ? colors.borderStrong : colors.border;
            }}
          >
            <HamburgerIcon open={menuOpen} />
          </button>
        )}

        <button
          type="button"
          onClick={onLogoClick}
          disabled={!onLogoClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            background: "transparent",
            border: "none",
            padding: 0,
            margin: 0,
            minWidth: 0,
            cursor: onLogoClick ? "pointer" : "default",
            color: colors.ink,
          }}
          title={onLogoClick ? "Go to Home" : undefined}
        >
          <BrandMark scale="sm" />
          <span style={{ minWidth: 0, overflow: "hidden", textAlign: "left", display: "flex", alignItems: "baseline", gap: 10 }}>
            <span className="pcgo-header-title-full" style={{ ...typeScale.subheading, fontWeight: 700, letterSpacing: ".045em", whiteSpace: "nowrap" }}>CLOUD GAMING <span style={{ color: colors.brand }}>ORCHESTRATOR</span></span>
            <span className="pcgo-header-title-short" style={{ display: "none", ...typeScale.subheading, fontWeight: 700, letterSpacing: ".03em", whiteSpace: "nowrap" }}>CG<span style={{ color: colors.brand }}>O</span></span>
            <span className="pcgo-header-subtitle" style={{ color: colors.inkGhost, ...typeScale.meta, letterSpacing: ".13em", whiteSpace: "nowrap" }}>{subtitle}</span>
          </span>
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18, flexShrink: 0 }}>
        <div className="pcgo-header-optional" style={{ display: "flex", alignItems: "center", gap: 8, color: connected ? colors.success : colors.danger, ...typeScale.meta, fontWeight: 600, letterSpacing: ".08em" }}>
          {connected ? <Wifi size={14} aria-hidden="true" /> : <WifiOff size={14} aria-hidden="true" />}
          <span>{connected ? "Live" : "Offline"}</span>
        </div>
        <div className="pcgo-header-optional" style={{ color: colors.inkFaint, ...typeScale.meta, fontWeight: 500, letterSpacing: "0", textTransform: "none", whiteSpace: "nowrap" }}>
          {lastUpdated ? `SYNC ${lastUpdated.toLocaleTimeString()}` : "SYNC --"}
        </div>
        <div className="pcgo-header-optional" style={{ display: "flex", alignItems: "center", gap: 8, color: colors.inkDim, ...typeScale.meta, fontWeight: 500, letterSpacing: "0", whiteSpace: "nowrap" }}>
          <span style={{ width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: colors.brandDim, color: colors.brand, fontFamily: fonts.body, fontWeight: 700 }}>{(username || "?").slice(0, 1).toUpperCase()}</span>
          {username || "unknown"} <span style={{ color: colors.inkGhost }}>·</span> {role || "user"}
        </div>
        <button
          type="button"
          onClick={onLogout}
          aria-label="Log out"
          style={{ display: "inline-flex", alignItems: "center", gap: 7, minHeight: 36, padding: "8px 11px", border: `1px solid ${colors.border}`, background: "transparent", color: colors.inkDim, borderRadius: `${radius.tight}px`, ...typeScale.bodySmall, fontWeight: 650, cursor: "pointer", whiteSpace: "nowrap", transition: `background ${motion.hover}, color ${motion.hover}, border-color ${motion.hover}` }}
          onMouseEnter={(e) => { e.currentTarget.style.background = surface.l4; e.currentTarget.style.color = colors.ink; e.currentTarget.style.borderColor = colors.borderStrong; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = colors.inkDim; e.currentTarget.style.borderColor = colors.border; }}
        >
          <LogOut size={14} aria-hidden="true" /> <span className="pcgo-logout-label">Log out</span>
        </button>
      </div>
    </header>
  );
}
