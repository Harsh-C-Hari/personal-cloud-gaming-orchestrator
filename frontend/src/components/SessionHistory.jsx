/**
 * components/SessionHistory.jsx
 *
 * Same props (refreshKey), same data fetching (fetchSessionHistory,
 * fetchSessionEvents), same formatting helpers (formatPlayedTime,
 * formatDate, getStatusBadge), and same expand/collapse behavior as
 * before — only the presentation was reworked to match the visual
 * language already used by RecoveryEvents / RecoveryStats / HostStatusPanel:
 *   - Icon-badged section header with a live count + refresh button.
 *   - A "Total Played" stat tile instead of a plain text line.
 *   - Each history entry is now a bordered card with icon-labeled rows
 *     and a colored status pill (still driven by the untouched
 *     getStatusBadge() text/color).
 *   - Expanded lifecycle events render as a small timeline, matching
 *     RecoveryEvents' event rows.
 */

import { useEffect, useState } from "react";
import {
  FaHistory,
  FaSyncAlt,
  FaGamepad,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaChevronDown,
} from "react-icons/fa";
import { fetchSessionHistory, fetchSessionEvents } from "../api/client";

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
  const [loading, setLoading] = useState(false);

  async function loadHistory() {
    if (loading) return;
    try {
      setLoading(true);
      const data = await fetchSessionHistory(10);
      setHistory(data.history || []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load history.");
    } finally {
      setLoading(false);
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
        padding: "16px",
        border: `1px solid ${palette.border}`,
        borderRadius: "10px",
        background: "rgba(0, 0, 0, 0.55)",
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
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
            SESSION HISTORY
          </h2>

          {history.length > 0 && (
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
              {history.length}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={loadHistory}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            border: `1px solid ${palette.border}`,
            background: palette.card,
            color: palette.dim,
            borderRadius: "6px",
            padding: "5px 10px",
            fontSize: "9px",
            fontFamily: palette.mono,
            letterSpacing: "0.08em",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            if (loading) return;
            e.currentTarget.style.background = "rgba(56,191,248,0.08)";
            e.currentTarget.style.color = palette.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = palette.card;
            e.currentTarget.style.color = palette.dim;
          }}
        >
          <FaSyncAlt size={10} style={loading ? { animation: "sh-spin 0.8s linear infinite" } : undefined} />
          {loading ? "REFRESHING..." : "REFRESH"}
        </button>
      </div>

      {/* ── Total played stat tile ───────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px",
          borderRadius: "8px",
          background: palette.card,
          border: `1px solid ${palette.borderSubtle}`,
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `${palette.accent}1a`,
            border: `1px solid ${palette.accent}40`,
            color: palette.accent,
            fontSize: "13px",
          }}
        >
          <FaClock size={13} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "19px", fontWeight: 700, fontFamily: palette.mono, color: palette.text, lineHeight: 1.1 }}>
            {formatPlayedTime(totalPlayedSeconds)}
          </div>
          <div
            style={{
              fontSize: "9.5px",
              color: palette.faint,
              letterSpacing: "0.08em",
              fontFamily: palette.mono,
              marginTop: "2px",
              textTransform: "uppercase",
            }}
          >
            Total Played
          </div>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            border: `1px solid ${palette.danger}`,
            background: "rgba(239,68,68,0.08)",
            color: palette.danger,
            fontSize: "11.5px",
            fontFamily: palette.mono,
          }}
        >
          {error}
        </div>
      )}

      {!error && history.length === 0 && (
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
          No completed sessions yet.
        </div>
      )}

      {!error && history.length > 0 && (
        <div style={{ display: "grid", gap: "10px" }}>
          {visibleHistory.map((item) => {
            const badge = getStatusBadge(item);
            const integrityOk = item.integrity_verified === true;

            return (
              <div
                key={item.session_id}
                style={{
                  borderRadius: "8px",
                  background: palette.card,
                  border: `1px solid ${palette.borderSubtle}`,
                  borderLeft: `2px solid ${badge.color}`,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "10px",
                    padding: "12px",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "7px",
                        color: palette.text,
                        fontSize: "12.5px",
                        fontWeight: 700,
                      }}
                    >
                      <FaGamepad size={11} style={{ color: palette.accent, flexShrink: 0 }} />
                      {item.game_id} · {item.user_id}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: palette.dim,
                        fontSize: "11px",
                        marginTop: "5px",
                      }}
                    >
                      <FaClock size={9} style={{ opacity: 0.7, flexShrink: 0 }} />
                      {formatDate(item.started_at)}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "7px",
                        fontSize: "10px",
                        color: integrityOk ? palette.success : "#f97316",
                        fontFamily: palette.mono,
                      }}
                    >
                      {integrityOk ? <FaCheckCircle size={10} /> : <FaTimesCircle size={10} />}
                      INTEGRITY: {integrityOk ? "VERIFIED" : "NOT VERIFIED"}
                    </div>

                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "9px",
                        color: palette.muted,
                        fontFamily: palette.mono,
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

                    {item.restore_verified != null && (
                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "9px",
                          color: palette.muted,
                          fontFamily: palette.mono,
                        }}
                      >
                        RESTORE: {item.restore_verified == null ? "--" : String(item.restore_verified)}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      textAlign: "right",
                      fontFamily: palette.mono,
                      fontSize: "11px",
                      color: "#cbd5e1",
                    }}
                  >
                    <div
                      style={{
                        color: badge.color,
                        fontWeight: 700,
                        fontSize: "9px",
                        letterSpacing: "0.06em",
                        padding: "3px 8px",
                        borderRadius: "999px",
                        background: `${badge.color}22`,
                        border: `1px solid ${badge.color}55`,
                        display: "inline-block",
                        marginBottom: "6px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {badge.text}
                    </div>
                    <div style={{ color: palette.dim }}>PLAYED {formatPlayedTime(item.played_seconds)}</div>
                    <button
                      type="button"
                      onClick={() => toggleSessionEvents(item.session_id)}
                      style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          marginTop: "8px",
                          border: `1px solid ${palette.border}`,
                          background: "rgba(2,6,23,0.45)",
                          color: palette.dim,
                          borderRadius: "6px",
                          padding: "4px 8px",
                          fontSize: "9px",
                          fontFamily: palette.mono,
                          letterSpacing: "0.04em",
                          cursor: "pointer",
                          transition: "background 0.15s, color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(56,191,248,0.08)";
                        e.currentTarget.style.color = palette.accent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(2,6,23,0.45)";
                        e.currentTarget.style.color = palette.dim;
                      }}
                    >
                    {expandedSessionId === item.session_id ? "HIDE" : "DETAILS"}
                    <FaChevronDown
                      size={8}
                      style={{
                        transform: expandedSessionId === item.session_id ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s",
                      }}
                    />
                    </button>
                  </div>
                </div>

                {expandedSessionId === item.session_id && (
                  <div
                      style={{
                      padding: "10px 12px 12px",
                      borderTop: `1px solid ${palette.borderSubtle}`,
                      display: "grid",
                      gap: "6px",
                      }}
                  >
                      {(sessionEvents[item.session_id] || []).length === 0 ? (
                        <div style={{ color: palette.muted, fontSize: "10px", fontFamily: palette.mono }}>
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
                              padding: "6px 8px",
                              borderRadius: "6px",
                              background: "rgba(2,6,23,0.4)",
                              border: `1px solid ${palette.borderSubtle}`,
                              fontSize: "10px",
                              color: palette.dim,
                              fontFamily: palette.mono,
                              }}
                            >
                              <span>{event.status?.toUpperCase()}</span>
                              <span style={{ color: palette.faint }}>{new Date(event.time * 1000).toLocaleTimeString()}</span>
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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          padding: "8px 10px",
          borderRadius: "8px",
          border: `1px solid ${palette.border}`,
          background: palette.card,
          color: palette.dim,
          fontSize: "10px",
          fontFamily: palette.mono,
          letterSpacing: "0.08em",
          cursor: "pointer",
          transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(56,191,248,0.08)";
            e.currentTarget.style.color = palette.accent;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = palette.card;
            e.currentTarget.style.color = palette.dim;
          }}
        >
          {expanded
          ? "SHOW LESS"
          : `SHOW ALL ${history.length} SESSIONS`}
          <FaChevronDown
            size={9}
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          />
        </button>
      )}

      <style>{`@keyframes sh-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}
