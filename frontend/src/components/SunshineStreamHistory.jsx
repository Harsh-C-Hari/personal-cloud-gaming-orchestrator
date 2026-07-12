import {useState} from "react";
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
                padding: "14px",
                border: "1px solid rgba(148,163,184,0.18)",
                borderRadius: "10px",
                background: "rgba(15,23,42,0.55)",
            }}
        >
            <h2 style={{
                margin: 0,
                fontSize: "13px",
                letterSpacing: "0.12em",
                color: "#e2e8f0",
                fontFamily: "'JetBrains Mono', monospace",
            }}
            >
                SUNSHINE STREAM HISTORY
            </h2>
            
            <br/>

            {loading
              ? <span style={{ color:'white' , fontSize: '14px' , fontWeight: 'bold' }}>Loading Stream History...</span>
              : (
            
                <div>
                {!streams?.length
                    ? <span style={{ color:'white' , fontSize: '14px' , fontWeight: 'bold' }}>No stream history available.</span>
                    : (
                    
                        <div>
                            {displayedStreams.map((stream, index) => (
                                <div
                                    key={index}
                                    style={{
                                        padding: "10px",
                                        borderRadius: "8px",
                                        background: "rgba(2,6,23,0.45)",
                                        border: "1px solid rgba(148,163,184,0.12)",
                                        marginBottom: "8px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                color: "#e2e8f0",
                                                fontSize: "11px",
                                                fontWeight: 700,
                                                fontFamily:
                                                    "'JetBrains Mono', monospace",
                                            }}
                                        >
                                            {
                                                (
                                                    stream.app_name ||
                                                    "Unknown"
                                                ).toUpperCase()
                                            }
                                        </div>

                                        <div
                                            style={{
                                                color: "#64748b",
                                                fontSize: "9px",
                                                marginTop: "2px",
                                                fontFamily:
                                                    "'JetBrains Mono', monospace",
                                            }}
                                        >
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
                                                color: "#64748b",
                                                fontSize: "9px",
                                                marginTop: "4px",
                                                fontFamily:
                                                    "'JetBrains Mono', monospace",
                                            }}
                                        >
                                            {
                                                stream.width && stream.height
                                                    ? `${stream.width}x${stream.height}`
                                                    : "--"
                                            }
                                            {" • "}
                                            {stream.fps || "--"} FPS
                                            {" • "}
                                            {
                                                stream.hdr
                                                    ? "HDR"
                                                    : "SDR"
                                            }
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            padding: "3px 8px",
                                            borderRadius: "999px",
                                            background:
                                                "rgba(56,189,248,0.12)",
                                            border:
                                                "1px solid rgba(56,189,248,0.35)",
                                            color: "#38bdf8",
                                            fontSize: "9px",
                                            fontWeight: 700,
                                            letterSpacing: "0.08em",
                                            fontFamily:
                                                "'JetBrains Mono', monospace",
                                            textTransform: "uppercase",
                                            textAlign: "center",
                                            minWidth: "90px",
                                        }}
                                    >
                                        <div>
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
                                            marginTop: "8px",
                                            border:
                                                "1px solid rgba(148,163,184,0.18)",
                                            background:
                                                "rgba(2,6,23,0.45)",
                                            color: "#94a3b8",
                                            borderRadius: "6px",
                                            padding: "6px",
                                            fontSize: "9px",
                                            fontFamily:
                                                "'JetBrains Mono', monospace",
                                            letterSpacing: "0.08em",
                                            cursor: "pointer",
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
        </section>
    );
}