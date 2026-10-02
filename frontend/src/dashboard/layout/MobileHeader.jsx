import { useLayoutEffect, useRef } from "react";
import { colors, motion, nav, radius, shadow, surface, typeScale } from "../theme.js";

export function MobileHeader({ open, items, activeRoute, onNavigate, closeButtonRef, onClose }) {
  const drawerRef = useRef(null);

  useLayoutEffect(() => {
    if (!drawerRef.current) return;
    if (open) {
      drawerRef.current.removeAttribute("inert");
      drawerRef.current.inert = false;
    } else {
      drawerRef.current.setAttribute("inert", "");
      drawerRef.current.inert = true;
    }
  }, [open]);

  // Drawer transition token audit (P6-T03): the `box-shadow` portion is an
  // exact 220ms/ease match to motion.cardIn (its first real usage in the
  // app) and is converted below. The `transform` portion (220ms
  // cubic-bezier(0.4,0,0.2,1)) is left as a literal: motion.cardIn shares
  // its 220ms duration but uses plain `ease`, not this curve, and
  // motion.pill shares this exact curve but uses 180ms, not 220ms. No
  // `motion` step matches both duration AND easing at once, so per the
  // project's exact-match-only rule it is not converted.
  return (
    <div ref={drawerRef} className="pcgo-mobile-nav" aria-hidden={!open} style={{ position: "fixed", top: `${nav.headerHeight}px`, left: 0, bottom: 0, width: "min(310px, 88vw)", display: "flex", flexDirection: "column", borderRight: `1px solid ${colors.border}`, background: "rgba(0, 0, 0, 0.65)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", boxShadow: open ? shadow.overlay : "none", zIndex: 45, transform: open ? "translateX(0)" : "translateX(-100%)", transition: `transform 220ms cubic-bezier(0.4,0,0.2,1), box-shadow ${motion.cardIn}`, pointerEvents: open ? "auto" : "none", overflowY: "auto" }}>
      <div style={{ padding: "16px 18px", borderBottom: `1px solid ${colors.borderSubtle}`, flexShrink: 0 }}>
        <div style={{ color: colors.ink, ...typeScale.subheading, fontWeight: 650 }}>Navigation</div>
        <div style={{ color: colors.inkFaint, ...typeScale.meta, fontWeight: 500, letterSpacing: "0", textTransform: "none", marginTop: 4 }}>{items.length} destinations</div>
      </div>
      <div style={{ padding: "12px 10px", display: "grid", gap: 4, overflowY: "auto" }}>
        {items.map((item) => {
          const active = item.route === activeRoute;
          return (
            <button
              key={item.route}
              type="button"
              tabIndex={open ? 0 : -1}
              onClick={() => { onNavigate(item.route); onClose(); }}
              aria-current={active ? "page" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minHeight: 46,
                padding: "11px 12px",
                borderRadius: `${radius.tight}px`,
                border: `1px solid ${active ? colors.brandDim : "transparent"}`,
                background: active ? colors.brandDim : "transparent",
                color: active ? colors.ink : colors.inkDim,
                ...typeScale.body,
                fontWeight: active ? 650 : 500,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: `background 160ms ease, color 160ms ease, border-color 160ms ease`,
              }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = surface.l4; e.currentTarget.style.color = colors.ink; } }}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = colors.inkDim; } }}
            >
              <span style={{ color: active ? colors.brand : colors.inkFaint, width: 19, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
