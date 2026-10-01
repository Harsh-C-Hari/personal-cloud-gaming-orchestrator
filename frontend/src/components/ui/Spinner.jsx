/**
 * components/ui/Spinner.jsx
 *
 * Standalone loading spinner. Uses the global `spin` keyframe (base.css §1.2).
 * The animation name `cgo-spin` is the canonical merged alias (1.2 cleanup).
 */

import { colors } from "../../dashboard/theme.js";

/**
 * @param {{ size?: number, style?: React.CSSProperties }} props
 */
export function Spinner({ size = 20, style }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{
        display:      "inline-block",
        width:        size,
        height:       size,
        borderRadius: "50%",
        border:       `2px solid ${colors.border}`,
        borderTopColor: colors.brand,
        animation:    "cgo-spin 0.7s linear infinite",
        flexShrink:   0,
        ...style,
      }}
    />
  );
}
