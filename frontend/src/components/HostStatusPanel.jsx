/**
 * components/HostStatusPanel.jsx
 *
 * Same props, same handlers, same data — only the presentation layer was
 * reworked: grouped section cards, label/value "spec sheet" rows, status
 * pills instead of bare colored text, and progress bars for the percent
 * metrics (CPU/RAM/GPU load/VRAM).
 *
 * The `ProgressStat` meter (CPU / RAM / GPU Load / GPU Temp / VRAM) keeps
 * its exact mechanic, proportions, and layout from before — only its
 * colors were swapped to the flat success/warning/danger tokens and the
 * glow `boxShadow` on the fill was removed, per DESIGN_SYSTEM.md.
 *
 * P5-T10 token-elevation audit (typeScale/surface, per D-008/D-009):
 *
 * Backgrounds: all 5 `colors.bg*` references in this file were checked
 * and swapped for their `surface.l*` alias (bgInset->l1, bgElevated->l2,
 * bgCard->l3) — same CSS custom properties, zero visual change.
 * `bgCardHover` does not occur in this file, so `surface.l4` is unused
 * here. The 5: `box`'s `colors.bgCard` (l3), `loadingValue`'s
 * `colors.bgInset` (l1), `sectionCard`'s `colors.bgElevated` (l2),
 * `actionButton`'s `colors.bgElevated` (l2), and the inline
 * `ProgressStat` track background `colors.bgInset` (l1).
 *
 * Typography: every `fontSize`/`fontWeight`/`fontFamily` group in this
 * file was checked against `typeScale`'s six steps. Exactly one is a
 * genuine clean match: `sectionHeading` (9.5px/700/mono/0.13em/
 * uppercase) is the same values GameManager.jsx's `FieldLabel` used
 * (P5-T08, "clean fit within rounding" against `typeScale.meta`'s
 * 10px/700/mono/0.12em/uppercase — 0.5px size gap, 0.01em
 * letter-spacing gap) and is converted the same way, to
 * `...typeScale.meta`. Everything else is left as a documented literal,
 * none landing cleanly:
 *   - `updatingDot`/`loadingStateLabel` (9px/700/mono/0.05em/uppercase)
 *     are close to `meta` on weight/family/uppercase but diverge on both
 *     size (1px) and letter-spacing (0.07em) — a materially bigger gap
 *     than `sectionHeading`'s, so left literal (same reasoning
 *     GameManager's `backButton` used for an analogous near-miss).
 *   - `actionButton` (10px/700/mono/0.04em, no uppercase) matches `meta`
 *     on size/weight/family but diverges on letter-spacing (0.08em gap)
 *     and has no `textTransform` — the button labels ("Start",
 *     "Restart", "Revalidate Host") are mixed-case, so forcing `meta`
 *     would add an uppercase transform not currently present. Same call
 *     GameManager's `buttonBase` made for an identical pattern.
 *   - `title` (12.5px/700/display/0.02em) sits well below `heading`
 *     (28px) and off `subheading` (17px/600/-0.01em) on every axis.
 *   - `Badge` (9.5px/700/mono/0.05em, no uppercase) is close to `meta`
 *     on size/weight/family but its letter-spacing gap (0.07em) and
 *     missing uppercase are the same divergence as `updatingDot` above.
 *   - The remaining groups — the two inline error/reason messages
 *     (11.5px/11px/10.5px mono, no weight), `LoadingSection`'s row
 *     label (10.5px mono, no weight), `StatRow`'s label/value pair
 *     (10-11.5px mono, weight 600 on the value), `ProgressStat`'s label/
 *     value pair (10px/10.5px mono), `smallError`, `reasonText`, and
 *     `issueBox` (10-10.5px mono, no weight, holding sentence-case or
 *     dynamic backend text) — all lack the weight/letter-spacing/
 *     uppercase combination `meta` requires, or hold arbitrary dynamic
 *     content that shouldn't be force-transformed. Left as documented
 *     literals, matching D-005's "refine, don't flatten" instruction.
 */

