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

/** @type {Record<string, { label: string, color: string, glow: string, pulse: boolean }>} */
const STATUS_CONFIG = {
  starting:  { label: "STARTING",  color: "#0a39f5", glow: "rgba(245,158,11,0.5)",  pulse: true  },
  running:   { label: "RUNNING",   color: "#10d98a", glow: "rgba(16,217,138,0.55)", pulse: true  },
  stopping:  { label: "STOPPING",  color: "#e46612", glow: "rgba(244,63,94,0.5)",   pulse: false },
  cleaning:  { label: "CLEANING",  color: "#4d2cf4", glow: "rgba(56,189,248,0.45)", pulse: false },
  completed: { label: "COMPLETED",  color: "#5d696f", glow: "rgba(56,189,248,0.45)", pulse: false },
  failed:    { label: "FAILED",    color: "#de193a", glow: "rgba(244,63,94,0.5)",   pulse: false },
  stopped:   { label: "STOPPED",   color: "#e6a822", glow: "rgba(100,116,139,0.3)", pulse: false },
};

const FALLBACK = { label: "UNKNOWN", color: "#475569", glow: "transparent", pulse: false };

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
        borderRadius:  "3px",
        background:    `${cfg.color}12`,
        border:        `1px solid ${cfg.color}30`,
        color:         cfg.color,
        fontSize:      "9.5px",
        fontFamily:    "'JetBrains Mono', monospace",
        fontWeight:    700,
        letterSpacing: "0.13em",
        textShadow:    `0 0 10px ${cfg.glow}`,
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
          boxShadow:    `0 0 7px ${cfg.color}`,
          flexShrink:   0,
          animation:    cfg.pulse ? "badge-pulse 1.6s ease-in-out infinite" : "none",
        }}
      />
      {cfg.label}

      {/* Scoped keyframe — injected once into DOM */}
      <style>{`
        @keyframes badge-pulse {
          0%, 100% { opacity: 1;    transform: scale(1);    }
          50%       { opacity: 0.2; transform: scale(0.8);  }
        }
      `}</style>
    </span>
  );
}
