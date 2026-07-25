/**
 * dashboard/components/EmptyState.jsx
 *
 * Extracted from the old pages/Dashboard.jsx monolith (same markup/style,
 * just given a home and a couple of optional props for reuse across pages).
 */

import { colors, fonts } from "../theme.js";

export function EmptyState({ label = "Nothing here yet", hint }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "52px 32px",
        border: `1px dashed ${colors.borderSubtle}`,
        borderRadius: "8px",
        gap: "12px",
      }}
    >
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <polygon points="18,3 33,12 33,24 18,33 3,24 3,12" stroke="#1e2a3a" strokeWidth="1.5" fill="none" />
        <polygon points="18,9 27,13.5 27,22.5 18,27 9,22.5 9,13.5" stroke="#1e2a3a" strokeWidth="1" fill="none" />
      </svg>

      <span
        style={{
          fontSize: "10px",
          color: colors.textGhost,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontFamily: fonts.mono,
        }}
      >
        {label}
      </span>

      {hint && (
        <span
          style={{
            fontSize: "10px",
            color: colors.textMuted,
            fontFamily: fonts.mono,
            textAlign: "center",
            maxWidth: "320px",
          }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}
