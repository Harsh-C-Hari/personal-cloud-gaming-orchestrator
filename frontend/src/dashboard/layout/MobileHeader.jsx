/**
 * dashboard/layout/MobileHeader.jsx
 *
 * Off-canvas nav drawer for small screens. Renders the same `items` list
 * Sidebar uses, as a left-edge sliding panel, mirroring Sidebar's
 * morphing-pill active state (filled `ink` pill) instead of the old
 * glassmorphic/glow treatment — flat fill, border instead of shadow, per
 * DESIGN_SYSTEM.md §5 (Nav) / §4 (no glassmorphism, no glow).
 *
 * Same data contract / behavior as before (open, items, activeRoute,
 * onNavigate, onClose) — only the visual design/entry direction changed.
 * Always mounted (rather than returning null when closed) so the
 * slide-in/slide-out transform can actually animate both ways; it's
 * pushed off-screen and made non-interactive while closed.
 */

import { X } from "lucide-react";
import { colors, fonts, nav, radius, shadow } from "../theme.js";

export function MobileHeader({ open, items, activeRoute, onNavigate, onClose }) {
  return (
    <div
      className="pcgo-mobile-nav"
      aria-hidden={!open}
      style={{
        position: "fixed",
        top: `${nav.headerHeight}px`,
        left: 0,
        bottom: 0,
        width: "min(280px, 82vw)",
        display: "flex",
        flexDirection: "column",
        borderRight: `1.5px solid ${colors.border}`,
        background: colors.bgElevated,
        boxShadow: open ? shadow.overlay : "none",
        zIndex: 45,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 220ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 220ms ease",
        pointerEvents: open ? "auto" : "none",
        overflowY: "auto",
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: `1.5px solid ${colors.borderSubtle}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: colors.inkFaint,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontFamily: fonts.body,
            }}
          >
            Navigation
          </span>
          <span
            style={{
              fontSize: "10px",
              color: colors.inkGhost,
              fontFamily: fonts.mono,
              border: `1.5px solid ${colors.borderSubtle}`,
              borderRadius: `${radius.full}px`,
              padding: "1px 8px",
            }}
          >
            {items.length}
          </span>
        </div>

        <button
          onClick={onClose}
          aria-label="Close navigation menu"
          style={{
            width: "44px",
            height: "44px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: `${radius.sm}px`,
            border: `1.5px solid ${colors.borderSubtle}`,
            background: "transparent",
            color: colors.inkFaint,
            cursor: "pointer",
            transition: "background 150ms ease, color 150ms ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,107,107,0.1)";
            e.currentTarget.style.color = colors.danger;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = colors.inkFaint;
          }}
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>

      {/* Item list */}
      <div style={{ padding: "8px", display: "grid", gap: "3px", overflowY: "auto" }}>
        {items.map((item) => {
          const active = item.route === activeRoute;
          return (
            <button
              key={item.route}
              onClick={() => {
                onNavigate(item.route);
                onClose();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                minHeight: "44px",
                padding: "12px 14px",
                borderRadius: `${radius.full}px`,
                border: "1.5px solid transparent",
                background: active ? colors.ink : "transparent",
                color: active ? colors.bg : colors.inkDim,
                fontSize: "13.5px",
                fontFamily: fonts.body,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                textAlign: "left",
                transition: "background 150ms ease, color 150ms ease",
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
                  flexShrink: 0,
                  width: "18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                }}
              >
                {item.icon}
              </span>

              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