import {
  Server,
  Cpu,
  Zap,
  Satellite,
  RefreshCw,
  Wrench,
  Lock,
  Unlock,
  AlertTriangle,
} from "lucide-react";
import { SunshineStreamCard } from "./SunshineStreamCard.jsx";
import { Button } from "./ui/primitives.jsx";
import { colors, fonts, radius, surface, typeScale } from "../dashboard/theme.js";

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
      <div className="pcgo-host-status-panel" style={box}>
        <div style={{ display: "flex", alignItems: "center", gap: "9px", color: colors.danger, fontFamily: fonts.mono, fontSize: "11.5px" }}>
          <AlertTriangle size={13} strokeWidth={2} /> Host status unavailable
        </div>
      </div>
    );
  }

  if (!status) {
    return <HostStatusLoadingState />;
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

  // Readiness is the operator-facing truth for this page. Keep the badge,
  // tone, message, and action context derived from the same interpretation so
  // a host can never look ready while the copy says it cannot serve sessions.
  const readinessTone = status.host_ready
    ? "ok"
    : status.recovery_required
    ? "bad"
    : status.host_state === "starting"
    ? "neutral"
    : status.host_state === "degraded"
    ? "warning"
    : "bad";

  const readinessLabel = status.host_ready
    ? "READY"
    : status.recovery_required
    ? "BLOCKED"
    : status.host_state === "starting"
    ? "STARTING"
    : "NOT READY";

  const healthTone =
    metrics?.health === "healthy" ? "ok" : metrics?.health === "warning" ? "warning" : "bad";

  return (
    <div className="pcgo-host-status-panel" style={box} aria-busy={loading || revalidating}>
      {/* Header */}
      <div style={headerRow} className="hsp-header pcgo-host-status-panel__header">
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <div style={headerIcon}>
            <Server size={13} strokeWidth={2} />
          </div>
          <span style={title}>Host Status</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }} className="hsp-header-badges">
          {loading && (
            <span style={updatingDot} role="status" aria-live="polite">
              {/* P6-T10 motion audit: keyframe-based `animation:` (not `transition:`), same
                  non-convertible category as SessionAnalytics.jsx's `sa-spin 0.8s` (P6-T08) /
                  LogPanel.jsx's `lp-spin 0.8s` (P6-T09). `motion`'s four steps are
                  transition-timing strings ("<duration> <easing>"), not @keyframes names, so
                  there is no equivalent to alias to here regardless of the 0.8s duration. Left
                  as the original literal; no conversion. */}
              <RefreshCw size={10} strokeWidth={2} style={{ animation: "hsp-spin 0.8s linear infinite" }} />
              Syncing host data
            </span>
          )}
          <Badge tone={readinessTone}>{readinessLabel}</Badge>
        </div>
      </div>

      <div className={`pcgo-host-readiness-summary pcgo-host-readiness-summary--${readinessTone}`}>
        <div>
          <span className="pcgo-host-readiness-summary__eyebrow">Operational readiness</span>
          <strong>{status.host_ready ? "Ready to serve sessions" : "Host cannot serve sessions"}</strong>
          <span>{status.host_ready_reason || "Readiness is currently being evaluated."}</span>
        </div>
        <div className="pcgo-host-readiness-summary__actions">
          <span className="pcgo-host-readiness-summary__state">{readinessLabel}</span>
          <Button
            variant="secondary"
            className="pcgo-host-revalidate"
            disabled={revalidating}
            onClick={handleRevalidate}
            style={revalidating ? disabledButton : actionButton}
          >
            {/* P6-T10 motion audit: keyframe-based `animation:` (not `transition:`), same
                non-convertible category as the "Syncing host data" indicator above and
                SessionAnalytics.jsx's `sa-spin 0.8s` (P6-T08) / LogPanel.jsx's `lp-spin 0.8s`
                (P6-T09). Left as the original literal; no conversion. */}
            <RefreshCw size={11} strokeWidth={2} style={revalidating ? { animation: "hsp-spin 0.8s linear infinite" } : undefined} />
            {revalidating ? "Revalidating..." : "Revalidate Host"}
          </Button>
        </div>
      </div>

      {metrics && (
        <SectionCard className="pcgo-host-system-card" icon={<Server size={11} strokeWidth={2} />} title="System">
          <StatGrid>
            <StatRow label="Host" value={metrics.hostname} />
            <StatRow label="OS" value={metrics.os} />
            <StatRow label="OS Version" value={metrics.os_version} />
            <StatRow label="Device Type" value={metrics.machine_type} />
          </StatGrid>
        </SectionCard>
      )}

      {/* Readiness / Session */}
      <SectionCard className="pcgo-host-readiness-card" icon={sessionHealth?.lock_exists ? <Lock size={11} strokeWidth={2} /> : <Unlock size={11} strokeWidth={2} />} title="Session & Recovery">
        <StatRow
          label="Session Lock"
          value={<Badge tone={sessionHealth?.lock_exists ? "warning" : "ok"}>{sessionHealth?.lock_exists ? "LOCKED" : "FREE"}</Badge>}
        />

        {sessionHealth?.lock_exists && (
          <div style={{ marginTop: "6px", paddingLeft: "10px", borderLeft: `2px solid ${colors.border}`, display: "flex", flexDirection: "column", gap: "5px" }}>
            <StatRow label="Lock User" value={sessionHealth?.user_id} compact />
            <StatRow label="Lock Game" value={sessionHealth?.game_id} compact />
            <StatRow label="Lock Session" value={sessionHealth?.session_id} compact />
          </div>
        )}

        <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: `1.5px solid ${colors.border}` }}>
          <StatRow label="Host Ready" value={<Badge tone={status.host_ready ? "ok" : "bad"}>{status.host_ready ? "YES" : "NO"}</Badge>} />
          {status.host_ready_reason && <div style={reasonText}>{status.host_ready_reason}</div>}
        </div>

        {status.recovery_required && (
          <div style={recoveryBox}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", color: colors.danger, fontFamily: fonts.mono, fontSize: "11px", fontWeight: 700 }}>
              <AlertTriangle size={12} strokeWidth={2} /> Recovery Mode Active
            </div>
            {status.recovery_reason && <div style={{ opacity: 0.85, fontSize: "10.5px", marginTop: "4px", color: colors.inkDim, fontFamily: fonts.mono }}>{status.recovery_reason}</div>}
          </div>
        )}

        <div style={{ marginTop: "12px" }}>
          <StatRow
            label="Maintenance"
            value={
              <Button
                variant="secondary"
                disabled={maintenanceAction}
                onClick={handleMaintenanceToggle}
                style={maintenanceAction ? disabledButton : status.maintenance_mode ? disableButton : enableButton}
              >
                <Wrench size={10} strokeWidth={2} />
                {maintenanceAction ? "Updating..." : status.maintenance_mode ? "Disable" : "Enable"}
              </Button>
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
                <AlertTriangle size={10} strokeWidth={2} /> {issue}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Sunshine */}
      <SectionCard className="pcgo-host-sunshine-card" icon={<Zap size={11} strokeWidth={2} />} title="Sunshine Dependency">
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
          <Button
            variant="secondary"
            disabled={Boolean(sunshineAction || status.sunshine_running)}
            onClick={onStartSunshine}
            style={sunshineAction || status.sunshine_running ? disabledButton : actionButton}
          >
            <Zap size={11} strokeWidth={2} />
            {sunshineAction === "starting" ? "Starting..." : "Start"}
          </Button>

          <Button
            variant="secondary"
            disabled={Boolean(sunshineAction)}
            onClick={onRestartSunshine}
            style={sunshineAction ? disabledButton : actionButton}
          >
            {/* P6-T10 motion audit: keyframe-based `animation:` (not `transition:`), same
                `hsp-spin` non-convertible category as the two instances above in this file.
                Left as the original literal; no conversion. */}
            <RefreshCw size={11} strokeWidth={2} style={sunshineAction === "restarting" ? { animation: "hsp-spin 0.8s linear infinite" } : undefined} />
            {sunshineAction === "restarting" ? "Restarting..." : "Restart"}
          </Button>
        </div>

        {status.sunshine_error && (
          <div style={smallError}>
            <AlertTriangle size={10} strokeWidth={2} style={{ marginRight: "5px" }} />
            {status.sunshine_error}
          </div>
        )}

        <div style={{ marginTop: "12px" }}>
          <SunshineStreamCard streamStatus={streamStatus} />
        </div>
      </SectionCard>

      {/* Tailscale */}
      <SectionCard className="pcgo-host-tailscale-card" icon={<Satellite size={11} strokeWidth={2} />} title="Tailscale Dependency">
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
      <SectionCard className="pcgo-host-diagnostics-card" icon={<Cpu size={11} strokeWidth={2} />} title="Diagnostics & Performance">
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

