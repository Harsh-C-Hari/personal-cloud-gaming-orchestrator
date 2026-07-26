/**
 * components/SessionAnalytics.jsx
 *
 * Same props (refreshKey), same data fetching (fetchSessionAnalytics),
 * same state shape, same admin-gating logic, and same formatting helpers
 * as before — only the presentation was reworked to match the visual
 * language already used by RecoveryStats / SessionHistory / HostStatusPanel:
 *   - Icon-badged section header with a refresh button.
 *   - Icon-badged stat tiles instead of plain boxes, color-coded by meaning
 *     (success / danger / warning / accent).
 *   - Ranked list cards ("BY USER", "BY GAME", "BY USER + GAME") styled as
 *     bordered rows with rank badges and mono stat readouts.
 */

import { useEffect, useState } from "react";
import {
  FaChartBar,
  FaSyncAlt,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaHistory,
  FaPercentage,
  FaStopwatch,
  FaHeartbeat,
  FaUser,
  FaGamepad,
  FaUsers,
} from "react-icons/fa";
import { fetchSessionAnalytics } from "../api/client";

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
  danger: "#f43f5e",
  mono: "'JetBrains Mono', monospace",
};

function formatPlayedTime(seconds) {
  if (seconds == null) return "--";

  const totalSeconds = Math.max(
    0,
    Math.floor(seconds)
  );

  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }

  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }

  return `${secs}s`;
}

function StatTile({ icon, label, value, tone = palette.accent }) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "8px",
        background: palette.card,
        border: `1px solid ${palette.borderSubtle}`,
        display: "flex",
        alignItems: "center",
        gap: "12px",
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
          background: `${tone}1a`,
          border: `1px solid ${tone}40`,
          color: tone,
          fontSize: "13px",
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: "17px",
            fontWeight: 700,
            fontFamily: palette.mono,
            color: tone,
            lineHeight: 1.1,
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: "9px",
            color: palette.faint,
            letterSpacing: "0.08em",
            fontFamily: palette.mono,
            marginTop: "3px",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

