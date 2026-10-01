/**
 * dashboard/components/ActiveAlerts.jsx
 *
 * Extracted from the old pages/Dashboard.jsx monolith. Same markup/data
 * contract — takes the alert strings produced by dashboard/utils/alerts.
 * buildAlerts.
 */

import { TriangleAlert } from "lucide-react";
import { colors, fonts, radius, typeScale } from "../theme.js";

export function ActiveAlerts({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  const isWarning = alerts.some((a) => a.toLowerCase().includes("warning"));
  const tint = isWarning ? colors.warning : colors.danger;

  return (
    <section
      className="pcgo-home-alert-strip"
      style={{
        padding: "14px 16px",
        borderRadius: `${radius.none}px`,
        background: isWarning ? colors.accentYellowDim : colors.dangerDim,
        border: `1.5px solid ${isWarning ? colors.warning : colors.danger}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          marginBottom: "10px",
          color: tint,
          // Judgment call: this label reads like a typeScale.meta eyebrow
          // (uppercase, letter-spaced, bold) but is set in fonts.body
          // (sans-serif) at 11px, not meta's mono/10px/700 combination —
          // switching the font family here would be a real visual change,
          // not a value alias. Left as literal values, documented per
          // CURRENT_TASK.md's judgment-call guidance.
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          fontFamily: fonts.body,
        }}
      >
        <TriangleAlert size={13} strokeWidth={2} />
        Active Alerts
      </div>

      <div style={{ display: "grid", gap: "6px" }}>
        {alerts.map((alert) => (
          <div
            key={alert}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              color: colors.ink,
              // Body copy -> typeScale.bodySmall (exact match: 12px/500/body font).
              ...typeScale.bodySmall,
            }}
          >
            <TriangleAlert size={11} strokeWidth={2} style={{ flexShrink: 0, color: tint }} />
            {alert}
          </div>
        ))}
      </div>
    </section>
  );
}
