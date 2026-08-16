/**
 * components/RecoveryStats.jsx
 *
 * Same props (recoveryStats, showTailscaleRecoveryDetails/
 * showTailscaleFailureDetails + their setters) and same data fields —
 * only the presentation was reworked to the "Chalkboard Neo-Brutalist"
 * system: flat tokens from theme.js instead of a local cyan-glow palette,
 * lucide-react icons instead of react-icons/fa, and the shared
 * `badge-pulse` global keyframe (from App.jsx) instead of a local one.
 */

import { ShieldAlert, Zap, Satellite, ChevronDown, AlertTriangle } from "lucide-react";
import { colors, fonts, radius } from "../dashboard/theme.js";

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
      <ChevronDown size={9} strokeWidth={2} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
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

const card = {
  padding: "12px",
  borderRadius: `${radius.md}px`,
  background: colors.bgInset,
  border: `1px solid ${colors.border}`,
};

const subStatCard = {
  padding: "8px 10px",
  borderRadius: `${radius.sm}px`,
  background: colors.bgElevated,
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
  background: colors.bgInset,
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
  background: colors.bgElevated,
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
  background: colors.bgInset,
};

const loadingValue = {
  width: "38px",
  height: "19px",
  borderRadius: "2px",
  background: colors.bgCard,
  border: `1px solid ${colors.borderSubtle}`,
};

const loadingLabel = {
  width: "72px",
  height: "8px",
  borderRadius: "2px",
  background: colors.bgCard,
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
  background: colors.bgElevated,
  color: colors.inkDim,
  borderRadius: `${radius.sm}px`,
  padding: "7px",
  fontSize: "9px",
  fontFamily: fonts.mono,
  fontWeight: 700,
  letterSpacing: "0.08em",
  cursor: "pointer",
  transition: "color 150ms ease, border-color 150ms ease",
};
