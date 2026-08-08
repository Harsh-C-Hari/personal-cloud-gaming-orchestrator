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
 *     getStatusBadge() text logic — only its hard-coded hex colors were
 *     swapped for flat theme tokens).
 *   - Expanded lifecycle events render as a small timeline, matching
 *     RecoveryEvents' event rows.
 *
 * Redesign note: local cyan-glow `palette` replaced with theme.js tokens,
 * react-icons/fa replaced with lucide-react.
 */

import { useEffect, useState } from "react";
import {
  History,
  RefreshCw,
  Gamepad2,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
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

  return new Date(timestamp * 1000).toLocaleString();
}

function getStatusBadge(item) {

  if (
    item.error ===
    "Recovered after backend restart"
  ) {
    return {
      text: "↺ RECOVERED",
      color: colors.warning,
    };
  }

  if (item.status === "completed") {
    return {
      text: "✓ COMPLETED",
      color: colors.success,
    };
  }

  if (item.status === "failed") {
    return {
      text: "✕ FAILED",
      color: colors.danger,
    };
  }

  return {
    text: item.status?.toUpperCase(),
    color: colors.inkDim,
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
    <section style={box}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", rowGap: "8px", columnGap: "12px", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
          <div style={headerIcon}>
            <History size={13} strokeWidth={2} />
          </div>
          <h2 style={title}>Session History</h2>

          {history.length > 0 && (
            <span style={countPill}>{history.length}</span>
          )}
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={loadHistory}
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

      {/* ── Total played stat tile ───────────────────────────────── */}
      <div style={statTile}>
        <div style={statIcon}>
          <Clock size={13} strokeWidth={2} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "19px", fontWeight: 700, fontFamily: fonts.mono, color: colors.ink, lineHeight: 1.1 }}>
            {formatPlayedTime(totalPlayedSeconds)}
          </div>
          <div style={statLabel}>Total Played</div>
        </div>
      </div>

      {error && <div style={errorBox}>{error}</div>}

      {!error && history.length === 0 && (
        <div style={emptyBox}>No completed sessions yet.</div>
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
                  borderRadius: `${radius.md}px`,
                  background: colors.bgInset,
                  border: `1.5px solid ${colors.border}`,
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
                        color: colors.ink,
                        fontSize: "12.5px",
                        fontWeight: 700,
                      }}
                    >
                      <Gamepad2 size={11} strokeWidth={2} style={{ color: colors.brand, flexShrink: 0 }} />
                      {item.game_id} · {item.user_id}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: colors.inkDim,
                        fontSize: "11px",
                        marginTop: "5px",
                      }}
                    >
                      <Clock size={9} strokeWidth={2} style={{ opacity: 0.7, flexShrink: 0 }} />
                      {formatDate(item.started_at)}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "7px",
                        fontSize: "10px",
                        color: integrityOk ? colors.success : colors.warning,
                        fontFamily: fonts.mono,
                      }}
                    >
                      {integrityOk ? <CheckCircle2 size={10} strokeWidth={2} /> : <XCircle size={10} strokeWidth={2} />}
                      INTEGRITY: {integrityOk ? "VERIFIED" : "NOT VERIFIED"}
                    </div>

                    <div style={metaLine}>
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
                      <div style={metaLine}>
                        RESTORE: {item.restore_verified == null ? "--" : String(item.restore_verified)}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: "right", fontFamily: fonts.mono, fontSize: "11px", color: colors.inkDim }}>
                    <div
                      style={{
                        color: badge.color,
                        fontWeight: 700,
                        fontSize: "9px",
                        letterSpacing: "0.06em",
                        padding: "3px 8px",
                        borderRadius: `${radius.full}px`,
                        background: `${badge.color}22`,
                        border: `1.5px solid ${badge.color}4d`,
                        display: "inline-block",
                        marginBottom: "6px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {badge.text}
                    </div>
                    <div style={{ color: colors.inkDim }}>PLAYED {formatPlayedTime(item.played_seconds)}</div>
                    <button
                      type="button"
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
                    {expandedSessionId === item.session_id ? "HIDE" : "DETAILS"}
                    <ChevronDown
                      size={8}
                      strokeWidth={2}
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
                      borderTop: `1.5px solid ${colors.borderSubtle}`,
                      display: "grid",
                      gap: "6px",
                      }}
                  >
                      {(sessionEvents[item.session_id] || []).length === 0 ? (
                        <div style={{ color: colors.inkFaint, fontSize: "10px", fontFamily: fonts.mono }}>
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
                              borderRadius: `${radius.sm}px`,
                              background: colors.bgElevated,
                              border: `1.5px solid ${colors.borderSubtle}`,
                              fontSize: "10px",
                              color: colors.inkDim,
                              fontFamily: fonts.mono,
                              }}
                            >
                              <span>{event.status?.toUpperCase()}</span>
                              <span style={{ color: colors.inkFaint }}>{new Date(event.time * 1000).toLocaleTimeString()}</span>
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
          {expanded
          ? "SHOW LESS"
          : `SHOW ALL ${history.length} SESSIONS`}
          <ChevronDown
            size={9}
            strokeWidth={2}
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          />
        </button>
      )}

      <style>{`@keyframes sh-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}

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

const refreshButton = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  border: `1.5px solid ${colors.border}`,
  background: "transparent",
  color: colors.inkDim,
  borderRadius: `${radius.full}px`,
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
  gap: "12px",
  padding: "12px",
  borderRadius: `${radius.md}px`,
  background: colors.bgInset,
  border: `1.5px solid ${colors.border}`,
  marginBottom: "14px",
};

const statIcon = {
  flexShrink: 0,
  width: "32px",
  height: "32px",
  borderRadius: `${radius.sm}px`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: colors.brandDim,
  border: `1.5px solid ${colors.brand}`,
  color: colors.brand,
};

const statLabel = {
  fontSize: "9.5px",
  color: colors.inkFaint,
  letterSpacing: "0.08em",
  fontFamily: fonts.mono,
  marginTop: "2px",
  textTransform: "uppercase",
};

const errorBox = {
  padding: "10px 12px",
  borderRadius: `${radius.md}px`,
  border: `1.5px solid ${colors.danger}`,
  background: "rgba(255,107,107,0.08)",
  color: colors.danger,
  fontSize: "11.5px",
  fontFamily: fonts.mono,
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

const metaLine = {
  marginTop: "4px",
  fontSize: "9px",
  color: colors.inkFaint,
  fontFamily: fonts.mono,
};

const detailsButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  marginTop: "8px",
  border: `1.5px solid ${colors.border}`,
  background: "transparent",
  color: colors.inkDim,
  borderRadius: `${radius.full}px`,
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
