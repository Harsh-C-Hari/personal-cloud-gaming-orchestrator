import { colors, fonts, nav, radius, motion } from "../theme.js";

export function Sidebar({ items, activeRoute, onNavigate }) {
  return (
    <nav
      aria-label="Primary navigation"
      style={{
        width: `${nav.sidebarWidth}px`,
        flexShrink: 0,
        borderRight: `1px solid ${colors.border}`,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        padding: "18px 14px 20px",
        gap: "4px",
        background: colors.bgElevated,
      }}
    >
      <div style={{ padding: "4px 10px 14px", color: colors.inkFaint, font: `700 10px/1.2 ${fonts.mono}`, letterSpacing: ".14em", textTransform: "uppercase" }}>
        Control plane
      </div>
      {items.map((item) => {
        const active = item.route === activeRoute;
        return (
          <button
            key={item.route}
            type="button"
            onClick={() => onNavigate(item.route)}
            aria-current={active ? "page" : undefined}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: "11px",
              minHeight: "42px",
              padding: "10px 12px",
              borderRadius: `${radius.sm}px`,
              border: `1px solid ${active ? colors.brandDim : "transparent"}`,
              background: active ? colors.brandDim : "transparent",
              color: active ? colors.ink : colors.inkDim,
              fontSize: "13px",
              fontFamily: fonts.body,
              fontWeight: active ? 650 : 500,
              cursor: "pointer",
              textAlign: "left",
              transition: `background ${motion.pill}, color ${motion.pill}, border-color ${motion.pill}`,
            }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = colors.bgCardHover; }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
          >
            {active && <span aria-hidden="true" style={{ position: "absolute", left: -15, width: 2, height: 20, background: colors.brand, borderRadius: 2 }} />}
            <span style={{ color: active ? colors.brand : colors.inkFaint, width: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
