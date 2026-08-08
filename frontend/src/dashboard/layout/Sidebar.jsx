/**
 * dashboard/layout/Sidebar.jsx
 *
 * Desktop navigation rail. Pure presentation — the list of items (and
 * which ones are visible) is decided by AdminDashboard / UserDashboard,
 * so this component has no idea about roles or permissions itself.
 *
 * TinkerHub's "morphing pill" nav concept (DESIGN_SYSTEM.md §5, Nav),
 * translated to a vertical rail: the active item renders as a filled
 * `ink` pill with icon + label; inactive items are plain icon + label in
 * `inkDim`, with a subtle hover background. No glow, no gradient.
 */

import { colors, fonts, nav, radius, motion } from "../theme.js";

export function Sidebar({ items, activeRoute, onNavigate }) {
  return (
    <nav
      style={{
        width: `${nav.sidebarWidth}px`,
        flexShrink: 0,
        borderRight: `1.5px solid ${colors.border}`,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        padding: "16px 12px",
        gap: "3px",
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
              padding: "9px 14px",
              borderRadius: `${radius.full}px`,
              border: "1.5px solid transparent",
              background: active ? colors.ink : "transparent",
              color: active ? colors.bg : colors.inkDim,
              fontSize: "13px",
              fontFamily: fonts.body,
              fontWeight: active ? 700 : 500,
              cursor: "pointer",
              textAlign: "left",
              transition: `background ${motion.pill}, color ${motion.pill}`,
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.background = "rgba(237,235,227,0.06)";
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.background = "transparent";
            }}
          >
            <span
              style={{
                fontSize: "15px",
                width: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
