/**
 * dashboard/utils/adaptUserHostStatus.js
 *
 * GET /host/status (admin)      -> flat shape: { sunshine_running, host_ready, ... }
 * GET /host/user-status (user)  -> nested shape: { ready, capabilities: { sunshine_running, ... } }
 *
 * Existing components (StartSessionForm, HostStatusPanel usage patterns,
 * dashboard/utils/alerts.buildAlerts) were all written against the flat
 * admin shape. Rather than modifying that shared, already-working logic,
 * this pure adapter normalizes the new user-status response into the same
 * flat shape — so the user dashboard can safely reuse StartSessionForm and
 * buildAlerts untouched.
 *
 * This performs NO network calls and changes NO backend behavior; it is a
 * frontend-only view transformation.
 */

export function adaptUserHostStatus(raw) {
  if (!raw) return null;

  const caps = raw.capabilities || {};

  return {
    // Readiness / lifecycle
    host_ready: raw.ready,
    host_ready_reason: raw.reason,
    host_state: raw.host_state,
    maintenance_mode: raw.maintenance_mode,
    recovery_required: raw.recovery_required,
    recovery_reason: raw.recovery_reason,
    active_session_count: raw.active_session_count,

    // Capabilities (flattened)
    sunshine_running: caps.sunshine_running,
    sunshine_api_reachable: caps.sunshine_api_reachable,
    sunshine_apps_count: caps.sunshine_apps_count,
    sunshine_client_count: caps.sunshine_client_count,
    tailscale_running: caps.tailscale_running,
    gpu_available: caps.gpu_available,

    // Extras only present on the user-status payload — kept for pages
    // that want the richer alert list / health summary directly.
    alerts: raw.alerts || [],
    health: raw.health,
  };
}

/**
 * The user-status endpoint's `alerts` array is already the backend's
 * curated, severity-tagged list — it covers startup, maintenance,
 * recovery, host health, sunshine, and tailscale (see
 * host_agent/lifecycle_manager.py get_user_host_status). No need to
 * re-derive anything client-side like buildAlerts() does for the flat
 * admin shape; just surface the messages as-is.
 */
export function buildUserAlerts(raw) {
  if (!raw?.alerts?.length) return [];
  return raw.alerts.map((a) => a.message);
}
