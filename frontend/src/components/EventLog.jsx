/**
 * components/EventLog.jsx
 *
 * Renders the WebSocket event history.
 * Purely presentational — receives events as a prop, no fetching here.
 * Same props/data contract as before (events, connected); only the visual
 * design was reworked for a more production/professional look.
 *
 * Event shape (from session_service.py broadcast calls):
 *   { type: "status_update", session_id: string, status: string, ts: string, date: string }
 *   (ts/date are added by the dashboard before pushing into the events array)
 *
 * Note: "starting" and "stopped" will never appear here because the
 * backend does not broadcast those transitions. They appear only via polling.
 *
 * @param {{
 *   events    : Array<{ type, session_id, status, ts }>
 *   connected : boolean
 * }} props
 */

const STATUS_STYLES = {
  starting: { color: "#38bdf8", bg: "rgba(56,189,248,0.12)", label: "Starting" },
  running: { color: "#10d98a", bg: "rgba(16,217,138,0.12)", label: "Running" },
  restarted: { color: "#179f69", bg: "rgba(23,159,105,0.12)", label: "Restarted" },
  stopping: { color: "#f5a524", bg: "rgba(245,165,36,0.12)", label: "Stopping" },
  cleaning: { color: "#818cf8", bg: "rgba(129,140,248,0.12)", label: "Cleaning" },
  completed: { color: "#38bdf8", bg: "rgba(56,189,248,0.12)", label: "Completed" },
  failed: { color: "#f43f5e", bg: "rgba(244,63,94,0.12)", label: "Failed" },
};

const FALLBACK_STYLE = { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", label: "Update" };

export function EventLog({ events, connected }) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              display: "inline-block",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: connected ? "#10d98a" : "#334155",
              boxShadow: connected ? "0 0 8px rgba(16,217,138,0.7)" : "none",
              animation: connected ? "log-blink 2s ease-in-out infinite" : "none",
            }}
          />
          <span
            style={{
              fontSize: "10px",
              color: "#64748b",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
            }}
          >
            Event Stream
          </span>
        </div>

        <span
          style={{
            fontSize: "9px",
            color: "#475569",
            fontFamily: "'JetBrains Mono', monospace",
            border: "1px solid #1c2130",
            borderRadius: "10px",
            padding: "1px 8px",
          }}
        >
          {events.length}
        </span>
      </div>

      {/* Event rows */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          paddingRight: "2px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {events.length === 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              minHeight: "60px",
              fontSize: "11px",
              color: "#334155",
              fontFamily: "'JetBrains Mono', monospace",
              fontStyle: "italic",
            }}
          >
            Waiting for activity…
          </div>
        ) : (
          events.map((ev, i) => {
            const style = STATUS_STYLES[ev.status] ?? FALLBACK_STYLE;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "7px 10px 7px 9px",
                  borderRadius: "6px",
                  borderLeft: `2px solid ${style.color}`,
                  background: "rgba(15,17,23,0.5)",
                  animation: i === 0 ? "card-in 0.2s ease forwards" : "none",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(21,24,33,0.75)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(15,17,23,0.5)")}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "1px",
                    flexShrink: 0,
                    minWidth: "64px",
                  }}
                >
                  {ev.date && (
                    <span
                      style={{
                        fontSize: "8px",
                        color: "#334155",
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {ev.date}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: "9px",
                      color: "#475569",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {ev.ts}
                  </span>
                </div>

                <span
                  style={{
                    flexShrink: 0,
                    width: "84px",
                    boxSizing: "border-box",
                    textAlign: "center",
                    fontSize: "8.5px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: style.color,
                    background: style.bg,
                    borderRadius: "10px",
                    padding: "2px 6px",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {style.label}
                </span>

                <span
                  style={{
                    fontSize: "10px",
                    color: "#64748b",
                    fontFamily: "'JetBrains Mono', monospace",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                  title={ev.session_id}
                >
                  {ev.session_id}
                </span>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes log-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.15; }
        }
      `}</style>
    </div>
  );
}
