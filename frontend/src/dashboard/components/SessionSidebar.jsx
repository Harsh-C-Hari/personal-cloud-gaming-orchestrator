/**
 * dashboard/components/SessionSidebar.jsx
 *
 * "Live Activity" panel: connection stats + recent event feed. Wraps the
 * existing EventLog component (event data/WS wiring untouched) with a
 * production-quality card: icon-badged stat tiles, a proper section
 * header, and a bordered, genuinely scrollable event feed.
 */

import { FaBolt, FaLayerGroup, FaSatelliteDish, FaStream } from "react-icons/fa";
import { EventLog } from "../../components/EventLog.jsx";
import { DashboardStats } from "./DashboardStats.jsx";
import { colors, fonts } from "../theme.js";

export function SessionSidebar({ activeCount, totalCount, connected, events }) {
  return (
    <div
      style={{
        borderRadius: "10px",
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        overflow: "hidden",
      }}
    >
      <DashboardStats
        stats={[
          { label: "Active", val: activeCount, color: colors.success, icon: <FaBolt /> },
          { label: "Total", val: totalCount, color: colors.accent, icon: <FaLayerGroup /> },
          {
            label: "WebSocket",
            val: connected ? "Online" : "Offline",
            color: connected ? colors.success : colors.danger,
            icon: <FaSatelliteDish />,
          },
        ]}
      />

      <div
        style={{
          padding: "16px 18px 18px",
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: "7px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: colors.accentDim,
                color: colors.accent,
                fontSize: "11px",
              }}
            >
              <FaStream />
            </div>
            <span
              style={{
                fontSize: "12.5px",
                fontWeight: 700,
                color: colors.text,
                fontFamily: fonts.display,
                letterSpacing: "0.02em",
              }}
            >
              Live Activity
            </span>
          </div>

          <span
            style={{
              fontSize: "9px",
              color: colors.textFaint,
              fontFamily: fonts.mono,
              letterSpacing: "0.06em",
            }}
          >
            Session &amp; host events
          </span>
        </div>

        <div
          style={{
            height: "260px",
            padding: "12px",
            borderRadius: "8px",
            background: "rgba(2, 2, 31, 0.07)",
            border: `1px solid ${colors.borderSubtle}`,
          }}
        >
          <EventLog events={events} connected={connected} />
        </div>
      </div>
    </div>
  );
}
