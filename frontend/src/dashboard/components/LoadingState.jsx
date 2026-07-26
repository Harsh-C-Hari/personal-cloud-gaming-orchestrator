/**
 * dashboard/components/LoadingState.jsx
 *
 * Shared loading placeholder for the dashboard shell (used by Home.jsx,
 * etc). Brought in line with the pulsing-dot + mono-text pattern already
 * used consistently across the rest of the app (RecoveryEvents,
 * RecoveryStats, SettingsPanel, SunshineStreamHistory, UserPanel,
 * HostStatusPanel) — this was the one remaining spot still using plain
 * flat gray text instead of that pattern.
 *
 * Same prop API as before (`label`, same default) — visual only.
 */

import { colors, fonts } from "../theme.js";

export function LoadingState({ label = "Connecting to host agent…" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "9px",
        color: colors.textDim,
        fontFamily: fonts.mono,
        fontSize: "11.5px",
        padding: "20px 0",
      }}
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: colors.accent,
          animation: "dashboard-loading-pulse 1.4s ease-in-out infinite",
          flexShrink: 0,
        }}
      />
      {label}

      <style>{`
        @keyframes dashboard-loading-pulse {
          0%, 100% { opacity: 1;   }
          50%      { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
