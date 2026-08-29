/**
 * components/EventLog.jsx
 *
 * Renders the WebSocket event history.
 * Purely presentational — receives events as a prop, no fetching here.
 * Same props/data contract as before (events, connected); only the visual
 * design was reworked to flat Chalkboard Neo-Brutalist tokens (no glow).
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

import { useEffect, useRef, useState } from "react";
import { colors, fonts } from "../dashboard/theme.js";

const STATUS_STYLES = {
  starting: { color: colors.info, label: "Starting" },
  running: { color: colors.success, label: "Running" },
  restarted: { color: colors.success, label: "Restarted" },
  stopping: { color: colors.warning, label: "Stopping" },
  cleaning: { color: colors.info, label: "Cleaning" },
  completed: { color: colors.info, label: "Completed" },
  failed: { color: colors.danger, label: "Failed" },
};

const FALLBACK_STYLE = { color: colors.inkDim, label: "Update" };
const ANNOUNCED_STATUSES = new Set(["starting", "running", "restarted", "stopping", "cleaning", "completed", "failed"]);
const visuallyHidden = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export function EventLog({ events, connected }) {
  const [announcement, setAnnouncement] = useState("");
  const lastAnnouncedKey = useRef(null);
  const latest = events[0];
  const latestKey = latest
    ? [latest.type, latest.session_id, latest.status, latest.message].filter(Boolean).join("|")
    : "";
  const latestStyle = latest ? STATUS_STYLES[latest.status] ?? FALLBACK_STYLE : FALLBACK_STYLE;
  const latestMessage = latest?.message || latestStyle.label;
  const shouldAnnounce = Boolean(latest && (ANNOUNCED_STATUSES.has(latest.status) || latest.type === "recovery_event" || latest.type === "host_state_update"));

  useEffect(() => {
    if (!latestKey) return;
    if (lastAnnouncedKey.current === null) {
      lastAnnouncedKey.current = latestKey;
      return;
    }
    if (lastAnnouncedKey.current === latestKey) return;

    lastAnnouncedKey.current = latestKey;
    if (!shouldAnnounce) return;

    setAnnouncement(`${latestStyle.label}: ${latestMessage}${latest?.session_id ? `, session ${latest.session_id}` : ""}`);
    const timeoutId = window.setTimeout(() => setAnnouncement(""), 1800);
    return () => window.clearTimeout(timeoutId);
  }, [latestKey, latestMessage, latest?.session_id, latestStyle.label, shouldAnnounce]);

  return (
    <div
      className="pcgo-event-stream"
      style={{
        flex: "1 1 auto",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        minHeight: 0,
      }}
    >
      <span role="status" aria-live="polite" aria-atomic="true" style={visuallyHidden}>{announcement}</span>
      {/* Header */}
      <div
        className="pcgo-event-stream__header"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          rowGap: "6px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              display: "inline-block",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: connected ? colors.success : colors.inkGhost,
              // P6-T05 motion audit: keyframe-based `animation:`, same
              // non-convertible category as StatusBadge.jsx's pulse (this task)
              // and primitives.jsx's Spinner (P6-T02) — no `motion` equivalent
              // for a @keyframes reference. Left as the original literal.
              animation: connected ? "log-blink 2s ease-in-out infinite" : "none",
            }}
          />
          <span
            style={{
              fontSize: "10px",
              color: colors.inkFaint,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: fonts.mono,
              fontWeight: 700,
            }}
          >
            Event Stream
          </span>
        </div>

        <span
          style={{
            fontSize: "9px",
            color: colors.inkFaint,
            fontFamily: fonts.mono,
            border: `1.5px solid ${colors.borderSubtle}`,
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
              color: colors.inkGhost,
              fontFamily: fonts.mono,
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
                className={`pcgo-event-stream__row${i === 0 ? " pcgo-event-stream__row--latest" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "7px 10px 7px 9px",
                  borderRadius: "6px",
                  borderLeft: `2px solid ${style.color}`,
                  background: colors.bgInset,
                  // P6-T05 motion audit: keyframe-based `animation:` (not
                  // `transition:`), so not eligible for a `motion.*` alias
                  // regardless of duration. Flagging the trap explicitly: this
                  // 180ms duration coincides with motion.pill's 180ms, but
                  // motion.pill's easing is cubic-bezier(0.4,0,0.2,1), not the
                  // plain "ease" used here — the easing mismatch means this
                  // would not qualify as a genuine exact match even if it were
                  // a `transition:`. Same duration-only-coincidence trap P6-T04
                  // correctly caught with ConfirmDialog.jsx/Toast.jsx's 0.18s
                  // values. Left as the original literal.
                  animation: i === 0 ? "card-in 180ms ease forwards" : "none",
                  // P6-T05 motion audit: real `transition:`, but 150ms doesn't
                  // exactly match any `motion` step (fast: 100ms, base: 160ms,
                  // cardIn: 220ms, pill: 180ms cubic-bezier). Left as the
                  // original literal; no conversion.
                  transition: "background 150ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = colors.bgCardHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = colors.bgInset)}
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
                        color: colors.inkGhost,
                        fontFamily: fonts.mono,
                        letterSpacing: "0.02em",
                      }}
                    >
                      {ev.date}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: "9px",
                      color: colors.inkFaint,
                      fontFamily: fonts.mono,
                    }}
                  >
                    {ev.ts}
                  </span>
                </div>

                <span
                  className="pcgo-event-stream__status"
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
                    background: `${style.color}24`,
                    borderRadius: "10px",
                    padding: "2px 6px",
                    fontFamily: fonts.mono,
                  }}
                >
                  {style.label}
                </span>

                <span
                  style={{
                    fontSize: "10px",
                    color: colors.inkFaint,
                    fontFamily: fonts.mono,
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
          50%       { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
