/**
 * components/StatusBadge.jsx
 *
 * 3.5: Renders a styled badge for a session/host status string.
 * Uses the canonical STATUS_MAP from src/dashboard/status.js (D3).
 *
 * Non-interactive (cursor: default, no role="button").
 * Dot is aria-hidden; the label text carries the meaning.
 * Pulse only for in-progress states (badge-pulse keyframe in base.css).
 */

import { getStatusTone } from "../dashboard/status.js";
import { radius, motion } from "../dashboard/theme.js";

/**
 * @param {{ status: string }} props
 */
export function StatusBadge({ status }) {
  const cfg = getStatusTone(status);

  return (
    <span
      style={{
        display:       "inline-flex",
        alignItems:    "center",
        gap:           "6px",
        padding:       "3px 10px 3px 7px",
        borderRadius:  `${radius.full}px`,
        background:    cfg.wash,
        border:        `1.5px solid ${cfg.color}4d`,
        color:         cfg.color,
        fontSize:      "12px",
        fontWeight:    500,
        letterSpacing: "0",
        flexShrink:    0,
        userSelect:    "none",
        cursor:        "default",
        transition:    `color ${motion.transition}, background ${motion.transition}, border-color ${motion.transition}`,
      }}
    >
      {/* Decorative dot — aria-hidden, label carries the status meaning */}
      <span
        aria-hidden="true"
        style={{
          width:        6,
          height:       6,
          borderRadius: "50%",
          background:   cfg.color,
          flexShrink:   0,
          animation:    cfg.pulse ? "badge-pulse 1.6s ease-in-out infinite" : "none",
        }}
      />
      {cfg.label}
    </span>
  );
}
