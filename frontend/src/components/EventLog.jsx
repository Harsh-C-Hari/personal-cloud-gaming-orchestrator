/**
 * components/EventLog.jsx
 *
 * Renders the WebSocket event history.
 * Purely presentational — receives events as a prop, no fetching here.
 *
 * Event shape (from session_service.py broadcast calls):
 *   { type: "status_update", session_id: string, status: string, ts: string }
 *   (ts is added by Dashboard before pushing into the events array)
 *
 * Note: "starting" and "stopped" will never appear here because the
 * backend does not broadcast those transitions. They appear only via polling.
 *
 * @param {{
 *   events    : Array<{ type, session_id, status, ts }>
 *   connected : boolean
 * }} props
 */

const STATUS_COLORS = {
  running:   "#10d98a",
  stopping: "#e46612",
  cleaning: "#4d2cf4",
  completed: "#38bdf8",
  failed:    "#e2304e",
};

const FALLBACK_COLOR = "#475569";

export function EventLog({ events, connected }) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        minHeight: 0,
      }}
    >

      {/* Header */}
      <div style={{
        display:       "flex",
        alignItems:    "center",
        gap:           "8px",
        marginBottom:  "4px",
      }}>
        {/* Live blink indicator */}
        <span style={{
          display:      "inline-block",
          width:        "5px",
          height:       "5px",
          borderRadius: "50%",
          background:   connected ? "#10d98a" : "#2d3748",
          animation:    connected ? "log-blink 2s ease-in-out infinite" : "none",
        }} />
        <span style={{
          fontSize:      "9px",
          color:         "#2d3748",
          letterSpacing: "0.13em",
          textTransform: "uppercase",
          fontFamily:    "'JetBrains Mono', monospace",
        }}>
          WS Event Log
        </span>
      </div>

      {/* Event rows */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          paddingRight: "4px",
        }}
      >
        {events.length === 0 ? (
          <span style={{
            fontSize:   "10px",
            color:      "#1e2a3a",
            fontFamily: "'JetBrains Mono', monospace",
            fontStyle:  "italic",
          }}>
            No events yet…
          </span>
        ) : (
          events.map((ev, i) => {
            const color = STATUS_COLORS[ev.status] ?? FALLBACK_COLOR;
            return (
              <div
                key={i}
                style={{
                  display:    "flex",
                  gap:        "10px",
                  alignItems: "flex-start",
                  opacity:    Math.max(0.15, 1 - i * 0.1),
                  animation:  i === 0 ? "card-in 0.2s ease forwards" : "none",
                  marginBottom: "6px",
                }}
              >
                <span style={{
                  fontSize:   "9px",
                  color:      "#2d3748",
                  fontFamily: "'JetBrains Mono', monospace",
                  flexShrink: 0,
                  paddingTop: "1px",
                }}>
                  {ev.ts}
                </span>

                <div style={{
                  fontSize:   "9px",
                  fontFamily: "'JetBrains Mono', monospace",
                  overflow:   "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}>
                  <span style={{ color: "#475569" }}>{ev.session_id}</span>
                  <span style={{ color: "#2d3748" }}>{" → "}</span>
                  <span style={{ color, textShadow: `0 0 8px ${color}80` }}>
                    {ev.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes log-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.1; }
        }
      `}</style>
    </div>
  );
}
