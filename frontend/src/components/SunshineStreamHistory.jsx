/**
 * components/SunshineStreamHistory.jsx
 *
 * Same props (streams, loading), same formatDuration() helper, and same
 * "show all / show less" behavior as before — only the presentation was
 * reworked to match the visual language already used by RecoveryStats /
 * SessionHistory / SessionAnalytics:
 *   - Icon-badged section header.
 *   - A "Total Streams" stat tile instead of a plain heading.
 *   - Each stream entry is now a bordered, left-accented card with
 *     icon-labeled rows and a pill-style duration badge.
 */

import { useState } from "react";
import {
  FaSatelliteDish,
  FaDesktop,
  FaClock,
  FaFilm,
} from "react-icons/fa";

const palette = {
  border: "rgba(148,163,184,0.18)",
  borderSubtle: "#1c2130",
  card: "rgba(0, 0, 0, 0.45)",
  text: "#e2e8f0",
  dim: "#94a3b8",
  faint: "#64748b",
  muted: "#475569",
  accent: "#38bdf8",
  mono: "'JetBrains Mono', monospace",
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

    const displayedStreams =
        showAllStreams
            ? streams
            : streams.slice(0, 3);
    
    return (
        <section
            style={{
                padding: "16px",
                border: `1px solid ${palette.border}`,
                borderRadius: "10px",
                background: "rgba(0, 0, 0, 0.74)",
            }}
        >
            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "14px" }}>
                <div
                    style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "7px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(56,189,248,0.12)",
                        border: "1px solid rgba(56,189,248,0.3)",
                        color: palette.accent,
                    }}
                >
                    <FaSatelliteDish size={12} />
                </div>
                <h2 style={{
                    margin: 0,
                    fontSize: "13px",
                    letterSpacing: "0.12em",
                    color: palette.text,
                    fontFamily: palette.mono,
                }}
                >
                    SUNSHINE STREAM HISTORY
                </h2>

                {!!streams?.length && (
                    <span
                        style={{
                            fontSize: "9px",
                            color: palette.faint,
                            fontFamily: palette.mono,
                            border: `1px solid ${palette.borderSubtle}`,
                            borderRadius: "10px",
                            padding: "1px 8px",
                        }}
                    >
                        {streams.length}
                    </span>
                )}
            </div>

            {loading
              ? (
                <div style={{ display: "flex", alignItems: "center", gap: "9px", color: palette.dim, fontFamily: palette.mono, fontSize: "11.5px" }}>
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: palette.accent, animation: "ssh-pulse 1.4s ease-in-out infinite" }} />
                    Loading stream history...
                </div>
              )
              : (
            
                <div>
                {!streams?.length
                    ? (
                        <div
                            style={{
                                padding: "26px",
                                textAlign: "center",
                                border: `1px dashed ${palette.borderSubtle}`,
                                borderRadius: "8px",
                                color: palette.muted,
                                fontSize: "11px",
                                fontFamily: palette.mono,
                            }}
                        >
                            No stream history available.
                        </div>
                    )
                    : (
                    
                        <div style={{ display: "grid", gap: "10px" }}>
                            {displayedStreams.map((stream, index) => (
                                <div
                                    key={index}
                                    style={{
                                        borderRadius: "8px",
                                        background: palette.card,
                                        border: `1px solid ${palette.borderSubtle}`,
                                        borderLeft: `2px solid ${palette.accent}`,
                                        padding: "12px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        gap: "10px",
                                    }}
                                >
                                    <div style={{ minWidth: 0 }}>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "7px",
                                                color: palette.text,
                                                fontSize: "12.5px",
                                                fontWeight: 700,
                                            }}
                                        >
                                            <FaFilm size={11} style={{ color: palette.accent, flexShrink: 0 }} />
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
                                                color: palette.dim,
                                                fontSize: "11px",
                                                marginTop: "6px",
                                            }}
                                        >
                                            <FaClock size={9} style={{ opacity: 0.7, flexShrink: 0 }} />
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
                                                color: palette.faint,
                                                fontSize: "9.5px",
                                                marginTop: "6px",
                                                fontFamily: palette.mono,
                                            }}
                                        >
                                            <FaDesktop size={9} style={{ opacity: 0.7, flexShrink: 0 }} />
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
                                            borderRadius: "999px",
                                            background: "rgba(56,189,248,0.12)",
                                            border: "1px solid rgba(56,189,248,0.35)",
                                            color: palette.accent,
                                            fontSize: "9px",
                                            fontWeight: 700,
                                            letterSpacing: "0.08em",
                                            fontFamily: palette.mono,
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
                                </div>
                            ))}
                            {
                                streams.length > 3 && (
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
                                            border: `1px solid ${palette.border}`,
                                            background: palette.card,
                                            color: palette.dim,
                                            borderRadius: "8px",
                                            padding: "8px 10px",
                                            fontSize: "10px",
                                            fontFamily: palette.mono,
                                            letterSpacing: "0.08em",
                                            cursor: "pointer",
                                            transition: "background 0.15s, color 0.15s",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = palette.accent;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = palette.dim;
                                        }}
                                    >
                                        {
                                            showAllStreams
                                                ? "SHOW LESS"
                                                : `SHOW ALL (${streams.length})`
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
