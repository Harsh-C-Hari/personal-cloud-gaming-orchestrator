/**
 * components/SunshineStreamHistory.jsx
 *
 * Same props (streams, loading), same formatDuration() helper, and same
 * "show all / show less" behavior as before — only the presentation was
 * reworked to match the visual language already used by RecoveryStats /
 * SessionHistory / SessionAnalytics:
 *   - Icon-badged section header.
 *   - A "Total Streams" count pill instead of a plain heading.
 *   - Each stream entry is now a bordered, left-accented card with
 *     icon-labeled rows and a pill-style duration badge.
 */

import { useState } from "react";
import {
  Satellite,
  Monitor,
  Clock,
  Film,
} from "lucide-react";
import { colors, fonts, radius } from "../dashboard/theme.js";

function StreamHistoryLoadingState() {
    return (
        <div className="pcgo-sunshine-history-loading" role="status" aria-live="polite">
            <div style={loadingHeader}>
                <span style={loadingDot} />
                Loading stream history
            </div>
            {["Latest stream", "Previous stream", "Stream details"].map((label) => (
                <div key={label} style={loadingRow} aria-hidden="true">
                    <span style={loadingIcon} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={loadingLineWide} />
                        <span style={loadingLineShort} />
                    </div>
                    <span style={loadingTag} />
                </div>
            ))}
        </div>
    );
}

const panelDescription = {
    marginTop: "3px",
    color: colors.inkFaint,
    fontSize: "9.5px",
    lineHeight: 1.4,
    fontFamily: fonts.mono,
};

const countPill = {
    flexShrink: 0,
    padding: "3px 8px",
    border: `1px solid ${colors.borderSubtle}`,
    borderRadius: `${radius.sm}px`,
    color: colors.inkFaint,
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    fontFamily: fonts.mono,
};

const loadingHeader = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
    color: colors.inkDim,
    fontSize: "10.5px",
    fontFamily: fonts.mono,
};

const loadingDot = {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: colors.brand,
    animation: "ssh-pulse 1.6s ease-in-out infinite",
    flexShrink: 0,
};

const loadingRow = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minHeight: "52px",
    padding: "10px 12px",
    border: `1px solid ${colors.borderSubtle}`,
    borderRadius: `${radius.md}px`,
    background: colors.bgInset,
};

const loadingIcon = {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    background: colors.bgCard,
    border: `1px solid ${colors.borderSubtle}`,
    flexShrink: 0,
};

const loadingLineWide = {
    display: "block",
    width: "min(150px, 70%)",
    height: "8px",
    borderRadius: "2px",
    background: colors.bgCard,
    border: `1px solid ${colors.borderSubtle}`,
};

const loadingLineShort = {
    display: "block",
    width: "92px",
    height: "7px",
    marginTop: "7px",
    borderRadius: "2px",
    background: colors.bgCard,
    border: `1px solid ${colors.borderSubtle}`,
};

const loadingTag = {
    width: "54px",
    height: "16px",
    borderRadius: `${radius.sm}px`,
    background: colors.bgCard,
    border: `1px solid ${colors.borderSubtle}`,
    flexShrink: 0,
};

const emptyBox = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "7px",
    padding: "30px 20px",
    border: `1px dashed ${colors.borderSubtle}`,
    borderRadius: `${radius.md}px`,
    color: colors.inkFaint,
    fontSize: "11px",
    lineHeight: 1.5,
    textAlign: "center",
    fontFamily: fonts.mono,
};

