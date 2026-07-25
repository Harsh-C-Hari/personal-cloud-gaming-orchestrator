/**
 * dashboard/layout/Sidebar.jsx
 *
 * Desktop navigation rail. Pure presentation — the list of items (and
 * which ones are visible) is decided by AdminDashboard / UserDashboard,
 * so this component has no idea about roles or permissions itself.
 */

import { colors, fonts, nav } from "../theme.js";

export function Sidebar({ items, activeRoute, onNavigate }) {
  return (
    <nav
      style={{
        width: `${nav.sidebarWidth}px`,
        flexShrink: 0,
        borderRight: `1px solid ${colors.border}`,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        padding: "16px 10px",
        gap: "2px",
      }}
    >
      {items.map((item) => {
        const active = item.route === activeRoute;
        return (
          <button
            key={item.route}
            onClick={() => onNavigate(item.route)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "11px",
              padding: "9px 12px",
              borderRadius: "7px",
              border: "1px solid transparent",
              background: active ? colors.accentDim : "transparent",
              color: active ? colors.accent : colors.textDim,
              fontSize: "12px",
              fontFamily: fonts.display,
              fontWeight: active ? 700 : 500,
              letterSpacing: "0.02em",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.background = "rgba(148,163,184,0.06)";
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.background = "transparent";
            }}
          >
            <span style={{ fontSize: "15px", width: "18px", textAlign: "center" }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
