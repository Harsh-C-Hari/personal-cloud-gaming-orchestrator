export function HostStatusPanel({
  status,
  metrics,
  loading,
  error,
  sunshineAction,
  onStartSunshine,
  onRestartSunshine,
  handleMaintenanceToggle,
  enableMaintenance,
  disableMaintenance,
  maintenanceAction,
  sessionHealth,
  handleRevalidate,
  revalidating,
  tailscaleStatus,
  streamStatus,
}) {
  if (error && !status) {
    return <div style={box}>Host status unavailable</div>;
  }

  if (!status) {
    return <div style={box}>Checking host...</div>;
  }

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
    <div style={box}>
      <div style={headerRow}>
        <div style={title}>Host Status</div>

        {loading && (
          <span style={updatingDot}>
            updating
          </span>
        )}
      </div>

      {metrics && (
        <>
          <div style={row}>
            <span>Host</span>
            <b>{metrics.hostname}</b>
          </div>

          <div style={row}>
            <span>Host OS</span>
            <b>{metrics.os}</b>
          </div>

          <div style={row}>
            <span>Host OS Version</span>
            <b>{metrics.os_version}</b>
          </div>

          <div style={row}>
            <span>Device Type</span>
            <b>
              {metrics.machine_type}
            </b>
          </div>

          <div style={row}>
            <span>Session Lock</span>
            <b
              style={
                sessionHealth?.lock_exists
                  ? warning
                  : ok
              }
            >
              {
                sessionHealth?.lock_exists
                  ? "LOCKED"
                  : "FREE"
              }
            </b>
          </div>

          {sessionHealth?.lock_exists && (
            <>
              <div style={row}>
                <span>Lock User</span>
                <b>
                  {sessionHealth?.user_id}
                </b>
              </div>

              <div style={row}>
                <span>Lock Game</span>
                <b>
                  {sessionHealth?.game_id}
                </b>
              </div>

              <div style={row}>
                <span>Lock Session</span>
                <b>
                  {sessionHealth?.session_id}
                </b>
              </div>
            </>
          )}
          
          <div 
            style={{
              ...row,
              marginTop: "10px",
              paddingTop: "8px",
              borderTop: "1px solid #1c2130",
            }}
          >
            <span>Host Ready</span>
            <b
              style={
                status.host_ready
                  ? ok
                  : bad
              }
            >
              {status.host_ready ? "YES" : "NO"}
            </b>
          </div>

          <div style={reasonText}>
            {status.host_ready_reason}
          </div>

          <div style={row}>
            <span>Host State</span>

            <b
              style={
                status.host_state === "ready"
                  ? ok
                  : status.host_state === "degraded"
                  ? warning
                  : status.host_state === "busy"
                  ? info
                  : status.host_state === "starting"
                  ? neutral
                  : bad
              }
            >
              {status.host_state?.toUpperCase()}
            </b>
          </div>

          {status.recovery_required && (
            <div
              style={{
                marginTop: "10px",
                padding: "8px",
                border:
                  "1px solid rgba(239,68,68,0.4)",
                borderRadius: "4px",
              }}
            >
              <div>
                Recovery Mode Active
              </div>

              <div
                style={{
                  opacity: 0.8,
                  fontSize: "11px",
                }}
              >
                {
                  status.recovery_reason
                }
              </div>
            </div>
          )}
          
          <button
            disabled={revalidating}
            onClick={handleRevalidate}
            style={
              revalidating
                ? disabledButton
                : actionButton
            }
            onMouseEnter={(e) =>
              e.currentTarget.style.background =
                "rgba(56,189,248,0.08)"
            }

            onMouseLeave={(e) =>
              e.currentTarget.style.background =
                "rgba(56,189,248,0.05)"
            }
          >
            {
              revalidating
                ? "REVALIDATING..."
                : "Revalidate Host"
            }
          </button>
          
          <div style={row}>
            <span>Maintenance</span>

            <button
              disabled={maintenanceAction}
              onClick={handleMaintenanceToggle}
              style={
                maintenanceAction
                  ? disabledButton
                  : status.maintenance_mode
                  ? disableButton
                  : enableButton
              }
            >
              {
                maintenanceAction
                  ? "UPDATING..."
                  : status.maintenance_mode
                  ? "Disable"
                  : "Enable"
              }
            </button>
          </div>
          
          <div style={row}>
            <span>Startup Completed</span>
            <b
              style={
                status.startup_completed
                  ? ok
                  : bad
              }
            >
              {status.startup_completed ? "YES" : "NO"}
            </b>
          </div>

          <div style={row}>
            <span>Last Validation</span>
            <b>
              {status.last_validation
                ? new Date(status.last_validation * 1000).toLocaleString()
                : "Never"}
            </b>
          </div>

          {status.startup_issues?.length > 0 && (
            <div style={issueBox}>
              {status.startup_issues.map(
                (issue) => (
                  <div key={issue}>
                    • {issue}
                  </div>
                )
              )}
            </div>
          )}

          <div style={row}>
            <span>Active Sessions</span>
            <b>{status.active_session_count}</b>
          </div>
          
          <div style={row}>
            <span>Health</span>
            <b
              style={
                metrics.health === "healthy"
                  ? ok
                  : metrics.health === "warning"
                  ? warning
                  : bad
              }
            >
              {metrics.health.toUpperCase()}
            </b>
          </div>

          <div style={row}>
            <span>Uptime</span>
            <b>{metrics.uptime_hours} h</b>
          </div>
        </>
      )}

      <div
        style={{
          marginTop: "10px",
          marginBottom: "10px",
          borderTop: "1px solid #111620",
        }}
      />

      <div style={row}>
        <span>Sunshine</span>
        <b
          style={
            sunshineAction
              ? warning
              : status.sunshine_running
              ? ok
              : bad
          }
        >
          {sunshineAction === "starting"
            ? "STARTING..."
            : sunshineAction === "restarting"
            ? "RESTARTING..."
            : status.sunshine_running
            ? "ON"
            : "OFF"}
        </b>
      </div>

      <div style={row}>
        <span>Sunshine API</span>
        <b
          style={
            sunshineAction
              ? warning
              : status.sunshine_api_reachable
              ? ok
              : bad
          }
        >
          {sunshineAction
            ? "CHECKING..."
            : status.sunshine_api_reachable
            ? "READY"
            : "NO"}
        </b>
      </div>

      <div style={row}>
        <b>Can Sunshine Stop :{status.sunshine_can_stop ? "YES" : "NO"}</b>
      </div>

      <div style={buttonRow}>
        <button
          disabled={
            sunshineAction ||
            status.sunshine_running
          }
          onClick={onStartSunshine}
          style={
            sunshineAction ||
            status.sunshine_running
              ? disabledButton
              : actionButton
          }
        >
          {
            sunshineAction === "starting"
              ? "STARTING..."
              : "Start"
          }
        </button>

        <button
          disabled={!!sunshineAction}
          onClick={onRestartSunshine}
          style={
            sunshineAction
              ? disabledButton
              : actionButton
          }
        >
          {
            sunshineAction === "restarting"
              ? "RESTARTING..."
              : "Restart"
          }
        </button>
      </div>

      <div style={row}>
        <span>Sunshine Paired Clients</span>
        <b>
          {status.sunshine_client_count == null
            ? "N/A"
            : status.sunshine_client_count}
        </b>
      </div>

      <div style={row}>
        <span>Sunshine Apps</span>
        <b>{status.sunshine_apps_count ?? 0}</b>
      </div>

      {status.sunshine_error && (
        <div style={smallError}>
          {status.sunshine_error}
        </div>
      )}

      <div
        style={{
          marginTop: "10px",
          marginBottom: "10px",
          borderTop: "1px solid #111620",
        }}
      />
      
      <div style={row}>
        <span>Stream State</span>
        <b>{streamStatus.state == "streaming" 
          ? "STREAMING" 
          : "IDLE"}
        </b>
      </div>
      
      {streamStatus.state == "streaming" && (
        <div>
          <div style={row}>
            <span>Application</span>
            <b>{streamStatus.app_name}</b>
          </div>

          <div style={row}>
            <span>Started At</span>
            <b>{new Date(streamStatus.started_at * 1000).toLocaleString()}</b>
          </div>
          
          <div style={row}>
            <span>Duration</span>
            <b>{formatStreamDuration(streamStatus.duration_seconds)}</b>
          </div>

          <div style={row}>
            <span>Resolution</span>
            <b>{streamStatus.width}x{streamStatus.height}</b>
          </div>

          <div style={row}>
            <span>FPS</span>
            <b>{streamStatus.fps}</b>
          </div>

          <div style={row}>
            <span>HDR</span>
            <b>{streamStatus.hdr ? "Enabled" : "Disabled"}</b>
          </div>
        </div>
      )}
      
      {streamStatus.state == "idle" && (
        <div>
          <div style={row}>
            <span>Last Application</span>
            <b>{streamStatus.app_name}</b>
          </div>

          <div style={row}>
            <span>Last Stream Started At</span>
            <b>{new Date(streamStatus.started_at * 1000).toLocaleString()}</b>
          </div>

          <div style={row}>
            <span>Last Duration</span>
            <b>{formatStreamDuration(streamStatus.duration_seconds)}</b>
          </div>
          
          <div style={row}>
            <span>Ended At</span>
            <b>{new Date(streamStatus.ended_at * 1000).toLocaleString()}</b>
          </div>
        </div>
      )}
      <div
        style={{
          marginTop: "10px",
          marginBottom: "10px",
          borderTop: "1px solid #111620",
        }}
      />
      
      <div style={row}>
        <span>Tailscale</span>
        <b style={status.tailscale_running ? ok : bad}>
          {status.tailscale_running ? "ON" : "OFF"}
        </b>
      </div>
      

      <div style={row}>
        <span>Configured</span>
        <b style={tailscaleStatus?.configured ? ok : bad}>
          {tailscaleStatus?.configured ? "Yes" : "No"}
        </b>
      </div>

      <div style={row}>
        <span>Service Running</span>
        <b style={tailscaleStatus?.service_running ? ok : bad}>
          {tailscaleStatus?.service_running ? "Yes" : "No"}
        </b>
      </div>

      <div style={row}>
        <span>IPN Running</span>
        <b style={tailscaleStatus?.ipn_running ? ok : bad}>
          {tailscaleStatus?.ipn_running ? "Yes" : "No"}
        </b>
      </div>

      <div style={row}>
        <span>Backend Running</span>
        <b style={tailscaleStatus?.backend_state ? ok : bad}>
          {tailscaleStatus?.backend_state ? "Yes" : "No"}
        </b>
      </div>

      <div style={row}>
        <span>Authenticated</span>
        <b style={tailscaleStatus?.user_authenticated ? ok : bad}>
          {tailscaleStatus?.user_authenticated ? "Yes" : "No"}
        </b>
      </div>

      <div style={row}>
        <span>Recovery</span>
        <b style={tailscaleStatus?.ipn_recovery_enabled ? ok : bad}>
          {tailscaleStatus?.ipn_recovery_enabled ? "Enabled" : "Disabled"}
        </b>
      </div>
        

      <div
        style={{
          marginTop: "10px",
          marginBottom: "10px",
          borderTop: "1px solid #111620",
        }}
      />

      <div style={row}>
        <span>GPU</span>
        <b style={status.gpu_available ? ok : bad}>
          {status.gpu_available ? "READY" : "NO"}
        </b>
      </div>

      {metrics && (
        <>
          <div style={row}>
            <span>CPU</span>
            <b>{metrics.cpu_name}</b>
          </div>

          {metrics.integrated_gpu && (
            <div style={row}>
              <span>Integrated GPU</span>
              <b>{metrics.integrated_gpu}</b>
            </div>
          )}

          {metrics.dedicated_gpu && (
            <div style={row}>
              <span>Dedicated GPU</span>
              <b>{metrics.dedicated_gpu}</b>
            </div>
          )}

          <div style={row}>
            <span>GPU Class</span>
            <b>{metrics.gpu_class}</b>
          </div>

          <div style={row}>
            <span>GPU Vendor</span>
            <b>{metrics.gpu_vendor}</b>
          </div>

          <div style={row}>
            <span>Disk</span>
            <b>{metrics.disk_name}</b>
          </div>

          <div style={row}>
            <span>CPU Cores</span>
            <b>{metrics.cpu_cores}</b>
          </div>
          
          <div style={row}>
            <span>CPU</span>
            <b>{metrics.cpu_percent}%</b>
          </div>

          <div style={row}>
            <span>RAM</span>
            <b>{metrics.ram_percent}%</b>
          </div>

          <div style={row}>
            <span>GPU Load</span>
            <b>
              {metrics.gpu_percent == null
                ? "N/A"
                : `${metrics.gpu_percent}%`}
            </b>
          </div>

          <div style={row}>
            <span>GPU Temp</span>
            <b>
              {metrics.gpu_temp == null
                ? "N/A"
                : `${metrics.gpu_temp}°C`}
            </b>
          </div>

          <div style={row}>
            <span>VRAM</span>
            <b>
              {metrics.gpu_memory_percent == null
                ? "N/A"
                : `${metrics.gpu_memory_percent}%`}
            </b>
          </div>
        </>
      )}

      <div
        style={{
          marginTop: "10px",
          marginBottom: "10px",
          borderTop: "1px solid #111620",
        }}
      />

      <div style={row}>
        <span>Disk Free</span>
        <b>{status.disk_free_gb} GB</b>
      </div>
    </div>
  );
}

