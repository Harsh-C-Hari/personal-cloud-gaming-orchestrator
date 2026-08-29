/**
 * components/RecoveryStats.jsx
 *
 * Same props (recoveryStats, showTailscaleRecoveryDetails/
 * showTailscaleFailureDetails + their setters) and same data fields —
 * only the presentation was reworked to the "Chalkboard Neo-Brutalist"
 * system: flat tokens from theme.js instead of a local cyan-glow palette,
 * lucide-react icons instead of react-icons/fa, and the shared
 * `badge-pulse` global keyframe (from App.jsx) instead of a local one.
 *
 * P5-T05 token pass (D-008/D-009):
 *
 * Backgrounds: all 9 `colors.bg*` references in this file (2x bgCard,
 * 3x bgInset, 3x bgElevated, plus a duplicate bgCard on the loading
 * skeleton) have been swapped for their `surface.l*` alias per D-009 —
 * same CSS custom property, same value, zero visual change. `colors` is
 * still imported/used throughout for non-background tokens (ink/border/
 * brand/status colors) and is unaffected.
 *
 * Typography: this component's dense "operational readout" character
 * uses a set of small, bespoke sizes (8.5px-19px) tuned for compact
 * stat tiles and mono-numeral displays, not the editorial `typeScale`
 * steps. Checked every inline font group below against `typeScale` and
 * left all of them as documented literals rather than force-fitting a
 * mismatch, per D-005/D-009 ("only convert what cleanly matches...
 * document and leave literal anything that doesn't"):
 * - `title` (15px/700/display): closest candidate to
 *   `typeScale.subheading` (17px/600/-0.01em/display) — font-family
 *   matches, but weight (700 vs 600) and size (15px vs 17px) don't —
 *   left literal. Identical object/finding to Session History's
 *   `title` (P5-T04) and shared verbatim with `RecoveryEvents.jsx`'s
 *   `title` for sibling consistency.
 * - `summaryEyebrow`, `channelHeading` (both 9px/700/0.12em/uppercase/
 *   mono): weight/letter-spacing/case/family all match
 *   `typeScale.meta` (10px/700/0.12em/uppercase/mono) — only the size
 *   (9px vs 10px) doesn't — left literal as the closest near-miss in
 *   the file.
 * - `sectionLabel` (9px/700/0.13em/uppercase/mono): same size gap plus
 *   a letter-spacing mismatch (0.13em vs 0.12em) — left literal.
 * - `postureBadge`, `detailToggle` (both 9px/700/0.08em/mono, no
 *   uppercase): size and letter-spacing both miss `typeScale.meta` —
 *   left literal. `detailToggle` is shared verbatim with
 *   `RecoveryEvents.jsx`'s `showAllButton`.
 * - `panelDescription` (9.5px/400/mono, no letter-spacing/uppercase):
 *   no `typeScale` step sits here — left literal. Shared verbatim with
 *   `RecoveryEvents.jsx`'s `panelDescription`.
 * - `loadingHeader` (10.5px/mono), `labelStyle` (8.5px/0.04em/
 *   uppercase/mono), `valueStyle` (19px/700/mono), `SubStat`'s two
 *   inline groups (15px/700/mono and 8.5px/0.08em/mono): none match a
 *   `typeScale` step at matching size+weight+family — left literal.
 * All of the above keep their exact pre-existing literal values;
 * nothing here changes visually. See `RecoveryEvents.jsx` for the
 * sibling component's matching audit — the two share several style
 * objects verbatim (`title`, `headerIcon`, `panelDescription`, `box`)
 * and use the same near-miss reasoning throughout, keeping the two
 * internally consistent with each other per this task's design
 * requirement.
 */

import { ShieldAlert, Zap, Satellite, ChevronDown, AlertTriangle } from "lucide-react";
import { colors, fonts, radius, surface } from "../dashboard/theme.js";

