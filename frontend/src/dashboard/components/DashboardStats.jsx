/**
 * dashboard/components/DashboardStats.jsx
 *
 * Row of stat tiles (Active / Total / WS on Home). Each tile: icon badge +
 * value + label, with a flat colored top accent and a subtle hover
 * background shift — generalized to take any tile list so it can be reused
 * by both the admin and user dashboards.
 */

import { colors, fonts, radius } from "../theme.js";

export function DashboardStats({ stats }) {
  return (
    <div
      style={{
        display: "grid",
        // auto-fit + minmax instead of a hard `repeat(N, 1fr)`: on narrow
        // viewports tiles wrap onto additional rows instead of being
        // squeezed into unreadably thin columns.
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: "1px",
        background: colors.border,
        borderRadius: `${radius.lg}px`,
        overflow: "hidden",
        border: `1.5px solid ${colors.border}`,
      }}
    >
      {stats.map((s) => {
        const tint = s.color || colors.brand;
        return (
          <div
            key={s.label}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: "clamp(8px, 2.5vw, 12px)",
              padding: "14px clamp(8px, 3vw, 16px)",
              minWidth: 0,
              background: colors.bgCard,
              transition: "background 150ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = colors.bgCardHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = colors.bgCard)}
          >
            {/* Top accent line — flat, no gradient */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: tint,
                opacity: 0.7,
              }}
            />

            {/* Icon badge */}
            <div
              style={{
                flexShrink: 0,
                width: "clamp(26px, 8vw, 34px)",
                height: "clamp(26px, 8vw, 34px)",
                borderRadius: `${radius.sm}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `color-mix(in srgb, ${tint} 10%, transparent)`,
                border: `1.5px solid color-mix(in srgb, ${tint} 25%, transparent)`,
                color: tint,
                fontSize: "14px",
              }}
            >
              {s.icon ?? (
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: tint,
                    display: "block",
                  }}
                />
              )}
            </div>

            <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: colors.ink,
                  fontFamily: fonts.mono,
                  lineHeight: 1.1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {s.val}
              </div>

              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: colors.inkFaint,
                  letterSpacing: "0.12em",
                  marginTop: "2px",
                  textTransform: "uppercase",
                  fontFamily: fonts.body,
                  whiteSpace: "nowrap",
                }}
              >
                {s.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
