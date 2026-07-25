/**
 * dashboard/utils/alerts.js
 *
 * Pure helper — moved verbatim out of the old pages/Dashboard.jsx monolith.
 * No logic changes: same inputs, same alert strings, same order.
 */

export function buildAlerts(hostStatus, hostMetrics) {
  const alerts = [];

  if (!hostStatus) {
    return alerts;
  }

  if (!hostStatus.sunshine_running) {
    alerts.push("Sunshine Offline");
  }

  if (!hostStatus.tailscale_running) {
    alerts.push("Tailscale Offline");
  }

  if (hostStatus.maintenance_mode) {
    alerts.push("Maintenance Mode Enabled");
  }

  if (hostStatus.recovery_required) {
    alerts.push(`Recovery Mode: ${hostStatus.recovery_reason || "Unknown"}`);
  }

  if (hostMetrics?.health === "warning") {
    alerts.push("Host Health Warning");
  }

  if (hostMetrics?.health === "critical") {
    alerts.push("Host Health Critical");
  }

  return alerts;
}
