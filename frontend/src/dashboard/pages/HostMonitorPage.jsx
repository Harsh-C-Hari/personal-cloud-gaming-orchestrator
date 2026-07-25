import { HostStatusPanel } from "../../components/HostStatusPanel.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { colors, fonts } from "../theme.js";

export function HostMonitorPage({
  hostStatus,
  hostMetrics,
  hostLoading,
  hostError,
  sunshineAction,
  onStartSunshine,
  onRestartSunshine,
  handleMaintenanceToggle,
  maintenanceAction,
  sessionHealth,
  handleRevalidate,
  revalidating,
  tailscaleStatus,
  streamStatus,
  unlocking,
  onForceUnlock,
  onBack,
}) {
  const showForceUnlock = sessionHealth?.lock_exists && hostStatus?.active_session_count === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <PageHeader title="Host Monitor" subtitle="Live host status, capabilities, and controls" onBack={onBack} />

      <HostStatusPanel
        status={hostStatus}
        metrics={hostMetrics}
        loading={hostLoading}
        error={hostError}
        sunshineAction={sunshineAction}
        onStartSunshine={onStartSunshine}
        onRestartSunshine={onRestartSunshine}
        handleMaintenanceToggle={handleMaintenanceToggle}
        maintenanceAction={maintenanceAction}
        sessionHealth={sessionHealth}
        handleRevalidate={handleRevalidate}
        revalidating={revalidating}
        tailscaleStatus={tailscaleStatus}
        streamStatus={streamStatus}
      />

      {sessionHealth && (
        <div
          style={{
            padding: "10px",
            borderRadius: "8px",
            background: "rgb(0, 0, 0)",
            border: `1px solid ${colors.borderStrong}`,
            fontSize: "10px",
            color: colors.textDim,
            fontFamily: fonts.mono,
            display: "grid",
            gap: "4px",
          }}
        >
          <div>ACTIVE: {sessionHealth.active_sessions}</div>
          <div>LOCK: {sessionHealth.lock_exists ? "YES" : "NO"}</div>
          <div>HISTORY: {sessionHealth.history_count}</div>
          <div>EVENTS: {sessionHealth.event_count}</div>
        </div>
      )}

      {showForceUnlock && (
        <button
          type="button"
          disabled={unlocking}
          onClick={onForceUnlock}
          style={{
            width: "100%",
            padding: "9px 10px",
            borderRadius: "6px",
            border: "1px solid rgba(244,63,94,0.35)",
            background: "rgba(244,63,94,0.08)",
            color: "#fb7185",
            fontSize: "9px",
            fontFamily: fonts.mono,
            letterSpacing: "0.08em",
            cursor: "pointer",
          }}
        >
          {unlocking ? "Unlocking..." : "Force Unlock"}
        </button>
      )}
    </div>
  );
}