function HostStatusLoadingState() {
  return (
    <div className="pcgo-host-status-panel pcgo-host-status-panel--loading" style={box} aria-busy="true" aria-label="Loading host status">
      <div style={headerRow} className="hsp-header">
        <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
          <div style={headerIcon}>
            <Server size={13} strokeWidth={2} />
          </div>
          <span style={title}>Host Status</span>
        </div>
        <span style={loadingStateLabel} role="status" aria-live="polite">
          <span style={loadingDot} />
          Checking host
        </span>
      </div>

      <div className="pcgo-host-readiness-summary pcgo-host-readiness-summary--neutral" aria-hidden="true">
        <div>
          <span className="pcgo-host-readiness-summary__eyebrow">Operational readiness</span>
          <strong>Waiting for host status</strong>
          <span>Readiness and dependency state will appear when the host responds.</span>
        </div>
        <div className="pcgo-host-readiness-summary__actions">
          <span className="pcgo-host-readiness-summary__state">PENDING</span>
        </div>
      </div>

      <LoadingSection icon={<Server size={11} strokeWidth={2} />} title="System" rows={["Host identity", "Operating system", "OS version", "Device type"]} />
      <LoadingSection icon={<Unlock size={11} strokeWidth={2} />} title="Session & Recovery" rows={["Session lock", "Host readiness", "Maintenance", "Startup state"]} />
      <LoadingSection icon={<Zap size={11} strokeWidth={2} />} title="Sunshine Dependency" rows={["Sunshine", "Sunshine API", "Paired clients", "Apps"]} />
      <LoadingSection icon={<Satellite size={11} strokeWidth={2} />} title="Tailscale Dependency" rows={["Tailscale", "Service state", "IPN state", "Authentication"]} />
      <LoadingSection icon={<Cpu size={11} strokeWidth={2} />} title="Diagnostics & Performance" rows={["GPU", "CPU", "Disk", "Performance telemetry"]} />
    </div>
  );
}

