/**
 * components/SessionAnalytics.jsx
 *
 * P5-T11 token-elevation audit (typeScale/surface, per D-008/D-009).
 * Final page in Phase P5 — same fetch/refresh/loading/error logic and the
 * same `isAdmin` gating as before; only background/typography tokens were
 * aliased.
 *
 * Backgrounds: all 5 `colors.bg*` references in this file were checked
 * and swapped for their `surface.l*` alias (bgInset->l1, bgElevated->l2,
 * bgCard->l3) — same CSS custom properties under a new name, zero visual
 * change, same 1:1 verification every prior P5 file used. The 5: `box`'s
 * `colors.bgCard` (l3), `refreshButton`'s `colors.bgElevated` (l2),
 * `statTile`'s `colors.bgInset` (l1), `listCard`'s `colors.bgInset` (l1),
 * and `listRow`'s `colors.bgElevated` (l2). `bgCardHover`/l4 does not
 * occur in this file.
 *
 * Typography: every `fontSize`/`fontWeight`/`fontFamily` group in this
 * file was checked against `typeScale`'s six steps. There are 10 such
 * groups (not 9 as an earlier dispatch estimate had it — the estimate
 * folded `StatTile`'s icon-tile style and its value style into "one
 * inline group," but they're two separate style objects: the icon-tile
 * only sets `fontSize: "13px"`, while the value sets `fontSize`/
 * `fontWeight`/`fontFamily`/`lineHeight` independently). Exactly one is
 * a genuine clean match: `listHeading` (9.5px/700/mono/0.13em/uppercase)
 * is the identical value set Host Monitor's `sectionHeading` and Game
 * Manager's `FieldLabel` both used and both converted, "a clean fit
 * within rounding" against `typeScale.meta`'s 10px/700/mono/0.12em/
 * uppercase — the same 0.5px size gap / 0.01em letter-spacing gap those
 * two precedents accepted. Converted to `...typeScale.meta`. Everything
 * else is left as a documented literal, none landing cleanly:
 *   - `StatTile` icon-tile (13px, no weight/family set) and `title`
 *     (15px/700/display) both use sizes outside the 6-step scale
 *     entirely (10/12/13.5/17/28/hero).
 *   - `StatTile` value (17px/700/mono/1.1 line-height) is the closest
 *     candidate against `typeScale.subheading` (17px/600/display/1.4) —
 *     size matches, but weight, font family, and line-height all
 *     diverge, a materially bigger gap than `listHeading`'s.
 *   - `emptyBreakdown` (10px/mono, no weight/letter-spacing/uppercase
 *     set) matches `meta`'s size only; weight/letter-spacing/
 *     text-transform are all absent, so it stays literal.
 *   - `scopePill` (8px/700/mono/0.06em), `refreshButton` (9px/700/mono/
 *     0.08em), `errorBox` (11px/mono, no weight), `statLabel` (8.5px/
 *     mono, no weight, 0.08em), and `rankBadge` (8.5px/700/mono, no
 *     letter-spacing) each diverge from every step on size and/or
 *     weight/letter-spacing by more than the accepted-precedent gap and
 *     are left as documented literals.
 * Net: one genuine `typeScale` conversion in this file — the same "one
 * clean match" outcome Host Monitor/Game Manager found, not Recovery/
 * Sunshine's "zero matches" outcome.
 */
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
import { colors, fonts, radius, surface, typeScale } from "../dashboard/theme.js";

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
          // Per §6.4: 30px icon badge is small chrome, the sanctioned
          // `radius.tight` (4px) exception. Was `radius.sm` (also 4,
          // value-preserving rename to the binary system's small-
          // chrome key).
          borderRadius: `${radius.tight}px`,
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
          <RefreshCw
            size={10}
            strokeWidth={2}
            style={
              loading
                ? {
                    // P6-T08 motion audit: keyframe-based `animation:` (not
                    // `transition:`), same non-convertible category as
                    // primitives.jsx's Spinner (P6-T02) and StatusBadge.jsx's
                    // pulse (P6-T05). `motion`'s four steps are transition
                    // timing strings ("<duration> <easing>"), not @keyframes
                    // names, so there is no equivalent to alias to here
                    // regardless of the 0.8s duration. Left as the original
                    // literal; no conversion.
                    animation: "sa-spin 0.8s linear infinite",
                  }
                : undefined
            }
          />
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
  /* TCB-P4.2 followup: surface.l3 → surface.l1 to match
     `.pcgo-host-diagnostics-card` (the inset tier introduced by the
     Host Monitor section-card alignment). SessionAnalytics' `box`
     is the page-level framed section card, so it now sits on the
     inset tier like every other page-level section card in this
     pass. */
  background: surface.l1,
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
  // Per §6.4: 28px icon badge is small chrome, the sanctioned
  // `radius.tight` (4px) exception. Was `radius.sm` (also 4, value-
  // preserving rename).
  borderRadius: `${radius.tight}px`,
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
  // Per §6.4: scope pill is a chip, the sanctioned `radius.tight`
  // (4px) exception. Was `radius.sm` (also 4, value-preserving
  // rename).
  borderRadius: `${radius.tight}px`,
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
  background: surface.l2,
  color: colors.inkDim,
  // Per §6.4: refresh button is small chrome, the sanctioned
  // `radius.tight` (4px) exception. Was `radius.sm` (also 4, value-
  // preserving rename).
  borderRadius: `${radius.tight}px`,
  padding: "5px 12px",
  fontSize: "9px",
  fontFamily: fonts.mono,
  fontWeight: 700,
  letterSpacing: "0.08em",
  // P6-T08 motion audit: 150ms does not exactly match any motion step
  // (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms). Left as the
  // original literal.
  transition: "color 150ms ease, border-color 150ms ease",
};

