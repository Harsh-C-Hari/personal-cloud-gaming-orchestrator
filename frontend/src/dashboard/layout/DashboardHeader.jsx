/**
 * dashboard/layout/DashboardHeader.jsx
 *
 * Top app bar. Same content/behavior as the old inline <header> in
 * pages/Dashboard.jsx (logo mark, WS status, last update, user/role,
 * logout) — extracted verbatim and given an optional mobile menu button.
 */

import { colors, fonts, nav } from "../theme.js";

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
      style={{
        height: `${nav.headerHeight}px`,
        borderBottom: `1px solid ${colors.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px 0 16px",
        flexShrink: 0,
        background: colors.bg,
        zIndex: 50,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {onToggleMobileMenu && (
          <button
            ref={mobileMenuButtonRef}
            onClick={onToggleMobileMenu}
            className="pcgo-mobile-menu-btn"
            style={{
              display: "none",
              background: "transparent",
              border: `1px solid ${colors.borderSubtle}`,
              borderRadius: "6px",
              color: colors.textDim,
              width: "32px",
              height: "32px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            ☰
          </button>
        )}

        <button
          type="button"
          onClick={onLogoClick}
          disabled={!onLogoClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "transparent",
            border: "none",
            padding: 0,
            margin: 0,
            cursor: onLogoClick ? "pointer" : "default",
          }}
          title={onLogoClick ? "Go to Home" : undefined}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1px" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "3px",
                  height: `${10 + i * 5}px`,
                  background: colors.accent,
                  borderRadius: "1px",
                  opacity: 0.6 + i * 0.2,
                  boxShadow: "0 0 6px rgba(56,189,248,0.5)",
                }}
              />
            ))}
          </div>

          <div>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: colors.text,
              }}
            >
              CLOUD GAMING <span style={{ color: colors.accent }}>ORCHESTRATOR</span>
            </span>

            <span
              className="pcgo-header-subtitle"
              style={{
                marginLeft: "12px",
                fontSize: "9px",
                color: colors.textGhost,
                letterSpacing: "0.1em",
                fontFamily: fonts.mono,
              }}
            >
              {subtitle}
            </span>
          </div>
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
        <div className="pcgo-header-optional" style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: connected ? colors.success : colors.danger,
              boxShadow: connected ? "0 0 10px rgba(16,217,138,0.8)" : "0 0 10px rgba(244,63,94,0.8)",
            }}
          />
          <span
            style={{
              fontSize: "9px",
              color: colors.textMuted,
              letterSpacing: "0.12em",
              fontFamily: fonts.mono,
              textTransform: "uppercase",
            }}
          >
            {connected ? "Connected" : "Offline"}
          </span>
        </div>

        <div
          className="pcgo-header-optional"
          style={{
            fontSize: "9px",
            color: colors.textFaint,
            letterSpacing: "0.08em",
            fontFamily: fonts.mono,
          }}
        >
          LAST UPDATE {lastUpdated ? lastUpdated.toLocaleTimeString() : "--"}
        </div>

        <div
          className="pcgo-header-optional"
          style={{
            fontSize: "9px",
            color: colors.textFaint,
            letterSpacing: "0.08em",
            fontFamily: fonts.mono,
            textTransform: "uppercase",
          }}
        >
          USER {username?.toUpperCase() || "UNKNOWN"} ({role?.toUpperCase() || "USER"})
        </div>

        <button
          onClick={onLogout}
          style={{
            padding: "6px 12px",
            border: "1px solid rgba(244,63,94,0.35)",
            background: colors.dangerDim,
            color: "#fb7185",
            borderRadius: "6px",
            fontSize: "9px",
            fontFamily: fonts.mono,
            letterSpacing: "0.08em",
            cursor: "pointer",
            textTransform: "uppercase",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(244,63,94,0.18)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = colors.dangerDim)}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
