/**
 * pages/Dashboard.jsx
 *
 * The single page of the orchestration dashboard.
 * Owns WS event log state, wires hooks to components.
 */

import { useCallback, useEffect, useState } from "react";
import { useDashboardData } from "../hooks/useDashboardData.js";
import {
  fetchSessionEvents,
  forceUnlockSession,
  startSunshine,
  restartSunshine,
  enableMaintenance,
  disableMaintenance,
  revalidateHost,
} from "../api/client.js";
import { HostStatusPanel } from "../components/HostStatusPanel.jsx";
import { EventLog } from "../components/EventLog.jsx";
import { SessionCard } from "../components/SessionCard.jsx";
import { StartSessionForm } from "../components/StartSessionForm.jsx";
import { useSessions } from "../hooks/useSessions.js";
import { useWebSocket } from "../hooks/useWebSocket.js";
import { SessionHistory } from "../components/SessionHistory.jsx";
import { SessionAnalytics } from "../components/SessionAnalytics.jsx";
import { GameManager } from "../components/GameManager.jsx";
import { SettingsPanel } from "../components/SettingsPanel.jsx";
import { LogPanel } from "../components/LogPanel.jsx";
const MAX_LOG_EVENTS = 8;
const WS_EVENTS_STORAGE_KEY = "pcgo_ws_events";

