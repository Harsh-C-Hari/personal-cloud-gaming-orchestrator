/**
 * dashboard/components/DashboardStats.jsx
 *
 * Row of stat tiles (Active / Total / WS on Home). Each tile: icon badge +
 * value + label, with a flat colored top accent and a subtle hover
 * background shift — generalized to take any tile list so it can be reused
 * by both the admin and user dashboards.
 *
 * compact=true (used by SessionSidebar): smaller icon (20px), smaller value
 * font (14px), white-space:nowrap so "Online" never wraps to "Onl/ine".
 * All other usage sites omit the prop and get the original sizing.
 */

import { colors, fonts, radius, surface } from "../theme.js";

function AnimatedValue({ val, style }) {
  return (
    <div style={style}>
      {val}
    </div>
  );
}

export function DashboardStats({ stats, compact = false }) {
  return (
    <div
      style={{
        display: "grid",
        // auto-fit + minmax: tiles fit in one row even inside the narrow
        // operational rail (~260-310px). Was 120px — too wide for 3 tiles
        // in a 300px column (3x97px < 120px minimum => CSS wrapped to 2 rows).
        // 80px keeps all tiles on one row at any practical rail width.
        gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))",
        gap: "1px",
        background: colors.border,
        borderRadius: `${radius.lg}px`,
        overflow: "hidden",
        border: `1.5px solid ${colors.border}`,
      }}
    >
      {stats.map((s) => {
        const tint = s.color || colors.brand;
        // compact sizing tokens — used by SessionSidebar's narrow rail
        const iconSize = compact ? "20px" : "clamp(26px, 8vw, 34px)";
        const tilePadding = compact ? "10px 10px" : "14px clamp(8px, 3vw, 16px)";
        const tileGap = compact ? "8px" : "clamp(8px, 2.5vw, 12px)";
        const valueFontSize = compact ? "14px" : "18px";
        return (
          <div
            key={s.label}
            className="pcgo-dashboard-stat-tile"
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: tileGap,
              padding: tilePadding,
              minWidth: 0,
              background: surface.l3,
              transition: "background 150ms ease",
            }}
          >
            {/* Top accent line */}
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
                width: iconSize,
                height: iconSize,
                borderRadius: `${radius.tight}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: `color-mix(in srgb, ${tint} 10%, transparent)`,
                border: `1.5px solid color-mix(in srgb, ${tint} 25%, transparent)`,
                color: tint,
                fontSize: compact ? "12px" : "14px",
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
              {/*
                compact=true: 14px + whiteSpace:nowrap so "Online" never
                breaks mid-word. Falls back to ellipsis only if the tile is
                truly tiny. Normal mode: 18px + overflowWrap:anywhere
                (original behaviour, unchanged).
              */}
              <AnimatedValue
                val={s.val}
                style={{
                  fontSize: valueFontSize,
                  fontWeight: 700,
                  color: colors.ink,
                  fontFamily: fonts.mono,
                  lineHeight: 1.1,
                  whiteSpace: compact ? "nowrap" : undefined,
                  overflowWrap: compact ? "normal" : "anywhere",
                  overflow: compact ? "hidden" : undefined,
                  textOverflow: compact ? "ellipsis" : undefined,
                }}
              />

              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: colors.inkFaint,
                  letterSpacing: "0.12em",
                  marginTop: "2px",
                  fontFamily: fonts.body,
                  whiteSpace: compact ? "nowrap" : undefined,
                  overflowWrap: compact ? "normal" : "anywhere",
                  overflow: compact ? "hidden" : undefined,
                  textOverflow: compact ? "ellipsis" : undefined,
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
