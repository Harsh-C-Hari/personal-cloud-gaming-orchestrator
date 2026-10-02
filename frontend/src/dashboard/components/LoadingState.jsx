/**
 * dashboard/components/LoadingState.jsx
 *
 * Shared loading placeholder for the dashboard shell (used by Home.jsx,
 * etc). Pulsing-dot + text pattern, kept consistent with the rest of the
 * app (RecoveryEvents, RecoveryStats, SettingsPanel, SunshineStreamHistory,
 * UserPanel, HostStatusPanel).
 *
 * Same prop API as before (`label`, same default) — visual only.
 */

import { colors, typeScale } from "../theme.js";

export function LoadingState({ label = "Connecting to host agent…" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "9px",
        color: colors.inkDim,
        // Body copy -> typeScale.body (13.5px, same 13-14px cluster this
        // 13px value was already part of per D-009's own derivation notes).
        ...typeScale.body,
        padding: "20px 0",
      }}
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: colors.brand,
          // Uses canonical `pulse` keyframe from src/styles/base.css (1.2).
          animation: "pulse 1.6s ease-in-out infinite",
          flexShrink: 0,
        }}
      />
      {label}
    </div>
  );
}