function StatList({ title, items, labelKey, icon }) {
  return (
    <div
      style={{
        padding: "14px",
        borderRadius: "8px",
        background: palette.card,
        border: `1px solid ${palette.borderSubtle}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          marginBottom: "12px",
          fontSize: "9.5px",
          color: palette.faint,
          letterSpacing: "0.13em",
          textTransform: "uppercase",
          fontFamily: palette.mono,
        }}
      >
        {icon}
        {title}
      </div>

      {items.length === 0 ? (
        <div
          style={{
            padding: "16px",
            textAlign: "center",
            border: `1px dashed ${palette.borderSubtle}`,
            borderRadius: "8px",
            color: palette.muted,
            fontSize: "10.5px",
            fontFamily: palette.mono,
          }}
        >
          No data yet.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          {items.slice(0, 5).map((item, idx) => (
            <div
              key={
                labelKey === "user_game"
                    ? `${title}-${item.user_id}-${item.game_id}`
                    : `${title}-${item[labelKey]}`
              }
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                padding: "9px 10px",
                borderRadius: "6px",
                background: "rgba(2,6,23,0.4)",
                border: `1px solid ${palette.borderSubtle}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: "18px",
                    height: "18px",
                    borderRadius: "5px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(56,189,248,0.12)",
                    border: "1px solid rgba(56,189,248,0.3)",
                    color: palette.accent,
                    fontSize: "8.5px",
                    fontFamily: palette.mono,
                    fontWeight: 700,
                  }}
                >
                  {idx + 1}
                </span>
                <span
                  style={{
                    color: palette.text,
                    fontSize: "11.5px",
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {labelKey === "user_game"
                      ? `${item.user_id} · ${item.game_id}`
                      : item[labelKey]}
                </span>
              </div>
              <span
                style={{
                  flexShrink: 0,
                  fontFamily: palette.mono,
                  fontSize: "10px",
                  color: palette.dim,
                  whiteSpace: "nowrap",
                }}
              >
                {item.sessions}x · {formatPlayedTime(item.played_seconds)} · avg {formatPlayedTime(item.average_played_seconds)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SessionAnalytics({
  refreshKey = 0,
}) {
  const isAdmin =
    localStorage.getItem("role") === "admin";
  
  const [analytics, setAnalytics] = useState({
    total_sessions: 0,
    total_played_seconds:0,
    successful_sessions: 0,
    failed_sessions: 0,
    recovered_sessions: 0,
    success_rate: 0,
    average_playtime_seconds: 0,
    system_reliability : "None",

    by_user: [],
    by_game: [],
    by_user_game: [],
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadAnalytics() {
    if (loading) return;
    try {
      setLoading(true);
      const data = await fetchSessionAnalytics();

      setAnalytics({
        total_sessions:
          data.total_sessions || 0,

        total_played_seconds:
          data.total_played_seconds || 0,

        successful_sessions:
          data.successful_sessions || 0,

        failed_sessions:
          data.failed_sessions || 0,

        recovered_sessions:
          data.recovered_sessions || 0,

        success_rate:
          data.success_rate || 0,

        average_playtime_seconds:
          data.average_playtime_seconds || 0,

        system_reliability:
          data.system_reliability || "None",
        
          by_user:
          data.by_user || [],

        by_game:
          data.by_game || [],

        by_user_game:
          data.by_user_game || [],
      });

      setError("");
    } catch (err) {
      setError(err.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  }

  function getReliabilityColor(
    reliability
  ) {
    switch (reliability) {

      case "Excellent":
        return "#22c55e";

      case "Good":
        return "#38bdf8";

      case "Warning":
        return "#f59e0b";

      default:
        return "#ef4444";
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (!refreshKey) return;
    loadAnalytics();
  }, [refreshKey]);

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
      <div
        style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
        }}
        >
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
            <FaChartBar size={12} />
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
              SESSION ANALYTICS
          </h2>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={loadAnalytics}
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
          <FaSyncAlt size={10} style={loading ? { animation: "sa-spin 0.8s linear infinite" } : undefined} />
          {loading ? "REFRESHING..." : "REFRESH"}
        </button>
      </div>

      {error ? (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "8px",
            border: `1px solid ${palette.danger}`,
            background: "rgba(244,63,94,0.08)",
            color: palette.danger,
            fontSize: "11.5px",
            fontFamily: palette.mono,
          }}
        >
          {error}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(150px,1fr))",
              gap: "10px",
            }}
          >
            <StatTile
              icon={<FaHistory size={13} />}
              label="Total Sessions"
              value={analytics.total_sessions}
              tone={palette.accent}
            />

            <StatTile
              icon={<FaClock size={13} />}
              label="Total Played Duration"
              value={formatPlayedTime(analytics.total_played_seconds)}
              tone={palette.accent}
            />

            <StatTile
              icon={<FaCheckCircle size={13} />}
              label="Successful"
              value={analytics.successful_sessions}
              tone={palette.success}
            />

            <StatTile
              icon={<FaTimesCircle size={13} />}
              label="Failed"
              value={analytics.failed_sessions}
              tone={palette.danger}
            />

            <StatTile
              icon={<FaSyncAlt size={13} />}
              label="Recovered"
              value={analytics.recovered_sessions}
              tone={palette.warning}
            />

            { analytics?.total_sessions != 0 && (
              <StatTile
                icon={<FaPercentage size={13} />}
                label="Success Rate"
                value={`${analytics.success_rate}%`}
                tone={palette.success}
              />
            )}

            <StatTile
              icon={<FaStopwatch size={13} />}
              label="Avg Playtime"
              value={formatPlayedTime(analytics.average_playtime_seconds)}
              tone={palette.accent}
            />

            { analytics?.total_sessions != 0 &&
              isAdmin && (
              <StatTile
                icon={<FaHeartbeat size={13} />}
                label="Reliability"
                value={analytics.system_reliability}
                tone={getReliabilityColor(analytics.system_reliability)}
              />
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
              gap: "10px",
            }}
          >
            {isAdmin && (
                <StatList
                    title="By User"
                    items={analytics.by_user}
                    labelKey="user_id"
                    icon={<FaUser size={9} />}
                />
            )}

            <StatList
              title="By Game"
              items={analytics.by_game}
              labelKey="game_id"
              icon={<FaGamepad size={9} />}
            />

            {isAdmin && (
                <StatList
                    title="By User + Game"
                    items={analytics.by_user_game}
                    labelKey="user_game"
                    icon={<FaUsers size={9} />}
                />
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes sa-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}
