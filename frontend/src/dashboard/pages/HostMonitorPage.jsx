/**
 * dashboard/pages/HostMonitorPage.jsx
 *
 * P5-T10 token-elevation audit (typeScale/surface, per D-008/D-009):
 *
 * Backgrounds: grepped fresh for `colors.bg*` — zero references in this
 * file, so no D-009 background swap applies here.
 *
 * Typography: the file's two `fontSize` groups (the "Aggregate and
 * historical session telemetry" caption and the stat-grid values) were
 * checked against `typeScale`'s six steps — neither lands cleanly:
 *   - The caption (10px/mono/1.4 line-height, no `fontWeight`) matches
 *     `typeScale.meta`'s size and family, but `meta` is 700/0.12em/
 *     uppercase and this caption is normal-weight sentence case with no
 *     letter-spacing or uppercase transform — a deliberate lighter,
 *     descriptive treatment, not a label. Forcing `meta` would bold,
 *     track out, and uppercase a sentence, which changes its character
 *     rather than aliasing its value.
 *   - The stat-grid values (11px/mono, no weight) sit between `meta`
 *     (10px) and `bodySmall` (12px) with no clean match on size, and
 *     also lack `meta`'s weight/letter-spacing/uppercase.
 * Both left as documented literals. This is the first P5 `*Page.jsx`
 * file with real styles of its own to audit (every prior `*Page.jsx`
 * was a pure prop-forwarder out of scope).
 */

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
    <div className="pcgo-feature-page pcgo-host-monitor-page">
      <PageHeader title="Host Monitor" subtitle="Readiness, dependencies, and recovery controls" onBack={onBack} />

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
        <div className="pcgo-host-session-health">
          <SectionCard title="Session Health" bare={false}>
          <div
            style={{
              marginTop: "-6px",
              marginBottom: "12px",
              color: colors.inkFaint,
              fontFamily: fonts.mono,
              fontSize: "10px",
              lineHeight: 1.4,
            }}
          >
            Aggregate and historical session telemetry
          </div>
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
              ACTIVE NOW <span style={{ color: colors.ink, marginLeft: "6px" }}>{sessionHealth.active_sessions}</span>
            </div>
            <div style={{ color: colors.inkFaint }}>
              LOCK STATE {""}
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
        </div>
      )}

      {showForceUnlock && (
        <div className="pcgo-host-force-unlock">
          <Button variant="danger" disabled={unlocking} onClick={onForceUnlock} style={{ width: "100%" }}>
            {unlocking ? "Unlocking…" : "Force Unlock"}
          </Button>
        </div>
      )}
    </div>
  );
}
