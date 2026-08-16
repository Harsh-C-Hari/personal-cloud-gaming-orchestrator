import { Menu, LogOut, Wifi, WifiOff } from "lucide-react";
import { colors, fonts, nav, radius } from "../theme.js";

function BrandMark() {
  return (
    <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: 22 }}>
      {[8, 14, 20].map((height, index) => <span key={height} style={{ width: 3, height, background: index === 2 ? colors.brand : colors.inkDim, borderRadius: 2 }} />)}
    </span>
  );
}

export function DashboardHeader({ connected, lastUpdated, username, role, onLogout, onToggleMobileMenu, mobileMenuButtonRef, onLogoClick }) {
  const subtitle = role === "admin" ? "HOST OPERATIONS" : "PLAYER CONSOLE";
  return (
    <header className="pcgo-header" style={{ height: `${nav.headerHeight}px`, minHeight: `${nav.headerHeight}px`, borderBottom: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "0 20px 0 18px", flexShrink: 0, background: colors.bg, zIndex: 50 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
        {onToggleMobileMenu && <button ref={mobileMenuButtonRef} type="button" onClick={onToggleMobileMenu} className="pcgo-mobile-menu-btn" aria-label="Toggle navigation menu" style={{ display: "none", background: colors.bgElevated, border: `1px solid ${colors.border}`, borderRadius: radius.sm, color: colors.inkDim, width: 40, height: 40, flexShrink: 0, cursor: "pointer" }}><Menu size={17} /></button>}
        <button type="button" onClick={onLogoClick} disabled={!onLogoClick} style={{ display: "flex", alignItems: "center", gap: 11, background: "transparent", border: "none", padding: 0, margin: 0, minWidth: 0, cursor: onLogoClick ? "pointer" : "default", color: colors.ink }} title={onLogoClick ? "Go to Home" : undefined}>
          <BrandMark />
          <span style={{ minWidth: 0, overflow: "hidden", textAlign: "left", display: "flex", alignItems: "baseline", gap: 10 }}>
            <span className="pcgo-header-title-full" style={{ fontSize: 14, fontWeight: 700, letterSpacing: ".045em", fontFamily: fonts.display, whiteSpace: "nowrap" }}>CLOUD GAMING <span style={{ color: colors.brand }}>ORCHESTRATOR</span></span>
            <span className="pcgo-header-title-short" style={{ display: "none", fontSize: 14, fontWeight: 700, letterSpacing: ".03em", fontFamily: fonts.display, whiteSpace: "nowrap" }}>CG<span style={{ color: colors.brand }}>O</span></span>
            <span className="pcgo-header-subtitle" style={{ color: colors.inkGhost, font: `700 9px/1 ${fonts.mono}`, letterSpacing: ".13em", whiteSpace: "nowrap" }}>{subtitle}</span>
          </span>
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18, flexShrink: 0 }}>
        <div className="pcgo-header-optional" style={{ display: "flex", alignItems: "center", gap: 8, color: connected ? colors.success : colors.danger, font: `600 10px/1 ${fonts.mono}`, letterSpacing: ".08em", textTransform: "uppercase" }}>
          {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span>{connected ? "Live" : "Offline"}</span>
        </div>
        <div className="pcgo-header-optional" style={{ color: colors.inkFaint, font: `500 10px/1 ${fonts.mono}`, whiteSpace: "nowrap" }}>
          {lastUpdated ? `SYNC ${lastUpdated.toLocaleTimeString()}` : "SYNC --"}
        </div>
        <div className="pcgo-header-optional" style={{ display: "flex", alignItems: "center", gap: 8, color: colors.inkDim, font: `500 11px/1 ${fonts.mono}`, textTransform: "uppercase", whiteSpace: "nowrap" }}>
          <span style={{ width: 24, height: 24, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: colors.brandDim, color: colors.brand, fontFamily: fonts.body, fontWeight: 700 }}>{(username || "?").slice(0, 1).toUpperCase()}</span>
          {username || "unknown"} <span style={{ color: colors.inkGhost }}>·</span> {role || "user"}
        </div>
        <button type="button" onClick={onLogout} aria-label="Log out" style={{ display: "inline-flex", alignItems: "center", gap: 7, minHeight: 36, padding: "8px 11px", border: `1px solid ${colors.border}`, background: "transparent", color: colors.inkDim, borderRadius: radius.sm, fontSize: 11, fontWeight: 650, fontFamily: fonts.body, cursor: "pointer", whiteSpace: "nowrap", transition: "background 160ms ease, color 160ms ease, border-color 160ms ease" }} onMouseEnter={(e) => { e.currentTarget.style.background = colors.bgCardHover; e.currentTarget.style.color = colors.ink; e.currentTarget.style.borderColor = colors.borderStrong; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = colors.inkDim; e.currentTarget.style.borderColor = colors.border; }}>
          <LogOut size={14} /> <span className="pcgo-logout-label">Log out</span>
        </button>
      </div>
    </header>
  );
}
