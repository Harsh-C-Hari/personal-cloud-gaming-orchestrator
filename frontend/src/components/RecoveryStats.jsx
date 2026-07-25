/**
 * components/RecoveryStats.jsx
 *
 * Same props (recoveryStats, showTailscaleRecoveryDetails/
 * showTailscaleFailureDetails + their setters) and same data fields —
 * only the presentation was reworked: icon-badged stat tiles instead of
 * plain boxes, success/failure color-coding, and cleaner detail toggles.
 */

import {
  FaShieldAlt,
  FaBolt,
  FaSatelliteDish,
  FaChevronDown,
  FaExclamationTriangle,
} from "react-icons/fa";

const palette = {
  border: "rgba(148,163,184,0.18)",
  borderSubtle: "#1c2130",
  card: "rgba(0, 0, 0, 0.45)",
  text: "#e2e8f0",
  dim: "#94a3b8",
  faint: "#64748b",
  success: "#10d98a",
  danger: "#f43f5e",
  accent: "#38bdf8",
  mono: "'JetBrains Mono', monospace",
};

function StatTile({ icon, label: labelText, value: valueNum, tone }) {
  return (
    <div style={{ ...card, display: "flex", alignItems: "center", gap: "12px" }}>
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
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        width: "100%",
        marginTop: "8px",
        border: `1px solid ${palette.border}`,
        background: "rgba(0, 0, 0, 0.45)",
        color: palette.dim,
        borderRadius: "6px",
        padding: "7px",
        fontSize: "9px",
        fontFamily: palette.mono,
        letterSpacing: "0.08em",
        cursor: "pointer",
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = palette.accent;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = palette.dim;
      }}
    >
      {label}
      <FaChevronDown size={9} style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
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
    <section
      style={{
        padding: "16px",
        border: `1px solid ${palette.border}`,
        borderRadius: "10px",
        background: "rgba(0, 0, 0, 0.77)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "16px" }}>
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
          <FaShieldAlt size={12} />
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
          RECOVERY SYSTEM
        </h2>
      </div>

      {!recoveryStats ? (
        <div style={{ display: "flex", alignItems: "center", gap: "9px", color: palette.dim, fontFamily: palette.mono, fontSize: "11.5px" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: palette.accent, animation: "rs-pulse 1.4s ease-in-out infinite" }} />
          Loading recovery statistics...
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Sunshine */}
          <div style={sectionLabel}>
            <FaBolt size={9} /> Sunshine
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <StatTile icon={<FaBolt size={13} />} label="Sunshine Recoveries" value={recoveryStats?.sunshine_restarts ?? 0} tone={palette.success} />
            <StatTile icon={<FaExclamationTriangle size={13} />} label="Sunshine Failures" value={recoveryStats?.sunshine_failures ?? 0} tone={palette.danger} />
          </div>

          {/* Tailscale */}
          <div style={{ ...sectionLabel, marginTop: "6px" }}>
            <FaSatelliteDish size={9} /> Tailscale
          </div>

          <div style={card}>
            <StatTile icon={<FaSatelliteDish size={13} />} label="Tailscale Recoveries" value={recoveryStats?.tailscale_recoveries ?? 0} tone={palette.success} />
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
            <StatTile icon={<FaExclamationTriangle size={13} />} label="Tailscale Failures" value={recoveryStats?.tailscale_failures ?? 0} tone={palette.danger} />
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

      <style>{`@keyframes rs-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </section>
  );
}

function SubStat({ label, value }) {
  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: "6px",
        background: "rgba(0, 0, 0, 0.4)",
        border: `1px solid ${palette.borderSubtle}`,
      }}
    >
      <div style={{ fontSize: "15px", fontWeight: 700, color: palette.text, fontFamily: palette.mono }}>{value}</div>
      <div style={{ fontSize: "8.5px", color: palette.faint, letterSpacing: "0.08em", fontFamily: palette.mono, marginTop: "2px" }}>
        {label.toUpperCase()}
      </div>
    </div>
  );
}

const card = {
  padding: "12px",
  borderRadius: "8px",
  background: palette.card,
  border: `1px solid ${palette.borderSubtle}`,
};

const labelStyle = {
  fontSize: "9.5px",
  color: palette.faint,
  letterSpacing: "0.08em",
  fontFamily: palette.mono,
  marginTop: "2px",
  textTransform: "uppercase",
};

const valueStyle = {
  fontSize: "19px",
  fontWeight: 700,
  fontFamily: palette.mono,
  lineHeight: 1.1,
};

const sectionLabel = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  fontSize: "9px",
  color: palette.faint,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  fontFamily: palette.mono,
};

const subGrid = {
  marginTop: "8px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
  gap: "8px",
};