const errorBox = {
  display: "flex",
  alignItems: "flex-start",
  gap: "8px",
  padding: "10px 12px",
  // TCB-P3 followup: softened from `radius.lg` (0px) to `radius.lg`
  // (16px) — the error box is a container surface, and the 16px
  // curve matches every other container in the app (Card primitive,
  // SessionSidebar rail, GameManager game card, etc.). Note: the
  // 1.5px danger stroke is the danger signal, the radius is a
  // separate axis — softening the corner does not weaken the
  // danger callout (the danger color is unchanged).
  borderRadius: `${radius.lg}px`,
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
  // TCB-P3 followup: softened from `radius.lg` (0px) to `radius.lg`
  // (16px) — the stat tile is a container surface (one of 8 tiles
  // in the metrics row), and matching the 16px curve gives the
  // tile the same "soft framed chip" character as the parent
  // SessionAnalytics box and every other container in the app.
  borderRadius: `${radius.lg}px`,
  background: surface.l1,
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
  borderRadius: `${radius.lg}px`,
  background: surface.l1,
  border: `1px solid ${colors.borderSubtle}`,
};

const listHeading = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  marginBottom: "10px",
  color: colors.inkFaint,
  // typeScale.meta = 10px/1.3/700/0.12em/uppercase/mono — clean fit within
  // rounding against this rule's pre-existing 9.5px/0.13em (same 0.5px/
  // 0.01em gap Host Monitor's `sectionHeading`/Game Manager's `FieldLabel`
  // both treated as a clean match).
  ...typeScale.meta,
};

const emptyBreakdown = {
  padding: "14px 10px",
  border: `1px dashed ${colors.borderSubtle}`,
  // TCB-P3 followup: softened from `radius.sm` (4px) to `radius.lg`
  // (16px) — the empty-breakdown is the "no data yet" dashed
  // placeholder inside `listCard`, and a 16px curve on both the
  // inner empty-state and the outer listCard reads as a single
  // framed empty card (matches the GameManager `emptyState` /
  // `card` 16px nesting). The dashed border + inkFaint copy is
  // the empty signal, the radius is a separate axis.
  borderRadius: `${radius.lg}px`,
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
  // TCB-P3 followup: value-preserving rename from `radius.sm` (4px)
  // to `radius.tight` (4px) — same 4px curve, the `sm` alias now
  // collapses into `tight` after TCB-P3 reintroduced `lg` as the
  // soft-container scale. `listRow` is a small chrome row inside
  // `listCard`, the 4px "tight" step is the right value here (not
  // `lg`, which would visually compete with the parent 16px card).
  borderRadius: `${radius.tight}px`,
  background: surface.l2,
  border: `1px solid ${colors.borderSubtle}`,
};

const rankBadge = {
  flexShrink: 0,
  width: "18px",
  height: "18px",
  // TCB-P3 followup: value-preserving rename from `radius.sm` (4px)
  // to `radius.tight` (4px) — a small numeric chip (the "#1 / #2 / #3"
  // rank pills shown in the breakdown list), the 4px "tight" step
  // is the correct scale; `lg` (16px) would make the pill wider
  // than its content justifies, breaking the chip-scale / card-scale
  // separation that defines the binary system.
  borderRadius: `${radius.tight}px`,
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
