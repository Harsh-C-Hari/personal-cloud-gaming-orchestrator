/**
 * dashboard/components/ActiveAlerts.jsx
 *
 * Extracted from the old pages/Dashboard.jsx monolith. Same markup/data
 * contract — takes the alert strings produced by dashboard/utils/alerts.
 * buildAlerts.
 */

import { TriangleAlert } from "lucide-react";
import { colors, fonts, radius } from "../theme.js";

export function ActiveAlerts({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <section
      style={{
        padding: "14px 16px",
        borderRadius: `${radius.lg}px`,
        background: "rgba(255,107,107,0.10)",
        border: `1.5px solid rgba(255,107,107,0.3)`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          marginBottom: "10px",
          color: colors.danger,
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
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
              fontSize: "12px",
              fontWeight: 500,
              fontFamily: fonts.body,
            }}
          >
            <TriangleAlert size={11} strokeWidth={2} style={{ flexShrink: 0, color: colors.danger }} />
            {alert}
          </div>
        ))}
      </div>
    </section>
  );
}
