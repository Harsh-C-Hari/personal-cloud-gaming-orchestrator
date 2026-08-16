import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Gamepad2,
  History,
  Info,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { fetchSessionHistory, fetchSessionEvents } from "../api/client";
import { colors, fonts, radius } from "../dashboard/theme.js";

function formatPlayedTime(seconds) {
  if (seconds == null) return "--";

  const totalSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return `${mins}m ${secs}s`;
}

function formatDate(timestamp) {
  if (!timestamp) return "--";

  return new Date(timestamp * 1000).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatStatus(status) {
  return status ? status.replace(/_/g, " ").toUpperCase() : "UNKNOWN";
}

function getStatusBadge(item) {
  if (item.error === "Recovered after backend restart") {
    return {
      key: "recovered",
      text: "RECOVERED",
      color: colors.warning,
      icon: <RefreshCw size={10} strokeWidth={2} />,
    };
  }

  if (item.status === "completed") {
    return {
      key: "completed",
      text: "COMPLETED",
      color: colors.success,
      icon: <CheckCircle2 size={10} strokeWidth={2} />,
    };
  }

  if (item.status === "failed") {
    return {
      key: "failed",
      text: "FAILED",
      color: colors.danger,
      icon: <XCircle size={10} strokeWidth={2} />,
    };
  }

  return {
    key: "unknown",
    text: formatStatus(item.status),
    color: colors.neutral,
    icon: <Info size={10} strokeWidth={2} />,
  };
}

function sessionDetailId(sessionId) {
  const safeId = String(sessionId || "session").replace(/[^a-zA-Z0-9_-]/g, "-");
  return `session-history-detail-${safeId}`;
}

function LoadingRows() {
  return (
    <div className="pcgo-session-history-loading" role="status" aria-live="polite" aria-label="Loading session history">
      {[1, 2, 3].map((row) => (
        <div className="pcgo-session-history-loading__row" key={row}>
          <span className="pcgo-session-history-loading__game" />
          <span className="pcgo-session-history-loading__meta" />
          <span className="pcgo-session-history-loading__status" />
        </div>
      ))}
    </div>
  );
}

export function SessionHistory({ refreshKey = 0 }) {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState("");
  const [sessionEvents, setSessionEvents] = useState({});
  const [sessionEventLoading, setSessionEventLoading] = useState({});
  const [sessionEventErrors, setSessionEventErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);

  async function loadHistory() {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      const data = await fetchSessionHistory(10);
      setHistory(data.history || []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load session history.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  async function toggleSessionEvents(sessionId) {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId("");
      return;
    }

    setExpandedSessionId(sessionId);

    if (Object.prototype.hasOwnProperty.call(sessionEvents, sessionId)) {
      return;
    }

    setSessionEventLoading((prev) => ({ ...prev, [sessionId]: true }));
    setSessionEventErrors((prev) => ({ ...prev, [sessionId]: "" }));

    try {
      const data = await fetchSessionEvents({ sessionId, limit: 20 });
      setSessionEvents((prev) => ({
        ...prev,
        [sessionId]: data.events || [],
      }));
    } catch (err) {
      setSessionEventErrors((prev) => ({
        ...prev,
        [sessionId]: err.message || "Failed to load lifecycle events.",
      }));
    } finally {
      setSessionEventLoading((prev) => ({ ...prev, [sessionId]: false }));
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (!refreshKey) return;
    loadHistory();
  }, [refreshKey]);

  const visibleHistory = expanded ? history : history.slice(0, 3);
  const totalPlayedSeconds = history.reduce((sum, item) => sum + (item.played_seconds || 0), 0);
  const completedCount = history.filter((item) => item.status === "completed").length;
  const recoveredCount = history.filter((item) => item.error === "Recovered after backend restart").length;
  const failedCount = history.filter(
    (item) => item.status === "failed" && item.error !== "Recovered after backend restart"
  ).length;
  const hasHistory = history.length > 0;

  return (
    <section className="pcgo-session-history" style={box} aria-labelledby="session-history-title">
      <div className="pcgo-session-history__header">
        <div className="pcgo-session-history__heading">
          <div style={headerIcon}>
            <History size={13} strokeWidth={2} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="pcgo-session-history__eyebrow">AUTHORITATIVE RECORD</div>
            <h2 id="session-history-title" style={title}>Session History</h2>
            <p className="pcgo-session-history__description">Completed and failed sessions, ordered by most recent end time.</p>
          </div>
          {hasHistory && <span style={countPill}>{history.length} RECORDS</span>}
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={loadHistory}
          aria-label={loading ? "Refreshing session history" : "Refresh session history"}
          style={{
            ...refreshButton,
            flexShrink: 0,
            minHeight: "32px",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (loading) return;
            e.currentTarget.style.color = colors.ink;
            e.currentTarget.style.borderColor = colors.borderStrong;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = colors.inkDim;
            e.currentTarget.style.borderColor = colors.border;
          }}
        >
          <RefreshCw size={11} strokeWidth={2} style={loading ? { animation: "sh-spin 0.8s linear infinite" } : undefined} />
          {loading ? "REFRESHING..." : "REFRESH"}
        </button>
      </div>

      <div className="pcgo-session-history__window-note">
        <Info size={11} strokeWidth={2} />
        Showing the latest {history.length || 10} records returned by the history service.
      </div>

      {hasHistory && (
        <div className="pcgo-session-history__summary" aria-label="History summary">
          <div style={statTile}>
            <div style={statIcon}><History size={13} strokeWidth={2} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={statValue}>{history.length}</div>
              <div style={statLabel}>Records in view</div>
            </div>
          </div>
          <div style={statTile}>
            <div style={{ ...statIcon, color: colors.success, borderColor: colors.success, background: colors.accentGreenDim }}><CheckCircle2 size={13} strokeWidth={2} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={statValue}>{completedCount}</div>
              <div style={statLabel}>Completed</div>
            </div>
          </div>
          <div style={statTile}>
            <div style={{ ...statIcon, color: colors.danger, borderColor: colors.danger, background: colors.dangerDim }}><XCircle size={13} strokeWidth={2} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={statValue}>{failedCount}</div>
              <div style={statLabel}>Failed</div>
            </div>
          </div>
          <div style={statTile}>
            <div style={{ ...statIcon, color: colors.brand }}><Clock size={13} strokeWidth={2} /></div>
            <div style={{ minWidth: 0 }}>
              <div style={statValue}>{formatPlayedTime(totalPlayedSeconds)}</div>
              <div style={statLabel}>Played in record</div>
            </div>
          </div>
        </div>
      )}

      {recoveredCount > 0 && (
        <div className="pcgo-session-history__recovery-note" role="status">
          <RefreshCw size={11} strokeWidth={2} />
          {recoveredCount} record{recoveredCount === 1 ? "" : "s"} recovered after backend restart.
        </div>
      )}

      {error && (
        <div style={errorBox} role="alert">
          <AlertTriangle size={12} strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}

      {loading && !hasHistory && <LoadingRows />}

      {!loading && !error && !hasHistory && (
        <div style={emptyBox} role="status">
          <History size={19} strokeWidth={1.5} />
          <strong>No historical sessions yet.</strong>
          <span>Completed and failed sessions will appear here after the first session lifecycle finishes.</span>
        </div>
      )}

      {hasHistory && (
        <div className="pcgo-session-history__list" aria-label="Historical sessions">
          {visibleHistory.map((item) => {
            const badge = getStatusBadge(item);
            const integrityOk = item.integrity_verified === true;
            const detailsId = sessionDetailId(item.session_id);
            const isExpanded = expandedSessionId === item.session_id;

            return (
              <article
                key={item.session_id}
                className="pcgo-session-history__record"
                style={{
                  borderRadius: `${radius.md}px`,
                  background: colors.bgInset,
                  border: `1px solid ${colors.border}`,
                  borderLeft: `2px solid ${badge.color}`,
                  overflow: "hidden",
                }}
              >
                <div className="pcgo-session-history__record-main">
                  <div style={{ minWidth: 0 }}>
                    <div className="pcgo-session-history__record-title">
                      <Gamepad2 size={12} strokeWidth={2} style={{ color: colors.brand, flexShrink: 0 }} />
                      <strong title={item.game_id || "Unknown game"}>{item.game_id || "Unknown game"}</strong>
                    </div>
                    <div className="pcgo-session-history__record-status" style={{ color: badge.color }}>
                      {badge.icon}
                      <span>{badge.text}</span>
                    </div>
                    {item.error && <div className="pcgo-session-history__record-note" title={item.error}>{item.error}</div>}
                  </div>

                  <div className="pcgo-session-history__record-side">
                    <div className="pcgo-session-history__duration">
                      <Clock size={10} strokeWidth={2} />
                      <span>{formatPlayedTime(item.played_seconds)}</span>
                    </div>
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={detailsId}
                      aria-label={`${isExpanded ? "Hide" : "Show"} details for ${item.game_id || item.session_id}`}
                      onClick={() => toggleSessionEvents(item.session_id)}
                      style={detailsButton}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = colors.ink;
                        e.currentTarget.style.borderColor = colors.borderStrong;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = colors.inkDim;
                        e.currentTarget.style.borderColor = colors.border;
                      }}
                    >
                      {isExpanded ? "HIDE" : "DETAILS"}
                      <ChevronDown size={8} strokeWidth={2} style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                    </button>
                  </div>
                </div>

                <div className="pcgo-session-history__record-meta">
                  <div><span>USER</span><strong title={item.user_id || "--"}>{item.user_id || "--"}</strong></div>
                  <div><span>STARTED</span><time dateTime={item.started_at ? new Date(item.started_at * 1000).toISOString() : undefined}>{formatDate(item.started_at)}</time></div>
                  <div><span>ENDED</span><time dateTime={item.ended_at ? new Date(item.ended_at * 1000).toISOString() : undefined}>{formatDate(item.ended_at)}</time></div>
                  <div><span>SESSION ID</span><strong title={item.session_id || "--"}>{item.session_id || "--"}</strong></div>
                  <div><span>SAVE INTEGRITY</span><strong className={integrityOk ? "is-good" : "is-attention"}>{integrityOk ? "VERIFIED" : "NOT VERIFIED"}</strong></div>
                </div>

                {isExpanded && (
                  <div id={detailsId} className="pcgo-session-history__details">
                    <div className="pcgo-session-history__details-grid">
                      <div><span>GAME ENDED</span><strong>{formatDate(item.game_ended_at)}</strong></div>
                      <div><span>RESTART COUNT</span><strong>{item.restart_count ?? "--"}</strong></div>
                      <div><span>RESTORE</span><strong>{item.restore_verified == null ? "--" : String(item.restore_verified).toUpperCase()}</strong></div>
                      <div><span>LAST RESTART</span><strong>{formatDate(item.last_restart_time)}</strong></div>
                    </div>

                    <div className="pcgo-session-history__events-label">LIFECYCLE EVENTS · NEWEST FIRST</div>
                    {sessionEventLoading[item.session_id] && <div className="pcgo-session-history__event-message" role="status">Loading lifecycle events…</div>}
                    {!sessionEventLoading[item.session_id] && sessionEventErrors[item.session_id] && (
                      <div className="pcgo-session-history__event-message is-error" role="alert">{sessionEventErrors[item.session_id]}</div>
                    )}
                    {!sessionEventLoading[item.session_id] && !sessionEventErrors[item.session_id] && (sessionEvents[item.session_id] || []).length === 0 && (
                      <div className="pcgo-session-history__event-message">No lifecycle events found.</div>
                    )}
                    {!sessionEventLoading[item.session_id] && !sessionEventErrors[item.session_id] && (sessionEvents[item.session_id] || []).length > 0 && (
                      <div className="pcgo-session-history__events-list">
                        {(sessionEvents[item.session_id] || []).map((event) => (
                          <div className="pcgo-session-history__event" key={`${event.id || event.session_id}-${event.status}-${event.time}`}>
                            <strong>{formatStatus(event.status)}</strong>
                            <span title={event.message || ""}>{event.message || "--"}</span>
                            <time dateTime={event.time ? new Date(event.time * 1000).toISOString() : undefined}>{event.time ? new Date(event.time * 1000).toLocaleTimeString() : "--"}</time>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {hasHistory && history.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
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
          {expanded ? "SHOW LESS" : `SHOW ALL ${history.length} SESSIONS`}
          <ChevronDown size={9} strokeWidth={2} style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </button>
      )}

      <style>{`@keyframes sh-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}

const box = {
  padding: "20px",
  border: `1px solid ${colors.border}`,
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
  fontSize: "9px",
  color: colors.inkFaint,
  fontFamily: fonts.mono,
  fontWeight: 700,
  border: `1px solid ${colors.borderSubtle}`,
  borderRadius: `${radius.sm}px`,
  padding: "4px 8px",
  letterSpacing: "0.06em",
};

const refreshButton = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  border: `1px solid ${colors.border}`,
  background: colors.bgElevated,
  color: colors.inkDim,
  borderRadius: `${radius.sm}px`,
  padding: "5px 12px",
  fontSize: "9px",
  fontFamily: fonts.mono,
  fontWeight: 700,
  letterSpacing: "0.08em",
  transition: "color 150ms ease, border-color 150ms ease",
};

const statTile = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  minWidth: 0,
  padding: "11px 12px",
  borderRadius: `${radius.md}px`,
  background: colors.bgInset,
  border: `1px solid ${colors.borderSubtle}`,
};

const statIcon = {
  flexShrink: 0,
  width: "28px",
  height: "28px",
  borderRadius: `${radius.sm}px`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: colors.brandDim,
  border: `1px solid ${colors.brand}`,
  color: colors.brand,
};

const statValue = {
  color: colors.ink,
  fontSize: "17px",
  fontWeight: 700,
  lineHeight: 1.1,
  fontFamily: fonts.mono,
  overflowWrap: "anywhere",
};

const statLabel = {
  fontSize: "8.5px",
  color: colors.inkFaint,
  letterSpacing: "0.08em",
  fontFamily: fonts.mono,
  marginTop: "3px",
  textTransform: "uppercase",
};

const errorBox = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  padding: "10px 12px",
  borderRadius: `${radius.md}px`,
  border: `1.5px solid ${colors.danger}`,
  background: "rgba(255,107,107,0.08)",
  color: colors.danger,
  fontSize: "11px",
  fontFamily: fonts.mono,
  overflowWrap: "anywhere",
};

const emptyBox = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
  padding: "30px 20px",
  border: `1.5px dashed ${colors.borderSubtle}`,
  borderRadius: `${radius.md}px`,
  color: colors.inkFaint,
  fontSize: "11px",
  fontFamily: fonts.mono,
  textAlign: "center",
};

const detailsButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  marginTop: "8px",
  border: `1px solid ${colors.border}`,
  background: colors.bgElevated,
  color: colors.inkDim,
  borderRadius: `${radius.sm}px`,
  padding: "4px 10px",
  fontSize: "9px",
  fontFamily: fonts.mono,
  fontWeight: 700,
  letterSpacing: "0.04em",
  cursor: "pointer",
  transition: "color 150ms ease, border-color 150ms ease",
};

const showAllButton = {
  marginTop: "10px",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  padding: "8px 10px",
  borderRadius: `${radius.full}px`,
  border: `1.5px solid ${colors.border}`,
  background: "transparent",
  color: colors.inkDim,
  fontSize: "10px",
  fontFamily: fonts.mono,
  fontWeight: 700,
  letterSpacing: "0.08em",
  cursor: "pointer",
  transition: "color 150ms ease, border-color 150ms ease",
};
