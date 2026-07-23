import { useEffect, useState } from "react";
import { fetchSessionAnalytics } from "../api/client";

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

const statCard = {
  padding: "10px",
  borderRadius: "8px",
  background: "rgba(2,6,23,0.45)",
  border:
    "1px solid rgba(148,163,184,0.12)",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  fontSize: "11px",
  color: "#94a3b8",
};

function StatList({ title, items, labelKey }) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "10px",
        background: "rgba(2,6,23,0.45)",
        border: "1px solid rgba(148,163,184,0.12)",
      }}
    >
      <div
        style={{
          marginBottom: "10px",
          fontSize: "10px",
          color: "#94a3b8",
          letterSpacing: "0.12em",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {title}
      </div>

      {items.length === 0 ? (
        <div style={{ color: "#475569", fontSize: "11px" }}>
          No data yet.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          {items.slice(0, 5).map((item) => (
            <div
              key={
                labelKey === "user_game"
                    ? `${title}-${item.user_id}-${item.game_id}`
                    : `${title}-${item[labelKey]}`
              }
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "10px",
                fontSize: "11px",
                color: "#cbd5e1",
              }}
            >
              <span>
                {labelKey === "user_game"
                    ? `${item.user_id} · ${item.game_id}`
                    : item[labelKey]}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
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

  async function loadAnalytics() {
    try {
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
            marginBottom: "12px",
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
            SESSION ANALYTICS
        </h2>

        <button
          type="button"
          onClick={loadAnalytics}
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
              "rgba(56,189,248,0.08)"
          }

          onMouseLeave={(e) =>
            e.currentTarget.style.background =
              "rgba(56, 191, 248, 0)"
          }
        >
          REFRESH
        </button>
      </div>

      {error ? (
        <div style={{ color: "#f43f5e", fontSize: "12px" }}>
          {error}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(140px,1fr))",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          <div style={statCard}>
            <div>Total Sessions</div>
            <b>{analytics.total_sessions}</b>
          </div>

          <div style={statCard}>
            <div>Total Played Duration</div>
            <b>
              {formatPlayedTime(
                analytics.total_played_seconds
              )}
            </b>
          </div>

          <div style={statCard}>
            <div>Successful</div>
            <b>{analytics.successful_sessions}</b>
          </div>

          <div style={statCard}>
            <div>Failed</div>
            <b>{analytics.failed_sessions}</b>
          </div>

          <div style={statCard}>
            <div>Recovered</div>
            <b>{analytics.recovered_sessions}</b>
          </div>

          { analytics?.total_sessions != 0 && (
            <div style={statCard}>
              <div>Success Rate</div>
              <b>{analytics.success_rate}%</b>
            </div>
          )}

          <div style={statCard}>
            <div>Avg Playtime</div>
            <b>
              {formatPlayedTime(
                analytics.average_playtime_seconds
              )}
            </b>
          </div>

          { analytics?.total_sessions != 0 &&
            isAdmin && (
            <div style={statCard}>
              <div>Reliability</div>
              <b
                style={{
                  color: getReliabilityColor(
                    analytics.system_reliability
                  )
                }}
              >
                {analytics.system_reliability}
              </b>
            </div>
          )}
        
          {isAdmin && (
              <StatList
                  title="BY USER"
                  items={analytics.by_user}
                  labelKey="user_id"
              />
          )}

          <StatList
            title="BY GAME"
            items={analytics.by_game}
            labelKey="game_id"
          />

          {isAdmin && (
              <StatList
                  title="BY USER + GAME"
                  items={analytics.by_user_game}
                  labelKey="user_game"
              />
          )}
        </div>
      )}
    </section>
  );
}