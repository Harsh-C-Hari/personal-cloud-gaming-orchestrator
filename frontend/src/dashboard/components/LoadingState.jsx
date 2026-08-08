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

import { colors, fonts } from "../theme.js";

export function LoadingState({ label = "Connecting to host agent…" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "9px",
        color: colors.inkDim,
        fontFamily: fonts.body,
        fontWeight: 500,
        fontSize: "13px",
        padding: "20px 0",
      }}
    >
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: colors.brand,
          animation: "dashboard-loading-pulse 1.6s ease-in-out infinite",
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
