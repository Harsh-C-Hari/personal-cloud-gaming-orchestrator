/**
 * dashboard/layout/DashboardHeader.jsx
 *
 * Top app bar. Same content/behavior as before (logo mark, WS status, last
 * update, user/role, logout) with an optional mobile menu button — flat
 * accents only, no glow.
 */

import { Menu } from "lucide-react";
import { colors, fonts, nav, radius } from "../theme.js";

export function DashboardHeader({
  connected,
  lastUpdated,
  username,
  role,
  onLogout,
  onToggleMobileMenu,
  mobileMenuButtonRef,
  onLogoClick,
}) {
  const subtitle = role === "admin" ? "HOST AGENT" : "GAME CLIENT";

  return (
    <header
      className="pcgo-header"
      style={{
        height: `${nav.headerHeight}px`,
        minHeight: `${nav.headerHeight}px`,
        borderBottom: `1.5px solid ${colors.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "8px",
        padding: "0 12px 0 8px",
        flexShrink: 0,
        background: colors.bg,
        zIndex: 50,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: 0, flex: 1 }}>
        {onToggleMobileMenu && (
          <button
            ref={mobileMenuButtonRef}
            onClick={onToggleMobileMenu}
            className="pcgo-mobile-menu-btn"
            aria-label="Toggle navigation menu"
            style={{
              display: "none",
              background: "transparent",
              border: `1.5px solid ${colors.borderSubtle}`,
              borderRadius: `${radius.sm}px`,
              color: colors.inkDim,
              width: "44px",
              height: "44px",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            <Menu size={15} strokeWidth={2} style={{ margin: "0 auto" }} />
          </button>
        )}

        <button
          type="button"
          onClick={onLogoClick}
          disabled={!onLogoClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "transparent",
            border: "none",
            padding: "0 4px",
            margin: 0,
            minWidth: 0,
            cursor: onLogoClick ? "pointer" : "default",
          }}
          title={onLogoClick ? "Go to Home" : undefined}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1px", flexShrink: 0 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "3px",
                  height: `${10 + i * 5}px`,
                  background: colors.brand,
                  borderRadius: "1px",
                  opacity: 0.6 + i * 0.2,
                }}
              />
            ))}
          </div>

          <div style={{ minWidth: 0, overflow: "hidden", textAlign: "left" }}>
            <span
              className="pcgo-header-title-full"
              style={{
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.04em",
                color: colors.ink,
                fontFamily: fonts.display,
                whiteSpace: "nowrap",
              }}
            >
              CLOUD GAMING <span style={{ color: colors.brand }}>ORCHESTRATOR</span>
            </span>
            <span
              className="pcgo-header-title-short"
              style={{
                display: "none",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.02em",
                color: colors.ink,
                fontFamily: fonts.display,
                whiteSpace: "nowrap",
              }}
            >
              CG<span style={{ color: colors.brand }}>O</span>
            </span>

            <span
              className="pcgo-header-subtitle"
              style={{
                marginLeft: "12px",
                fontSize: "9.5px",
                fontWeight: 700,
                color: colors.inkGhost,
                letterSpacing: "0.1em",
                fontFamily: fonts.body,
                whiteSpace: "nowrap",
              }}
            >
              {subtitle}
            </span>
          </div>
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "18px", flexShrink: 0 }}>
        <div className="pcgo-header-optional" style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: connected ? colors.success : colors.danger,
            }}
          />
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: colors.inkFaint,
              letterSpacing: "0.08em",
              fontFamily: fonts.body,
              textTransform: "uppercase",
            }}
          >
            {connected ? "Connected" : "Offline"}
          </span>
        </div>

        <div
          className="pcgo-header-optional"
          style={{
            fontSize: "10px",
            fontWeight: 500,
            color: colors.inkFaint,
            letterSpacing: "0.02em",
            fontFamily: fonts.mono,
          }}
        >
          LAST UPDATE {lastUpdated ? lastUpdated.toLocaleTimeString() : "--"}
        </div>

        <div
          className="pcgo-header-optional"
          style={{
            fontSize: "10px",
            fontWeight: 500,
            color: colors.inkFaint,
            letterSpacing: "0.02em",
            fontFamily: fonts.mono,
            textTransform: "uppercase",
          }}
        >
          USER {username?.toUpperCase() || "UNKNOWN"} ({role?.toUpperCase() || "USER"})
        </div>

        <button
          onClick={onLogout}
          aria-label="Log out"
          style={{
            padding: "10px 14px",
            minHeight: "36px",
            border: `1.5px solid ${colors.danger}`,
            background: "transparent",
            color: colors.danger,
            borderRadius: `${radius.full}px`,
            fontSize: "10px",
            fontWeight: 700,
            fontFamily: fonts.body,
            letterSpacing: "0.06em",
            cursor: "pointer",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            flexShrink: 0,
            transition: "background 150ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,107,107,0.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
