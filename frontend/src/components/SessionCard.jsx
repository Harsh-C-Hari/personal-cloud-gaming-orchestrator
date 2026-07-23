/**
 * components/SessionCard.jsx
 *
 * Renders a single enriched session entry.
 * Receives the full session object (from useSessions) and an onRefresh
 * callback to trigger an immediate re-fetch after a stop action.
 *
 * Stop flow:
 *   POST /sessions/:id/stop → sets status = "stopped" in registry (no WS)
 *   → calls onRefresh so useSessions re-fetches within 600 ms
 *   → polling loop will reflect "stopped" within 5 s worst case
 */

import { useEffect, useState } from "react";
import {
    stopSession,
    restartSession,
} from "../api/client.js";
import { LiveCountdown } from "./LiveCountdown.jsx";
import { StatusBadge } from "./StatusBadge.jsx";

/** Convert snake_case game_id → "Title Case" for display */
function formatGameLabel(gameId = "") {
  return gameId
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatPlayedTime(seconds) {
  if (seconds == null) {
    return "--";
  }

  const totalSeconds = Math.max(
    0,
    Math.floor(seconds)
  );

  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  return `${mins}m ${secs}s`;
}

const ACTIVE_STATUSES = new Set(["starting", "running", "stopping", "cleaning"]);
/**
 * @param {{
 *   session   : object   enriched session from useSessions
 *   onRefresh : () => void
 * }} props
 */
export function SessionCard({ session, onRefresh }) {
  const [stopping, setStopping] = useState(false);
  const [stopError, setStopError] = useState(null);

  const isActive = ACTIVE_STATUSES.has(session.status);

  const [nowSeconds, setNowSeconds] = useState(
    Date.now() / 1000
  );

  const [
      restarting,
      setRestarting,
  ] = useState(false);

  const [
      restartError,
      setRestartError,
  ] = useState(null);

  const restartButtonText =
      session.restart_in_progress
          ? "RESTARTING..."
          : session.restart_cooldown_remaining > 0
              ? `WAIT ${session.restart_cooldown_remaining}s`
              : restarting
                  ? "RESTARTING..."
                  : "RESTART GAME"

  async function handleStop() {
    if (!isActive || stopping) return;
    setStopping(true);
    setStopError(null);
    try {
      await stopSession(session.session_id);
      // No WS broadcast for "stopped" — trigger an early re-fetch
      setTimeout(onRefresh, 400);
    } catch (err) {
      setStopError(err.message);
    } finally {
      setStopping(false);
    }
  }

  async function handleRestart() {

      if (
          !isActive ||
          restarting
      ) {
          return;
      }

      setRestarting(true);

      setRestartError(null);

      try {

          await restartSession(
              session.session_id
          );

          setTimeout(
              onRefresh,
              500,
          );

      } catch (err) {

          setRestartError(
              err.message
          );

      } finally {

          setRestarting(false);

      }
  }

  useEffect(() => {
    if (
      !["starting", "running", "stopping"].includes(session.status)
    ) {
      return;
    }

    const id = setInterval(() => {
      setNowSeconds(Date.now() / 1000);
    }, 1000);

    return () => clearInterval(id);
  }, [session.status]);

  const livePlayedSeconds =
    session.started_at && ["starting", "running", "stopping"].includes(session.status)
      ? nowSeconds - session.started_at
      : session.played_seconds;

  return (
    <div
      style={{
        background:    "#0f1117",
        border:        `1px solid ${isActive ? "rgba(16,217,138,0.2)" : "#1c2130"}`,
        borderRadius:  "8px",
        padding:       "18px 20px 16px",
        display:       "flex",
        flexDirection: "column",
        gap:           "14px",
        position:      "relative",
        overflow:      "hidden",
        boxShadow:     isActive ? "0 0 32px rgba(16,217,138,0.06)" : "none",
        transition:    "border-color 0.4s, box-shadow 0.4s",
        animation:     "card-in 0.25s ease forwards",
      }}
    >
      {/* Active glow strip */}
      {isActive && (
        <div
          style={{
            position:  "absolute",
            top:       0, left: 0, right: 0,
            height:    "2px",
            background:"linear-gradient(90deg, transparent, rgba(16,217,138,0.6), transparent)",
          }}
        />
      )}

      {/* Row 1 — Game name + status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#e2e8f0", marginBottom: "3px" }}>
            {formatGameLabel(session.game_id)}
          </div>
          <div style={{ fontSize: "11px", color: "#475569", fontFamily: "'JetBrains Mono', monospace" }}>
            {session.user_id}
          </div>
        </div>
        <StatusBadge
          status={
              session.restart_in_progress
                  ? "restarting"
                  : session.status
          }
        />
      </div>

      {/* Row 2 — Countdown block */}
      <div
        style={{
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "flex-end",
          padding:        "12px 14px",
          background:     "#080a0f",
          borderRadius:   "5px",
          border:         "1px solid #1c2130",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span
            style={{
              fontSize:      "9px",
              color:         "#2d3748",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontFamily:    "'JetBrains Mono', monospace",
            }}
          >
            {session.skip_timer ? "NO TIMER" : "REMAINING"}
          </span>

          <LiveCountdown
            remainingMinutes={
              session.remaining_minutes
            }

            fetchedAt={
              session.fetchedAt ??
              Date.now()
            }

            skipTimer={
              session.skip_timer
            }

            status={
              session.status
            }
          />

          {livePlayedSeconds != null && (
            <div
              style={{
                marginTop: "6px",
                fontSize: "10px",
                color: "#94a3b8",
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: "0.08em",
              }}
            >
              PLAYED: {formatPlayedTime(livePlayedSeconds)}
            </div>
          )}

          {session.status === "failed" && session.error && (
            <span
              style={{
                fontSize: "9px",
                color: "#f43f5e",
                letterSpacing: "0.08em",
                fontFamily: "'JetBrains Mono', monospace",
                marginTop: "2px",
              }}
            >
              {session.error}
            </span>
          )}

          {session.warning_sent && (
            <span
              style={{
                fontSize:      "9px",
                color:         "#f59e0b",
                letterSpacing: "0.1em",
                fontFamily:    "'JetBrains Mono', monospace",
                marginTop:     "2px",
              }}
            >
              ⚠ WARNING SENT
            </span>
          )}
        </div>

        {/* Session ID */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "9px", color: "#2d3748", letterSpacing: "0.12em", fontFamily: "'JetBrains Mono', monospace", marginBottom: "5px" }}>
            SESSION ID
          </div>
          <code style={{ fontSize: "11px", color: "#374151", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em" }}>
            {session.session_id}
          </code>
        </div>
      </div>

      {/* Row 3 — Stop / Cleanup status */}
      {!["completed", "failed", "stopped"].includes(session.status) && (
        <div>
          {stopError && (
            <div style={{ marginBottom: "8px", fontSize: "11px", color: "#f43f5e", fontFamily: "'JetBrains Mono', monospace" }}>
              ✕ {stopError}
            </div>
          )}

          {
              restartError && (
                  <div
                      style={{
                          marginBottom:
                              "8px",
                          fontSize:
                              "11px",
                          color:
                              "#f59e0b",
                          fontFamily:
                              "'JetBrains Mono', monospace",
                      }}
                  >
                      ⚠ {restartError}
                  </div>
              )
          }

          {session.status === "cleaning" ? (
            <div style={{ fontSize: "10px", color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace", textAlign: "center", letterSpacing: "0.13em" }}>
              CLEANING SAVES…
            </div>
          ) : (
            <div
                style={{
                    display: "flex",
                    gap: "10px",
                }}
            >

                <button
                    onClick={handleRestart}

                    disabled={
                        restarting ||
                        stopping ||
                        session.status === "stopping" ||
                        session.status === "cleaning" ||
                        session.restart_in_progress ||
                        session.status !== "running" ||
                        session.restart_cooldown_remaining > 0
                    }

                    style={{
                        flex: 1,
                        padding: "9px",

                        background:
                            session.status === "running"
                                ? "rgba(245,158,11,0.07)"
                                : "transparent",

                        border:
                            `1px solid ${
                                session.status === "running"
                                    ? "rgba(245,158,11,0.35)"
                                    : "#1c2130"
                            }`,

                        borderRadius: "5px",

                        color:
                            session.status === "running"
                                ? "#f59e0b"
                                : "#64748b",

                        fontSize: "10px",

                        fontFamily:
                            "'JetBrains Mono', monospace",

                        fontWeight: 700,

                        letterSpacing: "0.13em",

                        textTransform: "uppercase",

                        cursor:
                            session.status === "running" &&
                            !restarting &&
                            !stopping
                                ? "pointer"
                                : "not-allowed",

                        transition:
                            "background 0.2s",

                        textShadow:
                            session.status === "running"
                                ? "0 0 10px rgba(245,158,11,0.35)"
                                : "none",
                    }}

                    onMouseEnter={(e) => {

                        if (
                            session.status === "running" &&
                            !restarting &&
                            !stopping
                        ) {
                            e.currentTarget.style.background =
                                "rgba(245,158,11,0.1)";
                        }
                    }}

                    onMouseLeave={(e) => {

                        e.currentTarget.style.background =
                            session.status === "running"
                                ? "rgba(245,158,11,0.07)"
                                : "transparent";
                    }}
                >
                  {restartButtonText}
                </button>


                <button
                    onClick={handleStop}

                    disabled={
                        stopping ||
                        restarting ||
                        session.status === "stopping" ||
                        session.status === "cleaning"
                    }

                    style={{
                        flex: 1,

                        padding: "9px",

                        background:
                            session.status === "running"
                                ? "rgba(244,63,94,0.07)"
                                : "transparent",

                        border:
                            `1px solid ${
                                session.status === "running"
                                    ? "rgba(244,63,94,0.35)"
                                    : "#1c2130"
                            }`,

                        borderRadius: "5px",

                        color:
                            session.status === "running"
                                ? "#f43f5e"
                                : "#64748b",

                        fontSize: "10px",

                        fontFamily:
                            "'JetBrains Mono', monospace",

                        fontWeight: 700,

                        letterSpacing: "0.13em",

                        textTransform: "uppercase",

                        cursor:
                            session.status === "running" &&
                            !stopping &&
                            !restarting
                                ? "pointer"
                                : "not-allowed",

                        transition:
                            "background 0.2s",

                        textShadow:
                            session.status === "running"
                                ? "0 0 10px rgba(244,63,94,0.35)"
                                : "none",
                    }}

                    onMouseEnter={(e) => {

                        if (
                            session.status === "running" &&
                            !stopping &&
                            !restarting
                        ) {
                            e.currentTarget.style.background =
                                "rgba(244,60,60,0.1)";
                        }
                    }}

                    onMouseLeave={(e) => {

                        e.currentTarget.style.background =
                            session.status === "running"
                                ? "rgba(244,63,94,0.07)"
                                : "transparent";
                    }}
                >
                    {
                        stopping ||
                        session.status === "stopping"
                            ? "STOPPING..."
                            : "STOP SESSION"
                    }
                </button>

            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes card-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
}
