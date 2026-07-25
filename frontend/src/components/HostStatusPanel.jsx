/**
 * components/HostStatusPanel.jsx
 *
 * Same props, same handlers, same data — only the presentation layer was
 * reworked: grouped section cards, label/value "spec sheet" rows, status
 * pills instead of bare colored text, and progress bars for the percent
 * metrics (CPU/RAM/GPU load/VRAM).
 */

import {
  FaServer,
  FaMicrochip,
  FaBolt,
  FaSatelliteDish,
  FaSyncAlt,
  FaTools,
  FaLock,
  FaLockOpen,
  FaExclamationTriangle,
} from "react-icons/fa";
import { SunshineStreamCard } from "./SunshineStreamCard.jsx";

export function HostStatusPanel({
  status,
  metrics,
  loading,
  error,
  sunshineAction,
  onStartSunshine,
  onRestartSunshine,
  handleMaintenanceToggle,
  enableMaintenance,
  disableMaintenance,
  maintenanceAction,
  sessionHealth,
  handleRevalidate,
  revalidating,
  tailscaleStatus,
  streamStatus,
}) {
  if (error && !status) {
    return (
      <div style={box}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", color: palette.danger, fontFamily: palette.mono, fontSize: "11.5px" }}>
          <FaExclamationTriangle size={12} /> Host status unavailable
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div style={box}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", color: palette.muted, fontFamily: palette.mono, fontSize: "11.5px" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: palette.accent, animation: "hsp-pulse 1.4s ease-in-out infinite" }} />
          Checking host...
        </div>
        <style>{`@keyframes hsp-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }`}</style>
      </div>
    );
  }

  function formatStreamDuration(seconds) {
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

  const hostStateTone =
    status.host_state === "ready"
      ? "ok"
      : status.host_state === "degraded"
      ? "warning"
      : status.host_state === "busy"
      ? "info"
      : status.host_state === "starting"
      ? "neutral"
      : "bad";

  const healthTone =
    metrics?.health === "healthy" ? "ok" : metrics?.health === "warning" ? "warning" : "bad";

  return (
    <div style={box}>
      {/* Header */}
      <div style={headerRow} className="hsp-header">
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <div style={headerIcon}>
            <FaServer size={12} />
          </div>
          <span style={title}>Host Status</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }} className="hsp-header-badges">
          {loading && <span style={updatingDot}>● updating</span>}
          {status.host_state && <Badge tone={hostStateTone}>{status.host_state.toUpperCase()}</Badge>}
        </div>
      </div>

      {metrics && (
        <SectionCard icon={<FaServer size={10} />} title="System">
          <StatGrid>
            <StatRow label="Host" value={metrics.hostname} />
            <StatRow label="OS" value={metrics.os} />
            <StatRow label="OS Version" value={metrics.os_version} />
            <StatRow label="Device Type" value={metrics.machine_type} />
          </StatGrid>
        </SectionCard>
      )}

      {/* Readiness / Session */}
      <SectionCard icon={sessionHealth?.lock_exists ? <FaLock size={10} /> : <FaLockOpen size={10} />} title="Readiness &amp; Session">
        <StatRow
          label="Session Lock"
          value={<Badge tone={sessionHealth?.lock_exists ? "warning" : "ok"}>{sessionHealth?.lock_exists ? "LOCKED" : "FREE"}</Badge>}
        />

        {sessionHealth?.lock_exists && (
          <div style={{ marginTop: "6px", paddingLeft: "10px", borderLeft: `2px solid ${palette.border}`, display: "flex", flexDirection: "column", gap: "5px" }}>
            <StatRow label="Lock User" value={sessionHealth?.user_id} compact />
            <StatRow label="Lock Game" value={sessionHealth?.game_id} compact />
            <StatRow label="Lock Session" value={sessionHealth?.session_id} compact />
          </div>
        )}

        <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${palette.border}` }}>
          <StatRow label="Host Ready" value={<Badge tone={status.host_ready ? "ok" : "bad"}>{status.host_ready ? "YES" : "NO"}</Badge>} />
          {status.host_ready_reason && <div style={reasonText}>{status.host_ready_reason}</div>}
        </div>

        {status.recovery_required && (
          <div style={recoveryBox}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", color: palette.danger, fontFamily: palette.mono, fontSize: "11px", fontWeight: 700 }}>
              <FaExclamationTriangle size={11} /> Recovery Mode Active
            </div>
            {status.recovery_reason && <div style={{ opacity: 0.85, fontSize: "10.5px", marginTop: "4px", color: palette.dim, fontFamily: palette.mono }}>{status.recovery_reason}</div>}
          </div>
        )}

        <button
          disabled={revalidating}
          onClick={handleRevalidate}
          style={revalidating ? disabledButton : actionButton}
          onMouseEnter={(e) => !revalidating && (e.currentTarget.style.background = "rgba(56,189,248,0.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = revalidating ? actionButton.background : "rgba(56,189,248,0.06)")}
        >
          <FaSyncAlt size={10} style={revalidating ? { animation: "hsp-spin 0.8s linear infinite" } : undefined} />
          {revalidating ? "Revalidating..." : "Revalidate Host"}
        </button>

        <div style={{ marginTop: "12px" }}>
          <StatRow
            label="Maintenance"
            value={
              <button
                disabled={maintenanceAction}
                onClick={handleMaintenanceToggle}
                style={maintenanceAction ? disabledButton : status.maintenance_mode ? disableButton : enableButton}
              >
                <FaTools size={9} />
                {maintenanceAction ? "Updating..." : status.maintenance_mode ? "Disable" : "Enable"}
              </button>
            }
          />
        </div>

        <StatGrid style={{ marginTop: "10px" }}>
          <StatRow label="Startup Completed" value={<Badge tone={status.startup_completed ? "ok" : "bad"}>{status.startup_completed ? "YES" : "NO"}</Badge>} />
          <StatRow label="Active Sessions" value={status.active_session_count} />
          <StatRow label="Last Validation" value={status.last_validation ? new Date(status.last_validation * 1000).toLocaleString() : "Never"} />
          {metrics && <StatRow label="Health" value={<Badge tone={healthTone}>{metrics.health.toUpperCase()}</Badge>} />}
          {metrics && <StatRow label="Uptime" value={`${metrics.uptime_hours} h`} />}
        </StatGrid>

        {status.startup_issues?.length > 0 && (
          <div style={issueBox}>
            {status.startup_issues.map((issue) => (
              <div key={issue} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <FaExclamationTriangle size={9} /> {issue}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Sunshine */}
      <SectionCard icon={<FaBolt size={10} />} title="Sunshine">
        <StatGrid>
          <StatRow
            label="Sunshine"
            value={
              <Badge tone={sunshineAction ? "warning" : status.sunshine_running ? "ok" : "bad"}>
                {sunshineAction === "starting" ? "STARTING..." : sunshineAction === "restarting" ? "RESTARTING..." : status.sunshine_running ? "ON" : "OFF"}
              </Badge>
            }
          />
          <StatRow
            label="Sunshine API"
            value={
              <Badge tone={sunshineAction ? "warning" : status.sunshine_api_reachable ? "ok" : "bad"}>
                {sunshineAction ? "CHECKING..." : status.sunshine_api_reachable ? "READY" : "NO"}
              </Badge>
            }
          />
          <StatRow label="Can Stop" value={<Badge tone={status.sunshine_can_stop ? "ok" : "bad"}>{status.sunshine_can_stop ? "YES" : "NO"}</Badge>} />
          <StatRow label="Paired Clients" value={status.sunshine_client_count == null ? "N/A" : status.sunshine_client_count} />
          <StatRow label="Apps" value={status.sunshine_apps_count ?? 0} />
        </StatGrid>

        <div style={buttonRow}>
          <button
            disabled={sunshineAction || status.sunshine_running}
            onClick={onStartSunshine}
            style={sunshineAction || status.sunshine_running ? disabledButton : actionButton}
          >
            <FaBolt size={10} />
            {sunshineAction === "starting" ? "Starting..." : "Start"}
          </button>

          <button disabled={!!sunshineAction} onClick={onRestartSunshine} style={sunshineAction ? disabledButton : actionButton}>
            <FaSyncAlt size={10} style={sunshineAction === "restarting" ? { animation: "hsp-spin 0.8s linear infinite" } : undefined} />
            {sunshineAction === "restarting" ? "Restarting..." : "Restart"}
          </button>
        </div>

        {status.sunshine_error && (
          <div style={smallError}>
            <FaExclamationTriangle size={9} style={{ marginRight: "5px" }} />
            {status.sunshine_error}
          </div>
        )}

        <div style={{ marginTop: "12px" }}>
          <SunshineStreamCard streamStatus={streamStatus} />
        </div>
      </SectionCard>

      {/* Tailscale */}
      <SectionCard icon={<FaSatelliteDish size={10} />} title="Tailscale">
        <StatGrid>
          <StatRow label="Tailscale" value={<Badge tone={status.tailscale_running ? "ok" : "bad"}>{status.tailscale_running ? "ON" : "OFF"}</Badge>} />
          <StatRow label="Configured" value={<Badge tone={tailscaleStatus?.configured ? "ok" : "bad"}>{tailscaleStatus?.configured ? "Yes" : "No"}</Badge>} />
          <StatRow label="Service Running" value={<Badge tone={tailscaleStatus?.service_running ? "ok" : "bad"}>{tailscaleStatus?.service_running ? "Yes" : "No"}</Badge>} />
          <StatRow label="IPN Running" value={<Badge tone={tailscaleStatus?.ipn_running ? "ok" : "bad"}>{tailscaleStatus?.ipn_running ? "Yes" : "No"}</Badge>} />
          <StatRow label="Backend Running" value={<Badge tone={tailscaleStatus?.backend_state ? "ok" : "bad"}>{tailscaleStatus?.backend_state ? "Yes" : "No"}</Badge>} />
          <StatRow label="Authenticated" value={<Badge tone={tailscaleStatus?.user_authenticated ? "ok" : "bad"}>{tailscaleStatus?.user_authenticated ? "Yes" : "No"}</Badge>} />
          <StatRow label="Recovery" value={<Badge tone={tailscaleStatus?.ipn_recovery_enabled ? "ok" : "bad"}>{tailscaleStatus?.ipn_recovery_enabled ? "Enabled" : "Disabled"}</Badge>} />
        </StatGrid>
      </SectionCard>

      {/* Hardware */}
      <SectionCard icon={<FaMicrochip size={10} />} title="Hardware &amp; Performance">
        <StatGrid>
          <StatRow label="GPU" value={<Badge tone={status.gpu_available ? "ok" : "bad"}>{status.gpu_available ? "READY" : "NO"}</Badge>} />
          {metrics && <StatRow label="CPU" value={metrics.cpu_name} />}
          {metrics?.integrated_gpu && <StatRow label="Integrated GPU" value={metrics.integrated_gpu} />}
          {metrics?.dedicated_gpu && <StatRow label="Dedicated GPU" value={metrics.dedicated_gpu} />}
          {metrics && <StatRow label="GPU Class" value={metrics.gpu_class} />}
          {metrics && <StatRow label="GPU Vendor" value={metrics.gpu_vendor} />}
          {metrics && <StatRow label="Disk" value={metrics.disk_name} />}
          {metrics && <StatRow label="CPU Cores" value={metrics.cpu_cores} />}
        </StatGrid>

        {metrics && (
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <ProgressStat label="CPU" percent={metrics.cpu_percent} />
            <ProgressStat label="RAM" percent={metrics.ram_percent} />
            <ProgressStat label="GPU Load" percent={metrics.gpu_percent} />
            <ProgressStat label="GPU Temp" percent={metrics.gpu_temp} suffix="°C" max={100} />
            <ProgressStat label="VRAM" percent={metrics.gpu_memory_percent} />
          </div>
        )}

        <div style={{ marginTop: "10px" }}>
          <StatRow label="Disk Free" value={`${status.disk_free_gb} GB`} />
        </div>
      </SectionCard>
    </div>
  );
}

// ── Presentational primitives ─────────────────────────────────────────────

const palette = {
  bg: "#000000",
  card: "rgba(0, 0, 0, 0.5)",
  border: "#1c2130",
  text: "#e2e8f0",
  dim: "#94a3b8",
  faint: "#64748b",
  muted: "#475569",
  accent: "#38bdf8",
  success: "#10d98a",
  warning: "#facc15",
  danger: "#f43f5e",
  info: "#60a5fa",
  neutral: "#94a3b8",
  mono: "'JetBrains Mono', monospace",
};

const TONE_COLORS = {
  ok: palette.success,
  warning: palette.warning,
  bad: palette.danger,
  info: palette.info,
  neutral: palette.neutral,
};

function Badge({ tone = "neutral", children }) {
  const color = TONE_COLORS[tone] ?? palette.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "9.5px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        color,
        background: `${color}1a`,
        border: `1px solid ${color}40`,
        borderRadius: "10px",
        padding: "2px 8px",
        fontFamily: palette.mono,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function SectionCard({ icon, title: heading, children }) {
  return (
    <div style={sectionCard}>
      <div style={sectionHeading}>
        <span style={{ color: palette.accent, display: "flex" }}>{icon}</span>
        {heading}
      </div>
      {children}
    </div>
  );
}

function StatGrid({ children, style }) {
  return (
    <div className="hsp-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 18px", ...style }}>
      {children}
    </div>
  );
}

function StatRow({ label, value, compact }) {
  return (
    <div className="hsp-row" style={{ display: "flex", alignItems: "baseline", gap: "8px", minWidth: 0 }}>
      <span
        className="hsp-row-label"
        style={{
          fontSize: compact ? "10px" : "10.5px",
          color: palette.muted,
          whiteSpace: "nowrap",
          fontFamily: palette.mono,
        }}
      >
        {label}
      </span>
      <span className="hsp-row-fill" style={{ flex: 1, borderBottom: `1px dotted ${palette.border}`, marginBottom: "3px" }} />
      <span
        className="hsp-row-value"
        style={{
          fontSize: compact ? "10.5px" : "11.5px",
          fontWeight: 600,
          color: palette.text,
          fontFamily: palette.mono,
          textAlign: "right",
          maxWidth: "60%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value ?? "--"}
      </span>
    </div>
  );
}

function ProgressStat({ label, percent, suffix = "%", max = 100 }) {
  const hasValue = percent != null;
  const pct = hasValue ? Math.min(100, Math.max(0, (percent / max) * 100)) : 0;
  const tone = !hasValue ? palette.muted : pct >= 90 ? palette.danger : pct >= 70 ? palette.warning : palette.success;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "10px", color: palette.muted, fontFamily: palette.mono }}>{label}</span>
        <span style={{ fontSize: "10.5px", color: tone, fontFamily: palette.mono, fontWeight: 700 }}>
          {hasValue ? `${percent}${suffix}` : "N/A"}
        </span>
      </div>
      <div style={{ height: "5px", borderRadius: "3px", background: "#0d1017", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${hasValue ? pct : 0}%`,
            background: tone,
            borderRadius: "3px",
            boxShadow: hasValue ? `0 0 6px ${tone}80` : "none",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

// ── Style objects ──────────────────────────────────────────────────────────

const box = {
  marginTop: "14px",
  padding: "16px",
  border: `1px solid ${palette.border}`,
  borderRadius: "10px",
  background: palette.bg,
  color: palette.text,
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const title = {
  fontSize: "12px",
  fontWeight: 700,
  color: palette.text,
  letterSpacing: "0.04em",
  fontFamily: "'Rajdhani', sans-serif",
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const headerIcon = {
  width: "26px",
  height: "26px",
  borderRadius: "7px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(56,189,248,0.12)",
  border: "1px solid rgba(56,189,248,0.3)",
  color: palette.accent,
};

const updatingDot = {
  fontSize: "9px",
  color: palette.accent,
  fontFamily: palette.mono,
  textTransform: "uppercase",
  animation: "hsp-pulse 1.4s ease-in-out infinite",
};

const sectionCard = {
  padding: "14px",
  borderRadius: "8px",
  border: `1px solid ${palette.border}`,
  background: palette.card,
};

const sectionHeading = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  fontSize: "9.5px",
  color: palette.muted,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  fontFamily: palette.mono,
  marginBottom: "10px",
};

const smallError = {
  marginTop: "8px",
  fontSize: "9.5px",
  color: palette.faint,
  fontFamily: palette.mono,
  lineHeight: 1.4,
};

const buttonRow = {
  display: "flex",
  gap: "8px",
  marginTop: "10px",
};

const actionButton = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  background: "rgba(56,189,248,0.06)",
  color: palette.accent,
  border: "1px solid rgba(56,189,248,0.35)",
  borderRadius: "6px",
  padding: "7px 12px",
  fontSize: "10px",
  fontFamily: palette.mono,
  letterSpacing: "0.04em",
  cursor: "pointer",
  transition: "background 0.15s",
};

const disabledButton = {
  ...actionButton,
  opacity: 0.5,
  cursor: "not-allowed",
};

const reasonText = {
  fontSize: "10px",
  color: palette.faint,
  fontFamily: palette.mono,
  marginTop: "4px",
};

const issueBox = {
  marginTop: "10px",
  padding: "8px 10px",
  borderRadius: "6px",
  background: "rgba(250,204,21,0.06)",
  border: "1px solid rgba(250,204,21,0.25)",
  fontSize: "10px",
  color: palette.warning,
  fontFamily: palette.mono,
  lineHeight: 1.6,
};

const recoveryBox = {
  marginTop: "10px",
  padding: "9px 10px",
  border: "1px solid rgba(244,63,94,0.35)",
  background: "rgba(244,63,94,0.06)",
  borderRadius: "7px",
};

const enableButton = {
  ...actionButton,
  padding: "5px 10px",
  background: "rgba(16,217,138,0.08)",
  color: palette.success,
  border: "1px solid rgba(16,217,138,0.35)",
};

const disableButton = {
  ...actionButton,
  padding: "5px 10px",
  background: "rgba(244,63,94,0.08)",
  color: palette.danger,
  border: "1px solid rgba(244,63,94,0.35)",
};

const globalKeyframes = `
  @keyframes hsp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes hsp-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

  /* Mobile: the two-column stat grids (System, Startup, Sunshine, Tailscale,
     Hardware) don't leave enough room per column for longer values like
     hostnames, OS versions, or GPU names, so they were being clipped with
     an ellipsis ("LAPTOP-RDC…", "Window…"). Below 560px, collapse those
     grids to a single column and let the label/value pair stack instead
     of truncating. Rows outside a grid (Session Lock, Host Ready, etc.)
     already had enough room and are left as-is. */
  @media (max-width: 560px) {
    .hsp-grid {
      grid-template-columns: 1fr !important;
    }
    .hsp-grid .hsp-row {
      flex-wrap: wrap !important;
      row-gap: 2px !important;
    }
    .hsp-grid .hsp-row-label {
      flex: 1 1 100% !important;
    }
    .hsp-grid .hsp-row-fill {
      display: none !important;
    }
    .hsp-grid .hsp-row-value {
      max-width: 100% !important;
      overflow: visible !important;
      text-overflow: unset !important;
      white-space: normal !important;
      text-align: left !important;
      word-break: break-word !important;
    }
    .hsp-header {
      flex-wrap: wrap !important;
      row-gap: 8px !important;
    }
    .hsp-header-badges {
      flex-wrap: wrap !important;
      justify-content: flex-end !important;
    }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("hsp-keyframes")) {
  const styleEl = document.createElement("style");
  styleEl.id = "hsp-keyframes";
  styleEl.textContent = globalKeyframes;
  document.head.appendChild(styleEl);
}
