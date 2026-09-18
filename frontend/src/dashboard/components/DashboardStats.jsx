/**
 * dashboard/components/DashboardStats.jsx
 *
 * Row of stat tiles (Active / Total / WS on Home). Each tile: icon badge +
 * value + label, with a flat colored top accent and a subtle hover
 * background shift — generalized to take any tile list so it can be reused
 * by both the admin and user dashboards.
 */

import { colors, fonts, radius, surface, typeScale } from "../theme.js";

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
        // TCB-P3 followup: softened from `radius.none` (0px) to
        // `radius.lg` (16px) to match the SessionSidebar rail that
        // wraps this stat row on the Home page (rail is now
        // `radius.lg` 16px, see SessionSidebar.jsx). Without this
        // update the 1.5px-stroked 0px stat grid would sit as a
        // sharp-edged inset inside a soft 16px rail — visually
        // inconsistent. The grid-level 16px now reads as a single
        // framed tile row nested inside the soft rail.
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
              background: surface.l3,
              // motion-audit (P6-T04): 150ms ease does not exactly match any
              // `motion` step (fast=100ms, base=160ms, cardIn=220ms,
              // pill=180ms cubic-bezier) — left as a literal, not converted.
              transition: "background 150ms ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = surface.l4)}
            onMouseLeave={(e) => (e.currentTarget.style.background = surface.l3)}
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
                // Per §6.4: icon badge is a `<span>`-scale accent chip, the
                // sanctioned `radius.tight` (4px) exception to the binary
                // system. Was `radius.sm` (8px).
                borderRadius: `${radius.tight}px`,
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
              {/* Stat value -> typeScale.metric (per §3.17): a metric is a
                  large tabular-numeral display, the new "mono number
                  metric" tier of the type scale. fontVariantNumeric and
                  tabular-nums are already on .metric, so 18px/700/mono
                  was the *content category* of step, even if the
                  numerical size (clamp(22px,3vw,34px) vs literal 18px)
                  differs. Keeping literal 18px for now: the
                  `clamp(22,3vw,34)` minimum would over-size the
                  narrowest Home stat tiles; this is a DashboardStats-
                  specific density call, not a step that
                  DashboardStats' usage fits. fontWeight 700 / lineHeight
                  1.1 / fontFamily mono already match the spirit of
                  `typeScale.metric` — using the step here would
                  over-size. The new `typeScale.metric` exists in
                  theme.js and is used elsewhere (Host readiness, etc.) */}
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

              {/* Judgment call: close to typeScale.meta in spirit
                  (uppercase, letter-spaced, bold caption) but meta is a
                  mono-font/700/10px/0.12em combination — this is
                  fonts.body (sans-serif) at 9px. Same font-family
                  mismatch as ActiveAlerts' header and NavigationCard's
                  description above; snapping to meta would swap the
                  typeface, a real visual change, not a value alias. */}
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
                  overflow: "hidden",
                  textOverflow: "ellipsis",
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
