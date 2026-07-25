/**
 * dashboard/components/ActiveAlerts.jsx
 *
 * Extracted from the old pages/Dashboard.jsx monolith. Same markup/style —
 * takes the alert strings produced by dashboard/utils/alerts.buildAlerts.
 */

import { FaExclamationTriangle } from "react-icons/fa";
import { colors, fonts } from "../theme.js";

export function ActiveAlerts({ alerts }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <section
      style={{
        padding: "12px",
        borderRadius: "10px",
        background: `${colors.danger}1f`,
        border: `1px solid ${colors.danger}40`,
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
          fontFamily: fonts.mono,
        }}
      >
        <FaExclamationTriangle size={11} />
        ACTIVE ALERTS
      </div>

      <div style={{ display: "grid", gap: "6px" }}>
        {alerts.map((alert) => (
          <div
            key={alert}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              color: "#fca5a5",
              fontSize: "11px",
              fontFamily: fonts.mono,
            }}
          >
            <FaExclamationTriangle size={9} style={{ flexShrink: 0, color: colors.danger }} />
            {alert}
          </div>
        ))}
      </div>
    </section>
  );
}
