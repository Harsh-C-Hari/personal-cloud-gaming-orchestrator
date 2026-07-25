/**
 * dashboard/layout/MobileHeader.jsx
 *
 * Off-canvas nav drawer for small screens. Renders the same `items` list
 * Sidebar uses, as a left-edge sliding panel (like a standard mobile app
 * drawer) instead of a full-width dropdown.
 *
 * Same data contract / behavior as before (open, items, activeRoute,
 * onNavigate, onClose) — only the visual design/entry direction changed.
 * Always mounted (rather than returning null when closed) so the
 * slide-in/slide-out transform can actually animate both ways; it's
 * pushed off-screen and made non-interactive while closed.
 */

import { FaTimes } from "react-icons/fa";
import { colors, fonts, nav } from "../theme.js";

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
        borderRight: "1px solid rgba(148,163,184,0.16)",
        background: "linear-gradient(165deg, rgba(0, 0, 0, 0.6), rgba(1, 8, 28, 0.72))",
        backdropFilter: "blur(10px) saturate(160%)",
        WebkitBackdropFilter: "blur(0px) saturate(160%)",
        boxShadow: open
          ? "inset -1px 0 0 rgba(255,255,255,0.04), 24px 0 48px -20px rgba(0,0,0,0.75)"
          : "none",
        zIndex: 45,
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.22s",
        pointerEvents: open ? "auto" : "none",
        overflowY: "auto",
        isolation: "isolate",
      }}
    >
      {/* Glass sheen overlay — soft diagonal light catching the panel */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 32%)",
          pointerEvents: "none",
          zIndex: -1,
        }}
      />
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: `1px solid ${colors.borderSubtle}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              fontSize: "9.5px",
              color: colors.textMuted,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontFamily: fonts.mono,
            }}
          >
            Navigation
          </span>
          <span
            style={{
              fontSize: "9px",
              color: colors.textGhost,
              fontFamily: fonts.mono,
              border: `1px solid ${colors.borderSubtle}`,
              borderRadius: "10px",
              padding: "1px 7px",
            }}
          >
            {items.length}
          </span>
        </div>

        <button
          onClick={onClose}
          aria-label="Close navigation menu"
          style={{
            width: "26px",
            height: "26px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "6px",
            border: `1px solid ${colors.borderSubtle}`,
            background: "transparent",
            color: colors.textFaint,
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(244,63,94,0.1)";
            e.currentTarget.style.color = "#fb7185";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = colors.textFaint;
          }}
        >
          <FaTimes size={11} />
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
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px 10px 16px",
                borderRadius: "8px",
                border: `1px solid ${active ? "rgba(56,189,248,0.3)" : "transparent"}`,
                background: active ? colors.accentDim : "transparent",
                color: active ? colors.accent : colors.textDim,
                fontSize: "13px",
                fontFamily: fonts.display,
                fontWeight: active ? 700 : 500,
                letterSpacing: "0.01em",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s, border-color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "rgba(148,163,184,0.06)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              {/* Active accent bar */}
              {active && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "18%",
                    bottom: "18%",
                    width: "3px",
                    borderRadius: "0 3px 3px 0",
                    background: colors.accent,
                    boxShadow: "0 0 8px rgba(56,189,248,0.6)",
                  }}
                />
              )}

              {/* Icon badge */}
              <span
                style={{
                  flexShrink: 0,
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: active ? "rgba(56,189,248,0.15)" : "rgba(148,163,184,0.06)",
                  border: `1px solid ${active ? "rgba(56,189,248,0.35)" : colors.borderSubtle}`,
                  fontSize: "14px",
                  color: active ? colors.accent : colors.textFaint,
                }}
              >
                {item.icon}
              </span>

              <span>{item.label}</span>

              {active && (
                <span
                  style={{
                    marginLeft: "auto",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: colors.accent,
                    boxShadow: "0 0 8px rgba(56,189,248,0.7)",
                    flexShrink: 0,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
