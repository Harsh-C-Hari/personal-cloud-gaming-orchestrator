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
 *
 * No chart library is used anywhere in this component — every metric is a
 * numeric stat tile or a ranked text list, so there was no chart chrome
 * (axes/gridlines/tooltips) to adapt for the redesign.
 *
 * Redesign note: local cyan-glow `palette` replaced with theme.js tokens,
 * react-icons/fa replaced with lucide-react.
 */

import { useEffect, useState } from "react";
import {
  BarChart3,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  History,
  Percent,
  Timer,
  HeartPulse,
  User,
  Gamepad2,
  Users,
} from "lucide-react";
import { fetchSessionAnalytics } from "../api/client";
import { colors, fonts, radius } from "../dashboard/theme.js";

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

function StatTile({ icon, label, value, tone = colors.brand }) {
  return (
    <div style={statTile}>
      <div
        style={{
          flexShrink: 0,
          width: "32px",
          height: "32px",
          borderRadius: `${radius.sm}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `color-mix(in srgb, ${tone} 10%, transparent)`,
          border: `1.5px solid color-mix(in srgb, ${tone} 25%, transparent)`,
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
            fontFamily: fonts.mono,
            color: tone,
            lineHeight: 1.1,
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </div>
        <div style={statLabel}>{label}</div>
      </div>
    </div>
  );
}

function StatList({ title: listTitle, items, labelKey, icon }) {
  return (
    <div style={listCard}>
      <div style={listHeading}>
        {icon}
        {listTitle}
      </div>

      {items.length === 0 ? (
        <div style={emptyBox}>No data yet.</div>
      ) : (
        <div style={{ display: "grid", gap: "8px" }}>
          {items.slice(0, 5).map((item, idx) => (
            <div
              key={
                labelKey === "user_game"
                    ? `${listTitle}-${item.user_id}-${item.game_id}`
                    : `${listTitle}-${item[labelKey]}`
              }
              style={listRow}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
                <span style={rankBadge}>{idx + 1}</span>
                <span
                  style={{
                    color: colors.ink,
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
              <span style={{ flexShrink: 0, fontFamily: fonts.mono, fontSize: "10px", color: colors.inkDim, whiteSpace: "nowrap" }}>
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
        return colors.success;

      case "Good":
        return colors.brand;

      case "Warning":
        return colors.warning;

      default:
        return colors.danger;
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
    <section style={box}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", rowGap: "8px", columnGap: "12px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
          <div style={headerIcon}>
            <BarChart3 size={13} strokeWidth={2} />
          </div>
          <h2 style={title}>Session Analytics</h2>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={loadAnalytics}
          style={{
            ...refreshButton,
            flexShrink: 0,
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
          <RefreshCw size={10} strokeWidth={2} style={loading ? { animation: "sa-spin 0.8s linear infinite" } : undefined} />
          {loading ? "REFRESHING..." : "REFRESH"}
        </button>
      </div>

      {error ? (
        <div style={errorBox}>{error}</div>
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
              icon={<History size={13} strokeWidth={2} />}
              label="Total Sessions"
              value={analytics.total_sessions}
              tone={colors.brand}
            />

            <StatTile
              icon={<Clock size={13} strokeWidth={2} />}
              label="Total Played Duration"
              value={formatPlayedTime(analytics.total_played_seconds)}
              tone={colors.brand}
            />

            <StatTile
              icon={<CheckCircle2 size={13} strokeWidth={2} />}
              label="Successful"
              value={analytics.successful_sessions}
              tone={colors.success}
            />

            <StatTile
              icon={<XCircle size={13} strokeWidth={2} />}
              label="Failed"
              value={analytics.failed_sessions}
              tone={colors.danger}
            />

            <StatTile
              icon={<RefreshCw size={13} strokeWidth={2} />}
              label="Recovered"
              value={analytics.recovered_sessions}
              tone={colors.warning}
            />

            { analytics?.total_sessions != 0 && (
              <StatTile
                icon={<Percent size={13} strokeWidth={2} />}
                label="Success Rate"
                value={`${analytics.success_rate}%`}
                tone={colors.success}
              />
            )}

            <StatTile
              icon={<Timer size={13} strokeWidth={2} />}
              label="Avg Playtime"
              value={formatPlayedTime(analytics.average_playtime_seconds)}
              tone={colors.brand}
            />

            { analytics?.total_sessions != 0 &&
              isAdmin && (
              <StatTile
                icon={<HeartPulse size={13} strokeWidth={2} />}
                label="Reliability"
                value={analytics.system_reliability}
                tone={getReliabilityColor(analytics.system_reliability)}
              />
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
              gap: "10px",
            }}
          >
            {isAdmin && (
                <StatList
                    title="By User"
                    items={analytics.by_user}
                    labelKey="user_id"
                    icon={<User size={9} strokeWidth={2} />}
                />
            )}

            <StatList
              title="By Game"
              items={analytics.by_game}
              labelKey="game_id"
              icon={<Gamepad2 size={9} strokeWidth={2} />}
            />

            {isAdmin && (
                <StatList
                    title="By User + Game"
                    items={analytics.by_user_game}
                    labelKey="user_game"
                    icon={<Users size={9} strokeWidth={2} />}
                />
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes sa-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
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

const errorBox = {
  padding: "10px 12px",
  borderRadius: `${radius.md}px`,
  border: `1.5px solid ${colors.danger}`,
  background: "rgba(255,107,107,0.08)",
  color: colors.danger,
  fontSize: "11.5px",
  fontFamily: fonts.mono,
};

const statTile = {
  padding: "12px",
  borderRadius: `${radius.md}px`,
  background: colors.bgInset,
  border: `1.5px solid ${colors.border}`,
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const statLabel = {
  fontSize: "9px",
  color: colors.inkFaint,
  letterSpacing: "0.08em",
  fontFamily: fonts.mono,
  marginTop: "3px",
  textTransform: "uppercase",
};

const listCard = {
  padding: "14px",
  borderRadius: `${radius.md}px`,
  background: colors.bgInset,
  border: `1.5px solid ${colors.border}`,
};

const listHeading = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  marginBottom: "12px",
  fontSize: "9.5px",
  color: colors.inkFaint,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  fontFamily: fonts.mono,
  fontWeight: 700,
};

const emptyBox = {
  padding: "16px",
  textAlign: "center",
  border: `1.5px dashed ${colors.borderSubtle}`,
  borderRadius: `${radius.md}px`,
  color: colors.inkFaint,
  fontSize: "10.5px",
  fontFamily: fonts.mono,
};

const listRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  rowGap: "4px",
  gap: "10px",
  padding: "9px 10px",
  borderRadius: `${radius.sm}px`,
  background: colors.bgElevated,
  border: `1.5px solid ${colors.borderSubtle}`,
};

const rankBadge = {
  flexShrink: 0,
  width: "18px",
  height: "18px",
  borderRadius: `${radius.sm}px`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: colors.brandDim,
  border: `1.5px solid ${colors.brand}`,
  color: colors.brand,
  fontSize: "8.5px",
  fontFamily: fonts.mono,
  fontWeight: 700,
};
