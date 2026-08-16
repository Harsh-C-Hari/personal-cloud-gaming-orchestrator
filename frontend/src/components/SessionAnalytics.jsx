import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Gamepad2,
  HeartPulse,
  History,
  Info,
  Percent,
  RefreshCw,
  Timer,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { fetchSessionAnalytics } from "../api/client";
import { colors, fonts, radius } from "../dashboard/theme.js";

function formatPlayedTime(seconds) {
  if (seconds == null) return "--";

  const totalSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function getReliabilityColor(reliability) {
  switch (reliability) {
    case "Excellent":
      return colors.success;
    case "Good":
      return colors.brand;
    case "Warning":
      return colors.warning;
    case "Poor":
      return colors.danger;
    default:
      return colors.neutral;
  }
}

function StatTile({ icon, label, value, tone = colors.brand }) {
  return (
    <div className="pcgo-analytics-stat" style={statTile}>
      <div
        style={{
          flexShrink: 0,
          width: "30px",
          height: "30px",
          borderRadius: `${radius.sm}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `color-mix(in srgb, ${tone} 10%, transparent)`,
          border: `1px solid color-mix(in srgb, ${tone} 25%, transparent)`,
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
            overflowWrap: "anywhere",
          }}
        >
          {value}
        </div>
        <div style={statLabel}>{label}</div>
      </div>
    </div>
  );
}

function StatList({ title: listTitle, items = [], labelKey, icon }) {
  return (
    <section className="pcgo-analytics-breakdown" style={listCard} aria-labelledby={`analytics-${labelKey}-title`}>
      <div id={`analytics-${labelKey}-title`} style={listHeading}>
        {icon}
        {listTitle}
      </div>

      {items.length === 0 ? (
        <div style={emptyBreakdown}>No breakdown data returned.</div>
      ) : (
        <div className="pcgo-analytics-breakdown__list">
          {items.slice(0, 5).map((item, idx) => {
            const label = labelKey === "user_game"
              ? `${item.user_id || "unknown"} · ${item.game_id || "unknown"}`
              : item[labelKey] || "unknown";

            return (
              <div key={`${listTitle}-${item.user_id || ""}-${item.game_id || item[labelKey] || idx}`} style={listRow}>
                <div className="pcgo-analytics-breakdown__identity">
                  <span style={rankBadge}>{idx + 1}</span>
                  <span title={label}>{label}</span>
                </div>
                <span className="pcgo-analytics-breakdown__metrics">
                  {item.sessions} sessions · {formatPlayedTime(item.played_seconds)} · avg {formatPlayedTime(item.average_played_seconds)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function AnalyticsLoading() {
  return (
    <div className="pcgo-analytics-loading" role="status" aria-label="Loading analytics">
      <div className="pcgo-analytics-loading__metrics">
        {[1, 2, 3, 4].map((item) => <span key={item} />)}
      </div>
      <div className="pcgo-analytics-loading__breakdowns">
        {[1, 2].map((item) => (
          <div className="pcgo-analytics-loading__panel" key={item}>
            <span />
            <span />
            <span />
            <span />
          </div>
        ))}
      </div>
    </div>
  );
}

const INITIAL_ANALYTICS = {
  total_sessions: 0,
  total_played_seconds: 0,
  successful_sessions: 0,
  failed_sessions: 0,
  recovered_sessions: 0,
  success_rate: 0,
  average_playtime_seconds: 0,
  system_reliability: "None",
  by_user: [],
  by_game: [],
  by_user_game: [],
};

export function SessionAnalytics({ refreshKey = 0 }) {
  const isAdmin = localStorage.getItem("role") === "admin";
  const [analytics, setAnalytics] = useState(INITIAL_ANALYTICS);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const loadingRef = useRef(false);

  async function loadAnalytics() {
    if (loadingRef.current) return;

    loadingRef.current = true;
    setLoading(true);

    try {
      const data = await fetchSessionAnalytics();
      setAnalytics({
        total_sessions: data.total_sessions || 0,
        total_played_seconds: data.total_played_seconds || 0,
        successful_sessions: data.successful_sessions || 0,
        failed_sessions: data.failed_sessions || 0,
        recovered_sessions: data.recovered_sessions || 0,
        success_rate: data.success_rate || 0,
        average_playtime_seconds: data.average_playtime_seconds || 0,
        system_reliability: data.system_reliability || "None",
        by_user: data.by_user || [],
        by_game: data.by_game || [],
        by_user_game: data.by_user_game || [],
      });
      setError("");
      setHasLoaded(true);
    } catch (err) {
      setError(err.message || "Failed to load analytics.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (!refreshKey) return;
    loadAnalytics();
  }, [refreshKey]);

  const hasData = analytics.total_sessions > 0;
  const scopeLabel = isAdmin ? "LIFETIME HOST AGGREGATE" : "USER HISTORY AGGREGATE";

  return (
    <section className="pcgo-analytics" style={box} aria-labelledby="analytics-title">
      <div className="pcgo-analytics__header">
        <div className="pcgo-analytics__heading">
          <div style={headerIcon}><BarChart3 size={13} strokeWidth={2} /></div>
          <div style={{ minWidth: 0 }}>
            <div className="pcgo-analytics__eyebrow">INTERPRETATION LAYER</div>
            <h2 id="analytics-title" style={title}>Session Analytics</h2>
            <p className="pcgo-analytics__description">Backend aggregates and ranked activity breakdowns above the session record.</p>
          </div>
          <span style={scopePill}>{scopeLabel}</span>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={loadAnalytics}
          aria-label={loading ? "Refreshing analytics" : "Refresh analytics"}
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
          <RefreshCw size={10} strokeWidth={2} style={loading ? { animation: "sa-spin 0.8s linear infinite" } : undefined} />
          {loading ? "REFRESHING..." : "REFRESH"}
        </button>
      </div>

      <div className="pcgo-analytics__scope-note">
        <Info size={11} strokeWidth={2} />
        No date range is selected; values use the backend analytics scope for the current role.
      </div>

      {loading && hasLoaded && <div className="pcgo-analytics__refresh-note" role="status">Refreshing backend aggregates…</div>}
      {error && (
        <div style={errorBox} role="alert">
          <XCircle size={12} strokeWidth={2} />
          <span>{error}</span>
        </div>
      )}

      {loading && !hasLoaded ? (
        <AnalyticsLoading />
      ) : (
        <>
          <div className="pcgo-analytics__metrics" aria-label="Analytics key metrics">
            <StatTile icon={<History size={13} strokeWidth={2} />} label="Total sessions" value={analytics.total_sessions} />
            <StatTile icon={<Clock size={13} strokeWidth={2} />} label="Total played" value={formatPlayedTime(analytics.total_played_seconds)} />
            <StatTile icon={<CheckCircle2 size={13} strokeWidth={2} />} label="Completed" value={analytics.successful_sessions} tone={colors.success} />
            <StatTile icon={<XCircle size={13} strokeWidth={2} />} label="Failed" value={analytics.failed_sessions} tone={colors.danger} />
            <StatTile icon={<RefreshCw size={13} strokeWidth={2} />} label="Recovered" value={analytics.recovered_sessions} tone={colors.warning} />
            {hasData && <StatTile icon={<Percent size={13} strokeWidth={2} />} label="Success rate" value={`${analytics.success_rate}%`} tone={colors.success} />}
            {hasData && <StatTile icon={<Timer size={13} strokeWidth={2} />} label="Average playtime" value={formatPlayedTime(analytics.average_playtime_seconds)} />}
            {hasData && isAdmin && <StatTile icon={<HeartPulse size={13} strokeWidth={2} />} label="Reliability" value={analytics.system_reliability} tone={getReliabilityColor(analytics.system_reliability)} />}
          </div>

          {!hasData && !error ? (
            <div className="pcgo-analytics__empty" role="status">
              <BarChart3 size={19} strokeWidth={1.5} />
              <strong>No historical session data yet.</strong>
              <span>Rates, averages, reliability, and ranked patterns will appear after the first persisted session record.</span>
            </div>
          ) : (
            <>
              <div className="pcgo-analytics__pattern-heading">
                <div>
                  <span>AVAILABLE PATTERNS</span>
                  <p>Breakdowns are ordered by played time from the backend response.</p>
                </div>
              </div>
              <div className="pcgo-analytics__breakdowns">
                {isAdmin && <StatList title="By user" items={analytics.by_user} labelKey="user_id" icon={<User size={9} strokeWidth={2} />} />}
                <StatList title="By game" items={analytics.by_game} labelKey="game_id" icon={<Gamepad2 size={9} strokeWidth={2} />} />
                {isAdmin && <StatList title="By user + game" items={analytics.by_user_game} labelKey="user_game" icon={<Users size={9} strokeWidth={2} />} />}
              </div>
            </>
          )}
        </>
      )}

      <style>{`@keyframes sa-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
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

const scopePill = {
  flexShrink: 0,
  padding: "4px 8px",
  border: `1px solid ${colors.borderSubtle}`,
  borderRadius: `${radius.sm}px`,
  color: colors.inkFaint,
  fontSize: "8px",
  fontFamily: fonts.mono,
  fontWeight: 700,
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

const errorBox = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  padding: "10px 12px",
  borderRadius: `${radius.md}px`,
  border: `1.5px solid ${colors.danger}`,
  background: "rgba(240,127,131,0.08)",
  color: colors.danger,
  fontSize: "11px",
  fontFamily: fonts.mono,
  overflowWrap: "anywhere",
};

const statTile = {
  minWidth: 0,
  padding: "12px",
  borderRadius: `${radius.md}px`,
  background: colors.bgInset,
  border: `1px solid ${colors.borderSubtle}`,
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const statLabel = {
  fontSize: "8.5px",
  color: colors.inkFaint,
  letterSpacing: "0.08em",
  fontFamily: fonts.mono,
  marginTop: "3px",
  textTransform: "uppercase",
};

const listCard = {
  minWidth: 0,
  padding: "15px",
  borderRadius: `${radius.md}px`,
  background: colors.bgInset,
  border: `1px solid ${colors.borderSubtle}`,
};

const listHeading = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  marginBottom: "10px",
  fontSize: "9.5px",
  color: colors.inkFaint,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  fontFamily: fonts.mono,
  fontWeight: 700,
};

const emptyBreakdown = {
  padding: "14px 10px",
  border: `1px dashed ${colors.borderSubtle}`,
  borderRadius: `${radius.sm}px`,
  color: colors.inkFaint,
  fontSize: "10px",
  fontFamily: fonts.mono,
  textAlign: "center",
};

const listRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  rowGap: "5px",
  gap: "10px",
  padding: "9px 10px",
  borderRadius: `${radius.sm}px`,
  background: colors.bgElevated,
  border: `1px solid ${colors.borderSubtle}`,
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
  border: `1px solid ${colors.brand}`,
  color: colors.brand,
  fontSize: "8.5px",
  fontFamily: fonts.mono,
  fontWeight: 700,
};
