export function SunshineStreamCard({
    streamStatus,
}) {
    
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

    return (
        <div>
            <div style={row}>
                <span>Stream State</span>
                <b>{streamStatus?.state == "streaming" 
                    ? "STREAMING" 
                    : "IDLE"}
                </b>
            </div>
            
            {streamStatus?.state == "streaming" && (
                <div>
                    {streamStatus.transport_connected != null && (
                        <div>
                            <div style={row}>
                                <span>Transport</span>

                                <b
                                    style={{
                                        color:
                                            streamStatus?.transport_connected
                                                ? "#10d98a"
                                                : "#facc15"
                                    }}
                                >
                                    {
                                        streamStatus?.transport_connected
                                            ? "CONNECTED"
                                            : "DISCONNECTED"
                                    }
                                </b>
                            </div>

                            <div style={row}>
                                <span>Awaiting Reconnect</span>

                                <b
                                    style={{
                                        color:
                                            streamStatus?.awaiting_reconnect
                                                ? "#facc15"
                                                : "#10d98a"
                                    }}
                                >
                                    {
                                        streamStatus?.awaiting_reconnect
                                            ? "YES"
                                            : "NO"
                                    }
                                </b>
                            </div>
                        </div>
                    )}
                    
                    <div style={row}>
                        <span>Application</span>
                        <b>{streamStatus?.app_name}</b>
                    </div>

                    <div style={row}>
                        <span>Started At</span>
                        <b>
                            {
                                streamStatus?.started_at
                                    ? new Date(
                                        streamStatus?.started_at * 1000
                                    ).toLocaleString()
                                    : "--"
                            }
                        </b>
                    </div>
                    
                    <div style={row}>
                        <span>Duration</span>
                        <b>{formatStreamDuration(streamStatus?.duration_seconds)}</b>
                    </div>

                    <div style={row}>
                        <span>Resolution</span>
                        <b>{streamStatus?.width}x{streamStatus?.height}</b>
                    </div>

                    <div style={row}>
                        <span>FPS</span>
                        <b>{streamStatus?.fps}</b>
                    </div>

                    <div style={row}>
                        <span>HDR</span>
                        <b>{streamStatus?.hdr ? "Enabled" : "Disabled"}</b>
                    </div>

                    {streamStatus?.last_disconnect_at && (
                        <div>
                            <div style={row}>
                                <span>Last Disconnect</span>

                                <b>
                                    {
                                        streamStatus?.last_disconnect_at
                                            ? new Date(
                                                streamStatus.last_disconnect_at
                                                * 1000
                                            ).toLocaleString()
                                            : "--"
                                    }
                                </b>
                            </div>

                            <div style={row}>
                                <span>Last Reconnect</span>

                                <b>
                                    {
                                        streamStatus?.last_reconnect_at
                                            ? new Date(
                                                streamStatus.last_reconnect_at
                                                * 1000
                                            ).toLocaleString()
                                            : "--"
                                    }
                                </b>
                            </div>
                        </div>
                    )}
                </div>
            )}
                
            {streamStatus?.state == "idle" && (
                <div>
                    <div style={row}>
                        <span>Last Application</span>
                        <b>{streamStatus?.app_name}</b>
                    </div>

                    <div style={row}>
                        <span>Last Stream Started At</span>
                        <b>
                            {
                                streamStatus?.started_at
                                    ? new Date(
                                        streamStatus?.started_at * 1000
                                    ).toLocaleString()
                                    : "--"
                            }
                        </b>
                    </div>

                    <div style={row}>
                        <span>Last Duration</span>
                        <b>{formatStreamDuration(streamStatus?.duration_seconds)}</b>
                    </div>
                    
                    <div style={row}>
                        <span>Ended At</span>
                        <b>
                            {
                                streamStatus?.ended_at
                                    ? new Date(
                                        streamStatus?.ended_at * 1000
                                    ).toLocaleString()
                                    : "--"
                            }
                        </b>
                    </div>
                </div>
            )}
        </div>
    );
}

const row = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "12px",
  marginTop: "7px",
};