export function SunshineStreamHistory({
    streams,
    loading,
}) {
    const [showAllStreams, setShowAllStreams] = useState(false);

    function formatDuration(seconds) {
        if (seconds == null) return "--";

        const total = Math.floor(seconds);

        const hours = Math.floor(total / 3600);
        const mins = Math.floor((total % 3600) / 60);
        const secs = total % 60;

        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }

        if (mins > 0) {
            return `${mins}m ${secs}s`;
        }

        return `${secs}s`;
    }

    const availableStreams = streams ?? [];
    const displayedStreams =
        showAllStreams
            ? availableStreams
            : availableStreams.slice(0, 3);

    return (
        <section
            className="pcgo-sunshine-stream-history"
            aria-labelledby="sunshine-stream-history-title"
            style={{
                padding: "16px",
                border: `1px solid ${colors.border}`,
                borderRadius: `${radius.lg}px`,
                background: colors.bgCard,
            }}
        >
            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "14px" }}>
                <div
                    style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: `${radius.sm}px`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: colors.brandDim,
                        border: `1.5px solid color-mix(in srgb, ${colors.brand} 30%, transparent)`,
                        color: colors.brand,
                    }}
                >
                    <Satellite size={13} strokeWidth={2} />
                </div>
                    <div>
                        <h2 id="sunshine-stream-history-title" style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: colors.ink, fontFamily: fonts.display }}>
                            Stream History
                        </h2>
                        <div style={panelDescription}>Completed Sunshine streaming sessions</div>
                    </div>

                    {!!availableStreams.length && (
                        <span style={countPill}>{availableStreams.length} STREAMS</span>
                    )}
            </div>

            {loading
              ? <StreamHistoryLoadingState />
              : (
                <div>
                {!availableStreams.length
                    ? (
                        <div style={emptyBox}>
                            <Clock size={17} strokeWidth={1.7} style={{ color: colors.inkFaint }} />
                            <strong>No stream history available</strong>
                            <span>Completed Sunshine sessions will appear here when history is available.</span>
                        </div>
                    )
                    : (

                        <div style={{ display: "grid", gap: "10px" }}>
                            {displayedStreams.map((stream, index) => (
                                <article
                                    key={`${stream.started_at || "stream"}-${index}`}
                                    style={{
                                        borderRadius: `${radius.md}px`,
                                        background: colors.bgInset,
                                        border: `1px solid ${colors.borderSubtle}`,
                                        borderLeft: `2px solid ${colors.brand}`,
                                        padding: "12px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        rowGap: "8px",
                                        gap: "10px",
                                    }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "7px",
                                                color: colors.ink,
                                                fontSize: "12.5px",
                                                fontWeight: 700,
                                            }}
                                        >
                                            <Film size={11} strokeWidth={2} style={{ color: colors.brand, flexShrink: 0 }} />
                                            {
                                                (
                                                    stream.app_name ||
                                                    "Unknown"
                                                ).toUpperCase()
                                            }
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                color: colors.inkDim,
                                                fontSize: "11px",
                                                marginTop: "6px",
                                            }}
                                        >
                                            <Clock size={9} strokeWidth={2} style={{ opacity: 0.7, flexShrink: 0 }} />
                                            {
                                                stream.started_at
                                                    ? new Date(
                                                        stream.started_at * 1000
                                                    ).toLocaleString()
                                                    : "--"
                                            }
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                color: colors.inkFaint,
                                                fontSize: "9.5px",
                                                marginTop: "6px",
                                                fontFamily: fonts.mono,
                                            }}
                                        >
                                            <Monitor size={9} strokeWidth={2} style={{ opacity: 0.7, flexShrink: 0 }} />
                                            {
                                                stream.width && stream.height
                                                    ? `${stream.width}x${stream.height}`
                                                    : "--"
                                            }
                                            {" · "}
                                            {stream.fps || "--"} FPS
                                            {" · "}
                                            {
                                                stream.hdr
                                                    ? "HDR"
                                                    : "SDR"
                                            }
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            flexShrink: 0,
                                            padding: "6px 12px",
                                            borderRadius: `${radius.sm}px`,
                                            background: colors.brandDim,
                                            border: `1.5px solid color-mix(in srgb, ${colors.brand} 35%, transparent)`,
                                            color: colors.brand,
                                            fontSize: "9px",
                                            fontWeight: 700,
                                            letterSpacing: "0.08em",
                                            fontFamily: fonts.mono,
                                            textTransform: "uppercase",
                                            textAlign: "center",
                                            minWidth: "90px",
                                        }}
                                    >
                                        <div style={{ fontSize: "11px" }}>
                                            {
                                                formatDuration(
                                                    stream.duration_seconds
                                                )
                                            }
                                        </div>

                                        <div
                                            style={{
                                                marginTop: "3px",
                                                fontSize: "8px",
                                                opacity: 0.85,
                                            }}
                                        >
                                            STREAM
                                        </div>
                                    </div>
                                </article>
                            ))}
                                    {
                                        availableStreams.length > 3 && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                                setShowAllStreams(
                                                !showAllStreams
                                            )
                                        }
                                        style={{
                                            width: "100%",
                                            marginTop: "2px",
                                            border: `1px solid ${colors.border}`,
                                            background: colors.bgInset,
                                            color: colors.inkDim,
                                            borderRadius: `${radius.md}px`,
                                            padding: "8px 10px",
                                            fontSize: "10px",
                                            fontFamily: fonts.mono,
                                            letterSpacing: "0.08em",
                                            cursor: "pointer",
                                            transition: "background 150ms ease, color 150ms ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = colors.brand;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = colors.inkDim;
                                        }}
                                    >
                                        {
                                            showAllStreams
                                                ? "SHOW LESS"
                                                : `SHOW ALL (${availableStreams.length})`
                                        }
                                    </button>
                                )
                            }
                        </div>
                    )}
                </div>
            )}

            <style>{`@keyframes ssh-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
        </section>
    );
}
