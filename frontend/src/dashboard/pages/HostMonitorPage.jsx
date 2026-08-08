import { HostStatusPanel } from "../../components/HostStatusPanel.jsx";
import { PageHeader } from "../components/PageHeader.jsx";
import { SectionCard } from "../components/SectionCard.jsx";
import { Button } from "../../components/ui/primitives.jsx";
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
        <SectionCard title="Session Health" bare={false}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "10px",
              fontFamily: fonts.mono,
              fontSize: "11px",
            }}
          >
            <div style={{ color: colors.inkFaint }}>
              ACTIVE <span style={{ color: colors.ink, marginLeft: "6px" }}>{sessionHealth.active_sessions}</span>
            </div>
            <div style={{ color: colors.inkFaint }}>
              LOCK{" "}
              <span style={{ color: sessionHealth.lock_exists ? colors.warning : colors.ink, marginLeft: "6px" }}>
                {sessionHealth.lock_exists ? "YES" : "NO"}
              </span>
            </div>
            <div style={{ color: colors.inkFaint }}>
              HISTORY <span style={{ color: colors.ink, marginLeft: "6px" }}>{sessionHealth.history_count}</span>
            </div>
            <div style={{ color: colors.inkFaint }}>
              EVENTS <span style={{ color: colors.ink, marginLeft: "6px" }}>{sessionHealth.event_count}</span>
            </div>
          </div>
        </SectionCard>
      )}

      {showForceUnlock && (
        <Button variant="danger" disabled={unlocking} onClick={onForceUnlock} style={{ width: "100%" }}>
          {unlocking ? "Unlocking…" : "Force Unlock"}
        </Button>
      )}
    </div>
  );
}
