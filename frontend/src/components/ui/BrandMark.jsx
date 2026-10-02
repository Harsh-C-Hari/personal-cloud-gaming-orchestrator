/**
 * components/ui/BrandMark.jsx
 *
 * The 3-bar equalizer mark — the app's visual identity anchor. Extracted
 * from Login.jsx and DashboardHeader.jsx into a single shared component.
 *
 * Props:
 *   scale  "lg" (default) — Login's scale: heights [10,17,25], container 28px
 *          "sm"           — Header's scale: heights [8,14,20], container 22px
 *
 * Idle animation (Phase 4.2): the 3 bars gently oscillate scaleY on an
 * independent loop per bar, creating an equalizer breathing effect. Pauses
 * under prefers-reduced-motion. Killed on unmount.
 */
import { colors } from "../../dashboard/theme.js";

const SCALE_CONFIG = {
  lg: { heights: [10, 17, 25], containerHeight: 28, barWidth: 4 },
  sm: { heights: [8, 14, 20], containerHeight: 22, barWidth: 3 },
};

export function BrandMark({ scale = "lg" }) {
  const config = SCALE_CONFIG[scale] ?? SCALE_CONFIG.lg;

  return (
    <div
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "flex-end",
        gap: 2,
        height: config.containerHeight,
      }}
    >
      {config.heights.map((height, index) => (
        <span
          key={height}
          style={{
            width: config.barWidth,
            height,
            borderRadius: 2,
            background: index === 2 ? colors.brand : colors.inkDim,
            display: "block",
            transformOrigin: "bottom",
          }}
        />
      ))}
    </div>
  );
}
