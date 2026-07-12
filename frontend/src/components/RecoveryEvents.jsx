export function RecoveryEvents({
    recoveryEvents,
    recoveryEventsLoading,
    showAllRecoveryEvents,
    setShowAllRecoveryEvents,
}) {

    const displayedRecoveryEvents =
        showAllRecoveryEvents
            ? recoveryEvents
            : recoveryEvents.slice(0, 3);

    return (
        <section
            style={{
                padding: "14px",
                border: "1px solid rgba(148,163,184,0.18)",
                borderRadius: "10px",
                background: "rgba(15,23,42,0.55)",
            }}
        >

            <h2
                style={{
                    margin: "0 0 12px 0",
                    fontSize: "13px",
                    letterSpacing: "0.12em",
                    color: "#e2e8f0",
                    fontFamily: "'JetBrains Mono', monospace",
                }}
            >
                RECOVERY EVENTS
            </h2>

            {recoveryEventsLoading
                ? (
                    <span
                        style={{
                            color: "white",
                            fontSize: "14px",
                            fontWeight: "bold",
                        }}
                    >
                        Loading Recovery Events...
                    </span>
                )
                : (
                    <div>

                        {
                            displayedRecoveryEvents.map(
                                (event) => {

                                    const badgeColor =
                                        event.event ===
                                        "restart_success"
                                            ? "#22c55e"
                                            : event.event ===
                                            "restart_failed"
                                                ? "#ef4444"
                                                : event.event ===
                                                "restart_attempt"
                                                    ? "#f59e0b"
                                                    : "#38bdf8";

                                    return (
                                        <div
                                            key={`${event.time}-${event.event}`}
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
                                                        event.service.toUpperCase()
                                                    }
                                                </div>

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
                                                        event.event.replaceAll(
                                                            "_",
                                                            " "
                                                        )
                                                    }

                                                    {
                                                        event.details?.failure_mode != null &&
                                                        event.event ==
                                                        "failure_detected" && (
                                                            <div
                                                                style={{
                                                                    color: "#64748b",
                                                                    fontSize: "9px",
                                                                    marginTop: "2px",
                                                                    fontFamily:
                                                                        "'JetBrains Mono', monospace",
                                                                }}
                                                            >
                                                                Mode:
                                                                {" "}
                                                                {
                                                                    event.details.failure_mode
                                                                }
                                                            </div>
                                                        )
                                                    }

                                                    {
                                                        event.details?.state != null &&
                                                        event.event ==
                                                        "initial_state" && (
                                                            <div
                                                                style={{
                                                                    color: "#64748b",
                                                                    fontSize: "9px",
                                                                    marginTop: "2px",
                                                                    fontFamily:
                                                                        "'JetBrains Mono', monospace",
                                                                }}
                                                            >
                                                                State:
                                                                {" "}
                                                                {
                                                                    event.details.state
                                                                }
                                                            </div>
                                                        )
                                                    }
                                                </div>

                                                <div
                                                    style={{
                                                        color: "#64748b",
                                                        fontSize: "9px",
                                                        marginTop: "3px",
                                                        fontFamily:
                                                            "'JetBrains Mono', monospace",
                                                    }}
                                                >
                                                    {
                                                        new Date(
                                                            event.time * 1000
                                                        ).toLocaleString()
                                                    }
                                                </div>

                                                {
                                                    event.details?.attempt != null &&
                                                    event.details?.attempt != 0 && (
                                                        <div
                                                            style={{
                                                                color: "#64748b",
                                                                fontSize: "9px",
                                                                marginTop: "2px",
                                                                fontFamily:
                                                                    "'JetBrains Mono', monospace",
                                                            }}
                                                        >
                                                            Attempt:
                                                            {" "}
                                                            {
                                                                event.details.attempt
                                                            }
                                                        </div>
                                                    )
                                                }

                                            </div>

                                            <div
                                                style={{
                                                    padding: "3px 8px",
                                                    borderRadius: "999px",
                                                    background:
                                                        `${badgeColor}22`,
                                                    border:
                                                        `1px solid ${badgeColor}55`,
                                                    color: badgeColor,
                                                    fontSize: "9px",
                                                    fontWeight: 700,
                                                    letterSpacing: "0.08em",
                                                    fontFamily:
                                                        "'JetBrains Mono', monospace",
                                                    textTransform:
                                                        "uppercase",
                                                }}
                                            >
                                                {
                                                    event.event.replaceAll(
                                                        "_",
                                                        " "
                                                    )
                                                }
                                            </div>
                                        </div>
                                    );
                                }
                            )
                        }

                        {
                            recoveryEvents.length > 3 && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowAllRecoveryEvents(
                                            !showAllRecoveryEvents
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
                                    onMouseEnter={(e) =>
                                        e.currentTarget.style.background =
                                            "rgba(56,191,248,0.08)"
                                    }
                                    onMouseLeave={(e) =>
                                        e.currentTarget.style.background =
                                            "rgba(56,191,248,0)"
                                    }
                                >
                                    {
                                        showAllRecoveryEvents
                                            ? "SHOW LESS"
                                            : `SHOW ALL (${recoveryEvents.length})`
                                    }
                                </button>
                            )
                        }

                    </div>
                )
            }

        </section>
    );
}