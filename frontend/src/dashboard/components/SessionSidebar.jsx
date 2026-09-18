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
import { colors, fonts, radius, surface } from "../theme.js";

export function SessionSidebar({ activeCount, totalCount, connected, events }) {
  return (
    <div
      className="pcgo-operational-rail"
      style={{
        // TCB-P3 followup: softened from `radius.none` (0px) back to
        // `radius.lg` (16px) — the "Live system pulse" rail is a
        // container surface, not a small chrome chip, and the user-
        // visible 16px curve matches the StartSessionForm container
        // edge + the Card primitive + the Home NavigationCard row
        // (see theme.js `radius.lg` and primitives.jsx Card).
        borderRadius: `${radius.lg}px`,
        /* TCB-P4.2 followup: surface.l3 → surface.l1 to match
           `.pcgo-host-diagnostics-card` (the inset tier introduced by
           the Host Monitor section-card alignment). The Live system
           pulse rail (this container) is a page-level framed section
           card sitting on the page surface; the inner event-log feed
           stays on its own tier. */
        background: surface.l1,
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
                // Per §6.4: icon badge is a `<span>`-scale accent chip, the
                // sanctioned `radius.tight` (4px) exception to the binary
                // system. Was `radius.sm` (8px).
                borderRadius: `${radius.tight}px`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: colors.brandDim,
                color: colors.brand,
              }}
            >
              <ListTree size={13} strokeWidth={2} />
            </div>
            {/* Judgment call: this "Live Activity" caption is a bold mini
                section-title that sits between typeScale.bodySmall (12px,
                body-weight copy) and typeScale.subheading (17px, a full
                section title) — the scale doesn't cover a size in between,
                and forcing either would be a real size change, not a value
                alias (documented at length on the matching
                .pcgo-operational-rail__caption CSS rule in
                feature-page.css, which is what actually renders — the
                14px here was dead, overridden by that rule's
                `font-size: 13px !important`; corrected to 13px below so
                the inline value isn't misleading about what's visible). */}
            <span className="pcgo-operational-rail__caption"
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: colors.ink,
                fontFamily: fonts.display,
              }}
            >
              Live Activity
            </span>
          </div>

          {/* Judgment call: 10.5px/500/body-font subtext doesn't cleanly
              match typeScale.meta (10px but 700/uppercase/mono) or
              typeScale.bodySmall (12px/500/body — closest, but a 1.5px
              size step) — left as a literal value rather than picking a
              step and calling it a fit. */}
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
            // TCB-P3 followup: softened from `radius.none` (0px) to
            // `radius.lg` (16px) to match the parent rail's 16px
            // curve — the inset nests inside the rail, so the
            // matching radius reads as a single framed log surface
            // (the inset is set to `background: surface.l1` to match
            // its parent rail — TCB-P4.2 followup moved the rail from
            // surface.l3 to surface.l1 to match `.pcgo-host-
            // diagnostics-card`; the inset now sits at the same tier
            // as its parent but the inset's dotted border + smaller
            // padding keeps it visually separate).
            borderRadius: `${radius.lg}px`,
            background: surface.l1,
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
