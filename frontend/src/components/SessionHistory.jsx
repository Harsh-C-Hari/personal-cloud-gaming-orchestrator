import { useEffect, useState } from "react";
import { fetchSessionHistory, fetchSessionEvents } from "../api/client";

function formatPlayedTime(seconds) {
  if (seconds == null) return "--";

  const totalSeconds = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return `${mins}m ${secs}s`;
}

function formatDate(timestamp) {
  if (!timestamp) return "--";

  return new Date(timestamp * 1000).toLocaleString();
}

function getStatusBadge(item) {

  if (
    item.error ===
    "Recovered after backend restart"
  ) {
    return {
      text: "↺ RECOVERED",
      color: "#f59e0b",
    };
  }

  if (item.status === "completed") {
    return {
      text: "✓ COMPLETED",
      color: "#22c55e",
    };
  }

  if (item.status === "failed") {
    return {
      text: "✕ FAILED",
      color: "#ef4444",
    };
  }

  return {
    text: item.status?.toUpperCase(),
    color: "#94a3b8",
  };
}

export function SessionHistory({
  refreshKey = 0,
}) {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState("");
  const [sessionEvents, setSessionEvents] = useState({});

  async function loadHistory() {
    try {
      const data = await fetchSessionHistory(10);
      setHistory(data.history || []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load history.");
    }
  }

  async function toggleSessionEvents(sessionId) {
    if (expandedSessionId === sessionId) {
        setExpandedSessionId("");
        return;
    }

    setExpandedSessionId(sessionId);

    if (sessionEvents[sessionId]) {
        return;
    }

    try {
        const data = await fetchSessionEvents({
        sessionId,
        limit: 20,
        });

        setSessionEvents((prev) => ({
        ...prev,
        [sessionId]: data.events || [],
        }));
    } catch {
        setSessionEvents((prev) => ({
        ...prev,
        [sessionId]: [],
        }));
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (!refreshKey) return;

    loadHistory();
  }, [refreshKey]);

  const visibleHistory = expanded
    ? history
    : history.slice(0, 3);

  const totalPlayedSeconds = history.reduce(
    (sum, item) => sum + (item.played_seconds || 0),
    0
  );
  
  return (
    <section
      style={{
        marginTop: "18px",
        padding: "14px",
        border: "1px solid rgba(148,163,184,0.18)",
        borderRadius: "10px",
        background: "rgba(15,23,42,0.55)",
      }}
    >
      <div
        style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
        }}
        >
        <h2
            style={{
            margin: 0,
            fontSize: "13px",
            letterSpacing: "0.12em",
            color: "#e2e8f0",
            fontFamily: "'JetBrains Mono', monospace",
            }}
        >
            SESSION HISTORY
        </h2>

        <button
          type="button"
          onClick={loadHistory}
          style={{
          border: "1px solid rgba(148,163,184,0.18)",
          background: "rgba(2,6,23,0.45)",
          color: "#94a3b8",
          borderRadius: "6px",
          padding: "5px 8px",
          fontSize: "9px",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.08em",
          cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            e.currentTarget.style.background =
              "rgba(108, 164, 189, 0.15)"
          }

          onMouseLeave={(e) =>
            e.currentTarget.style.background =
              "rgba(108, 163, 189, 0)"
          }
        >
            REFRESH
        </button>
      </div>

      <div
        style={{
            marginBottom: "10px",
            fontSize: "11px",
            color: "#94a3b8",
            fontFamily: "'JetBrains Mono', monospace",
        }}
        >
        TOTAL PLAYED: {formatPlayedTime(totalPlayedSeconds)}
      </div>

      {error && (
        <div style={{ color: "#f43f5e", fontSize: "12px" }}>
          {error}
        </div>
      )}

      {!error && history.length === 0 && (
        <div style={{ color: "#94a3b8", fontSize: "12px" }}>
          No completed sessions yet.
        </div>
      )}

      {!error && history.length > 0 && (
        <div style={{ display: "grid", gap: "8px" }}>
          {visibleHistory.map((item) => {
            const badge = getStatusBadge(item);
            return (
              <div
                key={item.session_id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "8px",
                  padding: "10px",
                  borderRadius: "8px",
                  background: "rgba(2,6,23,0.45)",
                  border: "1px solid rgba(148,163,184,0.12)",
                }}
              >
                <div>
                  <div
                    style={{
                      color: "#e2e8f0",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {item.game_id} · {item.user_id}
                  </div>

                  <div
                    style={{
                      color: "#94a3b8",
                      fontSize: "11px",
                      marginTop: "3px",
                    }}
                  >
                    {formatDate(item.started_at)}
                  </div>
                  <div
                    style={{
                      marginTop: "6px",
                      fontSize: "10px",
                      color: item.integrity_verified ? "#22c55e" : "#f97316",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    INTEGRITY: {item.integrity_verified ? "VERIFIED" : "NOT VERIFIED"}
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "9px",
                      color: "#64748b",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {item.integrity_verified === true &&
                    item.latest_manifest_verified == null &&
                    item.backup_manifest_verified == null &&
                    item.archive_verified == null
                      ? "NO SAVE CHANGE"
                      : (
                        <>
                          LATEST: {item.latest_manifest_verified == null ? "--" : String(item.latest_manifest_verified)} · BACKUP:{" "}
                          {item.backup_manifest_verified == null ? "--" : String(item.backup_manifest_verified)} · ARCHIVE:{" "}
                          {item.archive_verified == null ? "--" : String(item.archive_verified)}
                        </>
                      )}
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "9px",
                      color: "#64748b",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    RESTORE: {item.restore_verified == null ? "--" : String(item.restore_verified)}
                  </div>
                </div>

                <div
                  style={{
                    textAlign: "right",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    color: "#cbd5e1",
                  }}
                >
                  <div
                    style={{
                      color: badge.color,
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: "6px",
                      border: `1px solid ${badge.color}`,
                      display: "inline-block",
                      marginBottom: "4px",
                    }}
                  >
                    {badge.text}
                  </div>
                  <div>PLAYED {formatPlayedTime(item.played_seconds)}</div>
                  <button
                    type="button"
                    onClick={() => toggleSessionEvents(item.session_id)}
                    style={{
                        marginTop: "6px",
                        border: "1px solid rgba(148,163,184,0.18)",
                        background: "rgba(2,6,23,0.45)",
                        color: "#94a3b8",
                        borderRadius: "6px",
                        padding: "4px 7px",
                        fontSize: "9px",
                        fontFamily: "'JetBrains Mono', monospace",
                        cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      e.currentTarget.style.background =
                        "rgba(23, 36, 54, 0.7)"
                    }

                    onMouseLeave={(e) =>
                      e.currentTarget.style.background =
                        "rgba(23, 36, 54, 0)"
                    }
                  >
                  {expandedSessionId === item.session_id ? "HIDE" : "DETAILS"}
                  </button>
                </div>
                {expandedSessionId === item.session_id && (
                  <div
                      style={{
                      gridColumn: "1 / -1",
                      marginTop: "8px",
                      paddingTop: "8px",
                      borderTop: "1px solid rgba(148,163,184,0.12)",
                      display: "grid",
                      gap: "5px",
                      }}
                  >
                      {(sessionEvents[item.session_id] || []).length === 0 ? (
                        <div style={{ color: "#475569", fontSize: "10px" }}>
                          No lifecycle events found.
                        </div>
                      ) : (
                        (sessionEvents[item.session_id] || []).map((event) => (
                            <div
                              key={`${event.session_id}-${event.status}-${event.time}`}
                              style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: "10px",
                              fontSize: "10px",
                              color: "#94a3b8",
                              fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              <span>{event.status?.toUpperCase()}</span>
                              <span>{new Date(event.time * 1000).toLocaleTimeString()}</span>
                            </div>
                        ))
                      )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {history.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
          marginTop: "10px",
          width: "100%",
          padding: "8px 10px",
          borderRadius: "8px",
          border: "1px solid rgba(148,163,184,0.18)",
          background: "rgba(2,6,23,0.45)",
          color: "#94a3b8",
          fontSize: "10px",
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.08em",
          cursor: "pointer",
          }}
          onMouseEnter={(e) =>
            e.currentTarget.style.background =
              "rgba(56, 191, 248, 0.09)"
          }

          onMouseLeave={(e) =>
            e.currentTarget.style.background =
              "rgba(56, 191, 248, 0)"
          }
        >
          {expanded
          ? "SHOW LESS"
          : `SHOW ALL ${history.length} SESSIONS`}
        </button>
      )}
    </section>
  );
}