const box = {
  marginTop: "14px",
  padding: "12px",
  border: "1px solid #1c2130",
  borderRadius: "8px",
  background: "#05070b",
  color: "#e2e8f0",
};

const title = {
  fontSize: "10px",
  color: "#475569",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  fontFamily: "'JetBrains Mono', monospace",
  marginBottom: "10px",
};

const row = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "12px",
  marginTop: "7px",
};

const ok = {
  color: "#10d98a",
};

const warning = {
  color: "#facc15",
};

const bad = {
  color: "#f43f5e",
};

const info = {
  color: "#60a5fa",
};

const neutral = {
  color: "#94a3b8",
};

const headerRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
};

const updatingDot = {
  fontSize: "8px",
  color: "#2d3748",
  fontFamily: "'JetBrains Mono', monospace",
  textTransform: "uppercase",
};

const smallError = {
  marginTop: "8px",
  fontSize: "9px",
  color: "#64748b",
  fontFamily: "'JetBrains Mono', monospace",
  lineHeight: 1.4,
};

const buttonRow = {
  display: "flex",
  gap: "8px",
  marginTop: "10px",
  marginBottom: "10px",
};

const actionButton = {
  background: "#111827",
  color: "#e2e8f0",
  border: "1px solid #1f2937",
  borderRadius: "6px",
  padding: "6px 10px",
  cursor: "pointer",
};

const disabledButton = {
  ...actionButton,
  opacity: 0.6,
  cursor: "not-allowed",
};

const reasonText = {
  fontSize: "10px",
  color: "#64748b",
  marginTop: "2px",
};

const issueBox = {
  marginTop: "8px",
  fontSize: "10px",
  color: "#facc15",
  lineHeight: 1.5,
};

const enableButton = {
  ...actionButton,
  background: "#14532d",
};

const disableButton = {
  ...actionButton,
  background: "#7f1d1d",
};