function StatTile({ icon, label: labelText, value: valueNum, tone }) {
  return (
    <div className="pcgo-recovery-stat-tile" style={{ ...card, display: "flex", alignItems: "center", gap: "12px" }}>
      <div
        style={{
          flexShrink: 0,
          width: "32px",
          height: "32px",
          borderRadius: `${radius.sm}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: `${tone}1a`,
          border: `1.5px solid ${tone}40`,
          color: tone,
          fontSize: "13px",
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ ...valueStyle, color: tone }}>{valueNum ?? 0}</div>
        <div style={labelStyle}>{labelText}</div>
      </div>
    </div>
  );
}

function DetailToggle({ open, onClick, label, controls }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls={controls}
      style={detailToggle}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = colors.ink;
        e.currentTarget.style.borderColor = colors.borderStrong;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = colors.inkDim;
        e.currentTarget.style.borderColor = colors.border;
      }}
    >
      {label}
      <ChevronDown
        size={9}
        strokeWidth={2}
        // P6-T09 motion audit: 0.2s (200ms) plain `ease`-default does not
        // exactly match any `motion` step (fast=100ms, base=160ms,
        // cardIn=220ms, pill=180ms cubic-bezier) — same non-match as
        // ErrorBoundary.jsx's identical chevron pattern (P6-T04). Left as
        // a literal, not converted.
        style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
      />
    </button>
  );
}

export function RecoveryStats({
  recoveryStats,
  showTailscaleRecoveryDetails,
  setShowTailscaleRecoveryDetails,
  showTailscaleFailureDetails,
  setShowTailscaleFailureDetails,
}) {
  const sunshineRecoveries = recoveryStats?.sunshine_restarts ?? 0;
  const sunshineFailures = recoveryStats?.sunshine_failures ?? 0;
  const tailscaleRecoveries = recoveryStats?.tailscale_recoveries ?? 0;
  const tailscaleFailures = recoveryStats?.tailscale_failures ?? 0;
  const totalRecoveries = sunshineRecoveries + tailscaleRecoveries;
  const totalFailures = sunshineFailures + tailscaleFailures;
  const postureTone = totalFailures > 0 ? colors.warning : colors.success;
  const postureLabel = totalFailures > 0 ? "ATTENTION" : "STABLE";

  return (
    <section className="pcgo-recovery-stats-panel" style={box} aria-labelledby="recovery-system-title">
      <div className="pcgo-recovery-panel-heading" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
          <div style={headerIcon}>
            <ShieldAlert size={13} strokeWidth={2} />
          </div>
          <div>
            <h2 id="recovery-system-title" style={title}>Recovery System</h2>
            <div style={panelDescription}>Automated recovery posture and failure signals</div>
          </div>
        </div>
        {recoveryStats && <span style={{ ...postureBadge, color: postureTone, borderColor: `${postureTone}66`, background: `${postureTone}1a` }}>{postureLabel}</span>}
      </div>

      {!recoveryStats ? (
        <RecoveryStatsLoadingState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div className="pcgo-recovery-summary" style={{ ...summaryBand, borderLeftColor: postureTone }}>
            <div>
              <span style={summaryEyebrow}>Operational posture</span>
              <strong>{totalFailures > 0 ? "Recovery needs attention" : "Recovery is stable"}</strong>
              <span>{totalFailures > 0 ? "One or more recovery failure signals are present." : "No recovery failures are recorded in the current telemetry."}</span>
            </div>
            <div style={{ display: "flex", gap: "16px", flexShrink: 0 }}>
              <div style={summaryMetric}><strong>{totalRecoveries}</strong><span>RECOVERIES</span></div>
              <div style={summaryMetric}><strong style={{ color: totalFailures > 0 ? colors.danger : colors.ink }}>{totalFailures}</strong><span>FAILURES</span></div>
            </div>
          </div>

          <div style={sectionLabel}><ShieldAlert size={9} strokeWidth={2} /> Recovery channels</div>
          <div className="pcgo-recovery-channel-grid">
            <div className="pcgo-recovery-channel" style={channelCard}>
              <div style={channelHeading}><Zap size={10} strokeWidth={2} /> Sunshine</div>
              <div className="pcgo-2col" style={{ gap: "10px" }}>
                <StatTile icon={<Zap size={13} strokeWidth={2} />} label="Recoveries" value={sunshineRecoveries} tone={colors.success} />
                <StatTile icon={<AlertTriangle size={13} strokeWidth={2} />} label="Failures" value={sunshineFailures} tone={colors.danger} />
              </div>
            </div>

            <div className="pcgo-recovery-channel" style={channelCard}>
              <div style={channelHeading}><Satellite size={10} strokeWidth={2} /> Tailscale</div>
              <div className="pcgo-2col" style={{ gap: "10px" }}>
                <StatTile icon={<Satellite size={13} strokeWidth={2} />} label="Recoveries" value={tailscaleRecoveries} tone={colors.success} />
                <StatTile icon={<AlertTriangle size={13} strokeWidth={2} />} label="Failures" value={tailscaleFailures} tone={colors.danger} />
              </div>
              <DetailToggle
                open={showTailscaleRecoveryDetails}
                onClick={() => setShowTailscaleRecoveryDetails(!showTailscaleRecoveryDetails)}
                label={showTailscaleRecoveryDetails ? "HIDE RECOVERY DETAILS" : "SHOW RECOVERY DETAILS"}
                controls="tailscale-recovery-details"
              />
              {showTailscaleRecoveryDetails && (
                <div id="tailscale-recovery-details" style={subGrid}>
                  <SubStat label="Service Recoveries" value={recoveryStats?.tailscale_service_recoveries ?? 0} />
                  <SubStat label="IPN Recoveries" value={recoveryStats?.tailscale_ipn_recoveries ?? 0} />
                  <SubStat label="Up Recoveries" value={recoveryStats?.tailscale_up_recoveries ?? 0} />
                </div>
              )}
              <DetailToggle
                open={showTailscaleFailureDetails}
                onClick={() => setShowTailscaleFailureDetails(!showTailscaleFailureDetails)}
                label={showTailscaleFailureDetails ? "HIDE FAILURE DETAILS" : "SHOW FAILURE DETAILS"}
                controls="tailscale-failure-details"
              />
              {showTailscaleFailureDetails && (
                <div id="tailscale-failure-details" style={subGrid}>
                  <SubStat label="Nostate Events" value={recoveryStats?.tailscale_nostate ?? 0} />
                  <SubStat label="Stopped Events" value={recoveryStats?.tailscale_stopped ?? 0} />
                  <SubStat label="Service Stopped" value={recoveryStats?.tailscale_service_stopped ?? 0} />
                  <SubStat label="IPN Missing" value={recoveryStats?.tailscale_ipn_missing ?? 0} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function RecoveryStatsLoadingState() {
  return (
    <div className="pcgo-recovery-loading-state" role="status" aria-live="polite">
      <div style={loadingHeader}>
        <span style={loadingDot} />
        Loading recovery telemetry
      </div>
      <div className="pcgo-recovery-summary" style={{ ...summaryBand, borderLeftColor: colors.brand }} aria-hidden="true">
        <div>
          <span style={summaryEyebrow}>Operational posture</span>
          <strong>Waiting for recovery data</strong>
          <span>Recovery counts and failure signals will appear when telemetry responds.</span>
        </div>
        <span style={{ ...postureBadge, color: colors.neutral, borderColor: `${colors.neutral}66`, background: `${colors.neutral}1a` }}>PENDING</span>
      </div>
      <div className="pcgo-recovery-channel-grid" aria-hidden="true">
        <LoadingChannel title="Sunshine" icon={<Zap size={10} strokeWidth={2} />} />
        <LoadingChannel title="Tailscale" icon={<Satellite size={10} strokeWidth={2} />} />
      </div>
    </div>
  );
}

function LoadingChannel({ title: heading, icon }) {
  return (
    <div style={channelCard}>
      <div style={channelHeading}>{icon} {heading}</div>
      <div className="pcgo-2col" style={{ gap: "10px" }}>
        <div style={loadingTile}><span style={loadingValue} /><span style={loadingLabel} /></div>
        <div style={loadingTile}><span style={loadingValue} /><span style={loadingLabel} /></div>
      </div>
    </div>
  );
}

function SubStat({ label, value }) {
  return (
    <div style={subStatCard}>
      <div style={{ fontSize: "15px", fontWeight: 700, color: colors.ink, fontFamily: fonts.mono }}>{value}</div>
      <div style={{ fontSize: "8.5px", color: colors.inkFaint, letterSpacing: "0.08em", fontFamily: fonts.mono, marginTop: "2px" }}>
        {label.toUpperCase()}
      </div>
    </div>
  );
}

const box = {
  padding: "20px",
  border: `1px solid ${colors.border}`,
  borderRadius: `${radius.lg}px`,
  background: surface.l3,
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

const card = {
  padding: "12px",
  borderRadius: `${radius.md}px`,
  background: surface.l1,
  border: `1px solid ${colors.border}`,
};

const subStatCard = {
  padding: "8px 10px",
  borderRadius: `${radius.sm}px`,
  background: surface.l2,
  border: `1px solid ${colors.borderSubtle}`,
};

const panelDescription = {
  marginTop: "3px",
  color: colors.inkFaint,
  fontSize: "9.5px",
  lineHeight: 1.4,
  fontFamily: fonts.mono,
};

const postureBadge = {
  flexShrink: 0,
  padding: "4px 8px",
  border: "1px solid",
  borderRadius: `${radius.sm}px`,
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  fontFamily: fonts.mono,
};

const summaryBand = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  padding: "14px 16px",
  border: `1px solid ${colors.borderSubtle}`,
  borderLeft: `2px solid ${colors.brand}`,
  borderRadius: `${radius.md}px`,
  background: surface.l1,
};

const summaryEyebrow = {
  display: "block",
  color: colors.inkFaint,
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  fontFamily: fonts.mono,
};

const summaryMetric = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: "3px",
};

const channelCard = {
  padding: "12px",
  border: `1px solid ${colors.borderSubtle}`,
  borderRadius: `${radius.md}px`,
  background: surface.l2,
};

const channelHeading = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  marginBottom: "10px",
  color: colors.inkFaint,
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  fontFamily: fonts.mono,
};

const loadingHeader = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "14px",
  color: colors.inkDim,
  fontSize: "10.5px",
  fontFamily: fonts.mono,
};

const loadingDot = {
  width: "7px",
  height: "7px",
  borderRadius: "50%",
  background: colors.brand,
  // P6-T09 motion audit: keyframe-based `animation:` (not `transition:`),
  // same recurring pulse-dot string already documented in StatusBadge.jsx,
  // LoadingState.jsx, RecoveryEvents.jsx, and (as `ssh-pulse`)
  // SunshineStreamHistory.jsx. `motion`'s four steps are transition timing
  // strings ("<duration> <easing>"), not @keyframes names, so there is no
  // equivalent to alias to here regardless of the 1.6s duration. Left as
  // the original literal; no conversion.
  animation: "badge-pulse 1.6s ease-in-out infinite",
  flexShrink: 0,
};

const loadingTile = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "12px",
  border: `1px solid ${colors.border}`,
  borderRadius: `${radius.md}px`,
  background: surface.l1,
};

const loadingValue = {
  width: "38px",
  height: "19px",
  borderRadius: "2px",
  background: surface.l3,
  border: `1px solid ${colors.borderSubtle}`,
};

const loadingLabel = {
  width: "72px",
  height: "8px",
  borderRadius: "2px",
  background: surface.l3,
  border: `1px solid ${colors.borderSubtle}`,
};

const labelStyle = {
  fontSize: "8.5px",
  color: colors.inkFaint,
  letterSpacing: "0.04em",
  whiteSpace: "nowrap",
  fontFamily: fonts.mono,
  marginTop: "2px",
  textTransform: "uppercase",
};

const valueStyle = {
  fontSize: "19px",
  fontWeight: 700,
  fontFamily: fonts.mono,
  lineHeight: 1.1,
};

const sectionLabel = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  fontSize: "9px",
  color: colors.inkFaint,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  fontFamily: fonts.mono,
  fontWeight: 700,
};

const subGrid = {
  marginTop: "8px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
  gap: "8px",
};

const detailToggle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  width: "100%",
  marginTop: "8px",
  border: `1px solid ${colors.border}`,
  background: surface.l2,
  color: colors.inkDim,
  borderRadius: `${radius.sm}px`,
  padding: "7px",
  fontSize: "9px",
  fontFamily: fonts.mono,
  fontWeight: 700,
  letterSpacing: "0.08em",
  cursor: "pointer",
  // P6-T09 motion audit: real `transition:`, but 150ms doesn't exactly
  // match any `motion` step (fast: 100ms, base: 160ms, cardIn: 220ms,
  // pill: 180ms cubic-bezier). Left as the original literal; no
  // conversion.
  transition: "color 150ms ease, border-color 150ms ease",
};
