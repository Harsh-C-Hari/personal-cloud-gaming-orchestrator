import { colors, nav, radius, motion, surface, typeScale } from "../theme.js";

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
        background: surface.l2,
      }}
    >
      <div style={{ padding: "4px 10px 14px", color: colors.inkFaint, ...typeScale.meta }}>
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
              // Per §6.6: Sidebar nav row is the explicit `radius.tight`
              // (4px) exception — a full `radius.none` reads harsh for a
              // tall list of frequently-clicked targets. Was `radius.sm`
              // (8px).
              borderRadius: `${radius.tight}px`,
              border: `1px solid ${active ? colors.brandDim : "transparent"}`,
              background: active ? colors.brandDim : "transparent",
              color: active ? colors.ink : colors.inkDim,
              ...typeScale.body,
              fontWeight: active ? 650 : 500,
              cursor: "pointer",
              textAlign: "left",
              transition: `background ${motion.pill}, color ${motion.pill}, border-color ${motion.pill}`,
            }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = surface.l4; }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
          >
            {/* Per §5.8: accent-edge 3px (was 2px), matching the app-wide
                accent-edge standard. Same `colors.brand`, same
                `left: -15px` placement. The 20px height and `2px`
                borderRadius on the bar itself stay literal — the bar
                is a thin accent device, not a panel. */}
            {active && <span aria-hidden="true" style={{ position: "absolute", left: -15, width: 3, height: 20, background: colors.brand, borderRadius: 2 }} />}
            <span style={{ color: active ? colors.brand : colors.inkFaint, width: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
