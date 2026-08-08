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
import { Card, Button } from "./ui/primitives.jsx";
import { colors, fonts, radius } from "../dashboard/theme.js";

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

const microLabel = {
  fontSize: "9.5px",
  color: colors.inkFaint,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
  fontFamily: fonts.mono,
  fontWeight: 700,
};

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

  const restartDisabled =
      restarting ||
      stopping ||
      session.status === "stopping" ||
      session.status === "cleaning" ||
      session.restart_in_progress ||
      session.status !== "running" ||
      session.restart_cooldown_remaining > 0;

  const restartActive = session.status === "running" && !restartDisabled;

  const stopDisabled =
      stopping ||
      restarting ||
      session.status === "stopping" ||
      session.status === "cleaning";

  return (
    <Card
      style={{
        padding: "18px 20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        border: `1.5px solid ${isActive ? colors.accentGreen : colors.border}`,
        transition: "border-color 150ms ease",
        animation: "card-in 180ms ease forwards",
      }}
    >
      {/* Row 1 — Game name + status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
        <div>
          <div style={{ fontFamily: fonts.display, fontSize: "15px", fontWeight: 700, color: colors.ink, marginBottom: "3px" }}>
            {formatGameLabel(session.game_id)}
          </div>
          <div style={{ fontSize: "11px", color: colors.inkFaint, fontFamily: fonts.mono }}>
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
          background:     colors.bgInset,
          borderRadius:   `${radius.md}px`,
          border:         `1.5px solid ${colors.border}`,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={microLabel}>
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
                color: colors.inkDim,
                fontFamily: fonts.mono,
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
                color: colors.danger,
                letterSpacing: "0.08em",
                fontFamily: fonts.mono,
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
                color:         colors.warning,
                letterSpacing: "0.1em",
                fontFamily:    fonts.mono,
                marginTop:     "2px",
              }}
            >
              ⚠ WARNING SENT
            </span>
          )}
        </div>

        {/* Session ID */}
        <div style={{ textAlign: "right" }}>
          <div style={{ ...microLabel, marginBottom: "5px" }}>
            SESSION ID
          </div>
          <code style={{ fontSize: "11px", color: colors.inkFaint, fontFamily: fonts.mono, letterSpacing: "0.06em" }}>
            {session.session_id}
          </code>
        </div>
      </div>

      {/* Row 3 — Stop / Cleanup status */}
      {!["completed", "failed", "stopped"].includes(session.status) && (
        <div>
          {stopError && (
            <div style={{ marginBottom: "8px", fontSize: "11px", color: colors.danger, fontFamily: fonts.mono }}>
              ✕ {stopError}
            </div>
          )}

          {
              restartError && (
                  <div
                      style={{
                          marginBottom: "8px",
                          fontSize: "11px",
                          color: colors.warning,
                          fontFamily: fonts.mono,
                      }}
                  >
                      ⚠ {restartError}
                  </div>
              )
          }

          {session.status === "cleaning" ? (
            <div style={{ fontSize: "10px", color: colors.inkDim, fontFamily: fonts.mono, textAlign: "center", letterSpacing: "0.13em" }}>
              CLEANING SAVES…
            </div>
          ) : (
            <div
                style={{
                    display: "flex",
                    gap: "10px",
                }}
            >
                <Button
                    variant="secondary"
                    onClick={handleRestart}
                    disabled={restartDisabled}
                    style={{
                        flex: 1,
                        minWidth: 0,
                        padding: "9px",
                        fontFamily: fonts.mono,
                        fontSize: "10px",
                        letterSpacing: "0.13em",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        borderColor: restartActive ? colors.warning : colors.border,
                        color: restartActive ? colors.warning : colors.inkFaint,
                    }}
                >
                  {restartButtonText}
                </Button>

                <Button
                    variant="danger"
                    onClick={handleStop}
                    disabled={stopDisabled}
                    style={{
                        flex: 1,
                        minWidth: 0,
                        padding: "9px",
                        fontFamily: fonts.mono,
                        fontSize: "10px",
                        letterSpacing: "0.13em",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {
                        stopping ||
                        session.status === "stopping"
                            ? "STOPPING..."
                            : "STOP SESSION"
                    }
                </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
