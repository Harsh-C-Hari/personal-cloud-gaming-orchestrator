/**
 * components/RecoveryEvents.jsx
 *
 * Same props (recoveryEvents, recoveryEventsLoading, showAllRecoveryEvents
 * + its setter) and same slice-to-3/show-all logic — only the presentation
 * was reworked to the "Chalkboard Neo-Brutalist" system: flat tokens from
 * theme.js instead of a local cyan-glow palette, lucide-react icons instead
 * of react-icons/fa, and flat pill styling (no `color+opacity-hex` glow
 * borders) matching StatusBadge/HostStatusPanel's Badge.
 */

import { History, CheckCircle2, XCircle, RefreshCw, Info } from "lucide-react";
import { colors, fonts, radius } from "../dashboard/theme.js";

function eventVisual(eventType) {
  switch (eventType) {
    case "restart_success":
      return { color: colors.success, icon: <CheckCircle2 size={12} strokeWidth={2} /> };
    case "recovered":
      return { color: colors.success, icon: <CheckCircle2 size={12} strokeWidth={2} /> };
    case "restart_failed":
      return { color: colors.danger, icon: <XCircle size={12} strokeWidth={2} /> };
    case "restart_attempt":
      return { color: colors.warning, icon: <RefreshCw size={12} strokeWidth={2} /> };
    default:
      return { color: colors.accentBlue, icon: <Info size={12} strokeWidth={2} /> };
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
    <section style={box}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", rowGap: "6px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <div style={headerIcon}>
            <History size={13} strokeWidth={2} />
          </div>
          <h2 style={title}>Recovery Events</h2>
        </div>

        {recoveryEvents.length > 0 && (
          <span style={countPill}>{recoveryEvents.length}</span>
        )}
      </div>

      {recoveryEventsLoading ? (
        <div style={{ display: "flex", alignItems: "center", gap: "9px", color: colors.inkDim, fontFamily: fonts.mono, fontSize: "11.5px" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: colors.brand, animation: "badge-pulse 1.6s ease-in-out infinite" }} />
          Loading recovery events...
        </div>
      ) : recoveryEvents.length === 0 ? (
        <div style={emptyBox}>No recovery events recorded yet.</div>
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
                    borderRadius: `${radius.md}px`,
                    background: colors.bgInset,
                    border: `1.5px solid ${colors.border}`,
                    borderLeft: `2px solid ${color}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    rowGap: "6px",
                    gap: "10px",
                  }}
                >
                  <div style={{ display: "flex", gap: "10px", minWidth: 0 }}>
                    <div style={{ color, flexShrink: 0, marginTop: "1px" }}>{icon}</div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: colors.ink, fontSize: "11px", fontWeight: 700, fontFamily: fonts.mono }}>
                        {event.service.toUpperCase()}
                      </div>

                      <div style={{ color: colors.inkDim, fontSize: "10.5px", fontFamily: fonts.mono, marginTop: "1px" }}>
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

                      <div style={{ color: colors.inkFaint, fontSize: "9px", marginTop: "4px", fontFamily: fonts.mono }}>
                        {new Date(event.time * 1000).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      flexShrink: 0,
                      padding: "3px 8px",
                      borderRadius: `${radius.full}px`,
                      background: `${color}22`,
                      border: `1.5px solid ${color}4d`,
                      color,
                      fontSize: "9px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      fontFamily: fonts.mono,
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
              style={showAllButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colors.ink;
                e.currentTarget.style.borderColor = colors.borderStrong;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = colors.inkDim;
                e.currentTarget.style.borderColor = colors.border;
              }}
            >
              {showAllRecoveryEvents ? "SHOW LESS" : `SHOW ALL (${recoveryEvents.length})`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

const metaLine = {
  color: colors.inkFaint,
  fontSize: "9px",
  marginTop: "2px",
  fontFamily: fonts.mono,
};

const box = {
  padding: "20px",
  border: `1.5px solid ${colors.border}`,
  borderRadius: `${radius.lg}px`,
  background: colors.bgCard,
};

const title = {
  margin: 0,
  fontSize: "15px",
  fontWeight: 700,
  color: colors.ink,
  fontFamily: fonts.display,
};

const headerIcon = {
  width: "28px",
  height: "28px",
  borderRadius: `${radius.sm}px`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: colors.brandDim,
  border: `1.5px solid ${colors.brand}`,
  color: colors.brand,
};

const countPill = {
  fontSize: "10px",
  color: colors.inkFaint,
  fontFamily: fonts.mono,
  fontWeight: 700,
  border: `1.5px solid ${colors.borderSubtle}`,
  borderRadius: `${radius.full}px`,
  padding: "1px 8px",
};

const emptyBox = {
  padding: "26px",
  textAlign: "center",
  border: `1.5px dashed ${colors.borderSubtle}`,
  borderRadius: `${radius.md}px`,
  color: colors.inkFaint,
  fontSize: "11px",
  fontFamily: fonts.mono,
};

const showAllButton = {
  width: "100%",
  marginTop: "10px",
  border: `1.5px solid ${colors.border}`,
  background: "transparent",
  color: colors.inkDim,
  borderRadius: `${radius.full}px`,
  padding: "8px",
  fontSize: "9px",
  fontFamily: fonts.mono,
  letterSpacing: "0.08em",
  fontWeight: 700,
  cursor: "pointer",
  transition: "color 150ms ease, border-color 150ms ease",
};
