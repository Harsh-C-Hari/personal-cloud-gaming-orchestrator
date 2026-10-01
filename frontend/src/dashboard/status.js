/**
 * src/dashboard/status.js
 *
 * 3.5: Canonical status to tone mapping (D3).
 *
 * D3 rules:
 *   running, restarted, completed, ready  -- success
 *   starting, restarting, cleaning        -- info
 *   stopping, health warning              -- warning
 *   failed, offline                       -- danger
 *   stopped, unknown                      -- neutral
 *
 * Label is sentence case (no uppercase per 2.3).
 * Pulse = true for in-progress states only.
 */

import { colors } from "./theme.js";

export const STATUS_MAP = {
  running:    { label: "Running",    color: colors.success, wash: `${colors.success}24`, pulse: true  },
  restarted:  { label: "Restarted", color: colors.success, wash: `${colors.success}24`, pulse: false },
  completed:  { label: "Completed", color: colors.success, wash: `${colors.success}24`, pulse: false },
  ready:      { label: "Ready",     color: colors.success, wash: `${colors.success}24`, pulse: false },
  starting:   { label: "Starting",  color: colors.info,    wash: `${colors.info}24`,    pulse: true  },
  restarting: { label: "Restarting",color: colors.info,    wash: `${colors.info}24`,    pulse: true  },
  cleaning:   { label: "Cleaning",  color: colors.info,    wash: `${colors.info}24`,    pulse: true  },
  stopping:   { label: "Stopping",  color: colors.warning, wash: `${colors.warning}24`, pulse: false },
  failed:     { label: "Failed",    color: colors.danger,  wash: `${colors.danger}24`,  pulse: false },
  offline:    { label: "Offline",   color: colors.danger,  wash: `${colors.danger}24`,  pulse: false },
  stopped:    { label: "Stopped",   color: colors.neutral, wash: `${colors.neutral}24`, pulse: false },
};

export const STATUS_FALLBACK = {
  label: "Unknown",
  color: colors.neutral,
  wash:  `${colors.neutral}24`,
  pulse: false,
};

export function getStatusTone(status) {
  if (!status) return STATUS_FALLBACK;
  return STATUS_MAP[status.toLowerCase()] ?? STATUS_FALLBACK;
}
