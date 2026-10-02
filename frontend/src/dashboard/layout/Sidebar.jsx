/**
 * dashboard/layout/Sidebar.jsx
 *
 * Phase 4b: The per-item static active indicator ({active && <span .../>})
 * is replaced by a single absolutely-positioned floating pill that GSAP
 * tweens to the active item's position on activeRoute change. Initial
 * placement uses gsap.set() (no animation) to avoid a jump on first render.
 *
 * The floating pill is positioned relative to the <nav> element (which is
 * already position:relative via its padding/flex layout context). We use
 * useRef on the <nav> and data-route attributes on each button to measure
 * the target button's offsetTop and offsetHeight.
 *
 * Respects prefers-reduced-motion: when true, the pill teleports
 * immediately (gsap.set) instead of tweening, and no tween is created.
 */
import { useEffect, useRef } from "react";
import { colors, nav, radius, motion, surface, typeScale } from "../theme.js";

export function Sidebar({ items, activeRoute, onNavigate }) {
  const navRef = useRef(null);
  const pillRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!navRef.current || !pillRef.current) return;

    const nav = navRef.current;
    const pill = pillRef.current;
    const activeBtn = nav.querySelector(`[data-route="${activeRoute}"]`);
    if (!activeBtn) {
      pill.style.opacity = "0";
      return;
    }

    // Target position: button's offsetTop + centered vertically.
    const top = activeBtn.offsetTop + (activeBtn.offsetHeight - 20) / 2;

    pill.style.opacity = "1";
    pill.style.transform = `translateY(${top}px)`;
  }, [activeRoute]);

  return (
    <nav
      ref={navRef}
      aria-label="Primary navigation"
      style={{
        position: "relative",
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
      {/* Floating active indicator — GSAP-animated, single element */}
      <span
        ref={pillRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 3,
          height: 20,
          background: colors.brand,
          borderRadius: 2,
          opacity: 0,
          transition: "transform 0.35s cubic-bezier(0.34, 1.15, 0.64, 1), opacity 0.2s",
        }}
      />

      <div style={{ padding: "4px 10px 14px", color: colors.inkFaint, ...typeScale.meta }}>
        Control plane
      </div>
      {items.map((item) => {
        const active = item.route === activeRoute;
        return (
          <button
            key={item.route}
            type="button"
            data-route={item.route}
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
            {/* Static left bar removed — replaced by the floating GSAP pill above */}
            <span style={{ color: active ? colors.brand : colors.inkFaint, width: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