function SectionHeader({ title, count, onRefresh }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{
          fontSize: "9.5px",
          color: "#475569",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {title}
        </span>

        {count != null && (
          <span style={{
            fontSize: "9px",
            color: "#2d3748",
            fontFamily: "'JetBrains Mono', monospace",
            padding: "1px 7px",
            border: "1px solid #1c2130",
            borderRadius: "10px",
          }}>
            {count}
          </span>
        )}
      </div>

      {onRefresh && (
        <button
          onClick={onRefresh}
          style={{
            background: "transparent",
            border: "1px solid #1c2130",
            borderRadius: "4px",
            color: "#2d3748",
            fontSize: "9px",
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.1em",
            padding: "3px 10px",
            cursor: "pointer",
            textTransform: "uppercase",
            transition: "color 0.2s, border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#475569";
            e.currentTarget.style.borderColor = "#2d3748";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#2d3748";
            e.currentTarget.style.borderColor = "#1c2130";
          }}
        >
          ↻ REFRESH
        </button>
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        fontSize: "11px",
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "52px 32px",
      border: "1px dashed #1c2130",
      borderRadius: "8px",
      gap: "12px",
    }}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <polygon points="18,3 33,12 33,24 18,33 3,24 3,12" stroke="#1e2a3a" strokeWidth="1.5" fill="none" />
        <polygon points="18,9 27,13.5 27,22.5 18,27 9,22.5 9,13.5" stroke="#1e2a3a" strokeWidth="1" fill="none" />
      </svg>

      <span style={{
        fontSize: "10px",
        color: "#2d3748",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {label}
      </span>
    </div>
  );
}

function buildAlerts(
  hostStatus,
  hostMetrics,
) {

  const alerts = [];

  if (!hostStatus) {
    return alerts;
  }

  if (
    !hostStatus.sunshine_running
  ) {
    alerts.push(
      "Sunshine Offline"
    );
  }

  if (
    !hostStatus.tailscale_running
  ) {
    alerts.push(
      "Tailscale Offline"
    );
  }

  if (
    hostStatus.maintenance_mode
  ) {
    alerts.push(
      "Maintenance Mode Enabled"
    );
  }

  if (
    hostStatus.recovery_required
  ) {
    alerts.push(
      `Recovery Mode: ${
        hostStatus.recovery_reason ||
        "Unknown"
      }`
    );
  }

  if (
    hostMetrics?.health ===
    "warning"
  ) {
    alerts.push(
      "Host Health Warning"
    );
  }

  if (
    hostMetrics?.health ===
    "critical"
  ) {
    alerts.push(
      "Host Health Critical"
    );
  }
  return alerts;
}

export function Dashboard() {
  const [wsEvents, setWsEvents] = useState(() => {
    try {
      const raw = localStorage.getItem(WS_EVENTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [sunshineAction, setSunshineAction] = useState(null);
  const [maintenanceAction, setMaintenanceAction ] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [revalidating, setRevalidating] = useState(false);
  const [showAllRecoveryEvents, setShowAllRecoveryEvents] = useState(false);
  const [showTailscaleRecoveryDetails, setShowTailscaleRecoveryDetails] = useState(false);
  const [showTailscaleFailureDetails, setShowTailscaleFailureDetails] = useState(false);
  const [showGameManager, setShowGameManager] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const {
      hostStatus,
      hostMetrics,
      tailscaleStatus,

      hostLoading,
      hostError,

      sessionHealth,

      recoveryEvents,
      recoveryStats,

      games,

      lastUpdated,

      refreshHostData,
      loadGames,
      loadSessionHealth,
  } = useDashboardData();
  
  const loadSessionEvents = useCallback(async () => {
    try {
      const data = await fetchSessionEvents({
        limit: MAX_LOG_EVENTS,
      });

      setWsEvents(
        (data.events || []).map((event) => ({
          type: "session_status",
          session_id: event.session_id,
          user_id: event.user_id,
          game_id: event.game_id,
          status: event.status,
          message: event.message,
          ts: new Date(event.time * 1000).toLocaleTimeString(),
        }))
      );
    } catch {
      // Keep local/current events if backend event fetch fails
    }
  }, []);
    
  const handleWsEvent = useCallback((event) => {
    const ts = new Date().toLocaleTimeString();
    setWsEvents((prev) =>
      [
        {
          type: event.type || "session_status",
          session_id: event.session_id,
          user_id: event.user_id,
          game_id: event.game_id,
          status: event.status,
          message: event.message || event.status,
          ts,
        },
        ...prev,
      ].slice(0, MAX_LOG_EVENTS)
    );

    if (
      event.status === "completed" ||
      event.status === "failed"
    ) {
      setHistoryRefreshKey((v) => v + 1);
      loadSessionHealth();
      loadSessionEvents();
    }
  }, [loadSessionEvents]);

  const displayedRecoveryEvents =
    showAllRecoveryEvents
      ? recoveryEvents
      : recoveryEvents.slice(0, 3);
  
  const handleSunshineStart = async () => {
    try {
      setSunshineAction("starting");

      await startSunshine();

      await refreshHostData();
    } catch (error) {
      console.error(error);
    } finally {
      setSunshineAction(null);
    }
  };

  const handleSunshineRestart = async () => {
    try {
      setSunshineAction("restarting");

      await restartSunshine();

      await refreshHostData();
    } catch (error) {
      console.error(error);
    } finally {
      setSunshineAction(null);
    }
  };

  const handleMaintenanceToggle =
    async () => {

      if (maintenanceAction) {
        return;
      }

      try {

        setMaintenanceAction(true);

        const enabling =
          !hostStatus.maintenance_mode;

        if (enabling) {

          const result =
            await enableMaintenance();

          if (!result.success) {

            alert(
              "Cannot enable maintenance while sessions are active."
            );

            return;
          }

        } else {

          await disableMaintenance();
        }

      } catch (error) {

        console.error(error);

      } finally {
        
        setMaintenanceAction(false);
        refreshHostData();

      }
  };

  const {
    sessions,
    loading,
    refresh,
    applyWsEvent,
  } = useSessions({
    onWsEvent: handleWsEvent,
  });

  const { connected } = useWebSocket(applyWsEvent);

  const activeSessions = sessions.filter(
    (s) => s.status === "starting" || s.status === "running"
  );

  const finishedSessions = sessions.filter(
    (s) => s.status !== "starting" && s.status !== "running"
  );

  const activeAlerts =
    buildAlerts(
      hostStatus,
      hostMetrics,
    );

  useEffect(() => {
    localStorage.setItem(
      WS_EVENTS_STORAGE_KEY,
      JSON.stringify(wsEvents)
    );
  }, [wsEvents]);

  useEffect(() => {
    loadSessionEvents();
  }, [loadSessionEvents]);

  useEffect(() => {
    if (
      sunshineAction === "starting" &&
      hostStatus?.sunshine_running
    ) {
      setSunshineAction(null);
    }
  }, [
    sunshineAction,
    hostStatus,
  ]);

  async function handleForceUnlock() {

    if (unlocking) {
      return;
    }

    if (
      !window.confirm(
        "Force unlock session lock? Use only if stuck."
      )
    ) {
      return;
    }

    try {

      setUnlocking(true);

      const result =
        await forceUnlockSession();

      await refresh();
      await loadSessionHealth();

      alert(
        result.message ||
        (
          result.unlocked
            ? "Session lock forcefully released."
            : "Session lock was not released."
        )
      );

    } catch (err) {

      alert(
        err.message ||
        "Failed to force unlock session."
      );

    } finally {

      setUnlocking(false);

    }
  }

  async function handleRevalidate() {

    if (revalidating) {
      return;
    }

    try {

      setRevalidating(true);

      await revalidateHost();

      await refreshHostData();

    } catch (error) {

      alert(
        error.message
      );

    } finally {

      setRevalidating(false);

    }
  }
  
  async function handleDashboardRefresh() {

    await refresh();

    await refreshHostData();
  }
  
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      overflow: "hidden",
      background: "#060810",
    }}>
      <header style={{
        height: "52px",
        borderBottom: "1px solid #111620",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        flexShrink: 0,
        background: "#060810",
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1px" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: "3px",
                height: `${10 + i * 5}px`,
                background: "#38bdf8",
                borderRadius: "1px",
                opacity: 0.6 + i * 0.2,
                boxShadow: "0 0 6px rgba(56,189,248,0.5)",
              }} />
            ))}
          </div>

          <div>
            <span style={{
              fontSize: "14px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "#e2e8f0",
            }}>
              CLOUD GAMING{" "}
              <span style={{ color: "#38bdf8" }}>
                ORCHESTRATOR
              </span>
            </span>

            <span style={{
              marginLeft: "12px",
              fontSize: "9px",
              color: "#2d3748",
              letterSpacing: "0.1em",
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              HOST AGENT
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <span style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: connected ? "#10d98a" : "#f43f5e",
              boxShadow: connected
                ? "0 0 10px rgba(16,217,138,0.8)"
                : "0 0 10px rgba(244,63,94,0.8)",
            }} />

            <span style={{
              fontSize: "9px",
              color: "#475569",
              letterSpacing: "0.12em",
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: "uppercase",
            }}>
              WS {connected ? "Connected" : "Offline"}
            </span>
          </div>

          <div
            style={{
              fontSize: "9px",
              color: "#64748b",
              letterSpacing: "0.08em",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            LAST UPDATE{" "}
            {
              lastUpdated
                ? lastUpdated.toLocaleTimeString()
                : "--"
            }
          </div>
        </div>
      </header>

      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        overflow: "hidden",
      }}>
        <aside style={{
          borderRight: "1px solid #111620",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "24px 22px 20px",
            borderBottom: "1px solid #111620",
            overflowY: "auto",
            flex: 1,
            minHeight: 0,
          }}>
            <div style={{ marginBottom: "20px" }}>
              <button
                onClick={() =>
                    setShowSettings(
                      !showSettings
                    )
                }
                style={{
                  width: "100%",
                  border: "1px solid rgba(148,163,184,0.18)",
                  background: "rgba(2,6,23,0.45)",
                  color: "#94a3b8",
                  borderRadius: "6px",
                  padding: "8px",
                  fontSize: "9px",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  e.currentTarget.style.background =
                    "rgba(56, 191, 248, 0.08)"
                }

                onMouseLeave={(e) =>
                  e.currentTarget.style.background =
                    "rgba(56, 191, 248, 0)"
                }
              >
                {
                  showSettings
                    ? "HIDE SETTINGS"
                    : "SETTINGS"
                }
              </button>

              {
                showSettings && (
                    <div style={{ marginTop: "10px" }}>
                      <SettingsPanel />
                    </div>
                )
              }
            </div>
            
            <div style={{ marginBottom: "20px" }}>

              <button
                type="button"
                onClick={() =>
                  setShowGameManager(
                    !showGameManager
                  )
                }
                style={{
                  width: "100%",
                  border: "1px solid rgba(148,163,184,0.18)",
                  background: "rgba(2,6,23,0.45)",
                  color: "#94a3b8",
                  borderRadius: "6px",
                  padding: "8px",
                  fontSize: "9px",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.08em",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  e.currentTarget.style.background =
                    "rgba(56, 191, 248, 0.08)"
                }

                onMouseLeave={(e) =>
                  e.currentTarget.style.background =
                    "rgba(56, 191, 248, 0)"
                }
              >
                {
                  showGameManager
                    ? "HIDE GAME MANAGER"
                    : "MANAGE GAMES"
                }
              </button>

              {
                showGameManager && (
                  <div style={{ marginTop: "10px" }}>
                    <GameManager
                      games={games}
                      refreshGames={loadGames}
                    />
                  </div>
                )
              }

            </div>
            <div style={{
              fontSize: "9.5px",
              color: "#475569",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: "20px",
            }}>
              New Session
            </div>

            <StartSessionForm
              games={games}
              onLaunched={refresh}
              activeSessions={sessions}
              hostStatus={hostStatus}
            />

            <HostStatusPanel
              status={hostStatus}
              metrics={hostMetrics}
              loading={hostLoading}
              error={hostError}
              sunshineAction={sunshineAction}
              onStartSunshine={handleSunshineStart}
              onRestartSunshine={handleSunshineRestart}
              handleMaintenanceToggle={handleMaintenanceToggle}
              maintenanceAction={maintenanceAction}
              sessionHealth={sessionHealth}
              handleRevalidate={handleRevalidate}
              revalidating={revalidating}
              tailscaleStatus={tailscaleStatus}
            />

            {sessionHealth && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "10px",
                  borderRadius: "8px",
                  background: "rgba(2,6,23,0.45)",
                  border: "1px solid rgba(148,163,184,0.12)",
                  fontSize: "10px",
                  color: "#94a3b8",
                  fontFamily: "'JetBrains Mono', monospace",
                  display: "grid",
                  gap: "4px",
                }}
              >
                <div>ACTIVE: {sessionHealth.active_sessions}</div>
                <div>LOCK: {sessionHealth.lock_exists ? "YES" : "NO"}</div>
                <div>HISTORY: {sessionHealth.history_count}</div>
                <div>EVENTS: {sessionHealth.event_count}</div>
              </div>
            )}

            {/* DEV ONLY: emergency stale-lock recovery */}
            {
              sessionHealth?.lock_exists && 
              hostStatus?.active_session_count === 0 &&
              (
                <button
                  type="button"
                  disabled={unlocking}
                  onClick={handleForceUnlock}
                  style={{
                    marginTop: "10px",
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: "6px",
                    border: "1px solid rgba(244,63,94,0.35)",
                    background: "rgba(244,63,94,0.08)",
                    color: "#fb7185",
                    fontSize: "9px",
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.08em",
                    cursor: "pointer",
                  }}
                >
                  {
                    unlocking
                      ? "Unlocking..."
                      : "Force Unlock"
                  }
                </button>
              )
            }
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            borderBottom: "1px solid #111620",
            flexShrink: 0,
          }}>
            {[
              { label: "Active", val: activeSessions.length, color: "#10d98a" },
              { label: "Total", val: sessions.length, color: "#38bdf8" },
              {
                label: "WS",
                val: connected ? "ON" : "OFF",
                color: connected ? "#10d98a" : "#f43f5e",
              },
            ].map((s, i) => (
              <div key={i} style={{
                padding: "14px 10px",
                borderRight: i < 2 ? "1px solid #111620" : "none",
                textAlign: "center",
              }}>
                <div style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: s.color,
                  fontFamily: "'JetBrains Mono', monospace",
                  textShadow: `0 0 14px ${s.color}55`,
                  lineHeight: 1,
                }}>
                  {s.val}
                </div>

                <div style={{
                  fontSize: "8.5px",
                  color: "#2d3748",
                  letterSpacing: "0.12em",
                  marginTop: "4px",
                  textTransform: "uppercase",
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            height: "82px",
            overflow: "hidden",
            padding: "10px 22px",
            borderTop: "1px solid #111620",
            flexShrink: 0,
          }}>
            <EventLog
              events={wsEvents}
              connected={connected}
            />
          </div>
        </aside>

        <main style={{
          overflowY: "auto",
          padding: "28px 32px",
          display: "flex",
          flexDirection: "column",
          gap: "36px",
        }}>
          {activeAlerts.length > 0 && (
            <section
              style={{
                padding: "12px",
                borderRadius: "10px",
                background:
                  "rgba(127,29,29,0.15)",
                border:
                  "1px solid rgba(239,68,68,0.25)",
              }}
            >
              <div
                style={{
                  marginBottom: "10px",
                  color: "#f87171",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  fontFamily:
                    "'JetBrains Mono', monospace",
                }}
              >
                ACTIVE ALERTS
              </div>

              <div
                style={{
                  display: "grid",
                  gap: "6px",
                }}
              >
                {activeAlerts.map(
                  (alert) => (
                    <div
                      key={alert}
                      style={{
                        color: "#fca5a5",
                        fontSize: "11px",
                        fontFamily:
                          "'JetBrains Mono', monospace",
                      }}
                    >
                      ⚠ {alert}
                    </div>
                  )
                )}
              </div>
            </section>
          )}

          <section>
            <SectionHeader
              title="Active Sessions"
              count={activeSessions.length}
              onRefresh={handleDashboardRefresh}
            />

            {loading ? (
              <div style={{
                fontSize: "11px",
                color: "#2d3748",
                fontFamily: "'JetBrains Mono', monospace",
                padding: "20px 0",
              }}>
                Connecting to host agent…
              </div>
            ) : activeSessions.length === 0 ? (
              <EmptyState label="No active sessions" />
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "12px",
              }}>
                {activeSessions.map((s) => (
                  <SessionCard
                    key={s.session_id}
                    session={s}
                    onRefresh={refresh}
                  />
                ))}
              </div>
            )}
          </section>

          {finishedSessions.length > 0 && (
            <section>
              <SectionHeader
                title="Recent Sessions"
                count={finishedSessions.length}
              />

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "12px",
              }}>
                {finishedSessions.map((s) => (
                  <SessionCard
                    key={s.session_id}
                    session={s}
                    onRefresh={refresh}
                  />
                ))}
              </div>
            </section>
          )}

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
              RECOVERY SYSTEM
            </h2>

            {!recoveryStats 
              ? <span style={{ color:'white' , fontSize: '14px' , fontWeight: 'bold' }}>Loading Recovery Statistics...</span>
              : (
            
              <div>
                <div
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    background: "rgba(2,6,23,0.45)",
                    border: "1px solid rgba(148,163,184,0.12)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#94a3b8",
                      letterSpacing: "0.08em",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    SUNSHINE RECOVERIES
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#22c55e",
                    }}
                  >
                    {recoveryStats?.sunshine_restarts ?? 0}
                  </div>
                </div>

                <div
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    background: "rgba(2,6,23,0.45)",
                    border: "1px solid rgba(148,163,184,0.12)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#94a3b8",
                      letterSpacing: "0.08em",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    SUNSHINE FAILURES
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#22c55e",
                    }}
                  >
                    {recoveryStats?.sunshine_failures ?? 0}
                  </div>
                </div>

                <div
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    background: "rgba(2,6,23,0.45)",
                    border: "1px solid rgba(148,163,184,0.12)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#94a3b8",
                      letterSpacing: "0.08em",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    TAILSCALE RECOVERIES
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#22c55e",
                    }}
                  >
                    {recoveryStats?.tailscale_recoveries ?? 0}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setShowTailscaleRecoveryDetails(
                        !showTailscaleRecoveryDetails
                      )
                    }
                    style={{
                      width: "100%",
                      marginTop: "8px",
                      border: "1px solid rgba(148,163,184,0.18)",
                      background: "rgba(2,6,23,0.45)",
                      color: "#94a3b8",
                      borderRadius: "6px",
                      padding: "6px",
                      fontSize: "9px",
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: "0.08em",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      e.currentTarget.style.background =
                        "rgba(56, 191, 248, 0.08)"
                    }

                    onMouseLeave={(e) =>
                      e.currentTarget.style.background =
                        "rgba(56, 191, 248, 0)"
                    }
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
                      <div
                        style={{
                          padding: "10px",
                          borderRadius: "8px",
                          background: "rgba(2,6,23,0.45)",
                          border: "1px solid rgba(148,163,184,0.12)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#94a3b8",
                            letterSpacing: "0.08em",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          SERVICE RECOVERIES
                        </div>

                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "20px",
                            fontWeight: 700,
                            color: "#22c55e",
                          }}
                        >
                          {recoveryStats?.tailscale_service_recoveries ?? 0}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "10px",
                          borderRadius: "8px",
                          background: "rgba(2,6,23,0.45)",
                          border: "1px solid rgba(148,163,184,0.12)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#94a3b8",
                            letterSpacing: "0.08em",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          IPN RECOVERIES
                        </div>

                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "20px",
                            fontWeight: 700,
                            color: "#22c55e",
                          }}
                        >
                          {recoveryStats?.tailscale_ipn_recoveries ?? 0}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "10px",
                          borderRadius: "8px",
                          background: "rgba(2,6,23,0.45)",
                          border: "1px solid rgba(148,163,184,0.12)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#94a3b8",
                            letterSpacing: "0.08em",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          UP RECOVERIES
                        </div>

                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "20px",
                            fontWeight: 700,
                            color: "#22c55e",
                          }}
                        >
                          {recoveryStats?.tailscale_up_recoveries ?? 0}
                        </div>
                      </div>
                    </section>
                  )
                }

                <div
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    background: "rgba(2,6,23,0.45)",
                    border: "1px solid rgba(148,163,184,0.12)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#94a3b8",
                      letterSpacing: "0.08em",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    TAILSCALE FAILURES
                  </div>

                  <div
                    style={{
                      marginTop: "4px",
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "#22c55e",
                    }}
                  >
                    {recoveryStats?.tailscale_failures ?? 0}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setShowTailscaleFailureDetails(
                        !showTailscaleFailureDetails
                      )
                    }
                    style={{
                      width: "100%",
                      marginTop: "8px",
                      border: "1px solid rgba(148,163,184,0.18)",
                      background: "rgba(2,6,23,0.45)",
                      color: "#94a3b8",
                      borderRadius: "6px",
                      padding: "6px",
                      fontSize: "9px",
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: "0.08em",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) =>
                      e.currentTarget.style.background =
                        "rgba(56, 191, 248, 0.08)"
                    }

                    onMouseLeave={(e) =>
                      e.currentTarget.style.background =
                        "rgba(56, 191, 248, 0)"
                    }
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
                      <div
                        style={{
                          padding: "10px",
                          borderRadius: "8px",
                          background: "rgba(2,6,23,0.45)",
                          border: "1px solid rgba(148,163,184,0.12)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#94a3b8",
                            letterSpacing: "0.08em",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          NOSTATE EVENTS
                        </div>

                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "20px",
                            fontWeight: 700,
                            color: "#22c55e",
                          }}
                        >
                          {recoveryStats?.tailscale_nostate ?? 0}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "10px",
                          borderRadius: "8px",
                          background: "rgba(2,6,23,0.45)",
                          border: "1px solid rgba(148,163,184,0.12)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#94a3b8",
                            letterSpacing: "0.08em",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          STOPPED EVENTS
                        </div>

                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "20px",
                            fontWeight: 700,
                            color: "#22c55e",
                          }}
                        >
                          {recoveryStats?.tailscale_stopped ?? 0}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "10px",
                          borderRadius: "8px",
                          background: "rgba(2,6,23,0.45)",
                          border: "1px solid rgba(148,163,184,0.12)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#94a3b8",
                            letterSpacing: "0.08em",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          SERVICE STOPPED
                        </div>

                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "20px",
                            fontWeight: 700,
                            color: "#22c55e",
                          }}
                        >
                          {recoveryStats?.tailscale_service_stopped ?? 0}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: "10px",
                          borderRadius: "8px",
                          background: "rgba(2,6,23,0.45)",
                          border: "1px solid rgba(148,163,184,0.12)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#94a3b8",
                            letterSpacing: "0.08em",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          IPN MISSING
                        </div>

                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "20px",
                            fontWeight: 700,
                            color: "#22c55e",
                          }}
                        >
                          {recoveryStats?.tailscale_ipn_missing ?? 0}
                        </div>
                      </div>
                    </section>
                  )
                }

              </div>
            )}
          </section>
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

            {!recoveryStats 
              ? <span style={{ color:'white' , fontSize: '14px' , fontWeight: 'bold' }}>Loading Recovery Events...</span>
              : (
              <div>
                {displayedRecoveryEvents
                  .map((event) => {

                    const badgeColor =
                      event.event === "restart_success"
                        ? "#22c55e"
                        : event.event === "restart_failed"
                        ? "#ef4444"
                        : event.event === "restart_attempt"
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
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {event.service.toUpperCase()}
                          </div>

                          <div
                            style={{
                              color: "#e2e8f0",
                              fontSize: "11px",
                              fontWeight: 700,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {event.event.replaceAll("_", " ")}
                            {event.details?.failure_mode != null &&
                              event.event == "failure_detected" && (
                              <div
                                style={{
                                  color: "#64748b",
                                  fontSize: "9px",
                                  marginTop: "2px",
                                  fontFamily: "'JetBrains Mono', monospace",
                                }}
                              >
                                Mode: {event.details.failure_mode}
                              </div>
                            )}
                            {event.details?.state != null && 
                              event.event == "initial_state" && (
                              <div
                                style={{
                                  color: "#64748b",
                                  fontSize: "9px",
                                  marginTop: "2px",
                                  fontFamily: "'JetBrains Mono', monospace",
                                }}
                              >
                                State: {event.details.state}
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              color: "#64748b",
                              fontSize: "9px",
                              marginTop: "3px",
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {new Date(
                              event.time * 1000
                            ).toLocaleString()}
                          </div>

                          {event.details?.attempt != null && 
                            event.details?.attempt != 0 && (
                            <div
                              style={{
                                color: "#64748b",
                                fontSize: "9px",
                                marginTop: "2px",
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              Attempt: {event.details.attempt}
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            padding: "3px 8px",
                            borderRadius: "999px",
                            background: `${badgeColor}22`,
                            border: `1px solid ${badgeColor}55`,
                            color: badgeColor,
                            fontSize: "9px",
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            fontFamily: "'JetBrains Mono', monospace",
                            textTransform: "uppercase",
                          }}
                        >
                          {event.event
                            .replaceAll("_", " ")}
                        </div>
                      </div>
                    );
                  })}
                  {recoveryEvents.length > 3 && (
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
                        border: "1px solid rgba(148,163,184,0.18)",
                        background: "rgba(2,6,23,0.45)",
                        color: "#94a3b8",
                        borderRadius: "6px",
                        padding: "6px",
                        fontSize: "9px",
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: "0.08em",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) =>
                        e.currentTarget.style.background =
                          "rgba(56, 191, 248, 0.08)"
                      }

                      onMouseLeave={(e) =>
                        e.currentTarget.style.background =
                          "rgba(56, 191, 248, 0)"
                      }
                    >
                      {
                        showAllRecoveryEvents
                          ? "SHOW LESS"
                          : `SHOW ALL (${recoveryEvents.length})`
                      }
                    </button>
                  )}
              </div>
            )}

          </section>
          <SessionAnalytics refreshKey={historyRefreshKey} />
          <SessionHistory refreshKey={historyRefreshKey} />
          <LogPanel />
        </main>
      </div>
    </div>
  );
}