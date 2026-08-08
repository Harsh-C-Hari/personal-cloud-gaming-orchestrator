/**
 * components/SunshineStreamCard.jsx
 *
 * Same props (streamStatus) and same formatStreamDuration/conditional
 * rendering logic as before (streaming vs idle branches, transport/
 * reconnect fields, last-disconnect/reconnect fields) — only the
 * presentation was reworked to match the StatRow/Badge "spec sheet" look
 * already used everywhere else inside its parent, HostStatusPanel.jsx,
 * using flat Chalkboard Neo-Brutalist tokens instead of bare, uncolored
 * rows.
 */

import { RadioTower } from "lucide-react";
import { colors, fonts } from "../dashboard/theme.js";

const TONE_COLORS = {
    ok: colors.success,
    warning: colors.warning,
    bad: colors.danger,
    neutral: colors.inkDim,
};

function Badge({ tone = "neutral", children }) {
    const color = TONE_COLORS[tone] ?? colors.inkDim;
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "9.5px",
                fontWeight: 700,
                letterSpacing: "0.05em",
                color,
                background: `${color}24`,
                border: `1.5px solid ${color}66`,
                borderRadius: "10px",
                padding: "2px 8px",
            }}
        >
            {children}
        </span>
    );
}

function StatRow({ label, value }) {
    return (
        <div className="ssc-row" style={{ display: "flex", alignItems: "baseline", gap: "8px", minWidth: 0, marginTop: "7px" }}>
            <span
                className="ssc-row-label"
                style={{
                    fontSize: "10.5px",
                    color: colors.inkFaint,
                    whiteSpace: "nowrap",
                    fontFamily: fonts.mono,
                }}
            >
                {label}
            </span>
            <span className="ssc-row-fill" style={{ flex: 1, borderBottom: `1px dotted ${colors.border}`, marginBottom: "3px" }} />
            <span
                className="ssc-row-value"
                style={{
                    fontSize: "11.5px",
                    fontWeight: 600,
                    color: colors.ink,
                    fontFamily: fonts.mono,
                    textAlign: "right",
                    maxWidth: "60%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                }}
            >
                {value ?? "--"}
            </span>
        </div>
    );
}

/* Mobile: same fix as HostStatusPanel's .hsp-grid rows — below 560px these
   label/dotted-line/value rows don't have room for longer values (full
   date-times, "1920x1080", etc.), so they were being clipped with an
   ellipsis. Stack label above value and let it wrap instead of truncating. */
const RESPONSIVE_CSS = `
  @media (max-width: 560px) {
    .ssc-row {
      flex-wrap: wrap !important;
      row-gap: 2px !important;
    }
    .ssc-row-label {
      flex: 1 1 100% !important;
    }
    .ssc-row-fill {
      display: none !important;
    }
    .ssc-row-value {
      max-width: 100% !important;
      overflow: visible !important;
      text-overflow: unset !important;
      white-space: normal !important;
      text-align: left !important;
      word-break: break-word !important;
    }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("ssc-responsive-css")) {
    const styleEl = document.createElement("style");
    styleEl.id = "ssc-responsive-css";
    styleEl.textContent = RESPONSIVE_CSS;
    document.head.appendChild(styleEl);
}

export function SunshineStreamCard({ streamStatus }) {
    function formatStreamDuration(seconds) {
        if (seconds == null) return "--";

        const totalSeconds = Math.max(
            0,
            Math.floor(seconds)
        );

        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }

        if (mins > 0) {
            return `${mins}m ${secs}s`;
        }

        return `${secs}s`;
    }

    const isStreaming = streamStatus?.state == "streaming";
    const isIdle = streamStatus?.state == "idle";

    return (
        <div>
            {/* Sub-heading — separates this from the Sunshine service stats above */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "14px",
                    marginBottom: "2px",
                    paddingTop: "10px",
                    borderTop: `1.5px solid ${colors.border}`,
                }}
            >
                <RadioTower size={9} strokeWidth={2} style={{ color: colors.inkFaint }} />
                <span
                    style={{
                        fontSize: "9px",
                        color: colors.inkFaint,
                        letterSpacing: "0.13em",
                        textTransform: "uppercase",
                        fontFamily: fonts.mono,
                    }}
                >
                    Stream Status
                </span>
            </div>

            <StatRow
                label="Stream State"
                value={
                    <Badge tone={isStreaming ? "ok" : "neutral"}>
                        {isStreaming ? "STREAMING" : "IDLE"}
                    </Badge>
                }
            />

            {isStreaming && (
                <div>
                    {streamStatus.transport_connected != null && (
                        <div>
                            <StatRow
                                label="Transport"
                                value={
                                    <Badge tone={streamStatus?.transport_connected ? "ok" : "warning"}>
                                        {streamStatus?.transport_connected ? "CONNECTED" : "DISCONNECTED"}
                                    </Badge>
                                }
                            />

                            <StatRow
                                label="Awaiting Reconnect"
                                value={
                                    <Badge tone={streamStatus?.awaiting_reconnect ? "warning" : "ok"}>
                                        {streamStatus?.awaiting_reconnect ? "YES" : "NO"}
                                    </Badge>
                                }
                            />
                        </div>
                    )}

                    <StatRow label="Application" value={streamStatus?.app_name} />

                    <StatRow
                        label="Started At"
                        value={
                            streamStatus?.started_at
                                ? new Date(streamStatus?.started_at * 1000).toLocaleString()
                                : "--"
                        }
                    />

                    <StatRow label="Duration" value={formatStreamDuration(streamStatus?.duration_seconds)} />

                    <StatRow label="Resolution" value={`${streamStatus?.width}x${streamStatus?.height}`} />

                    <StatRow label="FPS" value={streamStatus?.fps} />

                    <StatRow label="HDR" value={streamStatus?.hdr ? "Enabled" : "Disabled"} />

                    {streamStatus?.last_disconnect_at && (
                        <div>
                            <StatRow
                                label="Last Disconnect"
                                value={
                                    streamStatus?.last_disconnect_at
                                        ? new Date(streamStatus.last_disconnect_at * 1000).toLocaleString()
                                        : "--"
                                }
                            />

                            <StatRow
                                label="Last Reconnect"
                                value={
                                    streamStatus?.last_reconnect_at
                                        ? new Date(streamStatus.last_reconnect_at * 1000).toLocaleString()
                                        : "--"
                                }
                            />
                        </div>
                    )}
                </div>
            )}

            {isIdle && (
                <div>
                    <StatRow label="Last Application" value={streamStatus?.app_name} />

                    <StatRow
                        label="Last Stream Started At"
                        value={
                            streamStatus?.started_at
                                ? new Date(streamStatus?.started_at * 1000).toLocaleString()
                                : "--"
                        }
                    />

                    <StatRow label="Last Duration" value={formatStreamDuration(streamStatus?.duration_seconds)} />

                    <StatRow
                        label="Ended At"
                        value={
                            streamStatus?.ended_at
                                ? new Date(streamStatus?.ended_at * 1000).toLocaleString()
                                : "--"
                        }
                    />
                </div>
            )}
        </div>
    );
}