function LoadingSection({ icon, title: heading, rows }) {
  return (
    <div className="pcgo-host-section-card pcgo-host-loading-section" style={sectionCard} aria-hidden="true">
      <div style={sectionHeading}>
        <span style={{ color: colors.brand, display: "flex" }}>{icon}</span>
        {heading}
      </div>
      <div style={{ display: "grid", gap: "9px" }}>
        {rows.map((label) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
            <span style={{ color: colors.inkFaint, fontSize: "10.5px", fontFamily: fonts.mono, whiteSpace: "nowrap" }}>{label}</span>
            <span style={{ flex: 1, borderBottom: `1px dotted ${colors.border}`, marginBottom: "3px" }} />
            <span style={loadingValue} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Presentational primitives ─────────────────────────────────────────────

const TONE_COLORS = {
  ok: colors.success,
  warning: colors.warning,
  bad: colors.danger,
  info: colors.info,
  neutral: colors.neutral,
};

function Badge({ tone = "neutral", children }) {
  const color = TONE_COLORS[tone] ?? colors.neutral;
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
        border: `1.5px solid ${color}66`,
        borderRadius: `${radius.full}px`,
        padding: "2px 8px",
        fontFamily: fonts.mono,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function SectionCard({ className = "", icon, title: heading, children }) {
  return (
    <div className={`pcgo-host-section-card ${className}`.trim()} style={sectionCard}>
      <div style={sectionHeading}>
        <span style={{ color: colors.brand, display: "flex" }}>{icon}</span>
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
          color: colors.inkFaint,
          whiteSpace: "nowrap",
          fontFamily: fonts.mono,
        }}
      >
        {label}
      </span>
      <span className="hsp-row-fill" style={{ flex: 1, borderBottom: `1px dotted ${colors.border}`, marginBottom: "3px" }} />
      <span
        className="hsp-row-value"
        style={{
          fontSize: compact ? "10.5px" : "11.5px",
          fontWeight: 600,
          color: colors.ink,
          fontFamily: fonts.mono,
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

// ── ProgressStat — mechanic, proportions, and layout preserved 1:1 from
// the pre-redesign version. Only the fill/label colors (now the flat
// success/warning/danger tokens) and the removal of the glow `boxShadow`
// on the fill bar are new, per DESIGN_SYSTEM.md §4/§6. ──────────────────
function ProgressStat({ label, percent, suffix = "%", max = 100 }) {
  const hasValue = percent != null;
  const pct = hasValue ? Math.min(100, Math.max(0, (percent / max) * 100)) : 0;
  const tone = !hasValue ? colors.inkFaint : pct >= 90 ? colors.danger : pct >= 70 ? colors.warning : colors.success;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "10px", color: colors.inkFaint, fontFamily: fonts.mono }}>{label}</span>
        <span style={{ fontSize: "10.5px", color: tone, fontFamily: fonts.mono, fontWeight: 700 }}>
          {hasValue ? `${percent}${suffix}` : "N/A"}
        </span>
      </div>
      <div style={{ height: "5px", borderRadius: "3px", background: surface.l1, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${hasValue ? pct : 0}%`,
            background: tone,
            borderRadius: "3px",
            // P6-T10 motion audit: real `transition:`, but 400ms does not exactly match any
            // `motion` step (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms
            // cubic-bezier). Left as the original literal; no conversion.
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
  padding: "18px",
  border: `1px solid ${colors.border}`,
  borderRadius: `${radius.lg}px`,
  background: surface.l3,
  color: colors.ink,
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const title = {
  fontSize: "12.5px",
  fontWeight: 700,
  color: colors.ink,
  letterSpacing: "0.02em",
  fontFamily: fonts.display,
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const headerIcon = {
  width: "26px",
  height: "26px",
  borderRadius: `${radius.sm}px`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: colors.brandDim,
  border: `1.5px solid ${colors.brand}`,
  color: colors.brand,
};

const updatingDot = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  fontSize: "9px",
  color: colors.brand,
  fontFamily: fonts.mono,
  textTransform: "uppercase",
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const loadingStateLabel = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  color: colors.brand,
  fontSize: "9px",
  fontFamily: fonts.mono,
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const loadingDot = {
  width: "7px",
  height: "7px",
  borderRadius: "50%",
  background: colors.brand,
  // P6-T10 motion audit: keyframe-based `animation:` (not `transition:`), same recurring
  // pulse-dot string already documented in StatusBadge.jsx, LoadingState.jsx,
  // RecoveryEvents.jsx, RecoveryStats.jsx (P6-T09), and (as `ssh-pulse`)
  // SunshineStreamHistory.jsx. `motion`'s four steps are transition-timing strings, not
  // @keyframes names, so there is no equivalent to alias to here regardless of the 1.6s
  // duration. Left as the original literal; no conversion.
  animation: "badge-pulse 1.6s ease-in-out infinite",
  flexShrink: 0,
};

const loadingValue = {
  width: "54px",
  height: "10px",
  borderRadius: "2px",
  background: surface.l1,
  border: `1px solid ${colors.borderSubtle}`,
  flexShrink: 0,
};

const sectionCard = {
  padding: "16px",
  borderRadius: `${radius.md}px`,
  border: `1px solid ${colors.borderSubtle}`,
  background: surface.l2,
};

const sectionHeading = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: colors.inkFaint,
  // typeScale.meta = 10px/1.3/700/0.12em/uppercase/mono — clean fit
  // within rounding against this rule's pre-existing 9.5px/0.13em (same
  // 0.5px/0.01em gap GameManager's FieldLabel treated as a clean match).
  ...typeScale.meta,
  marginBottom: "10px",
};

const smallError = {
  marginTop: "8px",
  fontSize: "9.5px",
  color: colors.inkFaint,
  fontFamily: fonts.mono,
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
  background: surface.l2,
  color: colors.ink,
  border: `1px solid ${colors.borderStrong}`,
  borderRadius: `${radius.sm}px`,
  padding: "7px 12px",
  fontSize: "10px",
  fontFamily: fonts.mono,
  fontWeight: 700,
  letterSpacing: "0.04em",
  cursor: "pointer",
  // P6-T10 motion audit: real `transition:`, but 150ms does not exactly match any `motion`
  // step (fast: 100ms, base: 160ms, cardIn: 220ms, pill: 180ms cubic-bezier). Left as the
  // original literal; no conversion.
  transition: "background 150ms ease",
};

const disabledButton = {
  ...actionButton,
  opacity: 0.4,
  cursor: "not-allowed",
};

const reasonText = {
  fontSize: "10px",
  color: colors.inkFaint,
  fontFamily: fonts.mono,
  marginTop: "4px",
};

const issueBox = {
  marginTop: "10px",
  padding: "10px 12px",
  borderRadius: `${radius.sm}px`,
  background: colors.accentYellowDim,
  border: `1px solid ${colors.warning}`,
  fontSize: "10px",
  color: colors.warning,
  fontFamily: fonts.mono,
  lineHeight: 1.6,
};

const recoveryBox = {
  marginTop: "10px",
  padding: "10px 12px",
  border: `1px solid ${colors.danger}`,
  background: "rgba(255,107,107,0.08)",
  borderRadius: `${radius.sm}px`,
};

const enableButton = {
  ...actionButton,
  padding: "5px 10px",
  background: colors.accentGreenDim,
  color: colors.success,
  border: `1.5px solid ${colors.success}`,
};

const disableButton = {
  ...actionButton,
  padding: "5px 10px",
  background: "rgba(255,107,107,0.08)",
  color: colors.danger,
  border: `1.5px solid ${colors.danger}`,
};

const globalKeyframes = `
  @keyframes hsp-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

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
