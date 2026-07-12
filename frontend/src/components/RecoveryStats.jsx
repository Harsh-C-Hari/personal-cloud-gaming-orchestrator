export function RecoveryStats({
    recoveryStats,
    showTailscaleRecoveryDetails,
    setShowTailscaleRecoveryDetails,
    showTailscaleFailureDetails,
    setShowTailscaleFailureDetails,
}) {

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
                    fontFamily:
                        "'JetBrains Mono', monospace",
                }}
            >
                RECOVERY SYSTEM
            </h2>

            {!recoveryStats
                ? (
                    <span
                        style={{
                            color: "white",
                            fontSize: "14px",
                            fontWeight: "bold",
                        }}
                    >
                        Loading Recovery Statistics...
                    </span>
                )
                : (
                    <div>

                        {/* Sunshine Recoveries */}

                        <div style={card}>
                            <div style={label}>
                                SUNSHINE RECOVERIES
                            </div>

                            <div style={value}>
                                {
                                    recoveryStats
                                    ?.sunshine_restarts ?? 0
                                }
                            </div>
                        </div>

                        {/* Sunshine Failures */}

                        <div style={card}>
                            <div style={label}>
                                SUNSHINE FAILURES
                            </div>

                            <div style={value}>
                                {
                                    recoveryStats
                                    ?.sunshine_failures ?? 0
                                }
                            </div>
                        </div>

                        {/* Tailscale Recoveries */}

                        <div style={card}>
                            <div style={label}>
                                TAILSCALE RECOVERIES
                            </div>

                            <div style={value}>
                                {
                                    recoveryStats
                                    ?.tailscale_recoveries ?? 0
                                }
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowTailscaleRecoveryDetails(
                                        !showTailscaleRecoveryDetails
                                    )
                                }
                                style={buttonStyle}
                            >
                                {
                                    showTailscaleRecoveryDetails
                                        ? "HIDE DETAILS"
                                        : "SHOW DETAILS"
                                }
                            </button>
                        </div>

                        {
                            showTailscaleRecoveryDetails && (
                                <section>
                                    <div style={card}>
                                        <div style={label}>
                                            SERVICE RECOVERIES
                                        </div>

                                        <div style={value}>
                                            {
                                                recoveryStats
                                                ?.tailscale_service_recoveries ?? 0
                                            }
                                        </div>
                                    </div>

                                    <div style={card}>
                                        <div style={label}>
                                            IPN RECOVERIES
                                        </div>

                                        <div style={value}>
                                            {
                                                recoveryStats
                                                ?.tailscale_ipn_recoveries ?? 0
                                            }
                                        </div>
                                    </div>

                                    <div style={card}>
                                        <div style={label}>
                                            UP RECOVERIES
                                        </div>

                                        <div style={value}>
                                            {
                                                recoveryStats
                                                ?.tailscale_up_recoveries ?? 0
                                            }
                                        </div>
                                    </div>
                                </section>
                            )
                        }

                        {/* Tailscale Failures */}

                        <div style={card}>
                            <div style={label}>
                                TAILSCALE FAILURES
                            </div>

                            <div style={value}>
                                {
                                    recoveryStats
                                    ?.tailscale_failures ?? 0
                                }
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowTailscaleFailureDetails(
                                        !showTailscaleFailureDetails
                                    )
                                }
                                style={buttonStyle}
                            >
                                {
                                    showTailscaleFailureDetails
                                        ? "HIDE DETAILS"
                                        : "SHOW DETAILS"
                                }
                            </button>
                        </div>

                        {
                            showTailscaleFailureDetails && (
                                <section>

                                    <div style={card}>
                                        <div style={label}>
                                            NOSTATE EVENTS
                                        </div>

                                        <div style={value}>
                                            {
                                                recoveryStats
                                                ?.tailscale_nostate ?? 0
                                            }
                                        </div>
                                    </div>

                                    <div style={card}>
                                        <div style={label}>
                                            STOPPED EVENTS
                                        </div>

                                        <div style={value}>
                                            {
                                                recoveryStats
                                                ?.tailscale_stopped ?? 0
                                            }
                                        </div>
                                    </div>

                                    <div style={card}>
                                        <div style={label}>
                                            SERVICE STOPPED
                                        </div>

                                        <div style={value}>
                                            {
                                                recoveryStats
                                                ?.tailscale_service_stopped ?? 0
                                            }
                                        </div>
                                    </div>

                                    <div style={card}>
                                        <div style={label}>
                                            IPN MISSING
                                        </div>

                                        <div style={value}>
                                            {
                                                recoveryStats
                                                ?.tailscale_ipn_missing ?? 0
                                            }
                                        </div>
                                    </div>

                                </section>
                            )
                        }

                    </div>
                )}
        </section>
    );
}

const card = {
    padding: "10px",
    borderRadius: "8px",
    background: "rgba(2,6,23,0.45)",
    border: "1px solid rgba(148,163,184,0.12)",
    marginBottom: "10px",
};

const label = {
    fontSize: "10px",
    color: "#94a3b8",
    letterSpacing: "0.08em",
    fontFamily:
        "'JetBrains Mono', monospace",
};

const value = {
    marginTop: "4px",
    fontSize: "20px",
    fontWeight: 700,
    color: "#22c55e",
};

const buttonStyle = {
    width: "100%",
    marginTop: "8px",
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(2,6,23,0.45)",
    color: "#94a3b8",
    borderRadius: "6px",
    padding: "6px",
    fontSize: "9px",
    fontFamily:
        "'JetBrains Mono', monospace",
    letterSpacing: "0.08em",
    cursor: "pointer",
};