/**
 * dashboard/components/DashboardStats.jsx
 *
 * Row of stat tiles (Active / Total / WS on Home). Each tile: icon badge +
 * value + label, with a colored top accent and a subtle hover lift —
 * generalized to take any tile list so it can be reused by both the admin
 * and user dashboards.
 */

import { colors, fonts } from "../theme.js";

export function DashboardStats({ stats }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
        gap: "1px",
        background: colors.border,
        borderRadius: "10px",
        overflow: "hidden",
        border: `1px solid ${colors.border}`,
      }}
    >
      {stats.map((s) => {
        const tint = s.color || colors.accent;
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
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = colors.bgCardHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = colors.bgCard)}
          >
            {/* Top accent line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "2px",
                background: `linear-gradient(90deg, transparent, ${tint}, transparent)`,
                opacity: 0.8,
              }}
            />

            {/* Icon badge */}
            <div
              style={{
                flexShrink: 0,
                width: "clamp(26px, 8vw, 34px)",
                height: "clamp(26px, 8vw, 34px)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `${tint}1a`,
                border: `1px solid ${tint}40`,
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
                    boxShadow: `0 0 8px ${tint}`,
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
                  color: colors.text,
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
                  fontSize: "8.5px",
                  color: colors.textMuted,
                  letterSpacing: "0.12em",
                  marginTop: "2px",
                  textTransform: "uppercase",
                  fontFamily: fonts.mono,
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
