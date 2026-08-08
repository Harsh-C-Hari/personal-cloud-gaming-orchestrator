/**
 * components/StatusBadge.jsx
 *
 * Renders a styled badge for a session status string.
 *
 * Status strings are the exact values set by session_service.py:
 *   "starting"   — registry entry created, thread not yet running
 *   "running"    — game launched, WS broadcasts this
 *   "completed"  — game exited cleanly, WS broadcasts this
 *   "failed"     — exception in _run_session, WS broadcasts this
 *   "stopped"    — stop_session() called, NO WS broadcast (poll only)
 */

import { colors, radius } from "../dashboard/theme.js";

/** @type {Record<string, { label: string, color: string, wash: string, pulse: boolean }>} */
const STATUS_CONFIG = {
  starting:     { label: "STARTING",    color: colors.warning, wash: "rgba(245,215,110,0.14)", pulse: true  },
  running:      { label: "RUNNING",     color: colors.success, wash: "rgba(110,231,176,0.14)", pulse: true  },
  restarting:   { label: "RESTARTING",  color: colors.info,    wash: "rgba(126,200,242,0.14)", pulse: true  },
  restarted:    { label: "RESTARTED",   color: colors.success, wash: "rgba(110,231,176,0.14)", pulse: true  },
  stopping:     { label: "STOPPING",    color: colors.warning, wash: "rgba(245,215,110,0.14)", pulse: false },
  cleaning:     { label: "CLEANING",    color: colors.info,    wash: "rgba(126,200,242,0.14)", pulse: false },
  completed:    { label: "COMPLETED",   color: colors.neutral, wash: "rgba(185,183,174,0.14)", pulse: false },
  failed:       { label: "FAILED",      color: colors.danger,  wash: "rgba(255,107,107,0.14)", pulse: false },
  stopped:      { label: "STOPPED",     color: colors.inkDim,  wash: "rgba(185,183,174,0.10)", pulse: false },
};

const FALLBACK = { label: "UNKNOWN", color: colors.inkGhost, wash: "rgba(74,74,72,0.14)", pulse: false };

/**
 * @param {{ status: string }} props
 */
export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? FALLBACK;

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
        fontSize:      "9.5px",
        fontFamily:    "'JetBrains Mono', monospace",
        fontWeight:    700,
        letterSpacing: "0.13em",
        flexShrink:    0,
        userSelect:    "none",
      }}
    >
      {/* Dot indicator */}
      <span
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
