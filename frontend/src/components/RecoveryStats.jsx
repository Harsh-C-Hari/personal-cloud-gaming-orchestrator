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
    <div style={{ ...card, display: "flex", alignItems: "center", gap: "12px" }}>
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

function DetailToggle({ open, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
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
  return (
    <section style={box}>
      <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "16px" }}>
        <div style={headerIcon}>
          <ShieldAlert size={13} strokeWidth={2} />
        </div>
        <h2 style={title}>Recovery System</h2>
      </div>

      {!recoveryStats ? (
        <div style={{ display: "flex", alignItems: "center", gap: "9px", color: colors.inkDim, fontFamily: fonts.mono, fontSize: "11.5px" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: colors.brand, animation: "badge-pulse 1.6s ease-in-out infinite" }} />
          Loading recovery statistics...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Sunshine */}
          <div style={sectionLabel}>
            <Zap size={9} strokeWidth={2} /> Sunshine
          </div>
          <div className="pcgo-2col" style={{ gap: "10px" }}>
            <StatTile icon={<Zap size={13} strokeWidth={2} />} label="Sunshine Recoveries" value={recoveryStats?.sunshine_restarts ?? 0} tone={colors.success} />
            <StatTile icon={<AlertTriangle size={13} strokeWidth={2} />} label="Sunshine Failures" value={recoveryStats?.sunshine_failures ?? 0} tone={colors.danger} />
          </div>

          {/* Tailscale */}
          <div style={{ ...sectionLabel, marginTop: "6px" }}>
            <Satellite size={9} strokeWidth={2} /> Tailscale
          </div>

          <div style={card}>
            <StatTile icon={<Satellite size={13} strokeWidth={2} />} label="Tailscale Recoveries" value={recoveryStats?.tailscale_recoveries ?? 0} tone={colors.success} />
            <DetailToggle
              open={showTailscaleRecoveryDetails}
              onClick={() => setShowTailscaleRecoveryDetails(!showTailscaleRecoveryDetails)}
              label={showTailscaleRecoveryDetails ? "HIDE DETAILS" : "SHOW DETAILS"}
            />

            {showTailscaleRecoveryDetails && (
              <div style={subGrid}>
                <SubStat label="Service Recoveries" value={recoveryStats?.tailscale_service_recoveries ?? 0} />
                <SubStat label="IPN Recoveries" value={recoveryStats?.tailscale_ipn_recoveries ?? 0} />
                <SubStat label="Up Recoveries" value={recoveryStats?.tailscale_up_recoveries ?? 0} />
              </div>
            )}
          </div>

          <div style={card}>
            <StatTile icon={<AlertTriangle size={13} strokeWidth={2} />} label="Tailscale Failures" value={recoveryStats?.tailscale_failures ?? 0} tone={colors.danger} />
            <DetailToggle
              open={showTailscaleFailureDetails}
              onClick={() => setShowTailscaleFailureDetails(!showTailscaleFailureDetails)}
              label={showTailscaleFailureDetails ? "HIDE DETAILS" : "SHOW DETAILS"}
            />

            {showTailscaleFailureDetails && (
              <div style={subGrid}>
                <SubStat label="Nostate Events" value={recoveryStats?.tailscale_nostate ?? 0} />
                <SubStat label="Stopped Events" value={recoveryStats?.tailscale_stopped ?? 0} />
                <SubStat label="Service Stopped" value={recoveryStats?.tailscale_service_stopped ?? 0} />
                <SubStat label="IPN Missing" value={recoveryStats?.tailscale_ipn_missing ?? 0} />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
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

const card = {
  padding: "12px",
  borderRadius: `${radius.md}px`,
  background: colors.bgInset,
  border: `1.5px solid ${colors.border}`,
};

const subStatCard = {
  padding: "8px 10px",
  borderRadius: `${radius.sm}px`,
  background: colors.bgElevated,
  border: `1.5px solid ${colors.borderSubtle}`,
};

const labelStyle = {
  fontSize: "9.5px",
  color: colors.inkFaint,
  letterSpacing: "0.08em",
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
  border: `1.5px solid ${colors.border}`,
  background: "transparent",
  color: colors.inkDim,
  borderRadius: `${radius.full}px`,
  padding: "7px",
  fontSize: "9px",
  fontFamily: fonts.mono,
  fontWeight: 700,
  letterSpacing: "0.08em",
  cursor: "pointer",
  transition: "color 150ms ease, border-color 150ms ease",
};
