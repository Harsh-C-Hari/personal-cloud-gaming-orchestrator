/**
 * dashboard/components/SessionSidebar.jsx
 *
 * "Live Activity" panel: connection stats + recent event feed. Wraps the
 * existing EventLog component (event data/WS wiring untouched) with a
 * production-quality card: icon-badged stat tiles, a proper section
 * header, and a bordered, genuinely scrollable event feed.
 */

import { Zap, Layers, Satellite, ListTree } from "lucide-react";
import { EventLog } from "../../components/EventLog.jsx";
import { DashboardStats } from "./DashboardStats.jsx";
import { colors, fonts, radius } from "../theme.js";

export function SessionSidebar({ activeCount, totalCount, connected, events }) {
  return (
    <div
      className="pcgo-operational-rail"
      style={{
        borderRadius: `${radius.lg}px`,
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        overflow: "hidden",
      }}
    >
      <div className="pcgo-operational-rail__summary">
        <div className="pcgo-operational-rail__eyebrow">Live system pulse</div>
        <DashboardStats
          stats={[
          { label: "Active", val: activeCount, color: colors.success, icon: <Zap size={15} strokeWidth={2} /> },
          { label: "Total", val: totalCount, color: colors.brand, icon: <Layers size={15} strokeWidth={2} /> },
          {
            label: "WebSocket",
            val: connected ? "Online" : "Offline",
            color: connected ? colors.success : colors.danger,
            icon: <Satellite size={15} strokeWidth={2} />,
          },
          ]}
        />
      </div>

      <div
        className="pcgo-operational-rail__activity"
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
            flexWrap: "wrap",
            gap: "6px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <div
              style={{
                width: "26px",
                height: "26px",
                borderRadius: `${radius.sm}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: colors.brandDim,
                color: colors.brand,
              }}
            >
              <ListTree size={13} strokeWidth={2} />
            </div>
            <span className="pcgo-operational-rail__caption"
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: colors.ink,
                fontFamily: fonts.display,
              }}
            >
              Live Activity
            </span>
          </div>

          <span
            style={{
              fontSize: "10.5px",
              fontWeight: 500,
              color: colors.inkFaint,
              fontFamily: fonts.body,
            }}
          >
            Session &amp; host events
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "140px",
            maxHeight: "min(260px, 40dvh)",
            padding: "12px",
            borderRadius: `${radius.md}px`,
            background: colors.bgInset,
            border: `1px solid ${colors.borderSubtle}`,
            overflow: "hidden",
          }}
        >
          <EventLog events={events} connected={connected} />
        </div>
      </div>
    </div>
  );
}
