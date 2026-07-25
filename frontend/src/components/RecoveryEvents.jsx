/**
 * components/RecoveryEvents.jsx
 *
 * Same props (recoveryEvents, recoveryEventsLoading, showAllRecoveryEvents
 * + its setter) and same slice-to-3/show-all logic — only the presentation
 * was reworked: a timeline-style list with per-event-type icons instead of
 * plain text rows, and a proper empty state.
 */

import {
  FaHistory,
  FaCheckCircle,
  FaTimesCircle,
  FaSyncAlt,
  FaInfoCircle,
} from "react-icons/fa";

const palette = {
  border: "rgba(148,163,184,0.18)",
  borderSubtle: "#1c2130",
  card: "rgba(0, 0, 0, 0.45)",
  text: "#e2e8f0",
  dim: "#94a3b8",
  faint: "#64748b",
  muted: "#475569",
  accent: "#38bdf8",
  success: "#10d98a",
  warning: "#f59e0b",
  danger: "#ef4444",
  mono: "'JetBrains Mono', monospace",
};

function eventVisual(eventType) {
  switch (eventType) {
    case "restart_success":
      return { color: palette.success, icon: <FaCheckCircle size={12} /> };
    case "restart_failed":
      return { color: palette.danger, icon: <FaTimesCircle size={12} /> };
    case "restart_attempt":
      return { color: palette.warning, icon: <FaSyncAlt size={12} /> };
    default:
      return { color: palette.accent, icon: <FaInfoCircle size={12} /> };
  }
}

export function RecoveryEvents({
  recoveryEvents,
  recoveryEventsLoading,
  showAllRecoveryEvents,
  setShowAllRecoveryEvents,
}) {
  const displayedRecoveryEvents = showAllRecoveryEvents ? recoveryEvents : recoveryEvents.slice(0, 3);

  return (
    <section
      style={{
        padding: "16px",
        border: `1px solid ${palette.border}`,
        borderRadius: "10px",
        background: "rgba(0, 0, 0, 0.6)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(56,189,248,0.12)",
              border: "1px solid rgba(56,189,248,0.3)",
              color: palette.accent,
            }}
          >
            <FaHistory size={12} />
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: "13px",
              letterSpacing: "0.12em",
              color: palette.text,
              fontFamily: palette.mono,
            }}
          >
            RECOVERY EVENTS
          </h2>
        </div>

        {recoveryEvents.length > 0 && (
          <span
            style={{
              fontSize: "9px",
              color: palette.faint,
              fontFamily: palette.mono,
              border: `1px solid ${palette.borderSubtle}`,
              borderRadius: "10px",
              padding: "1px 8px",
            }}
          >
            {recoveryEvents.length}
          </span>
        )}
      </div>

      {recoveryEventsLoading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "9px", color: palette.dim, fontFamily: palette.mono, fontSize: "11.5px" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: palette.accent, animation: "re-pulse 1.4s ease-in-out infinite" }} />
          Loading recovery events...
        </div>
      ) : recoveryEvents.length === 0 ? (
        <div
          style={{
            padding: "26px",
            textAlign: "center",
            border: `1px dashed ${palette.borderSubtle}`,
            borderRadius: "8px",
            color: palette.muted,
            fontSize: "11px",
            fontFamily: palette.mono,
          }}
        >
          No recovery events recorded yet.
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {displayedRecoveryEvents.map((event) => {
              const { color, icon } = eventVisual(event.event);

              return (
                <div
                  key={`${event.time}-${event.event}`}
                  style={{
                    padding: "11px 12px",
                    borderRadius: "8px",
                    background: palette.card,
                    border: `1px solid ${palette.borderSubtle}`,
                    borderLeft: `2px solid ${color}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", gap: "10px", minWidth: 0 }}>
                    <div style={{ color, flexShrink: 0, marginTop: "1px" }}>{icon}</div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: palette.text, fontSize: "11px", fontWeight: 700, fontFamily: palette.mono }}>
                        {event.service.toUpperCase()}
                      </div>

                      <div style={{ color: palette.dim, fontSize: "10.5px", fontFamily: palette.mono, marginTop: "1px" }}>
                        {event.event.replaceAll("_", " ")}
                      </div>

                      {event.details?.failure_mode != null && event.event === "failure_detected" && (
                        <div style={metaLine}>Mode: {event.details.failure_mode}</div>
                      )}

                      {event.details?.state != null && event.event === "initial_state" && (
                        <div style={metaLine}>State: {event.details.state}</div>
                      )}

                      {event.details?.attempt != null && event.details?.attempt !== 0 && (
                        <div style={metaLine}>Attempt: {event.details.attempt}</div>
                      )}

                      <div style={{ color: palette.muted, fontSize: "9px", marginTop: "4px", fontFamily: palette.mono }}>
                        {new Date(event.time * 1000).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      flexShrink: 0,
                      padding: "3px 8px",
                      borderRadius: "999px",
                      background: `${color}22`,
                      border: `1px solid ${color}55`,
                      color,
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      fontFamily: palette.mono,
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {event.event.replaceAll("_", " ")}
                  </div>
                </div>
              );
            })}
          </div>

          {recoveryEvents.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllRecoveryEvents(!showAllRecoveryEvents)}
              style={{
                width: "100%",
                marginTop: "10px",
                border: `1px solid ${palette.border}`,
                background: "rgba(0, 0, 0, 0.45)",
                color: palette.dim,
                borderRadius: "6px",
                padding: "7px",
                fontSize: "9px",
                fontFamily: palette.mono,
                letterSpacing: "0.08em",
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = palette.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = palette.dim;
              }}
            >
              {showAllRecoveryEvents ? "SHOW LESS" : `SHOW ALL (${recoveryEvents.length})`}
            </button>
          )}
        </div>
      )}

      <style>{`@keyframes re-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </section>
  );
}

const metaLine = {
  color: "#64748b",
  fontSize: "9px",
  marginTop: "2px",
  fontFamily: "'JetBrains Mono', monospace",
};
