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
          // motion-audit (P6-T04): keyframe-based `animation:` (name +
          // infinite iteration count), not a `transition:`. `motion`'s four
          // steps are duration+easing pairs only, with no keyframe-name or
          // iteration-count semantics — no equivalent exists, same
          // non-convertible category as primitives.jsx's Spinner (P6-T02).
          // Left as a literal, not converted.
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
